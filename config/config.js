// Enhanced Discord Bot Configuration v9.0 - FIXED BALANCED THRESHOLDS
require('dotenv').config();

const config = {
    token: process.env.DISCORD_TOKEN,
    autoModerationEnabled: true,
    strictMode: false,
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
    
    // FIXED: Balanced thresholds that actually work
    moderationThresholds: {
        warn: 2,      // Lowered to catch mild violations
        delete: 3,    // Reasonable for inappropriate content
        mute: 5,      // For repeated offenses
        ban: 7        // For severe violations
    },
    
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

// Validate Discord token
if (!config.token) {
    console.error('❌ CRITICAL ERROR: DISCORD_TOKEN is not set!');
    console.error('📝 Please create a .env file with:');
    console.error('   DISCORD_TOKEN=your_bot_token_here');
    process.exit(1);
}

module.exports = config;
