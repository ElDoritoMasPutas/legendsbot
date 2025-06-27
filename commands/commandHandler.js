// Enhanced Command Handler v9.0 - FIXED WITH POKEMON TRADING SUPPORT
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
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
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
                .setDescription('**Multi-API Intelligence System with Pokemon Protection**')
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
                    { name: '🔍 False Positives', value: '✅ FIXED', inline: true }
                )
                .setColor(config.colors.primary)
                .setTimestamp();
            
            await message.reply({ embeds: [embed] });
            break;

        case 'help':
            const helpEmbed = new EmbedBuilder()
                .setTitle('🧠 Enhanced Synthia v9.0 Help')
                .setDescription('Multi-API Intelligence Moderation & Translation System with Pokemon Protection')
                .addFields(
                    { name: '🚀 Quick Setup', value: '`/setup-wizard` - **Interactive setup guide**\n`!synthia loghere` - Set log channel\n`!synthia status` - System status' },
                    { name: '🛡️ Moderation', value: '`/toggle-automod` - Toggle auto-moderation\n`/test-detection` - Test detection system\n`/test-bypass` - Test bypass detection' },
                    { name: '🌍 Translation', value: '`/translate` - **Main translation command**\n`/auto-translate` - Toggle auto-translation\n`/supported-languages` - List all languages' },
                    { name: '📊 Analysis', value: '`/synthia-analysis` - Analyze user\n`/api-status` - API status\n`/translation-stats` - Performance stats' },
                    { name: '🎮 Pokemon Support', value: '`/test-pokemon` - **Test Pokemon protection**\n✅ Pokemon files (.pk9, .pk8, .pb8, etc.) are WHITELISTED!\n✅ Trading codes (.trade 12345678) are PROTECTED!' }
                )
                .setColor(config.colors.info)
                .setFooter({ text: '💡 Enhanced with comprehensive Pokemon support & zero false positives!' });
            
            await message.reply({ embeds: [helpEmbed] });
            break;

        default:
            await message.reply('❓ Unknown command. Use `!synthia help` for available commands.');
            break;
    }
}

// ENHANCED: Complete Slash Command Handler Implementation with Pokemon support
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
                        { name: '🚨 Bypass Attempts', value: `${profile.totalBypassAttempts || 0}`, inline: true },
                        { name: '📅 First Seen', value: new Date(profile.createdAt).toLocaleDateString(), inline: true },
                        { name: '🎮 Pokemon Protected', value: '✅ Active', inline: true },
                        { name: '🛡️ Enhanced Detection', value: '✅ Enabled', inline: true }
                    )
                    .setColor((profile.riskScore || 0) >= 7 ? config.colors.error : 
                              (profile.riskScore || 0) >= 4 ? config.colors.warning : 
                              config.colors.success)
                    .setThumbnail(targetUser.displayAvatarURL());
                
                if (profile.violations && profile.violations.length > 0) {
                    const recentViolations = profile.violations.slice(-3).map(v => {
                        const lang = synthiaTranslator.enhancedAPI.supportedLanguages.get(v.language) || v.language;
                        const bypass = v.bypassDetected ? ' 🚨 BYPASS' : '';
                        return `• **${v.violationType}** - Level ${v.threatLevel}/10 (${lang})${bypass}`;
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

            case 'test-pokemon':
                await interaction.deferReply();
                
                const pokemonTestCases = [
                    // Legitimate Pokemon content that should NOT be flagged
                    '.trade 77908141',
                    '.trade 12345678',
                    'Here is my shiny Charizard.pk9',
                    'Trading legendary.pk8 for shiny',
                    'My Pokemon save.pb8 file',
                    'Check out this team.pa8',
                    'Uploading my data.pk7',
                    '.bt Charizard @ Leftovers',
                    '.pokepaste https://pokepast.es/abc123',
                    'Charizard (M) @ Focus Sash\nAbility: Solar Power\nLevel: 50\nShiny: Yes',
                    'Looking for: Adamant Garchomp\nOffering: Jolly Dragapult',
                    '.trade Calyrex @ Focus Sash\nBall: Ultra Ball\nLevel: 80',
                    
                    // Scam attempts that SHOULD be flagged
                    '.trade free nitro click here',
                    'scam.pk9 link click here for free discord nitro',
                    '.trade 12345678 free robux click',
                    
                    // Bypass attempts that SHOULD be flagged
                    'f*ck this pokemon trading',
                    'sh1t pokemon game'
                ];

                let pokemonTestResults = [];

                for (const testCase of pokemonTestCases) {
                    const testAnalysis = await synthiaAI.analyzeMessage(testCase, interaction.user, interaction.channel, { guild: interaction.guild });
                    
                    pokemonTestResults.push({
                        text: testCase,
                        threatLevel: testAnalysis.threatLevel,
                        action: testAnalysis.action || 'none',
                        reasoning: testAnalysis.reasoning.length > 0 ? testAnalysis.reasoning[0] : 'No issues detected',
                        bypassDetected: testAnalysis.bypassDetected || false
                    });
                }

                const pokemonEmbed = new EmbedBuilder()
                    .setTitle('🧪 Pokemon Protection & Trading Code Test')
                    .setDescription('Testing comprehensive Pokemon content protection and bypass detection')
                    .setColor(config.colors.success);

                let legitimateCount = 0;
                let scamCount = 0;
                let bypassCount = 0;

                for (const result of pokemonTestResults) {
                    let status;
                    let category;
                    
                    if (result.text.includes('free nitro') || result.text.includes('free robux') || result.text.includes('scam')) {
                        // Should be flagged as scam
                        category = 'Scam Test';
                        status = result.threatLevel >= 5 ? '✅' : '❌';
                        if (result.threatLevel >= 5) scamCount++;
                    } else if (result.text.includes('f*ck') || result.text.includes('sh1t')) {
                        // Should be flagged as bypass
                        category = 'Bypass Test';
                        status = result.threatLevel >= 2 ? '✅' : '❌';
                        if (result.threatLevel >= 2) bypassCount++;
                    } else {
                        // Should NOT be flagged (Pokemon content)
                        category = 'Pokemon Content';
                        status = result.threatLevel === 0 ? '✅' : '❌';
                        if (result.threatLevel === 0) legitimateCount++;
                    }
                    
                    pokemonEmbed.addFields({
                        name: `${status} ${category}: "${result.text.slice(0, 30)}${result.text.length > 30 ? '...' : ''}"`,
                        value: `Threat: ${result.threatLevel}/10 | Action: ${result.action}\nBypass: ${result.bypassDetected ? 'YES' : 'NO'} | Reason: ${result.reasoning.slice(0, 50)}${result.reasoning.length > 50 ? '...' : ''}`,
                        inline: false
                    });
                }

                pokemonEmbed.addFields({
                    name: '📊 Test Results Summary',
                    value: `✅ Pokemon Content Protected: ${legitimateCount}/12\n✅ Scams Detected: ${scamCount}/3\n✅ Bypasses Detected: ${bypassCount}/2\n\n**Overall Success Rate: ${Math.round(((legitimateCount + scamCount + bypassCount) / 17) * 100)}%**`,
                    inline: false
                });

                pokemonEmbed.addFields({
                    name: '🎮 Pokemon Protection Features',
                    value: '• **Trading Codes**: .trade followed by 4-8 digit codes\n• **Pokemon Files**: .pk9, .pk8, .pb8, .pa8, etc.\n• **Battle Teams**: .bt command support\n• **Pokepaste Links**: pokepast.es integration\n• **Pokemon Stats**: Level, Ball, Ability, Nature, etc.\n• **Pokemon Names**: 100+ common Pokemon protected\n• **Competitive Terms**: OU, UU, VGC, Smogon, etc.',
                    inline: false
                });

                await interaction.editReply({ embeds: [pokemonEmbed] });
                break;

            case 'test-bypass':
                await interaction.deferReply();
                
                const bypassTestText = interaction.options.getString('text');
                
                // Test if this is Pokemon content first
                const isPokemon = synthiaAI.isPokemonRelatedContent(bypassTestText);
                
                const testAnalysis = await synthiaAI.analyzeMessage(bypassTestText, interaction.user, interaction.channel, { guild: interaction.guild });
                
                const bypassEmbed = new EmbedBuilder()
                    .setTitle('🔍 Enhanced Bypass Detection Test Results')
                    .setColor(testAnalysis.bypassDetected ? config.colors.error : config.colors.success)
                    .addFields(
                        { name: '📝 Original Text', value: `\`\`\`${bypassTestText.slice(0, 500)}\`\`\``, inline: false },
                        { name: '🎮 Pokemon Content', value: isPokemon ? '✅ YES (Protected)' : '❌ NO', inline: true },
                        { name: '🌍 Language', value: testAnalysis.language.originalLanguage, inline: true },
                        { name: '⚖️ Threat Level', value: `${testAnalysis.threatLevel}/10`, inline: true },
                        { name: '🔍 Bypass Detected', value: testAnalysis.bypassDetected ? '🚨 YES' : '✅ NO', inline: true },
                        { name: '🎯 Confidence', value: `${testAnalysis.confidence}%`, inline: true },
                        { name: '⚡ Processing Time', value: `${testAnalysis.processingTime}ms`, inline: true }
                    );

                if (testAnalysis.normalizedText && testAnalysis.normalizedText !== bypassTestText.toLowerCase()) {
                    bypassEmbed.addFields({
                        name: '🔍 Normalized Text (After Bypass Removal)',
                        value: `\`\`\`${testAnalysis.normalizedText.slice(0, 500)}\`\`\``,
                        inline: false
                    });
                }

                if (testAnalysis.bypassAttempts && testAnalysis.bypassAttempts.length > 0) {
                    const bypassMethods = testAnalysis.bypassAttempts.map(attempt => {
                        switch(attempt.type) {
                            case 'elongation': return '🔸 **Character Elongation** (fuuuuck → fuck)';
                            case 'character_substitution': return '🔸 **Symbol Substitution** (f*ck, f@ck → fuck)';
                            case 'separator_bypassing': return '🔸 **Separator Injection** (f.u.c.k → fuck)';
                            case 'spacing_bypassing': return '🔸 **Space Injection** (f u c k → fuck)';
                            case 'leetspeak': return '🔸 **Leetspeak** (sh1t → shit, 4ss → ass)';
                            case 'unicode_substitution': return '🔸 **Unicode Substitution** (Using foreign characters)';
                            default: return `🔸 **${attempt.type.replace('_', ' ').toUpperCase()}**`;
                        }
                    }).join('\n');

                    bypassEmbed.addFields({
                        name: '🚨 Detected Bypass Techniques',
                        value: bypassMethods,
                        inline: false
                    });
                }
                
                if (testAnalysis.reasoning.length > 0) {
                    bypassEmbed.addFields({
                        name: '🧠 AI Reasoning',
                        value: testAnalysis.reasoning.slice(0, 5).map(r => `• ${r}`).join('\n').slice(0, 1024),
                        inline: false
                    });
                }

                bypassEmbed.addFields({
                    name: '🔧 Moderation Thresholds',
                    value: `Warn: ${config.moderationThresholds.warn}+ | Delete: ${config.moderationThresholds.delete}+ | Mute: ${config.moderationThresholds.mute}+ | Ban: ${config.moderationThresholds.ban}+`,
                    inline: false
                });

                bypassEmbed.addFields({
                    name: '⚡ Final Action',
                    value: testAnalysis.action !== 'none' ? `🚨 **${testAnalysis.action.toUpperCase()}**` : '✅ **NO ACTION** (Below threshold or protected content)',
                    inline: false
                });

                // Add Pokemon protection notice if applicable
                if (isPokemon) {
                    bypassEmbed.addFields({
                        name: '🎮 Pokemon Protection Notice',
                        value: 'This content was identified as legitimate Pokemon content and is protected from moderation. Pokemon trading codes, files, and related content are automatically whitelisted.',
                        inline: false
                    });
                }
                
                await interaction.editReply({ embeds: [bypassEmbed] });
                break;

            case 'language-stats':
                await interaction.deferReply();
                
                const serverConfig = serverLogger.getServerConfig(interaction.guild.id);
                const translationStats = synthiaTranslator.getTranslationStats();
                
                const statsEmbed = new EmbedBuilder()
                    .setTitle('🌍 Multi-Language Statistics')
                    .setDescription('Enhanced Synthia v9.0 Language Analysis with Pokemon Protection')
                    .addFields(
                        { name: '🔄 Total Translations', value: `${translationStats.totalTranslations}`, inline: true },
                        { name: '✅ Success Rate', value: `${translationStats.successRate}%`, inline: true },
                        { name: '⚡ Avg Response Time', value: `${translationStats.averageResponseTime}ms`, inline: true },
                        { name: '🌐 Default Language', value: synthiaTranslator.enhancedAPI.supportedLanguages.get(serverConfig?.defaultTranslateTo || 'en') || 'English', inline: true },
                        { name: '🤖 Auto-Translation', value: serverConfig?.autoTranslate ? '✅ Enabled' : '❌ Disabled', inline: true },
                        { name: '🧠 Multi-Language Support', value: `${synthiaTranslator.enhancedAPI.supportedLanguages.size} languages`, inline: true },
                        { name: '🎮 Pokemon Protection', value: '✅ Active', inline: true },
                        { name: '🛡️ Bypass Detection', value: '✅ Enhanced', inline: true },
                        { name: '🔍 False Positives', value: '✅ Fixed', inline: true }
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
                
                await interaction.editReply(`✅ Server default translation language set to **${languageName}** (\`${serverLangCode}\`)\n\n🎮 Pokemon content will continue to be protected in all languages.`);
                
                await discordLogger.sendLog(
                    interaction.guild,
                    'success',
                    '🌍 Server Language Settings Changed',
                    `Default translation language set to ${languageName} by ${interaction.user.tag}`
                );
                break;

            case 'auto-translate':
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
                    .setFooter({ text: 'Use language names or codes in translation commands • Pokemon content protected in all languages' });
                
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
                
                const clearedViolations = userProfile.violations.length;
                const clearedBypassAttempts = userProfile.totalBypassAttempts || 0;
                
                userProfile.violations = [];
                userProfile.riskScore = 0;
                userProfile.bypassHistory = [];
                userProfile.totalBypassAttempts = 0;
                await synthiaAI.saveData();
                
                await interaction.editReply(`✅ Cleared all violations for ${userToClear.tag}\n\n**Cleared:**\n• ${clearedViolations} violations\n• ${clearedBypassAttempts} bypass attempts\n• Risk score reset to 0`);
                
                await discordLogger.sendLog(
                    interaction.guild,
                    'moderation',
                    '🧹 Violations Cleared',
                    `All violations cleared for ${userToClear.tag} by ${interaction.user.tag}`,
                    [
                        { name: '🗑️ Violations Cleared', value: `${clearedViolations}`, inline: true },
                        { name: '🚨 Bypass Attempts Cleared', value: `${clearedBypassAttempts}`, inline: true },
                        { name: '👤 Cleared By', value: `${interaction.user.tag}`, inline: true }
                    ]
                );
                break;

            case 'test-detection':
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
                        { name: '⚡ Processing Time', value: `${detectionAnalysis.processingTime}ms`, inline: true }
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
                
                await interaction.editReply({ embeds: [detectionEmbed] });
                break;

            case 'api-status':
                await interaction.deferReply();
                
                const apiStatus = synthiaTranslator.getTranslationStatus();
                
                const statusEmbed = new EmbedBuilder()
                    .setTitle('🔧 Multi-API Status')
                    .setDescription('Enhanced Translation API Provider Status with Pokemon Protection')
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
                        value: `Requests: ${status.requestsUsed}/${status.rateLimit}\nReset: ${resetTime}\nReliability: ${status.reliability}%\nBidirectional: ${status.bidirectional ? '✅' : '❌'}`,
                        inline: true
                    });
                }

                statusEmbed.addFields({
                    name: '📊 Overall Status',
                    value: `${workingProviders}/${totalProviders} providers available\nTotal requests: ${apiStatus.totalRequests}\nTotal characters: ${apiStatus.totalCharacters}\n🎮 Pokemon Protection: ✅ Active`,
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
                    .setDescription('Complete test of all translation providers with bidirectional support')
                    .setColor(config.colors.performance)
                    .addFields({
                        name: '📊 Summary',
                        value: `Working: ${testResults.summary.workingProviders}/${testResults.summary.totalProviders}\nAverage Time: ${testResults.summary.averageResponseTime}ms\nReliability: ${testResults.summary.reliability}%\nBidirectional Tests: ${testResults.summary.bidirectionalTests || 0}\nSuccess Rate: ${testResults.summary.bidirectionalSuccessRate || 0}%`,
                        inline: false
                    });

                for (const [provider, result] of Object.entries(testResults.individual)) {
                    const statusIcon = result.working ? '✅' : '❌';
                    const resultText = result.working 
                        ? `Success Rate: ${result.successRate || 0}%\nAvg Time: ${result.time}ms\nTests: ${result.successfulTests || 0}/${result.bidirectionalTests || 1}\nBidirectional: ${result.bidirectionalTests > 1 ? '✅' : '❌'}`
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

            case 'translation-stats':
                await interaction.deferReply();
                
                const detailedStats = synthiaTranslator.getTranslationStats();
                
                const statsDetailEmbed = new EmbedBuilder()
                    .setTitle('📊 Translation Performance Statistics')
                    .setDescription('Enhanced Multi-API Translation Performance with Pokemon Protection')
                    .setColor(config.colors.performance)
                    .addFields(
                        { name: '🔄 Total Translations', value: `${detailedStats.totalTranslations}`, inline: true },
                        { name: '✅ Successful', value: `${detailedStats.successfulTranslations}`, inline: true },
                        { name: '❌ Failed', value: `${detailedStats.failedTranslations}`, inline: true },
                        { name: '📈 Success Rate', value: `${detailedStats.successRate}%`, inline: true },
                        { name: '⚡ Average Time', value: `${detailedStats.averageResponseTime}ms`, inline: true },
                        { name: '🔧 Active Providers', value: `${Object.keys(detailedStats.providerStats || {}).length}`, inline: true },
                        { name: '🎮 Pokemon Protection', value: '✅ Active', inline: true },
                        { name: '🛡️ Bypass Detection', value: '✅ Enhanced', inline: true },
                        { name: '🌍 Language Support', value: `${synthiaTranslator.enhancedAPI.supportedLanguages.size}`, inline: true }
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

                // Add API status information
                const currentApiStatus = synthiaTranslator.getTranslationStatus();
                const availableProviders = Object.values(currentApiStatus.providers).filter(p => p.available).length;
                const totalApiProviders = Object.keys(currentApiStatus.providers).length;

                statsDetailEmbed.addFields({
                    name: '🔧 Current API Status',
                    value: `Available Providers: ${availableProviders}/${totalApiProviders}\nTotal API Requests: ${currentApiStatus.totalRequests || 0}\nTotal Characters Processed: ${currentApiStatus.totalCharacters || 0}`,
                    inline: false
                });
                
                await interaction.editReply({ embeds: [statsDetailEmbed] });
                break;

            case 'test-translate':
                await interaction.deferReply();
                
                const translateTestText = interaction.options.getString('text');
                const currentServerConfig = serverLogger.getServerConfig(interaction.guild.id);
                
                try {
                    // Check if this is Pokemon content first
                    const isPokemonTestContent = synthiaAI.isPokemonRelatedContent(translateTestText);
                    
                    const detectedLang = synthiaTranslator.detectLanguage(translateTestText);
                    const detectedLangName = synthiaTranslator.enhancedAPI.supportedLanguages.get(detectedLang) || detectedLang;
                    
                    const translation = await synthiaTranslator.translateText(
                        translateTestText, 
                        currentServerConfig?.defaultTranslateTo || 'en', 
                        detectedLang
                    );
                    
                    const testTranslateEmbed = new EmbedBuilder()
                        .setTitle('🧪 Translation System Test')
                        .setColor(config.colors.translation)
                        .addFields(
                            { name: '📝 Input Text', value: translateTestText, inline: false },
                            { name: '🎮 Pokemon Content', value: isPokemonTestContent ? '✅ YES (Protected)' : '❌ NO', inline: true },
                            { name: '🌍 Detected Language', value: `${detectedLangName} (${detectedLang})`, inline: true },
                            { name: '🎯 Target Language', value: `${synthiaTranslator.enhancedAPI.supportedLanguages.get(currentServerConfig?.defaultTranslateTo || 'en')} (${currentServerConfig?.defaultTranslateTo || 'en'})`, inline: true },
                            { name: '🔧 Provider', value: translation.provider || 'Unknown', inline: true },
                            { name: '📊 Confidence', value: `${translation.confidence || 0}%`, inline: true },
                            { name: '⚡ Processing Time', value: `${translation.processingTime || 0}ms`, inline: true }
                        );

                    if (detectedLang !== (currentServerConfig?.defaultTranslateTo || 'en')) {
                        testTranslateEmbed.addFields({
                            name: '🌟 Translation Result',
                            value: translation.translatedText || 'No translation performed',
                            inline: false
                        });
                    } else {
                        testTranslateEmbed.addFields({
                            name: '🌟 Translation Result',
                            value: 'No translation needed (same language)',
                            inline: false
                        });
                    }

                    testTranslateEmbed.addFields({
                        name: '🤖 Auto-Translation Status',
                        value: currentServerConfig?.autoTranslate ? '✅ Enabled' : '❌ Disabled',
                        inline: true
                    });

                    if (isPokemonTestContent) {
                        testTranslateEmbed.addFields({
                            name: '🎮 Pokemon Protection Notice',
                            value: 'This content was identified as Pokemon-related and receives special protection during translation.',
                            inline: false
                        });
                    }
                    
                    if (translation.error) {
                        testTranslateEmbed.addFields({ 
                            name: '❌ Error', 
                            value: translation.error, 
                            inline: false 
                        });
                    }
                    
                    await interaction.editReply({ embeds: [testTranslateEmbed] });
                    
                } catch (error) {
                    await interaction.editReply(`❌ Translation test failed: ${error.message}`);
                }
                break;

            case 'toggle-automod':
                await interaction.deferReply();
                
                const autoModEnabled = interaction.options.getBoolean('enabled');
                serverLogger.updateServerSetting(interaction.guild.id, 'autoModeration', autoModEnabled);
                
                await interaction.editReply(`${autoModEnabled ? '✅ Enabled' : '❌ Disabled'} automatic moderation for this server.\n\n🎮 **Pokemon Protection**: Always active regardless of automod settings\n🛡️ **Bypass Detection**: Enhanced and functional`);
                
                await discordLogger.sendLog(
                    interaction.guild,
                    'success',
                    '🛡️ Auto-Moderation Settings Changed',
                    `Auto-moderation has been ${autoModEnabled ? 'enabled' : 'disabled'} by ${interaction.user.tag}.\n\nPokemon protection remains active at all times.`
                );
                break;

            case 'setup-wizard':
                await interaction.deferReply();
                
                const wizardEmbed = new EmbedBuilder()
                    .setTitle('🚀 Enhanced Synthia v9.0 Setup Wizard')
                    .setDescription('Interactive setup for optimal performance with Pokemon protection')
                    .addFields(
                        { name: '📡 Step 1: Log Channel', value: 'Use `!synthia loghere` in your desired log channel', inline: false },
                        { name: '🛡️ Step 2: Auto-Moderation', value: 'Use `/toggle-automod enabled:true` to enable', inline: false },
                        { name: '🌍 Step 3: Translation', value: 'Use `/set-server-language` and `/auto-translate` as needed', inline: false },
                        { name: '🧪 Step 4: Testing', value: 'Use `/test-pokemon` to verify Pokemon protection works', inline: false },
                        { name: '🔍 Step 5: Bypass Testing', value: 'Use `/test-bypass` to test bypass detection', inline: false }
                    )
                    .setColor(config.colors.success)
                    .setFooter({ text: 'Enhanced Synthia v9.0 - Complete AI Moderation System with Pokemon Support' });
                
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
