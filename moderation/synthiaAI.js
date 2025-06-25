// Enhanced Synthia AI Brain v9.0 - FIXED Working Moderation - NO DUPLICATE VARIABLES
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

    // FIXED: Proper analysis that actually detects violations - NO DUPLICATE VARIABLES
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
            // Skip analysis for very short messages
            if (content.length < 2) {
                analysis.processingTime = Date.now() - startTime;
                return analysis;
            }

            // FIXED: Single lowerContent declaration used throughout
            const lowerContent = content.toLowerCase().trim();

            // FIXED: Only skip very basic gaming terms
            const basicGameTerms = ['gg', 'wp', 'gl hf', 'good game', 'well played'];
            if (basicGameTerms.includes(lowerContent) && content.length < 15) {
                analysis.processingTime = Date.now() - startTime;
                return analysis;
            }

            // FIXED: Comprehensive Pokemon content detection (check early)
            const pokemonFilePattern = /\.(pk[3-9]|pb[78]|pa[78]|pkm|3gpkm|ck3|bk4|rk4|sk2|xk3)(\s|$)/i;
            const isPokemonFile = pokemonFilePattern.test(content);
            
            // FIXED: Pokemon trading format detection (showdown sets, etc.)
            const pokemonTerms = [
                'shiny:', 'level:', 'ball:', 'ability:', 'nature:', 'evs:', 'ivs:', 'moves:', 'item:',
                'tera type:', 'hidden power:', 'happiness:', 'ot:', 'tid:', 'gigantamax:',
                'dusk ball', 'poke ball', 'ultra ball', 'master ball', 'beast ball', 'apricorn',
                'adamant', 'modest', 'jolly', 'timid', 'bold', 'impish', 'careful', 'calm',
                'hasty', 'naive', 'serious', 'hardy', 'lonely', 'brave', 'relaxed', 'quiet',
                'hp:', 'attack:', 'defense:', 'sp. atk:', 'sp. def:', 'speed:'
            ];
            
            const pokemonTermCount = pokemonTerms.filter(term => lowerContent.includes(term)).length;
            const isPokemonTrading = pokemonTermCount >= 2 || (lowerContent.includes('.trade') && pokemonTermCount >= 1);
            
            if (isPokemonFile || isPokemonTrading) {
                console.log(`🎮 Pokemon content detected - skipping analysis: "${content.slice(0, 50)}..." (${isPokemonFile ? 'file' : 'trading format'})`);
                analysis.processingTime = Date.now() - startTime;
                analysis.reasoning.push(isPokemonFile ? 'Pokemon file detected - whitelisted' : 'Pokemon trading format detected - whitelisted');
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
                
                // Use translated text for analysis if translation was successful
                if (!translation.error && translation.translatedText !== content) {
                    console.log(`🌍 Analyzing translated text: "${translation.translatedText}"`);
                }
            }
            
            // FIXED: Proper toxicity analysis using detected language
            let toxicityAnalysis;
            
            if (detectedLang !== 'en' && analysis.language.translated) {
                // For non-English: analyze original text in original language
                toxicityAnalysis = await this.synthiaTranslator.analyzeToxicityInLanguage(content, detectedLang);
                
                // If no toxicity found in original, also check translated text
                if (toxicityAnalysis.toxicityLevel === 0) {
                    const englishAnalysis = await this.synthiaTranslator.analyzeToxicityInLanguage(analysis.language.translated, 'en');
                    if (englishAnalysis.toxicityLevel > toxicityAnalysis.toxicityLevel) {
                        toxicityAnalysis = englishAnalysis;
                    }
                }
            } else {
                // For English or when no translation: analyze in detected language
                toxicityAnalysis = await this.synthiaTranslator.analyzeToxicityInLanguage(content, detectedLang);
            }
            
            analysis.threatLevel = toxicityAnalysis.toxicityLevel;
            analysis.toxicityScore = toxicityAnalysis.toxicityLevel;
            analysis.elongatedWords = toxicityAnalysis.elongatedWords || [];
            
            // FIXED: More specific scam detection (removed .trade since it's handled by Pokemon detection above)
            let isScam = false;
            const scamIndicators = [
                'free nitro', 'discord gift', 'free robux', 'click here free',
                'dm me for', 'guaranteed money', 'crypto scam', 'easy money'
            ];
            
            for (const indicator of scamIndicators) {
                if (lowerContent.includes(indicator)) {
                    analysis.threatLevel += 6;
                    analysis.reasoning.push(`Scam indicator: ${indicator}`);
                    isScam = true;
                    break;
                }
            }
            
            // FIXED: Toxicity detection
            if (toxicityAnalysis.toxicityLevel > 0) {
                analysis.reasoning.push(`Toxicity detected: Level ${toxicityAnalysis.toxicityLevel}/10`);
                
                if (toxicityAnalysis.matches && toxicityAnalysis.matches.length > 0) {
                    analysis.reasoning.push(`Toxic patterns: ${toxicityAnalysis.matches.slice(0, 3).join(', ')}`);
                }
            }
            
            // FIXED: Get user profile for context
            const profile = this.getBehavioralProfile(author.id);
            profile.messageCount++;
            
            // FIXED: Proper decision logic with working thresholds
            if (isScam && analysis.threatLevel >= 6) {
                analysis.violationType = 'SCAM';
                analysis.action = 'ban';
            } else if (analysis.threatLevel >= config.moderationThresholds.ban) {
                analysis.violationType = 'SEVERE_TOXICITY';
                analysis.action = 'ban';
            } else if (analysis.threatLevel >= config.moderationThresholds.mute) {
                analysis.violationType = 'HARASSMENT';
                analysis.action = 'mute';
            } else if (analysis.threatLevel >= config.moderationThresholds.delete) {
                analysis.violationType = 'TOXIC_BEHAVIOR';
                analysis.action = 'delete';
            } else if (analysis.threatLevel >= config.moderationThresholds.warn) {
                analysis.violationType = 'DISRESPECTFUL';
                analysis.action = 'warn';
            }
            
            // FIXED: Update profile when violations detected
            if (analysis.violationType) {
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
                
                // Risk score calculation
                const riskIncrease = Math.ceil(analysis.threatLevel / 3);
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

                // FIXED: Proper logging for violations
                console.log(`🚨 VIOLATION DETECTED - User: ${author.tag}`);
                console.log(`   Content: "${content}"`);
                console.log(`   Threat Level: ${analysis.threatLevel}/10`);
                console.log(`   Required Thresholds: Warn(${config.moderationThresholds.warn}) Delete(${config.moderationThresholds.delete}) Mute(${config.moderationThresholds.mute}) Ban(${config.moderationThresholds.ban})`);
                console.log(`   Violation Type: ${analysis.violationType}`);
                console.log(`   Action: ${analysis.action}`);
                console.log(`   User Risk Score: ${profile.riskScore}/10`);
                console.log(`   Reasoning: ${analysis.reasoning.join(', ')}`);
                console.log(`   Is Scam: ${isScam}`);
            } else if (analysis.threatLevel > 0) {
                console.log(`⚪ Low threat detected but no action - User: ${author.tag}`);
                console.log(`   Content: "${content}"`);
                console.log(`   Threat Level: ${analysis.threatLevel}/10 (below warn threshold ${config.moderationThresholds.warn})`);
            }
            
            // FIXED: Realistic confidence calculation
            analysis.confidence = Math.min(100, 50 + (analysis.threatLevel * 5) + (analysis.reasoning.length * 10));
            analysis.processingTime = Date.now() - startTime;
            
            // Save data periodically
            if (Math.random() < 0.1) {
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
