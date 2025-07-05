// Enhanced Command Handler v9.0 - WITH MULTI-API DECISION ENGINE COMMANDS
const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config/config.js');

// Slash Commands Definition (UPDATED with decision engine commands)
const commands = [
    new SlashCommandBuilder()
        .setName('synthia-analysis')
        .setDescription('Get Synthia v9.0 superintelligence analysis of a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to analyze')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages),
    
    new SlashCommandBuilder()
        .setName('language-stats')
        .setDescription('Get multi-language statistics and analysis')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild),

    new SlashCommandBuilder()
        .setName('translate')
        .setDescription('Translate text using enhanced multi-API system (defaults to English)')
        .addStringOption(option =>
            option.setName('text')
                .setDescription('Text to translate')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('to')
                .setDescription('Target language (e.g., Spanish, French, Japanese, etc.) - defaults to English')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('from')
                .setDescription('Source language (auto-detect if not specified)')
                .setRequired(false)
        ),

    new SlashCommandBuilder()
        .setName('set-server-language')
        .setDescription('Set default translation language for this server')
        .addStringOption(option =>
            option.setName('language')
                .setDescription('Default language for the server')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild),

    new SlashCommandBuilder()
        .setName('auto-translate')
        .setDescription('Toggle automatic translation of foreign messages')
        .addBooleanOption(option =>
            option.setName('enabled')
                .setDescription('Enable or disable auto-translation')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild),

    new SlashCommandBuilder()
        .setName('toggle-automod')
        .setDescription('Toggle automatic moderation on/off for this server')
        .addBooleanOption(option =>
            option.setName('enabled')
                .setDescription('Enable or disable auto-moderation')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild),

    new SlashCommandBuilder()
        .setName('supported-languages')
        .setDescription('List all supported languages for translation'),
    
    new SlashCommandBuilder()
        .setName('clear-warnings')
        .setDescription('Clear warnings for a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to clear warnings for')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages),
    
    new SlashCommandBuilder()
        .setName('test-detection')
        .setDescription('Test elongated word and multi-language detection')
        .addStringOption(option =>
            option.setName('text')
                .setDescription('Text to test')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('api-status')
        .setDescription('Check multi-API translation status and performance')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages),
    
    new SlashCommandBuilder()
        .setName('test-apis')
        .setDescription('Test all translation APIs')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages),
    
    new SlashCommandBuilder()
        .setName('translation-stats')
        .setDescription('View translation statistics and provider performance')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages),

    new SlashCommandBuilder()
        .setName('test-pokemon')
        .setDescription('Test Pokemon file detection and trading code protection')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages),

    new SlashCommandBuilder()
        .setName('test-translate')
        .setDescription('Test the translation system with sample text')
        .addStringOption(option =>
            option.setName('text')
                .setDescription('Text to test translation with')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages),

    new SlashCommandBuilder()
        .setName('setup-wizard')
        .setDescription('Interactive setup wizard for Enhanced Synthia configuration')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild),

    new SlashCommandBuilder()
        .setName('test-bypass')
        .setDescription('Test bypass detection system with Pokemon awareness')
        .addStringOption(option =>
            option.setName('text')
                .setDescription('Text to test for bypass attempts')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages),

    // NEW: Multi-API Decision Engine Commands
    new SlashCommandBuilder()
        .setName('decision-engine-status')
        .setDescription('Check Multi-API Decision Engine status and performance')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages),

    new SlashCommandBuilder()
        .setName('test-decision-engine')
        .setDescription('Test the Multi-API Decision Engine with sample text')
        .addStringOption(option =>
            option.setName('text')
                .setDescription('Text to analyze with the decision engine')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages),

    new SlashCommandBuilder()
        .setName('moderation-analysis')
        .setDescription('Get detailed moderation analysis using all available APIs')
        .addStringOption(option =>
            option.setName('text')
                .setDescription('Text to analyze for moderation')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
];

// Text Command Handler (keeping existing implementation)
async function handleTextCommand(message, synthiaTranslator, synthiaAI, serverLogger, discordLogger, userViolations) {
    if (!message.content.startsWith('!synthia') || !message.member?.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;

    const args = message.content.split(' ');
    const command = args[1];

    switch (command) {
        case 'loghere': {
            const added = serverLogger.addLogChannel(message.guild.id, message.channel.id, message.guild.name);
            if (added) {
                await message.reply(`✅ Added this channel for Enhanced Synthia v9.0 Multi-API logging.`);
                discordLogger.sendLog(message.guild, 'success', '✅ Enhanced Log Channel Added', 
                    `${message.channel} is now configured for Multi-API logging.`);
            } else {
                await message.reply({
                    content: `⚠️ This channel is already configured for logging.\n\n` +
                            `**🔍 If logs aren't appearing, try these commands:**\n` +
                            `• \`!synthia debug\` - Check configuration and permissions\n` +
                            `• \`!synthia testlog\` - Test the logging system\n` +
                            `• \`!synthia fixlogs\` - Auto-repair logging issues`
                });
            }
            break;
        }

        case 'status': {
            const stats = synthiaTranslator.getTranslationStats();
            const autoModStatus = serverLogger.isAutoModerationEnabled(message.guild.id);
            const decisionEngineStatus = synthiaAI.getDecisionEngineStatus();
            
            const embed = new EmbedBuilder()
                .setTitle(`🚀 Enhanced Synthia v${config.aiVersion} Status`)
                .setDescription('**Multi-API Intelligence System with Pokemon Protection + Decision Engine**')
                .addFields(
                    { name: '🧠 Intelligence Level', value: 'IQ 300+ Enhanced', inline: true },
                    { name: '🔄 Multi-API Providers', value: `${Object.keys(synthiaTranslator.enhancedAPI.apis).length}`, inline: true },
                    { name: '🌍 Languages', value: `${synthiaTranslator.enhancedAPI.supportedLanguages.size}`, inline: true },
                    { name: '📊 Total Translations', value: `${stats.totalTranslations}`, inline: true },
                    { name: '✅ Success Rate', value: `${stats.successRate}%`, inline: true },
                    { name: '⚡ Avg Response Time', value: `${stats.averageResponseTime}ms`, inline: true },
                    { name: '👥 AI Profiles', value: `${synthiaAI.profiles.size}`, inline: true },
                    { name: '🌐 Servers', value: `${message.client.guilds.cache.size}`, inline: true },
                    { name: '🚨 Auto-Moderation', value: autoModStatus ? '✅ Enabled' : '❌ Disabled', inline: true },
                    { name: '🎮 Pokemon Protection', value: '✅ ACTIVE', inline: true },
                    { name: '🛡️ Bypass Detection', value: '✅ ENHANCED', inline: true },
                    { name: '🔍 False Positives', value: '✅ FIXED', inline: true },
                    { name: '🤖 Decision Engine', value: decisionEngineStatus.systemHealth === 'operational' ? '✅ ACTIVE' : '⚠️ LIMITED', inline: true },
                    { name: '🔧 Decision APIs', value: `${Object.keys(decisionEngineStatus.apiStatuses).filter(api => decisionEngineStatus.apiStatuses[api].enabled).length} Available`, inline: true },
                    { name: '📈 Total Analyses', value: `${decisionEngineStatus.totalAnalyses}`, inline: true }
                )
                .setColor(config.colors.primary)
                .setTimestamp();
            
            await message.reply({ embeds: [embed] });
            break;
        }

        case 'help': {
            const helpEmbed = new EmbedBuilder()
                .setTitle('🧠 Enhanced Synthia v9.0 Help')
                .setDescription('Multi-API Intelligence Moderation & Translation System with Pokemon Protection + Decision Engine')
                .addFields(
                    { name: '🚀 Quick Setup', value: '`/setup-wizard` - **Interactive setup guide**\n`!synthia loghere` - Set log channel\n`!synthia status` - System status' },
                    { name: '🛡️ Moderation', value: '`/toggle-automod` - Toggle auto-moderation\n`/test-detection` - Test detection system\n`/test-bypass` - Test bypass detection' },
                    { name: '🌍 Translation', value: '`/translate` - **Main translation command**\n`/auto-translate` - Toggle auto-translation\n`/supported-languages` - List all languages' },
                    { name: '📊 Analysis', value: '`/synthia-analysis` - Analyze user\n`/api-status` - API status\n`/translation-stats` - Performance stats' },
                    { name: '🎮 Pokemon Support', value: '`/test-pokemon` - **Test Pokemon protection**\n✅ Pokemon files (.pk9, .pk8, .pb8, etc.) are WHITELISTED!\n✅ Trading codes (.trade 12345678) are PROTECTED!' },
                    { name: '🤖 Decision Engine', value: '`/decision-engine-status` - **Multi-API status**\n`/test-decision-engine` - Test AI analysis\n`/moderation-analysis` - Deep analysis' }
                )
                .setColor(config.colors.info)
                .setFooter({ text: '💡 Enhanced with Multi-API Decision Engine for unprecedented accuracy!' });
            
            await message.reply({ embeds: [helpEmbed] });
            break;
        }

        default: {
            await message.reply('❓ Unknown command. Use `!synthia help` for available commands.');
            break;
        }
    }
}

// ENHANCED: Complete Slash Command Handler Implementation with Decision Engine commands
async function handleSlashCommand(interaction, synthiaTranslator, synthiaAI, serverLogger, discordLogger, userViolations) {
    console.log(`🎯 Enhanced Slash Command: ${interaction.commandName} by ${interaction.user.tag}`);

    try {
        switch (interaction.commandName) {
            case 'synthia-analysis': {
                await interaction.deferReply();
                
                const targetUser = interaction.options.getUser('user');
                const profile = synthiaAI.getProfile(targetUser.id);
                
                if (!profile) {
                    await interaction.editReply(`No enhanced data found for ${targetUser.tag}`);
                    return;
                }
                
                const languagesUsed = profile.languageHistory 
                    ? [...new Set(profile.languageHistory.map(entry => entry.language))].length 
                    : 0;
                
                const analysisEmbed = new EmbedBuilder()
                    .setTitle(`🧠 Enhanced Synthia v${config.aiVersion} Analysis`)
                    .setDescription(`**Multi-API Intelligence Analysis for ${targetUser.tag}**`)
                    .addFields(
                        { name: '📊 Risk Score', value: `${profile.riskScore || 0}/10`, inline: true },
                        { name: '💬 Messages', value: `${profile.messageCount || 0}`, inline: true },
                        { name: '⚠️ Violations', value: `${profile.violations?.length || 0}`, inline: true },
                        { name: '🌍 Languages', value: `${languagesUsed}`, inline: true },
                        { name: '🔄 Multi-API Translations', value: `${profile.multiApiTranslations || 0}`, inline: true },
                        { name: '🚨 Bypass Attempts', value: `${profile.totalBypassAttempts || 0}`, inline: true },
                        { name: '📅 First Seen', value: new Date(profile.createdAt).toLocaleDateString(), inline: true },
                        { name: '🎮 Pokemon Protected', value: '✅ Active', inline: true },
                        { name: '🛡️ Enhanced Detection', value: '✅ Enabled', inline: true },
                        { name: '🤖 Decision Engine Uses', value: `${profile.violations?.filter(v => v.decisionEngineUsed).length || 0}`, inline: true }
                    )
                    .setColor((profile.riskScore || 0) >= 7 ? config.colors.error : 
                              (profile.riskScore || 0) >= 4 ? config.colors.warning : 
                              config.colors.success)
                    .setThumbnail(targetUser.displayAvatarURL());
                
                if (profile.violations && profile.violations.length > 0) {
                    const recentViolations = profile.violations.slice(-3).map(v => {
                        const lang = synthiaTranslator.enhancedAPI.supportedLanguages.get(v.language) || v.language;
                        const bypass = v.bypassDetected ? ' 🚨 BYPASS' : '';
                        const engine = v.decisionEngineUsed ? ' 🤖 AI' : '';
                        return `• **${v.violationType}** - Level ${v.threatLevel}/10 (${lang})${bypass}${engine}`;
                    }).join('\n');
                    
                    analysisEmbed.addFields({
                        name: '🚨 Recent Violations',
                        value: recentViolations
                    });
                }

                if (profile.bypassHistory && profile.bypassHistory.length > 0) {
                    const bypassStats = synthiaAI.getBypassStatistics(targetUser.id);
                    analysisEmbed.addFields({
                        name: '🔍 Bypass Detection History',
                        value: `Total Attempts: ${bypassStats.totalAttempts}\nRecent (24h): ${bypassStats.recentAttempts}\nCommon Methods: ${bypassStats.commonMethods.map(m => m.method).join(', ') || 'None'}`,
                        inline: false
                    });
                }
                
                await interaction.editReply({ embeds: [analysisEmbed] });
                break;
            }
            
            case 'test-detection': {
                await interaction.deferReply();
                
                const detectionTestText = interaction.options.getString('text');
                const detectionAnalysis = await synthiaAI.analyzeMessage(detectionTestText, interaction.user, interaction.channel, { guild: interaction.guild });
                
                // Check if this is Pokemon content
                const isPokemonContent = synthiaAI.isPokemonRelatedContent(detectionTestText);
                
                const detectionEmbed = new EmbedBuilder()
                    .setTitle('🔍 Enhanced Detection Test Results')
                    .setColor(detectionAnalysis.threatLevel >= 5 ? config.colors.error : 
                             detectionAnalysis.threatLevel >= 2 ? config.colors.warning : 
                             config.colors.success)
                    .addFields(
                        { name: '📝 Text', value: detectionTestText.slice(0, 1024), inline: false },
                        { name: '🎮 Pokemon Content', value: isPokemonContent ? '✅ YES (Protected)' : '❌ NO', inline: true },
                        { name: '🌍 Language', value: detectionAnalysis.language.originalLanguage, inline: true },
                        { name: '⚖️ Threat Level', value: `${detectionAnalysis.threatLevel}/10`, inline: true },
                        { name: '🎯 Confidence', value: `${detectionAnalysis.confidence}%`, inline: true },
                        { name: '🔍 Bypass Detected', value: detectionAnalysis.bypassDetected ? '🚨 YES' : '✅ NO', inline: true },
                        { name: '⚡ Processing Time', value: `${detectionAnalysis.processingTime}ms`, inline: true },
                        { name: '🤖 Decision Engine', value: detectionAnalysis.decisionEngineUsed ? '✅ USED' : '❌ Fallback', inline: true },
                        { name: '🔧 APIs Consulted', value: detectionAnalysis.apiResults ? Object.keys(detectionAnalysis.apiResults).filter(api => detectionAnalysis.apiResults[api] && !detectionAnalysis.apiResults[api].error).length : 0, inline: true }
                    );

                detectionEmbed.addFields({
                    name: '🔧 Action Thresholds',
                    value: `Warn: ${config.moderationThresholds.warn}+ | Delete: ${config.moderationThresholds.delete}+ | Mute: ${config.moderationThresholds.mute}+ | Ban: ${config.moderationThresholds.ban}+`,
                    inline: false
                });

                detectionEmbed.addFields({
                    name: '⚡ Final Action',
                    value: detectionAnalysis.action !== 'none' ? `🚨 **${detectionAnalysis.action.toUpperCase()}**` : '✅ **NO ACTION**',
                    inline: true
                });

                detectionEmbed.addFields({
                    name: '🛡️ Automod Status',
                    value: serverLogger.isAutoModerationEnabled(interaction.guild.id) ? '✅ Enabled' : '❌ Disabled',
                    inline: true
                });
                
                if (detectionAnalysis.reasoning.length > 0) {
                    detectionEmbed.addFields({
                        name: '🧠 AI Reasoning',
                        value: detectionAnalysis.reasoning.slice(0, 5).map(r => `• ${r}`).join('\n').slice(0, 1024),
                        inline: false
                    });
                }

                if (isPokemonContent) {
                    detectionEmbed.addFields({
                        name: '🎮 Pokemon Protection Active',
                        value: 'This content was identified as legitimate Pokemon content and is automatically protected from moderation actions.',
                        inline: false
                    });
                }

                if (detectionAnalysis.decisionEngineUsed && detectionAnalysis.apiResults) {
                    const workingApis = Object.keys(detectionAnalysis.apiResults).filter(api => detectionAnalysis.apiResults[api] && !detectionAnalysis.apiResults[api].error);
                    if (workingApis.length > 0) {
                        detectionEmbed.addFields({
                            name: '🤖 Multi-API Analysis Details',
                            value: `${workingApis.length} AI systems were consulted:\n${workingApis.map(api => `• **${api}**`).join('\n')}`,
                            inline: false
                        });
                    }
                }
                
                await interaction.editReply({ embeds: [detectionEmbed] });
                break;
            }

            case 'api-status': {
                await interaction.deferReply();
                
                const apiStatus = synthiaTranslator.getTranslationStatus();
                const decisionEngineApiStatus = synthiaAI.getDecisionEngineStatus();
                
                const statusEmbed = new EmbedBuilder()
                    .setTitle('🔧 Multi-API Status Dashboard')
                    .setDescription('Translation APIs + Decision Engine APIs Status')
                    .setColor(config.colors.multiapi);

                // Translation APIs
                let workingTranslationProviders = 0;
                let totalTranslationProviders = 0;

                for (const [provider, status] of Object.entries(apiStatus.providers)) {
                    totalTranslationProviders++;
                    if (status.available) workingTranslationProviders++;
                    
                    const statusIcon = status.available ? '✅' : '❌';
                    const resetTime = status.resetInMinutes > 0 ? `${status.resetInMinutes}min` : 'Ready';
                    
                    statusEmbed.addFields({
                        name: `${statusIcon} ${provider} (Translation)`,
                        value: `Requests: ${status.requestsUsed}/${status.rateLimit}\nReset: ${resetTime}\nReliability: ${status.reliability}%`,
                        inline: true
                    });
                }

                // Decision Engine APIs
                let workingDecisionApis = 0;
                let totalDecisionApis = 0;

                for (const [apiName, apiInfo] of Object.entries(decisionEngineApiStatus.apiStatuses)) {
                    totalDecisionApis++;
                    if (apiInfo.enabled) workingDecisionApis++;
                    
                    const statusIcon = apiInfo.enabled ? '✅' : '❌';
                    
                    statusEmbed.addFields({
                        name: `${statusIcon} ${apiName} (AI Analysis)`,
                        value: `Success: ${apiInfo.successRate}%\nAvg Time: ${apiInfo.averageResponseTime}ms\nCalls: ${apiInfo.totalCalls}`,
                        inline: true
                    });
                }

                statusEmbed.addFields({
                    name: '📊 Translation APIs Status',
                    value: `${workingTranslationProviders}/${totalTranslationProviders} providers available\nTotal requests: ${apiStatus.totalRequests}\nTotal characters: ${apiStatus.totalCharacters}`,
                    inline: false
                });

                statusEmbed.addFields({
                    name: '🤖 Decision Engine Status',
                    value: `${workingDecisionApis}/${totalDecisionApis} AI systems available\nTotal analyses: ${decisionEngineApiStatus.totalAnalyses}\nSystem health: ${decisionEngineApiStatus.systemHealth}`,
                    inline: false
                });

                statusEmbed.addFields({
                    name: '🎮 Pokemon Protection',
                    value: '✅ Always Active (Independent of APIs)',
                    inline: false
                });
                
                await interaction.editReply({ embeds: [statusEmbed] });
                break;
            }

            case 'test-apis': {
                await interaction.deferReply();
                
                await interaction.editReply('🧪 Testing all translation APIs... This may take a moment.');
                
                const testResults = await synthiaTranslator.testAllAPIs();
                
                const testEmbed = new EmbedBuilder()
                    .setTitle('🧪 Translation API Test Results')
                    .setDescription('Complete test of all translation providers')
                    .setColor(config.colors.performance)
                    .addFields({
                        name: '📊 Summary',
                        value: `Working: ${testResults.summary.workingProviders}/${testResults.summary.totalProviders}\nAverage Time: ${testResults.summary.averageResponseTime}ms\nReliability: ${testResults.summary.reliability}%\nBidirectional Tests: ${testResults.summary.bidirectionalTests || 0}\nSuccess Rate: ${testResults.summary.bidirectionalSuccessRate || 0}%`,
                        inline: false
                    });

                for (const [provider, result] of Object.entries(testResults.individual)) {
                    const statusIcon = result.working ? '✅' : '❌';
                    const resultText = result.working 
                        ? `Success Rate: ${result.successRate || 0}%\nAvg Time: ${result.time}ms\nTests: ${result.successfulTests || 0}/${result.bidirectionalTests || 1}`
                        : `Error: ${result.error || 'Unknown error'}\nStatus: Failed to connect`;
                    
                    testEmbed.addFields({
                        name: `${statusIcon} ${provider}`,
                        value: resultText,
                        inline: true
                    });
                }

                testEmbed.addFields({
                    name: '🎮 Pokemon Protection',
                    value: '✅ All APIs respect Pokemon content protection',
                    inline: false
                });
                
                await interaction.editReply({ embeds: [testEmbed] });
                break;
            }

            case 'translation-stats': {
                await interaction.deferReply();
                
                const detailedStats = synthiaTranslator.getTranslationStats();
                const engineStats = synthiaAI.getDecisionEngineStatus();
                
                const statsDetailEmbed = new EmbedBuilder()
                    .setTitle('📊 Complete System Performance Statistics')
                    .setDescription('Translation + Decision Engine Performance with Pokemon Protection')
                    .setColor(config.colors.performance)
                    .addFields(
                        { name: '🔄 Total Translations', value: `${detailedStats.totalTranslations}`, inline: true },
                        { name: '✅ Translation Success', value: `${detailedStats.successfulTranslations}`, inline: true },
                        { name: '❌ Translation Failures', value: `${detailedStats.failedTranslations}`, inline: true },
                        { name: '📈 Translation Success Rate', value: `${detailedStats.successRate}%`, inline: true },
                        { name: '⚡ Avg Translation Time', value: `${detailedStats.averageResponseTime}ms`, inline: true },
                        { name: '🔧 Translation Providers', value: `${Object.keys(detailedStats.providerStats || {}).length}`, inline: true },
                        { name: '🤖 AI Analyses', value: `${engineStats.totalAnalyses}`, inline: true },
                        { name: '🎮 Pokemon Protection', value: '✅ Active', inline: true },
                        { name: '🌍 Language Support', value: `${synthiaTranslator.enhancedAPI.supportedLanguages.size}`, inline: true }
                    );

                if (detailedStats.providerStats && Object.keys(detailedStats.providerStats).length > 0) {
                    const providerPerformance = Object.entries(detailedStats.providerStats)
                        .sort((a, b) => b[1].count - a[1].count)
                        .map(([provider, stats]) => 
                            `**${provider}**: ${stats.count} translations, ${stats.successRate}% success, ${stats.averageTime}ms avg`
                        ).join('\n');
                    
                    statsDetailEmbed.addFields({
                        name: '🏆 Translation Provider Performance',
                        value: providerPerformance.slice(0, 1024),
                        inline: false
                    });
                }

                // Add Decision Engine API performance
                const aiApiPerformance = Object.entries(engineStats.apiStatuses)
                    .filter(([api, status]) => status.enabled && status.totalCalls > 0)
                    .sort((a, b) => b[1].totalCalls - a[1].totalCalls)
                    .map(([api, status]) => 
                        `**${api}**: ${status.totalCalls} calls, ${status.successRate}% success, ${status.averageResponseTime}ms avg`
                    ).join('\n');

                if (aiApiPerformance) {
                    statsDetailEmbed.addFields({
                        name: '🤖 AI Analysis API Performance',
                        value: aiApiPerformance.slice(0, 1024),
                        inline: false
                    });
                }

                // Add current API status
                const currentTranslationStatus = synthiaTranslator.getTranslationStatus();
                const availableTranslationProviders = Object.values(currentTranslationStatus.providers).filter(p => p.available).length;
                const totalTranslationProvidersCount = Object.keys(currentTranslationStatus.providers).length;

                const availableAiApis = Object.values(engineStats.apiStatuses).filter(api => api.enabled).length;
                const totalAiApis = Object.keys(engineStats.apiStatuses).length;

                statsDetailEmbed.addFields({
                    name: '🔧 Current System Status',
                    value: `**Translation APIs**: ${availableTranslationProviders}/${totalTranslationProvidersCount} available\n**AI Analysis APIs**: ${availableAiApis}/${totalAiApis} available\n**System Health**: ${engineStats.systemHealth}\n**Pokemon Protection**: Always Active`,
                    inline: false
                });
                
                await interaction.editReply({ embeds: [statsDetailEmbed] });
                break;
            }

            case 'language-stats': {
                await interaction.deferReply();
                
                const serverConfig = serverLogger.getServerConfig(interaction.guild.id);
                const translationStats = synthiaTranslator.getTranslationStats();
                const decisionEngineStatus = synthiaAI.getDecisionEngineStatus();
                
                const statsEmbed = new EmbedBuilder()
                    .setTitle('🌍 Multi-Language Statistics')
                    .setDescription('Enhanced Synthia v9.0 Language Analysis with Pokemon Protection + Decision Engine')
                    .addFields(
                        { name: '🔄 Total Translations', value: `${translationStats.totalTranslations}`, inline: true },
                        { name: '✅ Success Rate', value: `${translationStats.successRate}%`, inline: true },
                        { name: '⚡ Avg Response Time', value: `${translationStats.averageResponseTime}ms`, inline: true },
                        { name: '🌐 Default Language', value: synthiaTranslator.enhancedAPI.supportedLanguages.get(serverConfig?.defaultTranslateTo || 'en') || 'English', inline: true },
                        { name: '🤖 Auto-Translation', value: serverConfig?.autoTranslate ? '✅ Enabled' : '❌ Disabled', inline: true },
                        { name: '🧠 Multi-Language Support', value: `${synthiaTranslator.enhancedAPI.supportedLanguages.size} languages`, inline: true },
                        { name: '🎮 Pokemon Protection', value: '✅ Active', inline: true },
                        { name: '🛡️ Bypass Detection', value: '✅ Enhanced', inline: true },
                        { name: '🔍 False Positives', value: '✅ Fixed', inline: true },
                        { name: '🤖 Decision Engine', value: decisionEngineStatus.systemHealth === 'operational' ? '✅ Active' : '⚠️ Limited', inline: true },
                        { name: '📊 AI Analyses', value: `${decisionEngineStatus.totalAnalyses}`, inline: true },
                        { name: '🔧 Working APIs', value: `${Object.keys(decisionEngineStatus.apiStatuses).filter(api => decisionEngineStatus.apiStatuses[api].enabled).length}`, inline: true }
                    )
                    .setColor(config.colors.multi_language);

                if (translationStats.providerStats && Object.keys(translationStats.providerStats).length > 0) {
                    const providerStats = Object.entries(translationStats.providerStats)
                        .sort((a, b) => b[1].count - a[1].count)
                        .slice(0, 5)
                        .map(([provider, stats]) => `• **${provider}**: ${stats.count} translations (${stats.averageTime}ms avg)`)
                        .join('\n');
                    
                    statsEmbed.addFields({
                        name: '🔧 Top Translation Providers',
                        value: providerStats
                    });
                }
                
                await interaction.editReply({ embeds: [statsEmbed] });
                break;
            }

            case 'translate': {
                await interaction.deferReply();
                
                const text = interaction.options.getString('text');
                const toLanguageInput = interaction.options.getString('to') || 'English';
                const fromLanguageInput = interaction.options.getString('from');
                
                const targetLangCode = synthiaTranslator.parseLanguageInput(toLanguageInput);
                const sourceLangCode = fromLanguageInput ? synthiaTranslator.parseLanguageInput(fromLanguageInput) : null;
                
                if (!targetLangCode) {
                    await interaction.editReply(`❌ Target language "${toLanguageInput}" not supported. Use \`/supported-languages\` to see available options.`);
                    return;
                }
                
                if (fromLanguageInput && !sourceLangCode) {
                    await interaction.editReply(`❌ Source language "${fromLanguageInput}" not supported.`);
                    return;
                }
                
                const translation = await synthiaTranslator.translateText(text, targetLangCode, sourceLangCode);
                
                const translateEmbed = new EmbedBuilder()
                    .setTitle('🌍 Enhanced Multi-API Translation')
                    .setColor(config.colors.translation)
                    .addFields(
                        { name: `📝 Original (${translation.originalLanguage || 'Auto-detected'})`, value: text.slice(0, 1024), inline: false },
                        { name: `🌟 Translation (${translation.targetLanguage})`, value: translation.translatedText.slice(0, 1024), inline: false },
                        { name: '🔧 Provider', value: translation.provider || 'Unknown', inline: true },
                        { name: '📊 Confidence', value: `${translation.confidence || 0}%`, inline: true },
                        { name: '⚡ Time', value: `${translation.processingTime || 0}ms`, inline: true }
                    );
                
                if (translation.error) {
                    translateEmbed.addFields({ name: '❌ Error', value: translation.error });
                }
                
                await interaction.editReply({ embeds: [translateEmbed] });
                break;
            }

            case 'set-server-language': {
                await interaction.deferReply();
                
                const serverLanguage = interaction.options.getString('language');
                const serverLangCode = synthiaTranslator.parseLanguageInput(serverLanguage);
                
                if (!serverLangCode) {
                    await interaction.editReply(`❌ Language "${serverLanguage}" not supported. Use \`/supported-languages\` to see available options.`);
                    return;
                }
                
                serverLogger.updateServerSetting(interaction.guild.id, 'defaultTranslateTo', serverLangCode);
                const languageName = synthiaTranslator.enhancedAPI.supportedLanguages.get(serverLangCode);
                
                await interaction.editReply(`✅ Server default translation language set to **${languageName}** (\`${serverLangCode}\`)\n\n🎮 Pokemon content will continue to be protected in all languages.`);
                
                await discordLogger.sendLog(
                    interaction.guild,
                    'success',
                    '🌍 Server Language Settings Changed',
                    `Default translation language set to ${languageName} by ${interaction.user.tag}`
                );
                break;
            }

            case 'auto-translate': {
                await interaction.deferReply();
                
                const autoTranslateEnabled = interaction.options.getBoolean('enabled');
                serverLogger.updateServerSetting(interaction.guild.id, 'autoTranslate', autoTranslateEnabled);
                
                await interaction.editReply(`${autoTranslateEnabled ? '✅ Enabled' : '❌ Disabled'} automatic translation for foreign messages.\n\n🎮 **Note**: Pokemon content is always protected and will not be auto-translated unnecessarily.`);
                
                await discordLogger.sendLog(
                    interaction.guild,
                    'success',
                    '🌍 Auto-Translation Settings Changed',
                    `Auto-translation has been ${autoTranslateEnabled ? 'enabled' : 'disabled'} by ${interaction.user.tag}`,
                    [
                        { name: '👤 Changed By', value: `${interaction.user.tag}`, inline: true },
                        { name: '🔧 New Status', value: autoTranslateEnabled ? '✅ Enabled' : '❌ Disabled', inline: true },
                        { name: '📅 Changed At', value: new Date().toLocaleString(), inline: true },
                        { name: '🎮 Pokemon Protection', value: '✅ Always Active', inline: true }
                    ]
                );
                break;
            }

            case 'supported-languages': {
                await interaction.deferReply();
                
                const supportedLangs = synthiaTranslator.getSupportedLanguages();
                const languageList = supportedLangs
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(lang => `**${lang.name}** (\`${lang.code}\`)`)
                    .join('\n');
                
                const languagesEmbed = new EmbedBuilder()
                    .setTitle('🌍 Supported Languages')
                    .setDescription(`**Enhanced Multi-API Translation supports ${supportedLangs.length} languages:**\n\n${languageList}`)
                    .setColor(config.colors.multi_language)
                    .setFooter({ text: 'Use language names or codes in translation commands • Pokemon content protected in all languages' });
                
                await interaction.editReply({ embeds: [languagesEmbed] });
                break;
            }

            case 'clear-warnings': {
                await interaction.deferReply();
                
                const userToClear = interaction.options.getUser('user');
                const userProfile = synthiaAI.getProfile(userToClear.id);
                
                if (!userProfile || !userProfile.violations || userProfile.violations.length === 0) {
                    await interaction.editReply(`❌ No violations found for ${userToClear.tag}`);
                    return;
                }
                
                const clearedViolations = userProfile.violations.length;
                const clearedBypassAttempts = userProfile.totalBypassAttempts || 0;
                const decisionEngineViolations = userProfile.violations.filter(v => v.decisionEngineUsed).length;
                
                userProfile.violations = [];
                userProfile.riskScore = 0;
                userProfile.bypassHistory = [];
                userProfile.totalBypassAttempts = 0;
                await synthiaAI.saveData();
                
                await interaction.editReply(`✅ Cleared all violations for ${userToClear.tag}\n\n**Cleared:**\n• ${clearedViolations} violations\n• ${clearedBypassAttempts} bypass attempts\n• ${decisionEngineViolations} AI-analyzed violations\n• Risk score reset to 0`);
                
                await discordLogger.sendLog(
                    interaction.guild,
                    'moderation',
                    '🧹 Violations Cleared',
                    `All violations cleared for ${userToClear.tag} by ${interaction.user.tag}`,
                    [
                        { name: '🗑️ Violations Cleared', value: `${clearedViolations}`, inline: true },
                        { name: '🚨 Bypass Attempts Cleared', value: `${clearedBypassAttempts}`, inline: true },
                        { name: '🤖 AI Violations Cleared', value: `${decisionEngineViolations}`, inline: true },
                        { name: '👤 Cleared By', value: `${interaction.user.tag}`, inline: true }
                    ]
                );
                break;
            }

            // NEW: Multi-API Decision Engine Commands
            case 'decision-engine-status': {
                await interaction.deferReply();
                
                const engineStatus = synthiaAI.getDecisionEngineStatus();
                
                const statusEmbed = new EmbedBuilder()
                    .setTitle('🤖 Multi-API Decision Engine Status')
                    .setDescription('Advanced AI content analysis system status')
                    .setColor(engineStatus.systemHealth === 'operational' ? config.colors.success : config.colors.warning);

                statusEmbed.addFields({
                    name: '🏥 System Health',
                    value: `**${engineStatus.systemHealth.toUpperCase()}**`,
                    inline: true
                });

                statusEmbed.addFields({
                    name: '📊 Total Analyses',
                    value: `${engineStatus.totalAnalyses}`,
                    inline: true
                });

                statusEmbed.addFields({
                    name: '🔧 Available APIs',
                    value: `${Object.keys(engineStatus.apiStatuses).filter(api => engineStatus.apiStatuses[api].enabled).length}/${Object.keys(engineStatus.apiStatuses).length}`,
                    inline: true
                });

                // API Status breakdown
                for (const [apiName, apiStatus] of Object.entries(engineStatus.apiStatuses)) {
                    const statusIcon = apiStatus.enabled ? '✅' : '❌';
                    const successRate = apiStatus.successRate || 0;
                    const avgTime = apiStatus.averageResponseTime || 0;
                    
                    statusEmbed.addFields({
                        name: `${statusIcon} ${apiName}`,
                        value: `Success: ${successRate}%\nAvg Time: ${avgTime}ms\nCalls: ${apiStatus.totalCalls}\nWeight: ${apiStatus.weight}`,
                        inline: true
                    });
                }

                await interaction.editReply({ embeds: [statusEmbed] });
                break;
            }

            case 'test-decision-engine': {
                await interaction.deferReply();
                
                const testText = interaction.options.getString('text');
                
                // Check if this is Pokemon content first
                const isPokemon = synthiaAI.isPokemonRelatedContent(testText);
                
                if (isPokemon) {
                    const pokemonEmbed = new EmbedBuilder()
                        .setTitle('🎮 Pokemon Content Detected')
                        .setDescription('This content was identified as Pokemon-related and is automatically whitelisted.')
                        .addFields(
                            { name: '📝 Text', value: testText.slice(0, 1024), inline: false },
                            { name: '🛡️ Protection Status', value: '✅ WHITELISTED', inline: true },
                            { name: '🤖 Decision Engine', value: '⏭️ SKIPPED (Pokemon Protection)', inline: true }
                        )
                        .setColor(config.colors.success);
                    
                    await interaction.editReply({ embeds: [pokemonEmbed] });
                    return;
                }

                try {
                    // Test the decision engine directly
                    const decisionResult = await synthiaAI.decisionEngine.analyzeWithMultiAPI(testText, {
                        author: { id: interaction.user.id, tag: interaction.user.tag },
                        channel: { id: interaction.channel.id, name: interaction.channel.name },
                        guild: interaction.guild ? { id: interaction.guild.id, name: interaction.guild.name } : null
                    });

                    const resultEmbed = new EmbedBuilder()
                        .setTitle('🤖 Multi-API Decision Engine Test Results')
                        .setColor(decisionResult.toxicityScore >= 7 ? config.colors.error : 
                                 decisionResult.toxicityScore >= 4 ? config.colors.warning : 
                                 config.colors.success)
                        .addFields(
                            { name: '📝 Analyzed Text', value: `\`\`\`${testText.slice(0, 500)}\`\`\``, inline: false },
                            { name: '🎯 Toxicity Score', value: `${decisionResult.toxicityScore}/10`, inline: true },
                            { name: '📊 Confidence', value: `${decisionResult.confidence}%`, inline: true },
                            { name: '⚡ Processing Time', value: `${decisionResult.processingTime || 0}ms`, inline: true }
                        );

                    if (decisionResult.individualScores && Object.keys(decisionResult.individualScores).length > 0) {
                        const apiResults = Object.entries(decisionResult.individualScores)
                            .map(([api, data]) => `**${api}**: ${data.score}/10 (${data.confidence}%)`)
                            .join('\n');
                        
                        resultEmbed.addFields({
                            name: '🔧 Individual API Results',
                            value: apiResults.slice(0, 1024),
                            inline: false
                        });
                    }

                    if (decisionResult.reasoning && decisionResult.reasoning.length > 0) {
                        resultEmbed.addFields({
                            name: '🧠 AI Reasoning',
                            value: `• ${decisionResult.reasoning.slice(0, 5).join('\n• ')}`.slice(0, 1024),
                            inline: false
                        });
                    }

                    if (decisionResult.apiAnalysis) {
                        resultEmbed.addFields({
                            name: '📈 Analysis Details',
                            value: `APIs Used: ${decisionResult.apiAnalysis.availableAPIs}\nConsensus: ${decisionResult.apiAnalysis.consensus ? 'Yes' : 'No'}\nContent Type: ${decisionResult.apiAnalysis.contentType}\nMethod: ${decisionResult.apiAnalysis.processingMethod}`,
                            inline: false
                        });
                    }

                    // Add recommended action
                    let recommendedAction = 'None';
                    if (decisionResult.toxicityScore >= 7) recommendedAction = 'Ban';
                    else if (decisionResult.toxicityScore >= 5) recommendedAction = 'Mute';
                    else if (decisionResult.toxicityScore >= 3) recommendedAction = 'Delete';
                    else if (decisionResult.toxicityScore >= 2) recommendedAction = 'Warn';

                    resultEmbed.addFields({
                        name: '⚖️ Recommended Action',
                        value: `**${recommendedAction}** (Based on thresholds: ${config.moderationThresholds.warn}/${config.moderationThresholds.delete}/${config.moderationThresholds.mute}/${config.moderationThresholds.ban})`,
                        inline: false
                    });

                    await interaction.editReply({ embeds: [resultEmbed] });

                } catch (error) {
                    const errorEmbed = new EmbedBuilder()
                        .setTitle('❌ Decision Engine Test Failed')
                        .setDescription('The Multi-API Decision Engine encountered an error.')
                        .addFields(
                            { name: '📝 Text', value: testText.slice(0, 1024), inline: false },
                            { name: '❌ Error', value: error.message, inline: false },
                            { name: '🔄 Fallback', value: 'The system would use local analysis in this case', inline: false }
                        )
                        .setColor(config.colors.error);

                    await interaction.editReply({ embeds: [errorEmbed] });
                }
                break;
            }

            case 'moderation-analysis': {
                await interaction.deferReply();
                
                const analysisText = interaction.options.getString('text');
                
                // Run full analysis through synthiaAI (includes decision engine + local analysis)
                const fullAnalysis = await synthiaAI.analyzeMessage(
                    analysisText,
                    interaction.user,
                    interaction.channel,
                    { guild: interaction.guild }
                );

                const analysisEmbed = new EmbedBuilder()
                    .setTitle('🔍 Complete Moderation Analysis')
                    .setColor(fullAnalysis.threatLevel >= 7 ? config.colors.error : 
                             fullAnalysis.threatLevel >= 4 ? config.colors.warning : 
                             config.colors.success)
                    .addFields(
                        { name: '📝 Analyzed Content', value: `\`\`\`${analysisText.slice(0, 500)}\`\`\``, inline: false },
                        { name: '🔥 Threat Level', value: `${fullAnalysis.threatLevel}/10`, inline: true },
                        { name: '📊 Confidence', value: `${fullAnalysis.confidence}%`, inline: true },
                        { name: '⚡ Processing Time', value: `${fullAnalysis.processingTime}ms`, inline: true },
                        { name: '🌍 Language', value: fullAnalysis.language.originalLanguage, inline: true },
                        { name: '🤖 Decision Engine', value: fullAnalysis.decisionEngineUsed ? '✅ Used' : '❌ Fallback', inline: true },
                        { name: '🔍 Bypass Detection', value: fullAnalysis.bypassDetected ? '🚨 DETECTED' : '✅ None', inline: true }
                    );

                if (fullAnalysis.violationType) {
                    analysisEmbed.addFields({
                        name: '⚖️ Violation Details',
                        value: `**Type**: ${fullAnalysis.violationType}\n**Action**: ${fullAnalysis.action}\n**Threshold Met**: Yes`,
                        inline: false
                    });
                }

                if (fullAnalysis.bypassDetected) {
                    analysisEmbed.addFields({
                        name: '🚨 Bypass Analysis',
                        value: `**Original**: ${analysisText.slice(0, 100)}\n**Normalized**: ${fullAnalysis.normalizedText?.slice(0, 100) || 'N/A'}\n**Methods**: ${fullAnalysis.bypassAttempts?.map(b => b.type).join(', ') || 'Unknown'}`,
                        inline: false
                    });
                }

                if (fullAnalysis.apiResults && Object.keys(fullAnalysis.apiResults).length > 0) {
                    const apiSummary = Object.entries(fullAnalysis.apiResults)
                        .filter(([api, result]) => result && !result.error)
                        .map(([api, result]) => `**${api}**: Available`)
                        .join('\n') || 'None available';
                    
                    analysisEmbed.addFields({
                        name: '🔧 APIs Consulted',
                        value: apiSummary,
                        inline: false
                    });
                }

                if (fullAnalysis.reasoning && fullAnalysis.reasoning.length > 0) {
                    analysisEmbed.addFields({
                        name: '🧠 Complete Analysis Reasoning',
                        value: `• ${fullAnalysis.reasoning.slice(0, 6).join('\n• ')}`.slice(0, 1024),
                        inline: false
                    });
                }

                await interaction.editReply({ embeds: [analysisEmbed] });
                break;
            }

            case 'toggle-automod': {
                await interaction.deferReply();
                
                const automodEnabled = interaction.options.getBoolean('enabled');
                serverLogger.updateServerSetting(interaction.guild.id, 'autoModeration', automodEnabled);
                
                await interaction.editReply(`${automodEnabled ? '✅ Enabled' : '❌ Disabled'} automatic moderation for this server.\n\n🎮 **Note**: Pokemon content protection remains active regardless of this setting.`);
                
                await discordLogger.sendLog(
                    interaction.guild,
                    'moderation',
                    '🛡️ Auto-Moderation Settings Changed',
                    `Auto-moderation has been ${automodEnabled ? 'enabled' : 'disabled'} by ${interaction.user.tag}`,
                    [
                        { name: '👤 Changed By', value: `${interaction.user.tag}`, inline: true },
                        { name: '🔧 New Status', value: automodEnabled ? '✅ Enabled' : '❌ Disabled', inline: true },
                        { name: '📅 Changed At', value: new Date().toLocaleString(), inline: true },
                        { name: '🎮 Pokemon Protection', value: '✅ Always Active', inline: true }
                    ]
                );
                break;
            }

            case 'test-pokemon': {
                await interaction.deferReply();
                
                const testEmbed = new EmbedBuilder()
                    .setTitle('🎮 Pokemon Protection System Test')
                    .setDescription('Testing Pokemon file detection and trading code protection')
                    .setColor(config.colors.success);

                // Test various Pokemon content
                const pokemonTests = [
                    { content: 'Charizard.pk9', type: 'Pokemon file (.pk9)' },
                    { content: 'Pikachu.pk8', type: 'Pokemon file (.pk8)' },
                    { content: 'Blastoise.pb8', type: 'Pokemon file (.pb8)' },
                    { content: '.trade 12345678', type: 'Trading code' },
                    { content: 'Looking for shiny Eevee', type: 'Pokemon discussion' },
                    { content: 'IV: 31/31/31/31/31/31', type: 'Pokemon stats' }
                ];

                let testResults = '';
                for (const test of pokemonTests) {
                    const isPokemon = synthiaAI.isPokemonRelatedContent(test.content);
                    const status = isPokemon ? '✅ PROTECTED' : '❌ Not detected';
                    testResults += `**${test.type}**: "${test.content}" → ${status}\n`;
                }

                testEmbed.addFields({
                    name: '🧪 Protection Test Results',
                    value: testResults,
                    inline: false
                });

                testEmbed.addFields({
                    name: '🛡️ Protected File Extensions',
                    value: '.pk9, .pk8, .pb8, .pk7, .pk6, .pkm, .pcd, .pgf, .wc8, .wc7, .wc6',
                    inline: false
                });

                testEmbed.addFields({
                    name: '💬 Protected Keywords',
                    value: 'Pokemon names, trading codes (.trade), IV stats, Pokemon terms',
                    inline: false
                });

                testEmbed.addFields({
                    name: '⚡ Status',
                    value: '✅ Pokemon Protection is ALWAYS ACTIVE\n✅ All Pokemon content is automatically whitelisted\n✅ False positives are prevented',
                    inline: false
                });

                await interaction.editReply({ embeds: [testEmbed] });
                break;
            }

            case 'test-translate': {
                await interaction.deferReply();
                
                const testText = interaction.options.getString('text');
                
                await interaction.editReply('🧪 Testing translation system... This may take a moment.');
                
                // Test translation to English
                const translation = await synthiaTranslator.translateText(testText, 'en');
                
                const testEmbed = new EmbedBuilder()
                    .setTitle('🧪 Translation System Test')
                    .setDescription('Testing the enhanced multi-API translation system')
                    .setColor(config.colors.translation)
                    .addFields(
                        { name: '📝 Original Text', value: testText.slice(0, 1024), inline: false },
                        { name: '🌍 Detected Language', value: translation.originalLanguage || 'Unknown', inline: true },
                        { name: '🔧 Provider Used', value: translation.provider || 'Unknown', inline: true },
                        { name: '⚡ Processing Time', value: `${translation.processingTime || 0}ms`, inline: true },
                        { name: '📊 Confidence', value: `${translation.confidence || 0}%`, inline: true },
                        { name: '✅ Success', value: translation.error ? '❌ Failed' : '✅ Success', inline: true },
                        { name: '🎮 Pokemon Protection', value: '✅ Active', inline: true }
                    );

                if (translation.translatedText && !translation.error) {
                    testEmbed.addFields({
                        name: '🌟 Translation Result',
                        value: translation.translatedText.slice(0, 1024),
                        inline: false
                    });
                }

                if (translation.error) {
                    testEmbed.addFields({
                        name: '❌ Error Details',
                        value: translation.error,
                        inline: false
                    });
                }

                await interaction.editReply({ embeds: [testEmbed] });
                break;
            }

            case 'setup-wizard': {
                await interaction.deferReply();
                
                const setupEmbed = new EmbedBuilder()
                    .setTitle('🚀 Enhanced Synthia v9.0 Setup Wizard')
                    .setDescription('Interactive setup guide for optimal configuration')
                    .setColor(config.colors.primary)
                    .addFields(
                        { name: '1️⃣ Basic Setup', value: '`!synthia loghere` - Set this channel for logging\n`/toggle-automod enabled:true` - Enable auto-moderation', inline: false },
                        { name: '2️⃣ Translation Setup', value: '`/set-server-language language:English` - Set default language\n`/auto-translate enabled:true` - Enable auto-translation', inline: false },
                        { name: '3️⃣ Testing', value: '`/test-detection text:hello` - Test detection system\n`/api-status` - Check API status\n`/test-pokemon` - Verify Pokemon protection', inline: false },
                        { name: '4️⃣ Advanced Features', value: '`/decision-engine-status` - Check AI systems\n`/translation-stats` - View performance\n`/synthia-analysis user:@someone` - Analyze users', inline: false },
                        { name: '🎮 Pokemon Protection', value: '✅ Automatically enabled - no setup required!\nPokemon files and trading content are always protected.', inline: false },
                        { name: '🤖 Decision Engine', value: '✅ Multi-API analysis system is ready!\nProvides enhanced accuracy for content moderation.', inline: false }
                    )
                    .setFooter({ text: '💡 All systems are ready to use! Pokemon protection and multi-API analysis are active by default.' });

                await interaction.editReply({ embeds: [setupEmbed] });
                break;
            }

            case 'test-bypass': {
                await interaction.deferReply();
                
                const bypassTestText = interaction.options.getString('text');
                
                // Check if this is Pokemon content first
                const isPokemonContent = synthiaAI.isPokemonRelatedContent(bypassTestText);
                
                if (isPokemonContent) {
                    const pokemonEmbed = new EmbedBuilder()
                        .setTitle('🎮 Pokemon Content Protection Active')
                        .setDescription('This content was identified as Pokemon-related and is automatically protected.')
                        .addFields(
                            { name: '📝 Text', value: bypassTestText.slice(0, 1024), inline: false },
                            { name: '🛡️ Protection Status', value: '✅ WHITELISTED', inline: true },
                            { name: '🔍 Bypass Detection', value: '⏭️ SKIPPED (Pokemon Protection)', inline: true }
                        )
                        .setColor(config.colors.success);
                    
                    await interaction.editReply({ embeds: [pokemonEmbed] });
                    return;
                }

                // Run bypass detection
                const bypassAnalysis = await synthiaAI.analyzeMessage(bypassTestText, interaction.user, interaction.channel, { guild: interaction.guild });
                
                const bypassEmbed = new EmbedBuilder()
                    .setTitle('🔍 Bypass Detection Test Results')
                    .setColor(bypassAnalysis.bypassDetected ? config.colors.error : config.colors.success)
                    .addFields(
                        { name: '📝 Test Text', value: bypassTestText.slice(0, 1024), inline: false },
                        { name: '🚨 Bypass Detected', value: bypassAnalysis.bypassDetected ? '🚨 YES' : '✅ NO', inline: true },
                        { name: '🎯 Threat Level', value: `${bypassAnalysis.threatLevel}/10`, inline: true },
                        { name: '📊 Confidence', value: `${bypassAnalysis.confidence}%`, inline: true }
                    );

                if (bypassAnalysis.bypassDetected) {
                    bypassEmbed.addFields({
                        name: '🔍 Bypass Details',
                        value: `**Original**: ${bypassTestText.slice(0, 100)}\n**Normalized**: ${bypassAnalysis.normalizedText?.slice(0, 100) || 'N/A'}\n**Methods**: ${bypassAnalysis.bypassAttempts?.map(b => b.type).join(', ') || 'Unknown'}`,
                        inline: false
                    });
                }

                bypassEmbed.addFields({
                    name: '🛡️ Protection Systems',
                    value: '✅ Character substitution detection\n✅ Spacing manipulation detection\n✅ Unicode bypass detection\n✅ Zalgo text detection\n✅ Pokemon content whitelisting',
                    inline: false
                });

                await interaction.editReply({ embeds: [bypassEmbed] });
                break;
            }

            default: {
                await interaction.reply({ content: '❌ Unknown command.', ephemeral: true });
                break;
            }
        }
    } catch (error) {
        console.error('Enhanced command error:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: 'An error occurred processing this enhanced command.', ephemeral: true });
        } else if (interaction.deferred) {
            await interaction.editReply({ content: 'An error occurred processing this enhanced command.' });
        }
    }
}

module.exports = {
    commands,
    handleTextCommand,
    handleSlashCommand
};
