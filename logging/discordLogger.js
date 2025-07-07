// Enhanced Discord Logger v9.0 - logging/discordLogger.js
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const config = require('../config/config.js');

class EnhancedDiscordLogger {
    constructor(serverManager) {
        this.serverManager = serverManager;
        this.logQueue = new Map(); // For rate limiting
        this.setupRateLimiting();
        console.log('📝 Enhanced Discord Logger v9.0 initialized');
    }

    setupRateLimiting() {
        // Clear rate limit queues every minute
        setInterval(() => {
            this.logQueue.clear();
        }, 60000);
    }

    async getLogChannel(guild, type = 'main') {
        try {
            const serverConfig = this.serverManager.getServerConfig(guild.id);
            if (!serverConfig || !serverConfig.logChannels) {
                return null;
            }

            // Find appropriate log channel
            const logChannel = serverConfig.logChannels.find(ch => ch.type === type) || 
                             serverConfig.logChannels.find(ch => ch.type === 'main') ||
                             serverConfig.logChannels[0];

            if (!logChannel) return null;

            const channel = guild.channels.cache.get(logChannel.id);
            if (!channel || !channel.isTextBased()) return null;

            // Check permissions
            const permissions = channel.permissionsFor(guild.members.me);
            if (!permissions.has(PermissionsBitField.Flags.SendMessages) || 
                !permissions.has(PermissionsBitField.Flags.EmbedLinks)) {
                return null;
            }

            return channel;
        } catch (error) {
            console.error('Error getting log channel:', error);
            return null;
        }
    }

    async sendLog(guild, type, title, description, fields = [], color = null) {
        try {
            const logChannel = await this.getLogChannel(guild, 'main');
            if (!logChannel) return false;

            // Rate limiting
            const key = `${guild.id}-${type}`;
            const now = Date.now();
            const lastLog = this.logQueue.get(key) || 0;
            
            if (now - lastLog < 5000) { // 5 second rate limit per type per guild
                return false;
            }
            this.logQueue.set(key, now);

            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(description)
                .setColor(color || this.getColorForType(type))
                .setTimestamp()
                .setFooter({ 
                    text: `Enhanced Synthia v${config.aiVersion}`,
                    iconURL: guild.client.user?.displayAvatarURL()
                });

            if (fields && fields.length > 0) {
                embed.addFields(fields.slice(0, 25)); // Discord limit
            }

            await logChannel.send({ embeds: [embed] });
            return true;

        } catch (error) {
            console.error('Failed to send Discord log:', error.message);
            return false;
        }
    }

    async logModeration(guild, action, user, reason, extraFields = {}) {
        const fields = [
            { name: '👤 User', value: `${user.tag}\n(${user.id})`, inline: true },
            { name: '⚖️ Action', value: action.toUpperCase(), inline: true },
            { name: '📝 Reason', value: reason.slice(0, 1024), inline: false }
        ];

        // Add extra fields
        for (const [key, value] of Object.entries(extraFields)) {
            fields.push({ 
                name: key, 
                value: String(value).slice(0, 1024), 
                inline: true 
            });
        }

        await this.sendLog(
            guild,
            'moderation',
            `🛡️ ${action.toUpperCase()} Action`,
            `Moderation action taken against ${user.tag}`,
            fields,
            config.colors.moderation
        );
    }

    async logTranslation(guild, originalText, translatedText, fromLang, toLang, user, provider, responseTime, autoTranslate = false) {
        const fields = [
            { name: '👤 User', value: user.tag, inline: true },
            { name: '🌍 Translation', value: `${fromLang} → ${toLang}`, inline: true },
            { name: '🔧 Provider', value: provider, inline: true },
            { name: '⚡ Response Time', value: `${responseTime}ms`, inline: true },
            { name: '🤖 Auto-Translate', value: autoTranslate ? 'Yes' : 'No', inline: true },
            { name: '📝 Original', value: `\`\`\`${originalText.slice(0, 500)}\`\`\``, inline: false },
            { name: '🌟 Translation', value: `\`\`\`${translatedText.slice(0, 500)}\`\`\``, inline: false }
        ];

        await this.sendLog(
            guild,
            'translation',
            '🌍 Translation Performed',
            `Message translated from ${fromLang} to ${toLang}`,
            fields,
            config.colors.translation
        );
    }

    async logAIAnalysis(guild, analysis, user, message) {
        const fields = [
            { name: '👤 User', value: `${user.tag}\n(${user.id})`, inline: true },
            { name: '🔥 Threat Level', value: `${analysis.threatLevel}/10`, inline: true },
            { name: '🧠 Confidence', value: `${analysis.confidence}%`, inline: true },
            { name: '🌍 Language', value: analysis.language?.originalLanguage || 'Unknown', inline: true },
            { name: '⚡ Processing Time', value: `${analysis.processingTime}ms`, inline: true },
            { name: '🔍 Bypass Detected', value: analysis.bypassDetected ? '🚨 YES' : '✅ NO', inline: true }
        ];

        if (analysis.violationType) {
            fields.push({ name: '⚖️ Violation', value: analysis.violationType, inline: true });
        }

        if (analysis.multiApiUsed) {
            fields.push({ name: '🤖 Multi-API', value: '✅ Used', inline: true });
        }

        if (analysis.reasoning && analysis.reasoning.length > 0) {
            fields.push({ 
                name: '🧠 AI Reasoning', 
                value: analysis.reasoning.slice(0, 3).join('\n• ').slice(0, 1024), 
                inline: false 
            });
        }

        if (message && message.content) {
            fields.push({ 
                name: '📝 Message Content', 
                value: `\`\`\`${message.content.slice(0, 500)}\`\`\``, 
                inline: false 
            });
        }

        await this.sendLog(
            guild,
            'ai',
            '🧠 AI Analysis Complete',
            `Message analyzed by Enhanced Synthia AI`,
            fields,
            analysis.threatLevel >= 5 ? config.colors.error : 
            analysis.threatLevel >= 3 ? config.colors.warning : 
            config.colors.success
        );
    }

    async logSecurityEvent(guild, eventType, details, severity = 'medium') {
        const fields = [
            { name: '🚨 Event Type', value: eventType, inline: true },
            { name: '📊 Severity', value: severity.toUpperCase(), inline: true },
            { name: '⏰ Timestamp', value: new Date().toLocaleString(), inline: true }
        ];

        for (const [key, value] of Object.entries(details)) {
            fields.push({ 
                name: key, 
                value: String(value).slice(0, 1024), 
                inline: true 
            });
        }

        const color = severity === 'high' ? config.colors.error : 
                     severity === 'medium' ? config.colors.warning : 
                     config.colors.info;

        await this.sendLog(
            guild,
            'security',
            `🔒 Security Event: ${eventType}`,
            `Security event detected and processed`,
            fields,
            color
        );
    }

    async logSystemEvent(guild, eventType, message, fields = []) {
        await this.sendLog(
            guild,
            'system',
            `⚙️ System: ${eventType}`,
            message,
            fields,
            config.colors.info
        );
    }

    async logError(guild, error, context = '') {
        const fields = [
            { name: '❌ Error', value: error.message.slice(0, 1024), inline: false },
            { name: '📍 Context', value: context || 'Unknown', inline: true },
            { name: '⏰ Time', value: new Date().toLocaleString(), inline: true }
        ];

        if (error.stack) {
            fields.push({ 
                name: '📋 Stack Trace', 
                value: `\`\`\`${error.stack.slice(0, 1000)}\`\`\``, 
                inline: false 
            });
        }

        await this.sendLog(
            guild,
            'error',
            '💥 System Error',
            'An error occurred in the Enhanced Synthia system',
            fields,
            config.colors.error
        );
    }

    async logPerformanceMetrics(guild, metrics) {
        const fields = [
            { name: '⚡ Avg Response Time', value: `${metrics.avgResponseTime}ms`, inline: true },
            { name: '🧠 Total Analyses', value: metrics.totalAnalyses.toLocaleString(), inline: true },
            { name: '🛡️ Moderation Actions', value: metrics.moderationActions.toLocaleString(), inline: true },
            { name: '🌍 Translations', value: metrics.translations.toLocaleString(), inline: true },
            { name: '📊 Cache Hit Rate', value: `${metrics.cacheHitRate}%`, inline: true },
            { name: '🔧 Accuracy', value: `${metrics.accuracy}%`, inline: true }
        ];

        await this.sendLog(
            guild,
            'analytics',
            '📊 Performance Metrics',
            'Hourly performance summary',
            fields,
            config.colors.analytics
        );
    }

    async logDashboardAccess(guild, user, action, ip = 'Unknown') {
        const fields = [
            { name: '👤 User', value: `${user.tag}\n(${user.id})`, inline: true },
            { name: '🎬 Action', value: action, inline: true },
            { name: '🌐 IP Address', value: ip, inline: true },
            { name: '⏰ Timestamp', value: new Date().toLocaleString(), inline: true }
        ];

        await this.sendLog(
            guild,
            'security',
            '🖥️ Dashboard Access',
            `User accessed dashboard: ${action}`,
            fields,
            config.colors.security
        );
    }

    getColorForType(type) {
        const colorMap = {
            'success': config.colors.success,
            'warning': config.colors.warning,
            'error': config.colors.error,
            'info': config.colors.info,
            'moderation': config.colors.moderation,
            'translation': config.colors.translation,
            'security': config.colors.security,
            'analytics': config.colors.analytics,
            'ai': config.colors.primary
        };

        return colorMap[type] || config.colors.primary;
    }

    // Advanced logging with file attachments
    async logWithAttachment(guild, type, title, description, attachmentData, filename) {
        try {
            const logChannel = await this.getLogChannel(guild, type);
            if (!logChannel) return false;

            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(description)
                .setColor(this.getColorForType(type))
                .setTimestamp()
                .setFooter({ 
                    text: `Enhanced Synthia v${config.aiVersion}`,
                    iconURL: guild.client.user?.displayAvatarURL()
                });

            const attachment = {
                attachment: Buffer.from(attachmentData),
                name: filename
            };

            await logChannel.send({ 
                embeds: [embed], 
                files: [attachment] 
            });

            return true;

        } catch (error) {
            console.error('Failed to send log with attachment:', error.message);
            return false;
        }
    }

    // Bulk logging for analytics
    async logBulkAnalytics(guild, analyticsData) {
        try {
            const reportData = JSON.stringify(analyticsData, null, 2);
            
            await this.logWithAttachment(
                guild,
                'analytics',
                '📊 Detailed Analytics Report',
                'Complete analytics data export',
                reportData,
                `analytics-${Date.now()}.json`
            );

        } catch (error) {
            console.error('Failed to log bulk analytics:', error.message);
        }
    }

    // Health check
    async healthCheck(guild) {
        try {
            const logChannel = await this.getLogChannel(guild, 'main');
            if (!logChannel) {
                return { status: 'unhealthy', reason: 'No log channel configured' };
            }

            const permissions = logChannel.permissionsFor(guild.members.me);
            if (!permissions.has(PermissionsBitField.Flags.SendMessages)) {
                return { status: 'unhealthy', reason: 'Missing send messages permission' };
            }

            if (!permissions.has(PermissionsBitField.Flags.EmbedLinks)) {
                return { status: 'unhealthy', reason: 'Missing embed links permission' };
            }

            return { status: 'healthy', channel: logChannel.name };

        } catch (error) {
            return { status: 'unhealthy', reason: error.message };
        }
    }
}

module.exports = EnhancedDiscordLogger;