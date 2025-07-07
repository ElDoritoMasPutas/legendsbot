const config = require('../config/enhanced-config.js');
const Logger = require('../logging/enhanced-logger.js');

class EnhancedServerManager {
    constructor(database, cache) {
        this.database = database;
        this.cache = cache;
        this.logger = new Logger('ServerManager');
        this.initialized = false;
        
        this.guildSettings = new Map();
        this.guildStatistics = new Map();
        this.defaultSettings = {
            // General Settings
            prefix: '!',
            language: 'en',
            timezone: 'UTC',
            
            // Moderation Settings
            automod: {
                enabled: true,
                level: 'medium',
                logChannel: null,
                exemptRoles: [],
                actions: {
                    spam: 'warn',
                    toxicity: 'mute',
                    threats: 'ban'
                }
            },
            
            // Welcome/Leave Settings
            welcome: {
                enabled: false,
                channel: null,
                message: 'Welcome {user} to {server}!',
                dm: false,
                role: null
            },
            
            leave: {
                enabled: false,
                channel: null,
                message: '{user} has left {server}'
            },
            
            // Logging Settings
            logging: {
                enabled: true,
                channels: {
                    moderation: null,
                    member: null,
                    message: null,
                    voice: null,
                    server: null
                },
                events: {
                    memberJoin: true,
                    memberLeave: true,
                    messageDelete: true,
                    messageEdit: true,
                    voiceJoin: true,
                    voiceLeave: true,
                    roleUpdate: true,
                    channelUpdate: true
                }
            },
            
            // AI Settings
            ai: {
                enabled: true,
                autoRespond: false,
                responseChance: 0.1,
                channels: [],
                blockedChannels: []
            },
            
            // Translation Settings
            translation: {
                enabled: false,
                autoTranslate: false,
                defaultLanguage: 'en',
                allowedLanguages: ['en', 'es', 'fr', 'de'],
                channels: []
            },
            
            // Analytics Settings
            analytics: {
                enabled: true,
                publicStats: false,
                retention: 30 // days
            },
            
            // Feature Toggles
            features: {
                commands: true,
                music: false,
                games: false,
                economy: false,
                tickets: false,
                polls: false,
                giveaways: false
            }
        };
        
        this.stats = {
            guildsManaged: 0,
            settingsUpdated: 0,
            configsLoaded: 0,
            errors: 0
        };
    }

    async initialize() {
        try {
            this.logger.info('Initializing Enhanced Server Manager...');
            
            // Load existing guild settings
            await this.loadAllGuildSettings();
            
            // Setup periodic tasks
            this.setupPeriodicTasks();
            
            this.initialized = true;
            this.logger.info('Enhanced Server Manager initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize Enhanced Server Manager:', error);
            throw error;
        }
    }

    async setupNewGuild(guild) {
        try {
            this.logger.info(`Setting up new guild: ${guild.name} (${guild.id})`);
            
            // Create database entry
            const guildData = await this.database.models.Guild.findOrCreate({
                where: { id: guild.id },
                defaults: {
                    id: guild.id,
                    name: guild.name,
                    ownerId: guild.ownerId,
                    memberCount: guild.memberCount,
                    settings: this.defaultSettings,
                    features: guild.features || [],
                    joinedAt: new Date(),
                    isActive: true
                }
            });
            
            // Initialize settings
            const settings = { ...this.defaultSettings };
            this.guildSettings.set(guild.id, settings);
            
            // Cache settings
            await this.cache.cacheGuildSettings(guild.id, settings);
            
            // Initialize statistics
            const stats = {
                memberCount: guild.memberCount,
                messageCount: 0,
                commandsUsed: 0,
                moderationActions: 0,
                lastActivity: new Date(),
                createdAt: new Date()
            };
            
            this.guildStatistics.set(guild.id, stats);
            
            // Setup default channels if possible
            await this.setupDefaultChannels(guild);
            
            // Send welcome message to owner if possible
            await this.sendWelcomeMessage(guild);
            
            this.stats.guildsManaged++;
            this.logger.logGuildEvent(guild.id, 'GUILD_SETUP_COMPLETE', { memberCount: guild.memberCount });
            
            return { success: true, settings, stats };
            
        } catch (error) {
            this.logger.error(`Failed to setup guild ${guild.id}:`, error);
            this.stats.errors++;
            return { success: false, error: error.message };
        }
    }

    async getGuildSettings(guildId) {
        try {
            // Check cache first
            if (this.guildSettings.has(guildId)) {
                return this.guildSettings.get(guildId);
            }
            
            // Check Redis cache
            const cachedSettings = await this.cache.getGuildSettings(guildId);
            if (cachedSettings) {
                this.guildSettings.set(guildId, cachedSettings);
                return cachedSettings;
            }
            
            // Load from database
            const guild = await this.database.models.Guild.findByPk(guildId);
            if (guild && guild.settings) {
                const settings = { ...this.defaultSettings, ...guild.settings };
                this.guildSettings.set(guildId, settings);
                await this.cache.cacheGuildSettings(guildId, settings);
                return settings;
            }
            
            // Return default settings if not found
            const defaultSettings = { ...this.defaultSettings };
            this.guildSettings.set(guildId, defaultSettings);
            return defaultSettings;
            
        } catch (error) {
            this.logger.error(`Failed to get guild settings for ${guildId}:`, error);
            return { ...this.defaultSettings };
        }
    }

    async updateGuildSettings(guildId, updates) {
        try {
            const currentSettings = await this.getGuildSettings(guildId);
            const newSettings = this.mergeSettings(currentSettings, updates);
            
            // Validate settings
            const validation = this.validateSettings(newSettings);
            if (!validation.valid) {
                throw new Error(`Invalid settings: ${validation.errors.join(', ')}`);
            }
            
            // Update in memory
            this.guildSettings.set(guildId, newSettings);
            
            // Update cache
            await this.cache.cacheGuildSettings(guildId, newSettings);
            
            // Update database
            await this.database.models.Guild.upsert({
                id: guildId,
                settings: newSettings
            });
            
            this.stats.settingsUpdated++;
            this.logger.logGuildEvent(guildId, 'SETTINGS_UPDATED', { updates });
            
            return { success: true, settings: newSettings };
            
        } catch (error) {
            this.logger.error(`Failed to update guild settings for ${guildId}:`, error);
            this.stats.errors++;
            return { success: false, error: error.message };
        }
    }

    async resetGuildSettings(guildId) {
        try {
            const defaultSettings = { ...this.defaultSettings };
            
            // Update in memory
            this.guildSettings.set(guildId, defaultSettings);
            
            // Update cache
            await this.cache.cacheGuildSettings(guildId, defaultSettings);
            
            // Update database
            await this.database.models.Guild.update(
                { settings: defaultSettings },
                { where: { id: guildId } }
            );
            
            this.logger.logGuildEvent(guildId, 'SETTINGS_RESET', {});
            
            return { success: true, settings: defaultSettings };
            
        } catch (error) {
            this.logger.error(`Failed to reset guild settings for ${guildId}:`, error);
            return { success: false, error: error.message };
        }
    }

    async getGuildStatistics(guildId) {
        try {
            // Check cache first
            if (this.guildStatistics.has(guildId)) {
                return this.guildStatistics.get(guildId);
            }
            
            // Calculate from database
            const stats = await this.calculateGuildStatistics(guildId);
            this.guildStatistics.set(guildId, stats);
            
            return stats;
            
        } catch (error) {
            this.logger.error(`Failed to get guild statistics for ${guildId}:`, error);
            return null;
        }
    }

    async calculateGuildStatistics(guildId) {
        try {
            const guild = await this.database.models.Guild.findByPk(guildId);
            if (!guild) return null;
            
            // Count messages
            const messageCount = await this.database.models.Message.count({
                where: { guildId }
            });
            
            // Count unique users
            const uniqueUsers = await this.database.models.Message.count({
                distinct: true,
                col: 'userId',
                where: { guildId }
            });
            
            // Count moderation actions
            const moderationActions = await this.database.models.ModerationAction.count({
                where: { guildId }
            });
            
            // Calculate activity metrics
            const now = new Date();
            const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            
            const dailyMessages = await this.database.models.Message.count({
                where: {
                    guildId,
                    createdAt: { [this.database.sequelize.Op.gte]: oneDayAgo }
                }
            });
            
            const weeklyMessages = await this.database.models.Message.count({
                where: {
                    guildId,
                    createdAt: { [this.database.sequelize.Op.gte]: oneWeekAgo }
                }
            });
            
            const stats = {
                memberCount: guild.memberCount,
                messageCount,
                uniqueUsers,
                moderationActions,
                dailyMessages,
                weeklyMessages,
                avgDailyMessages: weeklyMessages / 7,
                lastActivity: await this.getLastActivity(guildId),
                joinedAt: guild.joinedAt,
                updatedAt: new Date()
            };
            
            return stats;
            
        } catch (error) {
            this.logger.error(`Failed to calculate guild statistics for ${guildId}:`, error);
            return null;
        }
    }

    async getLastActivity(guildId) {
        try {
            const lastMessage = await this.database.models.Message.findOne({
                where: { guildId },
                order: [['createdAt', 'DESC']]
            });
            
            return lastMessage ? lastMessage.createdAt : null;
        } catch (error) {
            return null;
        }
    }

    async updateGuildStatistics(guildId, updates) {
        try {
            const currentStats = this.guildStatistics.get(guildId) || {};
            const newStats = { ...currentStats, ...updates, updatedAt: new Date() };
            
            this.guildStatistics.set(guildId, newStats);
            
            // Cache the statistics
            await this.cache.set(`guild_stats:${guildId}`, newStats, 3600); // 1 hour
            
        } catch (error) {
            this.logger.error(`Failed to update guild statistics for ${guildId}:`, error);
        }
    }

    async setupDefaultChannels(guild) {
        try {
            const channels = guild.channels.cache;
            const settings = await this.getGuildSettings(guild.id);
            
            // Find or suggest moderation log channel
            let modLogChannel = channels.find(c => 
                c.name.includes('mod') && c.name.includes('log') && c.isTextBased()
            );
            
            if (modLogChannel) {
                settings.automod.logChannel = modLogChannel.id;
                settings.logging.channels.moderation = modLogChannel.id;
            }
            
            // Find or suggest general channel for welcome messages
            let generalChannel = channels.find(c => 
                (c.name === 'general' || c.name === 'chat') && c.isTextBased()
            );
            
            if (generalChannel) {
                settings.welcome.channel = generalChannel.id;
                settings.leave.channel = generalChannel.id;
            }
            
            // Update settings if we found any channels
            if (modLogChannel || generalChannel) {
                await this.updateGuildSettings(guild.id, settings);
            }
            
        } catch (error) {
            this.logger.error(`Failed to setup default channels for guild ${guild.id}:`, error);
        }
    }

    async sendWelcomeMessage(guild) {
        try {
            const owner = await guild.fetchOwner();
            if (owner) {
                const embed = {
                    color: 0x0099ff,
                    title: '🎉 Welcome to Synthia AI Premium!',
                    description: 'Thank you for adding Synthia AI to your server!',
                    fields: [
                        {
                            name: '🚀 Getting Started',
                            value: 'Use `/help` to see all available commands.',
                            inline: false
                        },
                        {
                            name: '⚙️ Configuration',
                            value: 'Use `/config` to customize your server settings.',
                            inline: false
                        },
                        {
                            name: '📊 Analytics',
                            value: 'Visit our web dashboard to view detailed analytics.',
                            inline: false
                        },
                        {
                            name: '🔗 Useful Links',
                            value: '[Documentation](https://synthia-ai.com/docs) | [Support](https://synthia-ai.com/support) | [Dashboard](https://dashboard.synthia-ai.com)',
                            inline: false
                        }
                    ],
                    footer: {
                        text: 'Synthia AI Premium v10.0 • Enterprise-Grade Discord Intelligence'
                    },
                    timestamp: new Date().toISOString()
                };
                
                await owner.send({ embeds: [embed] });
            }
        } catch (error) {
            this.logger.debug('Could not send welcome message to guild owner:', error);
        }
    }

    mergeSettings(current, updates) {
        const merged = { ...current };
        
        for (const [key, value] of Object.entries(updates)) {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                merged[key] = { ...merged[key], ...value };
            } else {
                merged[key] = value;
            }
        }
        
        return merged;
    }

    validateSettings(settings) {
        const errors = [];
        
        try {
            // Validate prefix
            if (settings.prefix && settings.prefix.length > 5) {
                errors.push('Prefix must be 5 characters or less');
            }
            
            // Validate language
            const supportedLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'];
            if (settings.language && !supportedLanguages.includes(settings.language)) {
                errors.push(`Unsupported language: ${settings.language}`);
            }
            
            // Validate automod level
            const validLevels = ['off', 'low', 'medium', 'high', 'strict'];
            if (settings.automod?.level && !validLevels.includes(settings.automod.level)) {
                errors.push(`Invalid automod level: ${settings.automod.level}`);
            }
            
            // Validate channels (if provided, they should be valid snowflakes)
            const channelFields = [
                'automod.logChannel',
                'welcome.channel',
                'leave.channel'
            ];
            
            for (const field of channelFields) {
                const value = this.getNestedValue(settings, field);
                if (value && (typeof value !== 'string' || !/^\d{17,19}$/.test(value))) {
                    errors.push(`Invalid channel ID for ${field}`);
                }
            }
            
            return { valid: errors.length === 0, errors };
            
        } catch (error) {
            errors.push(`Validation error: ${error.message}`);
            return { valid: false, errors };
        }
    }

    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    async loadAllGuildSettings() {
        try {
            const guilds = await this.database.models.Guild.findAll({
                where: { isActive: true }
            });
            
            for (const guild of guilds) {
                const settings = { ...this.defaultSettings, ...guild.settings };
                this.guildSettings.set(guild.id, settings);
                
                // Cache settings
                await this.cache.cacheGuildSettings(guild.id, settings);
            }
            
            this.stats.configsLoaded = guilds.length;
            this.stats.guildsManaged = guilds.length;
            
            this.logger.info(`Loaded settings for ${guilds.length} guilds`);
            
        } catch (error) {
            this.logger.error('Failed to load guild settings:', error);
        }
    }

    setupPeriodicTasks() {
        // Update statistics every 15 minutes
        setInterval(async () => {
            await this.updateAllGuildStatistics();
        }, 900000); // 15 minutes
        
        // Sync settings to database every hour
        setInterval(async () => {
            await this.syncSettingsToDatabase();
        }, 3600000); // 1 hour
        
        // Clean up inactive guilds daily
        setInterval(async () => {
            await this.cleanupInactiveGuilds();
        }, 86400000); // 24 hours
    }

    async updateAllGuildStatistics() {
        try {
            for (const [guildId] of this.guildSettings) {
                const stats = await this.calculateGuildStatistics(guildId);
                if (stats) {
                    this.guildStatistics.set(guildId, stats);
                }
            }
        } catch (error) {
            this.logger.error('Failed to update all guild statistics:', error);
        }
    }

    async syncSettingsToDatabase() {
        try {
            let syncCount = 0;
            
            for (const [guildId, settings] of this.guildSettings) {
                await this.database.models.Guild.update(
                    { settings },
                    { where: { id: guildId } }
                );
                syncCount++;
            }
            
            this.logger.debug(`Synced settings for ${syncCount} guilds to database`);
            
        } catch (error) {
            this.logger.error('Failed to sync settings to database:', error);
        }
    }

    async cleanupInactiveGuilds() {
        try {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            
            const inactiveGuilds = await this.database.models.Guild.findAll({
                where: {
                    isActive: true,
                    [this.database.sequelize.Op.or]: [
                        { 
                            updatedAt: { 
                                [this.database.sequelize.Op.lt]: thirtyDaysAgo 
                            } 
                        }
                    ]
                }
            });
            
            for (const guild of inactiveGuilds) {
                // Check if we still have message activity
                const recentMessages = await this.database.models.Message.count({
                    where: {
                        guildId: guild.id,
                        createdAt: { [this.database.sequelize.Op.gte]: thirtyDaysAgo }
                    }
                });
                
                if (recentMessages === 0) {
                    // Mark as inactive
                    await this.database.models.Guild.update(
                        { isActive: false },
                        { where: { id: guild.id } }
                    );
                    
                    // Remove from memory
                    this.guildSettings.delete(guild.id);
                    this.guildStatistics.delete(guild.id);
                    
                    // Remove from cache
                    await this.cache.del(`guild_settings:${guild.id}`);
                    await this.cache.del(`guild_stats:${guild.id}`);
                    
                    this.logger.info(`Marked guild ${guild.id} as inactive due to no activity`);
                }
            }
            
        } catch (error) {
            this.logger.error('Failed to cleanup inactive guilds:', error);
        }
    }

    async exportGuildSettings(guildId) {
        try {
            const settings = await this.getGuildSettings(guildId);
            const stats = await this.getGuildStatistics(guildId);
            
            return {
                guildId,
                settings,
                statistics: stats,
                exportedAt: new Date().toISOString(),
                version: '10.0.0'
            };
            
        } catch (error) {
            this.logger.error(`Failed to export guild settings for ${guildId}:`, error);
            return null;
        }
    }

    async importGuildSettings(guildId, data) {
        try {
            if (!data.settings) {
                throw new Error('No settings found in import data');
            }
            
            // Validate imported settings
            const validation = this.validateSettings(data.settings);
            if (!validation.valid) {
                throw new Error(`Invalid settings: ${validation.errors.join(', ')}`);
            }
            
            // Import settings
            const result = await this.updateGuildSettings(guildId, data.settings);
            
            this.logger.logGuildEvent(guildId, 'SETTINGS_IMPORTED', { 
                version: data.version,
                importedAt: new Date().toISOString()
            });
            
            return result;
            
        } catch (error) {
            this.logger.error(`Failed to import guild settings for ${guildId}:`, error);
            return { success: false, error: error.message };
        }
    }

    getStats() {
        return {
            ...this.stats,
            guildsInMemory: this.guildSettings.size,
            statisticsInMemory: this.guildStatistics.size,
            initialized: this.initialized
        };
    }

    isInitialized() {
        return this.initialized;
    }
}

module.exports = EnhancedServerManager;