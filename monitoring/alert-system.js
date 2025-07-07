const axios = require('axios');
const config = require('../config/enhanced-config.js');
const Logger = require('../logging/enhanced-logger.js');

class AlertSystem {
    constructor(healthMonitor, metricsCollector) {
        this.healthMonitor = healthMonitor;
        this.metricsCollector = metricsCollector;
        this.logger = new Logger('AlertSystem');
        this.initialized = false;
        
        this.alertRules = new Map();
        this.alertHistory = new Map();
        this.activeAlerts = new Map();
        this.alertChannels = new Map();
        
        this.severity = {
            LOW: 'low',
            MEDIUM: 'medium',
            HIGH: 'high',
            CRITICAL: 'critical'
        };
        
        this.alertTypes = {
            THRESHOLD: 'threshold',
            ANOMALY: 'anomaly',
            HEALTH: 'health',
            SECURITY: 'security',
            PERFORMANCE: 'performance'
        };
        
        this.stats = {
            alertsSent: 0,
            alertsResolved: 0,
            falseAlerts: 0,
            criticalAlerts: 0,
            channelsSent: 0
        };
        
        this.throttleLimits = {
            low: 300000,     // 5 minutes
            medium: 180000,  // 3 minutes
            high: 60000,     // 1 minute
            critical: 30000  // 30 seconds
        };
        
        this.setupDefaultRules();
        this.setupDefaultChannels();
    }

    async initialize() {
        try {
            this.logger.info('Initializing Alert System...');
            
            // Load alert rules and channels
            await this.loadAlertRules();
            await this.loadAlertChannels();
            
            // Start monitoring
            this.startMonitoring();
            
            // Setup cleanup processes
            this.setupCleanup();
            
            this.initialized = true;
            this.logger.info('Alert System initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize Alert System:', error);
            throw error;
        }
    }

    setupDefaultRules() {
        // System health rules
        this.alertRules.set('cpu_high', {
            type: this.alertTypes.THRESHOLD,
            metric: 'system.cpu.usage',
            operator: '>',
            threshold: 80,
            severity: this.severity.MEDIUM,
            duration: 300000, // 5 minutes
            message: 'High CPU usage detected: {{value}}%'
        });
        
        this.alertRules.set('cpu_critical', {
            type: this.alertTypes.THRESHOLD,
            metric: 'system.cpu.usage',
            operator: '>',
            threshold: 95,
            severity: this.severity.CRITICAL,
            duration: 60000, // 1 minute
            message: 'Critical CPU usage detected: {{value}}%'
        });
        
        this.alertRules.set('memory_high', {
            type: this.alertTypes.THRESHOLD,
            metric: 'system.memory.percent',
            operator: '>',
            threshold: 85,
            severity: this.severity.MEDIUM,
            duration: 300000,
            message: 'High memory usage detected: {{value}}%'
        });
        
        this.alertRules.set('memory_critical', {
            type: this.alertTypes.THRESHOLD,
            metric: 'system.memory.percent',
            operator: '>',
            threshold: 95,
            severity: this.severity.CRITICAL,
            duration: 60000,
            message: 'Critical memory usage detected: {{value}}%'
        });
        
        // Discord health rules
        this.alertRules.set('discord_offline', {
            type: this.alertTypes.HEALTH,
            metric: 'discord.status',
            operator: '!=',
            threshold: 'connected',
            severity: this.severity.CRITICAL,
            duration: 30000,
            message: 'Discord client is offline'
        });
        
        this.alertRules.set('discord_high_latency', {
            type: this.alertTypes.THRESHOLD,
            metric: 'discord.ping',
            operator: '>',
            threshold: 1000,
            severity: this.severity.MEDIUM,
            duration: 180000,
            message: 'High Discord latency detected: {{value}}ms'
        });
        
        // Database health rules
        this.alertRules.set('database_offline', {
            type: this.alertTypes.HEALTH,
            metric: 'database.status',
            operator: '!=',
            threshold: 'healthy',
            severity: this.severity.CRITICAL,
            duration: 30000,
            message: 'Database connection lost'
        });
        
        this.alertRules.set('database_slow', {
            type: this.alertTypes.THRESHOLD,
            metric: 'database.latency',
            operator: '>',
            threshold: 5000,
            severity: this.severity.MEDIUM,
            duration: 300000,
            message: 'Slow database responses: {{value}}ms'
        });
        
        // Cache health rules
        this.alertRules.set('cache_offline', {
            type: this.alertTypes.HEALTH,
            metric: 'cache.status',
            operator: '!=',
            threshold: 'healthy',
            severity: this.severity.HIGH,
            duration: 30000,
            message: 'Cache connection lost'
        });
        
        this.alertRules.set('cache_low_hit_rate', {
            type: this.alertTypes.THRESHOLD,
            metric: 'cache.hitRate',
            operator: '<',
            threshold: 0.7,
            severity: this.severity.LOW,
            duration: 600000,
            message: 'Low cache hit rate: {{value}}%'
        });
        
        // Performance rules
        this.alertRules.set('high_error_rate', {
            type: this.alertTypes.THRESHOLD,
            metric: 'performance.errors.rate',
            operator: '>',
            threshold: 0.05,
            severity: this.severity.HIGH,
            duration: 180000,
            message: 'High error rate detected: {{value}}%'
        });
        
        this.alertRules.set('slow_response_time', {
            type: this.alertTypes.THRESHOLD,
            metric: 'performance.responseTime.avg',
            operator: '>',
            threshold: 5000,
            severity: this.severity.MEDIUM,
            duration: 300000,
            message: 'Slow response times: {{value}}ms'
        });
        
        // Security rules
        this.alertRules.set('security_threats', {
            type: this.alertTypes.THRESHOLD,
            metric: 'security.threats',
            operator: '>',
            threshold: 10,
            severity: this.severity.HIGH,
            duration: 60000,
            message: 'Multiple security threats detected: {{value}}'
        });
        
        this.logger.info(`Loaded ${this.alertRules.size} default alert rules`);
    }

    setupDefaultChannels() {
        // Console logging channel
        this.alertChannels.set('console', {
            type: 'console',
            enabled: true,
            severities: ['low', 'medium', 'high', 'critical'],
            send: this.sendConsoleAlert.bind(this)
        });
        
        // File logging channel
        this.alertChannels.set('file', {
            type: 'file',
            enabled: true,
            severities: ['medium', 'high', 'critical'],
            send: this.sendFileAlert.bind(this)
        });
        
        // Email channel (if configured)
        if (config.alerts && config.alerts.email && config.alerts.email.enabled) {
            this.alertChannels.set('email', {
                type: 'email',
                enabled: true,
                severities: ['high', 'critical'],
                config: config.alerts.email,
                send: this.sendEmailAlert.bind(this)
            });
        }
        
        // Slack channel (if configured)
        if (config.alerts && config.alerts.slack && config.alerts.slack.webhook) {
            this.alertChannels.set('slack', {
                type: 'slack',
                enabled: true,
                severities: ['medium', 'high', 'critical'],
                config: config.alerts.slack,
                send: this.sendSlackAlert.bind(this)
            });
        }
        
        // Discord webhook channel (if configured)
        if (config.alerts && config.alerts.discord && config.alerts.discord.webhook) {
            this.alertChannels.set('discord', {
                type: 'discord',
                enabled: true,
                severities: ['high', 'critical'],
                config: config.alerts.discord,
                send: this.sendDiscordAlert.bind(this)
            });
        }
        
        this.logger.info(`Configured ${this.alertChannels.size} alert channels`);
    }

    startMonitoring() {
        // Check alert conditions every 30 seconds
        setInterval(async () => {
            await this.checkAlertConditions();
        }, 30000);
        
        // Resolve expired alerts every minute
        setInterval(async () => {
            await this.resolveExpiredAlerts();
        }, 60000);
        
        this.logger.info('Started alert monitoring');
    }

    async checkAlertConditions() {
        try {
            // Get current metrics
            const healthStatus = this.healthMonitor.getHealthStatus();
            const currentMetrics = this.metricsCollector.getCurrentMetrics();
            
            // Check each alert rule
            for (const [ruleName, rule] of this.alertRules) {
                try {
                    await this.evaluateRule(ruleName, rule, healthStatus, currentMetrics);
                } catch (error) {
                    this.logger.error(`Failed to evaluate rule ${ruleName}:`, error);
                }
            }
            
        } catch (error) {
            this.logger.error('Alert condition check failed:', error);
        }
    }

    async evaluateRule(ruleName, rule, healthStatus, metrics) {
        try {
            const value = this.getMetricValue(rule.metric, healthStatus, metrics);
            const isTriggered = this.evaluateCondition(value, rule.operator, rule.threshold);
            
            if (isTriggered) {
                await this.handleTriggeredRule(ruleName, rule, value);
            } else {
                await this.handleResolvedRule(ruleName, rule);
            }
            
        } catch (error) {
            this.logger.error(`Rule evaluation failed for ${ruleName}:`, error);
        }
    }

    getMetricValue(metricPath, healthStatus, metrics) {
        const paths = metricPath.split('.');
        let value = null;
        
        // Try to get from health status first
        if (paths[0] === 'discord' || paths[0] === 'database' || paths[0] === 'cache') {
            value = healthStatus;
            for (const path of paths) {
                value = value?.[path];
            }
        }
        
        // Try to get from metrics
        if (value === null || value === undefined) {
            value = metrics;
            for (const path of paths) {
                value = value?.[path];
            }
        }
        
        return value;
    }

    evaluateCondition(value, operator, threshold) {
        switch (operator) {
            case '>':
                return value > threshold;
            case '<':
                return value < threshold;
            case '>=':
                return value >= threshold;
            case '<=':
                return value <= threshold;
            case '==':
            case '=':
                return value == threshold;
            case '!=':
                return value != threshold;
            case 'contains':
                return String(value).includes(String(threshold));
            case 'not_contains':
                return !String(value).includes(String(threshold));
            default:
                return false;
        }
    }

    async handleTriggeredRule(ruleName, rule, value) {
        const now = Date.now();
        const alertKey = `${ruleName}_${rule.severity}`;
        
        // Check if alert is already active
        if (this.activeAlerts.has(alertKey)) {
            const activeAlert = this.activeAlerts.get(alertKey);
            
            // Update last triggered time
            activeAlert.lastTriggered = now;
            activeAlert.triggerCount++;
            
            return;
        }
        
        // Check if we need to wait for duration
        if (rule.duration && rule.duration > 0) {
            const historyKey = `trigger_${ruleName}`;
            const firstTrigger = this.alertHistory.get(historyKey);
            
            if (!firstTrigger) {
                this.alertHistory.set(historyKey, now);
                return;
            }
            
            if (now - firstTrigger < rule.duration) {
                return; // Not enough time elapsed
            }
        }
        
        // Create and send alert
        const alert = {
            id: this.generateAlertId(),
            ruleName,
            rule,
            value,
            severity: rule.severity,
            triggeredAt: now,
            lastTriggered: now,
            triggerCount: 1,
            resolved: false,
            message: this.formatMessage(rule.message, value)
        };
        
        this.activeAlerts.set(alertKey, alert);
        await this.sendAlert(alert);
        
        // Clear trigger history
        this.alertHistory.delete(`trigger_${ruleName}`);
    }

    async handleResolvedRule(ruleName, rule) {
        const alertKey = `${ruleName}_${rule.severity}`;
        
        if (this.activeAlerts.has(alertKey)) {
            const alert = this.activeAlerts.get(alertKey);
            alert.resolved = true;
            alert.resolvedAt = Date.now();
            
            await this.sendResolutionAlert(alert);
            
            this.activeAlerts.delete(alertKey);
            this.stats.alertsResolved++;
        }
        
        // Clear trigger history
        this.alertHistory.delete(`trigger_${ruleName}`);
    }

    async sendAlert(alert) {
        try {
            if (!this.shouldSendAlert(alert)) {
                return;
            }
            
            // Send to all applicable channels
            for (const [channelName, channel] of this.alertChannels) {
                if (channel.enabled && channel.severities.includes(alert.severity)) {
                    try {
                        await channel.send(alert);
                        this.stats.channelsSent++;
                    } catch (error) {
                        this.logger.error(`Failed to send alert to ${channelName}:`, error);
                    }
                }
            }
            
            this.stats.alertsSent++;
            
            if (alert.severity === this.severity.CRITICAL) {
                this.stats.criticalAlerts++;
            }
            
            this.logger.logSecurityEvent('ALERT_SENT', alert.severity, {
                ruleName: alert.ruleName,
                severity: alert.severity,
                message: alert.message
            });
            
        } catch (error) {
            this.logger.error('Failed to send alert:', error);
        }
    }

    async sendResolutionAlert(alert) {
        try {
            const resolutionAlert = {
                ...alert,
                type: 'resolution',
                message: `RESOLVED: ${alert.message}`,
                duration: alert.resolvedAt - alert.triggeredAt
            };
            
            // Send resolution to channels that support it
            for (const [channelName, channel] of this.alertChannels) {
                if (channel.enabled && channel.severities.includes(alert.severity)) {
                    try {
                        if (channel.sendResolution) {
                            await channel.sendResolution(resolutionAlert);
                        } else {
                            await channel.send(resolutionAlert);
                        }
                    } catch (error) {
                        this.logger.error(`Failed to send resolution to ${channelName}:`, error);
                    }
                }
            }
            
        } catch (error) {
            this.logger.error('Failed to send resolution alert:', error);
        }
    }

    shouldSendAlert(alert) {
        const throttleKey = `throttle_${alert.ruleName}_${alert.severity}`;
        const lastSent = this.alertHistory.get(throttleKey);
        const throttleLimit = this.throttleLimits[alert.severity] || 300000;
        
        if (lastSent && Date.now() - lastSent < throttleLimit) {
            return false; // Throttled
        }
        
        this.alertHistory.set(throttleKey, Date.now());
        return true;
    }

    // Alert channel implementations
    async sendConsoleAlert(alert) {
        const prefix = alert.type === 'resolution' ? '✅ RESOLVED' : '🚨 ALERT';
        const severity = alert.severity.toUpperCase();
        const timestamp = new Date().toISOString();
        
        console.log(`[${timestamp}] ${prefix} [${severity}] ${alert.message}`);
    }

    async sendFileAlert(alert) {
        const logData = {
            timestamp: new Date().toISOString(),
            type: alert.type || 'alert',
            severity: alert.severity,
            ruleName: alert.ruleName,
            message: alert.message,
            value: alert.value,
            triggeredAt: alert.triggeredAt,
            duration: alert.duration
        };
        
        this.logger.error('ALERT', logData);
    }

    async sendEmailAlert(alert) {
        // Email implementation would go here
        // This is a placeholder for email integration
        this.logger.debug('Email alert would be sent:', alert);
    }

    async sendSlackAlert(alert) {
        try {
            const webhook = this.alertChannels.get('slack').config.webhook;
            const color = this.getSeverityColor(alert.severity);
            const emoji = this.getSeverityEmoji(alert.severity);
            
            const payload = {
                username: 'Synthia AI Alerts',
                icon_emoji: ':warning:',
                attachments: [{
                    color,
                    title: `${emoji} ${alert.severity.toUpperCase()} Alert`,
                    text: alert.message,
                    fields: [
                        {
                            title: 'Rule',
                            value: alert.ruleName,
                            short: true
                        },
                        {
                            title: 'Value',
                            value: String(alert.value),
                            short: true
                        },
                        {
                            title: 'Time',
                            value: new Date(alert.triggeredAt).toISOString(),
                            short: true
                        }
                    ],
                    footer: 'Synthia AI Monitoring',
                    ts: Math.floor(alert.triggeredAt / 1000)
                }]
            };
            
            await axios.post(webhook, payload);
            
        } catch (error) {
            this.logger.error('Failed to send Slack alert:', error);
        }
    }

    async sendDiscordAlert(alert) {
        try {
            const webhook = this.alertChannels.get('discord').config.webhook;
            const color = this.getSeverityColorHex(alert.severity);
            const emoji = this.getSeverityEmoji(alert.severity);
            
            const embed = {
                title: `${emoji} ${alert.severity.toUpperCase()} Alert`,
                description: alert.message,
                color: parseInt(color.replace('#', ''), 16),
                fields: [
                    {
                        name: 'Rule',
                        value: alert.ruleName,
                        inline: true
                    },
                    {
                        name: 'Value',
                        value: String(alert.value),
                        inline: true
                    },
                    {
                        name: 'Time',
                        value: `<t:${Math.floor(alert.triggeredAt / 1000)}:F>`,
                        inline: true
                    }
                ],
                footer: {
                    text: 'Synthia AI Monitoring'
                },
                timestamp: new Date(alert.triggeredAt).toISOString()
            };
            
            await axios.post(webhook, {
                username: 'Synthia AI Alerts',
                embeds: [embed]
            });
            
        } catch (error) {
            this.logger.error('Failed to send Discord alert:', error);
        }
    }

    // Utility methods
    formatMessage(template, value) {
        return template.replace(/\{\{value\}\}/g, String(value));
    }

    generateAlertId() {
        return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getSeverityColor(severity) {
        const colors = {
            low: 'good',
            medium: 'warning',
            high: 'danger',
            critical: 'danger'
        };
        return colors[severity] || 'warning';
    }

    getSeverityColorHex(severity) {
        const colors = {
            low: '#36a64f',
            medium: '#ff9500',
            high: '#ff0000',
            critical: '#8b0000'
        };
        return colors[severity] || '#ff9500';
    }

    getSeverityEmoji(severity) {
        const emojis = {
            low: '💙',
            medium: '⚠️',
            high: '🔥',
            critical: '🚨'
        };
        return emojis[severity] || '⚠️';
    }

    async resolveExpiredAlerts() {
        try {
            const now = Date.now();
            const expiredAlerts = [];
            
            for (const [alertKey, alert] of this.activeAlerts) {
                // Auto-resolve alerts that haven't been triggered in 10 minutes
                if (now - alert.lastTriggered > 600000) {
                    alert.resolved = true;
                    alert.resolvedAt = now;
                    alert.autoResolved = true;
                    
                    expiredAlerts.push(alertKey);
                    await this.sendResolutionAlert(alert);
                }
            }
            
            // Remove expired alerts
            for (const alertKey of expiredAlerts) {
                this.activeAlerts.delete(alertKey);
                this.stats.alertsResolved++;
            }
            
        } catch (error) {
            this.logger.error('Failed to resolve expired alerts:', error);
        }
    }

    setupCleanup() {
        // Clean up old alert history every hour
        setInterval(() => {
            const now = Date.now();
            const oneHourAgo = now - 3600000;
            
            for (const [key, timestamp] of this.alertHistory) {
                if (timestamp < oneHourAgo) {
                    this.alertHistory.delete(key);
                }
            }
            
        }, 3600000); // 1 hour
    }

    // Public API
    async loadAlertRules() {
        // Load custom alert rules from configuration or database
        this.logger.debug('Loading custom alert rules...');
    }

    async loadAlertChannels() {
        // Load custom alert channels from configuration
        this.logger.debug('Loading custom alert channels...');
    }

    getActiveAlerts() {
        return Array.from(this.activeAlerts.values());
    }

    getAlertHistory(hours = 24) {
        const cutoff = Date.now() - (hours * 60 * 60 * 1000);
        return Array.from(this.alertHistory.entries())
            .filter(([key, timestamp]) => timestamp > cutoff);
    }

    async testAlert(severity = 'low') {
        const testAlert = {
            id: this.generateAlertId(),
            ruleName: 'test_alert',
            rule: { severity },
            value: 'test',
            severity,
            triggeredAt: Date.now(),
            message: `Test alert with ${severity} severity`,
            type: 'test'
        };
        
        await this.sendAlert(testAlert);
        return testAlert;
    }

    getStats() {
        return {
            ...this.stats,
            activeAlerts: this.activeAlerts.size,
            alertRules: this.alertRules.size,
            alertChannels: this.alertChannels.size,
            alertHistory: this.alertHistory.size,
            initialized: this.initialized
        };
    }

    isInitialized() {
        return this.initialized;
    }
}

module.exports = AlertSystem;