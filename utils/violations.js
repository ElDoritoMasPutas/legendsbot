// Enhanced Violation Types and Moderation Logic v9.0
const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const config = require('../config/config.js');

// FIXED: Enhanced violation types with better thresholds
const violationTypes = {
    DISRESPECTFUL: {
        name: 'Disrespectful Interaction',
        severity: 3,
        threshold: 4, // FIXED: Increased threshold
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
    HARASSMENT: {
        name: 'Harassment/Bullying/Hate Speech',
        severity: 7,
        threshold: 6, // FIXED: Reasonable threshold
        aiAnalysis: true,
        contextRequired: true,
        multiLanguage: true,
        escalation: [
            { action: 'mute', duration: 24 * 60 * 60 * 1000 },
            { action: 'mute', duration: 7 * 24 * 60 * 60 * 1000 },
            { action: 'ban', duration: 0 }
        ]
    },
    RACISM: {
        name: 'Racism/Discrimination',
        severity: 10,
        threshold: 8, // FIXED: High threshold for serious offenses
        aiAnalysis: true,
        contextRequired: false,
        multiLanguage: true,
        escalation: [
            { action: 'ban', duration: 0 }
        ]
    },
    SPAM: {
        name: 'Excessive Messaging/Flooding',
        severity: 4,
        threshold: 5, // FIXED: Increased threshold
        aiAnalysis: true,
        contextRequired: false,
        multiLanguage: false,
        escalation: [
            { action: 'warn', duration: 0 },
            { action: 'mute', duration: 60 * 60 * 1000 },
            { action: 'mute', duration: 24 * 60 * 60 * 1000 },
            { action: 'ban', duration: 0 }
        ]
    },
    TOXIC_BEHAVIOR: {
        name: 'Toxic Behavior Pattern',
        severity: 6,
        threshold: 5, // FIXED: Increased threshold
        aiAnalysis: true,
        contextRequired: true,
        multiLanguage: true,
        escalation: [
            { action: 'warn', duration: 0 },
            { action: 'mute', duration: 60 * 60 * 1000 },
            { action: 'mute', duration: 24 * 60 * 60 * 1000 },
            { action: 'ban', duration: 0 }
        ]
    },
    SCAM: {
        name: 'Scam/Fraud Content',
        severity: 8,
        threshold: 7, // FIXED: High threshold for scam detection
        aiAnalysis: true,
        contextRequired: false,
        multiLanguage: true,
        escalation: [
            { action: 'ban', duration: 0 }
        ]
    },
    SEVERE_TOXICITY: {
        name: 'Severe Toxic Content',
        severity: 9,
        threshold: 8, // FIXED: Very high threshold
        aiAnalysis: true,
        contextRequired: false,
        multiLanguage: true,
        escalation: [
            { action: 'ban', duration: 0 }
        ]
    }
};

// User violation tracking
const userViolations = new Map();

// FIXED: Enhanced moderation execution with better logic
async function executeModerationAction(message, synthiaAnalysis, serverLogger, discordLogger) {
    const member = message.member;
    const violationType = synthiaAnalysis.violationType;
    
    if (!violationType || !violationTypes[violationType]) {
        console.error('Invalid violation type:', violationType);
        return;
    }
    
    // FIXED: Check if threat level meets the threshold for the violation type
    const violationRule = violationTypes[violationType];
    if (synthiaAnalysis.threatLevel < violationRule.threshold) {
        console.log(`⚠️ Threat level ${synthiaAnalysis.threatLevel} below threshold ${violationRule.threshold} for ${violationType}`);
        return; // Don't take action if below threshold
    }
    
    try {
        const userId = message.author.id;
        const userHistory = userViolations.get(userId) || {};
        const violationCount = userHistory[violationType] || 0;
        
        userHistory[violationType] = violationCount + 1;
        userViolations.set(userId, userHistory);
        
        const punishment = violationRule.escalation[Math.min(violationCount, violationRule.escalation.length - 1)];
        
        let reason = `Enhanced Synthia v${config.aiVersion}: ${violationRule.name}`;
        
        if (synthiaAnalysis.language.detected !== 'en') {
            reason += ` | Language: ${synthiaAnalysis.language.originalLanguage}`;
            if (synthiaAnalysis.language.provider) {
                reason += ` | Provider: ${synthiaAnalysis.language.provider}`;
            }
        }
        
        if (synthiaAnalysis.elongatedWords.length > 0) {
            reason += ` | Elongated: ${synthiaAnalysis.elongatedWords.map(w => w.original).join(', ')}`;
        }
        
        console.log(`🛡️ Executing ${punishment.action} for ${member?.user.tag || message.author.tag} | Threat: ${synthiaAnalysis.threatLevel}/10 | Threshold: ${violationRule.threshold}`);
        
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
                        multiApiUsed: synthiaAnalysis.multiApiUsed
                    });
                    actionSuccessful = true;
                    console.log(`⚠️ Warned ${member?.user.tag || message.author.tag}`);
                } catch (error) {
                    actionError = error.message;
                    console.error(`❌ Failed to warn user: ${error.message}`);
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
                            multiApiUsed: synthiaAnalysis.multiApiUsed
                        });
                        actionSuccessful = true;
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
                            multiApiUsed: synthiaAnalysis.multiApiUsed
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
        
        // Delete message after action
        let messageDeleted = false;
        if (message.deletable && 
            message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            try {
                await message.delete();
                messageDeleted = true;
                console.log(`🗑️ Deleted violating message after ${punishment.action}`);
            } catch (error) {
                console.log(`⚠️ Could not delete message after ${punishment.action}: ${error.message}`);
            }
        }
        
        // Enhanced logging
        await discordLogger.logModeration(message.guild, punishment.action, message.author, reason, {
            'Action Status': actionSuccessful ? '✅ Successful' : `❌ Failed: ${actionError}`,
            'Message Deleted': messageDeleted ? '✅ Yes' : '❌ No',
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
        
    } catch (error) {
        console.error('❌ Enhanced moderation action failed:', error);
        
        await discordLogger.sendLog(message.guild, 'error', '❌ Enhanced Moderation Error', 
            `Failed to execute ${synthiaAnalysis.action} action: ${error.message}`);
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
                        { name: '🌍 Language', value: dmData.originalLanguage || 'English', inline: true }
                    );
                
                if (dmData.multiApiUsed) {
                    embed.addFields({ name: '🔄 Enhanced Detection', value: 'Multi-API Analysis', inline: true });
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
                        { name: '🌍 Language', value: dmData.originalLanguage || 'English', inline: true }
                    );
                break;
                
            case 'ban':
                embed
                    .setColor(config.colors.error)
                    .setTitle(`🔨 Enhanced Permanent Ban - ${dmData.guildName}`)
                    .setDescription(`You have been permanently banned by Enhanced Synthia v${config.aiVersion} multi-API intelligence system.`)
                    .addFields(
                        { name: '⚖️ Violation', value: violationRule.name, inline: true },
                        { name: '🧠 AI Decision', value: 'Multi-API Enhanced', inline: true },
                        { name: '🌍 Language', value: dmData.originalLanguage || 'English', inline: true }
                    );
                break;
        }
        
        embed.addFields({
            name: '📝 Detailed Reason',
            value: dmData.reason,
            inline: false
        });
        
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
    
    if (days > 0) {
        return `${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
        return 'Less than 1 hour';
    }
}

module.exports = {
    violationTypes,
    userViolations,
    executeModerationAction,
    sendViolationDM,
    formatDuration
};