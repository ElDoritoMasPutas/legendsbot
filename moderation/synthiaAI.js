// Enhanced Synthia AI Brain v9.0 - FIXED False Positive Issues
const fs = require('fs').promises;
const config = require('../config/config.js');

class EnhancedSynthiaAI {
    constructor(synthiaTranslator, discordLogger) {
        this.synthiaTranslator = synthiaTranslator;
        this.discordLogger = discordLogger;
        this.profiles = new Map();
        this.dataPath = 'data/enhanced_profiles.json';
        this.loadData();
    }

    async loadData() {
        try {
            await fs.mkdir('data', { recursive: true });
            const data = await fs.readFile(this.dataPath, 'utf8');
            const parsed = JSON.parse(data);
            this.profiles = new Map(parsed.profiles || []);
            console.log(`✅ Loaded ${this.profiles.size} enhanced profiles`);
        } catch (error) {
            console.log('📁 Creating fresh enhanced profiles...');
            await this.saveData();
        }
    }

    async saveData() {
        try {
            const data = {
                profiles: Array.from(this.profiles.entries()),
                version: '9.0',
                lastUpdated: Date.now(),
                multiApiEnabled: true,
                enhancedModeration: true
            };
            
            await fs.writeFile(this.dataPath, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('❌ Failed to save enhanced data:', error);
        }
    }

    // FIXED: Much more conservative analysis with better thresholds
    async analyzeMessage(content, author, channel, message) {
        const startTime = Date.now();
        
        const analysis = {
            threatLevel: 0,
            violationType: null,
            confidence: 0,
            reasoning: [],
            action: 'none',
            language: {
                detected: 'en',
                confidence: 100,
                original: content,
                translated: content,
                originalLanguage: 'English'
            },
            culturalContext: {},
            elongatedWords: [],
            toxicityScore: 0,
            processingTime: 0,
            multiApiUsed: false
        };

        try {
            // Skip analysis for very short messages or common phrases
            if (content.length < 3) {
                analysis.processingTime = Date.now() - startTime;
                return analysis;
            }

            // FIXED: Skip analysis for common gaming/trading terms
            const commonGameTerms = [
                'trade', 'trading', 'looking for', 'lf', 'offering', 'ft', 'for trade',
                'pokemon', 'shiny', 'legendary', 'giveaway', 'contest', 'battle',
                'gg', 'good game', 'wp', 'well played', 'gl', 'good luck'
            ];
            
            const lowerContent = content.toLowerCase();
            const isCommonGameTerm = commonGameTerms.some(term => lowerContent.includes(term));
            
            if (isCommonGameTerm && content.length < 50) {
                console.log(`⚪ Skipping analysis for common game term: "${content}"`);
                analysis.processingTime = Date.now() - startTime;
                return analysis;
            }

            // Enhanced language detection
            const detectedLang = this.synthiaTranslator.detectLanguage(content);
            analysis.language.detected = detectedLang;
            analysis.language.originalLanguage = this.synthiaTranslator.enhancedAPI.supportedLanguages.get(detectedLang) || 'Unknown';
            
            // Enhanced translation with multi-API support
            if (detectedLang !== 'en') {
                const translation = await this.synthiaTranslator.translateText(content, 'en', detectedLang);
                analysis.language.translated = translation.translatedText;
                analysis.language.confidence = translation.confidence;
                analysis.language.provider = translation.provider;
                analysis.language.processingTime = translation.processingTime;
                analysis.multiApiUsed = true;
                
                // Log translation
                await this.discordLogger.logTranslation(
                    message.guild,
                    content,
                    translation.translatedText,
                    analysis.language.originalLanguage,
                    translation.targetLanguage || 'English',
                    author,
                    translation.provider,
                    translation.processingTime
                );
            }
            
            // FIXED: Enhanced toxicity analysis with better logic
            const toxicityAnalysis = await this.synthiaTranslator.analyzeToxicityInLanguage(content, detectedLang);
            analysis.threatLevel = toxicityAnalysis.toxicityLevel;
            analysis.toxicityScore = toxicityAnalysis.toxicityLevel;
            analysis.elongatedWords = toxicityAnalysis.elongatedWords || [];
            
            // Cultural context analysis
            analysis.culturalContext = this.synthiaTranslator.analyzeCulturalContext(content, detectedLang);
            
            // FIXED: Only proceed if there's actual toxicity detected
            if (toxicityAnalysis.toxicityLevel > 0) {
                analysis.reasoning.push(`Toxicity detected in ${toxicityAnalysis.language}: Level ${toxicityAnalysis.toxicityLevel}/10`);
                
                if (toxicityAnalysis.matches.length > 0) {
                    analysis.reasoning.push(`Toxic patterns: ${toxicityAnalysis.matches.slice(0, 3).join(', ')}`);
                }
                
                if (toxicityAnalysis.elongatedWords.length > 0) {
                    analysis.reasoning.push(`Elongated words detected: ${toxicityAnalysis.elongatedWords.map(w => w.original).join(', ')}`);
                    // FIXED: Only minor penalty for elongated words
                    analysis.threatLevel += 0.5;
                }
                
                // FIXED: More specific scam detection
                let isScam = false;
                const scamIndicators = [
                    'free nitro click',
                    'discord gift click',
                    'dm me for free',
                    'guaranteed money',
                    'investment scam',
                    'crypto scam'
                ];
                
                for (const indicator of scamIndicators) {
                    if (lowerContent.includes(indicator)) {
                        analysis.threatLevel += 3; // Increased penalty for clear scam indicators
                        analysis.reasoning.push(`Scam indicator detected: ${indicator}`);
                        isScam = true;
                        break;
                    }
                }
                
                // FIXED: Get user profile for context
                const profile = this.getBehavioralProfile(author.id);
                profile.messageCount++;
                
                // FIXED: Much more conservative decision logic
                if (isScam || analysis.threatLevel >= config.moderationThresholds.ban) {
                    analysis.violationType = isScam ? 'SCAM' : 'SEVERE_TOXICITY';
                    analysis.action = 'ban';
                } else if (analysis.threatLevel >= config.moderationThresholds.mute && profile.riskScore >= 3) {
                    analysis.violationType = 'HARASSMENT';
                    analysis.action = 'mute';
                } else if (analysis.threatLevel >= config.moderationThresholds.delete) {
                    analysis.violationType = 'TOXIC_BEHAVIOR';
                    analysis.action = 'delete';
                } else if (analysis.threatLevel >= config.moderationThresholds.warn && profile.riskScore >= 2) {
                    analysis.violationType = 'DISRESPECTFUL';
                    analysis.action = 'warn';
                }
                
                // FIXED: Only update profile if action is taken
                if (analysis.action !== 'none') {
                    if (!profile.violations) profile.violations = [];
                    profile.violations.push({
                        timestamp: Date.now(),
                        threatLevel: analysis.threatLevel,
                        violationType: analysis.violationType,
                        language: detectedLang,
                        elongated: analysis.elongatedWords.length > 0,
                        content: content.slice(0, 100),
                        action: analysis.action,
                        multiApiUsed: analysis.multiApiUsed,
                        provider: analysis.language.provider,
                        isScam: isScam
                    });
                    
                    // FIXED: More conservative risk score updates
                    const riskIncrease = Math.ceil(analysis.threatLevel / 4); // Reduced risk accumulation
                    profile.riskScore = Math.min(10, (profile.riskScore || 0) + riskIncrease);
                    
                    if (!profile.languageHistory) profile.languageHistory = [];
                    profile.languageHistory.push({
                        language: detectedLang,
                        timestamp: Date.now(),
                        threatLevel: analysis.threatLevel
                    });
                    
                    if (analysis.multiApiUsed) {
                        profile.multiApiTranslations = (profile.multiApiTranslations || 0) + 1;
                    }

                    // FIXED: Enhanced logging with better details
                    console.log(`🚨 THREAT DETECTED - User: ${author.tag}`);
                    console.log(`   Content: "${content}"`);
                    console.log(`   Threat Level: ${analysis.threatLevel}/10`);
                    console.log(`   Thresholds: Warn(${config.moderationThresholds.warn}) Delete(${config.moderationThresholds.delete}) Mute(${config.moderationThresholds.mute}) Ban(${config.moderationThresholds.ban})`);
                    console.log(`   Violation Type: ${analysis.violationType}`);
                    console.log(`   Action: ${analysis.action}`);
                    console.log(`   User Risk Score: ${profile.riskScore}/10`);
                    console.log(`   Reasoning: ${analysis.reasoning.join(', ')}`);
                    console.log(`   Is Scam: ${isScam}`);
                } else {
                    // FIXED: Log when threat is detected but no action taken
                    console.log(`⚪ Low-level threat detected but no action taken - User: ${author.tag}`);
                    console.log(`   Content: "${content}"`);
                    console.log(`   Threat Level: ${analysis.threatLevel}/10 (below thresholds)`);
                    console.log(`   Required for action: Warn(${config.moderationThresholds.warn}+) with Risk(2+)`);
                }
            } else {
                // FIXED: Minimal logging for clean messages
                if (analysis.multiApiUsed && config.verboseLogging) {
                    console.log(`🌍 Clean message translated: ${detectedLang} → en | "${content.slice(0, 30)}..."`);
                }
            }
            
            // FIXED: More realistic confidence calculation
            analysis.confidence = Math.min(100, 60 + (analysis.threatLevel * 4) + (analysis.reasoning.length * 5));
            analysis.processingTime = Date.now() - startTime;
            
            // Save data periodically
            if (Math.random() < 0.05) { // Reduced frequency
                await this.saveData();
            }
            
            return analysis;

        } catch (error) {
            console.error('Enhanced Synthia analysis error:', error);
            analysis.processingTime = Date.now() - startTime;
            analysis.confidence = 0;
            analysis.reasoning.push('Analysis error occurred');
            return analysis;
        }
    }

    getBehavioralProfile(userId) {
        if (!this.profiles.has(userId)) {
            this.profiles.set(userId, {
                userId: userId,
                messageCount: 0,
                violations: [],
                riskScore: 0,
                languageHistory: [],
                multiApiTranslations: 0,
                createdAt: Date.now(),
                lastAnalysis: Date.now()
            });
        }
        const profile = this.profiles.get(userId);
        profile.lastAnalysis = Date.now();
        return profile;
    }

    getProfile(userId) {
        return this.profiles.get(userId) || null;
    }
}

module.exports = EnhancedSynthiaAI;