// Enterprise Database System v10.0 - database/database.js
const { Sequelize, DataTypes, Op } = require('sequelize');
const config = require('../config/enhanced-config.js');
const logger = require('../logging/enhanced-logger.js');
const path = require('path');
const fs = require('fs').promises;

class Database {
    constructor() {
        this.sequelize = null;
        this.models = {};
        this.isConnected = false;
        this.connectionRetries = 0;
        this.maxRetries = 5;
    }

    async initialize() {
        try {
            logger.info('🗄️ Initializing database connection...');
            
            const dbConfig = config.get('database');
            
            // Initialize Sequelize with appropriate dialect
            this.sequelize = new Sequelize({
                dialect: dbConfig.type,
                host: dbConfig.host,
                port: dbConfig.port,
                database: dbConfig.name,
                username: dbConfig.username,
                password: dbConfig.password,
                logging: dbConfig.logging ? (msg) => logger.debug(msg) : false,
                pool: dbConfig.pool,
                dialectOptions: {
                    ssl: dbConfig.ssl ? {
                        require: true,
                        rejectUnauthorized: false
                    } : false
                },
                define: {
                    timestamps: true,
                    underscored: true,
                    paranoid: true // Soft deletes
                },
                benchmark: true,
                logQueryParameters: dbConfig.logging
            });

            // Test connection
            await this.testConnection();
            
            // Define models
            await this.defineModels();
            
            // Set up associations
            this.setupAssociations();
            
            logger.info('✅ Database initialized successfully');
            
        } catch (error) {
            logger.error('💥 Database initialization failed:', error);
            throw error;
        }
    }

    async testConnection() {
        try {
            await this.sequelize.authenticate();
            this.isConnected = true;
            this.connectionRetries = 0;
            logger.info('✅ Database connection established');
        } catch (error) {
            this.isConnected = false;
            this.connectionRetries++;
            
            if (this.connectionRetries < this.maxRetries) {
                logger.warn(`⚠️ Database connection failed (attempt ${this.connectionRetries}/${this.maxRetries}). Retrying in 5 seconds...`);
                await new Promise(resolve => setTimeout(resolve, 5000));
                return this.testConnection();
            } else {
                logger.error('💥 Database connection failed after max retries');
                throw error;
            }
        }
    }

    async defineModels() {
        // Guild Model
        this.models.Guild = this.sequelize.define('Guild', {
            id: {
                type: DataTypes.STRING,
                primaryKey: true
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false
            },
            owner_id: {
                type: DataTypes.STRING,
                allowNull: false
            },
            member_count: {
                type: DataTypes.INTEGER,
                defaultValue: 0
            },
            settings: {
                type: DataTypes.JSONB,
                defaultValue: {}
            },
            features: {
                type: DataTypes.ARRAY(DataTypes.STRING),
                defaultValue: []
            },
            premium: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            premium_expires: {
                type: DataTypes.DATE,
                allowNull: true
            },
            status: {
                type: DataTypes.ENUM('active', 'inactive', 'banned'),
                defaultValue: 'active'
            }
        });

        // User Model
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
                allowNull: false
            },
            avatar: {
                type: DataTypes.STRING,
                allowNull: true
            },
            bot: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            system: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            profile: {
                type: DataTypes.JSONB,
                defaultValue: {}
            },
            preferences: {
                type: DataTypes.JSONB,
                defaultValue: {}
            },
            risk_score: {
                type: DataTypes.FLOAT,
                defaultValue: 0.0
            },
            total_messages: {
                type: DataTypes.INTEGER,
                defaultValue: 0
            },
            total_violations: {
                type: DataTypes.INTEGER,
                defaultValue: 0
            },
            reputation: {
                type: DataTypes.INTEGER,
                defaultValue: 100
            },
            flags: {
                type: DataTypes.ARRAY(DataTypes.STRING),
                defaultValue: []
            },
            status: {
                type: DataTypes.ENUM('active', 'warned', 'restricted', 'banned'),
                defaultValue: 'active'
            }
        });

        // Message Model
        this.models.Message = this.sequelize.define('Message', {
            id: {
                type: DataTypes.STRING,
                primaryKey: true
            },
            channel_id: {
                type: DataTypes.STRING,
                allowNull: false
            },
            guild_id: {
                type: DataTypes.STRING,
                allowNull: false
            },
            author_id: {
                type: DataTypes.STRING,
                allowNull: false
            },
            content: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            embeds: {
                type: DataTypes.JSONB,
                defaultValue: []
            },
            attachments: {
                type: DataTypes.JSONB,
                defaultValue: []
            },
            reactions: {
                type: DataTypes.JSONB,
                defaultValue: []
            },
            edited: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            edited_at: {
                type: DataTypes.DATE,
                allowNull: true
            },
            reply_to: {
                type: DataTypes.STRING,
                allowNull: true
            },
            thread_id: {
                type: DataTypes.STRING,
                allowNull: true
            },
            flags: {
                type: DataTypes.INTEGER,
                defaultValue: 0
            }
        });

        // Analysis Model
        this.models.Analysis = this.sequelize.define('Analysis', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            message_id: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true
            },
            language: {
                type: DataTypes.STRING,
                allowNull: false
            },
            sentiment: {
                type: DataTypes.FLOAT,
                allowNull: true
            },
            toxicity_score: {
                type: DataTypes.FLOAT,
                allowNull: false,
                defaultValue: 0.0
            },
            threat_level: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            confidence: {
                type: DataTypes.FLOAT,
                allowNull: false,
                defaultValue: 0.0
            },
            categories: {
                type: DataTypes.ARRAY(DataTypes.STRING),
                defaultValue: []
            },
            entities: {
                type: DataTypes.JSONB,
                defaultValue: []
            },
            bypass_detected: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            bypass_methods: {
                type: DataTypes.ARRAY(DataTypes.STRING),
                defaultValue: []
            },
            ai_models_used: {
                type: DataTypes.ARRAY(DataTypes.STRING),
                defaultValue: []
            },
            processing_time: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            action_taken: {
                type: DataTypes.ENUM('none', 'warn', 'delete', 'mute', 'ban'),
                defaultValue: 'none'
            },
            metadata: {
                type: DataTypes.JSONB,
                defaultValue: {}
            }
        });

        // Violation Model
        this.models.Violation = this.sequelize.define('Violation', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            user_id: {
                type: DataTypes.STRING,
                allowNull: false
            },
            guild_id: {
                type: DataTypes.STRING,
                allowNull: false
            },
            message_id: {
                type: DataTypes.STRING,
                allowNull: true
            },
            type: {
                type: DataTypes.ENUM('spam', 'toxicity', 'harassment', 'hate_speech', 'threat', 'scam', 'other'),
                allowNull: false
            },
            severity: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            action: {
                type: DataTypes.ENUM('warn', 'delete', 'mute', 'ban', 'none'),
                allowNull: false
            },
            duration: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            reason: {
                type: DataTypes.TEXT,
                allowNull: false
            },
            moderator_id: {
                type: DataTypes.STRING,
                allowNull: true
            },
            automated: {
                type: DataTypes.BOOLEAN,
                defaultValue: true
            },
            appealed: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            appeal_reason: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            status: {
                type: DataTypes.ENUM('active', 'expired', 'revoked', 'appealed'),
                defaultValue: 'active'
            },
            metadata: {
                type: DataTypes.JSONB,
                defaultValue: {}
            }
        });

        // Translation Model
        this.models.Translation = this.sequelize.define('Translation', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            message_id: {
                type: DataTypes.STRING,
                allowNull: false
            },
            source_language: {
                type: DataTypes.STRING,
                allowNull: false
            },
            target_language: {
                type: DataTypes.STRING,
                allowNull: false
            },
            source_text: {
                type: DataTypes.TEXT,
                allowNull: false
            },
            translated_text: {
                type: DataTypes.TEXT,
                allowNull: false
            },
            provider: {
                type: DataTypes.STRING,
                allowNull: false
            },
            confidence: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            processing_time: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            automatic: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            cached: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            }
        });

        // Analytics Event Model
        this.models.AnalyticsEvent = this.sequelize.define('AnalyticsEvent', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            event_type: {
                type: DataTypes.STRING,
                allowNull: false
            },
            guild_id: {
                type: DataTypes.STRING,
                allowNull: true
            },
            user_id: {
                type: DataTypes.STRING,
                allowNull: true
            },
            channel_id: {
                type: DataTypes.STRING,
                allowNull: true
            },
            properties: {
                type: DataTypes.JSONB,
                defaultValue: {}
            },
            timestamp: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW
            },
            session_id: {
                type: DataTypes.STRING,
                allowNull: true
            }
        });

        // Plugin Model
        this.models.Plugin = this.sequelize.define('Plugin', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true
            },
            version: {
                type: DataTypes.STRING,
                allowNull: false
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            author: {
                type: DataTypes.STRING,
                allowNull: true
            },
            enabled: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            config: {
                type: DataTypes.JSONB,
                defaultValue: {}
            },
            dependencies: {
                type: DataTypes.ARRAY(DataTypes.STRING),
                defaultValue: []
            },
            permissions: {
                type: DataTypes.ARRAY(DataTypes.STRING),
                defaultValue: []
            },
            install_date: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW
            },
            last_updated: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW
            }
        });

        // Health Check Model
        this.models.HealthCheck = this.sequelize.define('HealthCheck', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            service: {
                type: DataTypes.STRING,
                allowNull: false
            },
            status: {
                type: DataTypes.ENUM('healthy', 'degraded', 'unhealthy'),
                allowNull: false
            },
            response_time: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            error_message: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            details: {
                type: DataTypes.JSONB,
                defaultValue: {}
            },
            timestamp: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW
            }
        });

        // System Metrics Model
        this.models.SystemMetrics = this.sequelize.define('SystemMetrics', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            cpu_usage: {
                type: DataTypes.FLOAT,
                allowNull: true
            },
            memory_usage: {
                type: DataTypes.FLOAT,
                allowNull: true
            },
            disk_usage: {
                type: DataTypes.FLOAT,
                allowNull: true
            },
            network_in: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            network_out: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            active_connections: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            queue_size: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            cache_hit_rate: {
                type: DataTypes.FLOAT,
                allowNull: true
            },
            error_rate: {
                type: DataTypes.FLOAT,
                allowNull: true
            },
            response_time: {
                type: DataTypes.FLOAT,
                allowNull: true
            },
            timestamp: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW
            }
        });

        logger.info('✅ Database models defined');
    }

    setupAssociations() {
        const { Guild, User, Message, Analysis, Violation, Translation, AnalyticsEvent } = this.models;

        // Guild associations
        Guild.hasMany(Message, { foreignKey: 'guild_id' });
        Guild.hasMany(Violation, { foreignKey: 'guild_id' });
        Guild.hasMany(AnalyticsEvent, { foreignKey: 'guild_id' });

        // User associations
        User.hasMany(Message, { foreignKey: 'author_id' });
        User.hasMany(Violation, { foreignKey: 'user_id' });
        User.hasMany(AnalyticsEvent, { foreignKey: 'user_id' });

        // Message associations
        Message.belongsTo(Guild, { foreignKey: 'guild_id' });
        Message.belongsTo(User, { foreignKey: 'author_id' });
        Message.hasOne(Analysis, { foreignKey: 'message_id' });
        Message.hasMany(Translation, { foreignKey: 'message_id' });
        Message.hasMany(Violation, { foreignKey: 'message_id' });

        // Analysis associations
        Analysis.belongsTo(Message, { foreignKey: 'message_id' });

        // Violation associations
        Violation.belongsTo(User, { foreignKey: 'user_id' });
        Violation.belongsTo(Guild, { foreignKey: 'guild_id' });
        Violation.belongsTo(Message, { foreignKey: 'message_id' });

        // Translation associations
        Translation.belongsTo(Message, { foreignKey: 'message_id' });

        logger.info('✅ Database associations established');
    }

    async migrate() {
        try {
            logger.info('🔄 Running database migrations...');
            
            // Sync all models
            await this.sequelize.sync({ 
                alter: config.isDevelopment(),
                force: false 
            });

            // Run custom migrations
            await this.runCustomMigrations();
            
            logger.info('✅ Database migrations completed');
        } catch (error) {
            logger.error('💥 Database migration failed:', error);
            throw error;
        }
    }

    async runCustomMigrations() {
        try {
            const migrationsPath = path.join(__dirname, 'migrations');
            const migrationFiles = await fs.readdir(migrationsPath).catch(() => []);
            
            for (const file of migrationFiles.sort()) {
                if (file.endsWith('.js')) {
                    logger.info(`Running migration: ${file}`);
                    const migration = require(path.join(migrationsPath, file));
                    await migration.up(this.sequelize.getQueryInterface(), DataTypes);
                }
            }
        } catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    }

    // Advanced query methods
    async getGuildStats(guildId, timeframe = '24h') {
        const timeMap = {
            '1h': new Date(Date.now() - 60 * 60 * 1000),
            '24h': new Date(Date.now() - 24 * 60 * 60 * 1000),
            '7d': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            '30d': new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        };

        const since = timeMap[timeframe] || timeMap['24h'];

        const [messageCount, violationCount, userCount] = await Promise.all([
            this.models.Message.count({
                where: {
                    guild_id: guildId,
                    created_at: { [Op.gte]: since }
                }
            }),
            this.models.Violation.count({
                where: {
                    guild_id: guildId,
                    created_at: { [Op.gte]: since }
                }
            }),
            this.models.Message.count({
                where: {
                    guild_id: guildId,
                    created_at: { [Op.gte]: since }
                },
                distinct: true,
                col: 'author_id'
            })
        ]);

        return {
            messageCount,
            violationCount,
            userCount,
            timeframe
        };
    }

    async getUserProfile(userId) {
        return this.models.User.findByPk(userId, {
            include: [
                {
                    model: this.models.Violation,
                    limit: 10,
                    order: [['created_at', 'DESC']]
                }
            ]
        });
    }

    async getTopViolators(guildId, limit = 10) {
        return this.models.User.findAll({
            include: [{
                model: this.models.Violation,
                where: { guild_id: guildId },
                attributes: []
            }],
            attributes: [
                'id',
                'username',
                'discriminator',
                [this.sequelize.fn('COUNT', this.sequelize.col('Violations.id')), 'violationCount']
            ],
            group: ['User.id'],
            order: [[this.sequelize.literal('violationCount'), 'DESC']],
            limit
        });
    }

    async getAnalyticsTrends(guildId, metric, timeframe = '7d') {
        const timeMap = {
            '1h': 'hour',
            '24h': 'hour',
            '7d': 'day',
            '30d': 'day'
        };

        const interval = timeMap[timeframe] || 'day';

        return this.models.AnalyticsEvent.findAll({
            where: {
                guild_id: guildId,
                event_type: metric,
                timestamp: {
                    [Op.gte]: new Date(Date.now() - this.parseTimeframe(timeframe))
                }
            },
            attributes: [
                [this.sequelize.fn('DATE_TRUNC', interval, this.sequelize.col('timestamp')), 'period'],
                [this.sequelize.fn('COUNT', '*'), 'count']
            ],
            group: ['period'],
            order: [['period', 'ASC']]
        });
    }

    parseTimeframe(timeframe) {
        const map = {
            '1h': 60 * 60 * 1000,
            '24h': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000
        };
        return map[timeframe] || map['24h'];
    }

    // Bulk operations
    async bulkCreateMessages(messages) {
        return this.models.Message.bulkCreate(messages, {
            ignoreDuplicates: true,
            updateOnDuplicate: ['content', 'edited', 'edited_at']
        });
    }

    async bulkCreateAnalytics(events) {
        return this.models.AnalyticsEvent.bulkCreate(events, {
            ignoreDuplicates: true
        });
    }

    // Maintenance operations
    async performMaintenance() {
        try {
            logger.info('🔧 Performing database maintenance...');

            const retentionDays = config.get('analytics.retention.messages');
            const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

            // Clean old messages
            const deletedMessages = await this.models.Message.destroy({
                where: {
                    created_at: { [Op.lt]: cutoffDate }
                },
                force: true
            });

            // Clean old analytics events
            const deletedEvents = await this.models.AnalyticsEvent.destroy({
                where: {
                    timestamp: { [Op.lt]: cutoffDate }
                },
                force: true
            });

            // Clean old health checks
            const deletedHealthChecks = await this.models.HealthCheck.destroy({
                where: {
                    timestamp: { [Op.lt]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
                },
                force: true
            });

            // Vacuum and analyze (PostgreSQL)
            if (config.get('database.type') === 'postgres') {
                await this.sequelize.query('VACUUM ANALYZE;');
            }

            logger.info(`✅ Database maintenance completed: ${deletedMessages} messages, ${deletedEvents} events, ${deletedHealthChecks} health checks deleted`);

        } catch (error) {
            logger.error('💥 Database maintenance failed:', error);
            throw error;
        }
    }

    // Health check
    async healthCheck() {
        try {
            const start = Date.now();
            await this.sequelize.authenticate();
            const responseTime = Date.now() - start;

            return {
                status: 'healthy',
                responseTime,
                connected: this.isConnected,
                poolSize: this.sequelize.connectionManager.pool.size,
                activeConnections: this.sequelize.connectionManager.pool.used,
                idleConnections: this.sequelize.connectionManager.pool.available
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                connected: false
            };
        }
    }

    // Backup operations
    async createBackup() {
        try {
            logger.info('💾 Creating database backup...');
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = path.join(__dirname, '..', 'backups', `backup-${timestamp}.sql`);
            
            // Ensure backup directory exists
            await fs.mkdir(path.dirname(backupPath), { recursive: true });
            
            if (config.get('database.type') === 'postgres') {
                const { spawn } = require('child_process');
                const pg_dump = spawn('pg_dump', [
                    '-h', config.get('database.host'),
                    '-p', config.get('database.port'),
                    '-U', config.get('database.username'),
                    '-d', config.get('database.name'),
                    '-f', backupPath
                ]);
                
                return new Promise((resolve, reject) => {
                    pg_dump.on('exit', (code) => {
                        if (code === 0) {
                            logger.info(`✅ Database backup created: ${backupPath}`);
                            resolve(backupPath);
                        } else {
                            reject(new Error(`pg_dump exited with code ${code}`));
                        }
                    });
                });
            } else {
                // SQLite backup
                const sqlite3 = require('sqlite3');
                const db = new sqlite3.Database(config.get('database.name'));
                
                return new Promise((resolve, reject) => {
                    db.backup(backupPath, (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            logger.info(`✅ Database backup created: ${backupPath}`);
                            resolve(backupPath);
                        }
                        db.close();
                    });
                });
            }
        } catch (error) {
            logger.error('💥 Database backup failed:', error);
            throw error;
        }
    }

    // Close connection
    async close() {
        if (this.sequelize) {
            await this.sequelize.close();
            this.isConnected = false;
            logger.info('🔒 Database connection closed');
        }
    }

    // Getters
    getSequelize() {
        return this.sequelize;
    }

    getModels() {
        return this.models;
    }

    isHealthy() {
        return this.isConnected;
    }
}

module.exports = Database;