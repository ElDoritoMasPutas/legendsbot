// Enhanced Command Handler v9.0 - FIXED WORKING COMMANDS
const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config/config.js');

// Slash Commands Definition
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
        .setDescription('Test Pokemon file detection system')
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
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
];

// Text Command Handler (keeping existing implementation)
async function handleTextCommand(message, synthiaTranslator, synthiaAI, serverLogger, discordLogger, userViolations) {
    if (!message.content.startsWith('!synthia') || !message.member?.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;

    const args = message.content.split(' ');
    const command = args[1];

    switch (command) {
        case 'loghere':
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

        case 'status':
            const stats = synthiaTranslator.getTranslationStats();
            const autoModStatus = serverLogger.isAutoModerationEnabled(message.guild.id);
            const embed = new EmbedBuilder()
                .setTitle(`🚀 Enhanced Synthia v${config.aiVersion} Status`)
                .setDescription('**Multi-API Intelligence System**')
                .addFields(
                    { name: '🧠 Intelligence Level', value: 'IQ 300+ Enhanced', inline: true },
                    { name: '🔄 Multi-API Providers', value: `${Object.keys(synthiaTranslator.enhancedAPI.apis).length}`, inline: true },
                    { name: '🌍 Languages', value: `${synthiaTranslator.enhancedAPI.supportedLanguages.size}`, inline: true },
                    { name: '📊 Total Translations', value: `${stats.totalTranslations}`, inline: true },
                    { name: '✅ Success Rate', value: `${stats.successRate}%`, inline: true },
                    { name: '⚡ Avg Response Time', value: `${stats.averageResponseTime}ms`, inline: true },
                    { name: '👥 AI Profiles', value: `${synthiaAI.profiles.size}`, inline: true },
                    { name: '🌐 Servers', value: `${message.client.guilds.cache.size}`, inline: true },
                    { name: '🚨 Auto-Moderation', value: autoModStatus ? '✅ Enabled' : '❌ Disabled', inline: true }
                )
                .setColor(config.colors.primary)
                .setTimestamp();
            
            await message.reply({ embeds: [embed] });
            break;

        case 'help':
            const helpEmbed = new EmbedBuilder()
                .setTitle('🧠 Enhanced Synthia v9.0 Help')
                .setDescription('Multi-API Intelligence Moderation & Translation System')
                .addFields(
                    { name: '🚀 Quick Setup', value: '`/setup-wizard` - **Interactive setup guide**\n`!synthia loghere` - Set log channel\n`!synthia status` - System status' },
                    { name: '🛡️ Moderation', value: '`/toggle-automod` - Toggle auto-moderation\n`/test-detection` - Test detection system' },
                    { name: '🌍 Translation', value: '`/translate` - **Main translation command**\n`/auto-translate` - Toggle auto-translation\n`/supported-languages` - List all languages' },
                    { name: '📊 Analysis', value: '`/synthia-analysis` - Analyze user\n`/api-status` - API status\n`/translation-stats` - Performance stats' },
                    { name: '🎮 Pokemon Support', value: '`/test-pokemon` - Test Pokemon file detection\n**✅ Pokemon files (.pk9, .pk8, .pb8, etc.) are WHITELISTED!**' }
                )
                .setColor(config.colors.info)
                .setFooter({ text: '💡 Enhanced with Pokemon file support & reduced false positives!' });
            
            await message.reply({ embeds: [helpEmbed] });
            break;

        default:
            await message.reply('❓ Unknown command. Use `!synthia help` for available commands.');
            break;
    }
}

// FIXED: Complete Slash Command Handler Implementation
async function handleSlashCommand(interaction, synthiaTranslator, synthiaAI, serverLogger, discordLogger, userViolations) {
    console.log(`🎯 Enhanced Slash Command: ${interaction.commandName} by ${interaction.user.tag}`);

    try {
        switch (interaction.commandName) {
            case 'synthia-analysis':
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
                        { name: '📅 First Seen', value: new Date(profile.createdAt).toLocaleDateString(), inline: true }
                    )
                    .setColor((profile.riskScore || 0) >= 7 ? config.colors.error : 
                              (profile.riskScore || 0) >= 4 ? config.colors.warning : 
                              config.colors.success)
                    .setThumbnail(targetUser.displayAvatarURL());
                
                if (profile.violations && profile.violations.length > 0) {
                    const recentViolations = profile.violations.slice(-3).map(v => {
                        const lang = synthiaTranslator.enhancedAPI.supportedLanguages.get(v.language) || v.language;
                        return `• **${v.violationType}** - Level ${v.threatLevel}/10 (${lang})`;
                    }).join('\n');
                    
                    analysisEmbed.addFields({
                        name: '🚨 Recent Violations',
                        value: recentViolations
                    });
                }
                
                await interaction.editReply({ embeds: [analysisEmbed] });
                break;

            case 'language-stats':
                await interaction.deferReply();
                
                const serverConfig = serverLogger.getServerConfig(interaction.guild.id);
                const translationStats = synthiaTranslator.getTranslationStats();
                
                const statsEmbed = new EmbedBuilder()
                    .setTitle('🌍 Multi-Language Statistics')
                    .setDescription('Enhanced Synthia v9.0 Language Analysis')
                    .addFields(
                        { name: '🔄 Total Translations', value: `${translationStats.totalTranslations}`, inline: true },
                        { name: '✅ Success Rate', value: `${translationStats.successRate}%`, inline: true },
                        { name: '⚡ Avg Response Time', value: `${translationStats.averageResponseTime}ms`, inline: true },
                        { name: '🌐 Default Language', value: synthiaTranslator.enhancedAPI.supportedLanguages.get(serverConfig?.defaultTranslateTo || 'en') || 'English', inline: true },
                        { name: '🤖 Auto-Translation', value: serverConfig?.autoTranslate ? '✅ Enabled' : '❌ Disabled', inline: true },
                        { name: '🧠 Multi-Language Support', value: `${synthiaTranslator.enhancedAPI.supportedLanguages.size} languages`, inline: true }
                    )
                    .setColor(config.colors.multi_language);

                if (translationStats.providerStats && Object.keys(translationStats.providerStats).length > 0) {
                    const providerStats = Object.entries(translationStats.providerStats)
                        .sort((a, b) => b[1].count - a[1].count)
                        .slice(0, 5)
                        .map(([provider, stats]) => `• **${provider}**: ${stats.count} translations (${stats.averageTime}ms avg)`)
                        .join('\n');
                    
                    statsEmbed.addFields({
                        name: '🔧 Top API Providers',
                        value: providerStats
                    });
                }
                
                await interaction.editReply({ embeds: [statsEmbed] });
                break;
                
            case 'translate':
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

            case 'auto-translate':
                await interaction.deferReply();
                
                const autoTranslateEnabled = interaction.options.getBoolean('enabled');
                serverLogger.updateServerSetting(interaction.guild.id, 'autoTranslate', autoTranslateEnabled);
                
                await interaction.editReply(`${autoTranslateEnabled ? '✅ Enabled' : '❌ Disabled'} automatic translation for foreign messages.`);
                
                await discordLogger.sendLog(
                    interaction.guild,
                    'success',
                    '🌍 Auto-Translation Settings Changed',
                    `Auto-translation has been ${autoTranslateEnabled ? 'enabled' : 'disabled'} by ${interaction.user.tag}`,
                    [
                        { name: '👤 Changed By', value: `${interaction.user.tag}`, inline: true },
                        { name: '🔧 New Status', value: autoTranslateEnabled ? '✅ Enabled' : '❌ Disabled', inline: true },
                        { name: '📅 Changed At', value: new Date().toLocaleString(), inline: true }
                    ]
                );
                break;

            case 'set-server-language':
                await interaction.deferReply();
                
                const serverLanguage = interaction.options.getString('language');
                const serverLangCode = synthiaTranslator.parseLanguageInput(serverLanguage);
                
                if (!serverLangCode) {
                    await interaction.editReply(`❌ Language "${serverLanguage}" not supported. Use \`/supported-languages\` to see available options.`);
                    return;
                }
                
                serverLogger.updateServerSetting(interaction.guild.id, 'defaultTranslateTo', serverLangCode);
                const languageName = synthiaTranslator.enhancedAPI.supportedLanguages.get(serverLangCode);
                
                await interaction.editReply(`✅ Server default translation language set to **${languageName}** (\`${serverLangCode}\`)`);
                break;

            case 'toggle-automod':
                await interaction.deferReply();
                
                const autoModEnabled = interaction.options.getBoolean('enabled');
                serverLogger.updateServerSetting(interaction.guild.id, 'autoModeration', autoModEnabled);
                
                await interaction.editReply(`${autoModEnabled ? '✅ Enabled' : '❌ Disabled'} automatic moderation for this server.`);
                
                await discordLogger.sendLog(
                    interaction.guild,
                    'success',
                    '🛡️ Auto-Moderation Settings Changed',
                    `Auto-moderation has been ${autoModEnabled ? 'enabled' : 'disabled'} by ${interaction.user.tag}`
                );
                break;

            case 'supported-languages':
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
                    .setFooter({ text: 'Use language names or codes in translation commands' });
                
                await interaction.editReply({ embeds: [languagesEmbed] });
                break;

            case 'clear-warnings':
                await interaction.deferReply();
                
                const userToClear = interaction.options.getUser('user');
                const userProfile = synthiaAI.getProfile(userToClear.id);
                
                if (!userProfile || !userProfile.violations || userProfile.violations.length === 0) {
                    await interaction.editReply(`❌ No violations found for ${userToClear.tag}`);
                    return;
                }
                
                userProfile.violations = [];
                userProfile.riskScore = 0;
                await synthiaAI.saveData();
                
                await interaction.editReply(`✅ Cleared all violations for ${userToClear.tag}`);
                
                await discordLogger.sendLog(
                    interaction.guild,
                    'moderation',
                    '🧹 Violations Cleared',
                    `All violations cleared for ${userToClear.tag} by ${interaction.user.tag}`
                );
                break;

            case 'test-detection':
                await interaction.deferReply();
                
                const detectionTestText = interaction.options.getString('text');
                const testAnalysis = await synthiaAI.analyzeMessage(detectionTestText, interaction.user, interaction.channel, { guild: interaction.guild });
                
                const detectionEmbed = new EmbedBuilder()
                    .setTitle('🔍 Enhanced Detection Test Results')
                    .setColor(config.colors.ai_analysis)
                    .addFields(
                        { name: '📝 Text', value: detectionTestText.slice(0, 1024), inline: false },
                        { name: '🌍 Language', value: testAnalysis.language.originalLanguage, inline: true },
                        { name: '⚖️ Threat Level', value: `${testAnalysis.threatLevel}/10`, inline: true },
                        { name: '🎯 Confidence', value: `${testAnalysis.confidence}%`, inline: true },
                        { name: '🔍 Action Threshold', value: `Warn: ${config.moderationThresholds.warn}+ | Delete: ${config.moderationThresholds.delete}+ | Mute: ${config.moderationThresholds.mute}+ | Ban: ${config.moderationThresholds.ban}+`, inline: false },
                        { name: '⚡ Action', value: testAnalysis.action || 'None', inline: true },
                        { name: '🛡️ Automod Status', value: serverLogger.isAutoModerationEnabled(interaction.guild.id) ? 'Enabled' : 'Disabled', inline: true }
                    );
                
                if (testAnalysis.reasoning.length > 0) {
                    detectionEmbed.addFields({
                        name: '🧠 AI Reasoning',
                        value: testAnalysis.reasoning.join('\n').slice(0, 1024),
                        inline: false
                    });
                }
                
                await interaction.editReply({ embeds: [detectionEmbed] });
                break;

            case 'api-status':
                await interaction.deferReply();
                
                const apiStatus = synthiaTranslator.getTranslationStatus();
                
                const statusEmbed = new EmbedBuilder()
                    .setTitle('🔧 Multi-API Status')
                    .setDescription('Enhanced Translation API Provider Status')
                    .setColor(config.colors.multiapi);

                let workingProviders = 0;
                let totalProviders = 0;

                for (const [provider, status] of Object.entries(apiStatus.providers)) {
                    totalProviders++;
                    if (status.available) workingProviders++;
                    
                    const statusIcon = status.available ? '✅' : '❌';
                    const resetTime = status.resetInMinutes > 0 ? `${status.resetInMinutes}min` : 'Ready';
                    
                    statusEmbed.addFields({
                        name: `${statusIcon} ${provider}`,
                        value: `Requests: ${status.requestsUsed}/${status.rateLimit}\nReset: ${resetTime}\nReliability: ${status.reliability}%`,
                        inline: true
                    });
                }

                statusEmbed.addFields({
                    name: '📊 Overall Status',
                    value: `${workingProviders}/${totalProviders} providers available\nTotal requests: ${apiStatus.totalRequests}\nTotal characters: ${apiStatus.totalCharacters}`,
                    inline: false
                });
                
                await interaction.editReply({ embeds: [statusEmbed] });
                break;

            case 'test-apis':
                await interaction.deferReply();
                
                await interaction.editReply('🧪 Testing all translation APIs... This may take a moment.');
                
                const testResults = await synthiaTranslator.testAllAPIs();
                
                const testEmbed = new EmbedBuilder()
                    .setTitle('🧪 API Test Results')
                    .setDescription('Complete test of all translation providers')
                    .setColor(config.colors.performance)
                    .addFields({
                        name: '📊 Summary',
                        value: `Working: ${testResults.summary.workingProviders}/${testResults.summary.totalProviders}\nAverage Time: ${testResults.summary.averageResponseTime}ms\nReliability: ${testResults.summary.reliability}%`,
                        inline: false
                    });

                for (const [provider, result] of Object.entries(testResults.individual)) {
                    const statusIcon = result.working ? '✅' : '❌';
                    const resultText = result.working 
                        ? `Success Rate: ${result.successRate || 0}%\nAvg Time: ${result.time}ms\nTests: ${result.successfulTests}/${result.bidirectionalTests}`
                        : `Error: ${result.error || 'Unknown error'}`;
                    
                    testEmbed.addFields({
                        name: `${statusIcon} ${provider}`,
                        value: resultText,
                        inline: true
                    });
                }
                
                await interaction.editReply({ embeds: [testEmbed] });
                break;

            case 'translation-stats':
                await interaction.deferReply();
                
                const detailedStats = synthiaTranslator.getTranslationStats();
                
                const statsDetailEmbed = new EmbedBuilder()
                    .setTitle('📊 Translation Performance Statistics')
                    .setColor(config.colors.performance)
                    .addFields(
                        { name: '🔄 Total Translations', value: `${detailedStats.totalTranslations}`, inline: true },
                        { name: '✅ Successful', value: `${detailedStats.successfulTranslations}`, inline: true },
                        { name: '❌ Failed', value: `${detailedStats.failedTranslations}`, inline: true },
                        { name: '📈 Success Rate', value: `${detailedStats.successRate}%`, inline: true },
                        { name: '⚡ Average Time', value: `${detailedStats.averageResponseTime}ms`, inline: true },
                        { name: '🔧 Active Providers', value: `${Object.keys(detailedStats.providerStats || {}).length}`, inline: true }
                    );

                if (detailedStats.providerStats && Object.keys(detailedStats.providerStats).length > 0) {
                    const providerPerformance = Object.entries(detailedStats.providerStats)
                        .sort((a, b) => b[1].count - a[1].count)
                        .map(([provider, stats]) => 
                            `**${provider}**: ${stats.count} translations, ${stats.successRate}% success, ${stats.averageTime}ms avg`
                        ).join('\n');
                    
                    statsDetailEmbed.addFields({
                        name: '🏆 Provider Performance',
                        value: providerPerformance.slice(0, 1024),
                        inline: false
                    });
                }
                
                await interaction.editReply({ embeds: [statsDetailEmbed] });
                break;

            case 'test-pokemon':
                await interaction.deferReply();
                
                const pokemonTestCases = [
                    'Here is my shiny Charizard.pk9',
                    'Trading legendary.pk8 for shiny',
                    'My Pokemon save.pb8 file',
                    'Check out this team.pa8',
                    'Uploading my data.pk7',
                    'Free shiny Pokemon.pk9 download',
                    'scam.pk9 link click here for free nitro'
                ];

                let pokemonTestResults = [];

                for (const testCase of pokemonTestCases) {
                    const testAnalysis = await synthiaAI.analyzeMessage(testCase, interaction.user, interaction.channel, { guild: interaction.guild });
                    
                    pokemonTestResults.push({
                        text: testCase,
                        threatLevel: testAnalysis.threatLevel,
                        action: testAnalysis.action || 'none',
                        reasoning: testAnalysis.reasoning.length > 0 ? testAnalysis.reasoning[0] : 'No issues detected'
                    });
                }

                const pokemonEmbed = new EmbedBuilder()
                    .setTitle('🧪 Pokemon File Detection Test')
                    .setDescription('Testing Pokemon file extension whitelisting and scam detection')
                    .setColor(config.colors.success);

                for (const result of pokemonTestResults) {
                    const status = result.threatLevel === 0 ? '✅' : result.threatLevel < 5 ? '⚠️' : '❌';
                    pokemonEmbed.addFields({
                        name: `${status} "${result.text}"`,
                        value: `Threat: ${result.threatLevel}/10 | Action: ${result.action}\nReason: ${result.reasoning}`,
                        inline: false
                    });
                }

                pokemonEmbed.addFields({
                    name: '📋 Expected Results',
                    value: '✅ Legitimate Pokemon files should show "Threat: 0/10"\n⚠️ Suspicious context should be flagged\n❌ Clear scams should be detected',
                    inline: false
                });

                await interaction.editReply({ embeds: [pokemonEmbed] });
                break;

            case 'test-translate':
                await interaction.deferReply();
                
                const translateTestText = interaction.options.getString('text');
                const currentServerConfig = serverLogger.getServerConfig(interaction.guild.id);
                
                try {
                    const detectedLang = synthiaTranslator.detectLanguage(translateTestText);
                    const detectedLangName = synthiaTranslator.enhancedAPI.supportedLanguages.get(detectedLang) || detectedLang;
                    
                    const translation = await synthiaTranslator.translateText(
                        translateTestText, 
                        currentServerConfig?.defaultTranslateTo || 'en', 
                        detectedLang
                    );
                    
                    const testEmbed = new EmbedBuilder()
                        .setTitle('🧪 Translation System Test')
                        .setColor(config.colors.translation)
                        .addFields(
                            { name: '📝 Input Text', value: translateTestText, inline: false },
                            { name: '🌍 Detected Language', value: `${detectedLangName} (${detectedLang})`, inline: true },
                            { name: '🎯 Target Language', value: `${synthiaTranslator.enhancedAPI.supportedLanguages.get(currentServerConfig?.defaultTranslateTo || 'en')} (${currentServerConfig?.defaultTranslateTo || 'en'})`, inline: true },
                            { name: '🔧 Provider', value: translation.provider || 'Unknown', inline: true },
                            { name: '🌟 Translation Result', value: translation.translatedText || 'No translation', inline: false },
                            { name: '📊 Confidence', value: `${translation.confidence || 0}%`, inline: true },
                            { name: '⚡ Processing Time', value: `${translation.processingTime || 0}ms`, inline: true },
                            { name: '🤖 Auto-Translation Status', value: currentServerConfig?.autoTranslate ? '✅ Enabled' : '❌ Disabled', inline: true }
                        );
                    
                    if (translation.error) {
                        testEmbed.addFields({ name: '❌ Error', value: translation.error, inline: false });
                    }
                    
                    await interaction.editReply({ embeds: [testEmbed] });
                    
                } catch (error) {
                    await interaction.editReply(`❌ Translation test failed: ${error.message}`);
                }
                break;

            case 'setup-wizard':
                await interaction.deferReply();
                
                const wizardEmbed = new EmbedBuilder()
                    .setTitle('🚀 Enhanced Synthia v9.0 Setup Wizard')
                    .setDescription('Interactive setup for optimal performance')
                    .addFields(
                        { name: '📡 Step 1: Log Channel', value: 'Use `!synthia loghere` in your desired log channel', inline: false },
                        { name: '🛡️ Step 2: Auto-Moderation', value: 'Use `/toggle-automod enabled:true` to enable', inline: false },
                        { name: '🌍 Step 3: Translation', value: 'Use `/set-server-language` and `/auto-translate` as needed', inline: false },
                        { name: '🧪 Step 4: Testing', value: 'Use `/test-detection` to verify detection thresholds', inline: false }
                    )
                    .setColor(config.colors.success)
                    .setFooter({ text: 'Enhanced Synthia v9.0 - Complete AI Moderation System' });
                
                await interaction.editReply({ embeds: [wizardEmbed] });
                break;

            default:
                await interaction.reply({ content: '❌ Unknown command.', ephemeral: true });
                break;
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
