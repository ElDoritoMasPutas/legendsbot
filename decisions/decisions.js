// Multi-API Decision Engine v1.0 - Enterprise-Grade Content Analysis
const fetch = require('node-fetch');

class MultiAPIDecisionEngine {
    constructor() {
        this.initializeAPIs();
        this.initializeWeightingSystem();
        this.initializeDecisionHistory();
        this.loadAPICredentials();
    }

    loadAPICredentials() {
        this.apiKeys = {
            perspective: process.env.PERSPECTIVE_API_KEY,
            huggingface: process.env.HUGGINGFACE_API_KEY,
            googleCloud: process.env.GOOGLE_CLOUD_API_KEY,
            azure: process.env.AZURE_TEXT_ANALYTICS_KEY,
            openai: process.env.OPENAI_API_KEY
        };
        
        console.log('🔑 API Keys loaded:');
        console.log(`   Perspective API: ${this.apiKeys.perspective ? '✅' : '❌'}`);
        console.log(`   Hugging Face: ${this.apiKeys.huggingface ? '✅' : '❌'}`);
        console.log(`   Google Cloud: ${this.apiKeys.googleCloud ? '✅' : '❌'}`);
        console.log(`   Azure: ${this.apiKeys.azure ? '✅' : '❌'}`);
        console.log(`   OpenAI: ${this.apiKeys.openai ? '✅' : '❌'}`);
    }

    initializeAPIs() {
        // Define all available APIs with their characteristics
        this.apis = {
            perspective: {
                name: 'Perspective API',
                endpoint: 'https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze',
                strengths: ['toxicity', 'threats', 'harassment'],
                weaknesses: ['context', 'sarcasm'],
                baseWeight: 0.25,
                timeout: 5000,
                rateLimit: 100, // requests per minute
                costPerRequest: 0, // Free
                enabled: true
            },
            huggingface: {
                name: 'Hugging Face',
                endpoint: 'https://api-inference.huggingface.co/models/unitary/toxic-bert',
                strengths: ['general_toxicity', 'context'],
                weaknesses: ['new_slang'],
                baseWeight: 0.20,
                timeout: 8000,
                rateLimit: 30,
                costPerRequest: 0, // Free tier
                enabled: true
            },
            googleCloud: {
                name: 'Google Cloud NL',
                endpoint: 'https://language.googleapis.com/v1/documents:classifyText',
                strengths: ['sentiment', 'context', 'language_detection'],
                weaknesses: ['new_slang', 'gaming_terms'],
                baseWeight: 0.20,
                timeout: 6000,
                rateLimit: 1000,
                costPerRequest: 0.001, // $1 per 1000 requests
                enabled: true
            },
            azure: {
                name: 'Azure Text Analytics',
                endpoint: 'https://your-region.api.cognitive.microsoft.com/text/analytics/v3.1/sentiment',
                strengths: ['sentiment', 'key_phrases', 'entities'],
                weaknesses: ['bypass_detection'],
                baseWeight: 0.15,
                timeout: 6000,
                rateLimit: 1000,
                costPerRequest: 0.001,
                enabled: false // Enable when you have Azure key
            },
            localML: {
                name: 'Local ML Model',
                strengths: ['privacy', 'speed', 'gaming_context'],
                weaknesses: ['accuracy', 'new_patterns'],
                baseWeight: 0.10,
                timeout: 1000,
                rateLimit: 999999,
                costPerRequest: 0,
                enabled: true
            },
            synthiaLocal: {
                name: 'Synthia Local Rules',
                strengths: ['pokemon_context', 'gaming_terms', 'known_patterns'],
                weaknesses: ['new_slang', 'context'],
                baseWeight: 0.10,
                timeout: 100,
                rateLimit: 999999,
                costPerRequest: 0,
                enabled: true
            }
        };
    }

    initializeWeightingSystem() {
        // Dynamic weighting based on historical performance
        this.weightingFactors = {
            // Accuracy weights (updated based on feedback)
            accuracyWeight: 0.4,
            consensusWeight: 0.3,
            confidenceWeight: 0.2,
            speedWeight: 0.1,
            
            // Content type specific weights
            contentTypeWeights: {
                gaming: {
                    synthiaLocal: 0.3,
                    perspective: 0.25,
                    huggingface: 0.25,
                    localML: 0.2
                },
                pokemon: {
                    synthiaLocal: 0.4,
                    localML: 0.3,
                    perspective: 0.2,
                    huggingface: 0.1
                },
                general: {
                    perspective: 0.3,
                    huggingface: 0.25,
                    googleCloud: 0.25,
                    synthiaLocal: 0.2
                },
                suspected_bypass: {
                    synthiaLocal: 0.4,
                    perspective: 0.3,
                    huggingface: 0.2,
                    localML: 0.1
                }
            }
        };
    }

    initializeDecisionHistory() {
        this.decisionHistory = {
            totalAnalyses: 0,
            apiPerformance: {},
            consensusAccuracy: 0,
            falsePositiveRate: 0,
            falseNegativeRate: 0
        };
        
        // Initialize performance tracking for each API
        for (const apiName of Object.keys(this.apis)) {
            this.decisionHistory.apiPerformance[apiName] = {
                totalCalls: 0,
                successfulCalls: 0,
                averageResponseTime: 0,
                accuracyScore: 0.8, // Start with 80% assumed accuracy
                falsePositives: 0,
                falseNegatives: 0,
                lastUpdated: Date.now()
            };
        }
    }

    // MAIN DECISION ENGINE - Analyzes text using multiple APIs
    async analyzeWithMultiAPI(text, context = {}) {
        console.log(`🧠 Multi-API Decision Engine analyzing: "${text.slice(0, 50)}..."`);
        
        const analysisResults = {
            text: text,
            context: context,
            timestamp: Date.now(),
            apiResults: {},
            finalDecision: null,
            confidence: 0,
            processing: {
                startTime: Date.now(),
                endTime: null,
                totalTime: 0
            }
        };

        // Step 1: Quick pre-analysis to determine content type
        const contentType = this.determineContentType(text, context);
        console.log(`📊 Content type detected: ${contentType}`);

        // Step 2: Call all available APIs in parallel
        const apiPromises = [];
        
        for (const [apiName, apiConfig] of Object.entries(this.apis)) {
            if (apiConfig.enabled) {
                apiPromises.push(
                    this.callAPIWithTimeout(apiName, text, context)
                        .then(result => ({ api: apiName, result }))
                        .catch(error => ({ api: apiName, error: error.message }))
                );
            }
        }

        // Step 3: Wait for all APIs to respond (or timeout)
        const apiResponses = await Promise.allSettled(apiPromises);
        
        // Step 4: Process each API response
        for (const response of apiResponses) {
            if (response.status === 'fulfilled' && response.value.result) {
                const { api, result } = response.value;
                analysisResults.apiResults[api] = result;
                
                // Update performance tracking
                this.updateAPIPerformance(api, true, result.responseTime);
            } else if (response.status === 'fulfilled' && response.value.error) {
                const { api, error } = response.value;
                analysisResults.apiResults[api] = { error: error, available: false };
                
                // Update performance tracking
                this.updateAPIPerformance(api, false, 0);
            }
        }

        // Step 5: Apply intelligent decision logic
        analysisResults.finalDecision = await this.makeIntelligentDecision(
            analysisResults.apiResults, 
            contentType, 
            text, 
            context
        );

        analysisResults.processing.endTime = Date.now();
        analysisResults.processing.totalTime = analysisResults.processing.endTime - analysisResults.processing.startTime;

        console.log(`🎯 Final Decision: Toxicity ${analysisResults.finalDecision.toxicityScore}/10, Confidence: ${analysisResults.finalDecision.confidence}%`);
        console.log(`⚡ Total processing time: ${analysisResults.processing.totalTime}ms`);

        // Step 6: Log for continuous improvement
        this.logDecisionForLearning(analysisResults);

        return analysisResults.finalDecision;
    }

    // Determine what type of content we're analyzing
    determineContentType(text, context) {
        const lowerText = text.toLowerCase();
        
        // Pokemon content
        if (lowerText.includes('pokemon') || lowerText.includes('shiny') || 
            lowerText.includes('.pk') || lowerText.includes('trade') ||
            context.channel?.name?.includes('pokemon')) {
            return 'pokemon';
        }
        
        // Gaming content
        if (lowerText.includes('gg') || lowerText.includes('game') || 
            lowerText.includes('play') || lowerText.includes('team') ||
            context.channel?.name?.includes('game')) {
            return 'gaming';
        }
        
        // Suspected bypass attempt
        if (this.hasBypassIndicators(text)) {
            return 'suspected_bypass';
        }
        
        return 'general';
    }

    hasBypassIndicators(text) {
        return /[*@$!]{2,}|(.)\1{4,}|[a-z][.*_\-]{2,}[a-z]/i.test(text);
    }

    // Call individual API with timeout and error handling
    async callAPIWithTimeout(apiName, text, context) {
        const apiConfig = this.apis[apiName];
        const startTime = Date.now();
        
        try {
            let result;
            
            switch (apiName) {
                case 'perspective':
                    result = await this.callPerspectiveAPI(text);
                    break;
                case 'huggingface':
                    result = await this.callHuggingFaceAPI(text);
                    break;
                case 'googleCloud':
                    result = await this.callGoogleCloudAPI(text);
                    break;
                case 'azure':
                    result = await this.callAzureAPI(text);
                    break;
                case 'localML':
                    result = await this.callLocalMLAPI(text);
                    break;
                case 'synthiaLocal':
                    result = await this.callSynthiaLocalAPI(text, context);
                    break;
                default:
                    throw new Error(`Unknown API: ${apiName}`);
            }
            
            result.responseTime = Date.now() - startTime;
            result.apiName = apiName;
            
            console.log(`✅ ${apiConfig.name}: ${result.toxicityScore}/10 (${result.responseTime}ms)`);
            return result;
            
        } catch (error) {
            console.log(`❌ ${apiConfig.name} failed: ${error.message}`);
            throw error;
        }
    }

    // Perspective API (Google/Jigsaw)
    async callPerspectiveAPI(text) {
        if (!this.apiKeys.perspective) {
            throw new Error('Perspective API key not configured');
        }

        const response = await fetch(`${this.apis.perspective.endpoint}?key=${this.apiKeys.perspective}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requestedAttributes: {
                    TOXICITY: {},
                    SEVERE_TOXICITY: {},
                    IDENTITY_ATTACK: {},
                    INSULT: {},
                    PROFANITY: {},
                    THREAT: {}
                },
                doNotStore: true,
                comment: { text: text }
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const scores = data.attributeScores;

        // Calculate weighted toxicity score
        const toxicityScore = Math.round(
            (scores.TOXICITY.summaryScore.value * 0.3 +
             scores.SEVERE_TOXICITY.summaryScore.value * 0.25 +
             scores.INSULT.summaryScore.value * 0.2 +
             scores.PROFANITY.summaryScore.value * 0.15 +
             scores.THREAT.summaryScore.value * 0.1) * 10
        );

        return {
            toxicityScore: toxicityScore,
            confidence: Math.round(scores.TOXICITY.summaryScore.value * 100),
            details: {
                toxicity: scores.TOXICITY.summaryScore.value,
                severeToxicity: scores.SEVERE_TOXICITY.summaryScore.value,
                insult: scores.INSULT.summaryScore.value,
                profanity: scores.PROFANITY.summaryScore.value,
                threat: scores.THREAT.summaryScore.value
            },
            reasoning: [`Perspective API analysis`]
        };
    }

    // Hugging Face Inference API
    async callHuggingFaceAPI(text) {
        if (!this.apiKeys.huggingface) {
            throw new Error('Hugging Face API key not configured');
        }

        const response = await fetch(this.apis.huggingface.endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKeys.huggingface}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ inputs: text })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Handle different response formats
        let toxicScore = 0;
        if (Array.isArray(data) && data[0]) {
            const result = data[0];
            if (Array.isArray(result)) {
                const toxicResult = result.find(r => r.label === 'TOXIC');
                toxicScore = toxicResult ? toxicResult.score : 0;
            }
        }

        return {
            toxicityScore: Math.round(toxicScore * 10),
            confidence: Math.round(toxicScore * 100),
            details: { rawScore: toxicScore },
            reasoning: [`Hugging Face BERT analysis`]
        };
    }

    // Google Cloud Natural Language API
    async callGoogleCloudAPI(text) {
        if (!this.apiKeys.googleCloud) {
            throw new Error('Google Cloud API key not configured');
        }

        // Sentiment analysis
        const sentimentResponse = await fetch(`https://language.googleapis.com/v1/documents:analyzeSentiment?key=${this.apiKeys.googleCloud}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                document: {
                    type: 'PLAIN_TEXT',
                    content: text
                }
            })
        });

        if (!sentimentResponse.ok) {
            throw new Error(`HTTP ${sentimentResponse.status}: ${sentimentResponse.statusText}`);
        }

        const sentimentData = await sentimentResponse.json();
        const sentiment = sentimentData.documentSentiment;

        // Convert sentiment to toxicity score (negative sentiment = higher toxicity)
        let toxicityScore = 0;
        if (sentiment.score < -0.5) {
            toxicityScore = Math.round((Math.abs(sentiment.score) + 0.5) * 6); // Scale to 0-10
        }

        return {
            toxicityScore: Math.min(10, toxicityScore),
            confidence: Math.round(sentiment.magnitude * 50), // Magnitude indicates confidence
            details: {
                sentiment: sentiment.score,
                magnitude: sentiment.magnitude
            },
            reasoning: [`Google Cloud sentiment analysis: ${sentiment.score}`]
        };
    }

    // Azure Text Analytics API
    async callAzureAPI(text) {
        if (!this.apiKeys.azure) {
            throw new Error('Azure API key not configured');
        }

        const response = await fetch(this.apis.azure.endpoint, {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': this.apiKeys.azure,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                documents: [{
                    id: '1',
                    text: text
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const result = data.documents[0];

        // Convert sentiment to toxicity (similar to Google Cloud)
        let toxicityScore = 0;
        if (result.sentiment === 'negative') {
            toxicityScore = Math.round((1 - result.confidenceScores.positive) * 10);
        }

        return {
            toxicityScore: toxicityScore,
            confidence: Math.round(result.confidenceScores[result.sentiment] * 100),
            details: {
                sentiment: result.sentiment,
                scores: result.confidenceScores
            },
            reasoning: [`Azure sentiment: ${result.sentiment}`]
        };
    }

    // Local ML Model (using a simple rule-based system for now)
    async callLocalMLAPI(text) {
        // This would be replaced with your actual local ML model
        // For now, using a simple sentiment/toxicity analyzer
        
        const toxicWords = ['fuck', 'shit', 'damn', 'hell', 'bitch', 'ass'];
        const lowerText = text.toLowerCase();
        
        let toxicityScore = 0;
        let matches = [];
        
        for (const word of toxicWords) {
            if (lowerText.includes(word)) {
                toxicityScore += 2;
                matches.push(word);
            }
        }
        
        // Check for positive context
        const positiveWords = ['love', 'great', 'awesome', 'thank', 'please', 'good'];
        const hasPositiveContext = positiveWords.some(word => lowerText.includes(word));
        
        if (hasPositiveContext) {
            toxicityScore = Math.max(0, toxicityScore - 2);
        }

        return {
            toxicityScore: Math.min(10, toxicityScore),
            confidence: matches.length > 0 ? 80 : 60,
            details: { matches: matches, positiveContext: hasPositiveContext },
            reasoning: matches.length > 0 ? [`Local ML detected: ${matches.join(', ')}`] : ['Local ML: No significant toxicity']
        };
    }

    // Synthia Local Rules (your existing system)
    async callSynthiaLocalAPI(text, context) {
        // This would call your existing Synthia analysis
        // For now, simulating with a basic check
        
        const pokemonTerms = ['pokemon', 'shiny', 'trade', '.pk'];
        const isPokemonRelated = pokemonTerms.some(term => text.toLowerCase().includes(term));
        
        if (isPokemonRelated) {
            return {
                toxicityScore: 0,
                confidence: 95,
                details: { pokemonContext: true },
                reasoning: ['Synthia: Pokemon-related content detected']
            };
        }

        // Your existing bypass detection logic would go here
        return {
            toxicityScore: 0,
            confidence: 70,
            details: { bypassDetected: false },
            reasoning: ['Synthia: No local patterns matched']
        };
    }

    // INTELLIGENT DECISION ENGINE
    async makeIntelligentDecision(apiResults, contentType, text, context) {
        console.log(`🤔 Making intelligent decision for ${contentType} content...`);
        
        const availableResults = Object.entries(apiResults).filter(([api, result]) => 
            result && !result.error && typeof result.toxicityScore === 'number'
        );

        if (availableResults.length === 0) {
            console.log('⚠️ No API results available, falling back to local analysis');
            return this.fallbackDecision(text);
        }

        // Step 1: Calculate weighted scores based on content type
        const contentWeights = this.weightingFactors.contentTypeWeights[contentType] || 
                              this.weightingFactors.contentTypeWeights.general;

        let weightedToxicityScore = 0;
        let totalWeight = 0;
        let consensusCount = 0;
        let highConfidenceCount = 0;
        const allScores = [];
        const allReasons = [];

        // Step 2: Calculate weighted average
        for (const [apiName, result] of availableResults) {
            const apiWeight = contentWeights[apiName] || 0.1;
            const performanceMultiplier = this.decisionHistory.apiPerformance[apiName]?.accuracyScore || 0.8;
            const finalWeight = apiWeight * performanceMultiplier;

            weightedToxicityScore += result.toxicityScore * finalWeight;
            totalWeight += finalWeight;
            allScores.push(result.toxicityScore);
            allReasons.push(...(result.reasoning || []));

            if (result.confidence > 70) {
                highConfidenceCount++;
            }

            console.log(`   ${apiName}: ${result.toxicityScore}/10 (weight: ${finalWeight.toFixed(2)}, conf: ${result.confidence}%)`);
        }

        const averageScore = totalWeight > 0 ? weightedToxicityScore / totalWeight : 0;

        // Step 3: Check for consensus
        const scoreVariance = this.calculateVariance(allScores);
        const hasConsensus = scoreVariance < 2; // Low variance = consensus

        // Step 4: Apply consensus and confidence adjustments
        let finalScore = averageScore;
        let finalConfidence = 70;

        if (hasConsensus) {
            finalConfidence += 20;
            console.log(`   ✅ Consensus detected (variance: ${scoreVariance.toFixed(2)})`);
        } else {
            finalConfidence -= 10;
            console.log(`   ⚠️ Disagreement detected (variance: ${scoreVariance.toFixed(2)})`);
        }

        if (highConfidenceCount >= availableResults.length * 0.6) {
            finalConfidence += 10;
            console.log(`   ✅ High confidence from ${highConfidenceCount}/${availableResults.length} APIs`);
        }

        // Step 5: Apply content-specific adjustments
        if (contentType === 'pokemon' && finalScore < 3) {
            finalScore = Math.max(0, finalScore - 1);
            allReasons.push('Pokemon context adjustment applied');
        }

        if (contentType === 'gaming' && finalScore < 4) {
            finalScore = Math.max(0, finalScore - 0.5);
            allReasons.push('Gaming context adjustment applied');
        }

        // Step 6: Determine action based on final score
        let action = 'none';
        let violationType = null;

        if (finalScore >= 7) {
            action = 'ban';
            violationType = 'SEVERE_TOXICITY';
        } else if (finalScore >= 5) {
            action = 'mute';
            violationType = 'HARASSMENT';
        } else if (finalScore >= 3) {
            action = 'delete';
            violationType = 'TOXIC_BEHAVIOR';
        } else if (finalScore >= 2) {
            action = 'warn';
            violationType = 'DISRESPECTFUL';
        }

        const finalDecision = {
            toxicityScore: Math.round(finalScore),
            confidence: Math.min(100, Math.round(finalConfidence)),
            action: action,
            violationType: violationType,
            reasoning: [...new Set(allReasons)], // Remove duplicates
            apiAnalysis: {
                availableAPIs: availableResults.length,
                consensus: hasConsensus,
                variance: scoreVariance,
                contentType: contentType,
                processingMethod: 'multi_api_consensus'
            },
            individualScores: Object.fromEntries(availableResults.map(([api, result]) => 
                [api, { score: result.toxicityScore, confidence: result.confidence }]
            ))
        };

        console.log(`🎯 Final weighted score: ${finalDecision.toxicityScore}/10`);
        console.log(`🎯 Confidence: ${finalDecision.confidence}%`);
        console.log(`🎯 Action: ${finalDecision.action}`);

        return finalDecision;
    }

    calculateVariance(scores) {
        if (scores.length === 0) return 0;
        
        const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        const squaredDiffs = scores.map(score => Math.pow(score - mean, 2));
        return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / scores.length;
    }

    fallbackDecision(text) {
        console.log('🆘 Using fallback decision logic');
        return {
            toxicityScore: 0,
            confidence: 30,
            action: 'none',
            violationType: null,
            reasoning: ['Fallback analysis - APIs unavailable'],
            apiAnalysis: {
                availableAPIs: 0,
                consensus: false,
                processingMethod: 'fallback'
            }
        };
    }

    updateAPIPerformance(apiName, success, responseTime) {
        const performance = this.decisionHistory.apiPerformance[apiName];
        performance.totalCalls++;
        
        if (success) {
            performance.successfulCalls++;
            performance.averageResponseTime = 
                (performance.averageResponseTime + responseTime) / 2;
        }
        
        performance.lastUpdated = Date.now();
    }

    logDecisionForLearning(analysisResults) {
        // Log decisions for continuous improvement
        // This could be saved to a database for ML training
        console.log('📚 Logging decision for continuous learning...');
        this.decisionHistory.totalAnalyses++;
    }

    // Method to get system status and performance
    getSystemStatus() {
        const apiStatuses = {};
        for (const [apiName, config] of Object.entries(this.apis)) {
            const performance = this.decisionHistory.apiPerformance[apiName];
            apiStatuses[apiName] = {
                enabled: config.enabled,
                successRate: performance.totalCalls > 0 ? 
                    Math.round((performance.successfulCalls / performance.totalCalls) * 100) : 0,
                averageResponseTime: Math.round(performance.averageResponseTime),
                totalCalls: performance.totalCalls,
                weight: config.baseWeight
            };
        }

        return {
            totalAnalyses: this.decisionHistory.totalAnalyses,
            apiStatuses: apiStatuses,
            systemHealth: 'operational'
        };
    }
}

module.exports = MultiAPIDecisionEngine;