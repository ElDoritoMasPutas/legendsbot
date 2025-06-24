// Enhanced Command Handler v9.0
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
        .setName('setup-wizard')
        .setDescription('Interactive setup wizard for Enhanced Synthia configuration')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
];

// Text Command Handler
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

        case 'removelog':
        case 'removelogchannel':
        case 'unlog':
            if (!message.member?.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
                await message.reply('❌ You need Manage Server permission to remove log channels.');
                return;
            }

            const argsRemove = message.content.split(' ').slice(2);
            if (argsRemove.length === 0) {
                const currentLogChannels = serverLogger.getLogChannels(message.guild.id);
                if (currentLogChannels.length === 0) {
                    await message.reply('❌ No log channels are currently configured.');
                    return;
                }

                let channelList = '**📡 Current Log Channels:**\n';
                for (const channelId of currentLogChannels) {
                    const channel = message.guild.channels.cache.get(channelId);
                    if (channel) {
                        channelList += `• <#${channelId}> (\`${channelId}\`)\n`;
                    } else {
                        channelList += `• ~~Invalid Channel~~ (\`${channelId}\`) - **DELETED**\n`;
                    }
                }

                await message.reply({
                    content: `**Usage:** \`!synthia removelog <#channel>\` or \`!synthia removelog <channel_id>\`\n\n` +
                            channelList +
                            `\n**Examples:**\n` +
                            `• \`!synthia removelog <#${currentLogChannels[0]}>\`\n` +
                            `• \`!synthia removelog ${currentLogChannels[0]}\``
                });
                return;
            }

            let targetChannelId = argsRemove[0];
            const channelMentionMatch = targetChannelId.match(/^<#(\d+)>$/);
            if (channelMentionMatch) {
                targetChannelId = channelMentionMatch[1];
            }

            if (!/^\d{17,19}$/.test(targetChannelId)) {
                await message.reply('❌ Invalid channel ID or mention. Use `<#channel>` or provide a valid channel ID.');
                return;
            }

            const removed = serverLogger.removeLogChannel(message.guild.id, targetChannelId);
            
            if (removed) {
                const targetChannel = message.guild.channels.cache.get(targetChannelId);
                const channelName = targetChannel ? `<#${targetChannelId}>` : `Channel ID: \`${targetChannelId}\``;
                
                await message.reply(`✅ Removed ${channelName} from Enhanced Synthia logging configuration.`);
                console.log(`🗑️ Removed log channel ${targetChannelId} from ${message.guild.name} by ${message.author.tag}`);
            } else {
                const targetChannel = message.guild.channels.cache.get(targetChannelId);
                const channelName = targetChannel ? `<#${targetChannelId}>` : `Channel ID: \`${targetChannelId}\``;
                await message.reply(`⚠️ ${channelName} is not configured as a log channel.`);
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

        case 'togglemod':
        case 'automod':
            if (!message.member?.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
                await message.reply('❌ You need Manage Server permission to toggle automoderation.');
                return;
            }

            const currentAutoMod = serverLogger.isAutoModerationEnabled(message.guild.id);
            const newAutoMod = !currentAutoMod;
            
            serverLogger.updateServerSetting(message.guild.id, 'autoModeration', newAutoMod);
            
            await message.reply(`${newAutoMod ? '✅ Enabled' : '❌ Disabled'} automatic moderation for this server.`);
            
            await discordLogger.sendLog(
                message.guild,
                'success',
                '🛡️ Auto-Moderation Settings Changed',
                `Auto-moderation has been ${newAutoMod ? 'enabled' : 'disabled'} by ${message.author.tag}`,
                [
                    { name: '👤 Changed By', value: `${message.author.tag}`, inline: true },
                    { name: '🔧 New Status', value: newAutoMod ? '✅ Enabled' : '❌ Disabled', inline: true },
                    { name: '📅 Changed At', value: new Date().toLocaleString(), inline: true }
                ]
            );
            break;

        case 'help':
            const helpEmbed = new EmbedBuilder()
                .setTitle('🧠 Enhanced Synthia v9.0 Help')
                .setDescription('Multi-API Intelligence Moderation & Translation System')
                .addFields(
                    { name: '🚀 Quick Setup', value: '`/setup-wizard` - **Interactive setup guide**\n`!synthia loghere` - Set log channel\n`!synthia removelog <#channel>` - Remove log channel\n`!synthia status` - System status' },
                    { name: '🛡️ Moderation', value: '`!synthia togglemod` - **Toggle auto-moderation**\n`/toggle-automod` - Slash command version' },
                    { name: '🌍 Translation', value: '`/translate` - **Main translation command**\n`/supported-languages` - List all languages\n`/auto-translate` - Toggle auto-translation' },
                    { name: '📊 Analysis', value: '`/synthia-analysis` - Analyze user\n`/test-detection` - Test detection\n`/api-status` - API status' },
                    { name: '🔧 System', value: '`!synthia debug` - Debug configuration\n`!synthia testlog` - Test logging\n`!synthia fixlogs` - Auto-repair logs' }
                )
                .setColor(config.colors.info)
                .setFooter({ text: '💡 Enhanced with reduced false positives!' });
            
            await message.reply({ embeds: [helpEmbed] });
            break;

        default:
            await message.reply('❓ Unknown command. Use `!synthia help` for available commands.');
            break;
    }
}

// Slash Command Handler
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
                        { name: `📝 Original (${translation.originalLanguage})`, value: text.slice(0, 1024), inline: false },
                        { name: `🌟 Translation (${translation.targetLanguage})`, value: translation.translatedText.slice(0, 1024), inline: false },
                        { name: '🔧 Provider', value: translation.provider || 'Unknown', inline: true },
                        { name: '📊 Confidence', value: `${translation.confidence}%`, inline: true },
                        { name: '⚡ Time', value: `${translation.processingTime}ms`, inline: true }
                    );
                
                if (translation.error) {
                    translateEmbed.addFields({ name: '❌ Error', value: translation.error });
                }
                
                await interaction.editReply({ embeds: [translateEmbed] });
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
                    `Auto-moderation has been ${autoModEnabled ? 'enabled' : 'disabled'} by ${interaction.user.tag}`,
                    [
                        { name: '👤 Changed By', value: `${interaction.user.tag}`, inline: true },
                        { name: '🔧 New Status', value: autoModEnabled ? '✅ Enabled' : '❌ Disabled', inline: true }
                    ]
                );
                break;

            case 'test-detection':
                await interaction.deferReply();
                
                const testText = interaction.options.getString('text');
                const testAnalysis = await synthiaAI.analyzeMessage(testText, interaction.user, interaction.channel, { guild: interaction.guild });
                
                const detectionEmbed = new EmbedBuilder()
                    .setTitle('🔍 Enhanced Detection Test Results')
                    .setColor(config.colors.ai_analysis)
                    .addFields(
                        { name: '📝 Text', value: testText.slice(0, 1024), inline: false },
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

            // Add other command cases...
            default:
                await interaction.reply({ content: 'Command not fully implemented yet.', ephemeral: true });
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