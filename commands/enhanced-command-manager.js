const { REST, Routes, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config/enhanced-config.js');
const Logger = require('../logging/enhanced-logger.js');

class EnhancedCommandManager {
    constructor(client, database, synthiaAI, translator, moderator) {
        this.client = client;
        this.database = database;
        this.synthiaAI = synthiaAI;
        this.translator = translator;
        this.moderator = moderator;
        this.logger = new Logger('CommandManager');
        
        this.commands = new Map();
        this.cooldowns = new Map();
        this.stats = {
            commandsExecuted: 0,
            slashCommands: 0,
            prefixCommands: 0,
            errors: 0
        };
    }

    async initialize() {
        try {
            this.logger.info('Initializing command manager...');
            
            await this.registerSlashCommands();
            this.setupPrefixCommands();
            
            this.logger.info(`Command manager initialized with ${this.commands.size} commands`);
        } catch (error) {
            this.logger.error('Failed to initialize command manager:', error);
            throw error;
        }
    }

    async registerSlashCommands() {
        const commands = [
            // General Commands
            new SlashCommandBuilder()
                .setName('ping')
                .setDescription('Check bot latency and status'),
            
            new SlashCommandBuilder()
                .setName('info')
                .setDescription('Get information about Synthia AI'),
            
            new SlashCommandBuilder()
                .setName('help')
                .setDescription('Show available commands')
                .addStringOption(option =>
                    option.setName('command')
                        .setDescription('Get help for specific command')
                        .setRequired(false)),
            
            // AI Commands
            new SlashCommandBuilder()
                .setName('ask')
                .setDescription('Ask Synthia AI a question')
                .addStringOption(option =>
                    option.setName('question')
                        .setDescription('Your question')
                        .setRequired(true)),
            
            new SlashCommandBuilder()
                .setName('analyze')
                .setDescription('Analyze a message with AI')
                .addStringOption(option =>
                    option.setName('text')
                        .setDescription('Text to analyze')
                        .setRequired(true)),
            
            // Translation Commands
            new SlashCommandBuilder()
                .setName('translate')
                .setDescription('Translate text to another language')
                .addStringOption(option =>
                    option.setName('text')
                        .setDescription('Text to translate')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('to')
                        .setDescription('Target language (e.g., es, fr, de)')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('from')
                        .setDescription('Source language (auto-detect if not specified)')
                        .setRequired(false)),
            
            // Moderation Commands
            new SlashCommandBuilder()
                .setName('warn')
                .setDescription('Warn a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to warn')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for warning')
                        .setRequired(false))
                .setDefaultMemberPermissions('0'),
            
            new SlashCommandBuilder()
                .setName('mute')
                .setDescription('Mute a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to mute')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('duration')
                        .setDescription('Duration in minutes')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for mute')
                        .setRequired(false))
                .setDefaultMemberPermissions('0'),
            
            new SlashCommandBuilder()
                .setName('kick')
                .setDescription('Kick a user from the server')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to kick')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for kick')
                        .setRequired(false))
                .setDefaultMemberPermissions('0'),
            
            new SlashCommandBuilder()
                .setName('ban')
                .setDescription('Ban a user from the server')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to ban')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for ban')
                        .setRequired(false))
                .addIntegerOption(option =>
                    option.setName('delete_days')
                        .setDescription('Days of messages to delete (0-7)')
                        .setRequired(false))
                .setDefaultMemberPermissions('0'),
            
            // Analytics Commands
            new SlashCommandBuilder()
                .setName('stats')
                .setDescription('Show server or user statistics')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to show stats for')
                        .setRequired(false)),
            
            new SlashCommandBuilder()
                .setName('activity')
                .setDescription('Show server activity analytics'),
            
            // Configuration Commands
            new SlashCommandBuilder()
                .setName('config')
                .setDescription('Configure server settings')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('automod')
                        .setDescription('Configure auto-moderation')
                        .addBooleanOption(option =>
                            option.setName('enabled')
                                .setDescription('Enable auto-moderation')
                                .setRequired(true)))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('translation')
                        .setDescription('Configure auto-translation')
                        .addBooleanOption(option =>
                            option.setName('enabled')
                                .setDescription('Enable auto-translation')
                                .setRequired(true)))
                .setDefaultMemberPermissions('0'),
            
            // Utility Commands
            new SlashCommandBuilder()
                .setName('userinfo')
                .setDescription('Get information about a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to get info about')
                        .setRequired(false)),
            
            new SlashCommandBuilder()
                .setName('serverinfo')
                .setDescription('Get information about the server'),
            
            new SlashCommandBuilder()
                .setName('clean')
                .setDescription('Clean messages from the channel')
                .addIntegerOption(option =>
                    option.setName('amount')
                        .setDescription('Number of messages to delete (1-100)')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(100))
                .setDefaultMemberPermissions('0')
        ];

        try {
            const rest = new REST({ version: '10' }).setToken(config.discord.token);
            
            this.logger.info('Started refreshing application (/) commands...');
            
            await rest.put(
                Routes.applicationCommands(config.discord.clientId),
                { body: commands }
            );
            
            this.logger.info('Successfully reloaded application (/) commands');
        } catch (error) {
            this.logger.error('Failed to register slash commands:', error);
            throw error;
        }
    }

    setupPrefixCommands() {
        // Legacy prefix commands for backwards compatibility
        this.commands.set('ping', {
            name: 'ping',
            description: 'Check bot latency',
            execute: this.pingCommand.bind(this)
        });
        
        this.commands.set('help', {
            name: 'help',
            description: 'Show available commands',
            execute: this.helpCommand.bind(this)
        });
    }

    async handleSlashCommand(interaction) {
        try {
            const { commandName, user, guild } = interaction;
            
            this.stats.commandsExecuted++;
            this.stats.slashCommands++;
            
            // Check cooldown
            if (this.isOnCooldown(user.id, commandName)) {
                const cooldownTime = this.getCooldownTime(user.id, commandName);
                return await interaction.reply({
                    content: `Please wait ${cooldownTime} seconds before using this command again.`,
                    ephemeral: true
                });
            }
            
            this.setCooldown(user.id, commandName, 5000); // 5 second cooldown
            
            this.logger.logCommandUsage(user.id, guild?.id, commandName, interaction.options.data);
            
            switch (commandName) {
                case 'ping':
                    await this.handlePingCommand(interaction);
                    break;
                case 'info':
                    await this.handleInfoCommand(interaction);
                    break;
                case 'help':
                    await this.handleHelpCommand(interaction);
                    break;
                case 'ask':
                    await this.handleAskCommand(interaction);
                    break;
                case 'analyze':
                    await this.handleAnalyzeCommand(interaction);
                    break;
                case 'translate':
                    await this.handleTranslateCommand(interaction);
                    break;
                case 'warn':
                    await this.handleWarnCommand(interaction);
                    break;
                case 'mute':
                    await this.handleMuteCommand(interaction);
                    break;
                case 'kick':
                    await this.handleKickCommand(interaction);
                    break;
                case 'ban':
                    await this.handleBanCommand(interaction);
                    break;
                case 'stats':
                    await this.handleStatsCommand(interaction);
                    break;
                case 'activity':
                    await this.handleActivityCommand(interaction);
                    break;
                case 'config':
                    await this.handleConfigCommand(interaction);
                    break;
                case 'userinfo':
                    await this.handleUserInfoCommand(interaction);
                    break;
                case 'serverinfo':
                    await this.handleServerInfoCommand(interaction);
                    break;
                case 'clean':
                    await this.handleCleanCommand(interaction);
                    break;
                default:
                    await interaction.reply({
                        content: 'Unknown command!',
                        ephemeral: true
                    });
            }
        } catch (error) {
            this.logger.error('Slash command execution failed:', error);
            this.stats.errors++;
            
            const errorEmbed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('❌ Command Error')
                .setDescription('An error occurred while executing this command.')
                .setTimestamp();
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    }

    async handlePingCommand(interaction) {
        const start = Date.now();
        await interaction.deferReply();
        const end = Date.now();
        
        const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('🏓 Pong!')
            .addFields(
                { name: 'Bot Latency', value: `${end - start}ms`, inline: true },
                { name: 'API Latency', value: `${Math.round(this.client.ws.ping)}ms`, inline: true },
                { name: 'Status', value: '🟢 Online', inline: true }
            )
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
    }

    async handleInfoCommand(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle('🤖 Synthia AI Premium v10.0')
            .setDescription('Enterprise-Grade Discord Intelligence System')
            .addFields(
                { name: '⚡ Features', value: 'AI Analysis, Auto-Moderation, Translation, Analytics', inline: false },
                { name: '🏠 Servers', value: `${this.client.guilds.cache.size}`, inline: true },
                { name: '👥 Users', value: `${this.client.users.cache.size}`, inline: true },
                { name: '📊 Commands Executed', value: `${this.stats.commandsExecuted}`, inline: true }
            )
            .setThumbnail(this.client.user.displayAvatarURL())
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    }

    async handleHelpCommand(interaction) {
        const commandName = interaction.options.getString('command');
        
        if (commandName) {
            // Show help for specific command
            const embed = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle(`Help: /${commandName}`)
                .setDescription(`Detailed help for the ${commandName} command would go here.`)
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
        } else {
            // Show general help
            const embed = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle('📚 Synthia AI Commands')
                .setDescription('Here are all available commands:')
                .addFields(
                    { name: '🤖 AI Commands', value: '`/ask` `/analyze`', inline: true },
                    { name: '🌐 Translation', value: '`/translate`', inline: true },
                    { name: '🛡️ Moderation', value: '`/warn` `/mute` `/kick` `/ban`', inline: true },
                    { name: '📊 Analytics', value: '`/stats` `/activity`', inline: true },
                    { name: '⚙️ Configuration', value: '`/config`', inline: true },
                    { name: '🔧 Utilities', value: '`/userinfo` `/serverinfo` `/clean`', inline: true }
                )
                .setFooter({ text: 'Use /help <command> for detailed help on a specific command' })
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
        }
    }

    async handleAskCommand(interaction) {
        const question = interaction.options.getString('question');
        
        await interaction.deferReply();
        
        try {
            // Create a fake message object for AI processing
            const fakeMessage = {
                id: interaction.id,
                content: question,
                author: interaction.user,
                guild: interaction.guild
            };
            
            const analysis = await this.synthiaAI.analyzeMessage(fakeMessage);
            const response = await this.synthiaAI.generateResponse(fakeMessage, analysis);
            
            if (response) {
                const embed = new EmbedBuilder()
                    .setColor(0x0099ff)
                    .setTitle('🤖 Synthia AI Response')
                    .setDescription(response)
                    .addFields(
                        { name: 'Sentiment', value: analysis.sentiment?.label || 'Unknown', inline: true },
                        { name: 'Confidence', value: `${Math.round((analysis.confidence || 0) * 100)}%`, inline: true }
                    )
                    .setTimestamp();
                
                await interaction.editReply({ embeds: [embed] });
            } else {
                await interaction.editReply({ content: 'Sorry, I couldn\'t generate a response right now.' });
            }
        } catch (error) {
            this.logger.error('Ask command failed:', error);
            await interaction.editReply({ content: 'An error occurred while processing your question.' });
        }
    }

    async handleAnalyzeCommand(interaction) {
        const text = interaction.options.getString('text');
        
        await interaction.deferReply();
        
        try {
            const fakeMessage = {
                id: interaction.id,
                content: text,
                author: interaction.user,
                guild: interaction.guild
            };
            
            const analysis = await this.synthiaAI.analyzeMessage(fakeMessage);
            
            const embed = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle('🔍 Message Analysis')
                .setDescription(`**Text:** ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`)
                .addFields(
                    { name: 'Sentiment', value: `${analysis.sentiment?.label || 'Unknown'} (${Math.round((analysis.sentiment?.score || 0) * 100)}%)`, inline: true },
                    { name: 'Toxicity', value: `${analysis.toxicity?.isToxic ? 'Yes' : 'No'} (${Math.round((analysis.toxicity?.score || 0) * 100)}%)`, inline: true },
                    { name: 'Language', value: analysis.language?.language?.toUpperCase() || 'Unknown', inline: true },
                    { name: 'Intent', value: analysis.intent?.intent || 'Unknown', inline: true },
                    { name: 'Confidence', value: `${Math.round((analysis.confidence || 0) * 100)}%`, inline: true },
                    { name: 'Processing Time', value: `${analysis.processingTime}ms`, inline: true }
                )
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            this.logger.error('Analyze command failed:', error);
            await interaction.editReply({ content: 'An error occurred while analyzing the text.' });
        }
    }

    async handleTranslateCommand(interaction) {
        const text = interaction.options.getString('text');
        const targetLang = interaction.options.getString('to');
        const sourceLang = interaction.options.getString('from') || 'auto';
        
        await interaction.deferReply();
        
        try {
            if (this.translator) {
                const translation = await this.translator.translate(text, sourceLang, targetLang);
                
                const embed = new EmbedBuilder()
                    .setColor(0x0099ff)
                    .setTitle('🌐 Translation')
                    .addFields(
                        { name: `Original (${sourceLang.toUpperCase()})`, value: text, inline: false },
                        { name: `Translation (${targetLang.toUpperCase()})`, value: translation.text || 'Translation failed', inline: false }
                    )
                    .setTimestamp();
                
                await interaction.editReply({ embeds: [embed] });
            } else {
                await interaction.editReply({ content: 'Translation service is not available.' });
            }
        } catch (error) {
            this.logger.error('Translate command failed:', error);
            await interaction.editReply({ content: 'An error occurred during translation.' });
        }
    }

    async handleWarnCommand(interaction) {
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        if (!interaction.member.permissions.has('MODERATE_MEMBERS')) {
            return await interaction.reply({ content: 'You don\'t have permission to warn users.', ephemeral: true });
        }
        
        try {
            if (this.moderator) {
                await this.moderator.warnUser(interaction.guild.id, targetUser.id, interaction.user.id, reason);
            }
            
            const embed = new EmbedBuilder()
                .setColor(0xffaa00)
                .setTitle('⚠️ User Warned')
                .addFields(
                    { name: 'User', value: `${targetUser.tag}`, inline: true },
                    { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
                    { name: 'Reason', value: reason, inline: false }
                )
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            
            this.logger.logModerationAction(interaction.guild.id, targetUser.id, interaction.user.id, 'warn', reason);
        } catch (error) {
            this.logger.error('Warn command failed:', error);
            await interaction.reply({ content: 'Failed to warn user.', ephemeral: true });
        }
    }

    // Additional command handlers would be implemented here...
    // For brevity, I'm showing the pattern with a few key commands

    isOnCooldown(userId, commandName) {
        const userCooldowns = this.cooldowns.get(userId);
        if (!userCooldowns) return false;
        
        const commandCooldown = userCooldowns.get(commandName);
        if (!commandCooldown) return false;
        
        return Date.now() < commandCooldown;
    }

    setCooldown(userId, commandName, duration) {
        if (!this.cooldowns.has(userId)) {
            this.cooldowns.set(userId, new Map());
        }
        
        const userCooldowns = this.cooldowns.get(userId);
        userCooldowns.set(commandName, Date.now() + duration);
        
        // Clean up expired cooldowns
        setTimeout(() => {
            userCooldowns.delete(commandName);
            if (userCooldowns.size === 0) {
                this.cooldowns.delete(userId);
            }
        }, duration);
    }

    getCooldownTime(userId, commandName) {
        const userCooldowns = this.cooldowns.get(userId);
        if (!userCooldowns) return 0;
        
        const commandCooldown = userCooldowns.get(commandName);
        if (!commandCooldown) return 0;
        
        return Math.ceil((commandCooldown - Date.now()) / 1000);
    }

    getStats() {
        return this.stats;
    }

    async executeRemoteAction(action, data, userId) {
        // Handle remote dashboard actions
        this.logger.info(`Remote action executed: ${action} by ${userId}`, data);
        // Implementation would depend on the specific action
    }
}

module.exports = EnhancedCommandManager;
