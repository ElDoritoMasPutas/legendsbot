const config = require('../config/enhanced-config.js');
const Logger = require('../logging/enhanced-logger.js');

class ThreatAnalyzer {
    constructor(synthiaAI, database) {
        this.synthiaAI = synthiaAI;
        this.database = database;
        this.logger = new Logger('ThreatAnalyzer');
        this.initialized = false;
        
        this.threatPatterns = new Map();
        this.suspiciousUsers = new Map();
        this.activeThreats = new Map();
        this.threatHistory = new Map();
        
        this.threatCategories = {
            VIOLENCE: {
                keywords: ['kill', 'murder', 'shoot', 'stab', 'hurt', 'harm', 'attack', 'destroy'],
                severity: 0.8,
                immediateAction: true
            },
            SELF_HARM: {
                keywords: ['suicide', 'kill myself', 'end it all', 'self harm', 'cut myself'],
                severity: 0.9,
                immediateAction: true,
                requiresSupport: true
            },
            HARASSMENT: {
                keywords: ['hate', 'kys', 'go die', 'worthless', 'pathetic', 'loser'],
                severity: 0.6,
                immediateAction: false
            },
            DOXXING: {
                keywords: ['address', 'phone number', 'real name', 'location', 'school'],
                patterns: [/\d{3}-\d{3}-\d{4}/, /\d{10}/, /\b\d{1,5}\s\w+\s(street|st|avenue|ave|road|rd|drive|dr|lane|ln|court|ct|circle|cir|boulevard|blvd)\b/i],
                severity: 0.7,
                immediateAction: true
            },
            MALWARE: {
                keywords: ['download', 'exe', 'virus', 'trojan', 'malware', 'hack', 'exploit'],
                patterns: [/\.(exe|bat|com|scr|pif|vbs|jar)$/i],
                severity: 0.8,
                immediateAction: true
            },
            SCAM: {
                keywords: ['free money', 'click here', 'limited time', 'act now', 'urgent', 'winner'],
                patterns: [/bit\.ly|tinyurl|goo\.gl|t\.co/i],
                severity: 0.5,
                immediateAction: false
            },
            EXTREMISM: {
                keywords: ['terrorist', 'bomb', 'explosion', 'radical', 'extremist'],
                severity: 0.95,
                immediateAction: true,
                alertAuthorities: true
            }
        };
        
        this.stats = {
            threatsDetected: 0,
            highSeverityThreats: 0,
            usersReported: 0,
            preventedIncidents: 0,
            falsePositives: 0
        };
    }

    async initialize() {
        try {
            this.logger.info('Initializing Threat Analyzer...');
            
            // Load threat patterns and historical data
            await this.loadThreatPatterns();
            await this.loadThreatHistory();
            
            // Initialize ML components for advanced threat detection
            await this.initializeThreatModels();
            
            // Start background monitoring processes
            this.startThreatMonitoring();
            
            this.initialized = true;
            this.logger.info('Threat Analyzer initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize Threat Analyzer:', error);
            throw error;
        }
    }

    async analyzeThreat(message, analysis) {
        try {
            const content = message.content.toLowerCase();
            const userId = message.author.id;
            const guildId = message.guild?.id;
            const timestamp = Date.now();
            
            let threatLevel = 0;
            const detectedThreats = [];
            const threatIndicators = [];
            
            // Analyze content for threat patterns
            for (const [category, config] of Object.entries(this.threatCategories)) {
                const categoryThreat = await this.analyzeCategory(content, category, config);
                if (categoryThreat.detected) {
                    detectedThreats.push({
                        category,
                        severity: categoryThreat.severity,
                        confidence: categoryThreat.confidence,
                        matches: categoryThreat.matches
                    });
                    
                    threatLevel = Math.max(threatLevel, categoryThreat.severity);
                    threatIndicators.push(`${category}: ${categoryThreat.matches.join(', ')}`);
                }
            }
            
            // Enhanced analysis using AI if available
            if (this.synthiaAI && analysis) {
                const aiThreatAnalysis = await this.analyzeWithAI(content, analysis);
                if (aiThreatAnalysis.threatDetected) {
                    threatLevel = Math.max(threatLevel, aiThreatAnalysis.severity);
                    detectedThreats.push({
                        category: 'AI_DETECTED',
                        severity: aiThreatAnalysis.severity,
                        confidence: aiThreatAnalysis.confidence,
                        reason: aiThreatAnalysis.reason
                    });
                    threatIndicators.push(`AI Detection: ${aiThreatAnalysis.reason}`);
                }
            }
            
            // Check user history for escalating behavior
            const userThreatHistory = await this.getUserThreatHistory(userId);
            if (userThreatHistory.length > 0) {
                const historyMultiplier = Math.min(1.5, 1 + (userThreatHistory.length * 0.1));
                threatLevel *= historyMultiplier;
                threatIndicators.push(`User history: ${userThreatHistory.length} previous incidents`);
            }
            
            // Context analysis
            const contextThreat = await this.analyzeContext(message, threatLevel);
            if (contextThreat.escalated) {
                threatLevel = Math.max(threatLevel, contextThreat.newLevel);
                threatIndicators.push(`Context escalation: ${contextThreat.reason}`);
            }
            
            // Record threat analysis
            const threatData = {
                userId,
                guildId,
                channelId: message.channel.id,
                messageId: message.id,
                content: message.content,
                threatLevel,
                detectedThreats,
                indicators: threatIndicators,
                timestamp,
                handled: false
            };
            
            if (threatLevel > 0.3) {
                await this.recordThreat(threatData);
                this.stats.threatsDetected++;
                
                if (threatLevel > 0.7) {
                    this.stats.highSeverityThreats++;
                    await this.handleHighSeverityThreat(threatData);
                }
            }
            
            return {
                threatLevel,
                detectedThreats,
                indicators: threatIndicators,
                requiresAction: threatLevel > 0.5,
                requiresImmediateAction: threatLevel > 0.7,
                threatData
            };
            
        } catch (error) {
            this.logger.error('Threat analysis failed:', error);
            return {
                threatLevel: 0,
                detectedThreats: [],
                indicators: ['Analysis error'],
                requiresAction: false,
                error: error.message
            };
        }
    }

    async analyzeCategory(content, category, categoryConfig) {
        try {
            const matches = [];
            let maxSeverity = 0;
            let totalConfidence = 0;
            let matchCount = 0;
            
            // Check keywords
            for (const keyword of categoryConfig.keywords) {
                if (content.includes(keyword.toLowerCase())) {
                    matches.push(keyword);
                    maxSeverity = Math.max(maxSeverity, categoryConfig.severity);
                    totalConfidence += 0.8;
                    matchCount++;
                }
            }
            
            // Check patterns if available
            if (categoryConfig.patterns) {
                for (const pattern of categoryConfig.patterns) {
                    const patternMatches = content.match(pattern);
                    if (patternMatches) {
                        matches.push(`pattern:${pattern.source}`);
                        maxSeverity = Math.max(maxSeverity, categoryConfig.severity);
                        totalConfidence += 0.9;
                        matchCount++;
                    }
                }
            }
            
            const avgConfidence = matchCount > 0 ? totalConfidence / matchCount : 0;
            
            return {
                detected: matches.length > 0,
                severity: maxSeverity,
                confidence: Math.min(1, avgConfidence),
                matches
            };
            
        } catch (error) {
            this.logger.error(`Category analysis failed for ${category}:`, error);
            return { detected: false, severity: 0, confidence: 0, matches: [] };
        }
    }

    async analyzeWithAI(content, analysis) {
        try {
            // Use existing analysis data to enhance threat detection
            let threatDetected = false;
            let severity = 0;
            let confidence = 0;
            let reason = '';
            
            // Check toxicity levels
            if (analysis.toxicity && analysis.toxicity.score > 0.8) {
                threatDetected = true;
                severity = Math.max(severity, 0.6 + (analysis.toxicity.score * 0.3));
                confidence = analysis.toxicity.confidence;
                reason += 'High toxicity detected. ';
            }
            
            // Check sentiment for extreme negativity
            if (analysis.sentiment && analysis.sentiment.score < -0.8) {
                threatDetected = true;
                severity = Math.max(severity, 0.4);
                reason += 'Extremely negative sentiment. ';
            }
            
            // Check intent for harmful purposes
            if (analysis.intent && analysis.intent.intent === 'threat') {
                threatDetected = true;
                severity = Math.max(severity, 0.7);
                confidence = Math.max(confidence, analysis.intent.confidence);
                reason += 'Threatening intent detected. ';
            }
            
            // Advanced AI analysis (if available)
            if (this.synthiaAI.initialized) {
                const aiAnalysis = await this.performAdvancedAIAnalysis(content);
                if (aiAnalysis.threatDetected) {
                    threatDetected = true;
                    severity = Math.max(severity, aiAnalysis.severity);
                    confidence = Math.max(confidence, aiAnalysis.confidence);
                    reason += aiAnalysis.reason;
                }
            }
            
            return {
                threatDetected,
                severity,
                confidence,
                reason: reason.trim()
            };
            
        } catch (error) {
            this.logger.error('AI threat analysis failed:', error);
            return { threatDetected: false, severity: 0, confidence: 0, reason: 'AI analysis error' };
        }
    }

    async performAdvancedAIAnalysis(content) {
        try {
            // Placeholder for advanced AI threat analysis
            // This would use specialized models for threat detection
            
            const threatKeywords = [
                'going to hurt', 'planning to', 'revenge', 'pay back', 'get back at',
                'make them suffer', 'teach them a lesson', 'show them'
            ];
            
            let severity = 0;
            let reason = '';
            
            for (const phrase of threatKeywords) {
                if (content.includes(phrase)) {
                    severity = Math.max(severity, 0.6);
                    reason += `Threatening language pattern: "${phrase}". `;
                }
            }
            
            // Check for escalation indicators
            const escalationWords = ['finally', 'enough', 'last time', 'fed up', 'can\'t take'];
            for (const word of escalationWords) {
                if (content.includes(word)) {
                    severity += 0.1;
                    reason += `Escalation indicator: "${word}". `;
                }
            }
            
            return {
                threatDetected: severity > 0,
                severity: Math.min(1, severity),
                confidence: severity > 0 ? 0.7 : 0,
                reason: reason.trim()
            };
            
        } catch (error) {
            this.logger.error('Advanced AI analysis failed:', error);
            return { threatDetected: false, severity: 0, confidence: 0, reason: 'Analysis error' };
        }
    }

    async analyzeContext(message, baseThreatLevel) {
        try {
            let escalated = false;
            let newLevel = baseThreatLevel;
            let reason = '';
            
            // Time-based escalation
            const hour = new Date().getHours();
            if (hour >= 22 || hour <= 6) { // Late night/early morning
                newLevel *= 1.2;
                escalated = true;
                reason += 'Posted during high-risk hours. ';
            }
            
            // Channel context
            const channelName = message.channel.name?.toLowerCase() || '';
            const sensitiveChannels = ['general', 'announcements', 'main'];
            if (sensitiveChannels.some(name => channelName.includes(name))) {
                newLevel *= 1.1;
                escalated = true;
                reason += 'Posted in high-visibility channel. ';
            }
            
            // User status
            if (message.member) {
                const joinedRecently = Date.now() - message.member.joinedAt.getTime() < 7 * 24 * 60 * 60 * 1000;
                if (joinedRecently) {
                    newLevel *= 1.3;
                    escalated = true;
                    reason += 'New member with concerning behavior. ';
                }
            }
            
            // Message characteristics
            if (message.content.length > 500) {
                newLevel *= 1.1;
                escalated = true;
                reason += 'Lengthy concerning message. ';
            }
            
            return {
                escalated: escalated && newLevel > baseThreatLevel,
                newLevel,
                reason: reason.trim()
            };
            
        } catch (error) {
            this.logger.error('Context analysis failed:', error);
            return { escalated: false, newLevel: baseThreatLevel, reason: 'Context analysis error' };
        }
    }

    async handleThreat(message, analysis) {
        try {
            const threatAnalysis = await this.analyzeThreat(message, analysis);
            
            if (!threatAnalysis.requiresAction) return;
            
            const { threatLevel, detectedThreats, threatData } = threatAnalysis;
            
            // Immediate actions for high-severity threats
            if (threatAnalysis.requiresImmediateAction) {
                await this.executeImmediateResponse(message, threatData);
            }
            
            // Notification and logging
            await this.notifyModerators(message, threatData);
            await this.logThreatDetection(threatData);
            
            // Update user monitoring
            await this.updateUserThreatProfile(message.author.id, threatData);
            
            return threatAnalysis;
            
        } catch (error) {
            this.logger.error('Threat handling failed:', error);
        }
    }

    async executeImmediateResponse(message, threatData) {
        try {
            // Delete the threatening message
            try {
                await message.delete();
                this.logger.info(`Deleted threatening message from user ${message.author.id}`);
            } catch (deleteError) {
                this.logger.error('Failed to delete threatening message:', deleteError);
            }
            
            // Apply appropriate moderation action based on threat level
            if (threatData.threatLevel > 0.9) {
                // Immediate ban for extreme threats
                await this.requestEmergencyBan(message, threatData);
            } else if (threatData.threatLevel > 0.7) {
                // Timeout for high threats
                await this.requestEmergencyTimeout(message, threatData);
            }
            
            // Check if authorities should be alerted
            const requiresAuthorityAlert = threatData.detectedThreats.some(threat => 
                this.threatCategories[threat.category]?.alertAuthorities
            );
            
            if (requiresAuthorityAlert) {
                await this.alertAuthorities(threatData);
            }
            
            threatData.handled = true;
            this.stats.preventedIncidents++;
            
        } catch (error) {
            this.logger.error('Immediate response execution failed:', error);
        }
    }

    async requestEmergencyBan(message, threatData) {
        try {
            if (message.guild && message.member) {
                await message.member.ban({
                    reason: `Emergency ban: High threat level (${Math.round(threatData.threatLevel * 100)}%)`
                });
                
                this.logger.logSecurityEvent(
                    'EMERGENCY_BAN',
                    'high',
                    {
                        userId: message.author.id,
                        guildId: message.guild.id,
                        threatLevel: threatData.threatLevel,
                        threats: threatData.detectedThreats
                    }
                );
            }
        } catch (error) {
            this.logger.error('Emergency ban failed:', error);
        }
    }

    async requestEmergencyTimeout(message, threatData) {
        try {
            if (message.guild && message.member) {
                const timeoutDuration = 24 * 60 * 60 * 1000; // 24 hours
                await message.member.timeout(timeoutDuration, 
                    `Emergency timeout: Threat level ${Math.round(threatData.threatLevel * 100)}%`
                );
                
                this.logger.logSecurityEvent(
                    'EMERGENCY_TIMEOUT',
                    'medium',
                    {
                        userId: message.author.id,
                        guildId: message.guild.id,
                        duration: timeoutDuration,
                        threatLevel: threatData.threatLevel
                    }
                );
            }
        } catch (error) {
            this.logger.error('Emergency timeout failed:', error);
        }
    }

    async notifyModerators(message, threatData) {
        try {
            // Find moderation log channel
            const guild = message.guild;
            const logChannel = guild.channels.cache.find(channel => 
                channel.name.includes('mod') && channel.name.includes('log')
            );
            
            if (logChannel) {
                const embed = {
                    color: threatData.threatLevel > 0.7 ? 0xff0000 : 0xff6600,
                    title: '🚨 Threat Detected',
                    fields: [
                        { name: 'User', value: `${message.author.tag} (${message.author.id})`, inline: true },
                        { name: 'Threat Level', value: `${Math.round(threatData.threatLevel * 100)}%`, inline: true },
                        { name: 'Channel', value: message.channel.name, inline: true },
                        { name: 'Detected Threats', value: threatData.detectedThreats.map(t => t.category).join(', '), inline: false },
                        { name: 'Message Content', value: message.content.substring(0, 1000), inline: false }
                    ],
                    timestamp: new Date().toISOString()
                };
                
                await logChannel.send({ embeds: [embed] });
            }
            
        } catch (error) {
            this.logger.error('Moderator notification failed:', error);
        }
    }

    async alertAuthorities(threatData) {
        try {
            // Log critical threat for potential law enforcement reporting
            this.logger.logSecurityEvent(
                'AUTHORITY_ALERT_REQUIRED',
                'high',
                {
                    userId: threatData.userId,
                    guildId: threatData.guildId,
                    threatLevel: threatData.threatLevel,
                    threats: threatData.detectedThreats,
                    content: threatData.content,
                    timestamp: threatData.timestamp
                }
            );
            
            // In a real implementation, this might:
            // - Send alerts to server administrators
            // - Create tickets in administrative systems
            // - Generate reports for law enforcement
            
        } catch (error) {
            this.logger.error('Authority alert failed:', error);
        }
    }

    async recordThreat(threatData) {
        try {
            // Store in database
            await this.database.logAnalyticsEvent('threat_detected', threatData, threatData.userId, threatData.guildId);
            
            // Cache for quick access
            const threatId = `${threatData.userId}_${threatData.timestamp}`;
            this.activeThreats.set(threatId, threatData);
            
            // Update threat history
            if (!this.threatHistory.has(threatData.userId)) {
                this.threatHistory.set(threatData.userId, []);
            }
            this.threatHistory.get(threatData.userId).push(threatData);
            
        } catch (error) {
            this.logger.error('Failed to record threat:', error);
        }
    }

    async getUserThreatHistory(userId) {
        if (this.threatHistory.has(userId)) {
            return this.threatHistory.get(userId);
        }
        
        try {
            // Load from database
            const events = await this.database.models.AnalyticsEvent.findAll({
                where: {
                    userId,
                    eventType: 'threat_detected'
                },
                order: [['createdAt', 'DESC']],
                limit: 10
            });
            
            const history = events.map(event => event.eventData);
            this.threatHistory.set(userId, history);
            
            return history;
            
        } catch (error) {
            this.logger.error('Failed to get user threat history:', error);
            return [];
        }
    }

    async updateUserThreatProfile(userId, threatData) {
        try {
            if (!this.suspiciousUsers.has(userId)) {
                this.suspiciousUsers.set(userId, {
                    userId,
                    firstIncident: Date.now(),
                    threatCount: 0,
                    maxThreatLevel: 0,
                    categories: new Set()
                });
            }
            
            const profile = this.suspiciousUsers.get(userId);
            profile.threatCount++;
            profile.maxThreatLevel = Math.max(profile.maxThreatLevel, threatData.threatLevel);
            profile.lastIncident = Date.now();
            
            for (const threat of threatData.detectedThreats) {
                profile.categories.add(threat.category);
            }
            
            // Flag as high-risk user if multiple incidents
            if (profile.threatCount >= 3 || profile.maxThreatLevel > 0.8) {
                profile.highRisk = true;
                this.stats.usersReported++;
            }
            
        } catch (error) {
            this.logger.error('Failed to update user threat profile:', error);
        }
    }

    async monitorThreats() {
        try {
            // Check for escalating patterns
            const now = Date.now();
            const oneHourAgo = now - 3600000;
            
            for (const [userId, profile] of this.suspiciousUsers) {
                if (profile.lastIncident > oneHourAgo && profile.threatCount >= 2) {
                    await this.escalateUserThreat(userId, profile);
                }
            }
            
            // Clean up old threats
            for (const [threatId, threat] of this.activeThreats) {
                if (now - threat.timestamp > 86400000) { // 24 hours
                    this.activeThreats.delete(threatId);
                }
            }
            
        } catch (error) {
            this.logger.error('Threat monitoring failed:', error);
        }
    }

    async escalateUserThreat(userId, profile) {
        try {
            this.logger.logSecurityEvent(
                'THREAT_ESCALATION',
                'high',
                {
                    userId,
                    threatCount: profile.threatCount,
                    maxThreatLevel: profile.maxThreatLevel,
                    categories: Array.from(profile.categories),
                    timespan: Date.now() - profile.firstIncident
                }
            );
            
            // Additional monitoring or actions could be implemented here
            
        } catch (error) {
            this.logger.error('Threat escalation failed:', error);
        }
    }

    async loadThreatPatterns() {
        try {
            // Load custom threat patterns from database or configuration
            this.logger.debug('Threat patterns loaded');
        } catch (error) {
            this.logger.error('Failed to load threat patterns:', error);
        }
    }

    async loadThreatHistory() {
        try {
            // Load recent threat history from database
            const recentEvents = await this.database.models.AnalyticsEvent.findAll({
                where: {
                    eventType: 'threat_detected',
                    createdAt: {
                        [this.database.sequelize.Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    }
                }
            });
            
            for (const event of recentEvents) {
                const threatData = event.eventData;
                if (!this.threatHistory.has(threatData.userId)) {
                    this.threatHistory.set(threatData.userId, []);
                }
                this.threatHistory.get(threatData.userId).push(threatData);
            }
            
            this.logger.info(`Loaded ${recentEvents.length} recent threat events`);
            
        } catch (error) {
            this.logger.error('Failed to load threat history:', error);
        }
    }

    async initializeThreatModels() {
        try {
            // Initialize ML models for threat detection
            this.logger.debug('Threat detection models initialized');
        } catch (error) {
            this.logger.error('Failed to initialize threat models:', error);
        }
    }

    startThreatMonitoring() {
        // Monitor threats every 5 minutes
        setInterval(() => {
            this.monitorThreats();
        }, 300000);
    }

    async logThreatDetection(threatData) {
        this.logger.logSecurityEvent(
            'THREAT_DETECTED',
            threatData.threatLevel > 0.7 ? 'high' : 'medium',
            {
                userId: threatData.userId,
                guildId: threatData.guildId,
                threatLevel: threatData.threatLevel,
                categories: threatData.detectedThreats.map(t => t.category),
                indicators: threatData.indicators
            }
        );
    }

    getStats() {
        return {
            ...this.stats,
            activeThreats: this.activeThreats.size,
            suspiciousUsers: this.suspiciousUsers.size,
            threatCategories: Object.keys(this.threatCategories).length,
            initialized: this.initialized
        };
    }

    isInitialized() {
        return this.initialized;
    }
}

module.exports = ThreatAnalyzer;