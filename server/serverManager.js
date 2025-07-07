// Server Configuration Manager v9.0
const fs = require('fs').promises;
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const config = require('../config/config.js');

class ServerConfigManager {
    constructor() {
        this.serverConfigs = new Map();
        this.configPath = 'data/server_configs.json';
        this.loadConfigs();
    }

    async loadConfigs() {
        try {
            const data = await fs.readFile(this.configPath, 'utf8');
            const configs = JSON.parse(data);
            this.serverConfigs = new Map(configs.servers || []);
            
            // Apply default values to existing configs
            for (const [guildId, configData] of this.serverConfigs) {
                let needsUpdate = false;
                
                if (configData.autoModeration === undefined) {
                    configData.autoModeration = true;
                    needsUpdate = true;
                }
                
                if (configData.hourlyReports === undefined) {
                    configData.hourlyReports = true;
                    needsUpdate = true;
                }
                
                if (configData.language === undefined) {
                    configData.language = 'en';
                    needsUpdate = true;
                }
                
                if (configData.defaultTranslateTo === undefined) {
                    configData.defaultTranslateTo = 'en';
                    needsUpdate = true;
                }
                
                if (configData.autoTranslate === undefined) {
                    configData.autoTranslate = false;
                    needsUpdate = true;
                }
                
                if (configData.elongatedDetection === undefined) {
                    configData.elongatedDetection = true;
                    needsUpdate = true;
                }
                
                if (configData.multiLanguage === undefined) {
                    configData.multiLanguage = true;
                    needsUpdate = true;
                }
                
                if (configData.multiApiEnabled === undefined) {
                    configData.multiApiEnabled = true;
                    needsUpdate = true;
                }
                
                if (needsUpdate) {
                    configData.lastUpdated = Date.now();
                }
            }
            
            console.log(`✅ Loaded configs for ${this.serverConfigs.size} servers with defaults applied`);
            
            if (this.serverConfigs.size > 0) {
                await this.saveConfigs();
            }
        } catch (error) {
            console.log('📁 Creating fresh server configs...');
            await this.saveConfigs();
        }
    }

    async saveConfigs() {
        try {
            await fs.mkdir('data', { recursive: true });
            const configData = {
                servers: Array.from(this.serverConfigs.entries()),
                lastUpdated: Date.now(),
                version: '9.0'
            };
            await fs.writeFile(this.configPath, JSON.stringify(configData, null, 2));
            console.log('💾 Server configs saved successfully');
        } catch (error) {
            console.error('❌ Failed to save server configs:', error);
        }
    }

    addLogChannel(guildId, channelId, guildName = 'Unknown') {
        if (!this.serverConfigs.has(guildId)) {
            this.serverConfigs.set(guildId, {
                logChannels: [],
                guildName: guildName,
                createdAt: Date.now(),
                lastUpdated: Date.now(),
                hourlyReports: true,
                language: 'en',
                defaultTranslateTo: 'en',
                autoTranslate: false,
                autoModeration: true,
                elongatedDetection: true,
                multiLanguage: true,
                multiApiEnabled: true,
                autoSetupCompleted: false
            });
        }
        
        const configData = this.serverConfigs.get(guildId);
        if (channelId && !configData.logChannels.includes(channelId)) {
            configData.logChannels.push(channelId);
            configData.lastUpdated = Date.now();
            this.saveConfigs();
            return true;
        }
        return false;
    }

    async autoSetupLogChannel(guild) {
        const configData = this.serverConfigs.get(guild.id);
        if (configData && configData.autoSetupCompleted) return null;

        try {
            let logChannel = null;

            // Look for existing log channels
            const existingLogChannels = guild.channels.cache.filter(ch => 
                ch.isTextBased() && 
                (ch.name.includes('log') || ch.name.includes('synthia') || ch.name.includes('mod'))
            );

            if (existingLogChannels.size > 0) {
                logChannel = existingLogChannels.first();
            } else {
                // Try to use system messages channel
                if (guild.systemChannel && guild.systemChannel.isTextBased()) {
                    logChannel = guild.systemChannel;
                } else {
                    // Create new log channel if bot has permissions
                    if (guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
                        try {
                            logChannel = await guild.channels.create({
                                name: 'synthia-logs',
                                type: 0,
                                topic: 'Enhanced Synthia v9.0 Multi-API Logs & Moderation',
                                permissionOverwrites: [
                                    {
                                        id: guild.roles.everyone.id,
                                        deny: [PermissionsBitField.Flags.SendMessages],
                                        allow: [PermissionsBitField.Flags.ViewChannel]
                                    }
                                ]
                            });
                        } catch (error) {
                            console.log(`⚠️ Could not create log channel for ${guild.name}: ${error.message}`);
                        }
                    }
                }
            }

            if (logChannel) {
                this.addLogChannel(guild.id, logChannel.id, guild.name);
                
                const updatedConfig = this.serverConfigs.get(guild.id);
                updatedConfig.autoSetupCompleted = true;
                this.saveConfigs();

                try {
                    const welcomeEmbed = new EmbedBuilder()
                        .setTitle('🚀 Enhanced Synthia v9.0 Setup Complete!')
                        .setDescription('Multi-API Intelligence System has been automatically configured for this server.')
                        .addFields(
                            { name: '📡 Log Channel', value: `${logChannel}`, inline: true },
                            { name: '🧠 AI Features', value: 'Multi-language moderation enabled', inline: true },
                            { name: '🔄 Translation APIs', value: '9 providers ready', inline: true },
                            { name: '🛠️ Setup Commands', value: '`!synthia help` - View all commands\n`!synthia status` - System status', inline: false },
                            { name: '⚙️ Configuration', value: '`/set-server-language` - Set default language\n`/auto-translate` - Enable auto-translation', inline: false }
                        )
                        .setColor(config.colors.success)
                        .setFooter({ text: `Enhanced Synthia v${config.aiVersion} Multi-API System` });

                    await logChannel.send({ embeds: [welcomeEmbed] });
                } catch (error) {
                    console.log(`⚠️ Could not send welcome message: ${error.message}`);
                }

                console.log(`✅ Auto-setup completed for ${guild.name} using channel: ${logChannel.name}`);
                return logChannel;
            }
        } catch (error) {
            console.error(`❌ Auto-setup failed for ${guild.name}:`, error);
        }

        return null;
    }

    removeLogChannel(guildId, channelId) {
        if (!this.serverConfigs.has(guildId)) return false;
        
        const configData = this.serverConfigs.get(guildId);
        const index = configData.logChannels.indexOf(channelId);
        if (index > -1) {
            configData.logChannels.splice(index, 1);
            configData.lastUpdated = Date.now();
            this.saveConfigs();
            return true;
        }
        return false;
    }

    getLogChannels(guildId) {
        const configData = this.serverConfigs.get(guildId);
        return configData ? configData.logChannels : [];
    }

    getServerConfig(guildId) {
        return this.serverConfigs.get(guildId) || null;
    }

    isAutoModerationEnabled(guildId) {
        const configData = this.serverConfigs.get(guildId);
        return configData ? (configData.autoModeration !== false) : true;
    }

    setHourlyReports(guildId, enabled) {
        const configData = this.serverConfigs.get(guildId);
        if (configData) {
            configData.hourlyReports = enabled;
            configData.lastUpdated = Date.now();
            this.saveConfigs();
            return true;
        }
        return false;
    }

    updateServerSetting(guildId, setting, value) {
        if (!this.serverConfigs.has(guildId)) {
            this.addLogChannel(guildId, null);
        }
        
        const configData = this.serverConfigs.get(guildId);
        configData[setting] = value;
        configData.lastUpdated = Date.now();
        
        // Force save immediately for important settings
        this.saveConfigs();
        
        console.log(`⚙️ Updated ${setting} to ${value} for guild ${guildId}`);
        return true;
    }

    // Helper method to get auto-translate status
    isAutoTranslateEnabled(guildId) {
        const configData = this.serverConfigs.get(guildId);
        return configData ? (configData.autoTranslate === true) : false;
    }
}

module.exports = ServerConfigManager;