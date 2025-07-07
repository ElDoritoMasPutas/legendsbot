// Enhanced Logger v10.0 - Enterprise-Grade Logging System
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

        // Create transports array
        const transports = [];

        // Console transport
        transports.push(
            new winston.transports.Console({
                level: process.env.LOG_LEVEL || 'info',
                format: consoleFormat,
                handleExceptions: true,
                handleRejections: true
            })
        );

        // File transports
        transports.push(
            // Combined log file
            new winston.transports.File({
                filename: path.join(this.logDir, 'combined.log'),
                level: 'info',
                format: logFormat,
                maxsize: 20 * 1024 * 1024, // 20MB
                maxFiles: 14,
                tailable: true
            }),
            
            // Error log file
            new winston.transports.File({
                filename: path.join(this.logDir, 'error.log'),
                level: 'error',
                format: logFormat,
                maxsize: 10 * 1024 * 1024, // 10MB
                maxFiles: 7,
                tailable: true
            }),
            
            // Debug log file
            new winston.transports.File({
                filename: path.join(this.logDir, 'debug.log'),
                level: 'debug',
                format: logFormat,
                maxsize: 50 * 1024 * 1024, // 50MB
                maxFiles: 3,
                tailable: true
            })
        );

        // Create the logger
        this.logger = winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: logFormat,
            transports: transports,
            exitOnError: false
        });

        // Handle uncaught exceptions and rejections
        this.logger.exceptions.handle(
            new winston.transports.File({
                filename: path.join(this.logDir, 'exceptions.log'),
                format: logFormat,
                maxsize: 10 * 1024 * 1024,
                maxFiles: 5
            })
        );

        this.logger.rejections.handle(
            new winston.transports.File({
                filename: path.join(this.logDir, 'rejections.log'),
                format: logFormat,
                maxsize: 10 * 1024 * 1024,
                maxFiles: 5
            })
        );

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

        // API call logging
        this.logAPICall = (api, endpoint, responseTime, success = true) => {
            const level = success ? 'info' : 'warn';
            this[level](`🔌 API call to ${api}`, {
                type: 'api_call',
                api: api,
                endpoint: endpoint,
                responseTime: responseTime,
                success: success
            });
        };

        // Performance logging
        this.logPerformance = (operation, duration, details = {}) => {
            const level = duration > 5000 ? 'warn' : 'info';
            this[level](`⚡ Performance: ${operation}`, {
                type: 'performance',
                operation: operation,
                duration: duration,
                ...details
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

    // Health check method
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

    // Get log statistics
    getStats() {
        const stats = {
            logDir: this.logDir,
            transports: this.logger.transports.length,
            level: this.logger.level
        };

        try {
            // Get file sizes
            const files = ['combined.log', 'error.log', 'debug.log'];
            stats.files = {};
            
            for (const file of files) {
                const filePath = path.join(this.logDir, file);
                if (fs.existsSync(filePath)) {
                    const stat = fs.statSync(filePath);
                    stats.files[file] = {
                        size: stat.size,
                        modified: stat.mtime
                    };
                }
            }
        } catch (error) {
            this.warn('Failed to get log file stats', { error: error.message });
        }

        return stats;
    }

    // Cleanup old logs
    cleanup(daysToKeep = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

            const files = fs.readdirSync(this.logDir);
            let deletedCount = 0;

            for (const file of files) {
                const filePath = path.join(this.logDir, file);
                const stat = fs.statSync(filePath);

                if (stat.mtime < cutoffDate) {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                }
            }

            this.info(`Log cleanup completed`, {
                deletedFiles: deletedCount,
                daysToKeep: daysToKeep
            });

            return deletedCount;
        } catch (error) {
            this.error('Log cleanup failed', { error: error.message });
            return 0;
        }
    }
}

// Export singleton instance
module.exports = new EnhancedLogger();
