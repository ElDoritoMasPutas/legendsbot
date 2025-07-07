// Enhanced Logger v10.0 - logging/enhanced-logger.js
const winston = require('winston');
const path = require('path');
const fs = require('fs');

class EnhancedLogger {
    constructor() {
        this.logDir = './logs';
        this.ensureLogDirectory();
        this.setupLogger();
    }

    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    setupLogger() {
        // Custom log format
        const logFormat = winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.errors({ stack: true }),
            winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
                let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
                
                if (Object.keys(meta).length > 0) {
                    log += ` ${JSON.stringify(meta)}`;
                }
                
                if (stack) {
                    log += `\n${stack}`;
                }
                
                return log;
            })
        );

        // Console format with colors
        const consoleFormat = winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({ format: 'HH:mm:ss' }),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
                let log = `${timestamp} ${level}: ${message}`;
                
                if (Object.keys(meta).length > 0) {
                    log += ` ${JSON.stringify(meta, null, 2)}`;
                }
                
                return log;
            })
        );

        // Create transports
        const transports = [
            new winston.transports.Console({
                level: process.env.LOG_LEVEL || 'info',
                format: consoleFormat
            })
        ];

        // Add file transports if enabled
        if (process.env.FILE_LOGGING !== 'false') {
            transports.push(
                new winston.transports.File({
                    filename: path.join(this.logDir, 'combined.log'),
                    level: 'info',
                    format: logFormat,
                    maxsize: 20 * 1024 * 1024, // 20MB
                    maxFiles: 5
                }),
                new winston.transports.File({
                    filename: path.join(this.logDir, 'error.log'),
                    level: 'error',
                    format: logFormat,
                    maxsize: 10 * 1024 * 1024, // 10MB
                    maxFiles: 3
                })
            );
        }

        // Create the logger
        this.logger = winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: logFormat,
            transports: transports,
            exitOnError: false
        });

        // Add custom methods
        this.addCustomMethods();
        
        this.info('🚀 Enhanced Logger v10.0 initialized');
    }

    addCustomMethods() {
        // AI Analysis logging
        this.logAIAnalysis = (analysis) => {
            this.info('🧠 AI Analysis completed', {
                type: 'ai_analysis',
                threatLevel: analysis.threatLevel,
                confidence: analysis.confidence,
                language: analysis.language,
                bypassDetected: analysis.bypassDetected,
                processingTime: analysis.processingTime
            });
        };

        // Moderation action logging
        this.logModerationAction = (action, user, reason, details = {}) => {
            this.warn('🛡️ Moderation action taken', {
                type: 'moderation',
                action: action,
                user: user.tag || user.id,
                reason: reason,
                ...details
            });
        };

        // Translation logging
        this.logTranslation = (from, to, provider, responseTime) => {
            this.info('🌍 Translation completed', {
                type: 'translation',
                from: from,
                to: to,
                provider: provider,
                responseTime: responseTime
            });
        };

        // Security event logging
        this.logSecurityEvent = (event, severity, details = {}) => {
            const level = severity === 'high' ? 'error' : severity === 'medium' ? 'warn' : 'info';
            this[level](`🔒 Security event: ${event}`, {
                type: 'security',
                event: event,
                severity: severity,
                ...details
            });
        };
    }

    // Standard logging methods
    error(message, meta = {}) {
        this.logger.error(message, meta);
    }

    warn(message, meta = {}) {
        this.logger.warn(message, meta);
    }

    info(message, meta = {}) {
        this.logger.info(message, meta);
    }

    debug(message, meta = {}) {
        this.logger.debug(message, meta);
    }

    // Health check
    healthCheck() {
        try {
            this.info('Logger health check passed');
            return {
                status: 'healthy',
                logDir: this.logDir,
                transports: this.logger.transports.length
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message
            };
        }
    }
}

// Export singleton instance
module.exports = new EnhancedLogger();
