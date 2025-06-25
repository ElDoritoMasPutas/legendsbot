// Enhanced Synthia Translator with Multi-API Support v9.0 - FIXED TOXICITY DETECTION
const EnhancedTranslationAPI = require('../data/Translation.js');
const config = require('../config/config.js');

class SynthiaMultiTranslator {
    constructor() {
        this.enhancedAPI = new EnhancedTranslationAPI();
        this.toxicityDatabase = new Map();
        this.scamPatterns = new Set();
        this.translationStats = {
            totalTranslations: 0,
            successfulTranslations: 0,
            failedTranslations: 0,
            providerStats: {},
            averageResponseTime: 0,
            totalResponseTime: 0
        };
        
        this.initializeLanguagePatterns();
        this.initializeScamPatterns();
        console.log('🚀 Synthia Multi-Translator v9.0 initialized with WORKING toxicity detection');
        console.log(`🔧 Total providers: ${Object.keys(this.enhancedAPI.apis).length}`);
        console.log(`🌍 Languages supported: ${this.enhancedAPI.supportedLanguages.size}`);
    }

    initializeScamPatterns() {
        // FIXED: Better scam patterns with context
        this.scamPatterns = new Set([
            'free nitro click', 'discord gift code', 'free discord nitro',
            'steam gift card free', 'free games click', 'nitro giveaway click', 
            'crypto scam', 'bitcoin investment guaranteed', 'easy money guaranteed', 
            'get rich quick', 'work from home guaranteed', 'make money online click',
            'passive income guaranteed', 'trading bot guaranteed', 'forex guaranteed profit',
            'binary options guaranteed', 'cryptocurrency investment guaranteed', 'nft free click',
            'airdrop click here', 'whitelist click now', 'presale guaranteed', 
            'double your money guaranteed', 'guaranteed profit click', 'risk free investment guaranteed',
            'no experience needed money', 'automatic money making', 'join now get rich',
            'act fast limited time money', 'exclusive offer click money', 'secret method money',
            'dm me for money', 'add me for free money', 'nitro boost free click',
            'free robux click here', 'roblox gift free click', 'minecraft gift click here',
            'steam key free click', 'game key giveaway click', 'cs:go skins free click'
        ]);
        
        console.log('🛡️ FIXED: Enhanced scam patterns initialized');
    }

    initializeLanguagePatterns() {
        this.initializeEnglishPatterns();
        this.initializeSpanishPatterns();
        this.initializeFrenchPatterns();
        this.initializeGermanPatterns();
        this.initializeRussianPatterns();
        this.initializePortuguesePatterns();
        this.initializeItalianPatterns();
        this.initializeJapanesePatterns();
        this.initializeChinesePatterns();
        this.initializeArabicPatterns();
        this.initializeHindiPatterns();
        
        console.log(`🧠 FIXED: Initialized working toxicity patterns for ${this.toxicityDatabase.size} languages`);
    }

    initializeEnglishPatterns() {
        // FIXED: Proper severity weighting for English
        const severeToxicWords = [
            'kill yourself', 'kys', 'hang yourself', 'die bitch', 'you should die', 
            'end your life', 'commit suicide', 'go die', 'nigger', 'faggot', 'retard'
        ];
        
        const moderateToxicWords = [
            'fuck you', 'fucking idiot', 'piece of shit', 'go to hell', 'bitch ass',
            'motherfucker', 'asshole', 'dickhead', 'cunt', 'whore', 'slut'
        ];
        
        const mildToxicWords = [
            'fuck', 'shit', 'damn', 'hell', 'bitch', 'ass', 'dick', 'pussy', 
            'bastard', 'piss', 'crap', 'dumbass'
        ];
        
        const insultWords = [
            'idiot', 'stupid', 'moron', 'dumb', 'pathetic', 'worthless', 'loser',
            'trash', 'garbage', 'scum', 'waste'
        ];
        
        const patterns = [];
        
        // FIXED: Proper weight assignments
        for (const word of severeToxicWords) {
            patterns.push({ pattern: new RegExp(`\\b${this.escapeRegex(word)}\\b`, 'gi'), weight: 5 });
        }
        
        for (const word of moderateToxicWords) {
            patterns.push({ pattern: new RegExp(`\\b${this.escapeRegex(word)}\\b`, 'gi'), weight: 3 });
        }
        
        for (const word of mildToxicWords) {
            patterns.push({ pattern: new RegExp(`\\b${this.escapeRegex(word)}\\b`, 'gi'), weight: 2 });
        }
        
        for (const word of insultWords) {
            patterns.push({ pattern: new RegExp(`\\b${this.escapeRegex(word)}\\b`, 'gi'), weight: 1 });
        }
        
        // FIXED: Threat patterns with high weights
        patterns.push({ pattern: /\b(kill\s*yourself|k\s*y\s*s|hang\s*yourself|end\s*your\s*life)\b/gi, weight: 6 });
        patterns.push({ pattern: /\b(you\s*should\s*die|go\s*kill|hope\s*you\s*die)\b/gi, weight: 5 });
        patterns.push({ pattern: /\b(i\s*will\s*kill|gonna\s*kill|going\s*to\s*kill)\b/gi, weight: 4 });
        
        this.toxicityDatabase.set('en', {
            patterns: patterns,
            commonWords: ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at'],
            culturalSensitivity: 'medium'
        });
    }

    initializeSpanishPatterns() {
        const patterns = [
            { pattern: /\b(matate|suicidate|vete a morir)\b/gi, weight: 6 },
            { pattern: /\b(hijo de puta|vete a la mierda|que te jodan|jodete)\b/gi, weight: 4 },
            { pattern: /\b(idiota|estúpido|imbécil|pendejo|cabrón|puta|mierda|joder)\b/gi, weight: 2 },
            { pattern: /\b(tonto|bobo)\b/gi, weight: 1 }
        ];
        
        this.toxicityDatabase.set('es', {
            patterns: patterns,
            commonWords: ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se'],
            culturalSensitivity: 'high'
        });
    }

    initializeFrenchPatterns() {
        const patterns = [
            { pattern: /\b(tue\s*toi|suicide\s*toi|va\s*mourir)\b/gi, weight: 6 },
            { pattern: /\b(putain de merde|va te faire foutre|fils de pute)\b/gi, weight: 4 },
            { pattern: /\b(merde|putain|con|connard|salope|enculé)\b/gi, weight: 2 },
            { pattern: /\b(idiot|stupide|crétin)\b/gi, weight: 1 }
        ];
        
        this.toxicityDatabase.set('fr', {
            patterns: patterns,
            commonWords: ['le', 'de', 'un', 'être', 'et', 'à', 'il', 'avoir'],
            culturalSensitivity: 'medium'
        });
    }

    // FIXED: Better German patterns with more comprehensive detection
    initializeGermanPatterns() {
        const patterns = [
            { pattern: /\b(bring\s*dich\s*um|töte\s*dich|stirb)\b/gi, weight: 6 },
            { pattern: /\b(fick\s*dich|hurensohn|arschloch|verfickt|schlampe)\b/gi, weight: 4 },
            { pattern: /\b(scheiße|scheisse|fick|arsch|fotze|verdammt|kacke)\b/gi, weight: 2 },
            { pattern: /\b(idiot|dumm|vollpfosten|trottel)\b/gi, weight: 1 }
        ];
        
        this.toxicityDatabase.set('de', {
            patterns: patterns,
            commonWords: ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'ich', 'du', 'er', 'sie'],
            culturalSensitivity: 'high'
        });
    }

    initializeRussianPatterns() {
        const patterns = [
            { pattern: /\b(убей себя|повесься|сдохни)\b/gi, weight: 6 },
            { pattern: /\b(сука блядь|пошел нахуй|ебать тебя)\b/gi, weight: 4 },
            { pattern: /\b(сука|блядь|хуй|пизда|ебать|говно)\b/gi, weight: 2 },
            { pattern: /\b(дурак|идиот|дебил)\b/gi, weight: 1 }
        ];
        
        this.toxicityDatabase.set('ru', {
            patterns: patterns,
            commonWords: ['и', 'в', 'не', 'на', 'я', 'быть', 'он', 'с'],
            culturalSensitivity: 'high'
        });
    }

    initializePortuguesePatterns() {
        const patterns = [
            { pattern: /\b(se\s*mata|vai\s*morrer|suicida)\b/gi, weight: 6 },
            { pattern: /\b(filho da puta|vai se foder|puta que pariu)\b/gi, weight: 4 },
            { pattern: /\b(merda|porra|caralho|foda|puta|cu)\b/gi, weight: 2 },
            { pattern: /\b(idiota|estúpido|otário)\b/gi, weight: 1 }
        ];
        
        this.toxicityDatabase.set('pt', {
            patterns: patterns,
            commonWords: ['o', 'de', 'e', 'a', 'que', 'em', 'ser', 'um'],
            culturalSensitivity: 'medium'
        });
    }

    initializeItalianPatterns() {
        const patterns = [
            { pattern: /\b(ucciditi|ammazzati|crepa)\b/gi, weight: 6 },
            { pattern: /\b(vaffanculo|figlio di puttana|merda di merda)\b/gi, weight: 4 },
            { pattern: /\b(merda|cazzo|stronzo|puttana|figa)\b/gi, weight: 2 },
            { pattern: /\b(idiota|stupido|coglione)\b/gi, weight: 1 }
        ];
        
        this.toxicityDatabase.set('it', {
            patterns: patterns,
            commonWords: ['il', 'di', 'e', 'la', 'che', 'è', 'un', 'a'],
            culturalSensitivity: 'high'
        });
    }

    initializeJapanesePatterns() {
        const patterns = [
            { pattern: /死ね|殺す|自殺しろ/gi, weight: 6 },
            { pattern: /バカ|馬鹿|ばか|アホ|クソ|くそ|ちくしょう/gi, weight: 2 },
            { pattern: /ブス|デブ|きもい/gi, weight: 1 }
        ];
        
        this.toxicityDatabase.set('ja', {
            patterns: patterns,
            commonWords: ['の', 'に', 'は', 'を', 'た', 'が', 'で'],
            culturalSensitivity: 'very high'
        });
    }

    initializeChinesePatterns() {
        const patterns = [
            { pattern: /去死|他妈的|杀死你/gi, weight: 6 },
            { pattern: /傻逼|操|妈的|混蛋|王八蛋|狗屎/gi, weight: 2 },
            { pattern: /白痴|蠢货|笨蛋/gi, weight: 1 }
        ];
        
        this.toxicityDatabase.set('zh', {
            patterns: patterns,
            commonWords: ['的', '一', '是', '在', '了', '有', '和'],
            culturalSensitivity: 'very high'
        });
    }

    initializeArabicPatterns() {
        const patterns = [
            { pattern: /اقتل نفسك|موت|اذهب للجحيم/gi, weight: 6 },
            { pattern: /كلب ابن كلب|لعنة عليك/gi, weight: 4 },
            { pattern: /كلب|حمار|غبي|احمق|قذر/gi, weight: 2 },
            { pattern: /مجنون/gi, weight: 1 }
        ];
        
        this.toxicityDatabase.set('ar', {
            patterns: patterns,
            commonWords: ['في', 'من', 'إلى', 'على', 'هذا'],
            culturalSensitivity: 'very high'
        });
    }

    initializeHindiPatterns() {
        const patterns = [
            { pattern: /मर जा|खुद को मार डाल|जहन्नुम में जा/gi, weight: 6 },
            { pattern: /मादरचोद|भोसड़ी के|रंडी|हरामी/gi, weight: 4 },
            { pattern: /चुतिया|गांडू|साला|कमीना/gi, weight: 2 },
            { pattern: /बेवकूफ|गधा|मूर्ख/gi, weight: 1 }
        ];
        
        this.toxicityDatabase.set('hi', {
            patterns: patterns,
            commonWords: ['के', 'है', 'में', 'की', 'एक'],
            culturalSensitivity: 'high'
        });
    }

    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    detectLanguage(text) {
        return this.enhancedAPI.detectLanguage(text);
    }

    normalizeElongatedText(text) {
        // Only normalize if there are 4+ repeated characters
        let normalized = text.replace(/(.)\1{3,}/gi, '$1$1');
        normalized = normalized.replace(/\b([a-zA-Z])\s+(?=[a-zA-Z]\b)/g, '$1');
        normalized = normalized.replace(/([a-zA-Z])[._\-]{2,}(?=[a-zA-Z])/g, '$1');
        return normalized;
    }

    async translateText(text, targetLang = 'en', sourceLang = null) {
        const startTime = Date.now();
        this.translationStats.totalTranslations++;
        
        try {
            const detectedLang = sourceLang || this.detectLanguage(text);
            if (detectedLang === targetLang) {
                return {
                    translatedText: text,
                    originalLanguage: this.enhancedAPI.supportedLanguages.get(detectedLang) || 'Unknown',
                    targetLanguage: this.enhancedAPI.supportedLanguages.get(targetLang) || 'Unknown',
                    confidence: 100,
                    provider: 'No translation needed',
                    processingTime: Date.now() - startTime
                };
            }

            const result = await this.enhancedAPI.translateText(text, targetLang, sourceLang);
            const responseTime = Date.now() - startTime;
            
            if (result.error) {
                this.translationStats.failedTranslations++;
            } else {
                this.translationStats.successfulTranslations++;
                
                if (result.provider) {
                    const providerName = result.provider.split(' ')[0];
                    if (!this.translationStats.providerStats[providerName]) {
                        this.translationStats.providerStats[providerName] = {
                            count: 0,
                            totalTime: 0,
                            averageTime: 0,
                            successRate: 0,
                            successes: 0
                        };
                    }
                    
                    const stats = this.translationStats.providerStats[providerName];
                    stats.count++;
                    stats.successes++;
                    stats.totalTime += responseTime;
                    stats.averageTime = Math.round(stats.totalTime / stats.count);
                    stats.successRate = Math.round((stats.successes / stats.count) * 100);
                }
            }
            
            this.translationStats.totalResponseTime += responseTime;
            this.translationStats.averageResponseTime = Math.round(
                this.translationStats.totalResponseTime / this.translationStats.totalTranslations
            );
            
            if (config.verboseLogging && result.provider !== 'No translation needed') {
                const sourceName = this.enhancedAPI.supportedLanguages.get(detectedLang) || detectedLang;
                const targetName = this.enhancedAPI.supportedLanguages.get(targetLang) || targetLang;
                console.log(`🔄 Translation [${responseTime}ms]: ${sourceName} → ${targetName} | "${text.slice(0, 30)}..." → "${result.translatedText.slice(0, 30)}..." (${result.provider})`);
            }
            
            return result;

        } catch (error) {
            this.translationStats.failedTranslations++;
            console.error('🔄 Translation error:', error);
            return {
                translatedText: text,
                originalLanguage: 'Unknown',
                targetLanguage: this.enhancedAPI.supportedLanguages.get(targetLang) || 'Unknown',
                confidence: 0,
                error: error.message,
                processingTime: Date.now() - startTime
            };
        }
    }

    parseLanguageInput(input) {
        if (!input) return 'en';
        
        const lowerInput = input.toLowerCase().trim();
        
        if (this.enhancedAPI.supportedLanguages.has(lowerInput)) {
            return lowerInput;
        }
        
        for (const [code, name] of this.enhancedAPI.supportedLanguages.entries()) {
            if (name.toLowerCase() === lowerInput || 
                name.toLowerCase().includes(lowerInput) ||
                lowerInput.includes(name.toLowerCase().split(' ')[0])) {
                return code;
            }
        }
        
        const commonMappings = {
            'english': 'en', 'spanish': 'es', 'french': 'fr', 'german': 'de',
            'italian': 'it', 'portuguese': 'pt', 'russian': 'ru', 'japanese': 'ja',
            'chinese': 'zh', 'korean': 'ko', 'arabic': 'ar', 'hindi': 'hi',
            'dutch': 'nl', 'polish': 'pl', 'turkish': 'tr'
        };
        
        return commonMappings[lowerInput] || null;
    }

    getSupportedLanguages() {
        return Array.from(this.enhancedAPI.supportedLanguages.entries()).map(([code, name]) => ({
            code,
            name
        }));
    }

    // FIXED: Proper toxicity analysis that actually works
    async analyzeToxicityInLanguage(text, langCode) {
        const langData = this.toxicityDatabase.get(langCode) || this.toxicityDatabase.get('en');
        if (!langData) return { toxicityLevel: 0, matches: [], elongatedWords: [], language: 'Unknown' };
        
        let toxicityLevel = 0;
        const matches = [];
        const elongatedWords = [];
        
        const normalizedText = this.normalizeElongatedText(text);
        const isElongated = normalizedText !== text;
        
        const textsToCheck = [text.toLowerCase(), normalizedText.toLowerCase()];
        
        // FIXED: Proper weighted scoring
        for (const textToCheck of textsToCheck) {
            for (const patternObj of langData.patterns || []) {
                const foundMatches = textToCheck.match(patternObj.pattern);
                if (foundMatches) {
                    const weight = patternObj.weight || 1;
                    const matchScore = foundMatches.length * weight;
                    toxicityLevel += matchScore;
                    matches.push(...foundMatches);
                    
                    console.log(`🔍 Toxicity match: "${foundMatches.join(', ')}" (weight: ${weight}, score: +${matchScore})`);
                    
                    if (textToCheck === normalizedText.toLowerCase() && isElongated) {
                        for (const match of foundMatches) {
                            elongatedWords.push({
                                original: text.match(new RegExp(match.split('').join('[.\\s_\\-]*'), 'gi'))?.[0] || match,
                                normalized: match,
                                isElongated: true
                            });
                        }
                    }
                }
            }
        }
        
        // FIXED: Enhanced scam detection with context
        const lowerText = text.toLowerCase();
        let scamScore = 0;
        for (const scamPattern of this.scamPatterns) {
            if (lowerText.includes(scamPattern)) {
                scamScore += 4;
                matches.push(`[SCAM: ${scamPattern}]`);
                console.log(`🚨 SCAM PATTERN: "${scamPattern}" found in "${text}"`);
            }
        }
        
        // Special handling for .trade
        if (lowerText.includes('.trade')) {
            const suspiciousContext = ['free', 'click', 'guaranteed', 'nitro', 'gift', 'scam', 'money'];
            const hasSuspiciousContext = suspiciousContext.some(word => lowerText.includes(word));
            
            if (hasSuspiciousContext) {
                scamScore += 5;
                matches.push('[SUSPICIOUS_TRADE]');
                console.log(`🚨 SUSPICIOUS .trade context detected`);
            }
        }
        
        toxicityLevel += scamScore;
        
        // FIXED: Threat patterns
        const severeThreats = [
            /kill\s*yourself/gi,
            /you\s*should\s*die/gi,
            /go\s*hang\s*yourself/gi,
            /end\s*your\s*life/gi
        ];
        
        for (const pattern of severeThreats) {
            if (pattern.test(text)) {
                toxicityLevel += 4;
                matches.push('[SEVERE_THREAT]');
                console.log(`🚨 SEVERE THREAT detected: ${pattern}`);
            }
        }
        
        // Apply cultural sensitivity multiplier
        const sensitivity = langData.culturalSensitivity;
        if (sensitivity === 'very high') {
            toxicityLevel *= 1.3;
        } else if (sensitivity === 'high') {
            toxicityLevel *= 1.2;
        }
        
        // Cap at 10
        const finalLevel = Math.min(10, Math.round(toxicityLevel));
        
        console.log(`🧠 Toxicity Analysis Result: Level ${finalLevel}/10 for "${text}" (${matches.length} matches)`);
        
        return {
            toxicityLevel: finalLevel,
            matches: [...new Set(matches)],
            elongatedWords: elongatedWords,
            language: this.enhancedAPI.supportedLanguages.get(langCode) || 'Unknown',
            culturalSensitivity: sensitivity || 'medium'
        };
    }

    analyzeCulturalContext(text, langCode) {
        const culturalFactors = {
            formality: 'neutral',
            directness: 'medium',
            emotionalIntensity: 'normal',
            respectLevel: 'standard',
            contextualMeaning: []
        };
        
        const langData = this.toxicityDatabase.get(langCode);
        if (!langData) return culturalFactors;
        
        switch (langData.culturalSensitivity) {
            case 'very high':
                culturalFactors.formality = 'very important';
                culturalFactors.respectLevel = 'critical';
                break;
            case 'high':
                culturalFactors.formality = 'important';
                culturalFactors.respectLevel = 'high';
                break;
            default:
                culturalFactors.formality = 'moderate';
                culturalFactors.respectLevel = 'standard';
        }
        
        return culturalFactors;
    }

    getTranslationStats() {
        const successRate = this.translationStats.totalTranslations > 0 
            ? Math.round((this.translationStats.successfulTranslations / this.translationStats.totalTranslations) * 100)
            : 0;
            
        return {
            ...this.translationStats,
            successRate: successRate,
            apiStatus: this.enhancedAPI.getStatus()
        };
    }

    getTranslationStatus() {
        return this.enhancedAPI.getStatus();
    }

    async testAllAPIs() {
        console.log('🧪 Testing all translation APIs...');
        return await this.enhancedAPI.testAPIs();
    }
}

module.exports = SynthiaMultiTranslator;
