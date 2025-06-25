// Enhanced Violation Types and Moderation Logic v9.0 - FIXED WORKING THRESHOLDS
const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const config = require('../config/config.js');

// FIXED: Proper violation types with working thresholds
const violationTypes = {
    DISRESPECTFUL: {
        name: 'Disrespectful Interaction',
        severity: 2,
        threshold: 2, // FIXED: Matches config warn threshold
        aiAnalysis: true,
        contextRequired: true,
        multiLanguage: true,
        escalation: [
            { action: 'warn', duration: 0 },
            { action: 'warn', duration: 0 },
            { action: 'mute', duration: 60 * 60 * 1000 },
            { action: 'ban', duration: 0 }
        ]
    },
    TOXIC_BEHAVIOR: {
        name: 'Toxic Behavior Pattern',
        severity: 3,
        threshold: 3, // FIXED: Matches config delete threshold
        aiAnalysis: true,
        contextRequired: true,
        multiLanguage: true,
        escalation: [
            { action: 'delete', duration: 0 },
            { action: 'warn', duration: 0 },
            { action: 'mute', duration: 60 * 60 * 1000 },
            { action: 'ban', duration: 0 }
        ]
    },
    HARASSMENT: {
        name: 'Harassment/Bullying/Hate Speech',
        severity: 5,
        threshold: 5, // FIXED: Matches config mute threshold
        aiAnalysis: true,
        contextRequired: true,
        multiLanguage: true,
        escalation: [
            { action: 'mute', duration: 24 * 60 * 60 * 1000 },
            { action: 'mute', duration: 7 * 24 * 60 * 60 * 1000 },
            { action: 'ban', duration: 0 }
        ]
    },
    SEVERE_TOXICITY: {
        name: 'Severe Toxic Content',
        severity: 7,
        threshold: 7, // FIXED: Matches config ban threshold
        aiAnalysis: true,
        contextRequired: false,
        multiLanguage: true,
        escalation: [
            { action: 'ban', duration: 0 }
        ]
    },
    SCAM: {
        name: 'Scam/Fraud Content',
        severity: 6,
        threshold: 6, // FIXED: Below ban threshold but still serious
        aiAnalysis: true,
        contextRequired: false,
        multiLanguage: true,
        escalation: [
            { action: 'ban', duration: 0 }
        ]
    },
    SPAM: {
        name: 'Excessive Messaging/Flooding',
        severity: 3,
        threshold: 3, // FIXED: Reasonable threshold
        aiAnalysis: true,
        contextRequired: false,
        multiLanguage: false,
        escalation: [
            { action: 'warn', duration: 0 },
            { action: 'mute', duration: 60 * 60 * 1000 },
            { action: 'ban', duration: 0 }
        ]
    }
};

// User violation tracking
const userViolations = new Map();

// FIXED: Working moderation execution
async function executeModerationAction(message, synthiaAnalysis, serverLogger, discordLogger) {
    const member = message.member;
    const violationType = synthiaAnalysis.violationType;
    
    if (!violationType || !violationTypes[violationType]) {
        console.error('❌ Invalid violation type:', violationType);
        return;
    }
    
    const violationRule = violationTypes[violationType];
    
    // FIXED: Check if threat level actually warrants action
    if (synthiaAnalysis.threatLevel < violationRule.threshold) {
        console.log(`⚠️ Threat level ${synthiaAnalysis.threatLevel} below threshold ${violationRule.threshold} for ${violationType} - no action taken`);
        return;
    }
    
    try {
        const userId = message.author.id;
        const userHistory = userViolations.get(userId) || {};
        const violationCount = userHistory[violationType] || 0;
        
        userHistory[violationType] = violationCount + 1;
        userViolations.set(userId, userHistory);
        
        const punishment = violationRule.escalation[Math.min(violationCount, violationRule.escalation.length - 1)];
        
        let reason = `Enhanced Synthia v${config.aiVersion}: ${violationRule.name} (Level ${synthiaAnalysis.threatLevel}/10)`;
        
        if (synthiaAnalysis.language.detected !== 'en') {
            reason += ` | Language: ${synthiaAnalysis.language.originalLanguage}`;
            if (synthiaAnalysis.language.provider) {
                reason += ` | Provider: ${synthiaAnalysis.language.provider}`;
            }
        }
        
        if (synthiaAnalysis.elongatedWords.length > 0) {
            reason += ` | Elongated: ${synthiaAnalysis.elongatedWords.map(w => w.original).join(', ')}`;
        }
        
        console.log(`🛡️ EXECUTING MODERATION ACTION:`);
        console.log(`   User: ${member?.user.tag || message.author.tag}`);
        console.log(`   Action: ${punishment.action}`);
        console.log(`   Threat Level: ${synthiaAnalysis.threatLevel}/10`);
        console.log(`   Threshold: ${violationRule.threshold}/10`);
        console.log(`   Violation: ${violationType}`);
        console.log(`   Violation Count: ${violationCount + 1}`);
        console.log(`   Reason: ${reason}`);
        
        // Take moderation action
        let actionSuccessful = false;
        let actionError = null;
        
        switch (punishment.action) {
            case 'warn':
                try {
                    await sendViolationDM(member, {
                        action: 'warn',
                        violationType,
                        violationNumber: violationCount + 1,
                        reason,
                        guildName: message.guild.name,
                        originalLanguage: synthiaAnalysis.language.originalLanguage,
                        multiApiUsed: synthiaAnalysis.multiApiUsed,
                        threatLevel: synthiaAnalysis.threatLevel
                    });
                    actionSuccessful = true;
                    console.log(`⚠️ Successfully warned ${member?.user.tag || message.author.tag}`);
                } catch (error) {
                    actionError = error.message;
                    console.error(`❌ Failed to warn user: ${error.message}`);
                }
                break;
                
            case 'delete':
                // Delete message
                if (message.deletable && 
                    message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                    try {
                        await message.delete();
                        console.log(`🗑️ Deleted message from ${member?.user.tag || message.author.tag}`);
                        actionSuccessful = true;
                        
                        // Send DM about deletion
                        await sendViolationDM(member, {
                            action: 'delete',
                            violationType,
                            violationNumber: violationCount + 1,
                            reason,
                            guildName: message.guild.name,
                            originalLanguage: synthiaAnalysis.language.originalLanguage,
                            multiApiUsed: synthiaAnalysis.multiApiUsed,
                            threatLevel: synthiaAnalysis.threatLevel,
                            violatingContent: message.content,
                            reasoning: synthiaAnalysis.reasoning
                        });
                    } catch (error) {
                        actionError = error.message;
                        console.error(`❌ Failed to delete message: ${error.message}`);
                    }
                } else {
                    actionError = 'Missing permissions to delete message';
                    console.log(`⚠️ Missing permissions to delete message`);
                }
                break;
                
            case 'mute':
                if (member && message.guild.members.me.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
                    try {
                        await member.timeout(punishment.duration, reason);
                        console.log(`🔇 Muted ${member.user.tag} for ${formatDuration(punishment.duration)}`);
                        
                        await sendViolationDM(member, {
                            action: 'mute',
                            violationType,
                            violationNumber: violationCount + 1,
                            reason,
                            guildName: message.guild.name,
                            duration: punishment.duration,
                            originalLanguage: synthiaAnalysis.language.originalLanguage,
                            multiApiUsed: synthiaAnalysis.multiApiUsed,
                            threatLevel: synthiaAnalysis.threatLevel,
                            violatingContent: message.content,
                            reasoning: synthiaAnalysis.reasoning
                        });
                        actionSuccessful = true;
                        
                        // Also delete the message
                        if (message.deletable) {
                            await message.delete().catch(() => {});
                        }
                    } catch (error) {
                        actionError = error.message;
                        console.error(`❌ Failed to mute user: ${error.message}`);
                    }
                } else {
                    actionError = 'Missing permissions to mute user';
                    console.log(`⚠️ Missing permissions to mute user`);
                }
                break;
                
            case 'ban':
                if (member && message.guild.members.me.permissions.has(PermissionsBitField.Flags.BanMembers)) {
                    try {
                        await sendViolationDM(member, {
                            action: 'ban',
                            violationType,
                            violationNumber: violationCount + 1,
                            reason,
                            guildName: message.guild.name,
                            originalLanguage: synthiaAnalysis.language.originalLanguage,
                            multiApiUsed: synthiaAnalysis.multiApiUsed,
                            threatLevel: synthiaAnalysis.threatLevel,
                            violatingContent: message.content,
                            reasoning: synthiaAnalysis.reasoning
                        });
                        
                        await member.ban({ reason, deleteMessageDays: 1 });
                        console.log(`🔨 Banned ${member.user.tag}`);
                        actionSuccessful = true;
                    } catch (error) {
                        actionError = error.message;
                        console.error(`❌ Failed to ban user: ${error.message}`);
                    }
                } else {
                    actionError = 'Missing permissions to ban user';
                    console.log(`⚠️ Missing permissions to ban user`);
                }
                break;
        }
        
        // Delete message for non-delete actions too (if it wasn't already deleted)
        if (punishment.action !== 'delete' && punishment.action !== 'warn' && actionSuccessful) {
            if (message.deletable && 
                message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                try {
                    await message.delete();
                    console.log(`🗑️ Also deleted violating message`);
                } catch (error) {
                    console.log(`⚠️ Could not delete message: ${error.message}`);
                }
            }
        }
        
        // Enhanced logging
        await discordLogger.logModeration(message.guild, punishment.action, message.author, reason, {
            'Action Status': actionSuccessful ? '✅ Successful' : `❌ Failed: ${actionError}`,
            'Enhanced Synthia': config.aiVersion,
            'Confidence': `${synthiaAnalysis.confidence}%`,
            'Threat Level': `${synthiaAnalysis.threatLevel}/10`,
            'Threshold': `${violationRule.threshold}/10`,
            'Processing Time': `${synthiaAnalysis.processingTime}ms`,
            'Violation Count': violationCount + 1,
            'originalLanguage': synthiaAnalysis.language.originalLanguage,
            'elongatedWords': synthiaAnalysis.elongatedWords,
            'multiApiUsed': synthiaAnalysis.multiApiUsed,
            'provider': synthiaAnalysis.language.provider
        });
        
        // FIXED: Log successful action completion
        if (actionSuccessful) {
            console.log(`✅ MODERATION ACTION COMPLETED SUCCESSFULLY:`);
            console.log(`   User: ${member?.user.tag || message.author.tag}`);
            console.log(`   Action: ${punishment.action}`);
            console.log(`   Violation: ${violationType}`);
            console.log(`   Total Violations: ${violationCount + 1}`);
        }
        
    } catch (error) {
        console.error('❌ Enhanced moderation action failed:', error);
        
        await discordLogger.sendLog(message.guild, 'error', '❌ Enhanced Moderation Error', 
            `Failed to execute ${synthiaAnalysis.action} action: ${error.message}`,
            [
                { name: 'User', value: `${message.author.tag} (${message.author.id})`, inline: true },
                { name: 'Violation Type', value: violationType, inline: true },
                { name: 'Threat Level', value: `${synthiaAnalysis.threatLevel}/10`, inline: true }
            ]
        );
    }
}

// Enhanced DM notification function
async function sendViolationDM(member, dmData) {
    try {
        const user = member.user;
        const violationRule = violationTypes[dmData.violationType];
        
        const embed = new EmbedBuilder()
            .setFooter({ text: `Enhanced Synthia v${config.aiVersion} Multi-API System` })
            .setTimestamp()
            .setAuthor({
                name: 'Enhanced Synthia v9.0 - Multi-API Intelligence',
                iconURL: member.client.user?.displayAvatarURL()
            });
        
        switch (dmData.action) {
            case 'warn':
                embed
                    .setColor(config.colors.warning)
                    .setTitle(`⚠️ Enhanced Warning - ${dmData.guildName}`)
                    .setDescription(`You have received a warning from Enhanced Synthia v${config.aiVersion} multi-API intelligence system.`)
                    .addFields(
                        { name: '⚖️ Violation', value: violationRule.name, inline: true },
                        { name: '📊 Warning #', value: `${dmData.violationNumber}`, inline: true },
                        { name: '🌍 Language', value: dmData.originalLanguage || 'English', inline: true },
                        { name: '🔥 Threat Level', value: `${dmData.threatLevel}/10`, inline: true },
                        { name: '📝 Your Message', value: `\`\`\`${dmData.violatingContent ? dmData.violatingContent.slice(0, 200) : 'Content unavailable'}\`\`\``, inline: false }
                    );
                
                if (dmData.reasoning && dmData.reasoning.length > 0) {
                    embed.addFields({ 
                        name: '🧠 AI Detection Reason', 
                        value: dmData.reasoning.slice(0, 3).join('\n• ').slice(0, 1024), 
                        inline: false 
                    });
                }
                
                if (dmData.multiApiUsed) {
                    embed.addFields({ name: '🔄 Enhanced Detection', value: 'Multi-API Analysis', inline: true });
                }
                break;
                
            case 'delete':
                embed
                    .setColor(config.colors.warning)
                    .setTitle(`🗑️ Message Deleted - ${dmData.guildName}`)
                    .setDescription(`Your message was deleted by Enhanced Synthia v${config.aiVersion} multi-API intelligence system.`)
                    .addFields(
                        { name: '⚖️ Violation', value: violationRule.name, inline: true },
                        { name: '🌍 Language', value: dmData.originalLanguage || 'English', inline: true },
                        { name: '🔥 Threat Level', value: `${dmData.threatLevel}/10`, inline: true },
                        { name: '📝 Deleted Message', value: `\`\`\`${dmData.violatingContent ? dmData.violatingContent.slice(0, 200) : 'Content unavailable'}\`\`\``, inline: false }
                    );
                
                if (dmData.reasoning && dmData.reasoning.length > 0) {
                    embed.addFields({ 
                        name: '🧠 Why It Was Deleted', 
                        value: `• ${dmData.reasoning.slice(0, 3).join('\n• ')}`.slice(0, 1024), 
                        inline: false 
                    });
                }
                break;
                
            case 'mute':
                embed
                    .setColor(config.colors.error)
                    .setTitle(`🔇 Enhanced Temporary Mute - ${dmData.guildName}`)
                    .setDescription(`You have been muted by Enhanced Synthia v${config.aiVersion} multi-API intelligence system.`)
                    .addFields(
                        { name: '⚖️ Violation', value: violationRule.name, inline: true },
                        { name: '⏰ Duration', value: formatDuration(dmData.duration), inline: true },
                        { name: '🌍 Language', value: dmData.originalLanguage || 'English', inline: true },
                        { name: '🔥 Threat Level', value: `${dmData.threatLevel}/10`, inline: true },
                        { name: '📝 Violating Message', value: `\`\`\`${dmData.violatingContent ? dmData.violatingContent.slice(0, 200) : 'Content unavailable'}\`\`\``, inline: false }
                    );
                
                if (dmData.reasoning && dmData.reasoning.length > 0) {
                    embed.addFields({ 
                        name: '🧠 Violation Details', 
                        value: `• ${dmData.reasoning.slice(0, 3).join('\n• ')}`.slice(0, 1024), 
                        inline: false 
                    });
                }
                break;
                
            case 'ban':
                embed
                    .setColor(config.colors.error)
                    .setTitle(`🔨 Enhanced Permanent Ban - ${dmData.guildName}`)
                    .setDescription(`You have been permanently banned by Enhanced Synthia v${config.aiVersion} multi-API intelligence system.`)
                    .addFields(
                        { name: '⚖️ Violation', value: violationRule.name, inline: true },
                        { name: '🧠 AI Decision', value: 'Multi-API Enhanced', inline: true },
                        { name: '🌍 Language', value: dmData.originalLanguage || 'English', inline: true },
                        { name: '🔥 Threat Level', value: `${dmData.threatLevel}/10`, inline: true },
                        { name: '📝 Banned For Content', value: `\`\`\`${dmData.violatingContent ? dmData.violatingContent.slice(0, 200) : 'Content unavailable'}\`\`\``, inline: false }
                    );
                
                if (dmData.reasoning && dmData.reasoning.length > 0) {
                    embed.addFields({ 
                        name: '🚨 Ban Reason Details', 
                        value: `• ${dmData.reasoning.slice(0, 3).join('\n• ')}`.slice(0, 1024), 
                        inline: false 
                    });
                }
                break;
        }
        
        embed.addFields({
            name: '📝 Detailed Reason',
            value: dmData.reason,
            inline: false
        });
        
        // Add appeal information for serious actions
        if (dmData.action === 'ban' || dmData.action === 'mute') {
            embed.addFields({
                name: '📞 Appeal Process',
                value: 'If you believe this action was taken in error, please contact a server administrator.',
                inline: false
            });
        }
        
        await user.send({ embeds: [embed] });
        console.log(`📨 Sent enhanced ${dmData.action} notification to ${user.tag}`);
        
    } catch (error) {
        console.log(`❌ Could not DM user: ${error.message}`);
    }
}

// Utility function
function formatDuration(milliseconds) {
    if (milliseconds === 0) return 'Permanent';
    
    const days = Math.floor(milliseconds / (24 * 60 * 60 * 1000));
    const hours = Math.floor((milliseconds % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((milliseconds % (60 * 60 * 1000)) / (60 * 1000));
    
    if (days > 0) {
        return `${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
        return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
        return 'Less than 1 minute';
    }
}

module.exports = {
    violationTypes,
    userViolations,
    executeModerationAction,
    sendViolationDM,
    formatDuration
};
