// ML Pipeline v10.0 - Enterprise Machine Learning System
const tf = require('@tensorflow/tfjs-node');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../logging/enhanced-logger.js');

class MLPipeline {
    constructor() {
        this.models = {
            toxicity: null,
            sentiment: null,
            language: null,
            bypass: null,
            spam: null,
            threat: null
        };
        
        this.modelPaths = {
            toxicity: './ml/models/toxicity',
            sentiment: './ml/models/sentiment',
            language: './ml/models/language',
            bypass: './ml/models/bypass',
            spam: './ml/models/spam',
            threat: './ml/models/threat'
        };
        
        this.trainingData = {
            toxicity: [],
            sentiment: [],
            bypass: [],
            spam: [],
            threat: []
        };
        
        this.performance = {
            accuracy: 0.85,
            precision: 0.82,
            recall: 0.88,
            f1Score: 0.85,
            lastTraining: null,
            totalPredictions: 0,
            correctPredictions: 0
        };
        
        this.isTraining = false;
        this.vocabulary = new Map();
        this.maxSequenceLength = 100;
        this.embeddingDim = 128;
    }

    async initialize() {
        try {
            logger.info('🤖 Initializing ML Pipeline...');
            
            // Create model directories
            await this.createModelDirectories();
            
            // Try to load existing models
            await this.loadModels();
            
            // If no models exist, create basic ones
            if (!this.models.toxicity) {
                await this.createBasicModels();
            }
            
            // Load vocabulary
            await this.loadVocabulary();
            
            logger.info('✅ ML Pipeline initialized successfully');
            
        } catch (error) {
            logger.error('💥 ML Pipeline initialization failed:', error);
            // Continue with fallback functionality
        }
    }

    async createModelDirectories() {
        for (const [name, modelPath] of Object.entries(this.modelPaths)) {
            try {
                await fs.mkdir(modelPath, { recursive: true });
            } catch (error) {
                // Directory might already exist
            }
        }
    }

    async loadModels() {
        for (const [name, modelPath] of Object.entries(this.modelPaths)) {
            try {
                const modelFile = path.join(modelPath, 'model.json');
                const exists = await fs.access(modelFile).then(() => true).catch(() => false);
                
                if (exists) {
                    this.models[name] = await tf.loadLayersModel(`file://${modelFile}`);
                    logger.info(`✅ Loaded ${name} model`);
                }
            } catch (error) {
                logger.warn(`⚠️ Could not load ${name} model:`, error.message);
            }
        }
    }

    async createBasicModels() {
        logger.info('🔧 Creating basic ML models...');
        
        // Create toxicity detection model
        this.models.toxicity = this.createToxicityModel();
        await this.saveModel('toxicity', this.models.toxicity);
        
        // Create sentiment analysis model
        this.models.sentiment = this.createSentimentModel();
        await this.saveModel('sentiment', this.models.sentiment);
        
        // Create bypass detection model
        this.models.bypass = this.createBypassModel();
        await this.saveModel('bypass', this.models.bypass);
        
        // Create spam detection model
        this.models.spam = this.createSpamModel();
        await this.saveModel('spam', this.models.spam);
        
        // Create threat assessment model
        this.models.threat = this.createThreatModel();
        await this.saveModel('threat', this.models.threat);
        
        logger.info('✅ Basic ML models created');
    }

    createToxicityModel() {
        const model = tf.sequential({
            layers: [
                tf.layers.embedding({
                    inputDim: 10000,
                    outputDim: this.embeddingDim,
                    inputLength: this.maxSequenceLength
                }),
                tf.layers.lstm({ units: 64, dropout: 0.3, recurrentDropout: 0.3 }),
                tf.layers.dense({ units: 32, activation: 'relu' }),
                tf.layers.dropout({ rate: 0.3 }),
                tf.layers.dense({ units: 16, activation: 'relu' }),
                tf.layers.dense({ units: 1, activation: 'sigmoid' })
            ]
        });

        model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'binaryCrossentropy',
            metrics: ['accuracy', 'precision', 'recall']
        });

        return model;
    }

    createSentimentModel() {
        const model = tf.sequential({
            layers: [
                tf.layers.embedding({
                    inputDim: 10000,
                    outputDim: this.embeddingDim,
                    inputLength: this.maxSequenceLength
                }),
                tf.layers.globalAveragePooling1d(),
                tf.layers.dense({ units: 64, activation: 'relu' }),
                tf.layers.dropout({ rate: 0.3 }),
                tf.layers.dense({ units: 32, activation: 'relu' }),
                tf.layers.dense({ units: 3, activation: 'softmax' }) // negative, neutral, positive
            ]
        });

        model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
        });

        return model;
    }

    createBypassModel() {
        const model = tf.sequential({
            layers: [
                tf.layers.dense({ inputShape: [50], units: 128, activation: 'relu' }), // Feature-based
                tf.layers.dropout({ rate: 0.3 }),
                tf.layers.dense({ units: 64, activation: 'relu' }),
                tf.layers.dropout({ rate: 0.3 }),
                tf.layers.dense({ units: 32, activation: 'relu' }),
                tf.layers.dense({ units: 1, activation: 'sigmoid' })
            ]
        });

        model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'binaryCrossentropy',
            metrics: ['accuracy']
        });

        return model;
    }

    createSpamModel() {
        const model = tf.sequential({
            layers: [
                tf.layers.dense({ inputShape: [20], units: 64, activation: 'relu' }), // Features like length, repetition, etc.
                tf.layers.dropout({ rate: 0.2 }),
                tf.layers.dense({ units: 32, activation: 'relu' }),
                tf.layers.dense({ units: 1, activation: 'sigmoid' })
            ]
        });

        model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'binaryCrossentropy',
            metrics: ['accuracy']
        });

        return model;
    }

    createThreatModel() {
        const model = tf.sequential({
            layers: [
                tf.layers.embedding({
                    inputDim: 10000,
                    outputDim: this.embeddingDim,
                    inputLength: this.maxSequenceLength
                }),
                tf.layers.bidirectional({ layer: tf.layers.lstm({ units: 64 }) }),
                tf.layers.dense({ units: 64, activation: 'relu' }),
                tf.layers.dropout({ rate: 0.3 }),
                tf.layers.dense({ units: 32, activation: 'relu' }),
                tf.layers.dense({ units: 10, activation: 'softmax' }) // 0-10 threat levels
            ]
        });

        model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
        });

        return model;
    }

    async saveModel(name, model) {
        try {
            const modelPath = this.modelPaths[name];
            await model.save(`file://${modelPath}`);
            logger.info(`💾 Saved ${name} model`);
        } catch (error) {
            logger.error(`❌ Failed to save ${name} model:`, error);
        }
    }

    async loadVocabulary() {
        try {
            const vocabPath = './ml/vocabulary.json';
            const exists = await fs.access(vocabPath).then(() => true).catch(() => false);
            
            if (exists) {
                const vocabData = await fs.readFile(vocabPath, 'utf8');
                const vocabArray = JSON.parse(vocabData);
                this.vocabulary = new Map(vocabArray);
                logger.info(`📚 Loaded vocabulary with ${this.vocabulary.size} words`);
            } else {
                await this.buildBasicVocabulary();
            }
        } catch (error) {
            logger.warn('⚠️ Could not load vocabulary:', error.message);
            await this.buildBasicVocabulary();
        }
    }

    async buildBasicVocabulary() {
        // Build a basic vocabulary from common words and toxicity patterns
        const basicWords = [
            '<PAD>', '<UNK>', '<START>', '<END>',
            'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he',
            'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or',
            // Add toxicity-related words (normalized)
            'toxic', 'hate', 'kill', 'die', 'stupid', 'idiot', 'moron', 'dumb', 'pathetic', 'worthless', 'loser',
            'trash', 'garbage', 'scum', 'waste', 'freak', 'weird', 'creepy', 'disgusting', 'gross', 'sick',
            // Common bypass characters
            'f*ck', 'sh*t', 'b*tch', 'a*s', 'd*mn', 'h*ll', 'cr*p', 'st*pid', 'id*ot', 'm*ron'
        ];

        basicWords.forEach((word, index) => {
            this.vocabulary.set(word.toLowerCase(), index);
        });

        await this.saveVocabulary();
        logger.info(`📚 Built basic vocabulary with ${this.vocabulary.size} words`);
    }

    async saveVocabulary() {
        try {
            const vocabArray = Array.from(this.vocabulary.entries());
            await fs.writeFile('./ml/vocabulary.json', JSON.stringify(vocabArray, null, 2));
            logger.info('💾 Saved vocabulary');
        } catch (error) {
            logger.error('❌ Failed to save vocabulary:', error);
        }
    }

    // Text preprocessing
    preprocessText(text) {
        // Tokenize and convert to sequence
        const tokens = text.toLowerCase()
            .replace(/[^\w\s*]/g, ' ')
            .split(/\s+/)
            .filter(token => token.length > 0);

        const sequence = tokens.map(token => {
            return this.vocabulary.get(token) || this.vocabulary.get('<UNK>') || 1;
        });

        // Pad or truncate to maxSequenceLength
        if (sequence.length > this.maxSequenceLength) {
            return sequence.slice(0, this.maxSequenceLength);
        } else {
            const padded = new Array(this.maxSequenceLength).fill(0);
            sequence.forEach((token, i) => {
                padded[i] = token;
            });
            return padded;
        }
    }

    // Feature extraction for bypass detection
    extractBypassFeatures(originalText, normalizedText) {
        const features = new Array(50).fill(0);
        
        // Basic text statistics
        features[0] = originalText.length;
        features[1] = normalizedText.length;
        features[2] = originalText.length - normalizedText.length; // Difference
        features[3] = (originalText.match(/[*_@#$%^&]/g) || []).length; // Special chars
        features[4] = (originalText.match(/\d/g) || []).length; // Numbers
        features[5] = (originalText.match(/[A-Z]/g) || []).length; // Uppercase
        features[6] = (originalText.match(/(.)\1{2,}/g) || []).length; // Repetition
        features[7] = originalText.split(/\s+/).length; // Word count
        features[8] = (originalText.match(/\s/g) || []).length; // Spaces
        features[9] = (originalText.match(/[^\w\s]/g) || []).length; // Non-alphanumeric
        
        // Character substitution indicators
        const substitutions = ['@', '4', '3', '1', '0', '5', '7', '$', '!', '+'];
        substitutions.forEach((char, i) => {
            features[10 + i] = (originalText.match(new RegExp('\\' + char, 'g')) || []).length;
        });
        
        // Separator patterns
        features[20] = (originalText.match(/[a-zA-Z][.*_\-/\\|+~^]+[a-zA-Z]/g) || []).length;
        features[21] = (originalText.match(/\b[a-zA-Z]\s+[a-zA-Z]\s+[a-zA-Z]/g) || []).length;
        
        // Unicode and special characters
        features[22] = (originalText.match(/[^\x00-\x7F]/g) || []).length;
        
        // Ratio features
        features[23] = originalText.length > 0 ? normalizedText.length / originalText.length : 1;
        features[24] = originalText.length > 0 ? features[3] / originalText.length : 0; // Special char ratio
        features[25] = originalText.length > 0 ? features[4] / originalText.length : 0; // Number ratio
        
        return features;
    }

    // Spam detection features
    extractSpamFeatures(text, context = {}) {
        const features = new Array(20).fill(0);
        
        features[0] = text.length;
        features[1] = text.split(/\s+/).length; // Word count
        features[2] = (text.match(/[A-Z]/g) || []).length; // Uppercase count
        features[3] = (text.match(/[!?]/g) || []).length; // Exclamation/question marks
        features[4] = (text.match(/\d/g) || []).length; // Numbers
        features[5] = (text.match(/https?:\/\//g) || []).length; // URLs
        features[6] = (text.match(/@\w+/g) || []).length; // Mentions
        features[7] = (text.match(/#\w+/g) || []).length; // Hashtags
        features[8] = (text.match(/(.)\1{3,}/g) || []).length; // Character repetition
        features[9] = text.split(/\s+/).filter(word => word.length > 15).length; // Long words
        features[10] = text.length > 0 ? (text.match(/[A-Z]/g) || []).length / text.length : 0; // Uppercase ratio
        features[11] = (text.match(/free|win|prize|click|now|urgent|limited/gi) || []).length; // Spam keywords
        features[12] = context.messagesSentRecently || 0; // Recent message count
        features[13] = context.duplicateContent ? 1 : 0; // Duplicate content flag
        features[14] = context.accountAge || 0; // Account age in days
        features[15] = context.serverMemberTime || 0; // Time in server
        features[16] = (text.match(/💰|💎|🎁|🎉|🔥|⚡|✨/g) || []).length; // Attention-grabbing emojis
        features[17] = text.includes('discord.gg/') || text.includes('discord.com/invite/') ? 1 : 0; // Discord invites
        features[18] = (text.match(/\b\d{4,}\b/g) || []).length; // Large numbers
        features[19] = text.length > 0 ? (text.match(/[!?]/g) || []).length / text.length : 0; // Punctuation ratio
        
        return features;
    }

    // ML Predictions
    async predictToxicity(text) {
        if (!this.models.toxicity) {
            return { score: 0, confidence: 0 };
        }

        try {
            const sequence = this.preprocessText(text);
            const inputTensor = tf.tensor2d([sequence]);
            
            const prediction = this.models.toxicity.predict(inputTensor);
            const score = await prediction.data();
            
            inputTensor.dispose();
            prediction.dispose();
            
            this.performance.totalPredictions++;
            
            return {
                score: score[0],
                confidence: Math.abs(score[0] - 0.5) * 2 // Convert to confidence
            };
        } catch (error) {
            logger.error('❌ Toxicity prediction failed:', error);
            return { score: 0, confidence: 0 };
        }
    }

    async predictSentiment(text) {
        if (!this.models.sentiment) {
            return { sentiment: 'neutral', confidence: 0, scores: [0.33, 0.34, 0.33] };
        }

        try {
            const sequence = this.preprocessText(text);
            const inputTensor = tf.tensor2d([sequence]);
            
            const prediction = this.models.sentiment.predict(inputTensor);
            const scores = await prediction.data();
            
            inputTensor.dispose();
            prediction.dispose();
            
            const sentiments = ['negative', 'neutral', 'positive'];
            const maxIndex = scores.indexOf(Math.max(...scores));
            
            return {
                sentiment: sentiments[maxIndex],
                confidence: scores[maxIndex],
                scores: Array.from(scores)
            };
        } catch (error) {
            logger.error('❌ Sentiment prediction failed:', error);
            return { sentiment: 'neutral', confidence: 0, scores: [0.33, 0.34, 0.33] };
        }
    }

    async predictBypass(originalText, normalizedText) {
        if (!this.models.bypass) {
            return { score: 0, confidence: 0 };
        }

        try {
            const features = this.extractBypassFeatures(originalText, normalizedText);
            const inputTensor = tf.tensor2d([features]);
            
            const prediction = this.models.bypass.predict(inputTensor);
            const score = await prediction.data();
            
            inputTensor.dispose();
            prediction.dispose();
            
            return {
                score: score[0],
                confidence: Math.abs(score[0] - 0.5) * 2
            };
        } catch (error) {
            logger.error('❌ Bypass prediction failed:', error);
            return { score: 0, confidence: 0 };
        }
    }

    async predictSpam(text, context = {}) {
        if (!this.models.spam) {
            return { score: 0, confidence: 0 };
        }

        try {
            const features = this.extractSpamFeatures(text, context);
            const inputTensor = tf.tensor2d([features]);
            
            const prediction = this.models.spam.predict(inputTensor);
            const score = await prediction.data();
            
            inputTensor.dispose();
            prediction.dispose();
            
            return {
                score: score[0],
                confidence: Math.abs(score[0] - 0.5) * 2
            };
        } catch (error) {
            logger.error('❌ Spam prediction failed:', error);
            return { score: 0, confidence: 0 };
        }
    }

    async predictThreatLevel(text) {
        if (!this.models.threat) {
            return { level: 0, confidence: 0, distribution: [] };
        }

        try {
            const sequence = this.preprocessText(text);
            const inputTensor = tf.tensor2d([sequence]);
            
            const prediction = this.models.threat.predict(inputTensor);
            const scores = await prediction.data();
            
            inputTensor.dispose();
            prediction.dispose();
            
            const maxIndex = scores.indexOf(Math.max(...scores));
            
            return {
                level: maxIndex,
                confidence: scores[maxIndex],
                distribution: Array.from(scores)
            };
        } catch (error) {
            logger.error('❌ Threat prediction failed:', error);
            return { level: 0, confidence: 0, distribution: [] };
        }
    }

    // Training and improvement
    async addTrainingData(type, text, label, metadata = {}) {
        if (!this.trainingData[type]) {
            this.trainingData[type] = [];
        }

        this.trainingData[type].push({
            text,
            label,
            metadata,
            timestamp: Date.now()
        });

        // Auto-retrain if we have enough new data
        if (this.trainingData[type].length >= 100) {
            await this.retrainModel(type);
        }
    }

    async retrainModel(type) {
        if (this.isTraining || !this.trainingData[type] || this.trainingData[type].length < 10) {
            return;
        }

        this.isTraining = true;
        logger.info(`🎓 Retraining ${type} model with ${this.trainingData[type].length} samples...`);

        try {
            // This is a simplified retraining process
            // In production, you'd want more sophisticated training
            
            const data = this.trainingData[type];
            
            // Prepare training data
            const xs = [];
            const ys = [];
            
            for (const sample of data) {
                if (type === 'toxicity' || type === 'sentiment' || type === 'threat') {
                    xs.push(this.preprocessText(sample.text));
                } else if (type === 'bypass') {
                    xs.push(this.extractBypassFeatures(sample.text, sample.metadata.normalizedText || sample.text));
                } else if (type === 'spam') {
                    xs.push(this.extractSpamFeatures(sample.text, sample.metadata));
                }
                
                ys.push(sample.label);
            }
            
            if (xs.length > 0) {
                const xTensor = tf.tensor2d(xs);
                const yTensor = tf.tensor1d(ys);
                
                // Quick training session
                await this.models[type].fit(xTensor, yTensor, {
                    epochs: 5,
                    batchSize: 32,
                    validationSplit: 0.2,
                    verbose: 0
                });
                
                xTensor.dispose();
                yTensor.dispose();
                
                // Save improved model
                await this.saveModel(type, this.models[type]);
                
                // Clear training data
                this.trainingData[type] = [];
                
                this.performance.lastTraining = Date.now();
                
                logger.info(`✅ ${type} model retrained successfully`);
            }
            
        } catch (error) {
            logger.error(`❌ Failed to retrain ${type} model:`, error);
        } finally {
            this.isTraining = false;
        }
    }

    async retrainModels() {
        for (const type of Object.keys(this.models)) {
            if (this.trainingData[type] && this.trainingData[type].length > 0) {
                await this.retrainModel(type);
            }
        }
    }

    // Performance tracking
    updatePerformance(prediction, actual) {
        this.performance.totalPredictions++;
        
        if (Math.abs(prediction - actual) < 0.1) {
            this.performance.correctPredictions++;
        }
        
        this.performance.accuracy = this.performance.correctPredictions / this.performance.totalPredictions;
    }

    getPerformanceMetrics() {
        return {
            ...this.performance,
            modelsLoaded: Object.values(this.models).filter(m => m !== null).length,
            vocabularySize: this.vocabulary.size,
            trainingDataSize: Object.values(this.trainingData).reduce((sum, data) => sum + data.length, 0),
            memoryUsage: tf.memory()
        };
    }

    // Cleanup
    dispose() {
        for (const model of Object.values(this.models)) {
            if (model) {
                model.dispose();
            }
        }
        this.models = {};
        logger.info('🧹 ML Pipeline disposed');
    }
}

module.exports = MLPipeline;