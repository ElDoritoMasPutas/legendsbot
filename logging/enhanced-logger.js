const winston = require('winston');
const fs = require('fs-extra');
const path = require('path');
const config = require('../config/enhanced-config.js');

class Logger {
    constructor(component = 'System') {
        this.component = component;
        this.winston = this.createWinstonLogger();
        this.setupLogDirectory();
    }

    setupLogDirectory() {
        if (config.logging.file.enabled) {
            fs.ensureDirSync(config.logging.file.path);
        }
    }

    createWinstonLogger() {
        const transports = [];

        // Console transport
        if (config.logging.console.enabled) {
            transports.push(new winston.transports.Console({
                level: config.logging.level,
                format: winston.format.combine(
                    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                    winston.format.errors({ stack: true }),
                    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
                        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
                        const stackStr = stack ? `\n${stack}` : '';
                        return `[${timestamp}] ${level.toUpperCase()} [${this.component}]: ${message}${metaStr}${stackStr}`;
                    }),
                    config.logging.console.colorize ? winston.format.colorize() : winston.format.uncolorize()
                )
            }));
        }

        // File transport
        if (config.logging.file.enabled) {
            // General log file
            transports.push(new winston.transports.File({
                filename: path.join(config.logging.file.path, 'synthia.log'),
                level: config.logging.level,
                maxsize: config.logging.file.maxSize,
                maxFiles: config.logging.file.maxFiles,
                format: winston.format.combine(
                    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                    winston.format.errors({ stack: true }),
                    winston.format.json()
                )
            }));

            // Error log file
            transports.push(new winston.transports.File({
                filename: path.join(config.logging.file.path, 'error.log'),
                level: 'error',
                maxsize: config.logging.file.maxSize,
                maxFiles: config.logging.file.maxFiles,
                format: winston.format.combine(
                    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                    winston.format.errors({ stack: true }),
                    winston.format.json()
                )
            }));

            // Debug log file (development only)
            if (process.env.NODE_ENV === 'development') {
                transports.push(new winston.transports.File({
                    filename: path.join(config.logging.file.path, 'debug.log'),
                    level: 'debug',
                    maxsize: config.logging.file.maxSize,
                    maxFiles: config.logging.file.maxFiles,
                    format: winston.format.combine(
                        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                        winston.format.errors({ stack: true }),
                        winston.format.json()
                    )
                }));
            }
        }

        return winston.createLogger({
            level: config.logging.level,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] })
            ),
            transports,
            exitOnError: false
        });
    }

    debug(message, meta = {}) {
        this.winston.debug(message, { component: this.component, ...meta });
    }

    info(message, meta = {}) {
        this.winston.info(message, { component: this.component, ...meta });
    }

    warn(message, meta = {}) {
        this.winston.warn(message, { component: this.component, ...meta });
    }

    error(message, meta = {}) {
        if (message instanceof Error) {
            this.winston.error(message.message, { 
                component: this.component, 
                error: message,
                stack: message.stack,
                ...meta 
            });
        } else {
            this.winston.error(message, { component: this.component, ...meta });
        }
    }

    // Specialized logging methods
    logUserAction(userId, action, details = {}) {
        this.info(`User action: ${action}`, {
            userId,
            action,
            details,
            type: 'user_action'
        });
    }

    logGuildEvent(guildId, event, details = {}) {
        this.info(`Guild event: ${event}`, {
            guildId,
            event,
            details,
            type: 'guild_event'
        });
    }

    logModerationAction(guildId, userId, moderatorId, action, reason = null) {
        this.info(`Moderation action: ${action}`, {
            guildId,
            userId,
            moderatorId,
            action,
            reason,
            type: 'moderation'
        });
    }

    logCommandUsage(userId, guildId, command, args = []) {
        this.info(`Command executed: ${command}`, {
            userId,
            guildId,
            command,
            args,
            type: 'command'
        });
    }

    logAIInteraction(userId, guildId, interactionType, details = {}) {
        this.info(`AI interaction: ${interactionType}`, {
            userId,
            guildId,
            interactionType,
            details,
            type: 'ai_interaction'
        });
    }

    logPerformanceMetric(metric, value, unit = null) {
        this.debug(`Performance metric: ${metric}`, {
            metric,
            value,
            unit,
            type: 'performance'
        });
    }

    logSecurityEvent(event, severity, details = {}) {
        const logLevel = severity === 'high' ? 'error' : severity === 'medium' ? 'warn' : 'info';
        this[logLevel](`Security event: ${event}`, {
            event,
            severity,
            details,
            type: 'security'
        });
    }

    logAPICall(service, endpoint, responseTime, success = true) {
        this.debug(`API call: ${service}/${endpoint}`, {
            service,
            endpoint,
            responseTime,
            success,
            type: 'api_call'
        });
    }

    logDatabaseOperation(operation, table, duration, success = true) {
        this.debug(`Database operation: ${operation} on ${table}`, {
            operation,
            table,
            duration,
            success,
            type: 'database'
        });
    }

    // Structured logging for analytics
    logAnalyticsEvent(eventType, data) {
        this.info(`Analytics event: ${eventType}`, {
            eventType,
            data,
            type: 'analytics'
        });
    }

    // Error handling and debugging
    logError(error, context = {}) {
        if (error instanceof Error) {
            this.error(error.message, {
                error: {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                },
                context,
                type: 'error'
            });
        } else {
            this.error(error, { context, type: 'error' });
        }
    }

    logCriticalError(error, context = {}) {
        this.error(`CRITICAL ERROR: ${error.message || error}`, {
            error: error instanceof Error ? {
                name: error.name,
                message: error.message,
                stack: error.stack
            } : error,
            context,
            type: 'critical_error',
            timestamp: new Date().toISOString()
        });
    }

    // System monitoring
    logSystemStatus(status, details = {}) {
        this.info(`System status: ${status}`, {
            status,
            details,
            type: 'system_status'
        });
    }

    logResourceUsage(cpu, memory, connections) {
        this.debug('Resource usage', {
            cpu: `${cpu}%`,
            memory: `${memory}MB`,
            connections,
            type: 'resource_usage'
        });
    }

    // Plugin logging
    logPluginEvent(pluginName, event, data = {}) {
        this.info(`Plugin event: ${pluginName}/${event}`, {
            pluginName,
            event,
            data,
            type: 'plugin'
        });
    }

    // Rate limiting and spam detection
    logRateLimit(userId, action, limit) {
        this.warn(`Rate limit exceeded: ${action}`, {
            userId,
            action,
            limit,
            type: 'rate_limit'
        });
    }

    logSpamDetection(userId, guildId, reason, details = {}) {
        this.warn(`Spam detected: ${reason}`, {
            userId,
            guildId,
            reason,
            details,
            type: 'spam_detection'
        });
    }

    // Translation logging
    logTranslation(sourceLang, targetLang, provider, success = true) {
        this.debug(`Translation: ${sourceLang} -> ${targetLang}`, {
            sourceLang,
            targetLang,
            provider,
            success,
            type: 'translation'
        });
    }

    // WebSocket and real-time events
    logWebSocketEvent(event, socketId, data = {}) {
        this.debug(`WebSocket event: ${event}`, {
            event,
            socketId,
            data,
            type: 'websocket'
        });
    }

    // Performance profiling
    startTimer(label) {
        return {
            label,
            startTime: Date.now(),
            end: () => {
                const duration = Date.now() - this.startTime;
                this.logPerformanceMetric(label, duration, 'ms');
                return duration;
            }
        };
    }

    // Batch logging for high-frequency events
    createBatchLogger(flushInterval = 5000) {
        const batch = [];
        
        setInterval(() => {
            if (batch.length > 0) {
                this.info(`Batch log (${batch.length} entries)`, {
                    batch: [...batch],
                    type: 'batch'
                });
                batch.length = 0;
            }
        }, flushInterval);

        return {
            add: (level, message, meta = {}) => {
                batch.push({
                    timestamp: new Date().toISOString(),
                    level,
                    message,
                    meta: { component: this.component, ...meta }
                });
            },
            flush: () => {
                if (batch.length > 0) {
                    this.info(`Manual batch flush (${batch.length} entries)`, {
                        batch: [...batch],
                        type: 'batch'
                    });
                    batch.length = 0;
                }
            }
        };
    }

    // Log rotation and cleanup
    async rotateLogs() {
        if (!config.logging.file.enabled) return;

        try {
            const logDir = config.logging.file.path;
            const files = await fs.readdir(logDir);
            const logFiles = files.filter(file => file.endsWith('.log'));

            for (const file of logFiles) {
                const filePath = path.join(logDir, file);
                const stats = await fs.stat(filePath);
                const ageInDays = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);

                if (ageInDays > config.logging.file.maxFiles) {
                    await fs.remove(filePath);
                    this.info(`Rotated old log file: ${file}`);
                }
            }
        } catch (error) {
            this.error('Failed to rotate logs:', error);
        }
    }

    // Get log statistics
    async getLogStats() {
        if (!config.logging.file.enabled) {
            return { error: 'File logging not enabled' };
        }

        try {
            const logDir = config.logging.file.path;
            const files = await fs.readdir(logDir);
            const logFiles = files.filter(file => file.endsWith('.log'));
            
            let totalSize = 0;
            const fileStats = [];

            for (const file of logFiles) {
                const filePath = path.join(logDir, file);
                const stats = await fs.stat(filePath);
                totalSize += stats.size;
                
                fileStats.push({
                    name: file,
                    size: stats.size,
                    modified: stats.mtime,
                    age: Math.floor((Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24))
                });
            }

            return {
                totalFiles: logFiles.length,
                totalSize: totalSize,
                files: fileStats
            };
        } catch (error) {
            this.error('Failed to get log stats:', error);
            return { error: error.message };
        }
    }
}

module.exports = Logger;
