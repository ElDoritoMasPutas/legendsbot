// Enhanced Discord Logger v9.0
const { EmbedBuilder } = require('discord.js');
const config = require('../config/config.js');

class EnhancedDiscordLogger {
    constructor(serverManager) {
        this.serverManager = serverManager;
        this.logCounts = {
            info: 0,
            warning: 0,
            error: 0,
            success: 0,
            moderation: 0,
            translation: 0,
            multi_language: 0,
            hourly_report: 0,
            synthia_intelligence: 0,
            elongated_detection: 0,
            multiapi: 0,
            performance: 0
        };
        this.hourlyStats = new Map();
    }

    async sendLog(guild, type, title, description, fields = [], color = null) {
        if (!guild) return;

        let logChannels = this.serverManager.getLogChannels(guild.id);
        
        // Auto-setup if no log channels configured
        if (logChannels.length === 0) {
            console.log(`🔄 No log channels for ${guild.name}, attempting auto-setup...`);
            const autoChannel = await this.serverManager.autoSetupLogChannel(guild);
            if (autoChannel) {
                logChannels = [autoChannel.id];
            } else {
                console.log(`⚠️ No log channels configured for ${guild.name}. Use !synthia loghere to set up logging.`);
                return;
            }
        }

        this.logCounts[type] = (this.logCounts[type] || 0) + 1;

        const embed = new EmbedBuilder()
            .setColor(color || config.colors[type] || config.colors.primary)
            .setTitle(title)
            .setDescription(description)
            .setFooter({ 
                text: `Synthia v${config.aiVersion} Multi-API System • ${type.toUpperCase()} #${this.logCounts[type]}`,
                iconURL: guild.client.user?.displayAvatarURL() 
            })
            .setTimestamp();

        if (fields.length > 0) {
            const safeFields = fields.map(field => ({
                name: String(field.name || 'Unknown'),
                value: String(field.value || 'N/A').slice(0, 1024),
                inline: Boolean(field.inline)
            }));
            embed.addFields(safeFields.slice(0, 25));
        }

        embed.setAuthor({
            name: 'Synthia AI v9.0 - Enhanced Multi-API Intelligence',
            iconURL: guild.client.user?.displayAvatarURL()
        });

        for (const channelId of logChannels) {
            try {
                const channel = guild.channels.cache.get(channelId);
                if (channel && channel.isTextBased()) {
                    await channel.send({ embeds: [embed] });
                } else {
                    this.serverManager.removeLogChannel(guild.id, channelId);
                    console.log(`🗑️ Removed invalid log channel ${channelId} from ${guild.name}`);
                }
            } catch (error) {
                console.error(`❌ Failed to send log to channel ${channelId}:`, error);
                if (error.code === 50013 || error.code === 10003) {
                    await this.serverManager.autoSetupLogChannel(guild);
                }
            }
        }
    }

    async logModeration(guild, action, user, reason, details = {}) {
        const fields = [
            { name: '👤 User', value: `${user.tag}\n${user.id}`, inline: true },
            { name: '⚡ Action', value: action.toUpperCase(), inline: true },
            { name: '🧠 AI System', value: `Enhanced Synthia v${config.aiVersion}`, inline: true },
            { name: '📝 Reason', value: reason || 'No reason provided', inline: false }
        ];

        if (details.originalLanguage && details.originalLanguage !== 'English') {
            fields.push(
                { name: '🌍 Original Language', value: details.originalLanguage, inline: true },
                { name: '🔄 Translation Provider', value: details.provider || 'Multi-API', inline: true }
            );
        }

        if (details.elongatedWords && details.elongatedWords.length > 0) {
            fields.push({
                name: '🔍 Elongated Words Detected',
                value: details.elongatedWords.map(w => `${w.original} → ${w.normalized}`).join('\n').slice(0, 1024),
                inline: false
            });
        }

        await this.sendLog(
            guild,
            'moderation',
            `⚖️ Enhanced Moderation: ${action.toUpperCase()}`,
            `Multi-API enhanced moderation action taken`,
            fields,
            config.colors.moderation
        );
    }

    async logTranslation(guild, originalText, translatedText, sourceLang, targetLang, user, provider, responseTime, isAutoTranslation = false) {
        const fields = [
            { name: '👤 User', value: `${user.tag} (${user.id})`, inline: true },
            { name: '🌍 Translation', value: `${sourceLang} → ${targetLang}`, inline: true },
            { name: '🔧 Provider', value: provider, inline: true },
            { name: '⚡ Response Time', value: `${responseTime}ms`, inline: true },
            { name: '🤖 Type', value: isAutoTranslation ? 'Auto-Translation' : 'Manual Translation', inline: true },
            { name: '📝 Original Text', value: originalText.slice(0, 500), inline: false },
            { name: '🌟 Translated Text', value: translatedText.slice(0, 500), inline: false }
        ];

        await this.sendLog(
            guild,
            'translation',
            `🌍 Enhanced ${isAutoTranslation ? 'Auto-' : ''}Translation`,
            `Advanced ${isAutoTranslation ? 'automatic ' : ''}translation with provider rotation`,
            fields,
            config.colors.translation
        );
    }
}

module.exports = EnhancedDiscordLogger;