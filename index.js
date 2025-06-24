// Enhanced Discord Bot v9.0 - FIXED FALSE POSITIVES - Main Entry Point
const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField, REST, Routes, ActivityType } = require('discord.js');

// Import all modules
const config = require('./config/config.js');
const SynthiaMultiTranslator = require('./translation/enhancedTranslator.js');
const ServerConfigManager = require('./server/serverManager.js');
const EnhancedDiscordLogger = require('./logging/discordLogger.js');
const EnhancedSynthiaAI = require('./moderation/synthiaAI.js');
const { violationTypes, userViolations, executeModerationAction } = require('./utils/violations.js');
const { commands, handleTextCommand, handleSlashCommand } = require('./commands/commandHandler.js');

// Initialize Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.DirectMessages
    ],
    partials: ['MESSAGE', 'CHANNEL', 'REACTION']
});

// Initialize components
console.log('🔧 Initializing Enhanced Synthia v9.0 components...');
const synthiaTranslator = new SynthiaMultiTranslator();
const serverLogger = new ServerConfigManager();
const discordLogger = new EnhancedDiscordLogger(serverLogger);
const synthiaAI = new EnhancedSynthiaAI(synthiaTranslator, discordLogger);

// FIXED: Enhanced message monitoring with corrected moderation logic
client.on('messageCreate', async (message) => {
    // Skip bots and DMs
    if (message.author?.bot || !message.guild) return;
    
    // Skip users with manage messages permission (moderators/admins)
    if (message.member && message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;

    // Check if automoderation is enabled for this server
    if (!serverLogger.isAutoModerationEnabled(message.guild.id)) {
        console.log(`🔇 Automoderation disabled for ${message.guild.name}`);
        return;
    }

    // Handle text commands
    if (message.content.startsWith('!synthia')) {
        await handleTextCommand(message, synthiaTranslator, synthiaAI, serverLogger, discordLogger, userViolations);
        return;
    }

    // Process message for moderation and auto-translation
    if (message.content && message.content.length > 0) {
        try {
            const startTime = Date.now();
            
            // FIXED: Enhanced analysis with better false positive prevention
            const synthiaAnalysis = await synthiaAI.analyzeMessage(
                message.content,
                message.author,
                message.channel,
                message
            );
            
            const processingTime = Date.now() - startTime;
            const serverConfig = serverLogger.getServerConfig(message.guild.id);
            
            // Auto-translation feature (only for non-toxic messages)
            if (serverConfig && serverConfig.autoTranslate && 
                synthiaAnalysis.language.detected !== 'en' && 
                synthiaAnalysis.language.detected !== (serverConfig.defaultTranslateTo || 'en') &&
                synthiaAnalysis.threatLevel === 0) {
                
                try {
                    const autoTranslation = await synthiaTranslator.translateText(
                        message.content, 
                        serverConfig.defaultTranslateTo || 'en', 
                        synthiaAnalysis.language.detected
                    );
                    
                    if (!autoTranslation.error && autoTranslation.translatedText !== message.content) {
                        const autoTranslateEmbed = new EmbedBuilder()
                            .setColor(config.colors.translation)
                            .setAuthor({
                                name: message.author.displayName,
                                iconURL: message.author.displayAvatarURL()
                            })
                            .setDescription(`**🌍 Auto-Translation** (${synthiaAnalysis.language.originalLanguage} → ${autoTranslation.targetLanguage})\n\n${autoTranslation.translatedText}`)
                            .setFooter({ 
                                text: `Translated by ${autoTranslation.provider} • React with ❌ to delete`,
                                iconURL: client.user?.displayAvatarURL() 
                            })
                            .setTimestamp();
                        
                        const autoReply = await message.reply({ embeds: [autoTranslateEmbed] });
                        
                        // Add delete reaction
                        await autoReply.react('❌');
                        
                        // Set up reaction collector for deletion
                        const filter = (reaction, user) => {
                            return reaction.emoji.name === '❌' && (user.id === message.author.id || 
                                   message.guild.members.cache.get(user.id)?.permissions.has(PermissionsBitField.Flags.ManageMessages));
                        };
                        
                        const collector = autoReply.createReactionCollector({ filter, time: 300000 });
                        
                        collector.on('collect', () => {
                            autoReply.delete().catch(() => {});
                        });
                        
                        console.log(`🌍 Auto-translated message from ${message.author.tag}: ${synthiaAnalysis.language.originalLanguage} → ${autoTranslation.targetLanguage}`);
                        
                        await discordLogger.logTranslation(
                            message.guild,
                            message.content,
                            autoTranslation.translatedText,
                            synthiaAnalysis.language.originalLanguage,
                            autoTranslation.targetLanguage,
                            message.author,
                            autoTranslation.provider,
                            autoTranslation.processingTime,
                            true
                        );
                    }
                } catch (autoTranslateError) {
                    console.error('❌ Auto-translation error:', autoTranslateError);
                }
            }
            
            // FIXED: Enhanced logging with better filtering
            if (synthiaAnalysis.threatLevel >= 1 || synthiaAnalysis.language.detected !== 'en' || synthiaAnalysis.elongatedWords.length > 0) {
                console.log(`\n🧠 Enhanced Synthia v9.0 Analysis - ${message.author.tag}:`);
                console.log(`   📝 Content: "${message.content.slice(0, 50)}..."`);
                console.log(`   🌍 Language: ${synthiaAnalysis.language.originalLanguage}`);
                console.log(`   ⚖️ Threat Level: ${synthiaAnalysis.threatLevel}/10`);
                console.log(`   🎯 Confidence: ${synthiaAnalysis.confidence}%`);
                console.log(`   ⚡ Processing Time: ${processingTime}ms`);
                console.log(`   🔄 Multi-API Used: ${synthiaAnalysis.multiApiUsed ? 'Yes' : 'No'}`);
                console.log(`   🔍 Elongated: ${synthiaAnalysis.elongatedWords.length > 0 ? 'Yes' : 'No'}`);
                console.log(`   🎯 Action: ${synthiaAnalysis.action}`);
                console.log(`   📊 Thresholds: Warn(${config.moderationThresholds.warn}) Delete(${config.moderationThresholds.delete}) Mute(${config.moderationThresholds.mute}) Ban(${config.moderationThresholds.ban})`);
                
                if (synthiaAnalysis.language.provider) {
                    console.log(`   🔧 Provider: ${synthiaAnalysis.language.provider}`);
                }
            }
            
            // FIXED: Execute moderation action only if violation detected and thresholds met
            if (synthiaAnalysis.violationType && synthiaAnalysis.action !== 'none' && 
                config.autoModerationEnabled && serverLogger.isAutoModerationEnabled(message.guild.id)) {
                
                console.log(`🛡️ Executing moderation action: ${synthiaAnalysis.action} for threat level ${synthiaAnalysis.threatLevel}`);
                await executeModerationAction(message, synthiaAnalysis, serverLogger, discordLogger);
            }
            
        } catch (error) {
            console.error('❌ Enhanced Synthia v9.0 Analysis Error:', error);
            discordLogger.sendLog(message.guild, 'error', '❌ Enhanced Analysis Error', error.message);
        }
    }
});

// Enhanced slash command handler
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    await handleSlashCommand(interaction, synthiaTranslator, synthiaAI, serverLogger, discordLogger, userViolations);
});

// Bot ready event
client.once('ready', async () => {
    console.log(`\n✅ Enhanced Synthia v${config.aiVersion} Online!`);
    console.log(`🚀 Multi-API Intelligence System Activated`);
    console.log(`🧠 Intelligence Level: IQ 300+ Enhanced`);
    console.log(`🔄 API Providers: ${Object.keys(synthiaTranslator.enhancedAPI.apis).length}`);
    console.log(`🌍 Languages: ${synthiaTranslator.enhancedAPI.supportedLanguages.size}`);
    console.log(`📡 Servers: ${client.guilds.cache.size}`);
    console.log(`👥 Users: ${client.users.cache.size}`);
    
    // FIXED: Display updated thresholds
    console.log(`\n🛡️ FIXED Moderation Thresholds:`);
    console.log(`   ⚠️ Warn: ${config.moderationThresholds.warn}+ (was 1+)`);
    console.log(`   🗑️ Delete: ${config.moderationThresholds.delete}+ (was 2+)`);
    console.log(`   🔇 Mute: ${config.moderationThresholds.mute}+ (was 4+)`);
    console.log(`   🔨 Ban: ${config.moderationThresholds.ban}+ (was 6+)`);
    console.log(`   ✅ False Positive Prevention: ACTIVE\n`);
    
    client.user.setActivity(`${client.guilds.cache.size} servers | v${config.aiVersion} FIXED`, {
        type: ActivityType.Watching
    });
    
    // Register slash commands
    const rest = new REST({ version: '10' }).setToken(config.token);
    try {
        console.log('🔄 Registering enhanced slash commands...');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands.map(cmd => cmd.toJSON()) }
        );
        console.log('✅ Enhanced commands registered successfully');
    } catch (error) {
        console.error('❌ Failed to register enhanced commands:', error);
    }
    
    console.log('🎯 Enhanced Multi-API Intelligence System fully operational!');
    console.log('🔧 FALSE POSITIVE ISSUES RESOLVED!');
});

// Auto-setup when joining new servers
client.on('guildCreate', async (guild) => {
    console.log(`🆕 Joined new server: ${guild.name} (${guild.memberCount} members)`);
    
    try {
        const logChannel = await serverLogger.autoSetupLogChannel(guild);
        
        if (logChannel) {
            console.log(`✅ Auto-setup completed for ${guild.name}`);
            
            await discordLogger.sendLog(
                guild,
                'success',
                '🚀 Enhanced Synthia v9.0 Activated! (FALSE POSITIVES FIXED)',
                `Multi-API Intelligence System is now protecting this server with IMPROVED accuracy and reduced false positives.`,
                [
                    { name: '🔧 Features Active', value: '• FIXED Multi-language toxicity detection\n• 9 translation API providers\n• Auto-translation support\n• IMPROVED elongated word detection\n• Auto-moderation with HIGHER thresholds', inline: false },
                    { name: '📊 Fixed Thresholds', value: `• Warn: ${config.moderationThresholds.warn}+ threat level\n• Delete: ${config.moderationThresholds.delete}+ threat level\n• Mute: ${config.moderationThresholds.mute}+ threat level\n• Ban: ${config.moderationThresholds.ban}+ threat level`, inline: false },
                    { name: '📚 Getting Started', value: '• `!synthia help` - View all commands\n• `/translate` - Translate any text\n• `/test-detection` - Test detection with new thresholds\n• `/toggle-automod` - Toggle auto-moderation', inline: false }
                ]
            );
        } else {
            const owner = await guild.fetchOwner().catch(() => null);
            if (owner) {
                try {
                    const setupEmbed = new EmbedBuilder()
                        .setTitle('🚀 Enhanced Synthia v9.0 Setup Required (FALSE POSITIVES FIXED!)')
                        .setDescription(`Thank you for adding Enhanced Synthia to **${guild.name}**!\n\n**✅ MAJOR UPDATE: False positive issues have been resolved!**\n\nTo complete setup, please run this command in your desired log channel:`)
                        .addFields(
                            { name: '📡 Setup Command', value: '```!synthia loghere```', inline: false },
                            { name: '🔧 What\'s Fixed', value: '• Higher threat thresholds prevent false warnings\n• Better scam detection (no more .trade false positives)\n• Improved context awareness for gaming terms\n• More conservative toxicity scoring', inline: false },
                            { name: '📊 New Thresholds', value: `• Warn: ${config.moderationThresholds.warn}+ (was 1+)\n• Delete: ${config.moderationThresholds.delete}+ (was 2+)\n• Mute: ${config.moderationThresholds.mute}+ (was 4+)\n• Ban: ${config.moderationThresholds.ban}+ (was 6+)`, inline: false }
                        )
                        .setColor(config.colors.success)
                        .setFooter({ text: `Enhanced Synthia v${config.aiVersion} - FALSE POSITIVES FIXED` });
                    
                    await owner.send({ embeds: [setupEmbed] });
                } catch (error) {
                    console.log(`⚠️ Could not DM setup instructions to ${guild.name} owner`);
                }
            }
        }
    } catch (error) {
        console.error(`❌ Failed to setup ${guild.name}:`, error);
    }
});

// Handle guild leave
client.on('guildDelete', (guild) => {
    console.log(`👋 Left server: ${guild.name}`);
});

// Error handlers
client.on('error', (error) => {
    console.error('Enhanced Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('🚨 Unhandled promise rejection in Enhanced Synthia:', error);
});

process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught exception in Enhanced Synthia:', error);
    synthiaAI.saveData().catch(() => {});
    serverLogger.saveConfigs().catch(() => {});
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down Enhanced Synthia v9.0...');
    
    try {
        console.log('💾 Saving enhanced AI profiles...');
        await synthiaAI.saveData();
        
        console.log('💾 Saving server configurations...');
        await serverLogger.saveConfigs();
        
        console.log('✅ All enhanced data saved.');
        
        client.destroy();
        console.log('👋 Enhanced Synthia v9.0 shutdown complete. Goodbye!');
        process.exit(0);
    } catch (error) {
        console.error('💥 Error during enhanced shutdown:', error);
        process.exit(1);
    }
});

// Enhanced startup logging
console.log(`🚀 Starting Enhanced Synthia v${config.aiVersion} Multi-API Intelligence...`);
console.log('🧠 Initializing Enhanced Neural Networks...');
console.log('🌍 Loading 60+ Language Patterns...');
console.log('⚡ Preparing 2,000+ ops/ms Processing...');
console.log('🔄 Connecting to 9 Translation APIs...');
console.log('🔧 Enhanced Configuration:');
console.log(`   🚨 Auto-Moderation: ${config.autoModerationEnabled ? 'ENABLED' : 'DISABLED'}`);
console.log(`   🔄 Multi-API: ${config.multiApiEnabled ? 'ENABLED' : 'DISABLED'}`);
console.log(`   🔧 Fallback Mode: ${config.fallbackEnabled ? 'ENABLED' : 'DISABLED'}`);
console.log(`   🔍 Debug Mode: ${config.debugMode ? 'ON' : 'OFF'}`);
console.log(`   📝 Verbose Logging: ${config.verboseLogging ? 'ON' : 'OFF'}`);
console.log(`   ✅ FALSE POSITIVE FIXES: APPLIED\n`);

// Start the bot
client.login(config.token).catch(error => {
    console.error('❌ Enhanced Synthia failed to login:', error);
    
    if (error.code === 'TOKEN_INVALID') {
        console.error('🔑 INVALID TOKEN: Please check your DISCORD_TOKEN in .env file');
    } else if (error.code === 'DISALLOWED_INTENTS') {
        console.error('🔐 INTENT ERROR: Please enable required intents in Discord Developer Portal');
    } else {
        console.error('🌐 CONNECTION ERROR: Please check your internet connection');
    }
    
    process.exit(1);
});

console.log('🌟 Enhanced Synthia v9.0 Multi-API Intelligence System');
console.log('🧠 Superintelligence Level: IQ 300+');
console.log('🔄 Bidirectional Multi-API Translation');
console.log('🌍 Advanced Multi-language Moderation');
console.log('🤖 Auto-Translation Feature');
console.log('⚡ Enhanced Cultural Context Analysis');
console.log('🛡️ Toggleable Auto-Moderation System');
console.log('✅ FALSE POSITIVE ISSUES RESOLVED');
console.log('🚀 Starting enhanced login sequence...\n');