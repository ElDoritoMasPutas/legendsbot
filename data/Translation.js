// Enhanced TranslationAPI.js - Multi-API Bidirectional Translation System
const fetch = require('node-fetch');

class EnhancedTranslationAPI {
    constructor() {
        this.supportedLanguages = new Map([
            ['en', 'English'], ['es', 'Spanish'], ['fr', 'French'], ['de', 'German'],
            ['it', 'Italian'], ['pt', 'Portuguese'], ['ru', 'Russian'], ['ja', 'Japanese'],
            ['ko', 'Korean'], ['zh', 'Chinese'], ['ar', 'Arabic'], ['hi', 'Hindi'],
            ['tr', 'Turkish'], ['nl', 'Dutch'], ['sv', 'Swedish'], ['no', 'Norwegian'],
            ['da', 'Danish'], ['fi', 'Finnish'], ['pl', 'Polish'], ['cs', 'Czech'],
            ['hu', 'Hungarian'], ['ro', 'Romanian'], ['bg', 'Bulgarian'], ['hr', 'Croatian'],
            ['sk', 'Slovak'], ['sl', 'Slovenian'], ['et', 'Estonian'], ['lv', 'Latvian'],
            ['lt', 'Lithuanian'], ['uk', 'Ukrainian'], ['he', 'Hebrew'], ['th', 'Thai'],
            ['vi', 'Vietnamese'], ['id', 'Indonesian'], ['ms', 'Malay'], ['tl', 'Filipino'],
            ['sw', 'Swahili'], ['el', 'Greek'], ['fa', 'Persian'], ['ur', 'Urdu'],
            ['bn', 'Bengali'], ['ta', 'Tamil'], ['te', 'Telugu'], ['mr', 'Marathi'],
            ['gu', 'Gujarati'], ['kn', 'Kannada'], ['ml', 'Malayalam'], ['pa', 'Punjabi'],
            ['si', 'Sinhala'], ['ne', 'Nepali'], ['my', 'Myanmar'], ['km', 'Khmer'],
            ['lo', 'Lao'], ['ka', 'Georgian'], ['am', 'Amharic'], ['is', 'Icelandic'],
            ['mt', 'Maltese'], ['cy', 'Welsh'], ['ga', 'Irish'], ['eu', 'Basque'],
            ['ca', 'Catalan'], ['gl', 'Galician'], ['ast', 'Asturian'], ['oc', 'Occitan']
        ]);
        
        // Enhanced API configuration with multiple providers
        this.apis = {
            // Google Translate (Free via unofficial API) - Supports ALL languages bidirectionally
            googleTranslate: {
                instances: [
                    'https://translate.googleapis.com/translate_a/single',
                    'https://clients5.google.com/translate_a/t'
                ],
                currentInstance: 0,
                rateLimit: 100, // Per hour
                maxLength: 5000,
                timeout: 10000,
                priority: 1, // Highest priority
                reliability: 95,
                bidirectional: true
            },
            
            // DeepL Free API - Limited language pairs but high quality
            deepL: {
                baseUrl: 'https://api-free.deepl.com/v2/translate',
                apiKey: process.env.DEEPL_API_KEY || null,
                rateLimit: 500000, // 500k chars per month
                maxLength: 5000,
                timeout: 15000,
                priority: 2,
                reliability: 98,
                bidirectional: true,
                supportedLanguages: ['en', 'de', 'fr', 'es', 'pt', 'it', 'nl', 'pl', 'ru', 'ja', 'zh']
            },
            
            // Microsoft Translator (Free tier) - Supports most languages bidirectionally
            microsoftTranslator: {
                baseUrl: 'https://api.cognitive.microsofttranslator.com/translate',
                apiKey: process.env.MICROSOFT_TRANSLATOR_KEY || null,
                region: process.env.MICROSOFT_TRANSLATOR_REGION || 'global',
                rateLimit: 2000000, // 2M chars per month
                maxLength: 10000,
                timeout: 12000,
                priority: 3,
                reliability: 94,
                bidirectional: true
            },
            
            // LibreTranslate (Self-hosted/Free instances) - Open source, supports many languages
            libretranslate: {
                instances: [
                    'https://libretranslate.com',
                    'https://translate.argosopentech.com',
                    'https://translate.fedilab.app',
                    'https://translate.astian.org',
                    'https://libretranslate.de',
                    'https://translate.mentality.rip'
                ],
                currentInstance: 0,
                rateLimit: 50,
                maxLength: 2000,
                timeout: 20000,
                priority: 4,
                reliability: 85,
                bidirectional: true
            },
            
            // MyMemory (Free) - Translation memory, supports many language pairs
            mymemory: {
                baseUrl: 'https://api.mymemory.translated.net',
                email: process.env.MYMEMORY_EMAIL || null,
                rateLimit: 1000, // Per day
                maxLength: 500,
                timeout: 15000,
                priority: 5,
                reliability: 80,
                bidirectional: true
            },
            
            // Lingva (Free instances) - Google Translate frontend, supports all languages
            lingva: {
                instances: [
                    'https://lingva.ml',
                    'https://translate.plausibility.cloud',
                    'https://lingva.lunar.icu',
                    'https://translate.igna.rocks'
                ],
                currentInstance: 0,
                rateLimit: 30,
                maxLength: 1500,
                timeout: 15000,
                priority: 6,
                reliability: 75,
                bidirectional: true
            },
            
            // Yandex Translate (Free tier) - Good for Russian and Eastern European languages
            yandex: {
                baseUrl: 'https://translate.yandex.net/api/v1.5/tr.json/translate',
                apiKey: process.env.YANDEX_API_KEY || null,
                rateLimit: 1000000, // 1M chars per month
                maxLength: 10000,
                timeout: 12000,
                priority: 7,
                reliability: 88,
                bidirectional: true
            },
            
            // Papago (Naver - Free tier) - Excellent for Asian languages (Korean, Japanese, Chinese)
            papago: {
                baseUrl: 'https://openapi.naver.com/v1/papago/n2mt',
                clientId: process.env.PAPAGO_CLIENT_ID || null,
                clientSecret: process.env.PAPAGO_CLIENT_SECRET || null,
                rateLimit: 10000, // Per day
                maxLength: 5000,
                timeout: 10000,
                priority: 8,
                reliability: 85,
                bidirectional: true,
                supportedLanguages: ['en', 'ko', 'ja', 'zh', 'es', 'fr', 'th', 'vi', 'id']
            },
            
            // Systran (Free tier) - Professional translation API
            systran: {
                baseUrl: 'https://api-translate.systran.net/translation/text/translate',
                apiKey: process.env.SYSTRAN_API_KEY || null,
                rateLimit: 1000000, // 1M chars per month
                maxLength: 10000,
                timeout: 15000,
                priority: 9,
                reliability: 87,
                bidirectional: true
            }
        };
        
        // Request tracking for rate limiting
        this.requestCounts = {};
        this.characterCounts = {};
        this.lastSuccess = {};
        
        // Initialize tracking for each API
        for (const provider of Object.keys(this.apis)) {
            this.requestCounts[provider] = { count: 0, resetTime: Date.now() + this.getResetInterval(provider) };
            this.characterCounts[provider] = { count: 0, resetTime: Date.now() + this.getResetInterval(provider) };
            this.lastSuccess[provider] = Date.now();
        }
        
        console.log('🌍 Enhanced Bidirectional Translation API loaded with 9 providers');
        console.log('🔧 Google Translate:', this.apis.googleTranslate.instances.length, 'instances');
        console.log('🔧 DeepL:', this.apis.deepL.apiKey ? 'API Key Set' : 'No API Key');
        console.log('🔧 Microsoft:', this.apis.microsoftTranslator.apiKey ? 'API Key Set' : 'No API Key');
        console.log('🔧 LibreTranslate:', this.apis.libretranslate.instances.length, 'instances');
        console.log('🔧 Total Languages:', this.supportedLanguages.size);
        console.log('🌐 Bidirectional Translation: ENABLED');
    }

    getResetInterval(provider) {
        const config = this.apis[provider];
        // Daily reset for most APIs, hourly for some
        return ['googleTranslate', 'lingva', 'libretranslate'].includes(provider) ? 
               60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    }

    canMakeRequest(provider, textLength = 0) {
        const limits = this.requestCounts[provider];
        const charLimits = this.characterCounts[provider];
        const now = Date.now();
        
        // Reset counters if needed
        if (now > limits.resetTime) {
            limits.count = 0;
            limits.resetTime = now + this.getResetInterval(provider);
            charLimits.count = 0;
            charLimits.resetTime = now + this.getResetInterval(provider);
        }
        
        const config = this.apis[provider];
        const requestOk = limits.count < config.rateLimit;
        const charOk = textLength === 0 || (charLimits.count + textLength) < (config.rateLimit * 10);
        
        return requestOk && charOk;
    }

    incrementRequest(provider, textLength = 0) {
        this.requestCounts[provider].count++;
        this.characterCounts[provider].count += textLength;
        this.lastSuccess[provider] = Date.now();
    }

    // Check if provider supports specific language pair
    supportsLanguagePair(provider, sourceLang, targetLang) {
        const config = this.apis[provider];
        
        if (!config.bidirectional) return false;
        
        // If provider has specific language restrictions, check them
        if (config.supportedLanguages) {
            return config.supportedLanguages.includes(sourceLang) && 
                   config.supportedLanguages.includes(targetLang);
        }
        
        // Otherwise, assume it supports all our languages
        return this.supportedLanguages.has(sourceLang) && this.supportedLanguages.has(targetLang);
    }

    // Enhanced language detection with better patterns
    detectLanguage(text) {
        if (!text || text.trim().length === 0) return 'en';
        
        const lowerText = text.toLowerCase().trim();
        
        // Character-based detection for non-Latin scripts (highest priority)
        const characterPatterns = {
            'ru': /[а-яё]/gi,
            'zh': /[\u4e00-\u9fa5]/gi,
            'ja': /[\u3040-\u309f\u30a0-\u30ff]/gi,
            'ar': /[\u0600-\u06ff]/gi,
            'hi': /[\u0900-\u097f]/gi,
            'ko': /[\uac00-\ud7af]/gi,
            'th': /[\u0e00-\u0e7f]/gi,
            'el': /[\u0370-\u03ff]/gi,
            'he': /[\u0590-\u05ff]/gi,
            'ka': /[\u10a0-\u10ff]/gi,
            'am': /[\u1200-\u137f]/gi,
            'my': /[\u1000-\u109f]/gi,
            'si': /[\u0d80-\u0dff]/gi,
            'bn': /[\u0980-\u09ff]/gi,
            'ta': /[\u0b80-\u0bff]/gi,
            'te': /[\u0c00-\u0c7f]/gi,
            'kn': /[\u0c80-\u0cff]/gi,
            'ml': /[\u0d00-\u0d7f]/gi,
            'gu': /[\u0a80-\u0aff]/gi,
            'pa': /[\u0a00-\u0a7f]/gi
        };
        
        // Check character-based patterns first
        for (const [lang, pattern] of Object.entries(characterPatterns)) {
            if (pattern.test(text)) {
                console.log(`🎯 Detected ${lang} via character pattern`);
                return lang;
            }
        }
        
        // Enhanced word patterns (simplified for brevity, but comprehensive)
        const wordPatterns = {
            'es': /\b(el|la|los|las|un|una|de|en|por|para|con|que|es|está|son|están|hola|gracias|por favor|adiós|sí|no|cómo|qué|dónde|cuándo|por qué|porque)\b/gi,
            'fr': /\b(le|la|les|un|une|de|du|des|en|dans|pour|avec|que|est|sont|bonjour|salut|merci|s'il vous plaît|oui|non|comment|quoi|où|quand|pourquoi|parce que)\b/gi,
            'de': /\b(der|die|das|ein|eine|von|zu|mit|für|ist|sind|haben|hat|hallo|guten tag|danke|bitte|ja|nein|wie|was|wo|wann|warum|weil|und|oder|aber)\b/gi,
            'pt': /\b(o|a|os|as|um|uma|de|em|por|para|com|que|é|está|são|estão|olá|obrigado|por favor|tchau|sim|não|como|o que|onde|quando|por que|porque)\b/gi,
            'it': /\b(il|la|i|le|un|una|di|in|per|con|che|è|sono|ciao|grazie|prego|scusi|sì|no|come|cosa|dove|quando|perché|e|o|ma|però)\b/gi,
            'ru': /\b(и|в|не|на|я|быть|он|с|что|а|по|это|она|к|у|ты|из|мы|за|как|от|его|но|да|её|уже|или|ещё|привет|спасибо|пожалуйста|да|нет)\b/gi,
            'nl': /\b(de|het|een|van|in|voor|met|dat|is|zijn|hebben|heeft|hallo|dank je|alsjeblieft|ja|nee|hoe|wat|waar|wanneer|waarom|omdat)\b/gi,
            'pl': /\b(i|w|nie|na|to|jest|są|mają|ma|cześć|dziękuję|proszę|tak|nie|jak|co|gdzie|kiedy|dlaczego|ponieważ)\b/gi,
            'tr': /\b(ve|bir|bu|şu|o|var|yok|merhaba|teşekkürler|lütfen|evet|hayır|nasıl|ne|nerede|ne zaman|neden|çünkü)\b/gi,
            'sv': /\b(och|en|ett|i|för|med|att|är|har|hej|tack|snälla|ja|nej|hur|vad|var|när|varför|eftersom)\b/gi,
            'no': /\b(og|en|et|i|for|med|at|er|har|hei|takk|snill|ja|nei|hvordan|hva|hvor|når|hvorfor|fordi)\b/gi,
            'da': /\b(og|en|et|i|for|med|at|er|har|hej|tak|tak|ja|nej|hvordan|hvad|hvor|hvornår|hvorfor|fordi)\b/gi,
            'fi': /\b(ja|on|ei|ole|hei|kiitos|ole hyvä|kyllä|ei|miten|mitä|missä|milloin|miksi|koska)\b/gi,
            'cs': /\b(a|je|není|ahoj|děkuji|prosím|ano|ne|jak|co|kde|kdy|proč|protože)\b/gi,
            'hu': /\b(és|egy|ez|az|van|nincs|hello|köszönöm|kérem|igen|nem|hogy|mi|hol|mikor|miért|mert)\b/gi,
            'ro': /\b(și|un|o|este|sunt|salut|mulțumesc|vă rog|da|nu|cum|ce|unde|când|de ce|pentru că)\b/gi,
            'bg': /\b(и|е|не|здравей|благодаря|моля|да|не|как|какво|къде|кога|защо|защото)\b/gi,
            'hr': /\b(i|je|nije|bok|hvala|molim|da|ne|kako|što|gdje|kada|zašto|jer)\b/gi,
            'sk': /\b(a|je|nie|ahoj|ďakujem|prosím|áno|nie|ako|čo|kde|kedy|prečo|lebo)\b/gi,
            'sl': /\b(in|je|ni|zdravo|hvala|prosim|da|ne|kako|kaj|kje|kdaj|zakaj|ker)\b/gi,
            'et': /\b(ja|on|ei|ole|tere|tänan|palun|jah|ei|kuidas|mis|kus|millal|miks|sest)\b/gi,
            'lv': /\b(un|ir|nav|sveiki|paldies|lūdzu|jā|nē|kā|kas|kur|kad|kāpēc|jo)\b/gi,
            'lt': /\b(ir|yra|nėra|labas|ačiū|prašau|taip|ne|kaip|kas|kur|kada|kodėl|nes)\b/gi,
            'uk': /\b(і|є|не|привіт|дякую|будь ласка|так|ні|як|що|де|коли|чому|тому що)\b/gi,
            'he': /\b(ו|הוא|היא|לא|שלום|תודה|בבקשה|כן|לא|איך|מה|איפה|מתי|למה|כי)\b/gi,
            'th': /\b(และ|เป็น|ไม่|สวัสดี|ขอบคุณ|กรุณา|ใช่|ไม่|อย่างไร|อะไร|ที่ไหน|เมื่อไหร่|ทำไม|เพราะ)\b/gi,
            'vi': /\b(và|là|không|xin chào|cảm ơn|xin|có|không|như thế nào|cái gì|ở đâu|khi nào|tại sao|bởi vì)\b/gi,
            'id': /\b(dan|adalah|tidak|halo|terima kasih|tolong|ya|tidak|bagaimana|apa|di mana|kapan|mengapa|karena)\b/gi,
            'ms': /\b(dan|adalah|tidak|hello|terima kasih|tolong|ya|tidak|bagaimana|apa|di mana|bila|mengapa|kerana)\b/gi,
            'tl': /\b(at|ay|hindi|kumusta|salamat|pakisuyo|oo|hindi|paano|ano|saan|kailan|bakit|dahil)\b/gi
        };
        
        // Check broader patterns for complex analysis
        let bestMatch = 'en';
        let bestScore = 0;
        
        const words = text.toLowerCase().split(/\s+/);
        const totalWords = words.length;
        
        for (const [lang, pattern] of Object.entries(wordPatterns)) {
            const matches = text.match(pattern);
            if (matches) {
                const threshold = totalWords === 1 ? 0.1 : 0.15;
                const score = matches.length / Math.max(totalWords, 1);
                
                if (score > bestScore && score >= threshold) {
                    bestScore = score;
                    bestMatch = lang;
                }
            }
        }
        
        // Enhanced accent detection
        if (bestMatch === 'en' && /[áàâäãåæéèêëíìîïóòôöõøúùûüýÿñçş]/i.test(text)) {
            if (/[ñ]/i.test(text)) return 'es';
            if (/[ç]/i.test(text)) return 'fr';
            if (/[ãõ]/i.test(text)) return 'pt';
            if (/[ş]/i.test(text)) return 'tr';
            return 'es'; // Default to Spanish for other Romance language accents
        }
        
        console.log(`🎯 Final language detection: ${bestMatch} (score: ${bestScore.toFixed(3)})`);
        return bestMatch;
    }

    // GOOGLE TRANSLATE (Bidirectional)
    async translateWithGoogleTranslate(text, sourceLang, targetLang) {
        if (!this.canMakeRequest('googleTranslate', text.length)) {
            throw new Error('Google Translate rate limit exceeded');
        }

        const config = this.apis.googleTranslate;
        let lastError = null;
        
        for (let attempt = 0; attempt < config.instances.length; attempt++) {
            const instanceUrl = config.instances[config.currentInstance];
            
            try {
                console.log(`🔄 Trying Google Translate: ${sourceLang} → ${targetLang} (${instanceUrl})`);
                
                const params = new URLSearchParams({
                    client: 'gtx',
                    sl: sourceLang === 'auto' ? 'auto' : sourceLang,
                    tl: targetLang,
                    dt: 't',
                    q: text.slice(0, config.maxLength)
                });

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), config.timeout);

                const response = await fetch(`${instanceUrl}?${params.toString()}`, {
                    method: 'GET',
                    headers: { 
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': 'application/json'
                    },
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                
                if (data && data[0] && data[0][0] && data[0][0][0]) {
                    const translatedText = data[0].map(item => item[0]).join('');
                    const detectedLang = data[2] || sourceLang;
                    
                    this.incrementRequest('googleTranslate', text.length);
                    
                    return {
                        translatedText: translatedText.trim(),
                        originalLanguage: this.supportedLanguages.get(sourceLang) || 'Unknown',
                        targetLanguage: this.supportedLanguages.get(targetLang) || 'Unknown',
                        confidence: 98,
                        provider: 'Google Translate',
                        detectedLanguage: detectedLang
                    };
                } else {
                    throw new Error('Invalid response structure from Google Translate');
                }

            } catch (error) {
                lastError = error;
                console.log(`❌ Google Translate ${instanceUrl} failed: ${error.message}`);
                config.currentInstance = (config.currentInstance + 1) % config.instances.length;
            }
        }
        
        throw new Error(`Google Translate failed: ${lastError?.message || 'Unknown error'}`);
    }

    // DEEPL API (Bidirectional with supported languages)
    async translateWithDeepL(text, sourceLang, targetLang) {
        if (!this.apis.deepL.apiKey) {
            throw new Error('DeepL API key not configured');
        }
        
        if (!this.supportsLanguagePair('deepL', sourceLang, targetLang)) {
            throw new Error(`DeepL doesn't support ${sourceLang} → ${targetLang}`);
        }
        
        if (!this.canMakeRequest('deepL', text.length)) {
            throw new Error('DeepL rate limit exceeded');
        }

        const config = this.apis.deepL;
        
        try {
            console.log(`🔄 Trying DeepL API: ${sourceLang} → ${targetLang}...`);
            
            // DeepL language mapping
            const deepLLangMap = {
                'en': 'EN',
                'de': 'DE',
                'fr': 'FR',
                'es': 'ES',
                'pt': 'PT',
                'it': 'IT',
                'nl': 'NL',
                'pl': 'PL',
                'ru': 'RU',
                'ja': 'JA',
                'zh': 'ZH'
            };
            
            const mappedSourceLang = deepLLangMap[sourceLang] || sourceLang.toUpperCase();
            const mappedTargetLang = deepLLangMap[targetLang] || targetLang.toUpperCase();
            
            const requestBody = {
                text: [text.slice(0, config.maxLength)],
                source_lang: mappedSourceLang,
                target_lang: mappedTargetLang
            };

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), config.timeout);

            const response = await fetch(config.baseUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `DeepL-Auth-Key ${config.apiKey}`,
                    'Content-Type': 'application/json',
                    'User-Agent': 'SynthiaBot/1.0'
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            
            if (data.translations && data.translations[0] && data.translations[0].text) {
                this.incrementRequest('deepL', text.length);
                
                return {
                    translatedText: data.translations[0].text.trim(),
                    originalLanguage: this.supportedLanguages.get(sourceLang) || 'Unknown',
                    targetLanguage: this.supportedLanguages.get(targetLang) || 'Unknown',
                    confidence: 99,
                    provider: 'DeepL',
                    detectedLanguage: data.translations[0].detected_source_language?.toLowerCase() || sourceLang
                };
            } else {
                throw new Error('Invalid response structure from DeepL');
            }

        } catch (error) {
            console.error(`❌ DeepL translation failed:`, error.message);
            throw new Error(`DeepL failed: ${error.message}`);
        }
    }

    // MICROSOFT TRANSLATOR (Bidirectional)
    async translateWithMicrosoftTranslator(text, sourceLang, targetLang) {
        if (!this.apis.microsoftTranslator.apiKey) {
            throw new Error('Microsoft Translator API key not configured');
        }
        
        if (!this.canMakeRequest('microsoftTranslator', text.length)) {
            throw new Error('Microsoft Translator rate limit exceeded');
        }

        const config = this.apis.microsoftTranslator;
        
        try {
            console.log(`🔄 Trying Microsoft Translator: ${sourceLang} → ${targetLang}...`);
            
            const params = new URLSearchParams({
                'api-version': '3.0',
                'from': sourceLang === 'auto' ? '' : sourceLang,
                'to': targetLang
            });

            const requestBody = [{
                'text': text.slice(0, config.maxLength)
            }];

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), config.timeout);

            const response = await fetch(`${config.baseUrl}?${params.toString()}`, {
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': config.apiKey,
                    'Ocp-Apim-Subscription-Region': config.region,
                    'Content-Type': 'application/json',
                    'User-Agent': 'SynthiaBot/1.0'
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            
            if (data[0] && data[0].translations && data[0].translations[0]) {
                const translation = data[0].translations[0];
                this.incrementRequest('microsoftTranslator', text.length);
                
                return {
                    translatedText: translation.text.trim(),
                    originalLanguage: this.supportedLanguages.get(sourceLang) || 'Unknown',
                    targetLanguage: this.supportedLanguages.get(targetLang) || 'Unknown',
                    confidence: 97,
                    provider: 'Microsoft Translator',
                    detectedLanguage: data[0].detectedLanguage?.language || sourceLang
                };
            } else {
                throw new Error('Invalid response structure from Microsoft Translator');
            }

        } catch (error) {
            console.error(`❌ Microsoft Translator failed:`, error.message);
            throw new Error(`Microsoft Translator failed: ${error.message}`);
        }
    }

    // LIBRETRANSLATE (Bidirectional)
    async translateWithLibreTranslate(text, sourceLang, targetLang) {
        if (!this.canMakeRequest('libretranslate', text.length)) {
            throw new Error('LibreTranslate rate limit exceeded');
        }

        const config = this.apis.libretranslate;
        let lastError = null;
        
        for (let attempt = 0; attempt < config.instances.length; attempt++) {
            const instanceUrl = config.instances[config.currentInstance];
            
            try {
                console.log(`🔄 Trying LibreTranslate: ${sourceLang} → ${targetLang} (${instanceUrl})`);
                
                const requestBody = {
                    q: text.slice(0, config.maxLength),
                    source: sourceLang === 'auto' ? 'auto' : sourceLang,
                    target: targetLang,
                    format: 'text'
                };

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), config.timeout);

                const response = await fetch(`${instanceUrl}/translate`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'User-Agent': 'SynthiaBot/1.0',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(requestBody),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errorText = await response.text().catch(() => 'Unknown error');
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }

                const data = await response.json();
                
                if (data.translatedText && typeof data.translatedText === 'string' && data.translatedText.trim()) {
                    this.incrementRequest('libretranslate', text.length);
                    return {
                        translatedText: data.translatedText.trim(),
                        originalLanguage: this.supportedLanguages.get(sourceLang) || 'Unknown',
                        targetLanguage: this.supportedLanguages.get(targetLang) || 'Unknown',
                        confidence: 85,
                        provider: `LibreTranslate (${instanceUrl})`,
                        detectedLanguage: data.detectedLanguage?.language || sourceLang
                    };
                } else {
                    throw new Error('No valid translation returned');
                }

            } catch (error) {
                lastError = error;
                console.log(`❌ LibreTranslate ${instanceUrl} failed: ${error.message}`);
                config.currentInstance = (config.currentInstance + 1) % config.instances.length;
            }
        }
        
        throw new Error(`All LibreTranslate instances failed. Last error: ${lastError?.message || 'Unknown'}`);
    }

    // MYMEMORY (Bidirectional)
    async translateWithMyMemory(text, sourceLang, targetLang) {
        if (!this.canMakeRequest('mymemory', text.length)) {
            throw new Error('MyMemory rate limit exceeded');
        }

        const config = this.apis.mymemory;
        
        const normalizeLanguage = (lang) => {
            const langMap = { 'zh': 'zh-CN', 'pt': 'pt-BR' };
            return langMap[lang] || lang;
        };
        
        const langPair = `${normalizeLanguage(sourceLang)}|${normalizeLanguage(targetLang)}`;
        
        const params = new URLSearchParams({
            q: text.slice(0, config.maxLength),
            langpair: langPair
        });
        
        if (config.email) {
            params.append('de', config.email);
        }

        try {
            console.log(`🔄 Trying MyMemory: ${sourceLang} → ${targetLang}...`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), config.timeout);
            
            const response = await fetch(`${config.baseUrl}/get?${params.toString()}`, { 
                signal: controller.signal,
                headers: {
                    'User-Agent': 'SynthiaBot/1.0',
                    'Accept': 'application/json'
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.responseData && data.responseData.translatedText) {
                const original = text.toLowerCase().trim();
                const translated = data.responseData.translatedText.toLowerCase().trim();
                
                if (original === translated && sourceLang !== targetLang) {
                    throw new Error('MyMemory returned untranslated text');
                }
                
                this.incrementRequest('mymemory', text.length);
                
                return {
                    translatedText: data.responseData.translatedText,
                    originalLanguage: this.supportedLanguages.get(sourceLang) || 'Unknown',
                    targetLanguage: this.supportedLanguages.get(targetLang) || 'Unknown',
                    confidence: Math.min(100, (data.responseData.match || 0.8) * 100),
                    provider: 'MyMemory',
                    detectedLanguage: sourceLang,
                    memoryMatches: data.matches?.length || 0
                };
            } else {
                const errorMsg = data.responseDetails || data.responseStatus || 'Invalid response structure';
                throw new Error(`MyMemory error: ${errorMsg}`);
            }

        } catch (error) {
            console.error(`❌ MyMemory translation failed:`, error.message);
            throw new Error(`MyMemory failed: ${error.message}`);
        }
    }

    // LINGVA (Bidirectional - Google Translate frontend)
    async translateWithLingva(text, sourceLang, targetLang) {
        if (!this.canMakeRequest('lingva', text.length)) {
            throw new Error('Lingva rate limit exceeded');
        }

        const config = this.apis.lingva;
        let lastError = null;
        
        for (let attempt = 0; attempt < config.instances.length; attempt++) {
            const instanceUrl = config.instances[config.currentInstance];
            
            try {
                console.log(`🔄 Trying Lingva: ${sourceLang} → ${targetLang} (${instanceUrl})`);
                
                const url = `${instanceUrl}/api/v1/${sourceLang}/${targetLang}/${encodeURIComponent(text.slice(0, config.maxLength))}`;
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), config.timeout);
                
                const response = await fetch(url, { 
                    signal: controller.signal,
                    headers: {
                        'User-Agent': 'SynthiaBot/1.0',
                        'Accept': 'application/json'
                    }
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                
                if (data.translation && typeof data.translation === 'string' && data.translation.trim()) {
                    this.incrementRequest('lingva', text.length);
                    return {
                        translatedText: data.translation.trim(),
                        originalLanguage: this.supportedLanguages.get(sourceLang) || 'Unknown',
                        targetLanguage: this.supportedLanguages.get(targetLang) || 'Unknown',
                        confidence: 78,
                        provider: `Lingva (${instanceUrl})`,
                        detectedLanguage: data.info?.detectedSource || sourceLang
                    };
                } else {
                    throw new Error('No valid translation returned');
                }

            } catch (error) {
                lastError = error;
                console.log(`❌ Lingva ${instanceUrl} failed: ${error.message}`);
                config.currentInstance = (config.currentInstance + 1) % config.instances.length;
            }
        }
        
        throw new Error(`All Lingva instances failed. Last error: ${lastError?.message || 'Unknown'}`);
    }

    // YANDEX TRANSLATE (Bidirectional)
    async translateWithYandex(text, sourceLang, targetLang) {
        if (!this.apis.yandex.apiKey) {
            throw new Error('Yandex API key not configured');
        }
        
        if (!this.canMakeRequest('yandex', text.length)) {
            throw new Error('Yandex rate limit exceeded');
        }

        const config = this.apis.yandex;
        
        try {
            console.log(`🔄 Trying Yandex Translate: ${sourceLang} → ${targetLang}...`);
            
            const params = new URLSearchParams({
                key: config.apiKey,
                text: text.slice(0, config.maxLength),
                lang: sourceLang === 'auto' ? targetLang : `${sourceLang}-${targetLang}`
            });

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), config.timeout);

            const response = await fetch(config.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'SynthiaBot/1.0'
                },
                body: params.toString(),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            
            if (data.code === 200 && data.text && data.text[0]) {
                this.incrementRequest('yandex', text.length);
                
                return {
                    translatedText: data.text[0].trim(),
                    originalLanguage: this.supportedLanguages.get(sourceLang) || 'Unknown',
                    targetLanguage: this.supportedLanguages.get(targetLang) || 'Unknown',
                    confidence: 92,
                    provider: 'Yandex Translate',
                    detectedLanguage: data.detected?.lang || sourceLang
                };
            } else {
                throw new Error(`Yandex API error: ${data.message || 'Unknown error'}`);
            }

        } catch (error) {
            console.error(`❌ Yandex Translate failed:`, error.message);
            throw new Error(`Yandex failed: ${error.message}`);
        }
    }

    // PAPAGO (Bidirectional with supported languages)
    async translateWithPapago(text, sourceLang, targetLang) {
        if (!this.apis.papago.clientId || !this.apis.papago.clientSecret) {
            throw new Error('Papago API credentials not configured');
        }
        
        if (!this.supportsLanguagePair('papago', sourceLang, targetLang)) {
            throw new Error(`Papago doesn't support ${sourceLang} → ${targetLang}`);
        }
        
        if (!this.canMakeRequest('papago', text.length)) {
            throw new Error('Papago rate limit exceeded');
        }

        const config = this.apis.papago;
        
        try {
            console.log(`🔄 Trying Papago (Naver): ${sourceLang} → ${targetLang}...`);
            
            const requestBody = new URLSearchParams({
                source: sourceLang,
                target: targetLang,
                text: text.slice(0, config.maxLength)
            });

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), config.timeout);

            const response = await fetch(config.baseUrl, {
                method: 'POST',
                headers: {
                    'X-Naver-Client-Id': config.clientId,
                    'X-Naver-Client-Secret': config.clientSecret,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'SynthiaBot/1.0'
                },
                body: requestBody.toString(),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            
            if (data.message && data.message.result && data.message.result.translatedText) {
                this.incrementRequest('papago', text.length);
                
                return {
                    translatedText: data.message.result.translatedText.trim(),
                    originalLanguage: this.supportedLanguages.get(sourceLang) || 'Unknown',
                    targetLanguage: this.supportedLanguages.get(targetLang) || 'Unknown',
                    confidence: 90,
                    provider: 'Papago (Naver)',
                    detectedLanguage: sourceLang
                };
            } else {
                throw new Error('Invalid response structure from Papago');
            }

        } catch (error) {
            console.error(`❌ Papago translation failed:`, error.message);
            throw new Error(`Papago failed: ${error.message}`);
        }
    }

    // SYSTRAN (Bidirectional)
    async translateWithSystran(text, sourceLang, targetLang) {
        if (!this.apis.systran.apiKey) {
            throw new Error('Systran API key not configured');
        }
        
        if (!this.canMakeRequest('systran', text.length)) {
            throw new Error('Systran rate limit exceeded');
        }

        const config = this.apis.systran;
        
        try {
            console.log(`🔄 Trying Systran: ${sourceLang} → ${targetLang}...`);
            
            const params = new URLSearchParams({
                key: config.apiKey,
                source: sourceLang,
                target: targetLang,
                input: text.slice(0, config.maxLength)
            });

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), config.timeout);

            const response = await fetch(`${config.baseUrl}?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'User-Agent': 'SynthiaBot/1.0'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            
            if (data.outputs && data.outputs[0] && data.outputs[0].output) {
                this.incrementRequest('systran', text.length);
                
                return {
                    translatedText: data.outputs[0].output.trim(),
                    originalLanguage: this.supportedLanguages.get(sourceLang) || 'Unknown',
                    targetLanguage: this.supportedLanguages.get(targetLang) || 'Unknown',
                    confidence: 89,
                    provider: 'Systran',
                    detectedLanguage: sourceLang
                };
            } else {
                throw new Error('Invalid response structure from Systran');
            }

        } catch (error) {
            console.error(`❌ Systran translation failed:`, error.message);
            throw new Error(`Systran failed: ${error.message}`);
        }
    }

    // NEW: Main bidirectional translation method
    async translateText(text, targetLang = 'en', sourceLang = null) {
        try {
            if (!text || text.trim().length === 0) {
                return {
                    translatedText: text,
                    originalLanguage: 'Unknown',
                    targetLanguage: this.supportedLanguages.get(targetLang) || 'Unknown',
                    confidence: 0,
                    error: 'Empty text'
                };
            }

            // Auto-detect source language if needed
            if (!sourceLang || sourceLang === 'auto') {
                sourceLang = this.detectLanguage(text);
                console.log(`🔍 Detected language: ${sourceLang} for "${text.slice(0, 50)}..."`);
            }

            // Return original if source and target are the same
            if (sourceLang === targetLang) {
                return {
                    translatedText: text,
                    originalLanguage: this.supportedLanguages.get(sourceLang) || 'Unknown',
                    targetLanguage: this.supportedLanguages.get(targetLang) || 'Unknown',
                    confidence: 100,
                    provider: 'No translation needed',
                    detectedLanguage: sourceLang
                };
            }

            // Smart provider ordering based on language pair and availability
            const providers = [
                { name: 'googleTranslate', method: this.translateWithGoogleTranslate.bind(this) },
                { name: 'deepL', method: this.translateWithDeepL.bind(this) },
                { name: 'microsoftTranslator', method: this.translateWithMicrosoftTranslator.bind(this) },
                { name: 'yandex', method: this.translateWithYandex.bind(this) },
                { name: 'papago', method: this.translateWithPapago.bind(this) },
                { name: 'systran', method: this.translateWithSystran.bind(this) },
                { name: 'libretranslate', method: this.translateWithLibreTranslate.bind(this) },
                { name: 'lingva', method: this.translateWithLingva.bind(this) },
                { name: 'mymemory', method: this.translateWithMyMemory.bind(this) }
            ];
            
            // Filter and sort providers by language support and priority
            const availableProviders = providers
                .filter(provider => {
                    return this.canMakeRequest(provider.name, text.length) &&
                           this.supportsLanguagePair(provider.name, sourceLang, targetLang);
                })
                .sort((a, b) => {
                    const configA = this.apis[a.name];
                    const configB = this.apis[b.name];
                    
                    // Prioritize by reliability and priority
                    const scoreA = (configA.reliability || 50) + (10 - (configA.priority || 10));
                    const scoreB = (configB.reliability || 50) + (10 - (configB.priority || 10));
                    
                    return scoreB - scoreA;
                });
            
            console.log(`🎯 Available providers for ${sourceLang} → ${targetLang}: ${availableProviders.map(p => p.name).join(', ')}`);
            
            const errors = [];
            const startTime = Date.now();
            
            // Try providers in priority order
            for (const provider of availableProviders) {
                try {
                    console.log(`🔄 Attempting translation with ${provider.name}...`);
                    
                    const result = await provider.method(text, sourceLang, targetLang);
                    
                    if (result?.translatedText && result.translatedText.trim()) {
                        const processingTime = Date.now() - startTime;
                        result.processingTime = processingTime;
                        
                        console.log(`✅ Translation successful with ${provider.name} in ${processingTime}ms: "${result.translatedText.slice(0, 50)}..."`);
                        return result;
                    }

                } catch (error) {
                    const errorMsg = `${provider.name}: ${error.message}`;
                    errors.push(errorMsg);
                    console.log(`⚠️ ${errorMsg}`);
                    continue;
                }
            }

            // If all providers failed, try fallback with looser restrictions
            console.log(`🔄 All primary providers failed, trying fallback mode...`);
            
            for (const provider of providers) {
                if (!this.canMakeRequest(provider.name, text.length)) continue;
                
                try {
                    // Reduce text length for problematic cases
                    const shortText = text.slice(0, 100);
                    const result = await provider.method(shortText, sourceLang, targetLang);
                    
                    if (result?.translatedText) {
                        result.fallbackMode = true;
                        result.originalLength = text.length;
                        result.translatedLength = shortText.length;
                        
                        console.log(`🆘 Fallback translation with ${provider.name}: "${result.translatedText}"`);
                        return result;
                    }
                } catch (error) {
                    // Continue to next provider
                }
            }

            // All providers failed - return original with comprehensive error info
            console.error(`❌ All translation providers failed for ${sourceLang} → ${targetLang}:`, errors);
            return {
                translatedText: text,
                originalLanguage: this.supportedLanguages.get(sourceLang) || 'Unknown',
                targetLanguage: this.supportedLanguages.get(targetLang) || 'Unknown',
                confidence: 0,
                error: `All ${providers.length} providers failed: ${errors.slice(0, 3).join('; ')}`,
                provider: 'None (fallback)',
                attempts: errors.length,
                processingTime: Date.now() - startTime
            };

        } catch (error) {
            console.error('Translation system error:', error);
            return {
                translatedText: text,
                originalLanguage: 'Unknown',
                targetLanguage: this.supportedLanguages.get(targetLang) || 'Unknown',
                confidence: 0,
                error: `System error: ${error.message}`,
                processingTime: 0
            };
        }
    }

    // Legacy method for backward compatibility
    async translateToEnglish(text, sourceLang = null) {
        return await this.translateText(text, 'en', sourceLang);
    }

    // Enhanced status with detailed provider information
    getStatus() {
        const status = {
            providers: {},
            totalRequests: 0,
            totalCharacters: 0,
            workingInstances: {},
            apiKeys: {},
            performance: {},
            bidirectionalSupport: true
        };

        for (const [provider, limits] of Object.entries(this.requestCounts)) {
            const config = this.apis[provider];
            const charLimits = this.characterCounts[provider];
            const resetIn = Math.max(0, limits.resetTime - Date.now());
            
            status.providers[provider] = {
                requestsUsed: limits.count,
                charactersUsed: charLimits.count,
                rateLimit: config.rateLimit,
                resetInMs: resetIn,
                resetInMinutes: Math.round(resetIn / 60000),
                available: this.canMakeRequest(provider, 100),
                instances: config.instances ? config.instances.length : 1,
                reliability: config.reliability || 'Unknown',
                priority: config.priority || 'Unknown',
                bidirectional: config.bidirectional || false,
                supportedLanguages: config.supportedLanguages ? config.supportedLanguages.length : 'All',
                lastSuccess: new Date(this.lastSuccess[provider] || 0).toLocaleString()
            };
            
            status.totalRequests += limits.count;
            status.totalCharacters += charLimits.count;
            
            // Check API key status
            if (provider === 'deepL') {
                status.apiKeys.deepL = !!config.apiKey;
            } else if (provider === 'microsoftTranslator') {
                status.apiKeys.microsoftTranslator = !!config.apiKey;
            } else if (provider === 'yandex') {
                status.apiKeys.yandex = !!config.apiKey;
            } else if (provider === 'papago') {
                status.apiKeys.papago = !!(config.clientId && config.clientSecret);
            } else if (provider === 'systran') {
                status.apiKeys.systran = !!config.apiKey;
            }
            
            status.workingInstances[provider] = config.instances ? config.instances.length : 1;
        }

        return status;
    }

    // Comprehensive API testing with bidirectional tests
    async testAPIs() {
        const testCases = [
            { text: "Hello, how are you today?", from: "en", to: "es" },
            { text: "Bonjour comment allez-vous?", from: "fr", to: "en" },
            { text: "こんにちは、元気ですか？", from: "ja", to: "en" },
            { text: "Hola, ¿cómo estás?", from: "es", to: "fr" }
        ];
        
        const results = {};
        
        const providers = [
            { name: 'googleTranslate', method: this.translateWithGoogleTranslate.bind(this) },
            { name: 'deepL', method: this.translateWithDeepL.bind(this) },
            { name: 'microsoftTranslator', method: this.translateWithMicrosoftTranslator.bind(this) },
            { name: 'yandex', method: this.translateWithYandex.bind(this) },
            { name: 'papago', method: this.translateWithPapago.bind(this) },
            { name: 'systran', method: this.translateWithSystran.bind(this) },
            { name: 'libretranslate', method: this.translateWithLibreTranslate.bind(this) },
            { name: 'lingva', method: this.translateWithLingva.bind(this) },
            { name: 'mymemory', method: this.translateWithMyMemory.bind(this) }
        ];

        for (const provider of providers) {
            results[provider.name] = { 
                working: false, 
                error: null, 
                time: 0, 
                response: null,
                bidirectionalTests: 0,
                successfulTests: 0
            };
            
            for (const testCase of testCases) {
                const start = Date.now();
                
                // Skip if provider doesn't support this language pair
                if (!this.supportsLanguagePair(provider.name, testCase.from, testCase.to)) {
                    continue;
                }
                
                results[provider.name].bidirectionalTests++;
                
                try {
                    const result = await provider.method(testCase.text, testCase.from, testCase.to);
                    
                    if (result?.translatedText && result.translatedText.trim()) {
                        results[provider.name].successfulTests++;
                        results[provider.name].working = true;
                        results[provider.name].time += Date.now() - start;
                        results[provider.name].response = result.translatedText;
                        results[provider.name].confidence = result.confidence || 0;
                        results[provider.name].provider = result.provider || provider.name;
                    }
                    
                } catch (error) {
                    results[provider.name].error = error.message;
                    results[provider.name].time += Date.now() - start;
                }
            }
            
            // Calculate average time
            if (results[provider.name].bidirectionalTests > 0) {
                results[provider.name].time = Math.round(results[provider.name].time / results[provider.name].bidirectionalTests);
                results[provider.name].successRate = Math.round((results[provider.name].successfulTests / results[provider.name].bidirectionalTests) * 100);
            }
        }

        // Generate summary
        const workingCount = Object.values(results).filter(r => r.working).length;
        const avgTime = Object.values(results).reduce((acc, r) => acc + r.time, 0) / providers.length;
        const totalTests = Object.values(results).reduce((acc, r) => acc + r.bidirectionalTests, 0);
        const successfulTests = Object.values(results).reduce((acc, r) => acc + r.successfulTests, 0);
        
        return {
            individual: results,
            summary: {
                totalProviders: providers.length,
                workingProviders: workingCount,
                failedProviders: providers.length - workingCount,
                averageResponseTime: Math.round(avgTime),
                reliability: Math.round((workingCount / providers.length) * 100),
                bidirectionalTests: totalTests,
                successfulTranslations: successfulTests,
                bidirectionalSuccessRate: Math.round((successfulTests / totalTests) * 100)
            }
        };
    }
}

module.exports = EnhancedTranslationAPI;