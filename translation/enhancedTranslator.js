// Enhanced Synthia Translator with Multi-API Support v9.0
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
        console.log('🚀 Synthia Multi-Translator v9.0 initialized with FIXED toxicity detection');
        console.log(`🔧 Total providers: ${Object.keys(this.enhancedAPI.apis).length}`);
        console.log(`🌍 Languages supported: ${this.enhancedAPI.supportedLanguages.size}`);
    }

    initializeScamPatterns() {
        // FIXED: More specific scam patterns to avoid false positives
        this.scamPatterns = new Set([
            'free nitro click here', 'discord gift code', 'limited time nitro',
            'steam gift card free', 'free games click', 'nitro giveaway click', 
            'crypto scam', 'bitcoin investment', 'easy money guaranteed', 
            'get rich quick', 'work from home guaranteed', 'make money online click',
            'passive income guaranteed', 'trading bot scam', 'forex scam',
            'binary options scam', 'cryptocurrency scam', 'nft free click',
            'airdrop click here', 'whitelist click', 'presale scam', 
            'double your money', 'guaranteed profit click', 'risk free investment',
            'no experience needed money', 'automatic money', 'join now click',
            'act fast limited', 'exclusive offer click', 'secret method money',
            'dm me for money', 'add me for free', 'nitro boost free',
            'free robux click', 'roblox gift free', 'minecraft gift click',
            'steam key free', 'game key giveaway', 'cs:go skins free',
            'twitter followers buy', 'instagram followers free', 'tiktok views buy'
        ]);
        
        // REMOVED: Removed simple ".trade" pattern that was causing false positives
        console.log('🛡️ FIXED: Scam patterns initialized with reduced false positives');
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
        
        console.log(`🧠 FIXED: Initialized toxicity patterns for ${this.toxicityDatabase.size} languages with reduced sensitivity`);
    }

    initializeEnglishPatterns() {
        // FIXED: More specific toxic words with higher severity requirements
        const severeToxicWords = ['fuck you', 'fucking idiot', 'kill yourself', 'kys', 'die bitch', 
                                 'you should die', 'hang yourself', 'nigger', 'faggot'];
        
        const moderateToxicWords = ['fuck', 'shit', 'bitch', 'damn', 'hell', 'dick', 'pussy', 'cock', 
                                   'bastard', 'piss', 'slut', 'whore', 'gay insult', 'retard'];
        
        const mildWords = ['idiot', 'stupid', 'moron', 'dumb', 'pathetic', 'worthless', 'loser'];
        
        const patterns = [];
        
        // FIXED: Assign different weights to different severity levels
        for (const word of severeToxicWords) {
            patterns.push({ pattern: new RegExp(`\\b${this.escapeRegex(word)}\\b`, 'gi'), weight: 4 });
        }
        
        for (const word of moderateToxicWords) {
            patterns.push({ pattern: new RegExp(`\\b${this.escapeRegex(word)}\\b`, 'gi'), weight: 2 });
        }
        
        for (const word of mildWords) {
            patterns.push({ pattern: new RegExp(`\\b${this.escapeRegex(word)}\\b`, 'gi'), weight: 1 });
        }
        
        // FIXED: More specific threat patterns
        patterns.push({ pattern: /\b(kill\s*yourself|k\s*y\s*s|hang\s*yourself|end\s*your\s*life)\b/gi, weight: 5 });
        patterns.push({ pattern: /\b(you\s*should\s*die|go\s*kill|hope\s*you\s*die)\b/gi, weight: 4 });
        
        this.toxicityDatabase.set('en', {
            patterns: patterns,
            commonWords: ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at'],
            culturalSensitivity: 'medium'
        });
    }

    // FIXED: Similar pattern improvements for other languages (abbreviated for space)
    initializeSpanishPatterns() {
        const severeToxicWords = ['hijo de puta', 'vete a la mierda', 'que te jodan'];
        const moderateToxicWords = ['idiota', 'estúpido', 'imbécil', 'pendejo', 'cabrón', 'puta', 'mierda'];
        const mildWords = ['tonto', 'bobo'];
        
        const patterns = [];
        
        for (const word of severeToxicWords) {
            patterns.push({ pattern: new RegExp(`\\b${this.escapeRegex(word)}\\b`, 'gi'), weight: 4 });
        }
        
        for (const word of moderateToxicWords) {
            patterns.push({ pattern: new RegExp(`\\b${this.escapeRegex(word)}\\b`, 'gi'), weight: 2 });
        }
        
        for (const word of mildWords) {
            patterns.push({ pattern: new RegExp(`\\b${this.escapeRegex(word)}\\b`, 'gi'), weight: 1 });
        }
        
        this.toxicityDatabase.set('es', {
            patterns: patterns,
            commonWords: ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se', 'no', 'haber', 'por', 'con', 'su', 'para', 'como', 'estar', 'tener', 'le', 'lo'],
            culturalSensitivity: 'high'
        });
    }

    // Abbreviated other language initializations for space...
    initializeFrenchPatterns() {
        const patterns = [
            { pattern: /\b(putain de merde|va te faire foutre)\b/gi, weight: 4 },
            { pattern: /\b(merde|putain|con|connard|salope)\b/gi, weight: 2 },
            { pattern: /\b(idiot|stupide|crétin)\b/gi, weight: 1 }
        ];
        
        this.toxicityDatabase.set('fr', {
            patterns: patterns,
            commonWords: ['le', 'de', 'un', 'être', 'et', 'à', 'il', 'avoir', 'ne', 'je'],
            culturalSensitivity: 'medium'
        });
    }

    initializeGermanPatterns() {
        const patterns = [
            { pattern: /\b(fick dich|hurensohn|arschloch)\b/gi, weight: 4 },
            { pattern: /\b(scheiße|fick|arsch|fotze)\b/gi, weight: 2 },
            { pattern: /\b(idiot|dumm|vollpfosten)\b/gi, weight: 1 }
        ];
        
        this.toxicityDatabase.set('de', {
            patterns: patterns,
            commonWords: ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das'],
            culturalSensitivity: 'high'
        });
    }

    initializeRussianPatterns() {
        const patterns = [
            { pattern: /\b(сука блядь|пошел нахуй)\b/gi, weight: 4 },
            { pattern: /\b(сука|блядь|хуй|пизда|ебать)\b/gi, weight: 2 },
            { pattern: /\b(дурак|идиот|дебил)\b/gi, weight: 1 }
        ];
        
        this.toxicityDatabase.set('ru', {
            patterns: patterns,
            commonWords: ['и', 'в', 'не', 'на', 'я', 'быть', 'он', 'с', 'что', 'а'],
            culturalSensitivity: 'high'
        });
    }

    initializePortuguesePatterns() {
        const patterns = [
            { pattern: /\b(filho da puta|vai se foder)\b/gi, weight: 4 },
            { pattern: /\b(merda|porra|caralho|foda|puta)\b/gi, weight: 2 },
            { pattern: /\b(idiota|estúpido|otário)\b/gi, weight: 1 }
        ];
        
        this.toxicityDatabase.set('pt', {
            patterns: patterns,
            commonWords: ['o', 'de', 'e', 'a', 'que', 'em', 'ser', 'um', 'para'],
            culturalSensitivity: 'medium'
        });
    }

    initializeItalianPatterns() {
        const patterns = [
            { pattern: /\b(vaffanculo|figlio di puttana)\b/gi, weight: 4 },
            { pattern: /\b(merda|cazzo|stronzo|puttana)\b/gi, weight: 2 },
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
            { pattern: /死ね|しね/gi, weight: 4 },
            { pattern: /バカ|馬鹿|ばか|アホ|クソ|くそ/gi, weight: 2 },
            { pattern: /ブス|デブ/gi, weight: 1 }
        ];
        
        this.toxicityDatabase.set('ja', {
            patterns: patterns,
            commonWords: ['の', 'に', 'は', 'を', 'た', 'が', 'で'],
            culturalSensitivity: 'very high'
        });
    }

    initializeChinesePatterns() {
        const patterns = [
            { pattern: /他妈的|去死/gi, weight: 4 },
            { pattern: /傻逼|操|妈的|混蛋|王八蛋/gi, weight: 2 },
            { pattern: /白痴|蠢货/gi, weight: 1 }
        ];
        
        this.toxicityDatabase.set('zh', {
            patterns: patterns,
            commonWords: ['的', '一', '是', '在', '了', '有', '和'],
            culturalSensitivity: 'very high'
        });
    }

    initializeArabicPatterns() {
        const patterns = [
            { pattern: /كلب ابن كلب/gi, weight: 4 },
            { pattern: /كلب|حمار|غبي|احمق/gi, weight: 2 },
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
            { pattern: /मादरचोद|भोसड़ी के/gi, weight: 4 },
            { pattern: /चुतिया|गांडू|रंडी|हरामी/gi, weight: 2 },
            { pattern: /बेवकूफ|गधा/gi, weight: 1 }
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

    // FIXED: Less aggressive elongated text normalization
    normalizeElongatedText(text) {
        // Only normalize if there are 4+ repeated characters (was 2+)
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

    // FIXED: Much more conservative toxicity analysis
    async analyzeToxicityInLanguage(text, langCode) {
        const langData = this.toxicityDatabase.get(langCode) || this.toxicityDatabase.get('en');
        if (!langData) return { toxicityLevel: 0, matches: [], elongatedWords: [] };
        
        let toxicityLevel = 0;
        const matches = [];
        const elongatedWords = [];
        
        const normalizedText = this.normalizeElongatedText(text);
        const isElongated = normalizedText !== text;
        
        const textsToCheck = [text, normalizedText];
        
        // FIXED: Use weighted scoring system
        for (const textToCheck of textsToCheck) {
            for (const patternObj of langData.patterns || []) {
                const foundMatches = textToCheck.match(patternObj.pattern);
                if (foundMatches) {
                    const weight = patternObj.weight || 1;
                    toxicityLevel += foundMatches.length * weight; // Use weighted scoring
                    matches.push(...foundMatches);
                    
                    if (textToCheck === normalizedText && isElongated) {
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
        
        // FIXED: Much more conservative scam detection
        const lowerText = text.toLowerCase();
        let scamScore = 0;
        for (const scamPattern of this.scamPatterns) {
            if (lowerText.includes(scamPattern)) {
                scamScore += 3; // Reduced from 6
                matches.push(`[SCAM: ${scamPattern}]`);
                console.log(`🚨 SCAM PATTERN DETECTED: "${scamPattern}" in "${text}"`);
            }
        }
        
        // FIXED: Only add scam score if multiple patterns or very specific patterns
        if (scamScore >= 6 || matches.filter(m => m.includes('[SCAM:')).length >= 2) {
            toxicityLevel += scamScore;
        }
        
        // FIXED: More conservative URL pattern checking
        const suspiciousUrlPatterns = [
            /bit\.ly\/[^\s]+free/gi,
            /tinyurl\.com\/[^\s]+nitro/gi,
            /discord\.gg\/[^\s]+\s+(free|nitro|gift)/gi
        ];
        
        for (const pattern of suspiciousUrlPatterns) {
            if (pattern.test(text)) {
                toxicityLevel += 2; // Reduced from 4
                matches.push('[SUSPICIOUS_URL]');
            }
        }
        
        // FIXED: Reduced penalty for multiple matches
        if (matches.length > 3) toxicityLevel += 1; // Reduced from 2
        if (isElongated && matches.length > 0) toxicityLevel += 1; // Only add if there are actual matches
        
        // FIXED: More conservative threat detection
        const severeThreats = [
            /kill\s*yourself\s*now/gi,
            /you\s*should\s*die\s*today/gi,
            /go\s*hang\s*yourself/gi
        ];
        
        for (const pattern of severeThreats) {
            if (pattern.test(text)) {
                toxicityLevel += 3; // Reduced from 5
                matches.push('[SEVERE_THREAT]');
            }
        }
        
        const sensitivity = langData.culturalSensitivity;
        if (sensitivity === 'very high') {
            toxicityLevel *= 1.2; // Reduced from 1.5
        } else if (sensitivity === 'high') {
            toxicityLevel *= 1.1; // Reduced from 1.2
        }
        
        // FIXED: Cap at 10 and require minimum threshold
        const finalLevel = Math.min(10, Math.round(toxicityLevel));
        
        // FIXED: Don't report very low levels as toxic
        if (finalLevel <= 2 && matches.length <= 1) {
            return {
                toxicityLevel: 0,
                matches: [],
                elongatedWords: [],
                language: this.enhancedAPI.supportedLanguages.get(langCode) || 'Unknown',
                culturalSensitivity: sensitivity || 'medium'
            };
        }
        
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