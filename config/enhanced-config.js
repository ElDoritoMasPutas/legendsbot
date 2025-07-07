// Enhanced Configuration System v10.0 - Enterprise-Grade Settings
require('dotenv').config();
const path = require('path');
const fs = require('fs');

class EnhancedConfig {
    constructor() {
        this.environment = process.env.NODE_ENV || 'development';
        this.version = '10.0.0';
        this.loadConfiguration();
        this.validateConfiguration();
    }

    loadConfiguration() {
        this.config = {
            // Core Application Settings
            app: {
                name: 'Synthia AI Premium',
                version: this.version,
                environment: this.environment,
                timezone: process.env.TZ || 'UTC',
                locale: process.env.LOCALE || 'en-US',
                debug: process.env.DEBUG === 'true',
                verbose: process.env.VERBOSE === 'true',
                clustered: process.env.CLUSTER_MODE === 'true',
                workers: parseInt(process.env.CLUSTER_WORKERS) || require('os').cpus().length
            },

            // Discord Configuration
            discord: {
                token: process.env.DISCORD_TOKEN,
                clientId: process.env.DISCORD_CLIENT_ID,
                guildId: process.env.DISCORD_GUILD_ID,
                ownerId: process.env.DISCORD_OWNER_ID,
                supportServerId: process.env.DISCORD_SUPPORT_SERVER_ID,
                maxShards: parseInt(process.env.DISCORD_MAX_SHARDS) || 'auto',
                presence: {
                    status: process.env.DISCORD_STATUS || 'online',
                    activity: {
                        name: process.env.DISCORD_ACTIVITY || 'Advanced AI Moderation',
                        type: process.env.DISCORD_ACTIVITY_TYPE || 'WATCHING'
                    }
                }
            },

            // Database Configuration
            database: {
                type: process.env.DB_TYPE || 'sqlite',
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT) || 5432,
                name: process.env.DB_NAME || 'synthia_premium',
                username: process.env.DB_USERNAME || 'synthia',
                password: process.env.DB_PASSWORD || '',
                ssl: process.env.DB_SSL === 'true',
                logging: process.env.DB_LOGGING === 'true',
                pool: {
                    min: parseInt(process.env.DB_POOL_MIN) || 5,
                    max: parseInt(process.env.DB_POOL_MAX) || 20,
                    acquire: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 30000,
                    idle: parseInt(process.env.DB_IDLE_TIMEOUT) || 10000
                }
            },

            // Redis Cache Configuration
            redis: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT) || 6379,
                password: process.env.REDIS_PASSWORD || '',
                db: parseInt(process.env.REDIS_DB) || 0,
                ttl: parseInt(process.env.REDIS_TTL) || 3600,
                cluster: process.env.REDIS_CLUSTER === 'true',
                sentinels: process.env.REDIS_SENTINELS ? JSON.parse(process.env.REDIS_SENTINELS) : null
            },

            // Web Server Configuration
            web: {
                port: parseInt(process.env.WEB_PORT) || 3001,
                host: process.env.WEB_HOST || '0.0.0.0',
                ssl: {
                    enabled: process.env.SSL_ENABLED === 'true',
                    cert: process.env.SSL_CERT_PATH,
                    key: process.env.SSL_KEY_PATH
                },
                cors: {
                    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
                    credentials: true
                },
                rateLimit: {
                    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000, // 15 minutes
                    max: parseInt(process.env.RATE_LIMIT_MAX) || 1000
                }
            },

            // AI & ML Configuration
            ai: {
                // OpenAI Configuration
                openai: {
                    apiKey: process.env.OPENAI_API_KEY,
                    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
                    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 4096,
                    temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.1,
                    timeout: parseInt(process.env.OPENAI_TIMEOUT) || 30000
                },

                // Google Cloud AI
                googleCloud: {
                    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
                    keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
                    apiKey: process.env.GOOGLE_CLOUD_API_KEY,
                    location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1'
                },

                // Azure Cognitive Services
                azure: {
                    endpoint: process.env.AZURE_ENDPOINT,
                    apiKey: process.env.AZURE_API_KEY,
                    region: process.env.AZURE_REGION || 'eastus'
                },

                // Hugging Face
                huggingface: {
                    apiKey: process.env.HUGGINGFACE_API_KEY,
                    timeout: parseInt(process.env.HUGGINGFACE_TIMEOUT) || 30000
                },

                // Perspective API
                perspective: {
                    apiKey: process.env.PERSPECTIVE_API_KEY,
                    timeout: parseInt(process.env.PERSPECTIVE_TIMEOUT) || 15000
                },

                // Local ML Models
                localModels: {
                    enabled: process.env.LOCAL_MODELS_ENABLED === 'true',
                    path: process.env.LOCAL_MODELS_PATH || './ml/models',
                    device: process.env.ML_DEVICE || 'cpu', // cpu, gpu, auto
                    batchSize: parseInt(process.env.ML_BATCH_SIZE) || 32
                }
            },

            // Translation Configuration
            translation: {
                defaultLanguage: process.env.DEFAULT_LANGUAGE || 'en',
                autoDetect: process.env.AUTO_DETECT_LANGUAGE === 'true',
                providers: {
                    google: {
                        apiKey: process.env.GOOGLE_TRANSLATE_API_KEY,
                        priority: 1
                    },
                    deepl: {
                        apiKey: process.env.DEEPL_API_KEY,
                        priority: 2
                    },
                    microsoft: {
                        apiKey: process.env.MICROSOFT_TRANSLATOR_KEY,
                        region: process.env.MICROSOFT_TRANSLATOR_REGION,
                        priority: 3
                    },
                    libre: {
                        enabled: process.env.LIBRE_TRANSLATE_ENABLED === 'true',
                        url: process.env.LIBRE_TRANSLATE_URL || 'https://libretranslate.com',
                        priority: 4
                    }
                }
            },

            // Moderation Configuration
            moderation: {
                enabled: process.env.MODERATION_ENABLED !== 'false',
                strictMode: process.env.STRICT_MODE === 'true',
                autoAction: process.env.AUTO_ACTION === 'true',
                thresholds: {
                    warn: parseFloat(process.env.THRESHOLD_WARN) || 2.0,
                    delete: parseFloat(process.env.THRESHOLD_DELETE) || 3.0,
                    mute: parseFloat(process.env.THRESHOLD_MUTE) || 5.0,
                    ban: parseFloat(process.env.THRESHOLD_BAN) || 7.0
                },
                pokemon: {
                    protection: process.env.POKEMON_PROTECTION !== 'false',
                    whitelist: process.env.POKEMON_WHITELIST !== 'false'
                },
                bypassDetection: {
                    enabled: process.env.BYPASS_DETECTION !== 'false',
                    penalty: parseFloat(process.env.BYPASS_PENALTY) || 2.0
                }
            },

            // Security Configuration
            security: {
                encryption: {
                    algorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm',
                    key: process.env.ENCRYPTION_KEY,
                    iv: process.env.ENCRYPTION_IV
                },
                jwt: {
                    secret: process.env.JWT_SECRET,
                    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
                    issuer: process.env.JWT_ISSUER || 'synthia-ai',
                    audience: process.env.JWT_AUDIENCE || 'synthia-dashboard'
                },
                rateLimit: {
                    global: {
                        windowMs: parseInt(process.env.GLOBAL_RATE_LIMIT_WINDOW) || 60000,
                        max: parseInt(process.env.GLOBAL_RATE_LIMIT_MAX) || 100
                    },
                    perUser: {
                        windowMs: parseInt(process.env.USER_RATE_LIMIT_WINDOW) || 60000,
                        max: parseInt(process.env.USER_RATE_LIMIT_MAX) || 30
                    }
                },
                antiSpam: {
                    enabled: process.env.ANTI_SPAM_ENABLED !== 'false',
                    maxDuplicates: parseInt(process.env.MAX_DUPLICATE_MESSAGES) || 3,
                    timeWindow: parseInt(process.env.SPAM_TIME_WINDOW) || 30000,
                    maxLength: parseInt(process.env.MAX_MESSAGE_LENGTH) || 2000
                }
            },

            // Logging Configuration
            logging: {
                level: process.env.LOG_LEVEL || 'info',
                format: process.env.LOG_FORMAT || 'json',
                file: {
                    enabled: process.env.FILE_LOGGING !== 'false',
                    path: process.env.LOG_PATH || './logs',
                    maxFiles: parseInt(process.env.LOG_MAX_FILES) || 14,
                    maxSize: process.env.LOG_MAX_SIZE || '20m'
                },
                console: {
                    enabled: process.env.CONSOLE_LOGGING !== 'false',
                    colorize: process.env.LOG_COLORIZE !== 'false'
                },
                database: {
                    enabled: process.env.DB_LOGGING === 'true',
                    level: process.env.DB_LOG_LEVEL || 'error'
                }
            },

            // Analytics Configuration
            analytics: {
                enabled: process.env.ANALYTICS_ENABLED !== 'false',
                realtime: process.env.REALTIME_ANALYTICS !== 'false',
                retention: {
                    messages: parseInt(process.env.MESSAGE_RETENTION_DAYS) || 30,
                    analytics: parseInt(process.env.ANALYTICS_RETENTION_DAYS) || 90,
                    logs: parseInt(process.env.LOG_RETENTION_DAYS) || 30
                },
                aggregation: {
                    interval: parseInt(process.env.AGGREGATION_INTERVAL) || 3600000, // 1 hour
                    batchSize: parseInt(process.env.AGGREGATION_BATCH_SIZE) || 1000
                }
            },

            // Monitoring Configuration
            monitoring: {
                healthCheck: {
                    enabled: process.env.HEALTH_CHECK_ENABLED !== 'false',
                    interval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 60000,
                    timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT) || 5000
                },
                metrics: {
                    enabled: process.env.METRICS_ENABLED !== 'false',
                    interval: parseInt(process.env.METRICS_INTERVAL) || 300000,
                    retention: parseInt(process.env.METRICS_RETENTION) || 7 * 24 * 60 * 60 * 1000 // 7 days
                },
                alerts: {
                    enabled: process.env.ALERTS_ENABLED !== 'false',
                    webhook: process.env.ALERT_WEBHOOK_URL,
                    email: process.env.ALERT_EMAIL,
                    thresholds: {
                        cpu: parseFloat(process.env.CPU_ALERT_THRESHOLD) || 80,
                        memory: parseFloat(process.env.MEMORY_ALERT_THRESHOLD) || 85,
                        errorRate: parseFloat(process.env.ERROR_RATE_THRESHOLD) || 5
                    }
                }
            },

            // Plugin Configuration
            plugins: {
                enabled: process.env.PLUGINS_ENABLED !== 'false',
                autoLoad: process.env.PLUGIN_AUTO_LOAD !== 'false',
                directory: process.env.PLUGIN_DIRECTORY || './plugins',
                security: {
                    sandboxed: process.env.PLUGIN_SANDBOXED === 'true',
                    maxMemory: parseInt(process.env.PLUGIN_MAX_MEMORY) || 100 * 1024 * 1024, // 100MB
                    timeout: parseInt(process.env.PLUGIN_TIMEOUT) || 30000
                }
            },

            // Performance Configuration
            performance: {
                optimization: {
                    enabled: process.env.PERFORMANCE_OPTIMIZATION !== 'false',
                    interval: parseInt(process.env.OPTIMIZATION_INTERVAL) || 300000
                },
                caching: {
                    strategy: process.env.CACHE_STRATEGY || 'intelligent',
                    ttl: parseInt(process.env.CACHE_TTL) || 3600,
                    maxSize: parseInt(process.env.CACHE_MAX_SIZE) || 1000
                },
                compression: {
                    enabled: process.env.COMPRESSION_ENABLED !== 'false',
                    level: parseInt(process.env.COMPRESSION_LEVEL) || 6
                }
            },

            // Feature Flags
            features: {
                dashboard: process.env.FEATURE_DASHBOARD !== 'false',
                api: process.env.FEATURE_API !== 'false',
                webhooks: process.env.FEATURE_WEBHOOKS !== 'false',
                voiceModeration: process.env.FEATURE_VOICE_MODERATION === 'true',
                imageAnalysis: process.env.FEATURE_IMAGE_ANALYSIS === 'true',
                videoAnalysis: process.env.FEATURE_VIDEO_ANALYSIS === 'true',
                contextAnalysis: process.env.FEATURE_CONTEXT_ANALYSIS !== 'false',
                behavioralAnalysis: process.env.FEATURE_BEHAVIORAL_ANALYSIS !== 'false',
                predictiveModeration: process.env.FEATURE_PREDICTIVE_MODERATION === 'true',
                multiServerAnalytics: process.env.FEATURE_MULTI_SERVER_ANALYTICS !== 'false'
            },

            // Color Schemes
            colors: {
                primary: 0x8e24aa,
                success: 0x2ecc71,
                warning: 0xf39c12,
                error: 0xe74c3c,
                info: 0x3498db,
                moderation: 0xff6b6b,
                translation: 0xe91e63,
                security: 0xff4757,
                analytics: 0x00bcd4,
                performance: 0xff9800,
                premium: 0x9c27b0
            },

            // Development Configuration
            development: {
                hotReload: process.env.HOT_RELOAD === 'true',
                mockData: process.env.MOCK_DATA === 'true',
                debugAPI: process.env.DEBUG_API === 'true',
                testMode: process.env.TEST_MODE === 'true'
            }
        };
    }

    validateConfiguration() {
        const required = [
            'discord.token',
            'security.jwt.secret',
            'security.encryption.key'
        ];

        const missing = required.filter(key => {
            const value = this.get(key);
            return !value || value === '';
        });

        if (missing.length > 0) {
            throw new Error(`Missing required configuration: ${missing.join(', ')}`);
        }

        // Validate Discord token format
        if (!/^[MN][A-Za-z\d]{23}\.[\w-]{6}\.[\w-]{27}$/.test(this.config.discord.token)) {
            console.warn('⚠️ Discord token format appears invalid');
        }

        // Generate secure defaults if missing
        if (!this.config.security.jwt.secret) {
            this.config.security.jwt.secret = require('crypto').randomBytes(64).toString('hex');
            console.warn('⚠️ Generated random JWT secret. Set JWT_SECRET environment variable for production.');
        }

        if (!this.config.security.encryption.key) {
            this.config.security.encryption.key = require('crypto').randomBytes(32).toString('hex');
            console.warn('⚠️ Generated random encryption key. Set ENCRYPTION_KEY environment variable for production.');
        }
    }

    get(key) {
        return key.split('.').reduce((obj, k) => obj?.[k], this.config);
    }

    set(key, value) {
        const keys = key.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((obj, k) => obj[k] = obj[k] || {}, this.config);
        target[lastKey] = value;
    }

    has(key) {
        return this.get(key) !== undefined;
    }

    isDevelopment() {
        return this.environment === 'development';
    }

    isProduction() {
        return this.environment === 'production';
    }

    isTesting() {
        return this.environment === 'test';
    }

    getEnvironment() {
        return this.environment;
    }

    getVersion() {
        return this.version;
    }

    getAll() {
        return { ...this.config };
    }

    // Environment-specific overrides
    getForEnvironment(env = this.environment) {
        const envConfig = this.config[env] || {};
        return { ...this.config, ...envConfig };
    }

    // Save configuration to file
    async saveToFile(filePath) {
        const configToSave = { ...this.config };
        
        // Remove sensitive data
        delete configToSave.discord.token;
        delete configToSave.security.jwt.secret;
        delete configToSave.security.encryption.key;
        
        await fs.promises.writeFile(filePath, JSON.stringify(configToSave, null, 2));
    }

    // Load configuration from file
    async loadFromFile(filePath) {
        try {
            const fileContent = await fs.promises.readFile(filePath, 'utf8');
            const fileConfig = JSON.parse(fileContent);
            this.config = { ...this.config, ...fileConfig };
        } catch (error) {
            console.warn(`Could not load config from ${filePath}:`, error.message);
        }
    }
}

// Export singleton instance
module.exports = new EnhancedConfig();
