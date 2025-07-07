const OpenAI = require('openai');
const config = require('../config/enhanced-config.js');
const Logger = require('../logging/enhanced-logger.js');

class EnhancedSynthiaAI {
    constructor(database, cache, mlPipeline) {
        this.database = database;
        this.cache = cache;
        this.mlPipeline = mlPipeline;
        this.logger = new Logger('SynthiaAI');
        this.openai = null;
        this.initialized = false;
        
        this.conversationContexts = new Map();
        this.userProfiles = new Map();
        
        this.stats = {
            totalInteractions: 0,
            successfulResponses: 0,
            failedResponses: 0,
            averageResponseTime: 0,
            tokensUsed: 0
        };
    }

    async initialize() {
        try {
            this.logger.info('Initializing Enhanced Synthia AI...');
            
            if (!config.ai.openai.apiKey) {
                throw new Error('OpenAI API key not configured');
            }
            
            this.openai = new OpenAI({
                apiKey: config.ai.openai.apiKey
            });
            
            // Test the API connection
            await this.testAPIConnection();
            
            // Load user profiles and conversation contexts from cache
            await this.loadContextsFromCache();
            
            this.initialized = true;
            this.logger.info('Enhanced Synthia AI initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize Enhanced Synthia AI:', error);
            throw error;
        }
    }

    async testAPIConnection() {
        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: 'Test connection' }],
                max_tokens: 5,
                temperature: 0
            });
            
            this.logger.info('OpenAI API connection successful');
            return response;
        } catch (error) {
            this.logger.error('OpenAI API connection failed:', error);
            throw error;
        }
    }

    async loadContextsFromCache() {
        try {
            // Load conversation contexts
            const contextKeys = await this.cache.getKeys('conversation_context:*');
            for (const key of contextKeys) {
                const context = await this.cache.get(key);
                if (context) {
                    const userId = key.split(':')[1];
                    this.conversationContexts.set(userId, context);
                }
            }
            
            // Load user profiles
            const profileKeys = await this.cache.getKeys('user_profile:*');
            for (const key of profileKeys) {
                const profile = await this.cache.getUserProfile(key.split(':')[1]);
                if (profile) {
                    const userId = key.split(':')[1];
                    this.userProfiles.set(userId, profile);
                }
            }
            
            this.logger.info(`Loaded ${this.conversationContexts.size} conversation contexts and ${this.userProfiles.size} user profiles`);
        } catch (error) {
            this.logger.error('Failed to load contexts from cache:', error);
        }
    }

    async analyzeMessage(message) {
        const startTime = Date.now();
        
        try {
            this.stats.totalInteractions++;
            
            // Check cache for existing analysis
            const cachedAnalysis = await this.cache.getMessageAnalysis(message.id);
            if (cachedAnalysis) {
                return cachedAnalysis;
            }
            
            const analysis = {
                messageId: message.id,
                userId: message.author.id,
                guildId: message.guild?.id,
                content: message.content,
                timestamp: new Date(),
                
                // AI Analysis Results
                sentiment: null,
                toxicity: null,
                intent: null,
                entities: [],
                language: null,
                
                // Flags and Actions
                requiresModeration: false,
                requiresTranslation: false,
                requiresResponse: false,
                threatLevel: 0,
                
                // Metadata
                confidence: 0,
                processingTime: 0,
                apiCallsUsed: 0
            };
            
            // Skip analysis for bots or empty messages
            if (message.author.bot || !message.content?.trim()) {
                analysis.processingTime = Date.now() - startTime;
                return analysis;
            }
            
            // Perform various analyses in parallel
            const analysisPromises = [
                this.analyzeSentiment(message.content),
                this.detectToxicity(message.content),
                this.extractIntent(message),
                this.extractEntities(message.content),
                this.detectLanguage(message.content),
                this.checkForModeration(message),
                this.assessThreatLevel(message)
            ];
            
            const [
                sentiment,
                toxicity,
                intent,
                entities,
                language,
                moderationCheck,
                threatLevel
            ] = await Promise.allSettled(analysisPromises);
            
            // Process results
            if (sentiment.status === 'fulfilled') {
                analysis.sentiment = sentiment.value;
            }
            
            if (toxicity.status === 'fulfilled') {
                analysis.toxicity = toxicity.value;
            }
            
            if (intent.status === 'fulfilled') {
                analysis.intent = intent.value;
                analysis.apiCallsUsed++;
            }
            
            if (entities.status === 'fulfilled') {
                analysis.entities = entities.value;
            }
            
            if (language.status === 'fulfilled') {
                analysis.language = language.value;
            }
            
            if (moderationCheck.status === 'fulfilled') {
                analysis.requiresModeration = moderationCheck.value.requiresModeration;
                analysis.moderationReason = moderationCheck.value.reason;
            }
            
            if (threatLevel.status === 'fulfilled') {
                analysis.threatLevel = threatLevel.value;
            }
            
            // Determine if response is required
            analysis.requiresResponse = await this.shouldRespond(message, analysis);
            
            // Check if translation is needed
            analysis.requiresTranslation = await this.shouldTranslate(message, analysis);
            
            // Calculate overall confidence
            analysis.confidence = this.calculateConfidence(analysis);
            
            analysis.processingTime = Date.now() - startTime;
            
            // Cache the analysis
            await this.cache.cacheMessageAnalysis(message.id, analysis);
            
            // Update user context
            await this.updateUserContext(message.author.id, message, analysis);
            
            this.stats.successfulResponses++;
            this.stats.averageResponseTime = (this.stats.averageResponseTime + analysis.processingTime) / 2;
            
            return analysis;
            
        } catch (error) {
            this.logger.error('Message analysis failed:', error);
            this.stats.failedResponses++;
            
            return {
                messageId: message.id,
                error: error.message,
                processingTime: Date.now() - startTime
            };
        }
    }

    async analyzeSentiment(text) {
        try {
            // Use ML pipeline for sentiment analysis
            if (this.mlPipeline && this.mlPipeline.sentimentAnalyzer) {
                return await this.mlPipeline.sentimentAnalyzer.analyze(text);
            }
            
            // Fallback to simple sentiment analysis
            const positiveWords = ['good', 'great', 'awesome', 'love', 'excellent', 'amazing', 'wonderful'];
            const negativeWords = ['bad', 'terrible', 'hate', 'awful', 'horrible', 'disgusting', 'worst'];
            
            const words = text.toLowerCase().split(/\s+/);
            let score = 0;
            
            for (const word of words) {
                if (positiveWords.includes(word)) score += 1;
                if (negativeWords.includes(word)) score -= 1;
            }
            
            return {
                score: Math.max(-1, Math.min(1, score / words.length)),
                label: score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral',
                confidence: Math.abs(score) / words.length
            };
        } catch (error) {
            this.logger.error('Sentiment analysis failed:', error);
            return { score: 0, label: 'neutral', confidence: 0 };
        }
    }

    async detectToxicity(text) {
        try {
            // Use ML pipeline for toxicity detection
            if (this.mlPipeline && this.mlPipeline.toxicityDetector) {
                return await this.mlPipeline.toxicityDetector.analyze(text);
            }
            
            // Fallback to basic profanity detection
            const toxicWords = ['fuck', 'shit', 'damn', 'ass', 'bitch', 'idiot', 'stupid', 'kill', 'die'];
            const lowerText = text.toLowerCase();
            
            let toxicCount = 0;
            for (const word of toxicWords) {
                if (lowerText.includes(word)) {
                    toxicCount++;
                }
            }
            
            const toxicityScore = Math.min(1, toxicCount / 10);
            
            return {
                score: toxicityScore,
                isToxic: toxicityScore > 0.5,
                confidence: toxicityScore,
                categories: toxicityScore > 0.5 ? ['profanity'] : []
            };
        } catch (error) {
            this.logger.error('Toxicity detection failed:', error);
            return { score: 0, isToxic: false, confidence: 0, categories: [] };
        }
    }

    async extractIntent(message) {
        try {
            const content = message.content.toLowerCase().trim();
            
            // Check for common intents
            if (content.includes('?')) {
                return { intent: 'question', confidence: 0.8 };
            }
            
            if (content.startsWith('!') || content.startsWith('/')) {
                return { intent: 'command', confidence: 0.9 };
            }
            
            if (content.includes('hello') || content.includes('hi ') || content.includes('hey')) {
                return { intent: 'greeting', confidence: 0.7 };
            }
            
            if (content.includes('thank') || content.includes('thanks')) {
                return { intent: 'gratitude', confidence: 0.7 };
            }
            
            if (content.includes('bye') || content.includes('goodbye') || content.includes('see you')) {
                return { intent: 'farewell', confidence: 0.7 };
            }
            
            // Use OpenAI for complex intent detection
            if (content.length > 20) {
                return await this.detectIntentWithAI(content);
            }
            
            return { intent: 'general', confidence: 0.5 };
            
        } catch (error) {
            this.logger.error('Intent extraction failed:', error);
            return { intent: 'unknown', confidence: 0 };
        }
    }

    async detectIntentWithAI(text) {
        try {
            const response = await this.openai.chat.completions.create({
                model: config.ai.openai.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an intent classifier. Classify the user message into one of these categories: question, request, complaint, compliment, command, greeting, farewell, general. Respond with just the category name.'
                    },
                    {
                        role: 'user',
                        content: text
                    }
                ],
                max_tokens: 10,
                temperature: 0.1
            });
            
            const intent = response.choices[0]?.message?.content?.trim().toLowerCase();
            
            return {
                intent: intent || 'general',
                confidence: 0.8
            };
            
        } catch (error) {
            this.logger.error('AI intent detection failed:', error);
            return { intent: 'general', confidence: 0.5 };
        }
    }

    async extractEntities(text) {
        try {
            // Use ML pipeline for entity extraction
            if (this.mlPipeline && this.mlPipeline.entityExtractor) {
                return await this.mlPipeline.entityExtractor.extract(text);
            }
            
            // Basic entity extraction
            const entities = [];
            
            // Extract mentions
            const mentions = text.match(/<@!?(\d+)>/g);
            if (mentions) {
                entities.push(...mentions.map(mention => ({
                    type: 'user_mention',
                    value: mention,
                    confidence: 1.0
                })));
            }
            
            // Extract URLs
            const urls = text.match(/https?:\/\/[^\s]+/g);
            if (urls) {
                entities.push(...urls.map(url => ({
                    type: 'url',
                    value: url,
                    confidence: 1.0
                })));
            }
            
            // Extract numbers
            const numbers = text.match(/\b\d+\b/g);
            if (numbers) {
                entities.push(...numbers.map(number => ({
                    type: 'number',
                    value: parseInt(number),
                    confidence: 0.8
                })));
            }
            
            return entities;
            
        } catch (error) {
            this.logger.error('Entity extraction failed:', error);
            return [];
        }
    }

    async detectLanguage(text) {
        try {
            // Simple language detection based on common words
            const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
            const spanishWords = ['el', 'la', 'y', 'o', 'pero', 'en', 'de', 'con', 'por', 'para', 'que', 'es'];
            const frenchWords = ['le', 'la', 'et', 'ou', 'mais', 'en', 'de', 'avec', 'par', 'pour', 'que', 'est'];
            
            const words = text.toLowerCase().split(/\s+/);
            
            let englishCount = 0;
            let spanishCount = 0;
            let frenchCount = 0;
            
            for (const word of words) {
                if (englishWords.includes(word)) englishCount++;
                if (spanishWords.includes(word)) spanishCount++;
                if (frenchWords.includes(word)) frenchCount++;
            }
            
            if (englishCount >= spanishCount && englishCount >= frenchCount) {
                return { language: 'en', confidence: englishCount / words.length };
            } else if (spanishCount >= frenchCount) {
                return { language: 'es', confidence: spanishCount / words.length };
            } else {
                return { language: 'fr', confidence: frenchCount / words.length };
            }
            
        } catch (error) {
            this.logger.error('Language detection failed:', error);
            return { language: 'en', confidence: 0.5 };
        }
    }

    async checkForModeration(message) {
        try {
            const content = message.content.toLowerCase();
            const moderationTriggers = [
                'spam', 'advertisement', 'inappropriate', 'offensive',
                'harassment', 'bullying', 'threat', 'violence'
            ];
            
            let requiresModeration = false;
            let reason = null;
            
            // Check for spam patterns
            if (message.content.length > 500 && message.content.split(' ').length < 10) {
                requiresModeration = true;
                reason = 'potential_spam';
            }
            
            // Check for excessive caps
            const capsRatio = (message.content.match(/[A-Z]/g) || []).length / message.content.length;
            if (capsRatio > 0.7 && message.content.length > 10) {
                requiresModeration = true;
                reason = 'excessive_caps';
            }
            
            // Check for moderation triggers
            for (const trigger of moderationTriggers) {
                if (content.includes(trigger)) {
                    requiresModeration = true;
                    reason = 'contains_trigger_word';
                    break;
                }
            }
            
            return { requiresModeration, reason };
            
        } catch (error) {
            this.logger.error('Moderation check failed:', error);
            return { requiresModeration: false, reason: null };
        }
    }

    async assessThreatLevel(message) {
        try {
            const content = message.content.toLowerCase();
            const threatWords = ['kill', 'die', 'murder', 'bomb', 'attack', 'hurt', 'harm', 'destroy'];
            
            let threatScore = 0;
            
            for (const word of threatWords) {
                if (content.includes(word)) {
                    threatScore += 0.3;
                }
            }
            
            // Check for urgent language
            if (content.includes('urgent') || content.includes('emergency')) {
                threatScore += 0.2;
            }
            
            // Check for targeting language
            if (content.includes('you') && threatWords.some(word => content.includes(word))) {
                threatScore += 0.4;
            }
            
            return Math.min(1, threatScore);
            
        } catch (error) {
            this.logger.error('Threat assessment failed:', error);
            return 0;
        }
    }

    async shouldRespond(message, analysis) {
        try {
            // Always respond to direct mentions
            if (message.mentions.users.has(message.client.user.id)) {
                return true;
            }
            
            // Respond to questions
            if (analysis.intent?.intent === 'question') {
                return true;
            }
            
            // Respond to greetings
            if (analysis.intent?.intent === 'greeting') {
                return true;
            }
            
            // Respond to high sentiment messages
            if (analysis.sentiment?.score && Math.abs(analysis.sentiment.score) > 0.7) {
                return true;
            }
            
            // Random chance for general engagement
            return Math.random() < 0.1;
            
        } catch (error) {
            this.logger.error('Response decision failed:', error);
            return false;
        }
    }

    async shouldTranslate(message, analysis) {
        try {
            // Don't translate if language detection confidence is low
            if (!analysis.language || analysis.language.confidence < 0.7) {
                return false;
            }
            
            // Don't translate English messages
            if (analysis.language.language === 'en') {
                return false;
            }
            
            // Translate if message is long enough and in another language
            return message.content.length > 20;
            
        } catch (error) {
            this.logger.error('Translation decision failed:', error);
            return false;
        }
    }

    calculateConfidence(analysis) {
        let totalConfidence = 0;
        let componentCount = 0;
        
        if (analysis.sentiment?.confidence !== undefined) {
            totalConfidence += analysis.sentiment.confidence;
            componentCount++;
        }
        
        if (analysis.toxicity?.confidence !== undefined) {
            totalConfidence += analysis.toxicity.confidence;
            componentCount++;
        }
        
        if (analysis.intent?.confidence !== undefined) {
            totalConfidence += analysis.intent.confidence;
            componentCount++;
        }
        
        if (analysis.language?.confidence !== undefined) {
            totalConfidence += analysis.language.confidence;
            componentCount++;
        }
        
        return componentCount > 0 ? totalConfidence / componentCount : 0;
    }

    async updateUserContext(userId, message, analysis) {
        try {
            let context = this.conversationContexts.get(userId) || {
                userId,
                messages: [],
                preferences: {},
                lastInteraction: null,
                totalMessages: 0
            };
            
            // Add message to context
            context.messages.push({
                id: message.id,
                content: message.content,
                timestamp: new Date(),
                analysis: {
                    sentiment: analysis.sentiment,
                    intent: analysis.intent,
                    language: analysis.language
                }
            });
            
            // Keep only last 10 messages
            if (context.messages.length > 10) {
                context.messages = context.messages.slice(-10);
            }
            
            context.lastInteraction = new Date();
            context.totalMessages++;
            
            // Update in memory and cache
            this.conversationContexts.set(userId, context);
            await this.cache.set(`conversation_context:${userId}`, context, 3600); // 1 hour TTL
            
        } catch (error) {
            this.logger.error('Failed to update user context:', error);
        }
    }

    async generateResponse(message, analysis) {
        try {
            const context = this.conversationContexts.get(message.author.id);
            
            const systemPrompt = `You are Synthia, an advanced AI assistant for Discord servers. You are helpful, friendly, and knowledgeable. 
            
            Current context:
            - User sentiment: ${analysis.sentiment?.label || 'neutral'}
            - Message intent: ${analysis.intent?.intent || 'general'}
            - Language: ${analysis.language?.language || 'en'}
            
            Guidelines:
            - Keep responses concise (under 200 characters for Discord)
            - Be helpful and friendly
            - Consider the conversation context
            - Adapt your tone to match the user's sentiment`;
            
            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message.content }
            ];
            
            // Add conversation context
            if (context?.messages?.length > 0) {
                const recentMessages = context.messages.slice(-3);
                for (const msg of recentMessages) {
                    messages.splice(-1, 0, {
                        role: 'user',
                        content: msg.content
                    });
                }
            }
            
            const response = await this.openai.chat.completions.create({
                model: config.ai.openai.model,
                messages,
                max_tokens: 150,
                temperature: config.ai.openai.temperature,
                presence_penalty: config.ai.openai.presencePenalty,
                frequency_penalty: config.ai.openai.frequencyPenalty
            });
            
            this.stats.tokensUsed += response.usage?.total_tokens || 0;
            
            return response.choices[0]?.message?.content?.trim();
            
        } catch (error) {
            this.logger.error('Response generation failed:', error);
            return null;
        }
    }

    getStats() {
        return {
            ...this.stats,
            contextsLoaded: this.conversationContexts.size,
            profilesLoaded: this.userProfiles.size,
            initialized: this.initialized
        };
    }

    async cleanup() {
        // Save contexts to cache before shutdown
        for (const [userId, context] of this.conversationContexts) {
            await this.cache.set(`conversation_context:${userId}`, context, 3600);
        }
        
        this.conversationContexts.clear();
        this.userProfiles.clear();
    }
}

module.exports = EnhancedSynthiaAI;
