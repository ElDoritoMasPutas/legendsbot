require('dotenv').config();

const config = {
    // Discord Configuration
    discord: {
        token: process.env.DISCORD_TOKEN,
        clientId: process.env.DISCORD_CLIENT_ID,
        clientSecret: process.env.DISCORD_CLIENT_SECRET,
        permissions: ['SendMessages', 'ReadMessageHistory', 'ManageMessages', 'BanMembers', 'KickMembers'],
        maxRetries: 3,
        retryDelay: 5000
    },

    // Database Configuration
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        database: process.env.DB_NAME || 'synthia_ai',
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        dialect: 'mysql',
        logging: false,
        pool: {
            max: 20,
            min: 5,
            acquire: 30000,
            idle: 10000
        },
        retry: {
            max: 3
        }
    },

    // Redis Configuration
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || null,
        db: parseInt(process.env.REDIS_DB) || 0,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true
    },

    // AI & ML Configuration
    ai: {
        openai: {
            apiKey: process.env.OPENAI_API_KEY,
            model: process.env.OPENAI_MODEL || 'gpt-4',
            maxTokens: 4000,
            temperature: 0.7,
            presencePenalty: 0.6,
            frequencyPenalty: 0.5
        },
        huggingface: {
            apiKey: process.env.HUGGINGFACE_API_KEY,
            models: {
                sentiment: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
                toxicity: 'unitary/toxic-bert',
                translation: 'Helsinki-NLP/opus-mt-en-mul'
            }
        },
        processing: {
            batchSize: 10,
            maxConcurrency: 5,
            timeout: 30000
        }
    },

    // Translation Services
    translation: {
        google: {
            apiKey: process.env.GOOGLE_TRANSLATE_API_KEY,
            projectId: process.env.GOOGLE_PROJECT_ID
        },
        deepl: {
            apiKey: process.env.DEEPL_API_KEY,
            baseUrl: 'https://api-free.deepl.com'
        },
        supportedLanguages: [
            'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh',
            'ar', 'hi', 'tr', 'pl', 'nl', 'sv', 'da', 'no', 'fi'
        ],
        autoDetect: true,
        cacheTimeout: 3600000 // 1 hour
    },

    // Security Configuration
    security: {
        jwt: {
            secret: process.env.JWT_SECRET,
            expiresIn: '24h',
            algorithm: 'HS256'
        },
        encryption: {
            key: process.env.ENCRYPTION_KEY,
            algorithm: 'aes-256-gcm'
        },
        rateLimit: {
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000, // 15 minutes
            max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
            standardHeaders: true,
            legacyHeaders: false
        },
        cors: {
            origin: process.env.DASHBOARD_URL || 'http://localhost:3000',
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            allowedHeaders: ['Content-Type', 'Authorization']
        }
    },

    // Web Dashboard Configuration
    web: {
        port: parseInt(process.env.PORT) || 3001,
        sessionSecret: process.env.SESSION_SECRET,
        uploadPath: process.env.UPLOAD_PATH || './uploads',
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
        allowedFileTypes: ['.jpg', '.png', '.gif', '.pdf', '.txt', '.csv']
    },

    // Monitoring & Analytics
    monitoring: {
        sentry: {
            dsn: process.env.SENTRY_DSN,
            environment: process.env.NODE_ENV || 'development'
        },
        metrics: {
            interval: 60000, // 1 minute
            retention: 2592000000 // 30 days
        },
        health: {
            checkInterval: 30000, // 30 seconds
            timeout: 5000
        }
    },

    // Moderation Configuration
    moderation: {
        automod: {
            enabled: true,
            strictMode: false,
            actionThresholds: {
                warn: 0.3,
                mute: 0.6,
                kick: 0.8,
                ban: 0.9
            },
            exemptRoles: ['Admin', 'Moderator'],
            logChannel: 'moderation-logs'
        },
        spam: {
            maxMessages: 5,
            timeWindow: 5000,
            maxDuplicates: 3,
            maxMentions: 10,
            maxEmojis: 20
        },
        filters: {
            profanity: true,
            toxicity: true,
            spam: true,
            maliciousLinks: true,
            invites: true
        }
    },

    // Plugin System Configuration
    plugins: {
        directory: './plugins',
        autoLoad: true,
        hotReload: true,
        maxPlugins: 50,
        defaultEnabled: [
            'welcome',
            'moderation',
            'analytics',
            'translation',
            'utilities'
        ]
    },

    // Logging Configuration
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: {
            enabled: true,
            path: './logs',
            maxFiles: 14,
            maxSize: '20m'
        },
        console: {
            enabled: true,
            colorize: true
        },
        database: {
            enabled: true,
            level: 'warn'
        }
    },

    // Cache Configuration
    cache: {
        ttl: 3600, // 1 hour default
        checkPeriod: 600, // 10 minutes
        maxKeys: 10000,
        strategies: {
            messageAnalysis: { ttl: 1800 }, // 30 minutes
            userProfiles: { ttl: 7200 }, // 2 hours
            guildSettings: { ttl: 3600 }, // 1 hour
            translations: { ttl: 86400 } // 24 hours
        }
    },

    // Performance Configuration
    performance: {
        clustering: {
            enabled: process.env.CLUSTER_MODE === 'true',
            workers: parseInt(process.env.CLUSTER_WORKERS) || require('os').cpus().length
        },
        optimization: {
            garbageCollection: true,
            memoryThreshold: 0.85,
            cpuThreshold: 0.8
        }
    },

    // External Services
    external: {
        weather: {
            apiKey: process.env.WEATHER_API_KEY,
            baseUrl: 'https://api.openweathermap.org/data/2.5'
        },
        news: {
            apiKey: process.env.NEWS_API_KEY,
            baseUrl: 'https://newsapi.org/v2'
        }
    },

    // Backup Configuration
    backup: {
        enabled: true,
        interval: parseInt(process.env.BACKUP_INTERVAL) || 86400000, // 24 hours
        retention: parseInt(process.env.BACKUP_RETENTION) || 30, // 30 days
        path: './backups',
        compression: true
    }
};

// Validation
function validateConfig() {
    const required = [
        'discord.token',
        'database.host',
        'database.database',
        'redis.host'
    ];

    for (const path of required) {
        const keys = path.split('.');
        let value = config;
        
        for (const key of keys) {
            value = value[key];
            if (value === undefined || value === null || value === '') {
                throw new Error(`Missing required configuration: ${path}`);
            }
        }
    }

    console.log('✅ Configuration validated successfully');
    return true;
}

// Environment-specific overrides
if (process.env.NODE_ENV === 'production') {
    config.logging.level = 'warn';
    config.logging.console.enabled = false;
    config.performance.clustering.enabled = true;
}

if (process.env.NODE_ENV === 'development') {
    config.logging.level = 'debug';
    config.ai.openai.temperature = 0.5;
}

module.exports = { ...config, validateConfig };
