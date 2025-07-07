const config = require('../config/enhanced-config.js');
const Logger = require('../logging/enhanced-logger.js');

class RateLimiter {
    constructor(cache) {
        this.cache = cache;
        this.logger = new Logger('RateLimiter');
        this.initialized = false;
        
        this.limits = new Map();
        this.defaultLimits = {
            // Global limits
            global: {
                requests: 1000,
                window: 60000, // 1 minute
                burst: 50
            },
            
            // Per-user limits
            user: {
                commands: 30,
                messages: 60,
                window: 60000 // 1 minute
            },
            
            // Per-guild limits
            guild: {
                commands: 200,
                messages: 1000,
                window: 60000 // 1 minute
            },
            
            // API limits
            api: {
                requests: 100,
                window: 60000, // 1 minute
                burst: 20
            },
            
            // Dashboard limits
            dashboard: {
                requests: 200,
                window: 60000, // 1 minute
                burst: 30
            },
            
            // Translation limits
            translation: {
                requests: 50,
                window: 60000, // 1 minute
                burst: 10
            },
            
            // AI requests
            ai: {
                requests: 20,
                window: 60000, // 1 minute
                burst: 5
            }
        };
        
        this.stats = {
            totalRequests: 0,
            blockedRequests: 0,
            bypassedRequests: 0,
            activeUsers: 0,
            activeIPs: 0
        };
        
        this.exemptUsers = new Set();
        this.exemptIPs = new Set();
        this.customLimits = new Map();
        
        this.algorithms = {
            'token_bucket': this.tokenBucket.bind(this),
            'sliding_window': this.slidingWindow.bind(this),
            'fixed_window': this.fixedWindow.bind(this),
            'leaky_bucket': this.leakyBucket.bind(this)
        };
        
        this.defaultAlgorithm = 'sliding_window';
    }

    async initialize() {
        try {
            this.logger.info('Initializing Rate Limiter...');
            
            // Load custom limits from configuration
            await this.loadCustomLimits();
            
            // Load exempt users and IPs
            await this.loadExemptions();
            
            // Setup cleanup processes
            this.setupCleanupProcesses();
            
            this.initialized = true;
            this.logger.info('Rate Limiter initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize Rate Limiter:', error);
            throw error;
        }
    }

    async isRateLimited(identifier, type = 'global', customLimit = null) {
        try {
            this.stats.totalRequests++;
            
            // Check if identifier is exempt
            if (this.isExempt(identifier, type)) {
                this.stats.bypassedRequests++;
                return {
                    allowed: true,
                    remaining: Infinity,
                    resetTime: 0,
                    reason: 'exempt'
                };
            }
            
            // Get rate limit configuration
            const limit = customLimit || this.getLimit(type);
            if (!limit) {
                return { allowed: true, remaining: Infinity, resetTime: 0 };
            }
            
            // Use specified algorithm or default
            const algorithm = limit.algorithm || this.defaultAlgorithm;
            const checkResult = await this.algorithms[algorithm](identifier, type, limit);
            
            if (!checkResult.allowed) {
                this.stats.blockedRequests++;
                this.logger.logRateLimit(identifier, type, limit);
            }
            
            return checkResult;
            
        } catch (error) {
            this.logger.error('Rate limit check failed:', error);
            // Fail open - allow request if check fails
            return { allowed: true, remaining: 0, resetTime: 0, error: error.message };
        }
    }

    async slidingWindow(identifier, type, limit) {
        const window = limit.window || 60000;
        const maxRequests = limit.requests || 100;
        const now = Date.now();
        const windowStart = now - window;
        
        const key = `rate_limit:${type}:${identifier}`;
        
        try {
            // Get current request timestamps
            const requests = await this.cache.lrange(key, 0, -1);
            const validRequests = requests
                .map(r => parseInt(r))
                .filter(timestamp => timestamp > windowStart);
            
            // Add current request
            validRequests.push(now);
            
            // Check if limit exceeded
            if (validRequests.length > maxRequests) {
                const resetTime = Math.ceil((validRequests[validRequests.length - maxRequests] + window - now) / 1000);
                return {
                    allowed: false,
                    remaining: 0,
                    resetTime,
                    retryAfter: resetTime
                };
            }
            
            // Update cache
            await this.cache.del(key);
            if (validRequests.length > 0) {
                await this.cache.rpush(key, ...validRequests.map(r => r.toString()));
                await this.cache.expire(key, Math.ceil(window / 1000));
            }
            
            return {
                allowed: true,
                remaining: Math.max(0, maxRequests - validRequests.length),
                resetTime: Math.ceil(window / 1000),
                total: maxRequests
            };
            
        } catch (error) {
            this.logger.error('Sliding window check failed:', error);
            return { allowed: true, remaining: 0, resetTime: 0, error: error.message };
        }
    }

    async fixedWindow(identifier, type, limit) {
        const window = limit.window || 60000;
        const maxRequests = limit.requests || 100;
        const now = Date.now();
        const windowStart = Math.floor(now / window) * window;
        
        const key = `rate_limit:fixed:${type}:${identifier}:${windowStart}`;
        
        try {
            const current = await this.cache.increment(key, 1);
            
            if (current === 1) {
                await this.cache.expire(key, Math.ceil(window / 1000));
            }
            
            if (current > maxRequests) {
                const resetTime = Math.ceil((windowStart + window - now) / 1000);
                return {
                    allowed: false,
                    remaining: 0,
                    resetTime,
                    retryAfter: resetTime
                };
            }
            
            return {
                allowed: true,
                remaining: Math.max(0, maxRequests - current),
                resetTime: Math.ceil((windowStart + window - now) / 1000),
                total: maxRequests
            };
            
        } catch (error) {
            this.logger.error('Fixed window check failed:', error);
            return { allowed: true, remaining: 0, resetTime: 0, error: error.message };
        }
    }

    async tokenBucket(identifier, type, limit) {
        const capacity = limit.requests || 100;
        const refillRate = limit.refillRate || Math.ceil(capacity / (limit.window / 1000));
        const now = Date.now();
        
        const key = `rate_limit:bucket:${type}:${identifier}`;
        
        try {
            const bucketData = await this.cache.get(key) || {
                tokens: capacity,
                lastRefill: now
            };
            
            // Calculate tokens to add based on time elapsed
            const timeDelta = now - bucketData.lastRefill;
            const tokensToAdd = Math.floor((timeDelta / 1000) * refillRate);
            
            bucketData.tokens = Math.min(capacity, bucketData.tokens + tokensToAdd);
            bucketData.lastRefill = now;
            
            if (bucketData.tokens < 1) {
                const refillTime = Math.ceil((1 - bucketData.tokens) / refillRate);
                return {
                    allowed: false,
                    remaining: 0,
                    resetTime: refillTime,
                    retryAfter: refillTime
                };
            }
            
            bucketData.tokens -= 1;
            
            // Update cache
            await this.cache.set(key, bucketData, Math.ceil(limit.window / 1000));
            
            return {
                allowed: true,
                remaining: Math.floor(bucketData.tokens),
                resetTime: Math.ceil(capacity / refillRate),
                total: capacity
            };
            
        } catch (error) {
            this.logger.error('Token bucket check failed:', error);
            return { allowed: true, remaining: 0, resetTime: 0, error: error.message };
        }
    }

    async leakyBucket(identifier, type, limit) {
        const capacity = limit.requests || 100;
        const leakRate = limit.leakRate || Math.ceil(capacity / (limit.window / 1000));
        const now = Date.now();
        
        const key = `rate_limit:leaky:${type}:${identifier}`;
        
        try {
            const bucketData = await this.cache.get(key) || {
                level: 0,
                lastLeak: now
            };
            
            // Calculate how much has leaked since last check
            const timeDelta = now - bucketData.lastLeak;
            const leaked = Math.floor((timeDelta / 1000) * leakRate);
            
            bucketData.level = Math.max(0, bucketData.level - leaked);
            bucketData.lastLeak = now;
            
            if (bucketData.level >= capacity) {
                const drainTime = Math.ceil((bucketData.level - capacity + 1) / leakRate);
                return {
                    allowed: false,
                    remaining: 0,
                    resetTime: drainTime,
                    retryAfter: drainTime
                };
            }
            
            bucketData.level += 1;
            
            // Update cache
            await this.cache.set(key, bucketData, Math.ceil(capacity / leakRate));
            
            return {
                allowed: true,
                remaining: Math.max(0, capacity - bucketData.level),
                resetTime: Math.ceil(bucketData.level / leakRate),
                total: capacity
            };
            
        } catch (error) {
            this.logger.error('Leaky bucket check failed:', error);
            return { allowed: true, remaining: 0, resetTime: 0, error: error.message };
        }
    }

    getLimit(type) {
        // Check for custom limit first
        if (this.customLimits.has(type)) {
            return this.customLimits.get(type);
        }
        
        // Check for default limit
        if (this.defaultLimits[type]) {
            return this.defaultLimits[type];
        }
        
        // Return global default
        return this.defaultLimits.global;
    }

    setCustomLimit(type, limit) {
        this.customLimits.set(type, limit);
        this.logger.info(`Custom rate limit set for ${type}:`, limit);
    }

    removeCustomLimit(type) {
        this.customLimits.delete(type);
        this.logger.info(`Custom rate limit removed for ${type}`);
    }

    isExempt(identifier, type) {
        // Check user exemptions
        if (type.includes('user') && this.exemptUsers.has(identifier)) {
            return true;
        }
        
        // Check IP exemptions
        if (type.includes('ip') && this.exemptIPs.has(identifier)) {
            return true;
        }
        
        // Check for admin/moderator exemptions
        // This would integrate with permission system
        
        return false;
    }

    addExemptUser(userId) {
        this.exemptUsers.add(userId);
        this.logger.info(`User ${userId} added to rate limit exemptions`);
    }

    removeExemptUser(userId) {
        this.exemptUsers.delete(userId);
        this.logger.info(`User ${userId} removed from rate limit exemptions`);
    }

    addExemptIP(ip) {
        this.exemptIPs.add(ip);
        this.logger.info(`IP ${ip} added to rate limit exemptions`);
    }

    removeExemptIP(ip) {
        this.exemptIPs.delete(ip);
        this.logger.info(`IP ${ip} removed from rate limit exemptions`);
    }

    async clearUserLimits(identifier) {
        try {
            const keys = await this.cache.getKeys(`rate_limit:*:${identifier}*`);
            if (keys.length > 0) {
                for (const key of keys) {
                    await this.cache.del(key);
                }
                this.logger.info(`Cleared ${keys.length} rate limits for ${identifier}`);
            }
        } catch (error) {
            this.logger.error(`Failed to clear rate limits for ${identifier}:`, error);
        }
    }

    async clearAllLimits() {
        try {
            const keys = await this.cache.getKeys('rate_limit:*');
            if (keys.length > 0) {
                for (const key of keys) {
                    await this.cache.del(key);
                }
                this.logger.info(`Cleared all ${keys.length} rate limits`);
            }
        } catch (error) {
            this.logger.error('Failed to clear all rate limits:', error);
        }
    }

    async getRateLimitStatus(identifier, type) {
        try {
            const limit = this.getLimit(type);
            const key = `rate_limit:${type}:${identifier}`;
            
            // This is a simplified status check
            const data = await this.cache.get(key);
            if (!data) {
                return {
                    limited: false,
                    remaining: limit.requests,
                    resetTime: 0
                };
            }
            
            // Implementation would depend on the algorithm used
            return {
                limited: false,
                remaining: limit.requests,
                resetTime: 0,
                data
            };
            
        } catch (error) {
            this.logger.error(`Failed to get rate limit status for ${identifier}:`, error);
            return { error: error.message };
        }
    }

    async loadCustomLimits() {
        try {
            const cachedLimits = await this.cache.get('custom_rate_limits');
            if (cachedLimits) {
                for (const [type, limit] of Object.entries(cachedLimits)) {
                    this.customLimits.set(type, limit);
                }
                this.logger.info(`Loaded ${this.customLimits.size} custom rate limits`);
            }
        } catch (error) {
            this.logger.error('Failed to load custom limits:', error);
        }
    }

    async saveCustomLimits() {
        try {
            const limitsObj = Object.fromEntries(this.customLimits);
            await this.cache.set('custom_rate_limits', limitsObj, 0); // No expiration
        } catch (error) {
            this.logger.error('Failed to save custom limits:', error);
        }
    }

    async loadExemptions() {
        try {
            // Load exempt users
            const exemptUsers = await this.cache.smembers('rate_limit_exempt_users');
            for (const userId of exemptUsers) {
                this.exemptUsers.add(userId);
            }
            
            // Load exempt IPs
            const exemptIPs = await this.cache.smembers('rate_limit_exempt_ips');
            for (const ip of exemptIPs) {
                this.exemptIPs.add(ip);
            }
            
            this.logger.info(`Loaded ${this.exemptUsers.size} exempt users and ${this.exemptIPs.size} exempt IPs`);
            
        } catch (error) {
            this.logger.error('Failed to load exemptions:', error);
        }
    }

    async saveExemptions() {
        try {
            // Save exempt users
            if (this.exemptUsers.size > 0) {
                await this.cache.del('rate_limit_exempt_users');
                await this.cache.sadd('rate_limit_exempt_users', ...Array.from(this.exemptUsers));
            }
            
            // Save exempt IPs
            if (this.exemptIPs.size > 0) {
                await this.cache.del('rate_limit_exempt_ips');
                await this.cache.sadd('rate_limit_exempt_ips', ...Array.from(this.exemptIPs));
            }
            
        } catch (error) {
            this.logger.error('Failed to save exemptions:', error);
        }
    }

    setupCleanupProcesses() {
        // Clean up expired rate limit data every 5 minutes
        setInterval(async () => {
            try {
                // This would clean up expired rate limit entries
                // The specific implementation depends on the storage method
                this.logger.debug('Running rate limit cleanup...');
                
            } catch (error) {
                this.logger.error('Rate limit cleanup failed:', error);
            }
        }, 300000); // 5 minutes
        
        // Save custom limits and exemptions every hour
        setInterval(async () => {
            await this.saveCustomLimits();
            await this.saveExemptions();
        }, 3600000); // 1 hour
    }

    async getGlobalStats() {
        try {
            // Get stats for active rate limits
            const keys = await this.cache.getKeys('rate_limit:*');
            const activeUsers = new Set();
            const activeIPs = new Set();
            
            for (const key of keys) {
                const parts = key.split(':');
                if (parts.length >= 3) {
                    const identifier = parts[2];
                    if (identifier.match(/^\d+$/)) {
                        activeUsers.add(identifier);
                    } else if (identifier.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
                        activeIPs.add(identifier);
                    }
                }
            }
            
            this.stats.activeUsers = activeUsers.size;
            this.stats.activeIPs = activeIPs.size;
            
            return {
                ...this.stats,
                customLimits: this.customLimits.size,
                exemptUsers: this.exemptUsers.size,
                exemptIPs: this.exemptIPs.size,
                activeRateLimits: keys.length
            };
            
        } catch (error) {
            this.logger.error('Failed to get global stats:', error);
            return this.stats;
        }
    }

    // Express.js middleware factory
    createExpressMiddleware(type = 'api', options = {}) {
        return async (req, res, next) => {
            try {
                const identifier = options.keyGenerator ? 
                    options.keyGenerator(req) : 
                    req.ip || req.connection.remoteAddress;
                
                const result = await this.isRateLimited(identifier, type);
                
                // Set rate limit headers
                res.set({
                    'X-RateLimit-Limit': result.total || 0,
                    'X-RateLimit-Remaining': result.remaining || 0,
                    'X-RateLimit-Reset': new Date(Date.now() + (result.resetTime * 1000)).toISOString()
                });
                
                if (!result.allowed) {
                    if (result.retryAfter) {
                        res.set('Retry-After', result.retryAfter);
                    }
                    
                    return res.status(429).json({
                        error: 'Too Many Requests',
                        message: 'Rate limit exceeded',
                        retryAfter: result.retryAfter
                    });
                }
                
                next();
                
            } catch (error) {
                this.logger.error('Rate limit middleware error:', error);
                next(); // Fail open
            }
        };
    }

    getStats() {
        return {
            ...this.stats,
            customLimits: this.customLimits.size,
            exemptUsers: this.exemptUsers.size,
            exemptIPs: this.exemptIPs.size,
            defaultLimits: Object.keys(this.defaultLimits).length,
            algorithms: Object.keys(this.algorithms).length,
            initialized: this.initialized
        };
    }

    isInitialized() {
        return this.initialized;
    }
}

module.exports = RateLimiter;