// Cache Manager v10.0 - cache/cache-manager.js
const NodeCache = require('node-cache');
const logger = require('../logging/enhanced-logger.js');

class CacheManager {
    constructor() {
        this.cache = new NodeCache({
            stdTTL: 3600, // 1 hour default TTL
            checkperiod: 600, // Check for expired keys every 10 minutes
            useClones: false,
            deleteOnExpire: true,
            enableLegacyCallbacks: false,
            maxKeys: 10000
        });
        
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            errors: 0
        };
        
        this.setupEventHandlers();
        logger.info('🗄️ Cache Manager v10.0 initialized');
    }

    async initialize() {
        // Any async initialization if needed
        logger.info('✅ Cache Manager initialized successfully');
    }

    setupEventHandlers() {
        this.cache.on('set', (key, value) => {
            this.stats.sets++;
            logger.debug(`Cache SET: ${key}`);
        });

        this.cache.on('del', (key, value) => {
            this.stats.deletes++;
            logger.debug(`Cache DELETE: ${key}`);
        });

        this.cache.on('expired', (key, value) => {
            logger.debug(`Cache EXPIRED: ${key}`);
        });

        this.cache.on('flush', () => {
            logger.debug('Cache FLUSHED');
        });
    }

    // Standard cache operations
    async get(key) {
        try {
            const value = this.cache.get(key);
            if (value !== undefined) {
                this.stats.hits++;
                logger.debug(`Cache HIT: ${key}`);
                return value;
            } else {
                this.stats.misses++;
                logger.debug(`Cache MISS: ${key}`);
                return null;
            }
        } catch (error) {
            this.stats.errors++;
            logger.error(`Cache GET error for key ${key}:`, error);
            return null;
        }
    }

    async set(key, value, ttl = null) {
        try {
            const success = this.cache.set(key, value, ttl || 3600);
            if (success) {
                this.stats.sets++;
                logger.debug(`Cache SET successful: ${key}`);
            }
            return success;
        } catch (error) {
            this.stats.errors++;
            logger.error(`Cache SET error for key ${key}:`, error);
            return false;
        }
    }

    async del(key) {
        try {
            const deleted = this.cache.del(key);
            if (deleted > 0) {
                this.stats.deletes++;
                logger.debug(`Cache DELETE successful: ${key}`);
            }
            return deleted > 0;
        } catch (error) {
            this.stats.errors++;
            logger.error(`Cache DELETE error for key ${key}:`, error);
            return false;
        }
    }

    async has(key) {
        try {
            return this.cache.has(key);
        } catch (error) {
            this.stats.errors++;
            logger.error(`Cache HAS error for key ${key}:`, error);
            return false;
        }
    }

    async flush() {
        try {
            this.cache.flushAll();
            logger.info('Cache flushed successfully');
            return true;
        } catch (error) {
            this.stats.errors++;
            logger.error('Cache FLUSH error:', error);
            return false;
        }
    }

    // Specialized cache methods for the AI system
    async cacheMessageAnalysis(messageId, analysis) {
        const key = `analysis:${messageId}`;
        return await this.set(key, analysis, 1800); // 30 minutes
    }

    async getMessageAnalysis(messageId) {
        const key = `analysis:${messageId}`;
        return await this.get(key);
    }

    async cacheTranslation(sourceText, targetLang, translation) {
        const key = `translation:${this.hashString(sourceText)}:${targetLang}`;
        return await this.set(key, translation, 3600); // 1 hour
    }

    async getTranslation(sourceText, targetLang) {
        const key = `translation:${this.hashString(sourceText)}:${targetLang}`;
        return await this.get(key);
    }

    async cacheUserData(userId, data) {
        const key = `user:${userId}`;
        return await this.set(key, data, 7200); // 2 hours
    }

    async getUserData(userId) {
        const key = `user:${userId}`;
        return await this.get(key);
    }

    async cacheGuildConfig(guildId, config) {
        const key = `guild:${guildId}`;
        return await this.set(key, config, 14400); // 4 hours
    }

    async getGuildConfig(guildId) {
        const key = `guild:${guildId}`;
        return await this.get(key);
    }

    // Bulk operations
    async mget(keys) {
        try {
            const result = this.cache.mget(keys);
            const hits = Object.keys(result).length;
            const misses = keys.length - hits;
            
            this.stats.hits += hits;
            this.stats.misses += misses;
            
            logger.debug(`Cache MGET: ${hits} hits, ${misses} misses`);
            return result;
        } catch (error) {
            this.stats.errors++;
            logger.error('Cache MGET error:', error);
            return {};
        }
    }

    async mset(keyValuePairs, ttl = null) {
        try {
            const success = this.cache.mset(keyValuePairs, ttl || 3600);
            if (success) {
                this.stats.sets += Object.keys(keyValuePairs).length;
                logger.debug(`Cache MSET successful: ${Object.keys(keyValuePairs).length} items`);
            }
            return success;
        } catch (error) {
            this.stats.errors++;
            logger.error('Cache MSET error:', error);
            return false;
        }
    }

    // Cache management
    async cleanup() {
        try {
            const keys = this.cache.keys();
            const now = Date.now();
            let cleaned = 0;

            // Remove expired entries manually (force cleanup)
            for (const key of keys) {
                const ttl = this.cache.getTtl(key);
                if (ttl && ttl < now) {
                    this.cache.del(key);
                    cleaned++;
                }
            }

            if (cleaned > 0) {
                logger.info(`Cache cleanup: removed ${cleaned} expired entries`);
            }

            return cleaned;
        } catch (error) {
            this.stats.errors++;
            logger.error('Cache cleanup error:', error);
            return 0;
        }
    }

    // Statistics and monitoring
    getStats() {
        const cacheStats = this.cache.getStats();
        return {
            ...this.stats,
            keys: cacheStats.keys,
            hits: cacheStats.hits,
            misses: cacheStats.misses,
            ksize: cacheStats.ksize,
            vsize: cacheStats.vsize,
            hitRate: this.stats.hits > 0 ? 
                Math.round((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100) : 0
        };
    }

    async healthCheck() {
        try {
            const testKey = 'health_check_test';
            const testValue = { timestamp: Date.now() };
            
            // Test set
            const setResult = await this.set(testKey, testValue, 60);
            if (!setResult) {
                throw new Error('Failed to set test value');
            }
            
            // Test get
            const getValue = await this.get(testKey);
            if (!getValue || getValue.timestamp !== testValue.timestamp) {
                throw new Error('Failed to get test value');
            }
            
            // Test delete
            const delResult = await this.del(testKey);
            if (!delResult) {
                throw new Error('Failed to delete test value');
            }
            
            return {
                status: 'healthy',
                stats: this.getStats(),
                timestamp: Date.now()
            };
        } catch (error) {
            logger.error('Cache health check failed:', error);
            return {
                status: 'unhealthy',
                error: error.message,
                timestamp: Date.now()
            };
        }
    }

    // Utility methods
    hashString(str) {
        return require('crypto')
            .createHash('sha256')
            .update(str)
            .digest('hex')
            .substring(0, 16);
    }

    // Graceful shutdown
    async disconnect() {
        try {
            this.cache.close();
            logger.info('Cache Manager disconnected successfully');
        } catch (error) {
            logger.error('Cache Manager disconnect error:', error);
        }
    }
}

module.exports = CacheManager;