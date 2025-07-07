// Core Configuration v9.0 - config/config.js
require('dotenv').config();

const config = {
    // Discord Configuration
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.DISCORD_CLIENT_ID,
    guildId: process.env.DISCORD_GUILD_ID,
    
    // Bot Information
    aiVersion: '9.0',
    botName: 'Enhanced Synthia',
    
    // Core Features
    autoModerationEnabled: process.env.AUTO_MODERATION !== 'false',
    multiApiEnabled: process.env.MULTI_API_ENABLED !== 'false',
    fallbackEnabled: process.env.FALLBACK_ENABLED !== 'false',
    debugMode: process.env.DEBUG_MODE === 'true',
    verboseLogging: process.env.VERBOSE_LOGGING === 'true',
    
    // Enhanced Moderation Thresholds (WORKING VALUES)
    moderationThresholds: {
        warn: 2,    // Threat level 2+ = warn
        delete: 3,  // Threat level 3+ = delete
        mute: 5,    // Threat level 5+ = mute
        ban: 7      // Threat level 7+ = ban
    },
    
    // Multi-API Configuration
    multiApi: {
        enabled: process.env.MULTI_API_ENABLED !== 'false',
        providers: {
            perspective: {
                apiKey: process.env.PERSPECTIVE_API_KEY,
                enabled: !!process.env.PERSPECTIVE_API_KEY,
                weight: 0.3
            },
            huggingface: {
                apiKey: process.env.HUGGINGFACE_API_KEY,
                enabled: !!process.env.HUGGINGFACE_API_KEY,
                weight: 0.25
            },
            openai: {
                apiKey: process.env.OPENAI_API_KEY,
                enabled: !!process.env.OPENAI_API_KEY,
                weight: 0.2
            },
            azure: {
                apiKey: process.env.AZURE_API_KEY,
                endpoint: process.env.AZURE_ENDPOINT,
                enabled: !!process.env.AZURE_API_KEY,
                weight: 0.15
            },
            local: {
                enabled: true,
                weight: 0.1
            }
        },
        consensusThreshold: 0.6, // 60% of APIs must agree
        fallbackToLocal: true
    },
    
    // Translation Configuration
    translation: {
        defaultLanguage: 'en',
        autoDetect: true,
        providers: {
            google: process.env.GOOGLE_TRANSLATE_API_KEY,
            deepl: process.env.DEEPL_API_KEY,
            microsoft: process.env.MICROSOFT_TRANSLATOR_KEY,
            libre: process.env.LIBRE_TRANSLATE_ENABLED === 'true'
        }
    },
    
    // Pokemon Protection
    pokemonProtection: {
        enabled: process.env.POKEMON_PROTECTION !== 'false',
        whitelistFileExtensions: ['.pk9', '.pk8', '.pb8', '.pa8', '.pkm', '.3gpkm'],
        whitelistCommands: ['.trade', '.me', '.mysteryegg', '.bt', '.pokepaste'],
        bypassDetectionExempt: true
    },
    
    // Performance Settings
    performance: {
        cacheEnabled: true,
        cacheTTL: 1800, // 30 minutes
        maxConcurrentAnalyses: 50,
        timeoutMs: 30000
    },
    
    // Security Settings
    security: {
        rateLimitEnabled: true,
        maxMessagesPerMinute: 30,
        bypassDetectionEnabled: true,
        bypassPenaltyMultiplier: 1.5
    },
    
    // Color Scheme
    colors: {
        primary: 0x8e24aa,
        success: 0x2ecc71,
        warning: 0xf39c12,
        error: 0xe74c3c,
        info: 0x3498db,
        moderation: 0xff6b6b,
        translation: 0xe91e63,
        security: 0xff4757,
        analytics: 0x00bcd4
    },
    
    // Database Configuration
    database: {
        type: process.env.DB_TYPE || 'sqlite',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        name: process.env.DB_NAME || 'synthia.db',
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        logging: process.env.DB_LOGGING === 'true'
    },
    
    // Logging Configuration
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        console: true,
        file: process.env.FILE_LOGGING !== 'false',
        discord: true
    },
    
    // Web Dashboard (for future use)
    web: {
        port: parseInt(process.env.WEB_PORT) || 3001,
        enabled: process.env.WEB_DASHBOARD === 'true'
    }
};

// Validation
if (!config.token) {
    throw new Error('DISCORD_TOKEN is required in .env file');
}

module.exports = config;