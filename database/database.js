const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/enhanced-config.js');
const Logger = require('../logging/enhanced-logger.js');

class Database {
    constructor() {
        this.sequelize = null;
        this.models = {};
        this.logger = new Logger('Database');
        this.connected = false;
        this.retryCount = 0;
        this.maxRetries = 3;
    }

    async initialize() {
        try {
            this.logger.info('Initializing database connection...');
            
            this.sequelize = new Sequelize(
                config.database.database,
                config.database.username,
                config.database.password,
                {
                    host: config.database.host,
                    port: config.database.port,
                    dialect: config.database.dialect,
                    logging: config.database.logging ? this.logger.debug.bind(this.logger) : false,
                    pool: config.database.pool,
                    retry: config.database.retry,
                    dialectOptions: {
                        charset: 'utf8mb4',
                        collate: 'utf8mb4_unicode_ci'
                    }
                }
            );

            await this.testConnection();
            await this.defineModels();
            
            this.connected = true;
            this.logger.info('Database initialized successfully');
            
        } catch (error) {
            this.logger.error('Database initialization failed:', error);
            throw error;
        }
    }

    async testConnection() {
        try {
            await this.sequelize.authenticate();
            this.logger.info('Database connection established successfully');
        } catch (error) {
            this.logger.error('Unable to connect to database:', error);
            
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                this.logger.info(`Retrying connection (${this.retryCount}/${this.maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, 5000));
                return this.testConnection();
            }
            
            throw error;
        }
    }

    defineModels() {
        // Guilds Model
        this.models.Guild = this.sequelize.define('Guild', {
            id: {
                type: DataTypes.STRING,
                primaryKey: true
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false
            },
            ownerId: {
                type: DataTypes.STRING,
                allowNull: false
            },
            memberCount: {
                type: DataTypes.INTEGER,
                defaultValue: 0
            },
            settings: {
                type: DataTypes.JSON,
                defaultValue: {}
            },
            features: {
                type: DataTypes.JSON,
                defaultValue: []
            },
            joinedAt: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW
            },
            isActive: {
                type: DataTypes.BOOLEAN,
                defaultValue: true
            }
        });

        // Users Model
        this.models.User = this.sequelize.define('User', {
            id: {
                type: DataTypes.STRING,
                primaryKey: true
            },
            username: {
                type: DataTypes.STRING,
                allowNull: false
            },
            discriminator: {
                type: DataTypes.STRING,
                allowNull: true
            },
            avatar: {
                type: DataTypes.STRING,
                allowNull: true
            },
            profile: {
                type: DataTypes.JSON,
                defaultValue: {}
            },
            preferences: {
                type: DataTypes.JSON,
                defaultValue: {}
            },
            statistics: {
                type: DataTypes.JSON,
                defaultValue: {
                    messagesCount: 0,
                    commandsUsed: 0,
                    moderationActions: 0
                }
            },
            reputation: {
                type: DataTypes.INTEGER,
                defaultValue: 0
            },
            isBlacklisted: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            firstSeen: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW
            },
            lastActive: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW
            }
        });

        // Messages Model
        this.models.Message = this.sequelize.define('Message', {
            id: {
                type: DataTypes.STRING,
                primaryKey: true
            },
            guildId: {
                type: DataTypes.STRING,
                allowNull: false
            },
            channelId: {
                type: DataTypes.STRING,
                allowNull: false
            },
            userId: {
                type: DataTypes.STRING,
                allowNull: false
            },
            content: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            analysis: {
                type: DataTypes.JSON,
                defaultValue: {}
            },
            sentiment: {
                type: DataTypes.FLOAT,
                allowNull: true
            },
            toxicity: {
                type: DataTypes.FLOAT,
                allowNull: true
            },
            language: {
                type: DataTypes.STRING,
                allowNull: true
            },
            flags: {
                type: DataTypes.JSON,
                defaultValue: []
            },
            attachments: {
                type: DataTypes.JSON,
                defaultValue: []
            },
            reactions: {
                type: DataTypes.JSON,
                defaultValue: []
            },
            isDeleted: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            deletedAt: {
                type: DataTypes.DATE,
                allowNull: true
            }
        });

        // Moderation Actions Model
        this.models.ModerationAction = this.sequelize.define('ModerationAction', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            guildId: {
                type: DataTypes.STRING,
                allowNull: false
            },
            userId: {
                type: DataTypes.STRING,
                allowNull: false
            },
            moderatorId: {
                type: DataTypes.STRING,
                allowNull: false
            },
            type: {
                type: DataTypes.ENUM('warn', 'mute', 'kick', 'ban', 'unban', 'timeout'),
                allowNull: false
            },
            reason: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            evidence: {
                type: DataTypes.JSON,
                defaultValue: {}
            },
            duration: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            isActive: {
                type: DataTypes.BOOLEAN,
                defaultValue: true
            },
            expiresAt: {
                type: DataTypes.DATE,
                allowNull: true
            }
        });

        // Analytics Events Model
        this.models.AnalyticsEvent = this.sequelize.define('AnalyticsEvent', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            guildId: {
                type: DataTypes.STRING,
                allowNull: true
            },
            userId: {
                type: DataTypes.STRING,
                allowNull: true
            },
            eventType: {
                type: DataTypes.STRING,
                allowNull: false
            },
            eventData: {
                type: DataTypes.JSON,
                defaultValue: {}
            },
            metadata: {
                type: DataTypes.JSON,
                defaultValue: {}
            },
            timestamp: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW
            }
        });

        // Translations Model
        this.models.Translation = this.sequelize.define('Translation', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            originalText: {
                type: DataTypes.TEXT,
                allowNull: false
            },
            translatedText: {
                type: DataTypes.TEXT,
                allowNull: false
            },
            sourceLang: {
                type: DataTypes.STRING,
                allowNull: false
            },
            targetLang: {
                type: DataTypes.STRING,
                allowNull: false
            },
            provider: {
                type: DataTypes.STRING,
                allowNull: false
            },
            confidence: {
                type: DataTypes.FLOAT,
                allowNull: true
            },
            usage: {
                type: DataTypes.INTEGER,
                defaultValue: 1
            }
        });

        // Plugin Data Model
        this.models.PluginData = this.sequelize.define('PluginData', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            guildId: {
                type: DataTypes.STRING,
                allowNull: true
            },
            pluginName: {
                type: DataTypes.STRING,
                allowNull: false
            },
            dataKey: {
                type: DataTypes.STRING,
                allowNull: false
            },
            dataValue: {
                type: DataTypes.JSON,
                allowNull: false
            },
            expiresAt: {
                type: DataTypes.DATE,
                allowNull: true
            }
        });

        // System Logs Model
        this.models.SystemLog = this.sequelize.define('SystemLog', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            level: {
                type: DataTypes.ENUM('debug', 'info', 'warn', 'error'),
                allowNull: false
            },
            component: {
                type: DataTypes.STRING,
                allowNull: false
            },
            message: {
                type: DataTypes.TEXT,
                allowNull: false
            },
            metadata: {
                type: DataTypes.JSON,
                defaultValue: {}
            },
            timestamp: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW
            }
        });

        // Define associations
        this.defineAssociations();
        
        this.logger.info('Database models defined successfully');
    }

    defineAssociations() {
        // User-Guild relationships
        this.models.User.belongsToMany(this.models.Guild, { 
            through: 'GuildMembers',
            foreignKey: 'userId',
            otherKey: 'guildId'
        });
        this.models.Guild.belongsToMany(this.models.User, { 
            through: 'GuildMembers',
            foreignKey: 'guildId',
            otherKey: 'userId'
        });

        // Message relationships
        this.models.Message.belongsTo(this.models.User, { foreignKey: 'userId' });
        this.models.Message.belongsTo(this.models.Guild, { foreignKey: 'guildId' });

        // Moderation relationships
        this.models.ModerationAction.belongsTo(this.models.User, { 
            foreignKey: 'userId',
            as: 'target'
        });
        this.models.ModerationAction.belongsTo(this.models.User, { 
            foreignKey: 'moderatorId',
            as: 'moderator'
        });
        this.models.ModerationAction.belongsTo(this.models.Guild, { foreignKey: 'guildId' });

        // Analytics relationships
        this.models.AnalyticsEvent.belongsTo(this.models.User, { foreignKey: 'userId' });
        this.models.AnalyticsEvent.belongsTo(this.models.Guild, { foreignKey: 'guildId' });

        // Plugin data relationships
        this.models.PluginData.belongsTo(this.models.Guild, { foreignKey: 'guildId' });
    }

    async migrate() {
        try {
            this.logger.info('Running database migrations...');
            
            await this.sequelize.sync({ 
                alter: process.env.NODE_ENV === 'development',
                force: false 
            });
            
            this.logger.info('Database migrations completed successfully');
        } catch (error) {
            this.logger.error('Database migration failed:', error);
            throw error;
        }
    }

    async performMaintenance() {
        try {
            this.logger.info('Starting database maintenance...');
            
            // Clean old analytics events (older than 30 days)
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            await this.models.AnalyticsEvent.destroy({
                where: {
                    timestamp: {
                        [this.sequelize.Op.lt]: thirtyDaysAgo
                    }
                }
            });

            // Clean old system logs (older than 14 days)
            const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
            await this.models.SystemLog.destroy({
                where: {
                    timestamp: {
                        [this.sequelize.Op.lt]: fourteenDaysAgo
                    }
                }
            });

            // Clean expired plugin data
            await this.models.PluginData.destroy({
                where: {
                    expiresAt: {
                        [this.sequelize.Op.lt]: new Date()
                    }
                }
            });

            // Update user activity status
            const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            await this.models.User.update(
                { isBlacklisted: false },
                {
                    where: {
                        lastActive: {
                            [this.sequelize.Op.gte]: oneMonthAgo
                        }
                    }
                }
            );

            this.logger.info('Database maintenance completed successfully');
        } catch (error) {
            this.logger.error('Database maintenance failed:', error);
        }
    }

    async getGuild(guildId) {
        return await this.models.Guild.findByPk(guildId);
    }

    async getUser(userId) {
        return await this.models.User.findByPk(userId);
    }

    async getUserStats(userId, guildId = null) {
        const where = { userId };
        if (guildId) where.guildId = guildId;

        const messageCount = await this.models.Message.count({ where });
        const moderationActions = await this.models.ModerationAction.count({ where });
        
        return {
            messageCount,
            moderationActions,
            lastActive: await this.getLastActivity(userId, guildId)
        };
    }

    async getLastActivity(userId, guildId = null) {
        const where = { userId };
        if (guildId) where.guildId = guildId;

        const lastMessage = await this.models.Message.findOne({
            where,
            order: [['createdAt', 'DESC']]
        });

        return lastMessage ? lastMessage.createdAt : null;
    }

    async logAnalyticsEvent(eventType, data, userId = null, guildId = null) {
        return await this.models.AnalyticsEvent.create({
            eventType,
            eventData: data,
            userId,
            guildId
        });
    }

    async close() {
        if (this.sequelize) {
            this.logger.info('Closing database connection...');
            await this.sequelize.close();
            this.connected = false;
            this.logger.info('Database connection closed');
        }
    }

    isConnected() {
        return this.connected;
    }

    getSequelize() {
        return this.sequelize;
    }

    getModels() {
        return this.models;
    }
}

module.exports = Database;
