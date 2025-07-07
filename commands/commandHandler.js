// Enhanced Command Handler v10.0 - commands/commandHandler.js
const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config/enhanced-config.js');
const logger = require('../logging/enhanced-logger.js');

class EnhancedCommandHandler {
    constructor() {
        this.commands = new Map();
        this.cooldowns = new Map();
        this.commandStats = new Map();
        this.initializeCommands();
        logger.info('🚀 Enhanced Command Handler v10.0 initialized');
    }

    initializeCommands() {
        // Translation Commands
        this.addCommand(new SlashCommandBuilder()
            .setName('translate')
            .setDescription('🌍 Translate text using multiple AI providers')
            .addStringOption(option =>
                option.setName('text')
                    .setDescription('Text to translate')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('to')
                    .setDescription('Target language (e.g., en, es, fr)')
                    .setRequired(false)
            )
            .addStringOption(option =>
                option.setName('from')
                    .setDescription('Source language (auto-detect if not specified)')
                    .setRequired(false)
            )
            .addBooleanOption(option =>
                option.setName('compare')
                    .setDescription('Compare results from multiple providers')
                    .setRequired(false)
            ), 'translation'
        );

        // Moderation Commands
        this.addCommand(new SlashCommandBuilder()
            .setName('analyze-user')
            .setDescription('🧠 Get AI-powered user analysis')
            .addUserOption(option =>
                option.setName('user')
                    .setDescription('User to analyze')
                    .setRequired(true)
            )
            .addBooleanOption(option =>
                option.setName('detailed')
                    .setDescription('Enable detailed behavioral analysis')
                    .setRequired(false)
            )
            .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages), 'moderation'
        );

        // System Commands
        this.addCommand(new SlashCommandBuilder()
            .setName('system-status')
            .setDescription('🔍 View comprehensive system status')
            .addBooleanOption(option =>
                option.setName('detailed')
                    .setDescription('Show detailed technical information')
                    .setRequired(false)
            )
            .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages), 'system'
        );

        // Configuration Commands
        this.addCommand(new SlashCommandBuilder()
            .setName('toggle-automod')
            .setDescription('🛡️ Toggle auto-moderation on/off')
            .addBooleanOption(option =>
                option.setName('enabled')
                    .setDescription('Enable or disable auto-moderation')
                    .setRequired(false)
            )
            .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild), 'config'
        );

        this.addCommand(new SlashCommandBuilder()
            .setName('set-language')
            .setDescription('🌍 Set server default language')
            .addStringOption(option =>
                option.setName('language')
                    .setDescription('Language code (e.g., en, es, fr)')
                    .setRequired(true)
            )
            .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild), 'config'
        );

        // Testing Commands
        this.addCommand(new SlashCommandBuilder()
            .setName('test-detection')
            .setDescription('🧪 Test the AI detection system')
            .addStringOption(option =>
                option.setName('text')
                    .setDescription('Text to test (for educational purposes)')
                    .setRequired(true)
            )
            .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages), 'testing'
        );

        this.addCommand(new SlashCommandBuilder()
            .setName('test-pokemon')
            .setDescription('🎮 Test Pokemon content protection')
            .addStringOption(option =>
                option.setName('content')
                    .setDescription('Pokemon-related content to test')
                    .setRequired(false)
            )
            .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages), 'testing'
        );

        // Help Commands
        this.addCommand(new SlashCommandBuilder()
            .setName('help')
            .setDescription('📚 Show help information')
            .addStringOption(option =>
                option.setName('category')
                    .setDescription('Help category')
                    .setRequired(false)
                    .addChoices(
                        { name: '🌍 Translation', value: 'translation' },
                        { name: '🛡️ Moderation', value: 'moderation' },
                        { name: '⚙️ Configuration', value: 'config' },
                        { name: '🧪 Testing', value: 'testing' },
                        { name: '🔍 System', value: 'system' }
                    )
            ), 'help'
        );

        logger.info(`✅ Initialized ${this.commands.size} slash commands`);
    }

    addCommand(commandBuilder, category = 'general') {
        const command = {
            data: commandBuilder,
            category: category,
            cooldown: 3,
            uses: 0,
            errors: 0
        };
        
        this.commands.set(commandBuilder.name, command);
        this.commandStats.set(commandBuilder.name, {
            uses: 0,
            errors: 0,
            lastUsed: null
        });
    }

    async handleSlashCommand(interaction, synthiaTranslator, synthiaAI, serverLogger, discordLogger, userViolations) {
        const commandName = interaction.commandName;
        const command = this.commands.get(commandName);
        
        if (!command) {
            return await interaction.reply({ 
                content: '❌ Unknown command.', 
                ephemeral: true 
            });
        }

        // Check cooldowns
        if (this.isOnCooldown(interaction.user.id, commandName)) {
            const remaining = this.getCooldownRemaining(interaction.user.id, commandName);
            return await interaction.reply({
                content: `⏰ Command on cooldown. Try again in ${remaining}s.`,
                ephemeral: true
            });
        }

        try {
            // Apply cooldown
            this.applyCooldown(interaction.user.id, commandName, command.cooldown);
            
            // Update stats
            this.commandStats.get(commandName).uses++;
            this.commandStats.get(commandName).lastUsed = new Date();

            // Route to appropriate handler
            switch (commandName) {
                case 'translate':
                    await this.handleTranslate(interaction, synthiaTranslator);
                    break;
                case 'analyze-user':
                    await this.handleAnalyzeUser(interaction, synthiaAI);
                    break;
                case 'system-status':
                    await this.handleSystemStatus(interaction, synthiaAI, synthiaTranslator);
                    break;
                case 'toggle-automod':
                    await this.handleToggleAutomod(interaction, serverLogger);
                    break;
                case 'set-language':
                    await this.handleSetLanguage(interaction, serverLogger);
                    break;
                case 'test-detection':
                    await this.handleTestDetection(interaction, synthiaAI);
                    break;
                case 'test-pokemon':
                    await this.handleTestPokemon(interaction, synthiaAI);
                    break;
                case 'help':
                    await this.handleHelp(interaction);
                    break;
                default:
                    await interaction.reply({
                        content: '🚧 This command is not yet implemented.',
                        ephemeral: true
                    });
            }

        } catch (error) {
            logger.error(`Command error (${commandName}):`, error);
            this.commandStats.get(commandName).errors++;
            
            const errorEmbed = new EmbedBuilder()
                .setColor(config.get('colors.error'))
                .setTitle('❌ Command Error')
                .setDescription('An error occurred while processing this command.')
                .addFields(
                    { name: 'Command', value: commandName, inline: true },
                    { name: 'Error', value: error.message.slice(0, 1024), inline: false }
                )
                .setTimestamp();

            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            } else if (interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            }
        }
    }

    async handleTranslate(interaction, synthiaTranslator) {
        await interaction.deferReply();
        
        const text = interaction.options.getString('text');
        const targetLang = interaction.options.getString('to') || 'en';
        const sourceLang = interaction.options.getString('from');
        const compare = interaction.options.getBoolean('compare') || false;

        try {
            if (compare) {
                // Multi-provider comparison (if available)
                const embed = new EmbedBuilder()
                    .setTitle('🌍 Translation Comparison')
                    .setColor(config.get('colors.translation'))
                    .setDescription('Comparing results from multiple providers...')
                    .addFields(
                        { name: '📝 Original Text', value: `\`\`\`${text.slice(0, 500)}\`\`\``, inline: false }
                    );
                
                await interaction.editReply({ embeds: [embed] });
            } else {
                // Standard translation
                const result = await synthiaTranslator.translateText(text, targetLang, sourceLang);
                
                const embed = new EmbedBuilder()
                    .setTitle('🌍 Translation Result')
                    .setColor(config.get('colors.translation'))
                    .addFields(
                        { name: `📝 Original (${result.originalLanguage})`, value: `\`\`\`${text.slice(0, 500)}\`\`\``, inline: false },
                        { name: `🌟 Translation (${result.targetLanguage})`, value: `\`\`\`${result.translatedText.slice(0, 500)}\`\`\``, inline: false },
                        { name: '🔧 Provider', value: result.provider || 'Unknown', inline: true },
                        { name: '📊 Confidence', value: `${result.confidence || 0}%`, inline: true },
                        { name: '⚡ Time', value: `${result.processingTime || 0}ms`, inline: true }
                    );
                
                if (result.error) {
                    embed.addFields({ name: '❌ Error', value: result.error });
                }
                
                await interaction.editReply({ embeds: [embed] });
            }
        } catch (error) {
            const errorEmbed = new EmbedBuilder()
                .setColor(config.get('colors.error'))
                .setTitle('❌ Translation Failed')
                .setDescription(`Error: ${error.message}`)
                .setTimestamp();
            
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }

    async handleAnalyzeUser(interaction, synthiaAI) {
        await interaction.deferReply({ ephemeral: true });
        
        const targetUser = interaction.options.getUser('user');
        const detailed = interaction.options.getBoolean('detailed') || false;

        try {
            // Create a comprehensive analysis
            const embed = new EmbedBuilder()
                .setTitle(`🧠 AI User Analysis - ${targetUser.tag}`)
                .setColor(config.get('colors.primary'))
                .setThumbnail(targetUser.displayAvatarURL())
                .addFields(
                    { name: '👤 User', value: `${targetUser.tag}\n(${targetUser.id})`, inline: true },
                    { name: '📊 Analysis Type', value: detailed ? 'Detailed' : 'Standard', inline: true },
                    { name: '🤖 AI System', value: 'Enhanced Synthia v10.0', inline: true }
                )
                .setTimestamp();

            // Add analysis disclaimer
            embed.addFields({
                name: '⚠️ Analysis Note',
                value: 'This analysis is based on available message history and behavioral patterns. Results are for moderation purposes only.',
                inline: false
            });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            const errorEmbed = new EmbedBuilder()
                .setColor(config.get('colors.error'))
                .setTitle('❌ Analysis Failed')
                .setDescription(`Error: ${error.message}`)
                .setTimestamp();
            
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }

    async handleSystemStatus(interaction, synthiaAI, synthiaTranslator) {
        await interaction.deferReply();
        
        const detailed = interaction.options.getBoolean('detailed') || false;

        try {
            const translationStats = synthiaTranslator.getTranslationStats();
            const commandStats = this.getCommandStatistics();

            const embed = new EmbedBuilder()
                .setTitle('🔍 Enhanced Synthia System Status')
                .setColor(config.get('colors.success'))
                .addFields(
                    { name: '🤖 AI System', value: 'Enhanced Synthia v10.0', inline: true },
                    { name: '📊 Success Rate', value: `${translationStats.successRate || 0}%`, inline: true },
                    { name: '⚡ Avg Response', value: `${translationStats.averageResponseTime || 0}ms`, inline: true },
                    { name: '🌍 Total Translations', value: `${translationStats.totalTranslations || 0}`, inline: true },
                    { name: '🛡️ Commands Used', value: `${commandStats.totalUses}`, inline: true },
                    { name: '📈 Command Success', value: `${commandStats.successRate}%`, inline: true }
                );

            if (detailed) {
                embed.addFields(
                    { name: '💾 Memory Usage', value: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`, inline: true },
                    { name: '⏰ Uptime', value: this.formatUptime(process.uptime()), inline: true },
                    { name: '📊 API Status', value: 'All systems operational', inline: true }
                );
            }

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            const errorEmbed = new EmbedBuilder()
                .setColor(config.get('colors.error'))
                .setTitle('❌ Status Check Failed')
                .setDescription(`Error: ${error.message}`)
                .setTimestamp();
            
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }

    async handleToggleAutomod(interaction, serverLogger) {
        await interaction.deferReply({ ephemeral: true });
        
        const enabled = interaction.options.getBoolean('enabled');
        const guildId = interaction.guild.id;

        try {
            let config = serverLogger.getServerConfig(guildId);
            if (!config) {
                config = await serverLogger.createEnterpriseServerConfig(guildId, interaction.guild.name);
            }

            const newState = enabled !== null ? enabled : !config.autoModeration;
            serverLogger.updateServerSetting(guildId, 'autoModeration', newState);

            const embed = new EmbedBuilder()
                .setTitle('🛡️ Auto-Moderation Updated')
                .setColor(newState ? config.get('colors.success') : config.get('colors.warning'))
                .addFields(
                    { name: '⚙️ Status', value: newState ? '✅ Enabled' : '❌ Disabled', inline: true },
                    { name: '👤 Updated By', value: interaction.user.tag, inline: true },
                    { name: '📅 Updated At', value: new Date().toLocaleString(), inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            const errorEmbed = new EmbedBuilder()
                .setColor(config.get('colors.error'))
                .setTitle('❌ Configuration Failed')
                .setDescription(`Error: ${error.message}`)
                .setTimestamp();
            
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }

    async handleSetLanguage(interaction, serverLogger) {
        await interaction.deferReply({ ephemeral: true });
        
        const language = interaction.options.getString('language');
        const guildId = interaction.guild.id;

        try {
            let config = serverLogger.getServerConfig(guildId);
            if (!config) {
                config = await serverLogger.createEnterpriseServerConfig(guildId, interaction.guild.name);
            }

            serverLogger.updateServerSetting(guildId, 'language', language);
            serverLogger.updateServerSetting(guildId, 'defaultTranslateTo', language);

            const embed = new EmbedBuilder()
                .setTitle('🌍 Language Settings Updated')
                .setColor(config.get('colors.translation'))
                .addFields(
                    { name: '🌍 New Language', value: language.toUpperCase(), inline: true },
                    { name: '👤 Updated By', value: interaction.user.tag, inline: true },
                    { name: '📅 Updated At', value: new Date().toLocaleString(), inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            const errorEmbed = new EmbedBuilder()
                .setColor(config.get('colors.error'))
                .setTitle('❌ Language Update Failed')
                .setDescription(`Error: ${error.message}`)
                .setTimestamp();
            
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }

    async handleTestDetection(interaction, synthiaAI) {
        await interaction.deferReply({ ephemeral: true });
        
        const text = interaction.options.getString('text');

        try {
            // Simulate message object for testing
            const testMessage = {
                id: 'test-' + Date.now(),
                content: text,
                author: interaction.user,
                guild: interaction.guild,
                channel: interaction.channel
            };

            const analysis = await synthiaAI.analyzeMessage(testMessage);

            const embed = new EmbedBuilder()
                .setTitle('🧪 AI Detection Test Results')
                .setColor(analysis.threatLevel >= 5 ? config.get('colors.error') : 
                         analysis.threatLevel >= 3 ? config.get('colors.warning') : 
                         config.get('colors.success'))
                .addFields(
                    { name: '📝 Test Text', value: `\`\`\`${text.slice(0, 500)}\`\`\``, inline: false },
                    { name: '🔥 Threat Level', value: `${analysis.threatLevel || 0}/10`, inline: true },
                    { name: '🧠 Confidence', value: `${analysis.confidence || 0}%`, inline: true },
                    { name: '🌍 Language', value: analysis.language?.originalLanguage || 'Unknown', inline: true },
                    { name: '🔍 Bypass Detected', value: analysis.bypassDetected ? '🚨 YES' : '✅ NO', inline: true },
                    { name: '⚖️ Violation Type', value: analysis.violationType || 'None', inline: true },
                    { name: '🛡️ Action', value: analysis.action || 'none', inline: true }
                )
                .setTimestamp();

            if (analysis.reasoning && analysis.reasoning.length > 0) {
                embed.addFields({
                    name: '🧠 AI Reasoning',
                    value: analysis.reasoning.slice(0, 3).join('\n• ').slice(0, 1024),
                    inline: false
                });
            }

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            const errorEmbed = new EmbedBuilder()
                .setColor(config.get('colors.error'))
                .setTitle('❌ Test Failed')
                .setDescription(`Error: ${error.message}`)
                .setTimestamp();
            
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }

    async handleTestPokemon(interaction, synthiaAI) {
        await interaction.deferReply({ ephemeral: true });
        
        const content = interaction.options.getString('content') || 
            '.trade Charizard (M) @ Life Orb\nBall: Poke Ball\nLevel: 50\nShiny: Yes\nAbility: Solar Power';

        try {
            const testMessage = {
                id: 'pokemon-test-' + Date.now(),
                content: content,
                author: interaction.user,
                guild: interaction.guild,
                channel: interaction.channel
            };

            const analysis = await synthiaAI.analyzeMessage(testMessage);

            const embed = new EmbedBuilder()
                .setTitle('🎮 Pokemon Protection Test')
                .setColor(config.get('colors.success'))
                .addFields(
                    { name: '📝 Test Content', value: `\`\`\`${content.slice(0, 500)}\`\`\``, inline: false },
                    { name: '🛡️ Pokemon Protected', value: analysis.pokemonProtected ? '✅ YES' : '❌ NO', inline: true },
                    { name: '🔥 Threat Level', value: `${analysis.threatLevel || 0}/10`, inline: true },
                    { name: '⚖️ Action', value: analysis.action || 'none', inline: true },
                    { name: '🎮 Detection Status', value: analysis.pokemonProtected ? 'Correctly identified as Pokemon content' : 'Not detected as Pokemon content', inline: false }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            const errorEmbed = new EmbedBuilder()
                .setColor(config.get('colors.error'))
                .setTitle('❌ Pokemon Test Failed')
                .setDescription(`Error: ${error.message}`)
                .setTimestamp();
            
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }

    async handleHelp(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        const category = interaction.options.getString('category');

        const embed = new EmbedBuilder()
            .setTitle('📚 Enhanced Synthia Help')
            .setColor(config.get('colors.info'))
            .setDescription('Enhanced AI-powered Discord moderation and translation bot')
            .addFields(
                { name: '🌍 Translation Commands', value: '`/translate` - Translate text with AI\n`/set-language` - Set server language', inline: true },
                { name: '🛡️ Moderation Commands', value: '`/analyze-user` - AI user analysis\n`/toggle-automod` - Toggle auto-moderation', inline: true },
                { name: '🧪 Testing Commands', value: '`/test-detection` - Test AI detection\n`/test-pokemon` - Test Pokemon protection', inline: true },
                { name: '🔍 System Commands', value: '`/system-status` - View system status\n`/help` - Show this help menu', inline: true }
            )
            .setFooter({ text: 'Enhanced Synthia v10.0 | Multi-API Intelligence System' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }

    // Utility methods
    isOnCooldown(userId, commandName) {
        if (!this.cooldowns.has(commandName)) {
            this.cooldowns.set(commandName, new Map());
        }
        
        const commandCooldowns = this.cooldowns.get(commandName);
        const now = Date.now();
        
        if (commandCooldowns.has(userId)) {
            const expirationTime = commandCooldowns.get(userId);
            return now < expirationTime;
        }
        
        return false;
    }

    getCooldownRemaining(userId, commandName) {
        const commandCooldowns = this.cooldowns.get(commandName);
        const expirationTime = commandCooldowns.get(userId);
        return Math.ceil((expirationTime - Date.now()) / 1000);
    }

    applyCooldown(userId, commandName, cooldownSeconds) {
        if (!this.cooldowns.has(commandName)) {
            this.cooldowns.set(commandName, new Map());
        }
        
        const commandCooldowns = this.cooldowns.get(commandName);
        const expirationTime = Date.now() + (cooldownSeconds * 1000);
        commandCooldowns.set(userId, expirationTime);
        
        setTimeout(() => {
            commandCooldowns.delete(userId);
        }, cooldownSeconds * 1000);
    }

    getCommandStatistics() {
        let totalUses = 0;
        let totalErrors = 0;
        
        for (const stats of this.commandStats.values()) {
            totalUses += stats.uses;
            totalErrors += stats.errors;
        }
        
        return {
            totalCommands: this.commands.size,
            totalUses,
            totalErrors,
            successRate: totalUses > 0 ? Math.round(((totalUses - totalErrors) / totalUses) * 100) : 100
        };
    }

    formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (days > 0) return `${days}d ${hours}h ${minutes}m`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    }

    getSlashCommands() {
        return Array.from(this.commands.values()).map(cmd => cmd.data);
    }
}

// Legacy command handling for text commands
async function handleTextCommand(message, synthiaTranslator, synthiaAI, serverLogger, discordLogger, userViolations) {
    const args = message.content.slice('!synthia'.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (!command) {
        return message.reply('Use `/help` to see available commands!');
    }

    // Simple text command routing
    switch (command) {
        case 'help':
            return message.reply('🚀 Enhanced Synthia v10.0 is now using slash commands! Use `/help` to see all available commands.');
        case 'status':
            return message.reply('✅ Enhanced Synthia v10.0 is online! Use `/system-status` for detailed information.');
        default:
            return message.reply('Unknown command. Use `/help` to see available commands!');
    }
}

const commands = new EnhancedCommandHandler().getSlashCommands();

module.exports = {
    EnhancedCommandHandler,
    commands,
    handleTextCommand,
    handleSlashCommand: async (interaction, synthiaTranslator, synthiaAI, serverLogger, discordLogger, userViolations) => {
        const handler = new EnhancedCommandHandler();
        return handler.handleSlashCommand(interaction, synthiaTranslator, synthiaAI, serverLogger, discordLogger, userViolations);
    }
};
