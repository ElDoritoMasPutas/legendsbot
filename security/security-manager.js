const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const config = require('../config/enhanced-config.js');
const Logger = require('../logging/enhanced-logger.js');

class SecurityManager {
    constructor(database, cache) {
        this.database = database;
        this.cache = cache;
        this.logger = new Logger('SecurityManager');
        this.initialized = false;
        
        this.securityEvents = new Map();
        this.ipWhitelist = new Set();
        this.ipBlacklist = new Set();
        this.suspiciousIPs = new Map();
        this.failedLogins = new Map();
        
        this.securityConfig = {
            maxFailedLogins: 5,
            lockoutDuration: 30 * 60 * 1000, // 30 minutes
            tokenExpiry: '24h',
            passwordMinLength: 8,
            requireStrongPassword: true,
            enableTwoFactor: false,
            sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
            maxSessionsPerUser: 5
        };
        
        this.stats = {
            securityEvents: 0,
            blockedIPs: 0,
            failedLogins: 0,
            successfulLogins: 0,
            tokensIssued: 0,
            tokensRevoked: 0
        };
        
        this.encryptionAlgorithm = 'aes-256-gcm';
        this.hashAlgorithm = 'sha256';
        this.saltRounds = 12;
    }

    async initialize() {
        try {
            this.logger.info('Initializing Security Manager...');
            
            // Load security configuration
            await this.loadSecurityConfig();
            
            // Load IP lists and security data
            await this.loadSecurityData();
            
            // Start security monitoring
            this.startSecurityMonitoring();
            
            // Setup cleanup processes
            this.setupCleanupProcesses();
            
            this.initialized = true;
            this.logger.info('Security Manager initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize Security Manager:', error);
            throw error;
        }
    }

    async validateDashboardToken(token) {
        try {
            if (!token) {
                throw new Error('No token provided');
            }
            
            // Check if token is blacklisted
            const isBlacklisted = await this.cache.sismember('blacklisted_tokens', token);
            if (isBlacklisted) {
                throw new Error('Token has been revoked');
            }
            
            // Verify JWT token
            const decoded = jwt.verify(token, config.security.jwt.secret);
            
            // Check if user exists and is active
            const user = await this.database.getUser(decoded.userId);
            if (!user || user.isBlacklisted) {
                throw new Error('User not found or is blacklisted');
            }
            
            // Update last activity
            await this.updateUserActivity(decoded.userId);
            
            return {
                id: decoded.userId,
                username: user.username,
                permissions: decoded.permissions || [],
                sessionId: decoded.sessionId
            };
            
        } catch (error) {
            this.logger.logSecurityEvent('TOKEN_VALIDATION_FAILED', 'medium', {
                token: token?.substring(0, 20) + '...',
                error: error.message
            });
            throw error;
        }
    }

    async generateAuthToken(userId, permissions = [], sessionData = {}) {
        try {
            const sessionId = crypto.randomUUID();
            const payload = {
                userId,
                permissions,
                sessionId,
                iat: Math.floor(Date.now() / 1000),
                iss: 'synthia-ai-premium'
            };
            
            const token = jwt.sign(payload, config.security.jwt.secret, {
                expiresIn: this.securityConfig.tokenExpiry,
                algorithm: config.security.jwt.algorithm
            });
            
            // Store session data
            await this.cache.createSession(sessionId, {
                userId,
                permissions,
                loginTime: Date.now(),
                lastActivity: Date.now(),
                ...sessionData
            }, this.securityConfig.sessionTimeout / 1000);
            
            // Track active sessions
            await this.trackUserSession(userId, sessionId);
            
            this.stats.tokensIssued++;
            
            this.logger.logSecurityEvent('TOKEN_ISSUED', 'info', {
                userId,
                sessionId,
                permissions
            });
            
            return {
                token,
                sessionId,
                expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
            };
            
        } catch (error) {
            this.logger.error('Failed to generate auth token:', error);
            throw error;
        }
    }

    async revokeToken(token, reason = 'Manual revocation') {
        try {
            // Add token to blacklist
            await this.cache.sadd('blacklisted_tokens', token);
            await this.cache.expire('blacklisted_tokens', 86400); // 24 hours
            
            // Try to decode token to get session info
            try {
                const decoded = jwt.decode(token);
                if (decoded && decoded.sessionId) {
                    await this.cache.destroySession(decoded.sessionId);
                    await this.removeUserSession(decoded.userId, decoded.sessionId);
                }
            } catch (decodeError) {
                this.logger.debug('Could not decode token for session cleanup:', decodeError);
            }
            
            this.stats.tokensRevoked++;
            
            this.logger.logSecurityEvent('TOKEN_REVOKED', 'info', {
                reason,
                token: token.substring(0, 20) + '...'
            });
            
        } catch (error) {
            this.logger.error('Failed to revoke token:', error);
            throw error;
        }
    }

    async hashPassword(password) {
        try {
            if (!this.validatePasswordStrength(password)) {
                throw new Error('Password does not meet security requirements');
            }
            
            return await bcrypt.hash(password, this.saltRounds);
            
        } catch (error) {
            this.logger.error('Password hashing failed:', error);
            throw error;
        }
    }

    async verifyPassword(password, hash) {
        try {
            return await bcrypt.compare(password, hash);
        } catch (error) {
            this.logger.error('Password verification failed:', error);
            return false;
        }
    }

    validatePasswordStrength(password) {
        if (!password || password.length < this.securityConfig.passwordMinLength) {
            return false;
        }
        
        if (this.securityConfig.requireStrongPassword) {
            // Must contain at least one uppercase, lowercase, number, and special character
            const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
            return strongPasswordRegex.test(password);
        }
        
        return true;
    }

    async encryptData(data, key = null) {
        try {
            const encryptionKey = key || config.security.encryption.key;
            if (!encryptionKey) {
                throw new Error('Encryption key not configured');
            }
            
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipher(this.encryptionAlgorithm, encryptionKey);
            cipher.setAAD(Buffer.from('synthia-ai'));
            
            let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            const authTag = cipher.getAuthTag();
            
            return {
                encrypted,
                iv: iv.toString('hex'),
                authTag: authTag.toString('hex')
            };
            
        } catch (error) {
            this.logger.error('Data encryption failed:', error);
            throw error;
        }
    }

    async decryptData(encryptedData, key = null) {
        try {
            const encryptionKey = key || config.security.encryption.key;
            if (!encryptionKey) {
                throw new Error('Encryption key not configured');
            }
            
            const { encrypted, iv, authTag } = encryptedData;
            const decipher = crypto.createDecipher(this.encryptionAlgorithm, encryptionKey);
            
            decipher.setAAD(Buffer.from('synthia-ai'));
            decipher.setAuthTag(Buffer.from(authTag, 'hex'));
            
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return JSON.parse(decrypted);
            
        } catch (error) {
            this.logger.error('Data decryption failed:', error);
            throw error;
        }
    }

    async screenNewMember(member) {
        try {
            const userId = member.id;
            const guildId = member.guild.id;
            
            const securityChecks = {
                accountAge: this.checkAccountAge(member.user),
                username: this.checkUsername(member.user.username),
                avatar: this.checkAvatar(member.user),
                joinPattern: await this.checkJoinPattern(guildId, userId),
                reputation: await this.checkUserReputation(userId)
            };
            
            let riskScore = 0;
            const flags = [];
            
            // Account age check
            if (securityChecks.accountAge.suspicious) {
                riskScore += 0.3;
                flags.push('New account');
            }
            
            // Username check
            if (securityChecks.username.suspicious) {
                riskScore += 0.2;
                flags.push('Suspicious username');
            }
            
            // Avatar check
            if (securityChecks.avatar.suspicious) {
                riskScore += 0.1;
                flags.push('Default/suspicious avatar');
            }
            
            // Join pattern check
            if (securityChecks.joinPattern.suspicious) {
                riskScore += 0.3;
                flags.push('Suspicious join pattern');
            }
            
            // Reputation check
            if (securityChecks.reputation.suspicious) {
                riskScore += 0.4;
                flags.push('Poor reputation');
            }
            
            const screening = {
                userId,
                guildId,
                riskScore,
                flags,
                checks: securityChecks,
                timestamp: Date.now(),
                action: riskScore > 0.7 ? 'block' : riskScore > 0.4 ? 'monitor' : 'allow'
            };
            
            // Log security event
            if (riskScore > 0.4) {
                this.logger.logSecurityEvent('SUSPICIOUS_MEMBER_JOIN', 'medium', screening);
                this.stats.securityEvents++;
            }
            
            // Store screening result
            await this.cache.set(`member_screening:${userId}:${guildId}`, screening, 3600);
            
            return screening;
            
        } catch (error) {
            this.logger.error('Member screening failed:', error);
            return { action: 'allow', error: error.message };
        }
    }

    checkAccountAge(user) {
        const accountAge = Date.now() - user.createdAt.getTime();
        const hoursOld = accountAge / (1000 * 60 * 60);
        
        return {
            ageHours: hoursOld,
            suspicious: hoursOld < 24, // Less than 24 hours old
            severity: hoursOld < 1 ? 'high' : hoursOld < 24 ? 'medium' : 'low'
        };
    }

    checkUsername(username) {
        const suspiciousPatterns = [
            /^[a-z]+\d{4,}$/i, // Random letters followed by many numbers
            /discord/i,         // Contains "discord"
            /admin|mod|bot/i,   // Impersonation attempts
            /[^\w\s-_.]/g,      // Contains unusual characters
            /^.{1,2}$/,         // Very short usernames
            /(.)\1{3,}/g        // Repeated characters
        ];
        
        let suspicious = false;
        const flags = [];
        
        for (const pattern of suspiciousPatterns) {
            if (pattern.test(username)) {
                suspicious = true;
                flags.push(pattern.source);
            }
        }
        
        return {
            suspicious,
            flags,
            length: username.length
        };
    }

    checkAvatar(user) {
        return {
            hasAvatar: !!user.avatar,
            suspicious: !user.avatar, // Default avatar is somewhat suspicious
            avatarHash: user.avatar
        };
    }

    async checkJoinPattern(guildId, userId) {
        try {
            // Check recent joins to detect coordinated attacks
            const recentJoins = await this.cache.lrange(`recent_joins:${guildId}`, 0, 50);
            const now = Date.now();
            const oneHourAgo = now - 3600000;
            
            // Filter joins from the last hour
            const recentJoinData = recentJoins
                .map(join => JSON.parse(join))
                .filter(join => join.timestamp > oneHourAgo);
            
            // Add current join
            await this.cache.lpush(`recent_joins:${guildId}`, JSON.stringify({
                userId,
                timestamp: now
            }));
            
            // Keep only last 100 joins
            await this.cache.ltrim(`recent_joins:${guildId}`, 0, 99);
            
            const hourlyJoinCount = recentJoinData.length;
            
            return {
                hourlyJoins: hourlyJoinCount,
                suspicious: hourlyJoinCount > 10, // More than 10 joins per hour
                severity: hourlyJoinCount > 20 ? 'high' : hourlyJoinCount > 10 ? 'medium' : 'low'
            };
            
        } catch (error) {
            this.logger.error('Join pattern check failed:', error);
            return { suspicious: false, error: error.message };
        }
    }

    async checkUserReputation(userId) {
        try {
            // Check user's reputation across the platform
            const userData = await this.cache.getUserProfile(userId);
            
            if (!userData) {
                return { suspicious: false, reason: 'No data available' };
            }
            
            const reputation = userData.reputation || 0;
            const violations = userData.violations || [];
            const recentViolations = violations.filter(v => 
                Date.now() - v.timestamp < 7 * 24 * 60 * 60 * 1000 // Last 7 days
            );
            
            return {
                reputation,
                totalViolations: violations.length,
                recentViolations: recentViolations.length,
                suspicious: reputation < -10 || recentViolations.length > 3,
                severity: reputation < -50 ? 'high' : reputation < -10 ? 'medium' : 'low'
            };
            
        } catch (error) {
            this.logger.error('Reputation check failed:', error);
            return { suspicious: false, error: error.message };
        }
    }

    async trackFailedLogin(identifier, ip = null) {
        try {
            const key = `failed_logins:${identifier}`;
            const attempts = await this.cache.increment(key, 1);
            
            if (attempts === 1) {
                await this.cache.expire(key, this.securityConfig.lockoutDuration / 1000);
            }
            
            this.stats.failedLogins++;
            
            if (attempts >= this.securityConfig.maxFailedLogins) {
                await this.lockAccount(identifier, 'Too many failed login attempts');
                
                if (ip) {
                    await this.flagSuspiciousIP(ip, 'Multiple failed logins');
                }
            }
            
            this.logger.logSecurityEvent('FAILED_LOGIN', 'medium', {
                identifier,
                ip,
                attempts,
                locked: attempts >= this.securityConfig.maxFailedLogins
            });
            
            return { attempts, locked: attempts >= this.securityConfig.maxFailedLogins };
            
        } catch (error) {
            this.logger.error('Failed to track login attempt:', error);
        }
    }

    async clearFailedLogins(identifier) {
        try {
            await this.cache.del(`failed_logins:${identifier}`);
        } catch (error) {
            this.logger.error('Failed to clear login attempts:', error);
        }
    }

    async lockAccount(identifier, reason) {
        try {
            const lockKey = `locked_account:${identifier}`;
            await this.cache.set(lockKey, reason, this.securityConfig.lockoutDuration / 1000);
            
            this.logger.logSecurityEvent('ACCOUNT_LOCKED', 'high', {
                identifier,
                reason,
                duration: this.securityConfig.lockoutDuration
            });
            
        } catch (error) {
            this.logger.error('Failed to lock account:', error);
        }
    }

    async isAccountLocked(identifier) {
        try {
            const lockReason = await this.cache.get(`locked_account:${identifier}`);
            return !!lockReason;
        } catch (error) {
            this.logger.error('Failed to check account lock status:', error);
            return false;
        }
    }

    async flagSuspiciousIP(ip, reason) {
        try {
            const flagKey = `suspicious_ip:${ip}`;
            const flags = await this.cache.get(flagKey) || [];
            
            flags.push({
                reason,
                timestamp: Date.now()
            });
            
            await this.cache.set(flagKey, flags, 86400); // 24 hours
            
            // Auto-block if too many flags
            if (flags.length >= 5) {
                await this.blockIP(ip, 'Automatic block due to suspicious activity');
            }
            
            this.logger.logSecurityEvent('SUSPICIOUS_IP_FLAGGED', 'medium', {
                ip,
                reason,
                totalFlags: flags.length
            });
            
        } catch (error) {
            this.logger.error('Failed to flag suspicious IP:', error);
        }
    }

    async blockIP(ip, reason, duration = 86400) {
        try {
            this.ipBlacklist.add(ip);
            await this.cache.sadd('blocked_ips', ip);
            await this.cache.set(`blocked_ip:${ip}`, reason, duration);
            
            this.stats.blockedIPs++;
            
            this.logger.logSecurityEvent('IP_BLOCKED', 'high', {
                ip,
                reason,
                duration
            });
            
        } catch (error) {
            this.logger.error('Failed to block IP:', error);
        }
    }

    async unblockIP(ip, reason = 'Manual unblock') {
        try {
            this.ipBlacklist.delete(ip);
            await this.cache.srem('blocked_ips', ip);
            await this.cache.del(`blocked_ip:${ip}`);
            
            this.logger.logSecurityEvent('IP_UNBLOCKED', 'info', { ip, reason });
            
        } catch (error) {
            this.logger.error('Failed to unblock IP:', error);
        }
    }

    isIPBlocked(ip) {
        return this.ipBlacklist.has(ip);
    }

    async trackUserSession(userId, sessionId) {
        try {
            const sessionsKey = `user_sessions:${userId}`;
            await this.cache.sadd(sessionsKey, sessionId);
            
            // Limit sessions per user
            const sessions = await this.cache.smembers(sessionsKey);
            if (sessions.length > this.securityConfig.maxSessionsPerUser) {
                // Remove oldest sessions
                const oldestSessions = sessions.slice(0, sessions.length - this.securityConfig.maxSessionsPerUser);
                for (const oldSession of oldestSessions) {
                    await this.cache.destroySession(oldSession);
                    await this.cache.srem(sessionsKey, oldSession);
                }
            }
            
        } catch (error) {
            this.logger.error('Failed to track user session:', error);
        }
    }

    async removeUserSession(userId, sessionId) {
        try {
            await this.cache.srem(`user_sessions:${userId}`, sessionId);
        } catch (error) {
            this.logger.error('Failed to remove user session:', error);
        }
    }

    async updateUserActivity(userId) {
        try {
            const activityKey = `user_activity:${userId}`;
            await this.cache.set(activityKey, Date.now(), 3600); // 1 hour TTL
        } catch (error) {
            this.logger.error('Failed to update user activity:', error);
        }
    }

    async loadSecurityConfig() {
        try {
            // Load custom security configuration from cache/database
            const cachedConfig = await this.cache.get('security_config');
            if (cachedConfig) {
                Object.assign(this.securityConfig, cachedConfig);
            }
            
            this.logger.debug('Security configuration loaded');
        } catch (error) {
            this.logger.error('Failed to load security config:', error);
        }
    }

    async loadSecurityData() {
        try {
            // Load IP blacklist
            const blockedIPs = await this.cache.smembers('blocked_ips');
            for (const ip of blockedIPs) {
                this.ipBlacklist.add(ip);
            }
            
            this.logger.info(`Loaded ${blockedIPs.length} blocked IPs`);
            
        } catch (error) {
            this.logger.error('Failed to load security data:', error);
        }
    }

    startSecurityMonitoring() {
        // Monitor security events every 5 minutes
        setInterval(() => {
            this.analyzeSecurityEvents();
        }, 300000);
    }

    async analyzeSecurityEvents() {
        try {
            // Analyze recent security events for patterns
            const now = Date.now();
            const oneHourAgo = now - 3600000;
            
            // This could implement more sophisticated analysis
            // For now, just log basic statistics
            
        } catch (error) {
            this.logger.error('Security event analysis failed:', error);
        }
    }

    setupCleanupProcesses() {
        // Clean up expired security data every hour
        setInterval(async () => {
            try {
                // Clean up expired blocked IPs
                const blockedIPs = await this.cache.smembers('blocked_ips');
                for (const ip of blockedIPs) {
                    const blockInfo = await this.cache.get(`blocked_ip:${ip}`);
                    if (!blockInfo) {
                        this.ipBlacklist.delete(ip);
                        await this.cache.srem('blocked_ips', ip);
                    }
                }
                
                // Clean up old security events
                // Implementation depends on storage method
                
            } catch (error) {
                this.logger.error('Security cleanup failed:', error);
            }
        }, 3600000); // 1 hour
    }

    generateSecureToken(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    hashData(data) {
        return crypto.createHash(this.hashAlgorithm).update(data).digest('hex');
    }

    getStats() {
        return {
            ...this.stats,
            blockedIPs: this.ipBlacklist.size,
            whitelistedIPs: this.ipWhitelist.size,
            suspiciousIPs: this.suspiciousIPs.size,
            config: this.securityConfig,
            initialized: this.initialized
        };
    }

    isInitialized() {
        return this.initialized;
    }
}

module.exports = SecurityManager;