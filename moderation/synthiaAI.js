// Enhanced Synthia AI Brain v9.0 - WITH MULTI-API DECISION ENGINE INTEGRATION
const fs = require('fs').promises;
const config = require('../config/config.js');
const MultiAPIDecisionEngine = require('../decisions/decisions.js');

class EnhancedSynthiaAI {
    constructor(synthiaTranslator, discordLogger) {
        this.synthiaTranslator = synthiaTranslator;
        this.discordLogger = discordLogger;
        this.profiles = new Map();
        this.dataPath = 'data/enhanced_profiles.json';
        
        // Initialize Multi-API Decision Engine
        this.decisionEngine = new MultiAPIDecisionEngine();
        
        this.loadData();
    }

    async loadData() {
        try {
            await fs.mkdir('data', { recursive: true });
            const data = await fs.readFile(this.dataPath, 'utf8');
            const parsed = JSON.parse(data);
            this.profiles = new Map(parsed.profiles || []);
            console.log(`✅ Loaded ${this.profiles.size} enhanced profiles with Multi-API decision engine`);
        } catch (error) {
            console.log('📁 Creating fresh enhanced profiles with Multi-API decision engine...');
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
                pokemonAware: true,
                multiApiDecisionEngine: true
            };
            
            await fs.writeFile(this.dataPath, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('❌ Failed to save enhanced data:', error);
        }
    }

    // COMPREHENSIVE: Pokemon content detection - UNCHANGED
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
        
        // COMPREHENSIVE: Multiple detection criteria
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

    // ENHANCED: Complete analysis with Multi-API Decision Engine
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
            multiApiUsed: false,
            decisionEngineUsed: false,
            apiResults: null
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

            // FIRST PRIORITY: Pokemon content detection
            if (this.isPokemonRelatedContent(content)) {
                console.log(`🎮 POKEMON CONTENT DETECTED - skipping all analysis: "${content.slice(0, 50)}..."`);
                
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

            // **NEW: Multi-API Decision Engine Analysis**
            console.log(`🤖 Using Multi-API Decision Engine for enhanced analysis...`);
            
            try {
                // Prepare context for decision engine
                const decisionContext = {
                    author: {
                        id: author.id,
                        tag: author.tag
                    },
                    channel: {
                        id: channel.id,
                        name: channel.name
                    },
                    guild: message.guild ? {
                        id: message.guild.id,
                        name: message.guild.name
                    } : null,
                    language: detectedLang,
                    translatedText: analysis.language.translated
                };

                // Use decision engine for analysis
                const decisionResult = await this.decisionEngine.analyzeWithMultiAPI(content, decisionContext);
                
                analysis.decisionEngineUsed = true;
                analysis.apiResults = decisionResult.apiResults;
                analysis.toxicityScore = decisionResult.toxicityScore;
                analysis.threatLevel = decisionResult.toxicityScore;
                analysis.confidence = decisionResult.confidence;
                analysis.reasoning.push(...decisionResult.reasoning);
                
                console.log(`🧠 Multi-API Decision Result: ${decisionResult.toxicityScore}/10 (${decisionResult.confidence}% confidence)`);
                console.log(`🔧 APIs used: ${Object.keys(decisionResult.individualScores || {}).join(', ')}`);
                
            } catch (decisionError) {
                console.log(`⚠️ Decision engine failed, falling back to local analysis: ${decisionError.message}`);
                
                // Fallback to existing toxicity analysis
                let toxicityAnalysis;
                
                if (detectedLang !== 'en' && analysis.language.translated) {
                    toxicityAnalysis = await this.synthiaTranslator.analyzeToxicityInLanguage(content, detectedLang);
                    
                    if (toxicityAnalysis.toxicityLevel === 0) {
                        const englishAnalysis = await this.synthiaTranslator.analyzeToxicityInLanguage(analysis.language.translated, 'en');
                        if (englishAnalysis.toxicityLevel > toxicityAnalysis.toxicityLevel) {
                            toxicityAnalysis = englishAnalysis;
                        }
                    }
                } else {
                    toxicityAnalysis = await this.synthiaTranslator.analyzeToxicityInLanguage(content, detectedLang);
                }
                
                analysis.threatLevel = toxicityAnalysis.toxicityLevel;
                analysis.toxicityScore = toxicityAnalysis.toxicityLevel;
                analysis.reasoning.push(`Fallback analysis: Level ${toxicityAnalysis.toxicityLevel}/10`);
            }
            
            // ENHANCED: Extract bypass detection information (still from local system)
            const bypassAnalysis = await this.analyzeBypassAttempts(content);
            analysis.elongatedWords = bypassAnalysis.elongatedWords || [];
            analysis.bypassAttempts = bypassAnalysis.bypassAttempts || [];
            analysis.bypassDetected = bypassAnalysis.bypassDetected || false;
            analysis.normalizedText = bypassAnalysis.normalizedText || null;

            // Get user profile for context
            const profile = this.getBehavioralProfile(author.id);
            profile.messageCount++;
            
            // ENHANCED: Decision logic with Multi-API results and bypass penalties
            let baseThreatLevel = analysis.threatLevel;
            let actualContentDetected = baseThreatLevel > 0;
            
            // Apply bypass penalties only when harmful content is detected
            if (analysis.bypassDetected && analysis.bypassAttempts.length > 0) {
                if (actualContentDetected) {
                    const bypassPenalty = analysis.bypassAttempts.reduce((sum, attempt) => sum + (attempt.severity || 1), 0);
                    analysis.threatLevel += bypassPenalty;
                    analysis.reasoning.push(`Bypass penalty applied: +${bypassPenalty} (${analysis.bypassAttempts.length} techniques)`);
                    
                    console.log(`🚨 HARMFUL CONTENT + BYPASS DETECTED: ${baseThreatLevel} → ${analysis.threatLevel} (+${bypassPenalty})`);
                } else {
                    analysis.reasoning.push(`Bypass patterns detected but no harmful content - no penalty applied`);
                    console.log(`✅ BYPASS PATTERNS IN NORMAL CONVERSATION: "${content}" - NO PENALTY APPLIED`);
                }
            }
            
            // Enhanced scam detection with Pokemon awareness
            let isScam = false;
            const scamResult = this.detectScamContent(content, analysis.normalizedText);
            if (scamResult.isScam) {
                analysis.threatLevel += scamResult.severity;
                analysis.reasoning.push(...scamResult.reasons);
                isScam = true;
                actualContentDetected = true;
            }
            
            // Decision logic based on final threat level
            if (isScam && analysis.threatLevel >= 6) {
                analysis.violationType = 'SCAM';
                analysis.action = 'ban';
            } else if (analysis.threatLevel >= config.moderationThresholds.ban && actualContentDetected) {
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
            
            // Update profile when violations detected
            if (analysis.violationType) {
                this.updateProfileWithViolation(profile, analysis, content, detectedLang, isScam, actualContentDetected);
                
                // Enhanced logging for violations
                console.log(`🚨 VIOLATION DETECTED - User: ${author.tag}`);
                console.log(`   Content: "${content}"`);
                console.log(`   Multi-API Decision Engine: ${analysis.decisionEngineUsed ? 'USED' : 'FALLBACK'}`);
                console.log(`   APIs consulted: ${analysis.apiResults ? Object.keys(analysis.apiResults).join(', ') : 'Local only'}`);
                console.log(`   Actual harmful content detected: ${actualContentDetected}`);
                if (analysis.bypassDetected) {
                    console.log(`   🔍 BYPASS DETECTED: Original normalized to "${analysis.normalizedText}"`);
                    console.log(`   🔍 Bypass Methods: ${analysis.bypassAttempts.map(b => b.type).join(', ')}`);
                    console.log(`   🔍 Bypass Penalty: +${analysis.threatLevel - baseThreatLevel}`);
                }
                console.log(`   Threat Level: ${analysis.threatLevel}/10 (base: ${baseThreatLevel})`);
                console.log(`   Violation Type: ${analysis.violationType}`);
                console.log(`   Action: ${analysis.action}`);
                console.log(`   User Risk Score: ${profile.riskScore}/10`);
                
            } else if (analysis.threatLevel > 0) {
                console.log(`⚪ Low threat detected but no action - User: ${author.tag}`);
                console.log(`   Multi-API Analysis: ${analysis.decisionEngineUsed ? 'USED' : 'FALLBACK'}`);
                console.log(`   Threat Level: ${analysis.threatLevel}/10 (below warn threshold ${config.moderationThresholds.warn})`);
            }
            
            // Enhanced confidence calculation
            const baseConfidence = analysis.decisionEngineUsed ? 
                analysis.confidence : // Use decision engine confidence
                (50 + (analysis.threatLevel * 5) + (analysis.reasoning.length * 10)); // Fallback calculation
            
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

    // NEW: Enhanced bypass detection method
    async analyzeBypassAttempts(content) {
        // Check if this is Pokemon content first
        if (this.isPokemonRelatedContent(content)) {
            return {
                bypassDetected: false,
                bypassAttempts: [],
                elongatedWords: [],
                normalizedText: content.toLowerCase()
            };
        }

        // Use the translator's bypass detection
        const normalizedText = this.synthiaTranslator.normalizeBypassAttempts(content);
        const isNormalized = normalizedText !== content.toLowerCase();
        
        const result = {
            bypassDetected: isNormalized,
            bypassAttempts: [],
            elongatedWords: [],
            normalizedText: normalizedText
        };

        if (isNormalized) {
            // Detect specific bypass types
            result.bypassAttempts = this.detectBypassTypes(content, normalizedText);
            
            // Find elongated words
            result.elongatedWords = this.findElongatedWords(content);
        }

        return result;
    }

    // NEW: Detect specific bypass types
    detectBypassTypes(originalText, normalizedText) {
        const bypassAttempts = [];
        
        // Check for elongation
        const elongationMatches = originalText.match(/(.)\1{2,}/gi);
        if (elongationMatches) {
            bypassAttempts.push({
                type: 'elongation',
                patterns: elongationMatches,
                severity: 2
            });
        }
        
        // Check for character substitution
        const substitutionPattern = /[*@$!#%&^+=~`|\\<>{}[\]"';:?]/g;
        const substitutionCount = (originalText.match(substitutionPattern) || []).length;
        if (substitutionCount > 2) {
            bypassAttempts.push({
                type: 'character_substitution',
                count: substitutionCount,
                severity: 3
            });
        }
        
        // Check for separator bypassing
        const separatorMatches = originalText.match(/[a-zA-Z][.*_\-/\\|+~^]+[a-zA-Z]/gi);
        if (separatorMatches && separatorMatches.length > 1) {
            bypassAttempts.push({
                type: 'separator_bypassing',
                patterns: separatorMatches,
                severity: 3
            });
        }
        
        // Check for excessive spacing
        const spacingMatches = originalText.match(/\b[a-zA-Z]\s+[a-zA-Z]\s+[a-zA-Z]/gi);
        if (spacingMatches) {
            bypassAttempts.push({
                type: 'spacing_bypassing',
                patterns: spacingMatches,
                severity: 2
            });
        }
        
        // Check for leetspeak (excluding Pokemon codes)
        const leetMatches = originalText.match(/[a-zA-Z]*[0-9]+[a-zA-Z]*/gi);
        if (leetMatches && leetMatches.length > 0) {
            const nonPokemonLeetMatches = leetMatches.filter(match => {
                return !(/\.trade\s+\d{4,8}/i.test(originalText) && /^\d{4,8}$/.test(match)) &&
                       !(/\.me\s+\d{4,8}/i.test(originalText) && /^\d{4,8}$/.test(match)) &&
                       !(/\.mysteryegg\s+\d{4,8}/i.test(originalText) && /^\d{4,8}$/.test(match));
            });
            
            if (nonPokemonLeetMatches.length > 0) {
                bypassAttempts.push({
                    type: 'leetspeak',
                    patterns: nonPokemonLeetMatches,
                    severity: 2
                });
            }
        }
        
        return bypassAttempts;
    }

    // NEW: Find elongated words
    findElongatedWords(text) {
        const elongatedWords = [];
        const words = text.split(/\s+/);
        
        for (const word of words) {
            const elongationMatch = word.match(/(.)\1{2,}/gi);
            if (elongationMatch) {
                const normalized = word.replace(/(.)\1{2,}/gi, '$1');
                elongatedWords.push({
                    original: word,
                    normalized: normalized,
                    isElongated: true
                });
            }
        }
        
        return elongatedWords;
    }

    // NEW: Enhanced scam detection with Pokemon awareness
    detectScamContent(originalText, normalizedText) {
        const lowerText = originalText.toLowerCase();
        const normalizedLowerText = normalizedText ? normalizedText.toLowerCase() : lowerText;
        
        let scamScore = 0;
        const reasons = [];
        
        const scamPatterns = [
            'free nitro', 'discord gift', 'free robux', 'click here free',
            'dm me for', 'guaranteed money', 'crypto scam', 'easy money'
        ];
        
        for (const pattern of scamPatterns) {
            if (lowerText.includes(pattern) || normalizedLowerText.includes(pattern)) {
                scamScore += 4;
                reasons.push(`Scam indicator: ${pattern}`);
                
                if (normalizedLowerText.includes(pattern) && !lowerText.includes(pattern)) {
                    scamScore += 2;
                    reasons.push(`Scam detected after bypass normalization`);
                }
            }
        }
        
        // Enhanced .trade/.me/.mysteryegg scam detection with Pokemon protection
        if (lowerText.includes('.trade') || lowerText.includes('.me') || lowerText.includes('.mysteryegg') || 
            (normalizedLowerText && (normalizedLowerText.includes('.trade') || 
            normalizedLowerText.includes('.me') || normalizedLowerText.includes('.mysteryegg')))) {
            
            const suspiciousContext = ['free', 'click', 'guaranteed', 'nitro', 'gift', 'scam', 'money'];
            const hasSuspiciousContext = suspiciousContext.some(word => 
                lowerText.includes(word) || 
                (normalizedLowerText && normalizedLowerText.includes(word))
            );
            
            const isPokemonTrading = this.isPokemonRelatedContent(originalText);
            
            if (hasSuspiciousContext && !isPokemonTrading) {
                scamScore += 5;
                const commandType = lowerText.includes('.trade') ? '.trade' : 
                                   lowerText.includes('.me') ? '.me' : '.mysteryegg';
                reasons.push(`Suspicious ${commandType} context detected`);
            }
        }
        
        return {
            isScam: scamScore >= 4,
            severity: scamScore,
            reasons: reasons
        };
    }

    // NEW: Update profile with violation information
    updateProfileWithViolation(profile, analysis, content, detectedLang, isScam, actualContentDetected) {
        if (!profile.violations) profile.violations = [];
        
        profile.violations.push({
            timestamp: Date.now(),
            threatLevel: analysis.threatLevel,
            baseThreatLevel: analysis.threatLevel - (analysis.bypassAttempts?.reduce((sum, b) => sum + (b.severity || 1), 0) || 0),
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
            decisionEngineUsed: analysis.decisionEngineUsed,
            provider: analysis.language.provider,
            isScam: isScam,
            actualContentDetected: actualContentDetected,
            apiResults: analysis.apiResults ? Object.keys(analysis.apiResults) : []
        });
        
        // Update risk score
        const baseRiskIncrease = Math.ceil(analysis.threatLevel / 3);
        const bypassMultiplier = (analysis.bypassDetected && actualContentDetected) ? 1.5 : 1;
        const riskIncrease = Math.ceil(baseRiskIncrease * bypassMultiplier);
        
        profile.riskScore = Math.min(10, (profile.riskScore || 0) + riskIncrease);
        
        // Update language history
        if (!profile.languageHistory) profile.languageHistory = [];
        profile.languageHistory.push({
            language: detectedLang,
            timestamp: Date.now(),
            threatLevel: analysis.threatLevel,
            bypassDetected: analysis.bypassDetected,
            decisionEngineUsed: analysis.decisionEngineUsed
        });
        
        if (analysis.multiApiUsed) {
            profile.multiApiTranslations = (profile.multiApiTranslations || 0) + 1;
        }

        // Track bypass attempts
        if (analysis.bypassDetected && actualContentDetected) {
            if (!profile.bypassHistory) profile.bypassHistory = [];
            profile.bypassHistory.push({
                timestamp: Date.now(),
                methods: analysis.bypassAttempts.map(b => b.type),
                originalText: content.slice(0, 50),
                normalizedText: analysis.normalizedText?.slice(0, 50),
                penaltyApplied: analysis.threatLevel - (analysis.threatLevel - (analysis.bypassAttempts?.reduce((sum, b) => sum + (b.severity || 1), 0) || 0)),
                hadHarmfulContent: actualContentDetected
            });
            
            profile.totalBypassAttempts = (profile.totalBypassAttempts || 0) + 1;
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

    // Get Multi-API Decision Engine status
    getDecisionEngineStatus() {
        return this.decisionEngine.getSystemStatus();
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
            detectionRate: totalAttempts > 0 ? 100 : 0,
            decisionEngineHealth: this.decisionEngine.getSystemStatus().systemHealth
        };
    }
}

module.exports = EnhancedSynthiaAI;
