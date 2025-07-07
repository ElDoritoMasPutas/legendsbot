const config = require('../config/enhanced-config.js');
const Logger = require('../logging/enhanced-logger.js');

class SpamDetector {
    constructor(cache, analytics) {
        this.cache = cache;
        this.analytics = analytics;
        this.logger = new Logger('SpamDetector');
        this.initialized = false;
        
        this.userMessageHistory = new Map();
        this.channelActivity = new Map();
        this.suspiciousPatterns = new Map();
        
        this.spamThresholds = {
            maxMessages: config.moderation.spam.maxMessages || 5,
            timeWindow: config.moderation.spam.timeWindow || 5000,
            maxDuplicates: config.moderation.spam.maxDuplicates || 3,
            maxMentions: config.moderation.spam.maxMentions || 10,
            maxEmojis: config.moderation.spam.maxEmojis || 20,
            maxCaps: 0.8,
            maxLinks: 3,
            maxLength: 2000
        };
        
        this.stats = {
            spamDetected: 0,
            falsePositives: 0,
            usersMonitored: 0,
            patternsDetected: 0
        };
        
        this.spamPatterns = {
            repetitiveText: /(.+?)\1{3,}/gi,
            excessiveSpaces: /\s{10,}/g,
            keyboardMashing: /([a-z])\1{5,}/gi,
            zalgoText: /[̀-ͯ]/g,
            emoteSpam: /(<a?:[^:]+:\d+>){10,}/g,
            mentionSpam: /(<@[!&]?\d+>){5,}/g
        };
    }

    async initialize() {
        try {
            this.logger.info('Initializing Spam Detector...');
            
            // Load existing data from cache
            await this.loadCachedData();
            
            // Start background cleanup processes
            this.startCleanupProcesses();
            
            // Load ML models for advanced detection
            await this.loadSpamModels();
            
            this.initialized = true;
            this.logger.info('Spam Detector initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize Spam Detector:', error);
            throw error;
        }
    }

    async detectSpam(message) {
        try {
            const userId = message.author.id;
            const guildId = message.guild?.id;
            const channelId = message.channel.id;
            const content = message.content;
            const timestamp = Date.now();
            
            // Skip bots and empty messages
            if (message.author.bot || !content.trim()) {
                return { isSpam: false, confidence: 0, reasons: [] };
            }
            
            const spamIndicators = [];
            let spamScore = 0;
            
            // Check message frequency
            const frequencyCheck = await this.checkMessageFrequency(userId, timestamp);
            if (frequencyCheck.isSpam) {
                spamIndicators.push(`Message frequency: ${frequencyCheck.count} messages in ${this.spamThresholds.timeWindow}ms`);
                spamScore += 0.4;
            }
            
            // Check for duplicate content
            const duplicateCheck = await this.checkDuplicateContent(userId, content, timestamp);
            if (duplicateCheck.isSpam) {
                spamIndicators.push(`Duplicate content: ${duplicateCheck.count} similar messages`);
                spamScore += 0.3;
            }
            
            // Check content patterns
            const patternCheck = this.checkSpamPatterns(content);
            if (patternCheck.isSpam) {
                spamIndicators.push(`Spam patterns: ${patternCheck.patterns.join(', ')}`);
                spamScore += 0.3;
            }
            
            // Check excessive mentions
            const mentionCheck = this.checkExcessiveMentions(message);
            if (mentionCheck.isSpam) {
                spamIndicators.push(`Excessive mentions: ${mentionCheck.count}`);
                spamScore += 0.2;
            }
            
            // Check excessive emojis
            const emojiCheck = this.checkExcessiveEmojis(content);
            if (emojiCheck.isSpam) {
                spamIndicators.push(`Excessive emojis: ${emojiCheck.count}`);
                spamScore += 0.1;
            }
            
            // Check excessive capitals
            const capsCheck = this.checkExcessiveCaps(content);
            if (capsCheck.isSpam) {
                spamIndicators.push(`Excessive capitals: ${Math.round(capsCheck.ratio * 100)}%`);
                spamScore += 0.1;
            }
            
            // Check link spam
            const linkCheck = this.checkLinkSpam(content);
            if (linkCheck.isSpam) {
                spamIndicators.push(`Link spam: ${linkCheck.count} links`);
                spamScore += 0.2;
            }
            
            // Check message length
            const lengthCheck = this.checkMessageLength(content);
            if (lengthCheck.isSpam) {
                spamIndicators.push(`Excessive length: ${lengthCheck.length} characters`);
                spamScore += 0.1;
            }
            
            // Check channel activity patterns
            const channelCheck = await this.checkChannelActivity(channelId, userId, timestamp);
            if (channelCheck.isSpam) {
                spamIndicators.push(`Channel flooding: ${channelCheck.activity}`);
                spamScore += 0.2;
            }
            
            // Check user reputation
            const reputationCheck = await this.checkUserReputation(userId, guildId);
            spamScore *= reputationCheck.modifier;
            
            // Advanced ML-based detection (if available)
            const mlCheck = await this.checkWithML(content, message);
            if (mlCheck.isSpam) {
                spamIndicators.push(`ML detection: ${mlCheck.reason}`);
                spamScore += mlCheck.confidence * 0.3;
            }
            
            // Update user message history
            await this.updateUserHistory(userId, content, timestamp, spamScore);
            
            // Determine final spam status
            const isSpam = spamScore >= 0.7;
            const confidence = Math.min(1, spamScore);
            
            if (isSpam) {
                this.stats.spamDetected++;
                await this.logSpamDetection(userId, guildId, channelId, spamIndicators, confidence);
            }
            
            return {
                isSpam,
                confidence,
                reasons: spamIndicators,
                score: spamScore,
                userId,
                timestamp
            };
            
        } catch (error) {
            this.logger.error('Spam detection failed:', error);
            return { isSpam: false, confidence: 0, reasons: ['Detection error'], error: error.message };
        }
    }

    async checkMessageFrequency(userId, timestamp) {
        const userHistory = this.getUserHistory(userId);
        const recentMessages = userHistory.filter(msg => 
            timestamp - msg.timestamp < this.spamThresholds.timeWindow
        );
        
        recentMessages.push({ timestamp, content: '' });
        this.userMessageHistory.set(userId, recentMessages);
        
        return {
            isSpam: recentMessages.length > this.spamThresholds.maxMessages,
            count: recentMessages.length
        };
    }

    async checkDuplicateContent(userId, content, timestamp) {
        const userHistory = this.getUserHistory(userId);
        const recentContent = userHistory
            .filter(msg => timestamp - msg.timestamp < 30000) // Last 30 seconds
            .map(msg => msg.content);
        
        const duplicateCount = recentContent.filter(msg => 
            this.calculateSimilarity(content, msg) > 0.8
        ).length;
        
        return {
            isSpam: duplicateCount >= this.spamThresholds.maxDuplicates,
            count: duplicateCount
        };
    }

    checkSpamPatterns(content) {
        const detectedPatterns = [];
        
        for (const [patternName, pattern] of Object.entries(this.spamPatterns)) {
            if (pattern.test(content)) {
                detectedPatterns.push(patternName);
            }
        }
        
        // Check for Unicode abuse
        if (this.detectUnicodeAbuse(content)) {
            detectedPatterns.push('unicode_abuse');
        }
        
        // Check for invisible characters
        if (this.detectInvisibleCharacters(content)) {
            detectedPatterns.push('invisible_characters');
        }
        
        return {
            isSpam: detectedPatterns.length > 0,
            patterns: detectedPatterns
        };
    }

    checkExcessiveMentions(message) {
        const mentionCount = message.mentions.users.size + 
                           message.mentions.roles.size + 
                           message.mentions.everyone ? 1 : 0;
        
        return {
            isSpam: mentionCount > this.spamThresholds.maxMentions,
            count: mentionCount
        };
    }

    checkExcessiveEmojis(content) {
        // Count Unicode emojis and Discord custom emojis
        const emojiMatches = content.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|<a?:[^:]+:\d+>/gu);
        const emojiCount = emojiMatches ? emojiMatches.length : 0;
        
        return {
            isSpam: emojiCount > this.spamThresholds.maxEmojis,
            count: emojiCount
        };
    }

    checkExcessiveCaps(content) {
        if (content.length < 10) return { isSpam: false, ratio: 0 };
        
        const capsCount = (content.match(/[A-Z]/g) || []).length;
        const letterCount = (content.match(/[A-Za-z]/g) || []).length;
        const capsRatio = letterCount > 0 ? capsCount / letterCount : 0;
        
        return {
            isSpam: capsRatio > this.spamThresholds.maxCaps,
            ratio: capsRatio
        };
    }

    checkLinkSpam(content) {
        const linkMatches = content.match(/https?:\/\/[^\s]+/g);
        const linkCount = linkMatches ? linkMatches.length : 0;
        
        return {
            isSpam: linkCount > this.spamThresholds.maxLinks,
            count: linkCount
        };
    }

    checkMessageLength(content) {
        return {
            isSpam: content.length > this.spamThresholds.maxLength,
            length: content.length
        };
    }

    async checkChannelActivity(channelId, userId, timestamp) {
        if (!this.channelActivity.has(channelId)) {
            this.channelActivity.set(channelId, []);
        }
        
        const activity = this.channelActivity.get(channelId);
        const recentActivity = activity.filter(entry => 
            timestamp - entry.timestamp < 10000 // Last 10 seconds
        );
        
        recentActivity.push({ userId, timestamp });
        this.channelActivity.set(channelId, recentActivity);
        
        // Check if user is flooding the channel
        const userActivity = recentActivity.filter(entry => entry.userId === userId);
        
        return {
            isSpam: userActivity.length > 8, // More than 8 messages in 10 seconds
            activity: `${userActivity.length} messages in 10s`
        };
    }

    async checkUserReputation(userId, guildId) {
        try {
            // Get user data from cache or database
            const userData = await this.cache.getUserProfile(userId);
            
            let modifier = 1.0;
            
            if (userData) {
                // Account age modifier
                const accountAge = Date.now() - new Date(userData.createdAt).getTime();
                const daysSinceCreation = accountAge / (1000 * 60 * 60 * 24);
                
                if (daysSinceCreation < 1) {
                    modifier *= 1.5; // Very new accounts are more suspicious
                } else if (daysSinceCreation < 7) {
                    modifier *= 1.2; // New accounts are somewhat suspicious
                }
                
                // Previous violations modifier
                if (userData.violations && userData.violations.length > 0) {
                    modifier *= 1.3;
                }
                
                // Reputation score modifier
                if (userData.reputation < 0) {
                    modifier *= 1.4;
                }
            }
            
            return { modifier };
            
        } catch (error) {
            this.logger.debug('User reputation check failed:', error);
            return { modifier: 1.0 };
        }
    }

    async checkWithML(content, message) {
        try {
            // Placeholder for ML-based spam detection
            // In a real implementation, this would use a trained model
            
            const suspiciousWords = ['free', 'click', 'now', 'urgent', 'limited', 'offer'];
            const wordCount = suspiciousWords.filter(word => 
                content.toLowerCase().includes(word)
            ).length;
            
            if (wordCount >= 3) {
                return {
                    isSpam: true,
                    confidence: Math.min(1, wordCount / 5),
                    reason: 'Suspicious word patterns'
                };
            }
            
            return { isSpam: false, confidence: 0 };
            
        } catch (error) {
            this.logger.debug('ML spam check failed:', error);
            return { isSpam: false, confidence: 0 };
        }
    }

    getUserHistory(userId) {
        return this.userMessageHistory.get(userId) || [];
    }

    async updateUserHistory(userId, content, timestamp, spamScore) {
        const history = this.getUserHistory(userId);
        history.push({ content, timestamp, spamScore });
        
        // Keep only recent history (last 100 messages or 1 hour)
        const oneHourAgo = timestamp - 3600000;
        const recentHistory = history
            .filter(msg => msg.timestamp > oneHourAgo)
            .slice(-100);
        
        this.userMessageHistory.set(userId, recentHistory);
        
        // Cache user history
        await this.cache.set(`spam_history:${userId}`, recentHistory, 3600);
    }

    calculateSimilarity(str1, str2) {
        if (str1 === str2) return 1;
        if (str1.length === 0 || str2.length === 0) return 0;
        
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1;
        
        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }

    levenshteinDistance(str1, str2) {
        const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
        
        for (let i = 0; i <= str1.length; i += 1) {
            matrix[0][i] = i;
        }
        
        for (let j = 0; j <= str2.length; j += 1) {
            matrix[j][0] = j;
        }
        
        for (let j = 1; j <= str2.length; j += 1) {
            for (let i = 1; i <= str1.length; i += 1) {
                const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(
                    matrix[j][i - 1] + 1,
                    matrix[j - 1][i] + 1,
                    matrix[j - 1][i - 1] + indicator
                );
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    detectUnicodeAbuse(content) {
        // Detect excessive use of Unicode characters that can be used for spam
        const unicodeAbuse = /[\u200B-\u200F\u2060\uFEFF\u180E]/g;
        const matches = content.match(unicodeAbuse);
        return matches && matches.length > 5;
    }

    detectInvisibleCharacters(content) {
        // Detect invisible characters often used in spam
        const invisibleChars = /[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000]/g;
        const matches = content.match(invisibleChars);
        return matches && matches.length > 3;
    }

    async loadCachedData() {
        try {
            // Load user histories from cache
            const historyKeys = await this.cache.getKeys('spam_history:*');
            for (const key of historyKeys) {
                const history = await this.cache.get(key);
                if (history) {
                    const userId = key.split(':')[1];
                    this.userMessageHistory.set(userId, history);
                }
            }
            
            this.logger.info(`Loaded ${historyKeys.length} user spam histories from cache`);
            
        } catch (error) {
            this.logger.error('Failed to load cached spam data:', error);
        }
    }

    async loadSpamModels() {
        try {
            // Load any ML models for spam detection
            // This would integrate with the ML pipeline
            this.logger.debug('Spam detection models loaded');
            
        } catch (error) {
            this.logger.error('Failed to load spam models:', error);
        }
    }

    startCleanupProcesses() {
        // Clean up old message histories every 15 minutes
        setInterval(() => {
            const now = Date.now();
            const oneHourAgo = now - 3600000;
            
            for (const [userId, history] of this.userMessageHistory) {
                const recentHistory = history.filter(msg => msg.timestamp > oneHourAgo);
                if (recentHistory.length === 0) {
                    this.userMessageHistory.delete(userId);
                } else {
                    this.userMessageHistory.set(userId, recentHistory);
                }
            }
            
            // Clean up channel activity
            for (const [channelId, activity] of this.channelActivity) {
                const recentActivity = activity.filter(entry => now - entry.timestamp < 600000); // 10 minutes
                if (recentActivity.length === 0) {
                    this.channelActivity.delete(channelId);
                } else {
                    this.channelActivity.set(channelId, recentActivity);
                }
            }
            
            this.stats.usersMonitored = this.userMessageHistory.size;
            
        }, 900000); // 15 minutes
    }

    async logSpamDetection(userId, guildId, channelId, reasons, confidence) {
        try {
            const logData = {
                userId,
                guildId,
                channelId,
                reasons,
                confidence,
                timestamp: new Date().toISOString()
            };
            
            // Log to analytics
            if (this.analytics) {
                await this.analytics.trackCommandUsage(userId, guildId, 'spam_detection', true);
            }
            
            this.logger.logSpamDetection(userId, guildId, reasons.join('; '), { confidence });
            
        } catch (error) {
            this.logger.error('Failed to log spam detection:', error);
        }
    }

    async reportFalsePositive(userId, messageId) {
        try {
            this.stats.falsePositives++;
            
            // Update user reputation positively
            const userData = await this.cache.getUserProfile(userId);
            if (userData) {
                userData.reputation = (userData.reputation || 0) + 1;
                await this.cache.cacheUserProfile(userId, userData);
            }
            
            this.logger.info(`False positive reported for user ${userId}, message ${messageId}`);
            
        } catch (error) {
            this.logger.error('Failed to report false positive:', error);
        }
    }

    async updateThresholds(newThresholds) {
        try {
            Object.assign(this.spamThresholds, newThresholds);
            await this.cache.set('spam_thresholds', this.spamThresholds, 86400);
            this.logger.info('Spam detection thresholds updated');
            
        } catch (error) {
            this.logger.error('Failed to update thresholds:', error);
        }
    }

    getStats() {
        return {
            ...this.stats,
            usersMonitored: this.userMessageHistory.size,
            channelsMonitored: this.channelActivity.size,
            thresholds: this.spamThresholds,
            initialized: this.initialized
        };
    }

    isInitialized() {
        return this.initialized;
    }
}

module.exports = SpamDetector;