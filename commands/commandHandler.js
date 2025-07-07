// Enhanced Command Handler v10.0 - Premium Edition with Advanced AI Integration
const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, SelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const config = require('../config/config.js');

class EnhancedCommandHandler {
    constructor() {
        this.commands = new Map();
        this.cooldowns = new Map();
        this.commandStats = new Map();
        this.userPermissions = new Map();
        this.commandCategories = new Map();
        this.initializeCommands();
        this.initializeCommandCategories();
        console.log('🚀 Enhanced Command Handler v10.0 - Premium Edition initialized');
    }

    initializeCommandCategories() {
        this.commandCategories.set('moderation', {
            name: '🛡️ Advanced Moderation',
            description: 'Premium AI-powered moderation tools',
            requiredPermissions: [PermissionsBitField.Flags.ManageMessages],
            emoji: '🛡️'
        });

        this.commandCategories.set('translation', {
            name: '🌍 Multi-API Translation',
            description: 'Enterprise translation with 9+ providers',
            requiredPermissions: [],
            emoji: '🌍'
        });

        this.commandCategories.set('analytics', {
            name: '📊 Advanced Analytics',
            description: 'Deep insights and performance metrics',
            requiredPermissions: [PermissionsBitField.Flags.ManageGuild],
            emoji: '📊'
        });

        this.commandCategories.set('ai', {
            name: '🤖 AI Decision Engine',
            description: 'Multi-API AI analysis and insights',
            requiredPermissions: [PermissionsBitField.Flags.ManageMessages],
            emoji: '🤖'
        });

        this.commandCategories.set('configuration', {
            name: '⚙️ Server Configuration',
            description: 'Advanced server settings and customization',
            requiredPermissions: [PermissionsBitField.Flags.ManageGuild],
            emoji: '⚙️'
        });
    }

    initializeCommands() {
        // MODERATION CATEGORY
        this.addCommand(new SlashCommandBuilder()
            .setName('synthia-analysis')
            .setDescription('🧠 Get comprehensive AI analysis of a user with behavioral insights')
            .addUserOption(option =>
                option.setName('user')
                    .setDescription('The user to analyze with advanced AI')
                    .setRequired(true)
            )
            .addBooleanOption(option =>
                option.setName('deep-analysis')
                    .setDescription('Enable deep behavioral pattern analysis')
                    .setRequired(false)
            )
            .addBooleanOption(option =>
                option.setName('risk-assessment')
                    .setDescription('Include advanced risk assessment')
                    .setRequired(false)
            )
            .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages), 
            'moderation'
        );

        this.addCommand(new SlashCommandBuilder()
            .setName('advanced-moderation')
            .setDescription('🛡️ Advanced moderation panel with AI-powered tools')
            .addUserOption(option =>
                option.setName('user')
                    .setDescription('User to moderate')
                    .setRequired(false)
            )
            .addStringOption(option =>
                option.setName('action')
                    .setDescription('Moderation action to take')
                    .setRequired(false)
                    .addChoices(
                        { name: '⚠️ Warn', value: 'warn' },
                        { name: '🗑️ Delete Messages', value: 'delete' },
                        { name: '🔇 Temporary Mute', value: 'mute' },
                        { name: '🔨 Ban', value: 'ban' },
                        { name: '🧹 Clean History', value: 'clean' },
                        { name: '🔍 Investigate', value: 'investigate' }
                    )
            )
            .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages),
            'moderation'
        );

        this.addCommand(new SlashCommandBuilder()
            .setName('bulk-moderate')
            .setDescription('🔥 Bulk moderation with AI pattern detection')
            .addIntegerOption(option =>
                option.setName('messages')
                    .setDescription('Number of messages to analyze (1-100)')
                    .setRequired(true)
                    .setMinValue(1)
                    .setMaxValue(100)
            )
            .addNumberOption(option =>
                option.setName('threshold')
                    .setDescription('Toxicity threshold (0.1-10.0)')
                    .setRequired(false)
                    .setMinValue(0.1)
                    .setMaxValue(10.0)
            )
            .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages),
            'moderation'
        );

        // TRANSLATION CATEGORY
        this.addCommand(new SlashCommandBuilder()
            .setName('translate')
            .setDescription('🌍 Advanced multi-API translation with confidence scoring')
            .addStringOption(option =>
                option.setName('text')
                    .setDescription('Text to translate')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('to')
                    .setDescription('Target language (auto-detects best provider)')
                    .setRequired(false)
            )
            .addStringOption(option =>
                option.setName('from')
                    .setDescription('Source language (auto-detect if not specified)')
                    .setRequired(false)
            )
            .addBooleanOption(option =>
                option.setName('compare-providers')
                    .setDescription('Compare results from multiple providers')
                    .setRequired(false)
            ),
            'translation'
        );

        this.addCommand(new SlashCommandBuilder()
            .setName('translation-analytics')
            .setDescription('📊 Advanced translation performance analytics')
            .addStringOption(option =>
                option.setName('timeframe')
                    .setDescription('Analytics timeframe')
                    .setRequired(false)
                    .addChoices(
                        { name: '📅 Last Hour', value: '1h' },
                        { name: '📅 Last 24 Hours', value: '24h' },
                        { name: '📅 Last Week', value: '7d' },
                        { name: '📅 Last Month', value: '30d' }
                    )
            )
            .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild),
            'translation'
        );

        // AI CATEGORY
        this.addCommand(new SlashCommandBuilder()
            .setName('ai-decision-engine')
            .setDescription('🤖 Access the Multi-API Decision Engine directly')
            .addStringOption(option =>
                option.setName('text')
                    .setDescription('Text to analyze with multiple AI systems')
                    .setRequired(true)
            )
            .addBooleanOption(option =>
                option.setName('detailed-breakdown')
                    .setDescription('Show detailed analysis from each AI provider')
                    .setRequired(false)
            )
            .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages),
            'ai'
        );

        this.addCommand(new SlashCommandBuilder()
            .setName('ai-training')
            .setDescription('🧠 AI training and feedback system')
            .addStringOption(option =>
                option.setName('action')
                    .setDescription('Training action')
                    .setRequired(true)
                    .addChoices(
                        { name: '✅ Mark as Correct', value: 'correct' },
                        { name: '❌ Mark as Incorrect', value: 'incorrect' },
                        { name: '🔄 Retrain Model', value: 'retrain' },
                        { name: '📊 View Training Stats', value: 'stats' }
                    )
            )
            .addStringOption(option =>
                option.setName('message-id')
                    .setDescription('Message ID for training feedback')
                    .setRequired(false)
            )
            .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
            'ai'
        );

        // ANALYTICS CATEGORY
        this.addCommand(new SlashCommandBuilder()
            .setName('server-analytics')
            .setDescription('📊 Comprehensive server analytics and insights')
            .addStringOption(option =>
                option.setName('report-type')
                    .setDescription('Type of analytics report')
                    .setRequired(false)
                    .addChoices(
                        { name: '📈 Moderation Report', value: 'moderation' },
                        { name: '🌍 Language Usage', value: 'language' },
                        { name: '👥 User Behavior', value: 'behavior' },
                        { name: '⚡ Performance Metrics', value: 'performance' },
                        { name: '🛡️ Security Analysis', value: 'security' }
                    )
            )
            .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild),
            'analytics'
        );

        this.addCommand(new SlashCommandBuilder()
            .setName('export-data')
            .setDescription('📥 Export server data and analytics')
            .addStringOption(option =>
                option.setName('format')
                    .setDescription('Export format')
                    .setRequired(true)
                    .addChoices(
                        { name: '📄 JSON', value: 'json' },
                        { name: '📊 CSV', value: 'csv' },
                        { name: '📈 Excel', value: 'xlsx' },
                        { name: '📋 Report', value: 'report' }
                    )
            )
            .addStringOption(option =>
                option.setName('data-type')
                    .setDescription('Type of data to export')
                    .setRequired(true)
                    .addChoices(
                        { name: '🛡️ Moderation Logs', value: 'moderation' },
                        { name: '🌍 Translation Data', value: 'translation' },
                        { name: '📊 Analytics', value: 'analytics' },
                        { name: '👥 User Data', value: 'users' }
                    )
            )
            .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
            'analytics'
        );

        // CONFIGURATION CATEGORY
        this.addCommand(new SlashCommandBuilder()
            .setName('advanced-setup')
            .setDescription('⚙️ Advanced server configuration wizard')
            .addStringOption(option =>
                option.setName('setup-type')
                    .setDescription('Type of setup to perform')
                    .setRequired(false)
                    .addChoices(
                        { name: '🚀 Quick Setup', value: 'quick' },
                        { name: '🔧 Advanced Setup', value: 'advanced' },
                        { name: '🎮 Gaming Server', value: 'gaming' },
                        { name: '🏢 Business Server', value: 'business' },
                        { name: '🎓 Educational Server', value: 'educational' }
                    )
            )
            .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild),
            'configuration'
        );

        this.addCommand(new SlashCommandBuilder()
            .setName('threshold-tuning')
            .setDescription('🎛️ Advanced AI threshold tuning and optimization')
            .addNumberOption(option =>
                option.setName('sensitivity')
                    .setDescription('AI sensitivity level (0.1-2.0)')
                    .setRequired(false)
                    .setMinValue(0.1)
                    .setMaxValue(2.0)
            )
            .addBooleanOption(option =>
                option.setName('auto-tune')
                    .setDescription('Enable automatic threshold optimization')
                    .setRequired(false)
            )
            .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
            'configuration'
        );

        // UTILITY COMMANDS
        this.addCommand(new SlashCommandBuilder()
            .setName('help-advanced')
            .setDescription('📚 Advanced help system with interactive guides')
            .addStringOption(option =>
                option.setName('category')
                    .setDescription('Help category')
                    .setRequired(false)
                    .addChoices(
                        { name: '🛡️ Moderation', value: 'moderation' },
                        { name: '🌍 Translation', value: 'translation' },
                        { name: '🤖 AI Features', value: 'ai' },
                        { name: '📊 Analytics', value: 'analytics' },
                        { name: '⚙️ Configuration', value: 'configuration' }
                    )
            ),
            'utility'
        );

        this.addCommand(new SlashCommandBuilder()
            .setName('system-status')
            .setDescription('🔍 Comprehensive system status and health check')
            .addBooleanOption(option =>
                option.setName('detailed')
                    .setDescription('Show detailed technical information')
                    .setRequired(false)
            )
            .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages),
            'utility'
        );
    }

    addCommand(commandBuilder, category = 'general') {
        const command = {
            data: commandBuilder,
            category: category,
            cooldown: 3,
            permissions: [],
            premium: false
        };
        
        this.commands.set(commandBuilder.name, command);
        this.commandStats.set(commandBuilder.name, {
            uses: 0,
            errors: 0,
            avgResponseTime: 0,
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

        // Performance tracking
        const startTime = Date.now();
        
        try {
            // Update command statistics
            this.updateCommandStats(commandName, startTime);
            
            // Check cooldowns
            if (this.isOnCooldown(interaction.user.id, commandName)) {
                const remaining = this.getCooldownRemaining(interaction.user.id, commandName);
                return await interaction.reply({
                    content: `⏰ Command on cooldown. Try again in ${remaining}s.`,
                    ephemeral: true
                });
            }

            // Apply cooldown
            this.applyCooldown(interaction.user.id, commandName, command.cooldown);

            // Route to appropriate handler
            switch (commandName) {
                case 'synthia-analysis':
                    await this.handleSynthiaAnalysis(interaction, synthiaAI, synthiaTranslator);
                    break;
                case 'advanced-moderation':
                    await this.handleAdvancedModeration(interaction, synthiaAI, serverLogger);
                    break;
                case 'bulk-moderate':
                    await this.handleBulkModeration(interaction, synthiaAI);
                    break;
                case 'translate':
                    await this.handleAdvancedTranslate(interaction, synthiaTranslator);
                    break;
                case 'translation-analytics':
                    await this.handleTranslationAnalytics(interaction, synthiaTranslator);
                    break;
                case 'ai-decision-engine':
                    await this.handleAIDecisionEngine(interaction, synthiaAI);
                    break;
                case 'ai-training':
                    await this.handleAITraining(interaction, synthiaAI);
                    break;
                case 'server-analytics':
                    await this.handleServerAnalytics(interaction, synthiaAI, serverLogger);
                    break;
                case 'export-data':
                    await this.handleExportData(interaction, synthiaAI, serverLogger);
                    break;
                case 'advanced-setup':
                    await this.handleAdvancedSetup(interaction, serverLogger);
                    break;
                case 'threshold-tuning':
                    await this.handleThresholdTuning(interaction, synthiaAI);
                    break;
                case 'help-advanced':
                    await this.handleAdvancedHelp(interaction);
                    break;
                case 'system-status':
                    await this.handleSystemStatus(interaction, synthiaAI, synthiaTranslator);
                    break;
                default:
                    await interaction.reply({
                        content: '🚧 This command is not yet implemented.',
                        ephemeral: true
                    });
            }

            // Update success statistics
            const processingTime = Date.now() - startTime;
            this.updateSuccessStats(commandName, processingTime);

        } catch (error) {
            console.error(`❌ Enhanced command error (${commandName}):`, error);
            
            // Update error statistics
            this.updateErrorStats(commandName);
            
            const errorEmbed = new EmbedBuilder()
                .setColor(config.colors.error)
                .setTitle('❌ Command Error')
                .setDescription('An error occurred while processing this command.')
                .addFields(
                    { name: 'Command', value: commandName, inline: true },
                    { name: 'Error', value: error.message.slice(0, 1024), inline: false },
                    { name: 'Support', value: 'This error has been logged for investigation.', inline: false }
                )
                .setTimestamp();

            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            } else if (interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            }
        }
    }

    async handleSynthiaAnalysis(interaction, synthiaAI, synthiaTranslator) {
        await interaction.deferReply();
        
        const targetUser = interaction.options.getUser('user');
        const deepAnalysis = interaction.options.getBoolean('deep-analysis') || false;
        const riskAssessment = interaction.options.getBoolean('risk-assessment') || false;
        
        // Get comprehensive user analysis
        const analysis = await synthiaAI.getComprehensiveUserAnalysis(targetUser.id, {
            deepAnalysis,
            riskAssessment,
            includePatterns: true,
            includePredictions: true
        });
        
        const embed = new EmbedBuilder()
            .setTitle(`🧠 Advanced Synthia Analysis - ${targetUser.tag}`)
            .setDescription('**Multi-API AI Analysis with Behavioral Insights**')
            .setColor(analysis.riskLevel >= 7 ? config.colors.error : 
                     analysis.riskLevel >= 4 ? config.colors.warning : 
                     config.colors.success)
            .setThumbnail(targetUser.displayAvatarURL())
            .addFields(
                { name: '📊 Risk Level', value: `${analysis.riskLevel}/10`, inline: true },
                { name: '💬 Messages Analyzed', value: `${analysis.messageCount}`, inline: true },
                { name: '⚠️ Total Violations', value: `${analysis.violations}`, inline: true },
                { name: '🌍 Languages Used', value: `${analysis.languagesUsed}`, inline: true },
                { name: '🤖 AI Confidence', value: `${analysis.confidence}%`, inline: true },
                { name: '📈 Behavior Trend', value: analysis.behaviorTrend, inline: true }
            );

        if (deepAnalysis) {
            embed.addFields(
                { name: '🧠 Behavioral Patterns', value: analysis.patterns.slice(0, 3).join('\n') || 'No significant patterns', inline: false },
                { name: '⏰ Activity Pattern', value: `Most active: ${analysis.activityPattern}`, inline: true },
                { name: '📱 Communication Style', value: analysis.communicationStyle, inline: true }
            );
        }

        if (riskAssessment) {
            embed.addFields(
                { name: '🚨 Risk Factors', value: analysis.riskFactors.join('\n') || 'None identified', inline: false },
                { name: '🔮 Prediction', value: analysis.prediction, inline: false }
            );
        }

        // Add action buttons
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`moderate_${targetUser.id}`)
                    .setLabel('🛡️ Moderate')
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(analysis.riskLevel < 3),
                new ButtonBuilder()
                    .setCustomId(`detailed_report_${targetUser.id}`)
                    .setLabel('📊 Detailed Report')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`export_analysis_${targetUser.id}`)
                    .setLabel('📥 Export')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.editReply({ embeds: [embed], components: [row] });
    }

    async handleAdvancedModeration(interaction, synthiaAI, serverLogger) {
        await interaction.deferReply({ ephemeral: true });
        
        const user = interaction.options.getUser('user');
        const action = interaction.options.getString('action');
        
        if (!user && !action) {
            // Show moderation panel
            const embed = new EmbedBuilder()
                .setTitle('🛡️ Advanced Moderation Panel')
                .setDescription('Select a moderation action or tool')
                .setColor(config.colors.moderation)
                .addFields(
                    { name: '🔍 Analysis Tools', value: 'User analysis, risk assessment, pattern detection', inline: true },
                    { name: '⚡ Quick Actions', value: 'Warn, mute, ban, clean messages', inline: true },
                    { name: '📊 Bulk Operations', value: 'Mass moderation, pattern cleanup', inline: true }
                );

            const selectMenu = new ActionRowBuilder()
                .addComponents(
                    new SelectMenuBuilder()
                        .setCustomId('moderation_action')
                        .setPlaceholder('Choose a moderation action...')
                        .addOptions([
                            {
                                label: '🔍 Analyze Server',
                                description: 'Run comprehensive server analysis',
                                value: 'analyze_server'
                            },
                            {
                                label: '🧹 Cleanup Messages',
                                description: 'Clean toxic messages automatically',
                                value: 'cleanup_messages'
                            },
                            {
                                label: '📊 Generate Report',
                                description: 'Create detailed moderation report',
                                value: 'generate_report'
                            },
                            {
                                label: '⚙️ Configure Settings',
                                description: 'Adjust moderation settings',
                                value: 'configure_settings'
                            }
                        ])
                );

            await interaction.editReply({ embeds: [embed], components: [selectMenu] });
        } else {
            // Handle specific action
            await this.executeSpecificModerationAction(interaction, user, action, synthiaAI);
        }
    }

    async handleAdvancedTranslate(interaction, synthiaTranslator) {
        await interaction.deferReply();
        
        const text = interaction.options.getString('text');
        const targetLang = interaction.options.getString('to') || 'en';
        const sourceLang = interaction.options.getString('from');
        const compareProviders = interaction.options.getBoolean('compare-providers') || false;
        
        if (compareProviders) {
            // Multi-provider comparison
            const providers = ['google', 'deepl', 'microsoft', 'libretranslate'];
            const results = [];
            
            for (const provider of providers) {
                try {
                    const result = await synthiaTranslator.translateWithSpecificProvider(text, targetLang, sourceLang, provider);
                    results.push({
                        provider: provider,
                        result: result,
                        success: true
                    });
                } catch (error) {
                    results.push({
                        provider: provider,
                        error: error.message,
                        success: false
                    });
                }
            }
            
            const embed = new EmbedBuilder()
                .setTitle('🌍 Multi-Provider Translation Comparison')
                .setColor(config.colors.translation)
                .addFields(
                    { name: '📝 Original Text', value: `\`\`\`${text.slice(0, 500)}\`\`\``, inline: false }
                );
            
            for (const result of results) {
                if (result.success) {
                    embed.addFields({
                        name: `🔧 ${result.provider.toUpperCase()} (${result.result.confidence}%)`,
                        value: `\`\`\`${result.result.translatedText.slice(0, 200)}\`\`\``,
                        inline: false
                    });
                } else {
                    embed.addFields({
                        name: `❌ ${result.provider.toUpperCase()}`,
                        value: `Error: ${result.error}`,
                        inline: false
                    });
                }
            }
            
            await interaction.editReply({ embeds: [embed] });
        } else {
            // Standard translation with best provider
            const translation = await synthiaTranslator.translateText(text, targetLang, sourceLang);
            
            const embed = new EmbedBuilder()
                .setTitle('🌍 Advanced Translation Result')
                .setColor(config.colors.translation)
                .addFields(
                    { name: `📝 Original (${translation.originalLanguage})`, value: `\`\`\`${text.slice(0, 500)}\`\`\``, inline: false },
                    { name: `🌟 Translation (${translation.targetLanguage})`, value: `\`\`\`${translation.translatedText.slice(0, 500)}\`\`\``, inline: false },
                    { name: '🔧 Provider', value: translation.provider, inline: true },
                    { name: '📊 Confidence', value: `${translation.confidence}%`, inline: true },
                    { name: '⚡ Time', value: `${translation.processingTime}ms`, inline: true }
                );
            
            if (translation.error) {
                embed.addFields({ name: '❌ Error', value: translation.error });
            }
            
            await interaction.editReply({ embeds: [embed] });
        }
    }

    async handleSystemStatus(interaction, synthiaAI, synthiaTranslator) {
        await interaction.deferReply();
        
        const detailed = interaction.options.getBoolean('detailed') || false;
        
        // Get system status from all components
        const [aiStatus, translatorStatus, commandStats] = await Promise.all([
            synthiaAI.getSystemStatus(),
            synthiaTranslator.getSystemStatus(),
            this.getCommandStatistics()
        ]);
        
        const embed = new EmbedBuilder()
            .setTitle('🔍 Enhanced Synthia System Status')
            .setDescription('**Comprehensive System Health Check**')
            .setColor(config.colors.success)
            .addFields(
                { name: '🤖 AI Decision Engine', value: `Status: ${aiStatus.status}\nAPIs: ${aiStatus.workingApis}/${aiStatus.totalApis}\nAnalyses: ${aiStatus.totalAnalyses}`, inline: true },
                { name: '🌍 Translation System', value: `Providers: ${translatorStatus.workingProviders}/${translatorStatus.totalProviders}\nSuccess Rate: ${translatorStatus.successRate}%\nAvg Time: ${translatorStatus.avgTime}ms`, inline: true },
                { name: '⚡ Command System', value: `Commands: ${commandStats.totalCommands}\nSuccess Rate: ${commandStats.successRate}%\nAvg Response: ${commandStats.avgResponseTime}ms`, inline: true }
            );
        
        if (detailed) {
            embed.addFields(
                { name: '📊 Performance Metrics', value: `Memory: ${this.getMemoryUsage()}\nUptime: ${this.getUptime()}\nLoad: ${this.getSystemLoad()}`, inline: false },
                { name: '🔧 API Details', value: this.formatAPIDetails(aiStatus.apis), inline: false }
            );
        }
        
        // Add status indicators
        const statusRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('refresh_status')
                    .setLabel('🔄 Refresh')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('detailed_diagnostics')
                    .setLabel('🔍 Diagnostics')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('export_status')
                    .setLabel('📥 Export')
                    .setStyle(ButtonStyle.Secondary)
            );
        
        await interaction.editReply({ embeds: [embed], components: [statusRow] });
    }

    // Utility methods for cooldowns and statistics
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
        
        // Cleanup expired cooldowns
        setTimeout(() => {
            commandCooldowns.delete(userId);
        }, cooldownSeconds * 1000);
    }

    updateCommandStats(commandName, startTime) {
        const stats = this.commandStats.get(commandName);
        if (stats) {
            stats.uses++;
            stats.lastUsed = new Date();
        }
    }

    updateSuccessStats(commandName, processingTime) {
        const stats = this.commandStats.get(commandName);
        if (stats) {
            const totalTime = stats.avgResponseTime * (stats.uses - 1) + processingTime;
            stats.avgResponseTime = Math.round(totalTime / stats.uses);
        }
    }

    updateErrorStats(commandName) {
        const stats = this.commandStats.get(commandName);
        if (stats) {
            stats.errors++;
        }
    }

    getCommandStatistics() {
        let totalCommands = 0;
        let totalUses = 0;
        let totalErrors = 0;
        let totalResponseTime = 0;
        
        for (const [name, stats] of this.commandStats) {
            totalCommands++;
            totalUses += stats.uses;
            totalErrors += stats.errors;
            totalResponseTime += stats.avgResponseTime;
        }
        
        return {
            totalCommands,
            totalUses,
            totalErrors,
            successRate: totalUses > 0 ? Math.round(((totalUses - totalErrors) / totalUses) * 100) : 100,
            avgResponseTime: totalCommands > 0 ? Math.round(totalResponseTime / totalCommands) : 0
        };
    }

    getMemoryUsage() {
        const used = process.memoryUsage();
        return `${Math.round(used.heapUsed / 1024 / 1024)}MB`;
    }

    getUptime() {
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }

    getSystemLoad() {
        return `${Math.round(process.cpuUsage().user / 1000)}ms`;
    }

    formatAPIDetails(apis) {
        return Object.entries(apis)
            .map(([name, status]) => `**${name}**: ${status.working ? '✅' : '❌'} (${status.responseTime}ms)`)
            .join('\n')
            .slice(0, 1024);
    }

    // Get all commands for registration
    getSlashCommands() {
        return Array.from(this.commands.values()).map(cmd => cmd.data);
    }
}

module.exports = EnhancedCommandHandler;
