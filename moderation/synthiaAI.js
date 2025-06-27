// Enhanced Synthia AI Brain v9.0 - COMPLETE FIXED FILE
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
            console.log(`✅ Loaded ${this.profiles.size} enhanced profiles with Pokemon-aware bypass detection`);
        } catch (error) {
            console.log('📁 Creating fresh enhanced profiles with Pokemon-aware bypass detection...');
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
                enhancedModeration: true,
                bypassDetectionEnabled: true,
                pokemonAware: true
            };
            
            await fs.writeFile(this.dataPath, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('❌ Failed to save enhanced data:', error);
        }
    }

    // COMPREHENSIVE: Pokemon content detection - FIXED FOR .me AND .mysteryegg
    isPokemonRelatedContent(text) {
        const lowerContent = text.toLowerCase().trim();
        
        // 1. Pokemon file extensions
        const pokemonFilePattern = /\.(pk[3-9]|pb[78]|pa[78]|pkm|3gpkm|ck3|bk4|rk4|sk2|xk3)(\s|$)/i;
        if (pokemonFilePattern.test(text)) {
            return true;
        }
        
        // 2. Pokemon trading codes (.trade followed by numbers)
        const tradingCodePattern = /\.trade\s+\d{4,8}/i;
        if (tradingCodePattern.test(text)) {
            return true;
        }
        
        // 3. Pokemon mystery egg and .me commands (.me or .mysteryegg followed by numbers)
        const meCommandPattern = /\.me\s+\d{4,8}/i;
        const mysteryeggPattern = /\.mysteryegg\s+\d{4,8}/i;
        if (meCommandPattern.test(text) || mysteryeggPattern.test(text)) {
            return true;
        }
        
        // 4. Pokemon battle team commands
        if (lowerContent.includes('.bt ') || lowerContent.includes('.pokepaste')) {
            return true;
        }
        
        // 5. Pokemon stat terminology
        const pokemonTerms = [
            'shiny:', 'level:', 'ball:', 'ability:', 'nature:', 'evs:', 'ivs:', 'moves:', 'item:',
            'tera type:', 'hidden power:', 'happiness:', 'ot:', 'tid:', 'gigantamax:',
            'metlocation=', 'dusk ball', 'poke ball', 'ultra ball', 'master ball', 'beast ball',
            'adamant', 'modest', 'jolly', 'timid', 'bold', 'impish', 'careful', 'calm',
            'hasty', 'naive', 'serious', 'hardy', 'lonely', 'brave', 'relaxed', 'quiet',
            'hp:', 'attack:', 'defense:', 'sp. atk:', 'sp. def:', 'speed:', '.me', '.mysteryegg'
        ];
        
        const pokemonTermCount = pokemonTerms.filter(term => lowerContent.includes(term)).length;
        
        // 6. Common Pokemon names
        const commonPokemonNames = [
            'charizard', 'pikachu', 'mewtwo', 'mew', 'rayquaza', 'arceus', 'dialga', 'palkia',
            'giratina', 'kyogre', 'groudon', 'lugia', 'ho-oh', 'celebi', 'jirachi', 'deoxys',
            'darkrai', 'shaymin', 'victini', 'keldeo', 'meloetta', 'genesect', 'diancie',
            'hoopa', 'volcanion', 'magearna', 'marshadow', 'zeraora', 'meltan', 'melmetal',
            'zarude', 'calyrex', 'regidrago', 'regieleki', 'glastrier', 'spectrier',
            'eevee', 'vaporeon', 'jolteon', 'flareon', 'espeon', 'umbreon', 'leafeon',
            'glaceon', 'sylveon', 'lucario', 'garchomp', 'dragapult', 'mimikyu', 'toxapex',
            'ferrothorn', 'rotom', 'landorus', 'thundurus', 'tornadus', 'reshiram', 'zekrom',
            'kyurem', 'xerneas', 'yveltal', 'zygarde', 'solgaleo', 'lunala', 'necrozma',
            'zacian', 'zamazenta', 'eternatus', 'koraidon', 'miraidon', 'gimmighoul', 'gholdengo'
        ];
        
        const pokemonNameCount = commonPokemonNames.filter(name => lowerContent.includes(name)).length;
        
        // 7. Competitive Pokemon formats
        const competitiveTerms = [
            'ou', 'uu', 'ru', 'nu', 'pu', 'ubers', 'ag', 'vgc', 'bss', 'doubles',
            'smogon', 'showdown', 'teambuilder', 'tier', 'ban list', 'usage stats'
        ];
        const competitiveTermCount = competitiveTerms.filter(term => lowerContent.includes(term)).length;
        
        // COMPREHENSIVE: Multiple detection criteria - FIXED TO INCLUDE .me AND .mysteryegg
        return (
            pokemonTermCount >= 2 || // Has Pokemon stats/terms
            (lowerContent.includes('.trade') && pokemonTermCount >= 1) || // .trade with Pokemon terms
            (lowerContent.includes('.trade') && pokemonNameCount >= 1) || // .trade with Pokemon names
            (lowerContent.includes('.trade') && competitiveTermCount >= 1) || // .trade with competitive terms
            (lowerContent.includes('.me') && pokemonTermCount >= 1) || // .me with Pokemon terms
            (lowerContent.includes('.me') && pokemonNameCount >= 1) || // .me with Pokemon names
            (lowerContent.includes('.mysteryegg') && pokemonTermCount >= 1) || // .mysteryegg with Pokemon terms
            (lowerContent.includes('.mysteryegg') && pokemonNameCount >= 1) || // .mysteryegg with Pokemon names
            (lowerContent.includes('.bt') && pokemonTermCount >= 1) || // Battle team command
            (lowerContent.includes('.pokepaste') && lowerContent.includes('pokepast.es')) // Pokepaste links
        );
    }

    // ENHANCED: Complete analysis with comprehensive Pokemon-aware bypass detection
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
            bypassAttempts: [],
            bypassDetected: false,
            normalizedText: null,
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

            const lowerContent = content.toLowerCase().trim();

            // Skip very basic gaming terms
            const basicGameTerms = ['gg', 'wp', 'gl hf', 'good game', 'well played'];
            if (basicGameTerms.includes(lowerContent) && content.length < 15) {
                analysis.processingTime = Date.now() - startTime;
                return analysis;
            }

            // COMPREHENSIVE: Pokemon content detection - FIRST PRIORITY
            if (this.isPokemonRelatedContent(content)) {
                console.log(`🎮 POKEMON CONTENT DETECTED - skipping all analysis: "${content.slice(0, 50)}..."`);
                
                // Determine specific reason
                let reason = 'Pokemon content detected - whitelisted';
                if (/\.(pk[3-9]|pb[78]|pa[78]|pkm|3gpkm|ck3|bk4|rk4|sk2|xk3)(\s|$)/i.test(content)) {
                    reason = 'Pokemon file detected - whitelisted';
                } else if (/\.trade\s+\d{4,8}/i.test(content)) {
                    reason = 'Pokemon trading code detected - whitelisted';
                } else if (/\.me\s+\d{4,8}/i.test(content)) {
                    reason = 'Pokemon .me command detected - whitelisted';
                } else if (/\.mysteryegg\s+\d{4,8}/i.test(content)) {
                    reason = 'Pokemon .mysteryegg command detected - whitelisted';
                } else if (content.toLowerCase().includes('.bt ')) {
                    reason = 'Pokemon battle team detected - whitelisted';
                } else if (content.toLowerCase().includes('.pokepaste')) {
                    reason = 'Pokemon paste link detected - whitelisted';
                }
                
                analysis.processingTime = Date.now() - startTime;
                analysis.reasoning.push(reason);
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
                
                if (!translation.error && translation.translatedText !== content) {
                    console.log(`🌍 Analyzing translated text: "${translation.translatedText}"`);
                }
            }
            
            // ENHANCED: Comprehensive toxicity analysis with Pokemon-aware bypass detection
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
            
            // ENHANCED: Extract bypass detection information
            analysis.threatLevel = toxicityAnalysis.toxicityLevel;
            analysis.toxicityScore = toxicityAnalysis.toxicityLevel;
            analysis.elongatedWords = toxicityAnalysis.elongatedWords || [];
            analysis.bypassAttempts = toxicityAnalysis.bypassAttempts || [];
            analysis.bypassDetected = toxicityAnalysis.bypassDetected || false;
            analysis.normalizedText = toxicityAnalysis.normalizedText || null;
            
            // Enhanced reasoning with bypass information
            if (toxicityAnalysis.toxicityLevel > 0) {
                analysis.reasoning.push(`Toxicity detected: Level ${toxicityAnalysis.toxicityLevel}/10`);
                
                if (toxicityAnalysis.matches && toxicityAnalysis.matches.length > 0) {
                    analysis.reasoning.push(`Toxic patterns: ${toxicityAnalysis.matches.slice(0, 3).join(', ')}`);
                }
                
                // Enhanced bypass reasoning
                if (analysis.bypassDetected) {
                    analysis.reasoning.push(`BYPASS ATTEMPT DETECTED: User attempted to circumvent filters`);
                    
                    if (analysis.bypassAttempts.length > 0) {
                        const bypassTypes = analysis.bypassAttempts.map(b => b.type).join(', ');
                        analysis.reasoning.push(`Bypass methods: ${bypassTypes}`);
                    }
                    
                    if (toxicityAnalysis.originalText && toxicityAnalysis.normalizedText) {
                        analysis.reasoning.push(`Original: "${toxicityAnalysis.originalText}" → Normalized: "${toxicityAnalysis.normalizedText}"`);
                    }
                }
            }
            
            // Get user profile for context
            const profile = this.getBehavioralProfile(author.id);
            profile.messageCount++;
            
            // FIXED: Enhanced decision logic with proper bypass penalty application
            let baseThreatLevel = analysis.threatLevel;
            let actualContentDetected = baseThreatLevel > 0; // Check if any actual harmful content was found
            
            // CRITICAL FIX: Only apply bypass penalties when harmful content is actually detected
            if (analysis.bypassDetected && analysis.bypassAttempts.length > 0) {
                if (actualContentDetected) {
                    // PENALTY: Harmful content + bypass attempts = serious violation
                    const bypassPenalty = analysis.bypassAttempts.reduce((sum, attempt) => sum + (attempt.severity || 1), 0);
                    analysis.threatLevel += bypassPenalty;
                    analysis.reasoning.push(`Bypass penalty applied to harmful content: +${bypassPenalty} (${analysis.bypassAttempts.length} techniques)`);
                    
                    console.log(`🚨 HARMFUL CONTENT + BYPASS DETECTED: ${baseThreatLevel} → ${analysis.threatLevel} (+${bypassPenalty})`);
                } else {
                    // NO PENALTY: Bypass patterns without harmful content = normal conversation
                    // Examples: "helloooo!!!", "wooooow", "yesssss" should not be penalized
                    analysis.reasoning.push(`Bypass patterns detected but no harmful content - no penalty applied`);
                    
                    console.log(`✅ BYPASS PATTERNS IN NORMAL CONVERSATION: "${content}" - NO PENALTY APPLIED`);
                }
            }
            
            // Enhanced scam detection with Pokemon awareness
            let isScam = false;
            const scamIndicators = [
                'free nitro', 'discord gift', 'free robux', 'click here free',
                'dm me for', 'guaranteed money', 'crypto scam', 'easy money'
            ];
            
            // Check both original and normalized text for scams
            const textToCheckForScams = analysis.bypassDetected ? 
                [lowerContent, analysis.normalizedText?.toLowerCase() || lowerContent] : 
                [lowerContent];
                
            for (const textVariant of textToCheckForScams) {
                for (const indicator of scamIndicators) {
                    if (textVariant.includes(indicator)) {
                        analysis.threatLevel += 6;
                        analysis.reasoning.push(`Scam indicator: ${indicator}`);
                        if (textVariant !== lowerContent) {
                            analysis.reasoning.push(`Scam detected after bypass normalization`);
                        }
                        isScam = true;
                        actualContentDetected = true; // Scam counts as harmful content
                        break;
                    }
                }
                if (isScam) break;
            }
            
            // FIXED: Enhanced .trade/.me/.mysteryegg scam detection with comprehensive Pokemon protection
            if (lowerContent.includes('.trade') || lowerContent.includes('.me') || lowerContent.includes('.mysteryegg') || 
                (analysis.normalizedText && (analysis.normalizedText.toLowerCase().includes('.trade') || 
                analysis.normalizedText.toLowerCase().includes('.me') || analysis.normalizedText.toLowerCase().includes('.mysteryegg')))) {
                
                // Only flag if it has suspicious context AND is definitely not Pokemon trading
                const suspiciousContext = ['free', 'click', 'guaranteed', 'nitro', 'gift', 'scam', 'money'];
                const hasSuspiciousContext = suspiciousContext.some(word => 
                    lowerContent.includes(word) || 
                    (analysis.normalizedText && analysis.normalizedText.toLowerCase().includes(word))
                );
                
                // Double-check: is this really Pokemon trading?
                const isPokemonTrading = this.isPokemonRelatedContent(content);
                
                if (hasSuspiciousContext && !isPokemonTrading) {
                    analysis.threatLevel += 5;
                    const commandType = lowerContent.includes('.trade') ? '.trade' : 
                                       lowerContent.includes('.me') ? '.me' : '.mysteryegg';
                    analysis.reasoning.push(`Suspicious ${commandType} context detected${analysis.bypassDetected ? ' (after bypass normalization)' : ''}`);
                    isScam = true;
                    actualContentDetected = true; // Scam counts as harmful content
                } else if (hasSuspiciousContext && isPokemonTrading) {
                    const commandType = lowerContent.includes('.trade') ? '.trade' : 
                                       lowerContent.includes('.me') ? '.me' : '.mysteryegg';
                    console.log(`🎮 Suspicious ${commandType} context detected but Pokemon trading confirmed - no penalty applied`);
                    analysis.reasoning.push(`Suspicious keywords detected but legitimate Pokemon trading confirmed - no penalty`);
                } else if (isPokemonTrading) {
                    const commandType = lowerContent.includes('.trade') ? '.trade' : 
                                       lowerContent.includes('.me') ? '.me' : '.mysteryegg';
                    console.log(`🎮 ${commandType} detected in Pokemon context - whitelisted`);
                    analysis.reasoning.push(`Pokemon ${commandType} command detected - whitelisted`);
                }
            }
            
            // FIXED: Decision logic - only act on actual harmful content
            if (isScam && analysis.threatLevel >= 6) {
                analysis.violationType = 'SCAM';
                analysis.action = 'ban';
            } else if (analysis.threatLevel >= config.moderationThresholds.ban && actualContentDetected) {
                // Only ban if actual harmful content was detected, not just bypass attempts
                analysis.violationType = 'SEVERE_TOXICITY';
                analysis.action = 'ban';
            } else if (analysis.threatLevel >= config.moderationThresholds.mute && actualContentDetected) {
                analysis.violationType = 'HARASSMENT';
                analysis.action = 'mute';
            } else if (analysis.threatLevel >= config.moderationThresholds.delete) {
                analysis.violationType = 'TOXIC_BEHAVIOR';
                analysis.action = 'delete';
            } else if (analysis.threatLevel >= config.moderationThresholds.warn) {
                analysis.violationType = 'DISRESPECTFUL';
                analysis.action = 'warn';
            }
            // NOTE: No special handling for bypass-only violations since we don't penalize them anymore
            
            // Update profile when violations detected
            if (analysis.violationType) {
                if (!profile.violations) profile.violations = [];
                profile.violations.push({
                    timestamp: Date.now(),
                    threatLevel: analysis.threatLevel,
                    baseThreatLevel: baseThreatLevel,
                    violationType: analysis.violationType,
                    language: detectedLang,
                    elongated: analysis.elongatedWords.length > 0,
                    bypassDetected: analysis.bypassDetected,
                    bypassAttempts: analysis.bypassAttempts,
                    bypassMethods: analysis.bypassAttempts.map(b => b.type),
                    normalizedContent: analysis.normalizedText,
                    content: content.slice(0, 100),
                    action: analysis.action,
                    multiApiUsed: analysis.multiApiUsed,
                    provider: analysis.language.provider,
                    isScam: isScam,
                    actualContentDetected: actualContentDetected
                });
                
                // Increased risk score for bypass attempts (but only if harmful content detected)
                const baseRiskIncrease = Math.ceil(analysis.threatLevel / 3);
                const bypassMultiplier = (analysis.bypassDetected && actualContentDetected) ? 1.5 : 1;
                const riskIncrease = Math.ceil(baseRiskIncrease * bypassMultiplier);
                
                profile.riskScore = Math.min(10, (profile.riskScore || 0) + riskIncrease);
                
                if (!profile.languageHistory) profile.languageHistory = [];
                profile.languageHistory.push({
                    language: detectedLang,
                    timestamp: Date.now(),
                    threatLevel: analysis.threatLevel,
                    bypassDetected: analysis.bypassDetected
                });
                
                if (analysis.multiApiUsed) {
                    profile.multiApiTranslations = (profile.multiApiTranslations || 0) + 1;
                }

                // Track bypass attempts in profile (only when harmful content detected)
                if (analysis.bypassDetected && actualContentDetected) {
                    if (!profile.bypassHistory) profile.bypassHistory = [];
                    profile.bypassHistory.push({
                        timestamp: Date.now(),
                        methods: analysis.bypassAttempts.map(b => b.type),
                        originalText: content.slice(0, 50),
                        normalizedText: analysis.normalizedText?.slice(0, 50),
                        penaltyApplied: analysis.threatLevel - baseThreatLevel,
                        hadHarmfulContent: actualContentDetected
                    });
                    
                    profile.totalBypassAttempts = (profile.totalBypassAttempts || 0) + 1;
                }

                // ENHANCED: Detailed logging for violations with bypass information
                console.log(`🚨 VIOLATION DETECTED - User: ${author.tag}`);
                console.log(`   Content: "${content}"`);
                console.log(`   Actual harmful content detected: ${actualContentDetected}`);
                if (analysis.bypassDetected) {
                    console.log(`   🔍 BYPASS DETECTED: Original normalized to "${analysis.normalizedText}"`);
                    console.log(`   🔍 Bypass Methods: ${analysis.bypassAttempts.map(b => b.type).join(', ')}`);
                    console.log(`   🔍 Bypass Penalty: +${analysis.threatLevel - baseThreatLevel}`);
                    console.log(`   🔍 Bypass with harmful content: ${actualContentDetected}`);
                }
                console.log(`   Threat Level: ${analysis.threatLevel}/10 (base: ${baseThreatLevel})`);
                console.log(`   Required Thresholds: Warn(${config.moderationThresholds.warn}) Delete(${config.moderationThresholds.delete}) Mute(${config.moderationThresholds.mute}) Ban(${config.moderationThresholds.ban})`);
                console.log(`   Violation Type: ${analysis.violationType}`);
                console.log(`   Action: ${analysis.action}`);
                console.log(`   User Risk Score: ${profile.riskScore}/10`);
                console.log(`   Total Bypass Attempts: ${profile.totalBypassAttempts || 0}`);
                console.log(`   Reasoning: ${analysis.reasoning.join(', ')}`);
                console.log(`   Is Scam: ${isScam}`);
                console.log(`   Bypass Detection: ${analysis.bypassDetected ? 'ACTIVE & EFFECTIVE' : 'NO BYPASS DETECTED'}`);
                
            } else if (analysis.threatLevel > 0) {
                console.log(`⚪ Low threat detected but no action - User: ${author.tag}`);
                console.log(`   Content: "${content}"`);
                console.log(`   Actual harmful content detected: ${actualContentDetected}`);
                if (analysis.bypassDetected) {
                    console.log(`   🔍 BYPASS DETECTED but below threshold: "${analysis.normalizedText}"`);
                    console.log(`   🔍 Bypass Methods: ${analysis.bypassAttempts.map(b => b.type).join(', ')}`);
                    console.log(`   🔍 Bypass with harmful content: ${actualContentDetected}`);
                }
                console.log(`   Threat Level: ${analysis.threatLevel}/10 (below warn threshold ${config.moderationThresholds.warn})`);
            }
            
            // Enhanced confidence calculation considering bypass detection
            const baseConfidence = 50 + (analysis.threatLevel * 5) + (analysis.reasoning.length * 10);
            const bypassConfidenceBoost = (analysis.bypassDetected && actualContentDetected) ? 15 : 0;
            analysis.confidence = Math.min(100, baseConfidence + bypassConfidenceBoost);
            
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
                bypassHistory: [],
                totalBypassAttempts: 0,
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

    // Get bypass statistics for a user
    getBypassStatistics(userId) {
        const profile = this.getProfile(userId);
        if (!profile || !profile.bypassHistory) {
            return {
                totalAttempts: 0,
                recentAttempts: 0,
                commonMethods: [],
                latestAttempt: null
            };
        }

        const now = Date.now();
        const recentAttempts = profile.bypassHistory.filter(
            attempt => (now - attempt.timestamp) < (24 * 60 * 60 * 1000)
        ).length;

        const methodCounts = {};
        profile.bypassHistory.forEach(attempt => {
            attempt.methods.forEach(method => {
                methodCounts[method] = (methodCounts[method] || 0) + 1;
            });
        });

        const commonMethods = Object.entries(methodCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([method, count]) => ({ method, count }));

        return {
            totalAttempts: profile.totalBypassAttempts || 0,
            recentAttempts: recentAttempts,
            commonMethods: commonMethods,
            latestAttempt: profile.bypassHistory[profile.bypassHistory.length - 1] || null
        };
    }

    // Clear bypass history for a user
    clearBypassHistory(userId) {
        const profile = this.getProfile(userId);
        if (profile) {
            profile.bypassHistory = [];
            profile.totalBypassAttempts = 0;
            return true;
        }
        return false;
    }

    // Get server-wide bypass statistics
    getServerBypassStatistics() {
        let totalAttempts = 0;
        let totalUsers = 0;
        const methodCounts = {};
        const recentAttempts = [];
        const now = Date.now();

        for (const [userId, profile] of this.profiles) {
            if (profile.bypassHistory && profile.bypassHistory.length > 0) {
                totalUsers++;
                totalAttempts += profile.totalBypassAttempts || 0;

                profile.bypassHistory.forEach(attempt => {
                    attempt.methods.forEach(method => {
                        methodCounts[method] = (methodCounts[method] || 0) + 1;
                    });

                    if ((now - attempt.timestamp) < (24 * 60 * 60 * 1000)) {
                        recentAttempts.push({
                            userId: userId,
                            timestamp: attempt.timestamp,
                            methods: attempt.methods
                        });
                    }
                });
            }
        }

        const topMethods = Object.entries(methodCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([method, count]) => ({ method, count }));

        return {
            totalAttempts: totalAttempts,
            affectedUsers: totalUsers,
            recentAttempts: recentAttempts.length,
            topBypassMethods: topMethods,
            detectionRate: totalAttempts > 0 ? 100 : 0
        };
    }
}

module.exports = EnhancedSynthiaAI;
