const Redis = require('ioredis');
const config = require('../config/enhanced-config.js');
const Logger = require('../logging/enhanced-logger.js');

class CacheManager {
    constructor() {
        this.redis = null;
        this.logger = new Logger('CacheManager');
        this.connected = false;
        this.keyPrefix = 'synthia:';
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            errors: 0
        };
    }

    async initialize() {
        try {
            this.logger.info('Initializing Redis cache...');
            
            this.redis = new Redis({
                host: config.redis.host,
                port: config.redis.port,
                password: config.redis.password,
                db: config.redis.db,
                retryDelayOnFailover: config.redis.retryDelayOnFailover,
                maxRetriesPerRequest: config.redis.maxRetriesPerRequest,
                lazyConnect: config.redis.lazyConnect,
                keyPrefix: this.keyPrefix
            });

            this.setupEventHandlers();
            await this.redis.connect();
            
            this.connected = true;
            this.logger.info('Redis cache initialized successfully');
            
        } catch (error) {
            this.logger.error('Redis cache initialization failed:', error);
            throw error;
        }
    }

    setupEventHandlers() {
        this.redis.on('connect', () => {
            this.logger.info('Redis connection established');
            this.connected = true;
        });

        this.redis.on('disconnect', () => {
            this.logger.warn('Redis connection lost');
            this.connected = false;
        });

        this.redis.on('error', (error) => {
            this.logger.error('Redis error:', error);
            this.stats.errors++;
        });

        this.redis.on('reconnecting', () => {
            this.logger.info('Reconnecting to Redis...');
        });
    }

    // Basic cache operations
    async get(key) {
        try {
            const value = await this.redis.get(key);
            
            if (value !== null) {
                this.stats.hits++;
                return JSON.parse(value);
            } else {
                this.stats.misses++;
                return null;
            }
        } catch (error) {
            this.logger.error(`Cache get error for key ${key}:`, error);
            this.stats.errors++;
            return null;
        }
    }

    async set(key, value, ttl = config.cache.ttl) {
        try {
            const serializedValue = JSON.stringify(value);
            
            if (ttl > 0) {
                await this.redis.setex(key, ttl, serializedValue);
            } else {
                await this.redis.set(key, serializedValue);
            }
            
            this.stats.sets++;
            return true;
        } catch (error) {
            this.logger.error(`Cache set error for key ${key}:`, error);
            this.stats.errors++;
            return false;
        }
    }

    async del(key) {
        try {
            const result = await this.redis.del(key);
            this.stats.deletes++;
            return result > 0;
        } catch (error) {
            this.logger.error(`Cache delete error for key ${key}:`, error);
            this.stats.errors++;
            return false;
        }
    }

    async exists(key) {
        try {
            return await this.redis.exists(key) === 1;
        } catch (error) {
            this.logger.error(`Cache exists error for key ${key}:`, error);
            return false;
        }
    }

    async expire(key, ttl) {
        try {
            return await this.redis.expire(key, ttl) === 1;
        } catch (error) {
            this.logger.error(`Cache expire error for key ${key}:`, error);
            return false;
        }
    }

    async ttl(key) {
        try {
            return await this.redis.ttl(key);
        } catch (error) {
            this.logger.error(`Cache TTL error for key ${key}:`, error);
            return -1;
        }
    }

    // Advanced cache operations
    async mget(keys) {
        try {
            const values = await this.redis.mget(keys);
            return values.map(value => value ? JSON.parse(value) : null);
        } catch (error) {
            this.logger.error('Cache mget error:', error);
            this.stats.errors++;
            return keys.map(() => null);
        }
    }

    async mset(keyValuePairs, ttl = config.cache.ttl) {
        try {
            const pipeline = this.redis.pipeline();
            
            for (const [key, value] of keyValuePairs) {
                const serializedValue = JSON.stringify(value);
                if (ttl > 0) {
                    pipeline.setex(key, ttl, serializedValue);
                } else {
                    pipeline.set(key, serializedValue);
                }
            }
            
            await pipeline.exec();
            this.stats.sets += keyValuePairs.length;
            return true;
        } catch (error) {
            this.logger.error('Cache mset error:', error);
            this.stats.errors++;
            return false;
        }
    }

    async increment(key, amount = 1) {
        try {
            return await this.redis.incrby(key, amount);
        } catch (error) {
            this.logger.error(`Cache increment error for key ${key}:`, error);
            return null;
        }
    }

    async decrement(key, amount = 1) {
        try {
            return await this.redis.decrby(key, amount);
        } catch (error) {
            this.logger.error(`Cache decrement error for key ${key}:`, error);
            return null;
        }
    }

    // List operations
    async lpush(key, ...values) {
        try {
            const serializedValues = values.map(v => JSON.stringify(v));
            return await this.redis.lpush(key, ...serializedValues);
        } catch (error) {
            this.logger.error(`Cache lpush error for key ${key}:`, error);
            return 0;
        }
    }

    async rpush(key, ...values) {
        try {
            const serializedValues = values.map(v => JSON.stringify(v));
            return await this.redis.rpush(key, ...serializedValues);
        } catch (error) {
            this.logger.error(`Cache rpush error for key ${key}:`, error);
            return 0;
        }
    }

    async lpop(key) {
        try {
            const value = await this.redis.lpop(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            this.logger.error(`Cache lpop error for key ${key}:`, error);
            return null;
        }
    }

    async rpop(key) {
        try {
            const value = await this.redis.rpop(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            this.logger.error(`Cache rpop error for key ${key}:`, error);
            return null;
        }
    }

    async lrange(key, start = 0, end = -1) {
        try {
            const values = await this.redis.lrange(key, start, end);
            return values.map(v => JSON.parse(v));
        } catch (error) {
            this.logger.error(`Cache lrange error for key ${key}:`, error);
            return [];
        }
    }

    async llen(key) {
        try {
            return await this.redis.llen(key);
        } catch (error) {
            this.logger.error(`Cache llen error for key ${key}:`, error);
            return 0;
        }
    }

    // Set operations
    async sadd(key, ...members) {
        try {
            const serializedMembers = members.map(m => JSON.stringify(m));
            return await this.redis.sadd(key, ...serializedMembers);
        } catch (error) {
            this.logger.error(`Cache sadd error for key ${key}:`, error);
            return 0;
        }
    }

    async srem(key, ...members) {
        try {
            const serializedMembers = members.map(m => JSON.stringify(m));
            return await this.redis.srem(key, ...serializedMembers);
        } catch (error) {
            this.logger.error(`Cache srem error for key ${key}:`, error);
            return 0;
        }
    }

    async smembers(key) {
        try {
            const members = await this.redis.smembers(key);
            return members.map(m => JSON.parse(m));
        } catch (error) {
            this.logger.error(`Cache smembers error for key ${key}:`, error);
            return [];
        }
    }

    async sismember(key, member) {
        try {
            const serializedMember = JSON.stringify(member);
            return await this.redis.sismember(key, serializedMember) === 1;
        } catch (error) {
            this.logger.error(`Cache sismember error for key ${key}:`, error);
            return false;
        }
    }

    // Hash operations
    async hset(key, field, value) {
        try {
            const serializedValue = JSON.stringify(value);
            return await this.redis.hset(key, field, serializedValue);
        } catch (error) {
            this.logger.error(`Cache hset error for key ${key}:`, error);
            return false;
        }
    }

    async hget(key, field) {
        try {
            const value = await this.redis.hget(key, field);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            this.logger.error(`Cache hget error for key ${key}:`, error);
            return null;
        }
    }

    async hgetall(key) {
        try {
            const hash = await this.redis.hgetall(key);
            const result = {};
            for (const [field, value] of Object.entries(hash)) {
                result[field] = JSON.parse(value);
            }
            return result;
        } catch (error) {
            this.logger.error(`Cache hgetall error for key ${key}:`, error);
            return {};
        }
    }

    async hdel(key, ...fields) {
        try {
            return await this.redis.hdel(key, ...fields);
        } catch (error) {
            this.logger.error(`Cache hdel error for key ${key}:`, error);
            return 0;
        }
    }

    // Specialized caching methods
    async cacheMessageAnalysis(messageId, analysis, ttl = config.cache.strategies.messageAnalysis.ttl) {
        return await this.set(`message_analysis:${messageId}`, analysis, ttl);
    }

    async getMessageAnalysis(messageId) {
        return await this.get(`message_analysis:${messageId}`);
    }

    async cacheUserProfile(userId, profile, ttl = config.cache.strategies.userProfiles.ttl) {
        return await this.set(`user_profile:${userId}`, profile, ttl);
    }

    async getUserProfile(userId) {
        return await this.get(`user_profile:${userId}`);
    }

    async cacheGuildSettings(guildId, settings, ttl = config.cache.strategies.guildSettings.ttl) {
        return await this.set(`guild_settings:${guildId}`, settings, ttl);
    }

    async getGuildSettings(guildId) {
        return await this.get(`guild_settings:${guildId}`);
    }

    async cacheTranslation(originalText, sourceLang, targetLang, translation, ttl = config.cache.strategies.translations.ttl) {
        const key = `translation:${Buffer.from(`${originalText}:${sourceLang}:${targetLang}`).toString('base64')}`;
        return await this.set(key, translation, ttl);
    }

    async getTranslation(originalText, sourceLang, targetLang) {
        const key = `translation:${Buffer.from(`${originalText}:${sourceLang}:${targetLang}`).toString('base64')}`;
        return await this.get(key);
    }

    // Rate limiting
    async checkRateLimit(identifier, limit, window) {
        try {
            const key = `rate_limit:${identifier}`;
            const current = await this.redis.incr(key);
            
            if (current === 1) {
                await this.redis.expire(key, window);
            }
            
            return {
                allowed: current <= limit,
                count: current,
                remaining: Math.max(0, limit - current),
                resetTime: await this.redis.ttl(key)
            };
        } catch (error) {
            this.logger.error('Rate limit check error:', error);
            return { allowed: true, count: 0, remaining: 0, resetTime: 0 };
        }
    }

    // Session management
    async createSession(sessionId, data, ttl = 3600) {
        return await this.set(`session:${sessionId}`, data, ttl);
    }

    async getSession(sessionId) {
        return await this.get(`session:${sessionId}`);
    }

    async destroySession(sessionId) {
        return await this.del(`session:${sessionId}`);
    }

    // Pattern-based operations
    async getKeys(pattern) {
        try {
            return await this.redis.keys(pattern);
        } catch (error) {
            this.logger.error(`Cache keys error for pattern ${pattern}:`, error);
            return [];
        }
    }

    async deletePattern(pattern) {
        try {
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                return await this.redis.del(...keys);
            }
            return 0;
        } catch (error) {
            this.logger.error(`Cache delete pattern error for ${pattern}:`, error);
            return 0;
        }
    }

    // Maintenance and cleanup
    async cleanup() {
        try {
            this.logger.info('Starting cache cleanup...');
            
            // Remove expired keys (Redis handles this automatically, but we can optimize)
            const expiredKeys = await this.redis.keys('*');
            let cleanedCount = 0;
            
            for (const key of expiredKeys) {
                const ttl = await this.redis.ttl(key);
                if (ttl === -2) { // Key doesn't exist
                    cleanedCount++;
                }
            }
            
            this.logger.info(`Cache cleanup completed. ${cleanedCount} expired keys found.`);
        } catch (error) {
            this.logger.error('Cache cleanup error:', error);
        }
    }

    async flushAll() {
        try {
            await this.redis.flushall();
            this.logger.info('Cache flushed successfully');
            return true;
        } catch (error) {
            this.logger.error('Cache flush error:', error);
            return false;
        }
    }

    // Statistics and monitoring
    getStats() {
        return {
            ...this.stats,
            hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
            connected: this.connected
        };
    }

    async getInfo() {
        try {
            const info = await this.redis.info();
            const memory = await this.redis.info('memory');
            const keyspace = await this.redis.info('keyspace');
            
            return {
                info,
                memory,
                keyspace,
                stats: this.getStats()
            };
        } catch (error) {
            this.logger.error('Failed to get cache info:', error);
            return null;
        }
    }

    async disconnect() {
        if (this.redis) {
            this.logger.info('Disconnecting from Redis...');
            await this.redis.disconnect();
            this.connected = false;
            this.logger.info('Redis disconnected');
        }
    }

    isConnected() {
        return this.connected;
    }
}

module.exports = CacheManager;
