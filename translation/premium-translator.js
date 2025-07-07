const axios = require('axios');
const config = require('../config/enhanced-config.js');
const Logger = require('../logging/enhanced-logger.js');

class PremiumTranslator {
    constructor(cache, analytics) {
        this.cache = cache;
        this.analytics = analytics;
        this.logger = new Logger('PremiumTranslator');
        this.initialized = false;
        
        this.providers = {
            google: null,
            deepl: null,
            microsoft: null
        };
        
        this.stats = {
            translationsPerformed: 0,
            cacheHits: 0,
            cacheMisses: 0,
            errorCount: 0,
            avgResponseTime: 0
        };
        
        this.languageCodes = {
            'auto': 'auto',
            'english': 'en',
            'spanish': 'es',
            'french': 'fr',
            'german': 'de',
            'italian': 'it',
            'portuguese': 'pt',
            'russian': 'ru',
            'japanese': 'ja',
            'korean': 'ko',
            'chinese': 'zh',
            'arabic': 'ar',
            'hindi': 'hi',
            'turkish': 'tr',
            'polish': 'pl',
            'dutch': 'nl',
            'swedish': 'sv',
            'danish': 'da',
            'norwegian': 'no',
            'finnish': 'fi'
        };
        
        this.supportedLanguages = config.translation.supportedLanguages || [];
    }

    async initialize() {
        try {
            this.logger.info('Initializing Premium Translator...');
            
            // Initialize translation providers
            await this.initializeProviders();
            
            // Load language detection models
            await this.loadLanguageModels();
            
            this.initialized = true;
            this.logger.info('Premium Translator initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize Premium Translator:', error);
            throw error;
        }
    }

    async initializeProviders() {
        // Initialize Google Translate
        if (config.translation.google.apiKey) {
            this.providers.google = {
                name: 'Google Translate',
                apiKey: config.translation.google.apiKey,
                baseUrl: 'https://translation.googleapis.com/language/translate/v2',
                translate: this.translateWithGoogle.bind(this),
                detect: this.detectLanguageWithGoogle.bind(this),
                getSupportedLanguages: this.getGoogleSupportedLanguages.bind(this)
            };
            this.logger.info('Google Translate provider initialized');
        }
        
        // Initialize DeepL
        if (config.translation.deepl.apiKey) {
            this.providers.deepl = {
                name: 'DeepL',
                apiKey: config.translation.deepl.apiKey,
                baseUrl: config.translation.deepl.baseUrl || 'https://api-free.deepl.com',
                translate: this.translateWithDeepL.bind(this),
                detect: this.detectLanguageWithDeepL.bind(this),
                getSupportedLanguages: this.getDeepLSupportedLanguages.bind(this)
            };
            this.logger.info('DeepL provider initialized');
        }
        
        // Initialize Microsoft Translator (if configured)
        if (config.translation.microsoft?.apiKey) {
            this.providers.microsoft = {
                name: 'Microsoft Translator',
                apiKey: config.translation.microsoft.apiKey,
                baseUrl: 'https://api.cognitive.microsofttranslator.com',
                translate: this.translateWithMicrosoft.bind(this),
                detect: this.detectLanguageWithMicrosoft.bind(this),
                getSupportedLanguages: this.getMicrosoftSupportedLanguages.bind(this)
            };
            this.logger.info('Microsoft Translator provider initialized');
        }
    }

    async loadLanguageModels() {
        // Load cached language detection patterns
        const cachedPatterns = await this.cache.get('translation:language_patterns');
        if (cachedPatterns) {
            this.languagePatterns = cachedPatterns;
        } else {
            // Initialize basic language detection patterns
            this.languagePatterns = {
                en: ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'],
                es: ['el', 'la', 'y', 'o', 'pero', 'en', 'de', 'con', 'por', 'para', 'que', 'es'],
                fr: ['le', 'la', 'et', 'ou', 'mais', 'en', 'de', 'avec', 'par', 'pour', 'que', 'est'],
                de: ['der', 'die', 'das', 'und', 'oder', 'aber', 'in', 'von', 'mit', 'für', 'ist'],
                it: ['il', 'la', 'e', 'o', 'ma', 'in', 'di', 'con', 'per', 'che', 'è'],
                pt: ['o', 'a', 'e', 'ou', 'mas', 'em', 'de', 'com', 'por', 'para', 'que', 'é'],
                ru: ['и', 'в', 'не', 'на', 'я', 'быть', 'он', 'с', 'что', 'а', 'по', 'это'],
                ja: ['の', 'に', 'は', 'を', 'た', 'が', 'で', 'て', 'と', 'し', 'れ', 'さ'],
                ko: ['이', '가', '은', '는', '을', '를', '에', '에서', '로', '으로', '와', '과'],
                zh: ['的', '是', '在', '了', '不', '和', '有', '大', '这', '主', '里', '为']
            };
            
            await this.cache.set('translation:language_patterns', this.languagePatterns, 86400);
        }
    }

    async translate(text, sourceLang = 'auto', targetLang, preferredProvider = null) {
        const startTime = Date.now();
        
        try {
            // Input validation
            if (!text || typeof text !== 'string') {
                throw new Error('Invalid text input');
            }
            
            if (!targetLang) {
                throw new Error('Target language is required');
            }
            
            // Normalize language codes
            sourceLang = this.normalizeLanguageCode(sourceLang);
            targetLang = this.normalizeLanguageCode(targetLang);
            
            // Check if translation is needed
            if (sourceLang === targetLang && sourceLang !== 'auto') {
                return {
                    text: text,
                    sourceLang: sourceLang,
                    targetLang: targetLang,
                    provider: 'none',
                    fromCache: false,
                    confidence: 1.0
                };
            }
            
            // Check cache first
            const cacheKey = this.getCacheKey(text, sourceLang, targetLang);
            const cachedTranslation = await this.cache.getTranslation(text, sourceLang, targetLang);
            
            if (cachedTranslation) {
                this.stats.cacheHits++;
                this.logger.logTranslation(sourceLang, targetLang, 'cache', true);
                return { ...cachedTranslation, fromCache: true };
            }
            
            this.stats.cacheMisses++;
            
            // Detect source language if auto
            if (sourceLang === 'auto') {
                sourceLang = await this.detectLanguage(text);
                if (sourceLang === targetLang) {
                    return {
                        text: text,
                        sourceLang: sourceLang,
                        targetLang: targetLang,
                        provider: 'none',
                        fromCache: false,
                        confidence: 1.0
                    };
                }
            }
            
            // Select best provider
            const provider = this.selectProvider(sourceLang, targetLang, preferredProvider);
            if (!provider) {
                throw new Error('No translation provider available');
            }
            
            // Perform translation
            const result = await provider.translate(text, sourceLang, targetLang);
            
            // Add metadata
            result.provider = provider.name;
            result.fromCache = false;
            result.responseTime = Date.now() - startTime;
            
            // Cache the result
            await this.cache.cacheTranslation(text, sourceLang, targetLang, result);
            
            // Update statistics
            this.stats.translationsPerformed++;
            this.stats.avgResponseTime = (this.stats.avgResponseTime + result.responseTime) / 2;
            
            // Log analytics
            if (this.analytics) {
                await this.analytics.trackCommandUsage(null, null, 'translation', true);
            }
            
            this.logger.logTranslation(sourceLang, targetLang, provider.name, true);
            
            return result;
            
        } catch (error) {
            this.stats.errorCount++;
            this.logger.error('Translation failed:', error);
            this.logger.logTranslation(sourceLang, targetLang, 'error', false);
            
            return {
                error: error.message,
                text: null,
                sourceLang: sourceLang,
                targetLang: targetLang,
                provider: 'error',
                fromCache: false,
                responseTime: Date.now() - startTime
            };
        }
    }

    async detectLanguage(text) {
        try {
            // Try cache first
            const cacheKey = `language_detection:${Buffer.from(text).toString('base64')}`;
            const cachedDetection = await this.cache.get(cacheKey);
            if (cachedDetection) {
                return cachedDetection.language;
            }
            
            // Use local detection first (faster)
            const localDetection = this.detectLanguageLocally(text);
            if (localDetection.confidence > 0.8) {
                await this.cache.set(cacheKey, localDetection, 3600);
                return localDetection.language;
            }
            
            // Fall back to provider-based detection
            for (const provider of Object.values(this.providers)) {
                if (provider && provider.detect) {
                    try {
                        const detection = await provider.detect(text);
                        if (detection.confidence > 0.6) {
                            await this.cache.set(cacheKey, detection, 3600);
                            return detection.language;
                        }
                    } catch (error) {
                        this.logger.debug(`Language detection failed with ${provider.name}:`, error);
                    }
                }
            }
            
            // Return local detection as fallback
            return localDetection.language || 'en';
            
        } catch (error) {
            this.logger.error('Language detection failed:', error);
            return 'en'; // Default to English
        }
    }

    detectLanguageLocally(text) {
        const words = text.toLowerCase().split(/\s+/);
        const scores = {};
        
        for (const [lang, patterns] of Object.entries(this.languagePatterns)) {
            let score = 0;
            for (const word of words) {
                if (patterns.includes(word)) {
                    score++;
                }
            }
            scores[lang] = score / words.length;
        }
        
        const detectedLang = Object.keys(scores).reduce((a, b) => 
            scores[a] > scores[b] ? a : b
        );
        
        return {
            language: detectedLang,
            confidence: scores[detectedLang] || 0,
            scores
        };
    }

    selectProvider(sourceLang, targetLang, preferredProvider = null) {
        // Use preferred provider if specified and available
        if (preferredProvider && this.providers[preferredProvider.toLowerCase()]) {
            return this.providers[preferredProvider.toLowerCase()];
        }
        
        // DeepL for European languages (higher quality)
        if (this.providers.deepl && this.isDeepLSupported(sourceLang, targetLang)) {
            return this.providers.deepl;
        }
        
        // Google Translate for broader language support
        if (this.providers.google) {
            return this.providers.google;
        }
        
        // Microsoft Translator as fallback
        if (this.providers.microsoft) {
            return this.providers.microsoft;
        }
        
        return null;
    }

    isDeepLSupported(sourceLang, targetLang) {
        const deeplLanguages = ['en', 'de', 'fr', 'it', 'ja', 'es', 'nl', 'pl', 'pt', 'ru', 'zh'];
        return deeplLanguages.includes(sourceLang) && deeplLanguages.includes(targetLang);
    }

    async translateWithGoogle(text, sourceLang, targetLang) {
        try {
            const response = await axios.post(this.providers.google.baseUrl, {
                q: text,
                source: sourceLang === 'auto' ? undefined : sourceLang,
                target: targetLang,
                format: 'text'
            }, {
                params: {
                    key: this.providers.google.apiKey
                },
                timeout: 10000
            });
            
            const translation = response.data.data.translations[0];
            
            return {
                text: translation.translatedText,
                sourceLang: translation.detectedSourceLanguage || sourceLang,
                targetLang: targetLang,
                confidence: 0.9 // Google doesn't provide confidence scores
            };
            
        } catch (error) {
            this.logger.error('Google Translate API error:', error);
            throw new Error(`Google Translate failed: ${error.message}`);
        }
    }

    async translateWithDeepL(text, sourceLang, targetLang) {
        try {
            const response = await axios.post(`${this.providers.deepl.baseUrl}/v2/translate`, {
                text: [text],
                source_lang: sourceLang === 'auto' ? undefined : sourceLang.toUpperCase(),
                target_lang: targetLang.toUpperCase()
            }, {
                headers: {
                    'Authorization': `DeepL-Auth-Key ${this.providers.deepl.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });
            
            const translation = response.data.translations[0];
            
            return {
                text: translation.text,
                sourceLang: translation.detected_source_language?.toLowerCase() || sourceLang,
                targetLang: targetLang,
                confidence: 0.95 // DeepL generally has high quality
            };
            
        } catch (error) {
            this.logger.error('DeepL API error:', error);
            throw new Error(`DeepL failed: ${error.message}`);
        }
    }

    async translateWithMicrosoft(text, sourceLang, targetLang) {
        try {
            const response = await axios.post(`${this.providers.microsoft.baseUrl}/translate`, [
                { text: text }
            ], {
                params: {
                    'api-version': '3.0',
                    from: sourceLang === 'auto' ? undefined : sourceLang,
                    to: targetLang
                },
                headers: {
                    'Ocp-Apim-Subscription-Key': this.providers.microsoft.apiKey,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });
            
            const translation = response.data[0].translations[0];
            const detectedLang = response.data[0].detectedLanguage;
            
            return {
                text: translation.text,
                sourceLang: detectedLang?.language || sourceLang,
                targetLang: targetLang,
                confidence: detectedLang?.score || 0.8
            };
            
        } catch (error) {
            this.logger.error('Microsoft Translator API error:', error);
            throw new Error(`Microsoft Translator failed: ${error.message}`);
        }
    }

    async detectLanguageWithGoogle(text) {
        try {
            const response = await axios.post(`${this.providers.google.baseUrl}/detect`, {
                q: text
            }, {
                params: {
                    key: this.providers.google.apiKey
                }
            });
            
            const detection = response.data.data.detections[0][0];
            
            return {
                language: detection.language,
                confidence: detection.confidence
            };
            
        } catch (error) {
            this.logger.error('Google language detection error:', error);
            throw error;
        }
    }

    async detectLanguageWithDeepL(text) {
        // DeepL doesn't have a dedicated detection endpoint
        // We'll use a translation attempt to detect
        try {
            const response = await axios.post(`${this.providers.deepl.baseUrl}/v2/translate`, {
                text: [text.substring(0, 100)], // Use first 100 chars for detection
                target_lang: 'EN'
            }, {
                headers: {
                    'Authorization': `DeepL-Auth-Key ${this.providers.deepl.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const detected = response.data.translations[0].detected_source_language;
            
            return {
                language: detected.toLowerCase(),
                confidence: 0.8
            };
            
        } catch (error) {
            this.logger.error('DeepL language detection error:', error);
            throw error;
        }
    }

    async detectLanguageWithMicrosoft(text) {
        try {
            const response = await axios.post(`${this.providers.microsoft.baseUrl}/detect`, [
                { text: text }
            ], {
                params: {
                    'api-version': '3.0'
                },
                headers: {
                    'Ocp-Apim-Subscription-Key': this.providers.microsoft.apiKey,
                    'Content-Type': 'application/json'
                }
            });
            
            const detection = response.data[0];
            
            return {
                language: detection.language,
                confidence: detection.score
            };
            
        } catch (error) {
            this.logger.error('Microsoft language detection error:', error);
            throw error;
        }
    }

    async handleTranslation(message, analysis) {
        try {
            if (!analysis.requiresTranslation) return;
            
            const sourceLang = analysis.language?.language || 'auto';
            const guildSettings = await this.cache.getGuildSettings(message.guild.id);
            const targetLang = guildSettings?.defaultLanguage || 'en';
            
            if (sourceLang === targetLang) return;
            
            const translation = await this.translate(message.content, sourceLang, targetLang);
            
            if (translation.text) {
                // Send translation as a reply or embed
                const embed = {
                    color: 0x0099ff,
                    title: '🌐 Translation',
                    fields: [
                        {
                            name: `Original (${sourceLang.toUpperCase()})`,
                            value: message.content.substring(0, 1000),
                            inline: false
                        },
                        {
                            name: `Translation (${targetLang.toUpperCase()})`,
                            value: translation.text.substring(0, 1000),
                            inline: false
                        }
                    ],
                    footer: {
                        text: `Translated by ${translation.provider} • Confidence: ${Math.round(translation.confidence * 100)}%`
                    },
                    timestamp: new Date().toISOString()
                };
                
                await message.reply({ embeds: [embed] });
            }
            
        } catch (error) {
            this.logger.error('Auto-translation failed:', error);
        }
    }

    normalizeLanguageCode(code) {
        if (!code) return 'en';
        
        const normalized = code.toLowerCase().trim();
        
        // Check if it's already a valid code
        if (this.supportedLanguages.includes(normalized)) {
            return normalized;
        }
        
        // Try to find by language name
        const languageName = Object.keys(this.languageCodes).find(name => 
            name.toLowerCase() === normalized
        );
        
        return this.languageCodes[languageName] || normalized;
    }

    getCacheKey(text, sourceLang, targetLang) {
        const content = `${text}:${sourceLang}:${targetLang}`;
        return Buffer.from(content).toString('base64').substring(0, 250);
    }

    async getSupportedLanguages() {
        const languages = new Set();
        
        for (const provider of Object.values(this.providers)) {
            if (provider && provider.getSupportedLanguages) {
                try {
                    const providerLanguages = await provider.getSupportedLanguages();
                    providerLanguages.forEach(lang => languages.add(lang));
                } catch (error) {
                    this.logger.debug(`Failed to get supported languages from ${provider.name}:`, error);
                }
            }
        }
        
        return Array.from(languages);
    }

    getStats() {
        return {
            ...this.stats,
            providersAvailable: Object.keys(this.providers).filter(p => this.providers[p]).length,
            supportedLanguages: this.supportedLanguages.length,
            initialized: this.initialized
        };
    }

    isInitialized() {
        return this.initialized;
    }
}

module.exports = PremiumTranslator;