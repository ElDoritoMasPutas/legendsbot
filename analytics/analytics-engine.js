const config = require('../config/enhanced-config.js');
const Logger = require('../logging/enhanced-logger.js');

class AnalyticsEngine {
    constructor(database, cache) {
        this.database = database;
        this.cache = cache;
        this.logger = new Logger('AnalyticsEngine');
        this.initialized = false;
        
        this.realTimeMetrics = {
            messagesPerHour: 0,
            activeUsers: new Set(),
            popularChannels: new Map(),
            commandUsage: new Map(),
            sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
            languageDistribution: new Map(),
            moderationActions: 0
        };
        
        this.aggregatedData = {
            daily: new Map(),
            weekly: new Map(),
            monthly: new Map()
        };
        
        this.eventQueue = [];
        this.batchSize = 100;
        this.flushInterval = 10000; // 10 seconds
    }

    async initialize() {
        try {
            this.logger.info('Initializing Analytics Engine...');
            
            // Start background processes
            this.startEventProcessor();
            this.startMetricsAggregator();
            this.startRealTimeUpdater();
            
            // Load existing aggregated data from cache
            await this.loadAggregatedData();
            
            this.initialized = true;
            this.logger.info('Analytics Engine initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize Analytics Engine:', error);
            throw error;
        }
    }

    async trackMessageEvent(message, analysis) {
        try {
            const event = {
                type: 'message',
                timestamp: new Date(),
                guildId: message.guild?.id,
                channelId: message.channel?.id,
                userId: message.author.id,
                messageLength: message.content.length,
                hasAttachments: message.attachments.size > 0,
                mentionCount: message.mentions.users.size,
                sentiment: analysis.sentiment?.label,
                language: analysis.language?.language,
                toxicity: analysis.toxicity?.score,
                intent: analysis.intent?.intent
            };
            
            // Add to event queue for batch processing
            this.eventQueue.push(event);
            
            // Update real-time metrics
            this.updateRealTimeMetrics(event);
            
            // Store in database if batch is full
            if (this.eventQueue.length >= this.batchSize) {
                await this.flushEventQueue();
            }
            
        } catch (error) {
            this.logger.error('Failed to track message event:', error);
        }
    }

    async trackGuildJoin(guild) {
        try {
            const event = {
                type: 'guild_join',
                timestamp: new Date(),
                guildId: guild.id,
                guildName: guild.name,
                memberCount: guild.memberCount,
                region: guild.region,
                features: guild.features
            };
            
            this.eventQueue.push(event);
            await this.database.logAnalyticsEvent('guild_join', event);
            
        } catch (error) {
            this.logger.error('Failed to track guild join:', error);
        }
    }

    async trackGuildLeave(guild) {
        try {
            const event = {
                type: 'guild_leave',
                timestamp: new Date(),
                guildId: guild.id,
                guildName: guild.name,
                memberCount: guild.memberCount
            };
            
            this.eventQueue.push(event);
            await this.database.logAnalyticsEvent('guild_leave', event);
            
        } catch (error) {
            this.logger.error('Failed to track guild leave:', error);
        }
    }

    async trackMemberJoin(member) {
        try {
            const event = {
                type: 'member_join',
                timestamp: new Date(),
                guildId: member.guild.id,
                userId: member.id,
                accountAge: Date.now() - member.user.createdAt.getTime(),
                hasAvatar: !!member.user.avatar,
                isBot: member.user.bot
            };
            
            this.eventQueue.push(event);
            this.realTimeMetrics.activeUsers.add(member.id);
            
        } catch (error) {
            this.logger.error('Failed to track member join:', error);
        }
    }

    async trackMemberLeave(member) {
        try {
            const event = {
                type: 'member_leave',
                timestamp: new Date(),
                guildId: member.guild.id,
                userId: member.id,
                timeInServer: Date.now() - member.joinedAt.getTime()
            };
            
            this.eventQueue.push(event);
            this.realTimeMetrics.activeUsers.delete(member.id);
            
        } catch (error) {
            this.logger.error('Failed to track member leave:', error);
        }
    }

    async trackVoiceActivity(oldState, newState) {
        try {
            if (oldState.channelId !== newState.channelId) {
                const event = {
                    type: 'voice_activity',
                    timestamp: new Date(),
                    guildId: newState.guild.id,
                    userId: newState.id,
                    oldChannelId: oldState.channelId,
                    newChannelId: newState.channelId,
                    action: newState.channelId ? 'join' : 'leave'
                };
                
                this.eventQueue.push(event);
            }
            
        } catch (error) {
            this.logger.error('Failed to track voice activity:', error);
        }
    }

    async trackCommandUsage(userId, guildId, command, success = true) {
        try {
            const event = {
                type: 'command_usage',
                timestamp: new Date(),
                guildId,
                userId,
                command,
                success
            };
            
            this.eventQueue.push(event);
            
            // Update real-time metrics
            const currentCount = this.realTimeMetrics.commandUsage.get(command) || 0;
            this.realTimeMetrics.commandUsage.set(command, currentCount + 1);
            
        } catch (error) {
            this.logger.error('Failed to track command usage:', error);
        }
    }

    updateRealTimeMetrics(event) {
        try {
            if (event.type === 'message') {
                // Update messages per hour
                this.realTimeMetrics.messagesPerHour++;
                
                // Track active users
                this.realTimeMetrics.activeUsers.add(event.userId);
                
                // Track popular channels
                if (event.channelId) {
                    const currentCount = this.realTimeMetrics.popularChannels.get(event.channelId) || 0;
                    this.realTimeMetrics.popularChannels.set(event.channelId, currentCount + 1);
                }
                
                // Track sentiment distribution
                if (event.sentiment) {
                    this.realTimeMetrics.sentimentDistribution[event.sentiment]++;
                }
                
                // Track language distribution
                if (event.language) {
                    const currentCount = this.realTimeMetrics.languageDistribution.get(event.language) || 0;
                    this.realTimeMetrics.languageDistribution.set(event.language, currentCount + 1);
                }
            }
            
        } catch (error) {
            this.logger.error('Failed to update real-time metrics:', error);
        }
    }

    async flushEventQueue() {
        if (this.eventQueue.length === 0) return;
        
        try {
            const events = [...this.eventQueue];
            this.eventQueue = [];
            
            // Batch insert into database
            for (const event of events) {
                await this.database.logAnalyticsEvent(event.type, event, event.userId, event.guildId);
            }
            
            this.logger.debug(`Flushed ${events.length} analytics events to database`);
            
        } catch (error) {
            this.logger.error('Failed to flush event queue:', error);
            // Re-add events to queue for retry
            this.eventQueue.unshift(...this.eventQueue);
        }
    }

    startEventProcessor() {
        setInterval(async () => {
            await this.flushEventQueue();
        }, this.flushInterval);
    }

    startMetricsAggregator() {
        // Aggregate metrics every hour
        setInterval(async () => {
            await this.aggregateHourlyMetrics();
        }, 3600000); // 1 hour
        
        // Aggregate daily metrics at midnight
        setInterval(async () => {
            await this.aggregateDailyMetrics();
        }, 86400000); // 24 hours
    }

    startRealTimeUpdater() {
        // Reset hourly metrics
        setInterval(() => {
            this.realTimeMetrics.messagesPerHour = 0;
            this.realTimeMetrics.moderationActions = 0;
        }, 3600000); // 1 hour
        
        // Clean up old active users
        setInterval(() => {
            // In a real implementation, you'd track user activity timestamps
            // and remove inactive users from the active set
        }, 300000); // 5 minutes
    }

    async aggregateHourlyMetrics() {
        try {
            const hour = new Date();
            hour.setMinutes(0, 0, 0);
            
            const hourKey = hour.toISOString();
            const metrics = await this.calculateHourlyMetrics(hour);
            
            this.aggregatedData.daily.set(hourKey, metrics);
            await this.cache.set(`analytics:hourly:${hourKey}`, metrics, 86400); // 24 hours
            
            this.logger.debug(`Aggregated hourly metrics for ${hourKey}`);
            
        } catch (error) {
            this.logger.error('Failed to aggregate hourly metrics:', error);
        }
    }

    async aggregateDailyMetrics() {
        try {
            const date = new Date();
            date.setHours(0, 0, 0, 0);
            
            const dateKey = date.toISOString().split('T')[0];
            const metrics = await this.calculateDailyMetrics(date);
            
            this.aggregatedData.weekly.set(dateKey, metrics);
            await this.cache.set(`analytics:daily:${dateKey}`, metrics, 604800); // 7 days
            
            this.logger.debug(`Aggregated daily metrics for ${dateKey}`);
            
        } catch (error) {
            this.logger.error('Failed to aggregate daily metrics:', error);
        }
    }

    async calculateHourlyMetrics(hour) {
        const startTime = new Date(hour);
        const endTime = new Date(hour.getTime() + 3600000);
        
        // Query database for metrics in this hour
        const messageCount = await this.database.models.Message.count({
            where: {
                createdAt: {
                    [this.database.sequelize.Op.between]: [startTime, endTime]
                }
            }
        });
        
        const activeUserCount = await this.database.models.Message.count({
            distinct: true,
            col: 'userId',
            where: {
                createdAt: {
                    [this.database.sequelize.Op.between]: [startTime, endTime]
                }
            }
        });
        
        return {
            timestamp: hour.toISOString(),
            messageCount,
            activeUserCount,
            avgSentiment: await this.calculateAverageSentiment(startTime, endTime),
            topChannels: await this.getTopChannels(startTime, endTime),
            languageDistribution: await this.getLanguageDistribution(startTime, endTime)
        };
    }

    async calculateDailyMetrics(date) {
        const startTime = new Date(date);
        const endTime = new Date(date.getTime() + 86400000);
        
        const messageCount = await this.database.models.Message.count({
            where: {
                createdAt: {
                    [this.database.sequelize.Op.between]: [startTime, endTime]
                }
            }
        });
        
        const activeUserCount = await this.database.models.Message.count({
            distinct: true,
            col: 'userId',
            where: {
                createdAt: {
                    [this.database.sequelize.Op.between]: [startTime, endTime]
                }
            }
        });
        
        const moderationActions = await this.database.models.ModerationAction.count({
            where: {
                createdAt: {
                    [this.database.sequelize.Op.between]: [startTime, endTime]
                }
            }
        });
        
        return {
            timestamp: date.toISOString(),
            messageCount,
            activeUserCount,
            moderationActions,
            avgSentiment: await this.calculateAverageSentiment(startTime, endTime),
            avgToxicity: await this.calculateAverageToxicity(startTime, endTime),
            topChannels: await this.getTopChannels(startTime, endTime),
            languageDistribution: await this.getLanguageDistribution(startTime, endTime),
            commandUsage: await this.getCommandUsage(startTime, endTime)
        };
    }

    async calculateAverageSentiment(startTime, endTime) {
        try {
            const messages = await this.database.models.Message.findAll({
                where: {
                    createdAt: {
                        [this.database.sequelize.Op.between]: [startTime, endTime]
                    },
                    sentiment: {
                        [this.database.sequelize.Op.ne]: null
                    }
                },
                attributes: ['sentiment']
            });
            
            if (messages.length === 0) return 0;
            
            const totalSentiment = messages.reduce((sum, msg) => sum + (msg.sentiment || 0), 0);
            return totalSentiment / messages.length;
            
        } catch (error) {
            this.logger.error('Failed to calculate average sentiment:', error);
            return 0;
        }
    }

    async calculateAverageToxicity(startTime, endTime) {
        try {
            const messages = await this.database.models.Message.findAll({
                where: {
                    createdAt: {
                        [this.database.sequelize.Op.between]: [startTime, endTime]
                    },
                    toxicity: {
                        [this.database.sequelize.Op.ne]: null
                    }
                },
                attributes: ['toxicity']
            });
            
            if (messages.length === 0) return 0;
            
            const totalToxicity = messages.reduce((sum, msg) => sum + (msg.toxicity || 0), 0);
            return totalToxicity / messages.length;
            
        } catch (error) {
            this.logger.error('Failed to calculate average toxicity:', error);
            return 0;
        }
    }

    async getTopChannels(startTime, endTime, limit = 10) {
        try {
            const results = await this.database.models.Message.findAll({
                where: {
                    createdAt: {
                        [this.database.sequelize.Op.between]: [startTime, endTime]
                    }
                },
                attributes: [
                    'channelId',
                    [this.database.sequelize.fn('COUNT', this.database.sequelize.col('id')), 'messageCount']
                ],
                group: ['channelId'],
                order: [[this.database.sequelize.literal('messageCount'), 'DESC']],
                limit
            });
            
            return results.map(result => ({
                channelId: result.channelId,
                messageCount: parseInt(result.dataValues.messageCount)
            }));
            
        } catch (error) {
            this.logger.error('Failed to get top channels:', error);
            return [];
        }
    }

    async getLanguageDistribution(startTime, endTime) {
        try {
            const results = await this.database.models.Message.findAll({
                where: {
                    createdAt: {
                        [this.database.sequelize.Op.between]: [startTime, endTime]
                    },
                    language: {
                        [this.database.sequelize.Op.ne]: null
                    }
                },
                attributes: [
                    'language',
                    [this.database.sequelize.fn('COUNT', this.database.sequelize.col('id')), 'count']
                ],
                group: ['language'],
                order: [[this.database.sequelize.literal('count'), 'DESC']]
            });
            
            const distribution = {};
            for (const result of results) {
                distribution[result.language] = parseInt(result.dataValues.count);
            }
            
            return distribution;
            
        } catch (error) {
            this.logger.error('Failed to get language distribution:', error);
            return {};
        }
    }

    async getCommandUsage(startTime, endTime) {
        try {
            const events = await this.database.models.AnalyticsEvent.findAll({
                where: {
                    eventType: 'command_usage',
                    timestamp: {
                        [this.database.sequelize.Op.between]: [startTime, endTime]
                    }
                }
            });
            
            const usage = {};
            for (const event of events) {
                const command = event.eventData.command;
                usage[command] = (usage[command] || 0) + 1;
            }
            
            return usage;
            
        } catch (error) {
            this.logger.error('Failed to get command usage:', error);
            return {};
        }
    }

    async getRealTimeStats() {
        return {
            messagesPerHour: this.realTimeMetrics.messagesPerHour,
            activeUsers: this.realTimeMetrics.activeUsers.size,
            popularChannels: Array.from(this.realTimeMetrics.popularChannels.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5),
            commandUsage: Array.from(this.realTimeMetrics.commandUsage.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10),
            sentimentDistribution: this.realTimeMetrics.sentimentDistribution,
            languageDistribution: Array.from(this.realTimeMetrics.languageDistribution.entries())
                .sort((a, b) => b[1] - a[1]),
            moderationActions: this.realTimeMetrics.moderationActions,
            serversCount: 0, // Would be populated by the main system
            usersCount: 0    // Would be populated by the main system
        };
    }

    async getServerAnalytics(guildId, timeframe = '24h') {
        try {
            const now = new Date();
            let startTime;
            
            switch (timeframe) {
                case '1h':
                    startTime = new Date(now.getTime() - 3600000);
                    break;
                case '24h':
                    startTime = new Date(now.getTime() - 86400000);
                    break;
                case '7d':
                    startTime = new Date(now.getTime() - 604800000);
                    break;
                case '30d':
                    startTime = new Date(now.getTime() - 2592000000);
                    break;
                default:
                    startTime = new Date(now.getTime() - 86400000);
            }
            
            const analytics = {
                timeframe,
                startTime: startTime.toISOString(),
                endTime: now.toISOString(),
                messageCount: await this.getMessageCount(guildId, startTime, now),
                activeUsers: await this.getActiveUserCount(guildId, startTime, now),
                topChannels: await this.getTopChannels(startTime, now),
                sentimentAnalysis: await this.getSentimentAnalysis(guildId, startTime, now),
                languageStats: await this.getLanguageStats(guildId, startTime, now),
                moderationStats: await this.getModerationStats(guildId, startTime, now)
            };
            
            return analytics;
            
        } catch (error) {
            this.logger.error('Failed to get server analytics:', error);
            return null;
        }
    }

    async getUserAnalytics(userId, guildId = null, timeframe = '7d') {
        try {
            const now = new Date();
            const startTime = new Date(now.getTime() - (timeframe === '7d' ? 604800000 : 86400000));
            
            const whereClause = {
                userId,
                createdAt: {
                    [this.database.sequelize.Op.between]: [startTime, now]
                }
            };
            
            if (guildId) {
                whereClause.guildId = guildId;
            }
            
            const messageCount = await this.database.models.Message.count({ where: whereClause });
            const avgSentiment = await this.database.models.Message.findAll({
                where: { ...whereClause, sentiment: { [this.database.sequelize.Op.ne]: null } },
                attributes: [[this.database.sequelize.fn('AVG', this.database.sequelize.col('sentiment')), 'avgSentiment']]
            });
            
            return {
                userId,
                timeframe,
                messageCount,
                avgSentiment: parseFloat(avgSentiment[0]?.dataValues?.avgSentiment || 0),
                lastActive: await this.database.getLastActivity(userId, guildId),
                reputation: 0 // Would be calculated based on various factors
            };
            
        } catch (error) {
            this.logger.error('Failed to get user analytics:', error);
            return null;
        }
    }

    async loadAggregatedData() {
        try {
            // Load cached aggregated data
            const hourlyKeys = await this.cache.getKeys('analytics:hourly:*');
            for (const key of hourlyKeys) {
                const data = await this.cache.get(key);
                if (data) {
                    const timestamp = key.split(':')[2];
                    this.aggregatedData.daily.set(timestamp, data);
                }
            }
            
            const dailyKeys = await this.cache.getKeys('analytics:daily:*');
            for (const key of dailyKeys) {
                const data = await this.cache.get(key);
                if (data) {
                    const timestamp = key.split(':')[2];
                    this.aggregatedData.weekly.set(timestamp, data);
                }
            }
            
            this.logger.info(`Loaded ${hourlyKeys.length} hourly and ${dailyKeys.length} daily analytics from cache`);
            
        } catch (error) {
            this.logger.error('Failed to load aggregated data:', error);
        }
    }

    async flush() {
        await this.flushEventQueue();
        
        // Save current real-time metrics to cache
        await this.cache.set('analytics:realtime', this.realTimeMetrics, 3600);
    }

    async aggregateData() {
        await this.aggregateHourlyMetrics();
        await this.aggregateDailyMetrics();
    }

    getStats() {
        return {
            queueSize: this.eventQueue.length,
            realTimeMetrics: this.realTimeMetrics,
            aggregatedDataSize: {
                daily: this.aggregatedData.daily.size,
                weekly: this.aggregatedData.weekly.size,
                monthly: this.aggregatedData.monthly.size
            },
            initialized: this.initialized
        };
    }
}

module.exports = AnalyticsEngine;