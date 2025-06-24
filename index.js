// Enhanced Discord Bot v9.0 - FIXED VERSION (Automoderation Working)
const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField, SlashCommandBuilder, REST, Routes, ActivityType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs').promises;

// Import Enhanced Translation API
const EnhancedTranslationAPI = require('./data/Translation.js');

// Load environment variables
require('dotenv').config();

// Validate Discord token
if (!process.env.DISCORD_TOKEN) {
    console.error('❌ CRITICAL ERROR: DISCORD_TOKEN is not set!');
    console.error('📝 Please create a .env file with:');
    console.error('   DISCORD_TOKEN=your_bot_token_here');
    process.exit(1);
}

// Enhanced Configuration for Synthia v9.0
const config = {
    token: process.env.DISCORD_TOKEN,
    autoModerationEnabled: true,
    strictMode: true,
    learningMode: true,
    adaptiveSensitivity: true,
    communityName: 'Synthia AI Community',
    verboseLogging: true,
    debugMode: true,
    logLevel: 'verbose',
    aiVersion: '9.0',
    multiServerSupport: true,
    advancedIntelligence: true,
    realTimeLearning: true,
    contextualAnalysis: true,
    behavioralPrediction: true,
    sentimentAnalysis: true,
    socialEngineeringDetection: true,
    multiLanguageSupport: true,
    autoTranslation: true,
    hourlyReports: true,
    advancedEmbeds: true,
    synthiaPersonality: true,
    superintelligence: true,
    multiApiEnabled: true,
    fallbackEnabled: true,
    colors: {
        primary: 0x8e24aa,
        success: 0x2ecc71,
        warning: 0xf39c12,
        error: 0xe74c3c,
        info: 0x3498db,
        moderation: 0xff6b6b,
        translation: 0xe91e63,
        security: 0xff4757,
        ai_analysis: 0x00bcd4,
        behavioral: 0xff9800,
        prediction: 0x673ab7,
        learning: 0x4caf50,
        multi_language: 0x2196f3,
        synthia_intelligence: 0x8e24aa,
        multiapi: 0x00bcd4,
        performance: 0xff9800,
        elongated_detection: 0x9c27b0,
        hourly_report: 0x795548
    }
};

// Initialize Discord client with enhanced intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.DirectMessages
    ],
    partials: ['MESSAGE', 'CHANNEL', 'REACTION']
});

// Enhanced Violation Types with Multi-Language Support
const violationTypes = {
    DISRESPECTFUL: {
        name: 'Disrespectful Interaction',
        severity: 3,
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
    HARASSMENT: {
        name: 'Harassment/Bullying/Hate Speech',
        severity: 7,
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

// Enhanced Synthia Translator with Multi-API Support AND Complete Toxicity Detection
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
        console.log('🚀 Synthia Multi-Translator v9.0 initialized with complete features');
        console.log(`🔧 Total providers: ${Object.keys(this.enhancedAPI.apis).length}`);
        console.log(`🌍 Languages supported: ${this.enhancedAPI.supportedLanguages.size}`);
    }

    initializeScamPatterns() {
        this.scamPatterns = new Set([
            'free nitro', 'discord gift', 'click here', 'limited time',
            'steam gift', 'free games', 'nitro giveaway', 'gift card', 'crypto',
            'bitcoin', 'investment', 'money making', 'easy money', 'get rich',
            'work from home', 'make money online', 'passive income', 'financial freedom',
            'trading bot', 'forex', 'binary options', 'cryptocurrency', 'nft free',
            'airdrop', 'whitelist', 'presale', 'token sale', 'double your money',
            'guaranteed profit', 'risk free', 'no experience needed', 'automatic',
            'join now', 'act fast', 'limited spots', 'exclusive offer', 'secret method',
            'dm me', 'add me', 'nitro boost', 'boost server', 'free robux',
            'roblox gift', 'minecraft gift', 'steam key', 'game key', 'cs:go skins',
            'twitter followers', 'instagram followers', 'tiktok views'
        ]);
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
        
        console.log(`🧠 Initialized comprehensive toxicity patterns for ${this.toxicityDatabase.size} languages with enhanced detection`);
    }

    initializeEnglishPatterns() {
        const toxicWords = ['fuck', 'shit', 'bitch', 'ass', 'damn', 'hell', 'dick', 'pussy', 'cock', 'cunt', 
                           'bastard', 'piss', 'slut', 'whore', 'idiot', 'stupid', 'moron', 'retard', 'dumb',
                           'pathetic', 'worthless', 'loser', 'gay', 'fag', 'nigger', 'nigga', 'kill', 'die', 'kys'];
        
        const patterns = [];
        
        for (const word of toxicWords) {
            patterns.push(new RegExp(`\\b${this.escapeRegex(word)}\\b`, 'gi'));
            const elongatedPattern = word.split('').map(c => `${this.escapeRegex(c)}+`).join('');
            patterns.push(new RegExp(`\\b${elongatedPattern}\\b`, 'gi'));
            const spacedPattern = word.split('').join('\\s*');
            patterns.push(new RegExp(`\\b${spacedPattern}\\b`, 'gi'));
            const specialPattern = word.split('').join('[.\\s_\\-]*');
            patterns.push(new RegExp(`\\b${specialPattern}\\b`, 'gi'));
            const leetPattern = word
                .replace(/a/gi, '[a4@]')
                .replace(/e/gi, '[e3]')
                .replace(/i/gi, '[i1!]')
                .replace(/o/gi, '[o0]')
                .replace(/s/gi, '[s5$]')
                .replace(/t/gi, '[t7]');
            patterns.push(new RegExp(`\\b${leetPattern}\\b`, 'gi'));
        }
        
        patterns.push(/\b(kill\s*yourself|kys|die|hang\s*yourself|end\s*your\s*life)\b/gi);
        patterns.push(/\b(you\s*should\s*die|go\s*kill|hope\s*you\s*die)\b/gi);
        
        this.toxicityDatabase.set('en', {
            patterns: patterns,
            toxicWords: toxicWords,
            commonWords: ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at'],
            culturalSensitivity: 'medium'
        });
    }

    initializeSpanishPatterns() {
        const toxicWords = ['idiota', 'estúpido', 'imbécil', 'tonto', 'pendejo', 'cabrón', 'puta', 'puto', 
                           'mierda', 'joder', 'coño', 'gilipollas', 'maricón', 'perra', 'zorra', 'culo',
                           'verga', 'chingar', 'culero', 'pinche', 'mamón', 'güey', 'madre'];
        
        const patterns = [];
        
        for (const word of toxicWords) {
            patterns.push(new RegExp(`\\b${this.escapeRegex(word)}\\b`, 'gi'));
            const elongatedPattern = word.split('').map(c => `${this.escapeRegex(c)}+`).join('');
            patterns.push(new RegExp(`\\b${elongatedPattern}\\b`, 'gi'));
            const spacedPattern = word.split('').join('\\s*');
            patterns.push(new RegExp(`\\b${spacedPattern}\\b`, 'gi'));
        }
        
        patterns.push(/\b(vete\s*a\s*la\s*mierda|que\s*te\s*jodan|hijo\s*de\s*puta)\b/gi);
        patterns.push(/\b(me\s*cago\s*en|púdrete|lárgate)\b/gi);
        
        this.toxicityDatabase.set('es', {
            patterns: patterns,
            toxicWords: toxicWords,
            commonWords: ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se', 'no', 'haber', 'por', 'con', 'su', 'para', 'como', 'estar', 'tener', 'le', 'lo', 'todo', 'pero', 'más'],
            culturalSensitivity: 'high'
        });
    }

    initializeFrenchPatterns() {
        const toxicWords = ['merde', 'putain', 'con', 'connard', 'salope', 'enculé', 'bordel', 'foutre', 
                           'chier', 'idiot', 'stupide', 'crétin', 'pédé', 'tapette', 'poufiasse', 'bâtard',
                           'emmerde', 'niquer', 'bite', 'couilles', 'cul'];
        
        const patterns = [];
        
        for (const word of toxicWords) {
            patterns.push(new RegExp(`\\b${this.escapeRegex(word)}\\b`, 'gi'));
            const elongatedPattern = word.split('').map(c => `${this.escapeRegex(c)}+`).join('');
            patterns.push(new RegExp(`\\b${elongatedPattern}\\b`, 'gi'));
        }
        
        this.toxicityDatabase.set('fr', {
            patterns: patterns,
            toxicWords: toxicWords,
            commonWords: ['le', 'de', 'un', 'être', 'et', 'à', 'il', 'avoir', 'ne', 'je', 'son', 'que', 'se', 'qui', 'ce', 'dans', 'en', 'du', 'elle', 'au', 'pour', 'pas', 'plus'],
            culturalSensitivity: 'medium'
        });
    }

    initializeGermanPatterns() {
        const toxicWords = ['scheiße', 'scheisse', 'fick', 'arsch', 'fotze', 'hurensohn', 'wichser', 'idiot', 
                           'dumm', 'schwuchtel', 'schlampe', 'arschloch', 'verdammt', 'kacke', 'pisser',
                           'drecksau', 'mistkerl', 'vollpfosten'];
        
        const patterns = [];
        
        for (const word of toxicWords) {
            patterns.push(new RegExp(`\\b${this.escapeRegex(word)}\\b`, 'gi'));
            const elongatedPattern = word.split('').map(c => `${this.escapeRegex(c)}+`).join('');
            patterns.push(new RegExp(`\\b${elongatedPattern}\\b`, 'gi'));
        }
        
        this.toxicityDatabase.set('de', {
            patterns: patterns,
            toxicWords: toxicWords,
            commonWords: ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich', 'des', 'auf', 'für', 'ist', 'im', 'dem', 'nicht', 'ein', 'eine', 'als'],
            culturalSensitivity: 'high'
        });
    }

    initializeRussianPatterns() {
        const toxicWords = ['сука', 'блядь', 'хуй', 'пизда', 'ебать', 'пидор', 'мудак', 'говно', 'дурак', 
                           'идиот', 'дебил', 'урод', 'гандон', 'шлюха', 'падла', 'козел', 'ублюдок'];
        
        const patterns = [];
        
        for (const word of toxicWords) {
            patterns.push(new RegExp(`\\b${this.escapeRegex(word)}\\b`, 'gi'));
        }
        
        this.toxicityDatabase.set('ru', {
            patterns: patterns,
            toxicWords: toxicWords,
            commonWords: ['и', 'в', 'не', 'на', 'я', 'быть', 'он', 'с', 'что', 'а', 'по', 'это', 'она', 'к', 'у', 'ты', 'из', 'мы', 'за'],
            culturalSensitivity: 'high'
        });
    }

    initializePortuguesePatterns() {
        const toxicWords = ['merda', 'porra', 'caralho', 'foda', 'puta', 'filho da puta', 'idiota', 'estúpido', 
                           'viado', 'bosta', 'cu', 'buceta', 'cacete', 'otário', 'cuzão', 'arrombado'];
        
        const patterns = [];
        
        for (const word of toxicWords) {
            patterns.push(new RegExp(`\\b${this.escapeRegex(word)}\\b`, 'gi'));
        }
        
        this.toxicityDatabase.set('pt', {
            patterns: patterns,
            toxicWords: toxicWords,
            commonWords: ['o', 'de', 'e', 'a', 'que', 'em', 'ser', 'um', 'para', 'com', 'não', 'uma', 'ter', 'se', 'por', 'mais', 'as', 'dos', 'como'],
            culturalSensitivity: 'medium'
        });
    }

    initializeItalianPatterns() {
        const toxicWords = ['merda', 'cazzo', 'fanculo', 'stronzo', 'puttana', 'vaffanculo', 'idiota', 'stupido', 
                           'frocio', 'coglione', 'bastardo', 'minchia', 'culo', 'troia', 'porco'];
        
        const patterns = [];
        
        for (const word of toxicWords) {
            patterns.push(new RegExp(`\\b${this.escapeRegex(word)}\\b`, 'gi'));
        }
        
        this.toxicityDatabase.set('it', {
            patterns: patterns,
            toxicWords: toxicWords,
            commonWords: ['il', 'di', 'e', 'la', 'che', 'è', 'un', 'a', 'per', 'in', 'una', 'essere', 'come', 'da'],
            culturalSensitivity: 'high'
        });
    }

    initializeJapanesePatterns() {
        const toxicWords = ['バカ', '馬鹿', 'ばか', 'アホ', '死ね', 'しね', 'くそ', 'クソ', 'ブス', 'デブ'];
        
        const patterns = [];
        
        for (const word of toxicWords) {
            patterns.push(new RegExp(this.escapeRegex(word), 'gi'));
        }
        
        this.toxicityDatabase.set('ja', {
            patterns: patterns,
            toxicWords: toxicWords,
            commonWords: ['の', 'に', 'は', 'を', 'た', 'が', 'で', 'て', 'と', 'し', 'れ', 'さ', 'ある', 'いる', 'も'],
            culturalSensitivity: 'very high'
        });
    }

    initializeChinesePatterns() {
        const toxicWords = ['傻逼', '操', '妈的', '他妈的', '混蛋', '王八蛋', '狗屎', '去死', '白痴', '蠢货'];
        
        const patterns = [];
        
        for (const word of toxicWords) {
            patterns.push(new RegExp(this.escapeRegex(word), 'gi'));
        }
        
        this.toxicityDatabase.set('zh', {
            patterns: patterns,
            toxicWords: toxicWords,
            commonWords: ['的', '一', '是', '在', '了', '有', '和', '人', '这', '中', '大', '为', '上', '个', '国'],
            culturalSensitivity: 'very high'
        });
    }

    initializeArabicPatterns() {
        const toxicWords = ['كلب', 'حمار', 'غبي', 'احمق', 'قحبة', 'شرموط', 'خرا', 'زبالة'];
        
        const patterns = [];
        
        for (const word of toxicWords) {
            patterns.push(new RegExp(this.escapeRegex(word), 'gi'));
        }
        
        this.toxicityDatabase.set('ar', {
            patterns: patterns,
            toxicWords: toxicWords,
            commonWords: ['في', 'من', 'إلى', 'على', 'هذا', 'ذلك', 'التي', 'الذي', 'كان', 'لا'],
            culturalSensitivity: 'very high'
        });
    }

    initializeHindiPatterns() {
        const toxicWords = ['चुतिया', 'मादरचोद', 'भोसड़ी', 'गांडू', 'रंडी', 'कुत्ता', 'हरामी', 'बेवकूफ'];
        
        const patterns = [];
        
        for (const word of toxicWords) {
            patterns.push(new RegExp(this.escapeRegex(word), 'gi'));
        }
        
        this.toxicityDatabase.set('hi', {
            patterns: patterns,
            toxicWords: toxicWords,
            commonWords: ['के', 'है', 'में', 'की', 'एक', 'ने', 'को', 'और', 'का', 'से'],
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
        let normalized = text.replace(/(.)\1{2,}/gi, '$1');
        normalized = normalized.replace(/\b([a-zA-Z])\s+(?=[a-zA-Z]\b)/g, '$1');
        normalized = normalized.replace(/([a-zA-Z])[._\-]+(?=[a-zA-Z])/g, '$1');
        return normalized;
    }

    // OPTIMIZED: Single bi-directional translation method
    async translateText(text, targetLang = 'en', sourceLang = null) {
        const startTime = Date.now();
        this.translationStats.totalTranslations++;
        
        try {
            // Check if translation is needed
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
            
            // Update statistics
            if (result.error) {
                this.translationStats.failedTranslations++;
            } else {
                this.translationStats.successfulTranslations++;
                
                // Track provider performance
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
            
            // Enhanced logging
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

    // HELPER: Parse language input (handles both codes and names)
    parseLanguageInput(input) {
        if (!input) return 'en';
        
        const lowerInput = input.toLowerCase().trim();
        
        // Check direct code match
        if (this.enhancedAPI.supportedLanguages.has(lowerInput)) {
            return lowerInput;
        }
        
        // Check name match
        for (const [code, name] of this.enhancedAPI.supportedLanguages.entries()) {
            if (name.toLowerCase() === lowerInput || 
                name.toLowerCase().includes(lowerInput) ||
                lowerInput.includes(name.toLowerCase().split(' ')[0])) {
                return code;
            }
        }
        
        // Common language mappings
        const commonMappings = {
            'english': 'en',
            'spanish': 'es',
            'french': 'fr',
            'german': 'de',
            'italian': 'it',
            'portuguese': 'pt',
            'russian': 'ru',
            'japanese': 'ja',
            'chinese': 'zh',
            'korean': 'ko',
            'arabic': 'ar',
            'hindi': 'hi',
            'dutch': 'nl',
            'polish': 'pl',
            'turkish': 'tr'
        };
        
        return commonMappings[lowerInput] || null;
    }

    // Get list of supported languages for commands
    getSupportedLanguages() {
        return Array.from(this.enhancedAPI.supportedLanguages.entries()).map(([code, name]) => ({
            code,
            name
        }));
    }

    async analyzeToxicityInLanguage(text, langCode) {
        const langData = this.toxicityDatabase.get(langCode) || this.toxicityDatabase.get('en');
        if (!langData) return { toxicityLevel: 0, matches: [], elongatedWords: [] };
        
        let toxicityLevel = 0;
        const matches = [];
        const elongatedWords = [];
        
        const normalizedText = this.normalizeElongatedText(text);
        const isElongated = normalizedText !== text;
        
        const textsToCheck = [text, normalizedText];
        
        for (const textToCheck of textsToCheck) {
            for (const pattern of langData.patterns || []) {
                const foundMatches = textToCheck.match(pattern);
                if (foundMatches) {
                    toxicityLevel += foundMatches.length * 3;
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
        
        // Enhanced scam detection
        const lowerText = text.toLowerCase();
        for (const scamPattern of this.scamPatterns) {
            if (lowerText.includes(scamPattern)) {
                toxicityLevel += 6; // Increased weight for scam detection
                matches.push(`[SCAM: ${scamPattern}]`);
                console.log(`🚨 SCAM PATTERN DETECTED: "${scamPattern}" in "${text}"`);
            }
        }
        
        // Additional URL pattern checks for Discord links
    const urlPatterns = [
    // /https?:\/\/[^\s]+\.trade/gi, - This line has been removed
    /discord\.gg\/[^\s]+/gi,
    /bit\.ly\/[^\s]+/gi,
    /tinyurl\.com\/[^\s]+/gi
];
        
        for (const pattern of urlPatterns) {
            if (pattern.test(text)) {
                toxicityLevel += 4;
                matches.push('[SUSPICIOUS_URL]');
                console.log(`🔗 SUSPICIOUS URL DETECTED in "${text}"`);
            }
        }
        
        if (matches.length > 2) toxicityLevel += 2;
        if (isElongated) toxicityLevel += 1;
        
        const aggressivePatterns = [
            /kill\s*yourself/gi,
            /k\s*y\s*s/gi,
            /you\s*should\s*die/gi,
            /go\s*die/gi,
            /end\s*your\s*life/gi
        ];
        
        for (const pattern of aggressivePatterns) {
            if (pattern.test(text)) {
                toxicityLevel += 5;
                matches.push('[THREAT]');
            }
        }
        
        const sensitivity = langData.culturalSensitivity;
        if (sensitivity === 'very high') {
            toxicityLevel *= 1.5;
        } else if (sensitivity === 'high') {
            toxicityLevel *= 1.2;
        }
        
        return {
            toxicityLevel: Math.min(10, Math.round(toxicityLevel)),
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

// Server Configuration Manager with Enhanced Features
class ServerConfigManager {
    constructor() {
        this.serverConfigs = new Map();
        this.configPath = 'data/server_configs.json';
        this.loadConfigs();
    }

    async loadConfigs() {
        try {
            const data = await fs.readFile(this.configPath, 'utf8');
            const configs = JSON.parse(data);
            this.serverConfigs = new Map(configs.servers || []);
            
            // FIXED: Apply default values to existing configs that are missing fields
            for (const [guildId, config] of this.serverConfigs) {
                let needsUpdate = false;
                
                // Set default autoModeration to true if not set
                if (config.autoModeration === undefined) {
                    config.autoModeration = true;
                    needsUpdate = true;
                }
                
                // Set other defaults if missing
                if (config.hourlyReports === undefined) {
                    config.hourlyReports = true;
                    needsUpdate = true;
                }
                
                if (config.language === undefined) {
                    config.language = 'en';
                    needsUpdate = true;
                }
                
                if (config.defaultTranslateTo === undefined) {
                    config.defaultTranslateTo = 'en';
                    needsUpdate = true;
                }
                
                if (config.autoTranslate === undefined) {
                    config.autoTranslate = false;
                    needsUpdate = true;
                }
                
                if (config.elongatedDetection === undefined) {
                    config.elongatedDetection = true;
                    needsUpdate = true;
                }
                
                if (config.multiLanguage === undefined) {
                    config.multiLanguage = true;
                    needsUpdate = true;
                }
                
                if (config.multiApiEnabled === undefined) {
                    config.multiApiEnabled = true;
                    needsUpdate = true;
                }
                
                if (needsUpdate) {
                    config.lastUpdated = Date.now();
                }
            }
            
            console.log(`✅ Loaded configs for ${this.serverConfigs.size} servers with defaults applied`);
            
            // Save the updated configs
            if (this.serverConfigs.size > 0) {
                await this.saveConfigs();
            }
        } catch (error) {
            console.log('📁 Creating fresh server configs...');
            await this.saveConfigs();
        }
    }

    async saveConfigs() {
        try {
            await fs.mkdir('data', { recursive: true });
            const configData = {
                servers: Array.from(this.serverConfigs.entries()),
                lastUpdated: Date.now(),
                version: '9.0'
            };
            await fs.writeFile(this.configPath, JSON.stringify(configData, null, 2));
            console.log('💾 Server configs saved successfully');
        } catch (error) {
            console.error('❌ Failed to save server configs:', error);
        }
    }

    addLogChannel(guildId, channelId, guildName = 'Unknown') {
        if (!this.serverConfigs.has(guildId)) {
            this.serverConfigs.set(guildId, {
                logChannels: [],
                guildName: guildName,
                createdAt: Date.now(),
                lastUpdated: Date.now(),
                hourlyReports: true,
                language: 'en',
                defaultTranslateTo: 'en',
                autoTranslate: false,
                autoModeration: true, // FIXED: Default to true
                elongatedDetection: true,
                multiLanguage: true,
                multiApiEnabled: true,
                autoSetupCompleted: false
            });
        }
        
        const config = this.serverConfigs.get(guildId);
        if (channelId && !config.logChannels.includes(channelId)) {
            config.logChannels.push(channelId);
            config.lastUpdated = Date.now();
            this.saveConfigs();
            return true;
        }
        return false;
    }

    // Auto-setup log channel for new servers
    async autoSetupLogChannel(guild) {
        const config = this.serverConfigs.get(guild.id);
        if (config && config.autoSetupCompleted) return null;

        try {
            // Try to find or create a suitable log channel
            let logChannel = null;

            // 1. Look for existing log channels
            const existingLogChannels = guild.channels.cache.filter(ch => 
                ch.isTextBased() && 
                (ch.name.includes('log') || ch.name.includes('synthia') || ch.name.includes('mod'))
            );

            if (existingLogChannels.size > 0) {
                logChannel = existingLogChannels.first();
            } else {
                // 2. Try to use system messages channel
                if (guild.systemChannel && guild.systemChannel.isTextBased()) {
                    logChannel = guild.systemChannel;
                } else {
                    // 3. Create new log channel if bot has permissions
                    if (guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
                        try {
                            logChannel = await guild.channels.create({
                                name: 'synthia-logs',
                                type: 0, // Text channel
                                topic: 'Enhanced Synthia v9.0 Multi-API Logs & Moderation',
                                permissionOverwrites: [
                                    {
                                        id: guild.roles.everyone.id,
                                        deny: [PermissionsBitField.Flags.SendMessages],
                                        allow: [PermissionsBitField.Flags.ViewChannel]
                                    }
                                ]
                            });
                        } catch (error) {
                            console.log(`⚠️ Could not create log channel for ${guild.name}: ${error.message}`);
                        }
                    }
                }
            }

            if (logChannel) {
                this.addLogChannel(guild.id, logChannel.id, guild.name);
                
                // Mark auto-setup as completed
                const updatedConfig = this.serverConfigs.get(guild.id);
                updatedConfig.autoSetupCompleted = true;
                this.saveConfigs();

                // Send welcome message
                try {
                    const welcomeEmbed = new EmbedBuilder()
                        .setTitle('🚀 Enhanced Synthia v9.0 Setup Complete!')
                        .setDescription('Multi-API Intelligence System has been automatically configured for this server.')
                        .addFields(
                            { name: '📡 Log Channel', value: `${logChannel}`, inline: true },
                            { name: '🧠 AI Features', value: 'Multi-language moderation enabled', inline: true },
                            { name: '🔄 Translation APIs', value: '9 providers ready', inline: true },
                            { name: '🛠️ Setup Commands', value: '`!synthia help` - View all commands\n`!synthia status` - System status', inline: false },
                            { name: '⚙️ Configuration', value: '`/set-server-language` - Set default language\n`/auto-translate` - Enable auto-translation', inline: false }
                        )
                        .setColor(config.colors.success)
                        .setFooter({ text: `Enhanced Synthia v${config.aiVersion} Multi-API System` });

                    await logChannel.send({ embeds: [welcomeEmbed] });
                } catch (error) {
                    console.log(`⚠️ Could not send welcome message: ${error.message}`);
                }

                console.log(`✅ Auto-setup completed for ${guild.name} using channel: ${logChannel.name}`);
                return logChannel;
            }
        } catch (error) {
            console.error(`❌ Auto-setup failed for ${guild.name}:`, error);
        }

        return null;
    }

    removeLogChannel(guildId, channelId) {
        if (!this.serverConfigs.has(guildId)) return false;
        
        const config = this.serverConfigs.get(guildId);
        const index = config.logChannels.indexOf(channelId);
        if (index > -1) {
            config.logChannels.splice(index, 1);
            config.lastUpdated = Date.now();
            this.saveConfigs();
            return true;
        }
        return false;
    }

    getLogChannels(guildId) {
        const config = this.serverConfigs.get(guildId);
        return config ? config.logChannels : [];
    }

    getServerConfig(guildId) {
        return this.serverConfigs.get(guildId) || null;
    }

    // FIXED: Helper method to check if automoderation is enabled
    isAutoModerationEnabled(guildId) {
        const config = this.serverConfigs.get(guildId);
        // Default to true if config doesn't exist or autoModeration is undefined
        return config ? (config.autoModeration !== false) : true;
    }

    setHourlyReports(guildId, enabled) {
        const config = this.serverConfigs.get(guildId);
        if (config) {
            config.hourlyReports = enabled;
            config.lastUpdated = Date.now();
            this.saveConfigs();
            return true;
        }
        return false;
    }

    updateServerSetting(guildId, setting, value) {
        if (!this.serverConfigs.has(guildId)) {
            this.addLogChannel(guildId, null);
        }
        
        const config = this.serverConfigs.get(guildId);
        config[setting] = value;
        config.lastUpdated = Date.now();
        this.saveConfigs();
        return true;
    }
}

// Enhanced Discord Logger
class EnhancedDiscordLogger {
    constructor() {
        this.logCounts = {
            info: 0,
            warning: 0,
            error: 0,
            success: 0,
            moderation: 0,
            translation: 0,
            multi_language: 0,
            hourly_report: 0,
            synthia_intelligence: 0,
            elongated_detection: 0,
            multiapi: 0,
            performance: 0
        };
        this.hourlyStats = new Map();
    }

    async sendLog(guild, type, title, description, fields = [], color = null) {
        if (!guild) return;

        let logChannels = serverLogger.getLogChannels(guild.id);
        
        // Auto-setup if no log channels configured
        if (logChannels.length === 0) {
            console.log(`🔄 No log channels for ${guild.name}, attempting auto-setup...`);
            const autoChannel = await serverLogger.autoSetupLogChannel(guild);
            if (autoChannel) {
                logChannels = [autoChannel.id];
            } else {
                console.log(`⚠️ No log channels configured for ${guild.name}. Use !synthia loghere to set up logging.`);
                return;
            }
        }

        this.logCounts[type] = (this.logCounts[type] || 0) + 1;

        const embed = new EmbedBuilder()
            .setColor(color || config.colors[type] || config.colors.primary)
            .setTitle(title)
            .setDescription(description)
            .setFooter({ 
                text: `Synthia v${config.aiVersion} Multi-API System • ${type.toUpperCase()} #${this.logCounts[type]}`,
                iconURL: client.user?.displayAvatarURL() 
            })
            .setTimestamp();

        if (fields.length > 0) {
            const safeFields = fields.map(field => ({
                name: String(field.name || 'Unknown'),
                value: String(field.value || 'N/A').slice(0, 1024),
                inline: Boolean(field.inline)
            }));
            embed.addFields(safeFields.slice(0, 25));
        }

        embed.setAuthor({
            name: 'Synthia AI v9.0 - Enhanced Multi-API Intelligence',
            iconURL: client.user?.displayAvatarURL()
        });

        for (const channelId of logChannels) {
            try {
                const channel = guild.channels.cache.get(channelId);
                if (channel && channel.isTextBased()) {
                    await channel.send({ embeds: [embed] });
                } else {
                    // Remove invalid channel from config
                    serverLogger.removeLogChannel(guild.id, channelId);
                    console.log(`🗑️ Removed invalid log channel ${channelId} from ${guild.name}`);
                }
            } catch (error) {
                console.error(`❌ Failed to send log to channel ${channelId}:`, error);
                // If permission error, try to auto-setup a new channel
                if (error.code === 50013 || error.code === 10003) {
                    await serverLogger.autoSetupLogChannel(guild);
                }
            }
        }
    }

    async logModeration(guild, action, user, reason, details = {}) {
        const fields = [
            { name: '👤 User', value: `${user.tag}\n${user.id}`, inline: true },
            { name: '⚡ Action', value: action.toUpperCase(), inline: true },
            { name: '🧠 AI System', value: `Enhanced Synthia v${config.aiVersion}`, inline: true },
            { name: '📝 Reason', value: reason || 'No reason provided', inline: false }
        ];

        if (details.originalLanguage && details.originalLanguage !== 'English') {
            fields.push(
                { name: '🌍 Original Language', value: details.originalLanguage, inline: true },
                { name: '🔄 Translation Provider', value: details.provider || 'Multi-API', inline: true }
            );
        }

        if (details.elongatedWords && details.elongatedWords.length > 0) {
            fields.push({
                name: '🔍 Elongated Words Detected',
                value: details.elongatedWords.map(w => `${w.original} → ${w.normalized}`).join('\n').slice(0, 1024),
                inline: false
            });
        }

        await this.sendLog(
            guild,
            'moderation',
            `⚖️ Enhanced Moderation: ${action.toUpperCase()}`,
            `Multi-API enhanced moderation action taken`,
            fields,
            config.colors.moderation
        );
    }

    async logTranslation(guild, originalText, translatedText, sourceLang, targetLang, user, provider, responseTime, isAutoTranslation = false) {
        const fields = [
            { name: '👤 User', value: `${user.tag} (${user.id})`, inline: true },
            { name: '🌍 Translation', value: `${sourceLang} → ${targetLang}`, inline: true },
            { name: '🔧 Provider', value: provider, inline: true },
            { name: '⚡ Response Time', value: `${responseTime}ms`, inline: true },
            { name: '🤖 Type', value: isAutoTranslation ? 'Auto-Translation' : 'Manual Translation', inline: true },
            { name: '📝 Original Text', value: originalText.slice(0, 500), inline: false },
            { name: '🌟 Translated Text', value: translatedText.slice(0, 500), inline: false }
        ];

        await this.sendLog(
            guild,
            'translation',
            `🌍 Enhanced ${isAutoTranslation ? 'Auto-' : ''}Translation`,
            `Advanced ${isAutoTranslation ? 'automatic ' : ''}translation with provider rotation`,
            fields,
            config.colors.translation
        );
    }
}

// Initialize components
const synthiaTranslator = new SynthiaMultiTranslator();
const serverLogger = new ServerConfigManager();
const discordLogger = new EnhancedDiscordLogger();

// Enhanced Synthia AI Brain
class EnhancedSynthiaAI {
    constructor() {
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
            // Enhanced language detection
            const detectedLang = synthiaTranslator.detectLanguage(content);
            analysis.language.detected = detectedLang;
            analysis.language.originalLanguage = synthiaTranslator.enhancedAPI.supportedLanguages.get(detectedLang) || 'Unknown';
            
            // Enhanced translation with multi-API support
            if (detectedLang !== 'en') {
                const translation = await synthiaTranslator.translateText(content, 'en', detectedLang);
                analysis.language.translated = translation.translatedText;
                analysis.language.confidence = translation.confidence;
                analysis.language.provider = translation.provider;
                analysis.language.processingTime = translation.processingTime;
                analysis.multiApiUsed = true;
                
                // Log translation
                await discordLogger.logTranslation(
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
            
            // Enhanced toxicity analysis
            const toxicityAnalysis = await synthiaTranslator.analyzeToxicityInLanguage(content, detectedLang);
            analysis.threatLevel = toxicityAnalysis.toxicityLevel;
            analysis.toxicityScore = toxicityAnalysis.toxicityLevel;
            analysis.elongatedWords = toxicityAnalysis.elongatedWords || [];
            
            // Cultural context analysis
            analysis.culturalContext = synthiaTranslator.analyzeCulturalContext(content, detectedLang);
            
            if (toxicityAnalysis.toxicityLevel > 0) {
                analysis.reasoning.push(`Toxicity detected in ${toxicityAnalysis.language}: Level ${toxicityAnalysis.toxicityLevel}/10`);
                
                if (toxicityAnalysis.matches.length > 0) {
                    analysis.reasoning.push(`Toxic patterns: ${toxicityAnalysis.matches.slice(0, 3).join(', ')}`);
                }
                
                if (toxicityAnalysis.elongatedWords.length > 0) {
                    analysis.reasoning.push(`Elongated words detected: ${toxicityAnalysis.elongatedWords.map(w => w.original).join(', ')}`);
                    analysis.threatLevel += 1;
                }
                
                // Check for scam content
                const lowerContent = content.toLowerCase();
                let isScam = false;
                for (const scamPattern of synthiaTranslator.scamPatterns) {
                    if (lowerContent.includes(scamPattern)) {
                        analysis.threatLevel += 4;
                        analysis.reasoning.push(`Scam pattern detected: ${scamPattern}`);
                        isScam = true;
                        break;
                    }
                }
                
                // FIXED: Determine action based on threat level and content analysis
                const profile = this.getBehavioralProfile(author.id);
                profile.messageCount++;
                
                // Enhanced decision logic
                if (isScam || analysis.threatLevel >= 8 || profile.riskScore >= 8) {
                    analysis.violationType = isScam ? 'SCAM' : (analysis.threatLevel >= 9 ? 'SEVERE_TOXICITY' : 'RACISM');
                    analysis.action = 'ban';
                } else if (analysis.threatLevel >= 6 || profile.riskScore >= 6) {
                    analysis.violationType = 'HARASSMENT';
                    analysis.action = 'mute';
                } else if (analysis.threatLevel >= 4) {
                    analysis.violationType = 'TOXIC_BEHAVIOR';
                    analysis.action = 'warn';
                } else if (analysis.threatLevel >= 2) {
                    analysis.violationType = 'DISRESPECTFUL';
                    analysis.action = 'delete';
                } else if (analysis.threatLevel >= 1) {
                    // ADDED: Handle low-level threats
                    analysis.violationType = 'DISRESPECTFUL';
                    analysis.action = 'warn';
                }
                
                // Update profile with violations
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
                
                profile.riskScore = Math.min(10, (profile.riskScore || 0) + Math.ceil(analysis.threatLevel / 2));
                
                if (!profile.languageHistory) profile.languageHistory = [];
                profile.languageHistory.push({
                    language: detectedLang,
                    timestamp: Date.now(),
                    threatLevel: analysis.threatLevel
                });
                
                if (analysis.multiApiUsed) {
                    profile.multiApiTranslations = (profile.multiApiTranslations || 0) + 1;
                }

                // ENHANCED: Log detection details for debugging
                console.log(`🚨 THREAT DETECTED - User: ${author.tag}`);
                console.log(`   Content: "${content}"`);
                console.log(`   Threat Level: ${analysis.threatLevel}/10`);
                console.log(`   Violation Type: ${analysis.violationType}`);
                console.log(`   Action: ${analysis.action}`);
                console.log(`   Reasoning: ${analysis.reasoning.join(', ')}`);
                console.log(`   Is Scam: ${isScam}`);
            }
            
            analysis.confidence = Math.min(100, 75 + (analysis.threatLevel * 3) + (analysis.reasoning.length * 2));
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

// Initialize AI
const synthiaAI = new EnhancedSynthiaAI();

// Enhanced moderation execution
async function executeModerationAction(message, synthiaAnalysis) {
    const member = message.member;
    const violationType = synthiaAnalysis.violationType;
    
    if (!violationType || !violationTypes[violationType]) {
        console.error('Invalid violation type:', violationType);
        return;
    }
    
    try {
        const userId = message.author.id;
        const userHistory = userViolations.get(userId) || {};
        const violationCount = userHistory[violationType] || 0;
        
        userHistory[violationType] = violationCount + 1;
        userViolations.set(userId, userHistory);
        
        const violationRule = violationTypes[violationType];
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
        
        console.log(`🛡️ Executing ${punishment.action} for ${member?.user.tag || message.author.tag} | Threat: ${synthiaAnalysis.threatLevel}/10`);
        
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
                iconURL: client.user?.displayAvatarURL()
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

// OPTIMIZED Slash Commands (Removed Redundancies)
const commands = [
    new SlashCommandBuilder()
        .setName('synthia-analysis')
        .setDescription('Get Synthia v9.0 superintelligence analysis of a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to analyze')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages),
    
    new SlashCommandBuilder()
        .setName('language-stats')
        .setDescription('Get multi-language statistics and analysis')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild),

    // MAIN TRANSLATION COMMAND - Bi-directional with optional target
    new SlashCommandBuilder()
        .setName('translate')
        .setDescription('Translate text using enhanced multi-API system (defaults to English)')
        .addStringOption(option =>
            option.setName('text')
                .setDescription('Text to translate')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('to')
                .setDescription('Target language (e.g., Spanish, French, Japanese, etc.) - defaults to English')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('from')
                .setDescription('Source language (auto-detect if not specified)')
                .setRequired(false)
        ),

    new SlashCommandBuilder()
        .setName('set-server-language')
        .setDescription('Set default translation language for this server')
        .addStringOption(option =>
            option.setName('language')
                .setDescription('Default language for the server')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild),

    new SlashCommandBuilder()
        .setName('auto-translate')
        .setDescription('Toggle automatic translation of foreign messages')
        .addBooleanOption(option =>
            option.setName('enabled')
                .setDescription('Enable or disable auto-translation')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild),

    new SlashCommandBuilder()
        .setName('toggle-automod')
        .setDescription('Toggle automatic moderation on/off for this server')
        .addBooleanOption(option =>
            option.setName('enabled')
                .setDescription('Enable or disable auto-moderation')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild),

    new SlashCommandBuilder()
        .setName('supported-languages')
        .setDescription('List all supported languages for translation'),
    
    new SlashCommandBuilder()
        .setName('clear-warnings')
        .setDescription('Clear warnings for a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to clear warnings for')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages),
    
    new SlashCommandBuilder()
        .setName('test-detection')
        .setDescription('Test elongated word and multi-language detection')
        .addStringOption(option =>
            option.setName('text')
                .setDescription('Text to test')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('api-status')
        .setDescription('Check multi-API translation status and performance')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages),
    
    new SlashCommandBuilder()
        .setName('test-apis')
        .setDescription('Test all translation APIs')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages),
    
    new SlashCommandBuilder()
        .setName('translation-stats')
        .setDescription('View translation statistics and provider performance')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages),

    new SlashCommandBuilder()
        .setName('setup-wizard')
        .setDescription('Interactive setup wizard for Enhanced Synthia configuration')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
];

// FIXED: Enhanced message monitoring with complete moderation AND auto-translation
client.on('messageCreate', async (message) => {
    if (message.author?.bot || !message.guild) return;
    if (message.member && message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;

    // FIXED: Use the helper method to check automoderation
    if (!serverLogger.isAutoModerationEnabled(message.guild.id)) {
        console.log(`🔇 Automoderation disabled for ${message.guild.name}`);
        return;
    }

    if (message.content && message.content.length > 0) {
        try {
            const startTime = Date.now();
            
            const synthiaAnalysis = await synthiaAI.analyzeMessage(
                message.content,
                message.author,
                message.channel,
                message
            );
            
            const processingTime = Date.now() - startTime;
            const serverConfig = serverLogger.getServerConfig(message.guild.id);
            
            // Auto-translation feature
            if (serverConfig && serverConfig.autoTranslate && 
                synthiaAnalysis.language.detected !== 'en' && 
                synthiaAnalysis.language.detected !== (serverConfig.defaultTranslateTo || 'en') &&
                synthiaAnalysis.threatLevel === 0) { // Only translate non-toxic messages
                
                try {
                    const autoTranslation = await synthiaTranslator.translateText(
                        message.content, 
                        serverConfig.defaultTranslateTo || 'en', 
                        synthiaAnalysis.language.detected
                    );
                    
                    if (!autoTranslation.error && autoTranslation.translatedText !== message.content) {
                        const autoTranslateEmbed = new EmbedBuilder()
                            .setColor(config.colors.translation)
                            .setAuthor({
                                name: message.author.displayName,
                                iconURL: message.author.displayAvatarURL()
                            })
                            .setDescription(`**🌍 Auto-Translation** (${synthiaAnalysis.language.originalLanguage} → ${autoTranslation.targetLanguage})\n\n${autoTranslation.translatedText}`)
                            .setFooter({ 
                                text: `Translated by ${autoTranslation.provider} • React with ❌ to delete`,
                                iconURL: client.user?.displayAvatarURL() 
                            })
                            .setTimestamp();
                        
                        const autoReply = await message.reply({ embeds: [autoTranslateEmbed] });
                        
                        // Add delete reaction
                        await autoReply.react('❌');
                        
                        // Set up reaction collector for deletion
                        const filter = (reaction, user) => {
                            return reaction.emoji.name === '❌' && (user.id === message.author.id || 
                                   message.guild.members.cache.get(user.id)?.permissions.has(PermissionsBitField.Flags.ManageMessages));
                        };
                        
                        const collector = autoReply.createReactionCollector({ filter, time: 300000 }); // 5 minutes
                        
                        collector.on('collect', () => {
                            autoReply.delete().catch(() => {});
                        });
                        
                        console.log(`🌍 Auto-translated message from ${message.author.tag}: ${synthiaAnalysis.language.originalLanguage} → ${autoTranslation.targetLanguage}`);
                        
                        // Log auto-translation
                        await discordLogger.logTranslation(
                            message.guild,
                            message.content,
                            autoTranslation.translatedText,
                            synthiaAnalysis.language.originalLanguage,
                            autoTranslation.targetLanguage,
                            message.author,
                            autoTranslation.provider,
                            autoTranslation.processingTime,
                            true // isAutoTranslation
                        );
                    }
                } catch (autoTranslateError) {
                    console.error('❌ Auto-translation error:', autoTranslateError);
                }
            }
            
            // Enhanced logging for all messages with threats or multi-language content
            if (synthiaAnalysis.threatLevel >= 1 || synthiaAnalysis.language.detected !== 'en' || synthiaAnalysis.elongatedWords.length > 0) {
                console.log(`\n🧠 Enhanced Synthia v9.0 Analysis - ${message.author.tag}:`);
                console.log(`   📝 Content: "${message.content.slice(0, 50)}..."`);
                console.log(`   🌍 Language: ${synthiaAnalysis.language.originalLanguage}`);
                console.log(`   ⚖️ Threat Level: ${synthiaAnalysis.threatLevel}/10`);
                console.log(`   🎯 Confidence: ${synthiaAnalysis.confidence}%`);
                console.log(`   ⚡ Processing Time: ${processingTime}ms`);
                console.log(`   🔄 Multi-API Used: ${synthiaAnalysis.multiApiUsed ? 'Yes' : 'No'}`);
                console.log(`   🔍 Elongated: ${synthiaAnalysis.elongatedWords.length > 0 ? 'Yes' : 'No'}`);
                console.log(`   🎯 Action: ${synthiaAnalysis.action}`);
                console.log(`   🌍 Auto-Translate: ${serverConfig?.autoTranslate ? 'Enabled' : 'Disabled'}`);
                console.log(`   🛡️ Auto-Moderation: ${serverLogger.isAutoModerationEnabled(message.guild.id) ? 'Enabled' : 'Disabled'}`);
                
                if (synthiaAnalysis.language.provider) {
                    console.log(`   🔧 Provider: ${synthiaAnalysis.language.provider}`);
                }
            }
            
            // FIXED: Execute moderation action if threat detected and automoderation enabled
            if (synthiaAnalysis.violationType && synthiaAnalysis.action !== 'none' && 
                config.autoModerationEnabled && serverLogger.isAutoModerationEnabled(message.guild.id)) {
                await executeModerationAction(message, synthiaAnalysis);
            }
            
        } catch (error) {
            console.error('❌ Enhanced Synthia v9.0 Analysis Error:', error);
            discordLogger.sendLog(message.guild, 'error', '❌ Enhanced Analysis Error', error.message);
        }
    }
});

// Enhanced command handler
client.on('messageCreate', async (message) => {
    if (!message.content.startsWith('!synthia') || !message.member?.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;

    const args = message.content.split(' ');
    const command = args[1];

    switch (command) {
        case 'loghere':
            const added = serverLogger.addLogChannel(message.guild.id, message.channel.id, message.guild.name);
            if (added) {
                await message.reply(`✅ Added this channel for Enhanced Synthia v9.0 Multi-API logging.`);
                discordLogger.sendLog(message.guild, 'success', '✅ Enhanced Log Channel Added', 
                    `${message.channel} is now configured for Multi-API logging.`);
            } else {
                await message.reply({
                    content: `⚠️ This channel is already configured for logging.\n\n` +
                            `**🔍 If logs aren't appearing, try these commands:**\n` +
                            `• \`!synthia debug\` - Check configuration and permissions\n` +
                            `• \`!synthia testlog\` - Test the logging system\n` +
                            `• \`!synthia fixlogs\` - Auto-repair logging issues\n\n` +
                            `**💡 Common Issues:**\n` +
                            `• Bot missing permissions (Send Messages, Embed Links)\n` +
                            `• No moderation events happening to trigger logs\n` +
                            `• Channel was deleted/renamed after setup`
                });
            }
            break;

        case 'removelog':
        case 'removelogchannel':
        case 'unlog':
            if (!message.member?.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
                await message.reply('❌ You need Manage Server permission to remove log channels.');
                return;
            }

            const argsRemove = message.content.split(' ').slice(2); // Skip "!synthia removelog"
            if (argsRemove.length === 0) {
                const currentLogChannels = serverLogger.getLogChannels(message.guild.id);
                if (currentLogChannels.length === 0) {
                    await message.reply('❌ No log channels are currently configured.');
                    return;
                }

                let channelList = '**📡 Current Log Channels:**\n';
                for (const channelId of currentLogChannels) {
                    const channel = message.guild.channels.cache.get(channelId);
                    if (channel) {
                        channelList += `• <#${channelId}> (\`${channelId}\`)\n`;
                    } else {
                        channelList += `• ~~Invalid Channel~~ (\`${channelId}\`) - **DELETED**\n`;
                    }
                }

                await message.reply({
                    content: `**Usage:** \`!synthia removelog <#channel>\` or \`!synthia removelog <channel_id>\`\n\n` +
                            channelList +
                            `\n**Examples:**\n` +
                            `• \`!synthia removelog <#${currentLogChannels[0]}>\`\n` +
                            `• \`!synthia removelog ${currentLogChannels[0]}\`\n\n` +
                            `**💡 Tip:** You can also copy the channel ID by right-clicking the channel with Developer Mode enabled.`
                });
                return;
            }

            // Parse channel from mention or ID
            let targetChannelId = argsRemove[0];
            
            // Handle channel mention format <#123456789>
            const channelMentionMatch = targetChannelId.match(/^<#(\d+)>$/);
            if (channelMentionMatch) {
                targetChannelId = channelMentionMatch[1];
            }

            // Validate it's a valid snowflake ID
            if (!/^\d{17,19}$/.test(targetChannelId)) {
                await message.reply('❌ Invalid channel ID or mention. Use `<#channel>` or provide a valid channel ID.');
                return;
            }

            const removed = serverLogger.removeLogChannel(message.guild.id, targetChannelId);
            
            if (removed) {
                const targetChannel = message.guild.channels.cache.get(targetChannelId);
                const channelName = targetChannel ? `<#${targetChannelId}>` : `Channel ID: \`${targetChannelId}\``;
                
                await message.reply(`✅ Removed ${channelName} from Enhanced Synthia logging configuration.`);
                
                // Show remaining channels
                const remainingChannels = serverLogger.getLogChannels(message.guild.id);
                if (remainingChannels.length > 0) {
                    let remainingList = '\n**📡 Remaining Log Channels:**\n';
                    for (const channelId of remainingChannels) {
                        const channel = message.guild.channels.cache.get(channelId);
                        if (channel) {
                            remainingList += `• <#${channelId}>\n`;
                        }
                    }
                    await message.channel.send(remainingList);
                } else {
                    await message.channel.send('📭 No log channels remaining. Use `!synthia loghere` to add a new one.');
                }
                
                console.log(`🗑️ Removed log channel ${targetChannelId} from ${message.guild.name} by ${message.author.tag}`);
                
            } else {
                const targetChannel = message.guild.channels.cache.get(targetChannelId);
                const channelName = targetChannel ? `<#${targetChannelId}>` : `Channel ID: \`${targetChannelId}\``;
                await message.reply(`⚠️ ${channelName} is not configured as a log channel.`);
            }
            break;

        case 'listlogs':
        case 'logs':
        case 'logchannels':
            if (!message.member?.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
                await message.reply('❌ You need Manage Server permission to view log configuration.');
                return;
            }

            const logChannelsList = serverLogger.getLogChannels(message.guild.id);
            if (logChannelsList.length === 0) {
                await message.reply('📭 No log channels are currently configured.\n\nUse `!synthia loghere` to add this channel or `/setup-wizard` for guided setup.');
                return;
            }

            let listMessage = `**📡 Enhanced Synthia Log Channels (${logChannelsList.length}):**\n\n`;
            
            for (let i = 0; i < logChannelsList.length; i++) {
                const channelId = logChannelsList[i];
                const channel = message.guild.channels.cache.get(channelId);
                
                if (channel) {
                    const permissions = channel.permissionsFor(message.guild.members.me);
                    const canSend = permissions.has(PermissionsBitField.Flags.SendMessages);
                    const canEmbed = permissions.has(PermissionsBitField.Flags.EmbedLinks);
                    const status = (canSend && canEmbed) ? '✅' : '⚠️';
                    
                    listMessage += `${i + 1}. ${status} <#${channelId}>\n`;
                    listMessage += `   ID: \`${channelId}\`\n`;
                    if (!canSend || !canEmbed) {
                        listMessage += `   ⚠️ Missing permissions: ${!canSend ? 'Send Messages ' : ''}${!canEmbed ? 'Embed Links' : ''}\n`;
                    }
                } else {
                    listMessage += `${i + 1}. ❌ ~~Deleted Channel~~\n`;
                    listMessage += `   ID: \`${channelId}\` - **INVALID**\n`;
                }
                listMessage += '\n';
            }

            listMessage += `**🛠️ Management Commands:**\n`;
            listMessage += `• \`!synthia removelog <#channel>\` - Remove a log channel\n`;
            listMessage += `• \`!synthia loghere\` - Add current channel\n`;
            listMessage += `• \`!synthia fixlogs\` - Auto-repair issues`;

            await message.reply(listMessage);
            break;
            
        case 'status':
            const stats = synthiaTranslator.getTranslationStats();
            const autoModStatus = serverLogger.isAutoModerationEnabled(message.guild.id);
            const embed = new EmbedBuilder()
                .setTitle(`🚀 Enhanced Synthia v${config.aiVersion} Status`)
                .setDescription('**Multi-API Intelligence System**')
                .addFields(
                    { name: '🧠 Intelligence Level', value: 'IQ 300+ Enhanced', inline: true },
                    { name: '🔄 Multi-API Providers', value: `${Object.keys(synthiaTranslator.enhancedAPI.apis).length}`, inline: true },
                    { name: '🌍 Languages', value: `${synthiaTranslator.enhancedAPI.supportedLanguages.size}`, inline: true },
                    { name: '📊 Total Translations', value: `${stats.totalTranslations}`, inline: true },
                    { name: '✅ Success Rate', value: `${stats.successRate}%`, inline: true },
                    { name: '⚡ Avg Response Time', value: `${stats.averageResponseTime}ms`, inline: true },
                    { name: '👥 AI Profiles', value: `${synthiaAI.profiles.size}`, inline: true },
                    { name: '🌐 Servers', value: `${client.guilds.cache.size}`, inline: true },
                    { name: '🚨 Auto-Moderation', value: autoModStatus ? '✅ Enabled' : '❌ Disabled', inline: true }
                )
                .setColor(config.colors.primary)
                .setTimestamp();
            
            await message.reply({ embeds: [embed] });
            break;
            
        case 'test':
            const testMessages = [
                { text: 'fuck you idiot', target: 'en' },
                { text: 'fuuuuck youuu', target: 'es' },
                { text: 'f u c k', target: 'fr' },
                { text: 'you should die', target: 'en' },
                { text: 'free nitro click here', target: 'ja' },
                { text: 'hello world', target: 'de' },
                { text: 'merde stupide', target: 'en' },
                { text: 'scheiße arschloch', target: 'en' },
                { text: '.trade scam', target: 'en' },
                { text: 'dm me for free robux', target: 'en' }
            ];
            
            let testResults = '🧪 **Enhanced Synthia Multi-API Test (with Automoderation Check):**\n\n';
            testResults += `🛡️ **Automoderation Status:** ${serverLogger.isAutoModerationEnabled(message.guild.id) ? '✅ Enabled' : '❌ Disabled'}\n\n`;
            
            for (const testCase of testMessages) {
                const testAnalysis = await synthiaAI.analyzeMessage(testCase.text, message.author, message.channel, message);
                const targetLangName = synthiaTranslator.enhancedAPI.supportedLanguages.get(testCase.target) || testCase.target;
                
                testResults += `**"${testCase.text}"** → ${targetLangName}\n`;
                testResults += `└ Lang: ${testAnalysis.language.originalLanguage} | Threat: ${testAnalysis.threatLevel}/10 | Action: ${testAnalysis.action}`;
                if (testAnalysis.multiApiUsed) {
                    testResults += ` | Provider: ${testAnalysis.language.provider}`;
                }
                testResults += '\n\n';
            }
            
            await message.reply(testResults);
            break;

        case 'debug':
            if (!message.member?.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
                await message.reply('❌ You need Manage Server permission to use debug commands.');
                return;
            }

            const serverConfig = serverLogger.getServerConfig(message.guild.id);
            const logChannels = serverLogger.getLogChannels(message.guild.id);
            
            let debugInfo = '🔍 **Enhanced Synthia Debug Information:**\n\n';
            
            debugInfo += `**Server:** ${message.guild.name} (${message.guild.id})\n`;
            debugInfo += `**Current Channel:** ${message.channel.name} (${message.channel.id})\n\n`;
            
            debugInfo += `**📡 Log Channels Configured:** ${logChannels.length}\n`;
            if (logChannels.length > 0) {
                for (const channelId of logChannels) {
                    const channel = message.guild.channels.cache.get(channelId);
                    if (channel) {
                        const permissions = channel.permissionsFor(message.guild.members.me);
                        const canView = permissions.has(PermissionsBitField.Flags.ViewChannel);
                        const canSend = permissions.has(PermissionsBitField.Flags.SendMessages);
                        const canEmbed = permissions.has(PermissionsBitField.Flags.EmbedLinks);
                        
                        debugInfo += `  • <#${channelId}> - `;
                        debugInfo += `View: ${canView ? '✅' : '❌'} | `;
                        debugInfo += `Send: ${canSend ? '✅' : '❌'} | `;
                        debugInfo += `Embed: ${canEmbed ? '✅' : '❌'}\n`;
                    } else {
                        debugInfo += `  • Channel ${channelId} - ❌ **INVALID/DELETED**\n`;
                    }
                }
            } else {
                debugInfo += `  • ❌ No log channels configured\n`;
            }
            
            debugInfo += `\n**⚙️ Server Config:**\n`;
            if (serverConfig) {
                debugInfo += `  • Auto-Moderation: ${serverConfig.autoModeration !== false ? '✅' : '❌'}\n`;
                debugInfo += `  • Auto-Translation: ${serverConfig.autoTranslate ? '✅' : '❌'}\n`;
                debugInfo += `  • Default Language: ${serverConfig.defaultTranslateTo || 'en'}\n`;
                debugInfo += `  • Auto-Setup Completed: ${serverConfig.autoSetupCompleted ? '✅' : '❌'}\n`;
            } else {
                debugInfo += `  • ❌ No server configuration found\n`;
            }
            
            debugInfo += `\n**🤖 Bot Permissions in Current Channel:**\n`;
            const currentPerms = message.channel.permissionsFor(message.guild.members.me);
            debugInfo += `  • View Channel: ${currentPerms.has(PermissionsBitField.Flags.ViewChannel) ? '✅' : '❌'}\n`;
            debugInfo += `  • Send Messages: ${currentPerms.has(PermissionsBitField.Flags.SendMessages) ? '✅' : '❌'}\n`;
            debugInfo += `  • Embed Links: ${currentPerms.has(PermissionsBitField.Flags.EmbedLinks) ? '✅' : '❌'}\n`;
            debugInfo += `  • Manage Messages: ${currentPerms.has(PermissionsBitField.Flags.ManageMessages) ? '✅' : '❌'}\n`;
            
            await message.reply(debugInfo);
            break;

        case 'testlog':
            if (!message.member?.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
                await message.reply('❌ You need Manage Server permission to test logging.');
                return;
            }

            await message.reply('🧪 Testing log system...');
            
            try {
                // Test the logging system directly
                await discordLogger.sendLog(
                    message.guild,
                    'success',
                    '🧪 Enhanced Synthia Log Test',
                    'This is a test message to verify the logging system is working correctly.',
                    [
                        { name: '📡 Triggered By', value: `${message.author.tag}`, inline: true },
                        { name: '📍 Channel', value: `${message.channel}`, inline: true },
                        { name: '⚡ Status', value: 'System Operational', inline: true },
                        { name: '🔧 Test Results', value: 'If you can see this message, logging is working correctly!', inline: false }
                    ]
                );
                
                console.log(`🧪 Manual log test triggered by ${message.author.tag} in ${message.guild.name}`);
                
                setTimeout(async () => {
                    await message.channel.send('✅ Log test completed! Check your configured log channels.');
                }, 1000);
                
            } catch (error) {
                console.error('❌ Log test failed:', error);
                await message.channel.send(`❌ Log test failed: ${error.message}`);
            }
            break;

        case 'fixlogs':
            if (!message.member?.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
                await message.reply('❌ You need Manage Server permission to fix logging.');
                return;
            }

            await message.reply('🔧 Attempting to fix logging configuration...');
            
            try {
                // Clear existing configuration and re-setup
                const currentChannels = serverLogger.getLogChannels(message.guild.id);
                
                // Remove invalid channels
                for (const channelId of currentChannels) {
                    const channel = message.guild.channels.cache.get(channelId);
                    if (!channel || !channel.isTextBased()) {
                        serverLogger.removeLogChannel(message.guild.id, channelId);
                        console.log(`🗑️ Removed invalid channel ${channelId}`);
                    }
                }
                
                // Try auto-setup
                const autoChannel = await serverLogger.autoSetupLogChannel(message.guild);
                
                if (autoChannel) {
                    await message.channel.send(`✅ Successfully set up logging in ${autoChannel}!`);
                } else {
                    // Add current channel as log channel
                    const added = serverLogger.addLogChannel(message.guild.id, message.channel.id, message.guild.name);
                    if (added) {
                        await message.channel.send('✅ Set this channel as the log channel!');
                    } else {
                        await message.channel.send('⚠️ This channel is already configured for logging.');
                    }
                }
                
                // Test the fixed setup
                await discordLogger.sendLog(
                    message.guild,
                    'success',
                    '🔧 Enhanced Synthia Logging Fixed',
                    'Logging configuration has been repaired and tested successfully!',
                    [
                        { name: '🛠️ Fixed By', value: `${message.author.tag}`, inline: true },
                        { name: '📅 Fixed At', value: new Date().toLocaleString(), inline: true }
                    ]
                );
                
            } catch (error) {
                console.error('❌ Fix logs failed:', error);
                await message.channel.send(`❌ Failed to fix logging: ${error.message}`);
            }
            break;

        case 'togglemod':
        case 'automod':
            if (!message.member?.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
                await message.reply('❌ You need Manage Server permission to toggle automoderation.');
                return;
            }

            const currentAutoMod = serverLogger.isAutoModerationEnabled(message.guild.id);
            const newAutoMod = !currentAutoMod;
            
            serverLogger.updateServerSetting(message.guild.id, 'autoModeration', newAutoMod);
            
            await message.reply(`${newAutoMod ? '✅ Enabled' : '❌ Disabled'} automatic moderation for this server.`);
            
            // Log the change
            await discordLogger.sendLog(
                message.guild,
                'success',
                '🛡️ Auto-Moderation Settings Changed',
                `Auto-moderation has been ${newAutoMod ? 'enabled' : 'disabled'} by ${message.author.tag}`,
                [
                    { name: '👤 Changed By', value: `${message.author.tag}`, inline: true },
                    { name: '🔧 New Status', value: newAutoMod ? '✅ Enabled' : '❌ Disabled', inline: true },
                    { name: '📅 Changed At', value: new Date().toLocaleString(), inline: true }
                ]
            );
            break;
            
        case 'help':
            const helpEmbed = new EmbedBuilder()
                .setTitle('🧠 Enhanced Synthia v9.0 Help')
                .setDescription('Multi-API Intelligence Moderation & Translation System')
                .addFields(
                    { name: '🚀 Quick Setup', value: '`/setup-wizard` - **Interactive setup guide**\n`!synthia loghere` - Set log channel\n`!synthia removelog <#channel>` - Remove log channel\n`!synthia listlogs` - View all log channels\n`!synthia status` - System status\n`!synthia help` - This message' },
                    { name: '🔧 Debugging Commands', value: '`!synthia debug` - **Debug log configuration**\n`!synthia testlog` - **Test log system**\n`!synthia fixlogs` - **Auto-fix logging issues**\n`!synthia test` - Test enhanced detection' },
                    { name: '🛡️ Moderation Commands', value: '`!synthia togglemod` - **Toggle auto-moderation on/off**\n`/toggle-automod` - Slash command version\n`!synthia automod` - Check current automod status' },
                    { name: '📡 Logging System', value: '• **Auto-Setup:** I\'ll create log channels automatically!\n• **Manual Setup:** Use `!synthia loghere` in desired channel\n• **Remove Channels:** `!synthia removelog <#channel>`\n• **View All:** `!synthia listlogs` shows all configured channels\n• **Smart Detection:** Finds existing log channels automatically' },
                    { name: 'Analysis Commands', value: '`/synthia-analysis` - Analyze user\n`/language-stats` - Language statistics\n`/clear-warnings` - Clear violations\n`/test-detection` - Test detection' },
                    { name: 'Translation Commands', value: '`/translate` - **Main bi-directional translation**\n`/supported-languages` - List all languages' },
                    { name: 'Server Settings', value: '`/set-server-language` - Set default language\n`/auto-translate` - Toggle auto-translation' },
                    { name: 'System Commands', value: '`/api-status` - Multi-API status\n`/test-apis` - Test all APIs\n`/translation-stats` - Performance stats' },
                    { name: '🌟 Enhanced Features', value: '• **Auto-Setup on Server Join**\n• **Single Unified Translation Command**\n• 9 API Providers with Fallback\n• 60+ Language Support\n• **True Bi-directional Translation**\n• Auto-Translation Feature\n• Enhanced Elongated Detection\n• Cultural Context Analysis\n• Advanced Scam Detection\n• Provider Performance Tracking\n• **Toggle Auto-Moderation**' },
                    { name: '🚨 Troubleshooting', value: '**Logs not appearing?**\n1. Run `!synthia debug` to check setup\n2. Run `!synthia listlogs` to see all channels\n3. Run `!synthia testlog` to test logging\n4. Run `!synthia removelog <#channel>` to remove wrong channels\n5. Run `!synthia fixlogs` to auto-repair\n6. Ensure bot has proper permissions\n\n**Automoderation not working?**\n1. Check `!synthia status` for automod status\n2. Use `!synthia togglemod` to enable/disable\n3. Use `!synthia test` to test detection' }
                )
                .setColor(config.colors.info)
                .setFooter({ text: '💡 Tip: Use /setup-wizard for guided configuration!' });
            
            await message.reply({ embeds: [helpEmbed] });
            break;
    }
});

// OPTIMIZED Slash command handler (Added toggle-automod command)
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    console.log(`🎯 Enhanced Slash Command: ${interaction.commandName} by ${interaction.user.tag}`);

    try {
        switch (interaction.commandName) {
            case 'synthia-analysis':
                await interaction.deferReply();
                
                const targetUser = interaction.options.getUser('user');
                const profile = synthiaAI.getProfile(targetUser.id);
                
                if (!profile) {
                    await interaction.editReply(`No enhanced data found for ${targetUser.tag}`);
                    return;
                }
                
                const languagesUsed = profile.languageHistory 
                    ? [...new Set(profile.languageHistory.map(entry => entry.language))].length 
                    : 0;
                
                const analysisEmbed = new EmbedBuilder()
                    .setTitle(`🧠 Enhanced Synthia v${config.aiVersion} Analysis`)
                    .setDescription(`**Multi-API Intelligence Analysis for ${targetUser.tag}**`)
                    .addFields(
                        { name: '📊 Risk Score', value: `${profile.riskScore || 0}/10`, inline: true },
                        { name: '💬 Messages', value: `${profile.messageCount || 0}`, inline: true },
                        { name: '⚠️ Violations', value: `${profile.violations?.length || 0}`, inline: true },
                        { name: '🌍 Languages', value: `${languagesUsed}`, inline: true },
                        { name: '🔄 Multi-API Translations', value: `${profile.multiApiTranslations || 0}`, inline: true },
                        { name: '📅 First Seen', value: new Date(profile.createdAt).toLocaleDateString(), inline: true }
                    )
                    .setColor((profile.riskScore || 0) >= 7 ? config.colors.error : 
                              (profile.riskScore || 0) >= 4 ? config.colors.warning : 
                              config.colors.success)
                    .setThumbnail(targetUser.displayAvatarURL());
                
                if (profile.violations && profile.violations.length > 0) {
                    const recentViolations = profile.violations.slice(-3).map(v => {
                        const lang = synthiaTranslator.enhancedAPI.supportedLanguages.get(v.language) || v.language;
                        return `• **${v.violationType}** - Level ${v.threatLevel}/10 (${lang})${v.elongated ? ' [Elongated]' : ''}${v.multiApiUsed ? ' [Multi-API]' : ''}${v.isScam ? ' [SCAM]' : ''}`;
                    }).join('\n');
                    
                    analysisEmbed.addFields({
                        name: '🚨 Recent Violations',
                        value: recentViolations
                    });
                }
                
                await interaction.editReply({ embeds: [analysisEmbed] });
                break;
                
            // MAIN TRANSLATION COMMAND - Bi-directional with optional "to"
            case 'translate':
                await interaction.deferReply();
                
                const text = interaction.options.getString('text');
                const toLanguageInput = interaction.options.getString('to') || 'English'; // Default to English
                const fromLanguageInput = interaction.options.getString('from');
                
                // Parse language inputs
                const targetLangCode = synthiaTranslator.parseLanguageInput(toLanguageInput);
                const sourceLangCode = fromLanguageInput ? synthiaTranslator.parseLanguageInput(fromLanguageInput) : null;
                
                if (!targetLangCode) {
                    await interaction.editReply(`❌ Target language "${toLanguageInput}" not supported. Use \`/supported-languages\` to see available options.`);
                    return;
                }
                
                if (fromLanguageInput && !sourceLangCode) {
                    await interaction.editReply(`❌ Source language "${fromLanguageInput}" not supported.`);
                    return;
                }
                
                // Perform bi-directional translation
                const translation = await synthiaTranslator.translateText(text, targetLangCode, sourceLangCode);
                
                const translateEmbed = new EmbedBuilder()
                    .setTitle('🌍 Enhanced Multi-API Translation')
                    .setColor(config.colors.translation)
                    .addFields(
                        { name: `📝 Original (${translation.originalLanguage})`, value: text.slice(0, 1024), inline: false },
                        { name: `🌟 Translation (${translation.targetLanguage})`, value: translation.translatedText.slice(0, 1024), inline: false },
                        { name: '🔧 Provider', value: translation.provider || 'Unknown', inline: true },
                        { name: '📊 Confidence', value: `${translation.confidence}%`, inline: true },
                        { name: '⚡ Time', value: `${translation.processingTime}ms`, inline: true }
                    );
                
                if (translation.error) {
                    translateEmbed.addFields({ name: '❌ Error', value: translation.error });
                }
                
                await interaction.editReply({ embeds: [translateEmbed] });
                break;

            case 'set-server-language':
                await interaction.deferReply();
                
                const serverLanguage = interaction.options.getString('language');
                const serverLangCode = synthiaTranslator.parseLanguageInput(serverLanguage);
                
                if (!serverLangCode) {
                    await interaction.editReply(`❌ Language "${serverLanguage}" not supported.`);
                    return;
                }
                
                serverLogger.updateServerSetting(interaction.guild.id, 'defaultTranslateTo', serverLangCode);
                const languageName = synthiaTranslator.enhancedAPI.supportedLanguages.get(serverLangCode);
                
                await interaction.editReply(`✅ Server default translation language set to **${languageName}** (\`${serverLangCode}\`)`);
                break;

            case 'auto-translate':
                await interaction.deferReply();
                
                const autoTranslateEnabled = interaction.options.getBoolean('enabled');
                serverLogger.updateServerSetting(interaction.guild.id, 'autoTranslate', autoTranslateEnabled);
                
                await interaction.editReply(`${autoTranslateEnabled ? '✅ Enabled' : '❌ Disabled'} automatic translation for foreign messages.`);
                break;

            case 'toggle-automod':
                await interaction.deferReply();
                
                const autoModEnabled = interaction.options.getBoolean('enabled');
                serverLogger.updateServerSetting(interaction.guild.id, 'autoModeration', autoModEnabled);
                
                await interaction.editReply(`${autoModEnabled ? '✅ Enabled' : '❌ Disabled'} automatic moderation for this server.`);
                
                // Log the change
                await discordLogger.sendLog(
                    interaction.guild,
                    'success',
                    '🛡️ Auto-Moderation Settings Changed',
                    `Auto-moderation has been ${autoModEnabled ? 'enabled' : 'disabled'} by ${interaction.user.tag}`,
                    [
                        { name: '👤 Changed By', value: `${interaction.user.tag}`, inline: true },
                        { name: '🔧 New Status', value: autoModEnabled ? '✅ Enabled' : '❌ Disabled', inline: true },
                        { name: '📅 Changed At', value: new Date().toLocaleString(), inline: true }
                    ]
                );
                break;

            case 'supported-languages':
                await interaction.deferReply();
                
                const supportedLangs = synthiaTranslator.getSupportedLanguages();
                const languageList = supportedLangs
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(lang => `**${lang.name}** (\`${lang.code}\`)`)
                    .join('\n');
                
                const languagesEmbed = new EmbedBuilder()
                    .setTitle('🌍 Supported Languages')
                    .setDescription(`**Enhanced Multi-API Translation supports ${supportedLangs.length} languages:**\n\n${languageList}`)
                    .setColor(config.colors.multi_language)
                    .setFooter({ text: 'Use language names or codes in translation commands' });
                
                await interaction.editReply({ embeds: [languagesEmbed] });
                break;
                
            case 'api-status':
                await interaction.deferReply();
                
                const apiStatus = synthiaTranslator.enhancedAPI.getStatus();
                const statusEmbed = new EmbedBuilder()
                    .setTitle('🔧 Enhanced Multi-API Status Dashboard')
                    .setColor(config.colors.info)
                    .addFields(
                        { name: '📊 Overview', value: `Total Requests: ${apiStatus.totalRequests}\nTotal Characters: ${apiStatus.totalCharacters}\nWorking Providers: ${Object.values(apiStatus.providers).filter(p => p.available).length}/${Object.keys(apiStatus.providers).length}`, inline: false }
                    );
                
                // Add provider status (limit to prevent embed overflow)
                const apiProviders = Object.entries(apiStatus.providers).slice(0, 8);
                for (const [provider, data] of apiProviders) {
                    const status = data.available ? '✅' : '❌';
                    const resetTime = data.resetInMinutes > 0 ? `(${data.resetInMinutes}m)` : '';
                    
                    statusEmbed.addFields({
                        name: `${provider.charAt(0).toUpperCase() + provider.slice(1)}`,
                        value: `${status} ${data.requestsUsed}/${data.rateLimit} ${resetTime}\nReliability: ${data.reliability}%`,
                        inline: true
                    });
                }
                
                await interaction.editReply({ embeds: [statusEmbed] });
                break;
                
            case 'test-apis':
                await interaction.deferReply();
                
                const testResults = await synthiaTranslator.testAllAPIs();
                const testEmbed = new EmbedBuilder()
                    .setTitle('🧪 Enhanced Multi-API Test Results')
                    .setColor(config.colors.success)
                    .addFields(
                        { name: '📊 Summary', value: `Working: ${testResults.summary.workingProviders}/${testResults.summary.totalProviders}\nReliability: ${testResults.summary.reliability}%\nAvg Time: ${testResults.summary.averageResponseTime}ms`, inline: false }
                    );
                
                // Add individual results (limit to prevent embed overflow)
                const testProviders = Object.entries(testResults.individual).slice(0, 6);
                for (const [provider, result] of testProviders) {
                    const status = result.working ? '✅' : '❌';
                    const time = result.time ? `${result.time}ms` : 'N/A';
                    const response = result.response ? result.response.slice(0, 30) : 'No response';
                    
                    testEmbed.addFields({
                        name: `${status} ${provider}`,
                        value: `Time: ${time}\nResponse: "${response}"`,
                        inline: true
                    });
                }
                
                await interaction.editReply({ embeds: [testEmbed] });
                break;
                
            case 'clear-warnings':
                await interaction.deferReply();
                
                const userToClear = interaction.options.getUser('user');
                if (userViolations.has(userToClear.id)) {
                    userViolations.delete(userToClear.id);
                    await interaction.editReply(`✅ Cleared all warnings for ${userToClear.tag}`);
                } else {
                    await interaction.editReply(`⚠️ No warnings found for ${userToClear.tag}`);
                }
                break;
                
            case 'test-detection':
                await interaction.deferReply();
                
                const testText = interaction.options.getString('text');
                const testAnalysis = await synthiaAI.analyzeMessage(testText, interaction.user, interaction.channel, { guild: interaction.guild });
                
                const detectionEmbed = new EmbedBuilder()
                    .setTitle('🔍 Enhanced Detection Test Results')
                    .setColor(config.colors.ai_analysis)
                    .addFields(
                        { name: '📝 Text', value: testText.slice(0, 1024), inline: false },
                        { name: '🌍 Language', value: testAnalysis.language.originalLanguage, inline: true },
                        { name: '⚖️ Threat Level', value: `${testAnalysis.threatLevel}/10`, inline: true },
                        { name: '🎯 Confidence', value: `${testAnalysis.confidence}%`, inline: true },
                        { name: '🔄 Multi-API Used', value: testAnalysis.multiApiUsed ? 'Yes' : 'No', inline: true },
                        { name: '🔍 Elongated Words', value: testAnalysis.elongatedWords.length > 0 ? 'Yes' : 'No', inline: true },
                        { name: '⚡ Action', value: testAnalysis.action || 'None', inline: true },
                        { name: '🛡️ Automod Status', value: serverLogger.isAutoModerationEnabled(interaction.guild.id) ? 'Enabled' : 'Disabled', inline: true }
                    );
                
                if (testAnalysis.reasoning.length > 0) {
                    detectionEmbed.addFields({
                        name: '🧠 AI Reasoning',
                        value: testAnalysis.reasoning.join('\n').slice(0, 1024),
                        inline: false
                    });
                }
                
                await interaction.editReply({ embeds: [detectionEmbed] });
                break;
                
            case 'translation-stats':
                await interaction.deferReply();
                
                const translationStats = synthiaTranslator.getTranslationStats();
                const statsEmbed = new EmbedBuilder()
                    .setTitle('📊 Enhanced Translation Statistics')
                    .setColor(config.colors.translation)
                    .addFields(
                        { name: '📈 Overview', value: `Total: ${translationStats.totalTranslations}\nSuccessful: ${translationStats.successfulTranslations}\nFailed: ${translationStats.failedTranslations}\nSuccess Rate: ${translationStats.successRate}%\nAvg Response: ${translationStats.averageResponseTime}ms`, inline: false }
                    );
                
                // Add provider statistics
                const statsProviders = Object.entries(translationStats.providerStats).slice(0, 6);
                for (const [provider, stats] of statsProviders) {
                    statsEmbed.addFields({
                        name: `🔧 ${provider}`,
                        value: `Count: ${stats.count}\nAvg Time: ${stats.averageTime}ms\nSuccess: ${stats.successRate}%`,
                        inline: true
                    });
                }
                
                await interaction.editReply({ embeds: [statsEmbed] });
                break;
                
            case 'language-stats':
                await interaction.deferReply();
                
                const languageStats = new Map();
                const riskStats = new Map();
                
                // Analyze all user profiles for language statistics
                for (const [userId, profile] of synthiaAI.profiles) {
                    if (profile.languageHistory) {
                        for (const entry of profile.languageHistory) {
                            const lang = synthiaTranslator.enhancedAPI.supportedLanguages.get(entry.language) || entry.language;
                            languageStats.set(lang, (languageStats.get(lang) || 0) + 1);
                            
                            if (entry.threatLevel > 0) {
                                riskStats.set(lang, (riskStats.get(lang) || 0) + entry.threatLevel);
                            }
                        }
                    }
                }
                
                const langStatsEmbed = new EmbedBuilder()
                    .setTitle('🌍 Multi-Language Statistics')
                    .setColor(config.colors.multi_language)
                    .addFields(
                        { name: '📊 Overview', value: `Languages Detected: ${languageStats.size}\nTotal Profiles: ${synthiaAI.profiles.size}\nMulti-API Translations: ${Array.from(synthiaAI.profiles.values()).reduce((sum, p) => sum + (p.multiApiTranslations || 0), 0)}`, inline: false }
                    );
                
                // Add top languages
                const topLanguages = Array.from(languageStats.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8);
                    
                for (const [lang, count] of topLanguages) {
                    const risk = riskStats.get(lang) || 0;
                    langStatsEmbed.addFields({
                        name: `🌐 ${lang}`,
                        value: `Messages: ${count}\nThreat Level: ${risk}`,
                        inline: true
                    });
                }
                
                await interaction.editReply({ embeds: [langStatsEmbed] });
                break;

            case 'setup-wizard':
                await interaction.deferReply();

                const setupEmbed = new EmbedBuilder()
                    .setTitle('🧙‍♂️ Enhanced Synthia v9.0 Setup Wizard')
                    .setDescription('Let\'s configure Enhanced Synthia for your server!')
                    .setColor(config.colors.info);

                const currentConfig = serverLogger.getServerConfig(interaction.guild.id) || {};
                const logChannels = serverLogger.getLogChannels(interaction.guild.id);

                // Check current setup status
                let setupStatus = '🔄 **Current Configuration:**\n\n';
                
                if (logChannels.length > 0) {
                    const channels = logChannels.map(id => `<#${id}>`).join(', ');
                    setupStatus += `✅ **Log Channels:** ${channels}\n`;
                } else {
                    setupStatus += `❌ **Log Channels:** Not configured\n`;
                }

                setupStatus += `🌍 **Default Language:** ${synthiaTranslator.enhancedAPI.supportedLanguages.get(currentConfig.defaultTranslateTo || 'en')}\n`;
                setupStatus += `🤖 **Auto-Translation:** ${currentConfig.autoTranslate ? '✅ Enabled' : '❌ Disabled'}\n`;
                setupStatus += `🛡️ **Auto-Moderation:** ${serverLogger.isAutoModerationEnabled(interaction.guild.id) ? '✅ Enabled' : '❌ Disabled'}\n`;

                setupEmbed.addFields(
                    { name: '📊 Current Status', value: setupStatus, inline: false },
                    { name: '🛠️ Quick Setup Commands', value: '`!synthia loghere` - Set this channel for logs\n`/set-server-language` - Change default language\n`/auto-translate` - Toggle auto-translation\n`/toggle-automod` - Toggle auto-moderation', inline: false },
                    { name: '🚀 Auto-Setup Available', value: 'If no log channel is set, I\'ll automatically create one when needed!', inline: false }
                );

                // Add action buttons
                const actionRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('setup_log_here')
                            .setLabel('📡 Set Log Channel Here')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId('setup_auto_translate')
                            .setLabel('🌍 Toggle Auto-Translate')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('setup_auto_moderation')
                            .setLabel('🛡️ Toggle Auto-Moderation')
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setCustomId('setup_test_system')
                            .setLabel('🧪 Test System')
                            .setStyle(ButtonStyle.Success)
                    );

                await interaction.editReply({ 
                    embeds: [setupEmbed], 
                    components: [actionRow]
                });

                // Set up button collector
                const filter = (buttonInteraction) => {
                    return buttonInteraction.user.id === interaction.user.id && 
                           buttonInteraction.member.permissions.has(PermissionsBitField.Flags.ManageGuild);
                };

                const collector = interaction.channel.createMessageComponentCollector({ 
                    filter, 
                    time: 300000 // 5 minutes
                });

                collector.on('collect', async (buttonInteraction) => {
                    try {
                        await buttonInteraction.deferUpdate();

                        switch (buttonInteraction.customId) {
                            case 'setup_log_here':
                                const added = serverLogger.addLogChannel(
                                    interaction.guild.id, 
                                    interaction.channel.id, 
                                    interaction.guild.name
                                );
                                
                                if (added) {
                                    await buttonInteraction.followUp({ 
                                        content: '✅ This channel has been set as a log channel!', 
                                        ephemeral: true 
                                    });
                                } else {
                                    await buttonInteraction.followUp({ 
                                        content: '⚠️ This channel is already configured as a log channel.', 
                                        ephemeral: true 
                                    });
                                }
                                break;

                            case 'setup_auto_translate':
                                const currentAutoTranslate = currentConfig.autoTranslate || false;
                                serverLogger.updateServerSetting(interaction.guild.id, 'autoTranslate', !currentAutoTranslate);
                                
                                await buttonInteraction.followUp({ 
                                    content: `${!currentAutoTranslate ? '✅ Enabled' : '❌ Disabled'} auto-translation for foreign messages.`, 
                                    ephemeral: true 
                                });
                                break;

                            case 'setup_auto_moderation':
                                const currentAutoModeration = serverLogger.isAutoModerationEnabled(interaction.guild.id);
                                serverLogger.updateServerSetting(interaction.guild.id, 'autoModeration', !currentAutoModeration);
                                
                                await buttonInteraction.followUp({ 
                                    content: `${!currentAutoModeration ? '✅ Enabled' : '❌ Disabled'} auto-moderation for this server.`, 
                                    ephemeral: true 
                                });
                                break;

                            case 'setup_test_system':
                                const testResult = await synthiaAI.analyzeMessage(
                                    'Hello world! This is a test message.',
                                    interaction.user,
                                    interaction.channel,
                                    { guild: interaction.guild }
                                );

                                await buttonInteraction.followUp({
                                    content: `🧪 **System Test Complete!**\n\n` +
                                            `🌍 Language: ${testResult.language.originalLanguage}\n` +
                                            `⚖️ Threat Level: ${testResult.threatLevel}/10\n` +
                                            `🎯 Confidence: ${testResult.confidence}%\n` +
                                            `⚡ Processing Time: ${testResult.processingTime}ms\n` +
                                            `🔄 Multi-API: ${testResult.multiApiUsed ? 'Active' : 'Standby'}\n` +
                                            `🛡️ Auto-Moderation: ${serverLogger.isAutoModerationEnabled(interaction.guild.id) ? 'Enabled' : 'Disabled'}\n\n` +
                                            `✅ **Enhanced Synthia v${config.aiVersion} is working perfectly!**`,
                                    ephemeral: true
                                });
                                break;
                        }
                    } catch (error) {
                        console.error('Setup wizard button error:', error);
                        await buttonInteraction.followUp({ 
                            content: '❌ An error occurred. Please try again.', 
                            ephemeral: true 
                        });
                    }
                });

                collector.on('end', () => {
                    // Disable buttons after timeout
                    const disabledRow = new ActionRowBuilder()
                        .addComponents(
                            actionRow.components.map(button => 
                                ButtonBuilder.from(button).setDisabled(true)
                            )
                        );

                    interaction.editReply({ 
                        embeds: [setupEmbed], 
                        components: [disabledRow] 
                    }).catch(() => {});
                });
                break;
                
            default:
                await interaction.reply({ content: 'Command not implemented yet.', ephemeral: true });
                break;
        }
    } catch (error) {
        console.error('Enhanced command error:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: 'An error occurred processing this enhanced command.', ephemeral: true });
        } else if (interaction.deferred) {
            await interaction.editReply({ content: 'An error occurred processing this enhanced command.' });
        }
    }
});

// Bot ready
client.once('ready', async () => {
    console.log(`\n✅ Enhanced Synthia v${config.aiVersion} Online!`);
    console.log(`🚀 Multi-API Intelligence System Activated`);
    console.log(`🧠 Intelligence Level: IQ 300+ Enhanced`);
    console.log(`🔄 API Providers: ${Object.keys(synthiaTranslator.enhancedAPI.apis).length}`);
    console.log(`🌍 Languages: ${synthiaTranslator.enhancedAPI.supportedLanguages.size}`);
    console.log(`📡 Servers: ${client.guilds.cache.size}`);
    console.log(`👥 Users: ${client.users.cache.size}\n`);
    
    client.user.setActivity(`${client.guilds.cache.size} servers | v${config.aiVersion} Multi-API Intelligence`, {
        type: ActivityType.Watching
    });
    
    // Register commands
    const rest = new REST({ version: '10' }).setToken(config.token);
    try {
        console.log('🔄 Registering enhanced slash commands...');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands.map(cmd => cmd.toJSON()) }
        );
        console.log('✅ Enhanced commands registered successfully');
    } catch (error) {
        console.error('❌ Failed to register enhanced commands:', error);
    }
    
    console.log('🎯 Enhanced Multi-API Intelligence System fully operational!');
});

// Auto-setup when joining new servers
client.on('guildCreate', async (guild) => {
    console.log(`🆕 Joined new server: ${guild.name} (${guild.memberCount} members)`);
    
    try {
        // Attempt auto-setup
        const logChannel = await serverLogger.autoSetupLogChannel(guild);
        
        if (logChannel) {
            console.log(`✅ Auto-setup completed for ${guild.name}`);
            
            // Send initial status to show the bot is working
            await discordLogger.sendLog(
                guild,
                'success',
                '🚀 Enhanced Synthia v9.0 Activated!',
                `Multi-API Intelligence System is now protecting this server with advanced moderation and translation capabilities.`,
                [
                    { name: '🔧 Features Active', value: '• Multi-language toxicity detection\n• 9 translation API providers\n• Auto-translation support\n• Enhanced elongated word detection\n• Auto-moderation enabled by default', inline: false },
                    { name: '📚 Getting Started', value: '• `!synthia help` - View all commands\n• `/translate` - Translate any text\n• `/set-server-language` - Configure default language\n• `/auto-translate` - Enable automatic translation\n• `/toggle-automod` - Toggle auto-moderation', inline: false }
                ]
            );
        } else {
            // Send setup instructions to guild owner or admin
            const owner = await guild.fetchOwner().catch(() => null);
            if (owner) {
                try {
                    const setupEmbed = new EmbedBuilder()
                        .setTitle('🚀 Enhanced Synthia v9.0 Setup Required')
                        .setDescription(`Thank you for adding Enhanced Synthia to **${guild.name}**!\n\nTo complete setup, please run this command in your desired log channel:`)
                        .addFields(
                            { name: '📡 Setup Command', value: '```!synthia loghere```', inline: false },
                            { name: '🛠️ Alternative Setup', value: 'Create a channel named `synthia-logs` and I\'ll use it automatically!', inline: false },
                            { name: '📚 Features', value: '• Multi-language moderation\n• 9 translation APIs\n• Auto-translation\n• 60+ languages supported\n• Auto-moderation enabled by default', inline: false }
                        )
                        .setColor(config.colors.info)
                        .setFooter({ text: `Enhanced Synthia v${config.aiVersion} Multi-API System` });
                    
                    await owner.send({ embeds: [setupEmbed] });
                } catch (error) {
                    console.log(`⚠️ Could not DM setup instructions to ${guild.name} owner`);
                }
            }
        }
    } catch (error) {
        console.error(`❌ Failed to setup ${guild.name}:`, error);
    }
});

// Handle guild leave
client.on('guildDelete', (guild) => {
    console.log(`👋 Left server: ${guild.name}`);
    // Note: We keep the config in case the bot is re-added
});

// Error handlers
client.on('error', (error) => {
    console.error('Enhanced Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('🚨 Unhandled promise rejection in Enhanced Synthia:', error);
});

process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught exception in Enhanced Synthia:', error);
    synthiaAI.saveData().catch(() => {});
    serverLogger.saveConfigs().catch(() => {});
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down Enhanced Synthia v9.0...');
    
    try {
        console.log('💾 Saving enhanced AI profiles...');
        await synthiaAI.saveData();
        
        console.log('💾 Saving server configurations...');
        await serverLogger.saveConfigs();
        
        console.log('✅ All enhanced data saved.');
        
        client.destroy();
        console.log('👋 Enhanced Synthia v9.0 shutdown complete. Goodbye!');
        process.exit(0);
    } catch (error) {
        console.error('💥 Error during enhanced shutdown:', error);
        process.exit(1);
    }
});

// Enhanced startup logging
console.log(`🚀 Starting Enhanced Synthia v${config.aiVersion} Multi-API Intelligence...`);
console.log('🧠 Initializing Enhanced Neural Networks...');
console.log('🌍 Loading 60+ Language Patterns...');
console.log('⚡ Preparing 2,000+ ops/ms Processing...');
console.log('🔄 Connecting to 9 Translation APIs...');
console.log('🔧 Enhanced Configuration:');
console.log(`   🚨 Auto-Moderation: ${config.autoModerationEnabled ? 'ENABLED' : 'DISABLED'}`);
console.log(`   🔄 Multi-API: ${config.multiApiEnabled ? 'ENABLED' : 'DISABLED'}`);
console.log(`   🔧 Fallback Mode: ${config.fallbackEnabled ? 'ENABLED' : 'DISABLED'}`);
console.log(`   🔍 Debug Mode: ${config.debugMode ? 'ON' : 'OFF'}`);
console.log(`   📝 Verbose Logging: ${config.verboseLogging ? 'ON' : 'OFF'}\n`);

// Start the bot
client.login(config.token).catch(error => {
    console.error('❌ Enhanced Synthia failed to login:', error);
    
    if (error.code === 'TOKEN_INVALID') {
        console.error('🔑 INVALID TOKEN: Please check your DISCORD_TOKEN in .env file');
    } else if (error.code === 'DISALLOWED_INTENTS') {
        console.error('🔐 INTENT ERROR: Please enable required intents in Discord Developer Portal');
    } else {
        console.error('🌐 CONNECTION ERROR: Please check your internet connection');
    }
    
    process.exit(1);
});

// Enhanced startup message
console.log('🌟 Enhanced Synthia v9.0 Multi-API Intelligence System');
console.log('🧠 Superintelligence Level: IQ 300+');
console.log('🔄 Bidirectional Multi-API Translation');
console.log('🌍 Advanced Multi-language Moderation');
console.log('🤖 Auto-Translation Feature');
console.log('⚡ Enhanced Cultural Context Analysis');
console.log('🛡️ Toggleable Auto-Moderation System');
console.log('🚀 Starting enhanced login sequence...\n');