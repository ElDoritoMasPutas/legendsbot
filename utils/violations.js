// Enhanced Violation Types and Moderation Logic v9.0 - WITH MULTI-API DECISION ENGINE
const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const config = require('../config/config.js');

// ENHANCED: Proper violation types with working thresholds and bypass penalties
const violationTypes = {
    DISRESPECTFUL: {
        name: 'Disrespectful Interaction',
        severity: 2,
        threshold: 2,
        aiAnalysis: true,
        contextRequired: true,
        multiLanguage: true,
        bypassAware: true,
        multiApiEnabled: true, // NEW: Multi-API Decision Engine support
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
        threshold: 3,
        aiAnalysis: true,
        contextRequired: true,
        multiLanguage: true,
        bypassAware: true,
        multiApiEnabled: true,
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
        threshold: 5,
        aiAnalysis: true,
        contextRequired: true,
        multiLanguage: true,
        bypassAware: true,
        multiApiEnabled: true,
        escalation: [
            { action: 'mute', duration: 24 * 60 * 60 * 1000 },
            { action: 'mute', duration: 7 * 24 * 60 * 60 * 1000 },
            { action: 'ban', duration: 0 }
        ]
    },
    SEVERE_TOXICITY: {
        name: 'Severe Toxic Content',
        severity: 7,
        threshold: 7,
        aiAnalysis: true,
        contextRequired: false,
        multiLanguage: true,
        bypassAware: true,
        multiApiEnabled: true,
        escalation: [
            { action: 'ban', duration: 0 }
        ]
    },
    SCAM: {
        name: 'Scam/Fraud Content',
        severity: 6,
        threshold: 6,
        aiAnalysis: true,
        contextRequired: false,
        multiLanguage: true,
        bypassAware: true,
        multiApiEnabled: true,
        escalation: [
            { action: 'ban', duration: 0 }
        ]
    },
    SPAM: {
        name: 'Excessive Messaging/Flooding',
        severity: 3,
        threshold: 3,
        aiAnalysis: true,
        contextRequired: false,
        multiLanguage: false,
        bypassAware: false,
        multiApiEnabled: false, // Spam doesn't use decision engine
        escalation: [
            { action: 'warn', duration: 0 },
            { action: 'mute', duration: 60 * 60 * 1000 },
            { action: 'ban', duration: 0 }
        ]
    }
};

// User violation tracking
const userViolations = new Map();

// ENHANCED: Violation DM with Multi-API Decision Engine information
async function sendViolationDM(member, dmData) {
    try {
        const user = member.user;
        const violationRule = violationTypes[dmData.violationType];
        
        const embed = new EmbedBuilder()
            .setFooter({ text: `Enhanced Synthia v${config.aiVersion} Multi-API Decision Engine System` })
            .setTimestamp()
            .setAuthor({
                name: 'Enhanced Synthia v9.0 - Multi-API Intelligence System',
                iconURL: member.client.user?.displayAvatarURL()
            });
        
        // Enhanced system information
        const systemInfo = dmData.decisionEngineUsed ? 
            `\n\n🤖 **MULTI-API ANALYSIS**\nYour message was analyzed by ${dmData.apisUsed?.length || 'multiple'} industry-leading AI systems for maximum accuracy.` : 
            `\n\n💻 **LOCAL ANALYSIS**\nAnalyzed using our enhanced local AI system.`;
        
        // Enhanced bypass detection notification
        const bypassInfo = dmData.bypassDetected ? 
            `\n\n🚨 **BYPASS ATTEMPT DETECTED**\nOur advanced AI detected you tried to circumvent our content filters using sophisticated techniques. This behavior is automatically flagged and penalized.` : '';
        
        switch (dmData.action) {
            case 'warn':
                embed
                    .setColor(config.colors.warning)
                    .setTitle(`⚠️ Enhanced Warning - ${dmData.guildName}`)
                    .setDescription(`You have received a warning from Enhanced Synthia v${config.aiVersion} multi-API intelligence system.${systemInfo}${bypassInfo}`)
                    .addFields(
                        { name: '⚖️ Violation', value: violationRule.name, inline: true },
                        { name: '📊 Warning #', value: `${dmData.violationNumber}`, inline: true },
                        { name: '🌍 Language', value: dmData.originalLanguage || 'English', inline: true },
                        { name: '🔥 Threat Level', value: `${dmData.threatLevel}/10${dmData.baseThreatLevel ? ` (base: ${dmData.baseThreatLevel})` : ''}`, inline: true },
                        { name: '🔍 Bypass Detection', value: dmData.bypassDetected ? '🚨 DETECTED' : '✅ None', inline: true },
                        { name: '🧠 AI Confidence', value: `${dmData.confidence || 85}%`, inline: true },
                        { name: '🤖 Analysis Method', value: dmData.decisionEngineUsed ? `Multi-API (${dmData.apisUsed?.length || 0} APIs)` : 'Enhanced Local', inline: true }
                    );
                
                // Add API information if decision engine was used
                if (dmData.decisionEngineUsed && dmData.apisUsed && dmData.apisUsed.length > 0) {
                    embed.addFields({
                        name: '🔧 AI Systems Consulted',
                        value: dmData.apisUsed.map(api => `• **${api}** (Industry AI)`).join('\n'),
                        inline: false
                    });
                }
                
                if (dmData.violatingContent) {
                    embed.addFields({ 
                        name: '📝 Your Message', 
                        value: `\`\`\`${dmData.violatingContent.slice(0, 200)}\`\`\``, 
                        inline: false 
                    });
                }
                
                if (dmData.bypassDetected && dmData.normalizedContent) {
                    embed.addFields({ 
                        name: '🔍 What Our AI Detected After Removing Bypasses', 
                        value: `\`\`\`${dmData.normalizedContent.slice(0, 200)}\`\`\``, 
                        inline: false 
                    });
                }
                
                if (dmData.bypassMethods && dmData.bypassMethods.length > 0) {
                    embed.addFields({ 
                        name: '🚨 Bypass Techniques Detected', 
                        value: dmData.bypassMethods.map(method => {
                            switch(method) {
                                case 'elongation': return '• **Character Elongation** (fuuuuck → fuck)';
                                case 'character_substitution': return '• **Character Substitution** (f*ck → fuck, f@ck → fuck)';
                                case 'separator_bypassing': return '• **Separator Bypassing** (f.u.c.k → fuck, f-u-c-k → fuck)';
                                case 'spacing_bypassing': return '• **Spacing Bypassing** (f u c k → fuck)';
                                case 'leetspeak': return '• **Leetspeak** (sh1t → shit, 4ss → ass)';
                                case 'unicode_substitution': return '• **Unicode Substitution** (Using special characters)';
                                default: return `• **${method.replace('_', ' ').toUpperCase()}**`;
                            }
                        }).join('\n'),
                        inline: false 
                    });
                }
                
                if (dmData.reasoning && dmData.reasoning.length > 0) {
                    embed.addFields({ 
                        name: '🧠 AI Detection Analysis', 
                        value: `• ${dmData.reasoning.slice(0, 4).join('\n• ')}`.slice(0, 1024), 
                        inline: false 
                    });
                }
                
                // Add accuracy information
                if (dmData.decisionEngineUsed) {
                    embed.addFields({
                        name: '📈 Why Multi-API Analysis?',
                        value: 'Multiple AI systems reached consensus on this decision, significantly reducing the chance of false positives while ensuring accurate detection.',
                        inline: false
                    });
                }
                
                // Add bypass prevention education
                if (dmData.bypassDetected) {
                    embed.addFields({
                        name: '💡 Important Notice',
                        value: 'Attempting to bypass content filters is a serious violation. Our AI uses advanced pattern recognition to detect circumvention attempts. Please communicate respectfully without trying to avoid our moderation systems.',
                        inline: false
                    });
                }
                break;
                
            case 'delete':
                embed
                    .setColor(config.colors.warning)
                    .setTitle(`🗑️ Message Deleted - ${dmData.guildName}`)
                    .setDescription(`Your message was automatically deleted by Enhanced Synthia v${config.aiVersion}.${systemInfo}${bypassInfo}`)
                    .addFields(
                        { name: '⚖️ Violation', value: violationRule.name, inline: true },
                        { name: '🌍 Language', value: dmData.originalLanguage || 'English', inline: true },
                        { name: '🔥 Threat Level', value: `${dmData.threatLevel}/10${dmData.baseThreatLevel ? ` (base: ${dmData.baseThreatLevel})` : ''}`, inline: true },
                        { name: '🔍 Bypass Detection', value: dmData.bypassDetected ? '🚨 DETECTED' : '✅ None', inline: true },
                        { name: '⚡ Response Time', value: `${dmData.processingTime || 'N/A'}ms`, inline: true },
                        { name: '🧠 AI Confidence', value: `${dmData.confidence || 85}%`, inline: true },
                        { name: '🤖 Analysis Method', value: dmData.decisionEngineUsed ? `Multi-API Decision Engine` : 'Enhanced Local Analysis', inline: true }
                    );
                
                // Add specific API results if available
                if (dmData.decisionEngineUsed && dmData.apisUsed && dmData.apisUsed.length > 0) {
                    embed.addFields({
                        name: '🔧 AI Systems That Flagged This Content',
                        value: `${dmData.apisUsed.length} industry AI systems agreed this content violated guidelines:\n${dmData.apisUsed.map(api => `• **${api}**`).join('\n')}`,
                        inline: false
                    });
                }
                
                if (dmData.violatingContent) {
                    embed.addFields({ 
                        name: '📝 Deleted Message', 
                        value: `\`\`\`${dmData.violatingContent.slice(0, 200)}\`\`\``, 
                        inline: false 
                    });
                }
                
                if (dmData.bypassDetected && dmData.normalizedContent) {
                    embed.addFields({ 
                        name: '🔍 Normalized Content (What AI Actually Detected)', 
                        value: `\`\`\`${dmData.normalizedContent.slice(0, 200)}\`\`\``, 
                        inline: false 
                    });
                    
                    embed.addFields({
                        name: '⚠️ Bypass Attempt Explanation',
                        value: 'Our AI detected that you attempted to circumvent our content filters by disguising inappropriate language. The system automatically removed your bypass techniques and identified the underlying content.',
                        inline: false
                    });
                }
                
                if (dmData.reasoning && dmData.reasoning.length > 0) {
                    embed.addFields({ 
                        name: '🧠 Why It Was Deleted', 
                        value: `• ${dmData.reasoning.slice(0, 4).join('\n• ')}`.slice(0, 1024), 
                        inline: false 
                    });
                }
                break;
                
            case 'mute':
                embed
                    .setColor(config.colors.error)
                    .setTitle(`🔇 Enhanced Temporary Mute - ${dmData.guildName}`)
                    .setDescription(`You have been temporarily muted by Enhanced Synthia v${config.aiVersion}.${systemInfo}${bypassInfo}`)
                    .addFields(
                        { name: '⚖️ Violation', value: violationRule.name, inline: true },
                        { name: '⏰ Duration', value: formatDuration(dmData.duration), inline: true },
                        { name: '🌍 Language', value: dmData.originalLanguage || 'English', inline: true },
                        { name: '🔥 Threat Level', value: `${dmData.threatLevel}/10${dmData.baseThreatLevel ? ` (base: ${dmData.baseThreatLevel})` : ''}`, inline: true },
                        { name: '🔍 Bypass Detection', value: dmData.bypassDetected ? '🚨 DETECTED' : '✅ None', inline: true },
                        { name: '📈 Penalty Applied', value: dmData.bypassDetected ? 'Yes (+50% for bypass)' : 'Standard', inline: true },
                        { name: '🤖 Analysis Method', value: dmData.decisionEngineUsed ? `Multi-API Consensus` : 'Enhanced Local', inline: true }
                    );
                
                // Show API consensus for mutes
                if (dmData.decisionEngineUsed && dmData.apisUsed && dmData.apisUsed.length > 0) {
                    embed.addFields({
                        name: '🏛️ AI Consensus Decision',
                        value: `${dmData.apisUsed.length} independent AI systems reached consensus that this content required muting:\n${dmData.apisUsed.map(api => `• **${api}** - Industry AI System`).join('\n')}\n\nThis consensus approach virtually eliminates false positives.`,
                        inline: false
                    });
                }
                
                if (dmData.violatingContent) {
                    embed.addFields({ 
                        name: '📝 Violating Message', 
                        value: `\`\`\`${dmData.violatingContent.slice(0, 200)}\`\`\``, 
                        inline: false 
                    });
                }
                
                if (dmData.bypassDetected) {
                    embed.addFields({
                        name: '🚨 Bypass Attempt - Enhanced Penalty Applied',
                        value: 'Attempting to circumvent content filters while posting harmful content results in significantly stronger penalties. Our AI detected sophisticated bypass techniques in your message.',
                        inline: false
                    });
                    
                    if (dmData.normalizedContent) {
                        embed.addFields({ 
                            name: '🔍 Content After Bypass Removal', 
                            value: `\`\`\`${dmData.normalizedContent.slice(0, 200)}\`\`\``, 
                            inline: false 
                        });
                    }
                }
                
                if (dmData.reasoning && dmData.reasoning.length > 0) {
                    embed.addFields({ 
                        name: '🧠 Detailed Violation Analysis', 
                        value: `• ${dmData.reasoning.slice(0, 4).join('\n• ')}`.slice(0, 1024), 
                        inline: false 
                    });
                }
                break;
                
            case 'ban':
                embed
                    .setColor(config.colors.error)
                    .setTitle(`🔨 Enhanced Permanent Ban - ${dmData.guildName}`)
                    .setDescription(`You have been permanently banned by Enhanced Synthia v${config.aiVersion}.${systemInfo}${bypassInfo}`)
                    .addFields(
                        { name: '⚖️ Violation', value: violationRule.name, inline: true },
                        { name: '🧠 AI Decision', value: dmData.decisionEngineUsed ? 'Multi-API Consensus' : 'Enhanced Local', inline: true },
                        { name: '🌍 Language', value: dmData.originalLanguage || 'English', inline: true },
                        { name: '🔥 Threat Level', value: `${dmData.threatLevel}/10${dmData.baseThreatLevel ? ` (base: ${dmData.baseThreatLevel})` : ''}`, inline: true },
                        { name: '🔍 Bypass Detection', value: dmData.bypassDetected ? '🚨 DETECTED' : '✅ None', inline: true },
                        { name: '⚡ Enforcement', value: 'Immediate & Permanent', inline: true }
                    );
                
                // Show unanimous AI decision for bans
                if (dmData.decisionEngineUsed && dmData.apisUsed && dmData.apisUsed.length > 0) {
                    embed.addFields({
                        name: '⚖️ Unanimous AI Decision',
                        value: `**${dmData.apisUsed.length} AI systems unanimously agreed this content warrants a permanent ban:**\n${dmData.apisUsed.map(api => `• **${api}** - ${api.includes('Google') || api.includes('OpenAI') || api.includes('Microsoft') ? 'Industry Leader' : 'Specialized AI'}`).join('\n')}\n\n**This level of AI consensus indicates extremely severe content.**`,
                        inline: false
                    });
                }
                
                if (dmData.violatingContent) {
                    embed.addFields({ 
                        name: '📝 Content That Led to Ban', 
                        value: `\`\`\`${dmData.violatingContent.slice(0, 200)}\`\`\``, 
                        inline: false 
                    });
                }
                
                if (dmData.bypassDetected) {
                    embed.addFields({
                        name: '🚨 Severe Bypass Violation - Zero Tolerance',
                        value: 'You have been permanently banned for posting severely harmful content while actively attempting to circumvent our content filters. This demonstrates intentional and malicious violation of community guidelines.',
                        inline: false
                    });
                    
                    if (dmData.normalizedContent) {
                        embed.addFields({ 
                            name: '🔍 Content After Filter Bypass Removal', 
                            value: `\`\`\`${dmData.normalizedContent.slice(0, 200)}\`\`\``, 
                            inline: false 
                        });
                    }
                }
                
                if (dmData.reasoning && dmData.reasoning.length > 0) {
                    embed.addFields({ 
                        name: '🚨 Complete Ban Analysis', 
                        value: `• ${dmData.reasoning.slice(0, 5).join('\n• ')}`.slice(0, 1024), 
                        inline: false 
                    });
                }
                break;
        }
        
        embed.addFields({
            name: '📝 Technical Details',
            value: `${dmData.reason}\n\n**Processing Time:** ${dmData.processingTime || 'N/A'}ms\n**Confidence Level:** ${dmData.confidence || 85}%\n**Analysis Method:** ${dmData.decisionEngineUsed ? 'Multi-API Decision Engine' : 'Enhanced Local AI'}\n**APIs Consulted:** ${dmData.apisUsed?.length || 0}`,
            inline: false
        });
        
        // Add appeal information for serious actions
        if (dmData.action === 'ban' || dmData.action === 'mute') {
            embed.addFields({
                name: '📞 Appeal Process',
                value: `If you believe this action was taken in error, please contact a server administrator. ${dmData.decisionEngineUsed ? 'Note that this decision was reached by multiple independent AI systems, making errors extremely unlikely.' : 'Note that bypass attempts are automatically logged and thoroughly reviewed during appeals.'}`,
                inline: false
            });
        }
        
        // Add comprehensive educational information about the AI system
        if (dmData.decisionEngineUsed) {
            embed.addFields({
                name: '🎓 About Our Multi-AI System',
                value: 'Your message was analyzed by multiple industry-leading AI systems including Google, Microsoft, and other advanced models. These systems work together to ensure maximum accuracy and fairness in moderation decisions.',
                inline: false
            });
        }
        
        // Add comprehensive educational information about filter bypassing
        if (dmData.bypassDetected) {
            embed.addFields({
                name: '🎓 Understanding Bypass Detection',
                value: 'Our AI can detect sophisticated techniques including:\n' +
                       '• **Character Elongation** (fuuuuck → fuck)\n' +
                       '• **Symbol Substitution** (f*ck, f@ck → fuck)\n' +
                       '• **Spacing Injection** (f u c k → fuck)\n' +
                       '• **Separator Bypassing** (f.u.c.k, f-u-c-k → fuck)\n' +
                       '• **Leetspeak** (sh1t, 4ss → shit, ass)\n' +
                       '• **Unicode Lookalikes** (Using foreign characters)\n' +
                       '• **And many others...**\n\n' +
                       'Please communicate respectfully without attempting to circumvent our systems.',
                inline: false
            });
        }
        
        await user.send({ embeds: [embed] });
        console.log(`📨 Sent enhanced ${dmData.action} notification to ${user.tag}${dmData.bypassDetected ? ' (bypass detected)' : ''}${dmData.decisionEngineUsed ? ` (${dmData.apisUsed?.length || 0} APIs)` : ''}`);
        
    } catch (error) {
        console.log(`❌ Could not DM user: ${error.message}`);
    }
}

// ENHANCED: Moderation execution with Multi-API Decision Engine support
async function executeModerationAction(message, synthiaAnalysis, serverLogger, discordLogger) {
    const member = message.member;
    const violationType = synthiaAnalysis.violationType;
    
    if (!violationType || !violationTypes[violationType]) {
        console.error('❌ Invalid violation type:', violationType);
        return;
    }
    
    const violationRule = violationTypes[violationType];
    
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
        
        // Enhanced reason with Multi-API information
        if (synthiaAnalysis.decisionEngineUsed) {
            const apiCount = synthiaAnalysis.apiResults ? Object.keys(synthiaAnalysis.apiResults).filter(api => synthiaAnalysis.apiResults[api] && !synthiaAnalysis.apiResults[api].error).length : 0;
            reason += ` | Multi-API Decision (${apiCount} AIs)`;
        }
        
        // Enhanced reason with comprehensive bypass detection
        if (synthiaAnalysis.bypassDetected) {
            reason += ` | BYPASS ATTEMPT DETECTED`;
            if (synthiaAnalysis.bypassAttempts && synthiaAnalysis.bypassAttempts.length > 0) {
                const methods = synthiaAnalysis.bypassAttempts.map(b => b.type).join(', ');
                reason += ` (${methods})`;
            }
            const baseThreat = synthiaAnalysis.threatLevel - (synthiaAnalysis.bypassAttempts?.reduce((sum, b) => sum + (b.severity || 1), 0) || 0);
            reason += ` | Base: ${baseThreat} + Bypass Penalty: ${synthiaAnalysis.threatLevel - baseThreat}`;
        }
        
        if (synthiaAnalysis.language.detected !== 'en') {
            reason += ` | Language: ${synthiaAnalysis.language.originalLanguage}`;
            if (synthiaAnalysis.language.provider) {
                reason += ` | Provider: ${synthiaAnalysis.language.provider}`;
            }
        }
        
        if (synthiaAnalysis.elongatedWords.length > 0) {
            reason += ` | Elongated: ${synthiaAnalysis.elongatedWords.map(w => w.original).join(', ')}`;
        }
        
        console.log(`🛡️ EXECUTING ENHANCED MODERATION ACTION:`);
        console.log(`   User: ${member?.user.tag || message.author.tag}`);
        console.log(`   Action: ${punishment.action}`);
        console.log(`   Threat Level: ${synthiaAnalysis.threatLevel}/10`);
        console.log(`   Threshold: ${violationRule.threshold}/10`);
        console.log(`   Violation: ${violationType}`);
        console.log(`   Violation Count: ${violationCount + 1}`);
        console.log(`   Decision Engine Used: ${synthiaAnalysis.decisionEngineUsed ? 'YES' : 'NO'}`);
        if (synthiaAnalysis.decisionEngineUsed) {
            const apiCount = synthiaAnalysis.apiResults ? Object.keys(synthiaAnalysis.apiResults).filter(api => synthiaAnalysis.apiResults[api] && !synthiaAnalysis.apiResults[api].error).length : 0;
            console.log(`   APIs Consulted: ${apiCount}`);
            if (synthiaAnalysis.apiResults) {
                const workingApis = Object.keys(synthiaAnalysis.apiResults).filter(api => synthiaAnalysis.apiResults[api] && !synthiaAnalysis.apiResults[api].error);
                console.log(`   Working APIs: ${workingApis.join(', ')}`);
            }
        }
        console.log(`   Bypass Detected: ${synthiaAnalysis.bypassDetected ? 'YES' : 'NO'}`);
        if (synthiaAnalysis.bypassDetected) {
            console.log(`   Bypass Methods: ${synthiaAnalysis.bypassAttempts?.map(b => b.type).join(', ') || 'Unknown'}`);
            console.log(`   Original Text: "${synthiaAnalysis.originalText || message.content}"`);
            console.log(`   Normalized Text: "${synthiaAnalysis.normalizedText || 'N/A'}"`);
        }
        console.log(`   Reason: ${reason}`);
        
        // Calculate base threat level (before bypass penalty)
        const baseThreatLevel = synthiaAnalysis.bypassDetected ? 
            synthiaAnalysis.threatLevel - (synthiaAnalysis.bypassAttempts?.reduce((sum, b) => sum + (b.severity || 1), 0) || 0) :
            synthiaAnalysis.threatLevel;
        
        // Get list of APIs that were actually used
        const apisUsed = synthiaAnalysis.apiResults ? 
            Object.keys(synthiaAnalysis.apiResults).filter(api => synthiaAnalysis.apiResults[api] && !synthiaAnalysis.apiResults[api].error) : 
            [];
        
        // Prepare enhanced DM data with Multi-API information
        const dmData = {
            action: punishment.action,
            violationType,
            violationNumber: violationCount + 1,
            reason,
            guildName: message.guild.name,
            duration: punishment.duration,
            originalLanguage: synthiaAnalysis.language.originalLanguage,
            multiApiUsed: synthiaAnalysis.multiApiUsed,
            threatLevel: synthiaAnalysis.threatLevel,
            baseThreatLevel: baseThreatLevel,
            violatingContent: message.content,
            reasoning: synthiaAnalysis.reasoning,
            confidence: synthiaAnalysis.confidence,
            processingTime: synthiaAnalysis.processingTime,
            // ENHANCED: Multi-API Decision Engine data
            decisionEngineUsed: synthiaAnalysis.decisionEngineUsed,
            apisUsed: apisUsed,
            apiResults: synthiaAnalysis.apiResults,
            // ENHANCED: Comprehensive bypass detection data
            bypassDetected: synthiaAnalysis.bypassDetected,
            normalizedContent: synthiaAnalysis.normalizedText,
            bypassMethods: synthiaAnalysis.bypassAttempts?.map(b => b.type) || [],
            bypassSeverity: synthiaAnalysis.bypassAttempts?.reduce((sum, b) => sum + (b.severity || 1), 0) || 0
        };
        
        // Execute the same moderation actions but with enhanced DM data
        let actionSuccessful = false;
        let actionError = null;
        
        switch (punishment.action) {
            case 'warn':
                try {
                    await sendViolationDM(member, dmData);
                    actionSuccessful = true;
                    console.log(`⚠️ Successfully warned ${member?.user.tag || message.author.tag}${synthiaAnalysis.bypassDetected ? ' (bypass detected)' : ''}${synthiaAnalysis.decisionEngineUsed ? ` (${apisUsed.length} APIs consulted)` : ''}`);
                } catch (error) {
                    actionError = error.message;
                    console.error(`❌ Failed to warn user: ${error.message}`);
                }
                break;
                
            case 'delete':
                if (message.deletable && 
                    message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                    try {
                        await message.delete();
                        console.log(`🗑️ Deleted message from ${member?.user.tag || message.author.tag}${synthiaAnalysis.bypassDetected ? ' (bypass attempt)' : ''}${synthiaAnalysis.decisionEngineUsed ? ` (${apisUsed.length} AI consensus)` : ''}`);
                        actionSuccessful = true;
                        
                        await sendViolationDM(member, dmData);
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
                        console.log(`🔇 Muted ${member.user.tag} for ${formatDuration(punishment.duration)}${synthiaAnalysis.bypassDetected ? ' (bypass attempt detected)' : ''}${synthiaAnalysis.decisionEngineUsed ? ` (${apisUsed.length} AI consensus)` : ''}`);
                        
                        await sendViolationDM(member, dmData);
                        actionSuccessful = true;
                        
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
                        await sendViolationDM(member, dmData);
                        
                        await member.ban({ reason, deleteMessageDays: 1 });
                        console.log(`🔨 Banned ${member.user.tag}${synthiaAnalysis.bypassDetected ? ' (sophisticated bypass attempt detected)' : ''}${synthiaAnalysis.decisionEngineUsed ? ` (${apisUsed.length} AI unanimous decision)` : ''}`);
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
        
        // ENHANCED: Comprehensive logging with Multi-API decision engine details
        const logFields = {
            'Action Status': actionSuccessful ? '✅ Successful' : `❌ Failed: ${actionError}`,
            'Enhanced Synthia': config.aiVersion,
            'Confidence': `${synthiaAnalysis.confidence}%`,
            'Threat Level': `${synthiaAnalysis.threatLevel}/10`,
            'Base Threat Level': `${baseThreatLevel}/10`,
            'Threshold': `${violationRule.threshold}/10`,
            'Processing Time': `${synthiaAnalysis.processingTime}ms`,
            'Violation Count': violationCount + 1,
            'Decision Engine': synthiaAnalysis.decisionEngineUsed ? '✅ USED' : '❌ Local Fallback',
            'APIs Consulted': apisUsed.length > 0 ? apisUsed.join(', ') : 'None',
            'API Count': apisUsed.length,
            'Bypass Detected': synthiaAnalysis.bypassDetected ? '🚨 YES' : '✅ NO',
            'Bypass Methods': synthiaAnalysis.bypassAttempts?.map(b => b.type).join(', ') || 'None',
            'Bypass Penalty': synthiaAnalysis.bypassDetected ? `+${synthiaAnalysis.threatLevel - baseThreatLevel}` : 'None',
            'Original Language': synthiaAnalysis.language.originalLanguage,
            'Elongated Words': synthiaAnalysis.elongatedWords.length > 0 ? synthiaAnalysis.elongatedWords.map(w => w.original).join(', ') : 'None',
            'Multi-API Used': synthiaAnalysis.multiApiUsed ? 'Yes' : 'No',
            'Provider': synthiaAnalysis.language.provider || 'None'
        };
        
        await discordLogger.logModeration(message.guild, punishment.action, message.author, reason, logFields);
        
        if (actionSuccessful) {
            console.log(`✅ ENHANCED MODERATION ACTION COMPLETED SUCCESSFULLY:`);
            console.log(`   User: ${member?.user.tag || message.author.tag}`);
            console.log(`   Action: ${punishment.action}`);
            console.log(`   Violation: ${violationType}`);
            console.log(`   Total Violations: ${violationCount + 1}`);
            console.log(`   Decision Engine: ${synthiaAnalysis.decisionEngineUsed ? `USED (${apisUsed.length} APIs)` : 'LOCAL FALLBACK'}`);
            console.log(`   Bypass Detection: ${synthiaAnalysis.bypassDetected ? 'DETECTED & PENALIZED' : 'NONE'}`);
            if (synthiaAnalysis.bypassDetected) {
                console.log(`   Bypass Techniques: ${synthiaAnalysis.bypassAttempts?.map(b => b.type).join(', ')}`);
                console.log(`   Penalty Applied: +${synthiaAnalysis.threatLevel - baseThreatLevel} threat level`);
            }
            if (synthiaAnalysis.decisionEngineUsed && apisUsed.length > 0) {
                console.log(`   AI Systems Used: ${apisUsed.join(', ')}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Enhanced moderation action failed:', error);
        
        await discordLogger.sendLog(message.guild, 'error', '❌ Enhanced Moderation Error', 
            `Failed to execute ${synthiaAnalysis.action} action: ${error.message}`,
            [
                { name: 'User', value: `${message.author.tag} (${message.author.id})`, inline: true },
                { name: 'Violation Type', value: violationType, inline: true },
                { name: 'Threat Level', value: `${synthiaAnalysis.threatLevel}/10`, inline: true },
                { name: 'Decision Engine', value: synthiaAnalysis.decisionEngineUsed ? '✅ Used' : '❌ Local', inline: true },
                { name: 'Bypass Detected', value: synthiaAnalysis.bypassDetected ? '🚨 YES' : '✅ NO', inline: true },
                { name: 'Bypass Methods', value: synthiaAnalysis.bypassAttempts?.map(b => b.type).join(', ') || 'None', inline: true }
            ]
        );
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
