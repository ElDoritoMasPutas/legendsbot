const os = require('os');
const { performance } = require('perf_hooks');
const config = require('../config/enhanced-config.js');
const Logger = require('../logging/enhanced-logger.js');

class HealthMonitor {
    constructor(client, database, cache) {
        this.client = client;
        this.database = database;
        this.cache = cache;
        this.logger = new Logger('HealthMonitor');
        this.initialized = false;
        
        this.healthStatus = {
            overall: 'unknown',
            discord: 'unknown',
            database: 'unknown',
            cache: 'unknown',
            memory: 'unknown',
            cpu: 'unknown',
            lastCheck: null
        };
        
        this.metrics = {
            uptime: 0,
            memoryUsage: {},
            cpuUsage: 0,
            discordLatency: 0,
            databaseLatency: 0,
            cacheLatency: 0,
            errorRate: 0,
            responseTime: 0
        };
        
        this.thresholds = {
            memory: {
                warning: 0.8,
                critical: 0.9
            },
            cpu: {
                warning: 0.7,
                critical: 0.9
            },
            latency: {
                warning: 1000,
                critical: 5000
            },
            errorRate: {
                warning: 0.05,
                critical: 0.1
            }
        };
        
        this.alertHistory = new Map();
        this.checkInterval = config.monitoring.health.checkInterval || 30000;
        this.healthHistory = [];
        this.maxHistorySize = 100;
        
        this.components = new Map();
        this.registerComponents();
    }

    async initialize() {
        try {
            this.logger.info('Initializing Health Monitor...');
            
            // Perform initial health check
            await this.performHealthCheck();
            
            // Start periodic health checks
            this.startPeriodicChecks();
            
            this.initialized = true;
            this.logger.info('Health Monitor initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize Health Monitor:', error);
            throw error;
        }
    }

    registerComponents() {
        // Register all system components for monitoring
        this.components.set('discord', {
            name: 'Discord Client',
            check: this.checkDiscordHealth.bind(this),
            critical: true
        });
        
        this.components.set('database', {
            name: 'Database Connection',
            check: this.checkDatabaseHealth.bind(this),
            critical: true
        });
        
        this.components.set('cache', {
            name: 'Cache System',
            check: this.checkCacheHealth.bind(this),
            critical: true
        });
        
        this.components.set('memory', {
            name: 'Memory Usage',
            check: this.checkMemoryHealth.bind(this),
            critical: true
        });
        
        this.components.set('cpu', {
            name: 'CPU Usage',
            check: this.checkCPUHealth.bind(this),
            critical: false
        });
        
        this.components.set('disk', {
            name: 'Disk Space',
            check: this.checkDiskHealth.bind(this),
            critical: false
        });
        
        this.components.set('network', {
            name: 'Network Connectivity',
            check: this.checkNetworkHealth.bind(this),
            critical: false
        });
    }

    async performHealthCheck() {
        try {
            const startTime = performance.now();
            const componentResults = new Map();
            let overallStatus = 'healthy';
            
            // Check all registered components
            for (const [key, component] of this.components) {
                try {
                    const result = await component.check();
                    componentResults.set(key, result);
                    this.healthStatus[key] = result.status;
                    
                    // Update overall status based on critical components
                    if (component.critical && result.status !== 'healthy') {
                        if (result.status === 'critical') {
                            overallStatus = 'critical';
                        } else if (overallStatus === 'healthy') {
                            overallStatus = 'warning';
                        }
                    }
                    
                } catch (error) {
                    this.logger.error(`Health check failed for ${component.name}:`, error);
                    componentResults.set(key, {
                        status: 'critical',
                        message: `Check failed: ${error.message}`,
                        timestamp: Date.now()
                    });
                    this.healthStatus[key] = 'critical';
                    
                    if (component.critical) {
                        overallStatus = 'critical';
                    }
                }
            }
            
            this.healthStatus.overall = overallStatus;
            this.healthStatus.lastCheck = Date.now();
            
            const checkDuration = performance.now() - startTime;
            
            // Update metrics
            this.updateMetrics(componentResults, checkDuration);
            
            // Store health history
            this.addHealthHistory({
                timestamp: Date.now(),
                overall: overallStatus,
                components: Object.fromEntries(componentResults),
                checkDuration,
                metrics: { ...this.metrics }
            });
            
            // Check for alerts
            await this.checkAlertConditions(componentResults);
            
            return {
                status: overallStatus,
                components: Object.fromEntries(componentResults),
                metrics: this.metrics,
                checkDuration
            };
            
        } catch (error) {
            this.logger.error('Health check failed:', error);
            this.healthStatus.overall = 'critical';
            throw error;
        }
    }

    async checkDiscordHealth() {
        try {
            const startTime = performance.now();
            
            if (!this.client || !this.client.isReady()) {
                return {
                    status: 'critical',
                    message: 'Discord client not ready',
                    timestamp: Date.now()
                };
            }
            
            const latency = this.client.ws.ping;
            const responseTime = performance.now() - startTime;
            
            let status = 'healthy';
            let message = `Latency: ${latency}ms`;
            
            if (latency > this.thresholds.latency.critical) {
                status = 'critical';
                message += ' (Critical latency)';
            } else if (latency > this.thresholds.latency.warning) {
                status = 'warning';
                message += ' (High latency)';
            }
            
            this.metrics.discordLatency = latency;
            
            return {
                status,
                message,
                latency,
                responseTime,
                guilds: this.client.guilds.cache.size,
                users: this.client.users.cache.size,
                timestamp: Date.now()
            };
            
        } catch (error) {
            return {
                status: 'critical',
                message: `Discord check failed: ${error.message}`,
                timestamp: Date.now()
            };
        }
    }

    async checkDatabaseHealth() {
        try {
            const startTime = performance.now();
            
            if (!this.database || !this.database.isConnected()) {
                return {
                    status: 'critical',
                    message: 'Database not connected',
                    timestamp: Date.now()
                };
            }
            
            // Perform a simple query to test responsiveness
            await this.database.sequelize.authenticate();
            const responseTime = performance.now() - startTime;
            
            let status = 'healthy';
            let message = `Response time: ${Math.round(responseTime)}ms`;
            
            if (responseTime > this.thresholds.latency.critical) {
                status = 'critical';
                message += ' (Critical response time)';
            } else if (responseTime > this.thresholds.latency.warning) {
                status = 'warning';
                message += ' (Slow response time)';
            }
            
            this.metrics.databaseLatency = responseTime;
            
            return {
                status,
                message,
                responseTime,
                timestamp: Date.now()
            };
            
        } catch (error) {
            return {
                status: 'critical',
                message: `Database check failed: ${error.message}`,
                timestamp: Date.now()
            };
        }
    }

    async checkCacheHealth() {
        try {
            const startTime = performance.now();
            
            if (!this.cache || !this.cache.isConnected()) {
                return {
                    status: 'critical',
                    message: 'Cache not connected',
                    timestamp: Date.now()
                };
            }
            
            // Test cache with a simple operation
            const testKey = `health_check_${Date.now()}`;
            await this.cache.set(testKey, 'test', 10);
            const result = await this.cache.get(testKey);
            await this.cache.del(testKey);
            
            const responseTime = performance.now() - startTime;
            
            if (result !== 'test') {
                return {
                    status: 'critical',
                    message: 'Cache read/write test failed',
                    timestamp: Date.now()
                };
            }
            
            let status = 'healthy';
            let message = `Response time: ${Math.round(responseTime)}ms`;
            
            if (responseTime > this.thresholds.latency.critical) {
                status = 'critical';
                message += ' (Critical response time)';
            } else if (responseTime > this.thresholds.latency.warning) {
                status = 'warning';
                message += ' (Slow response time)';
            }
            
            this.metrics.cacheLatency = responseTime;
            
            return {
                status,
                message,
                responseTime,
                timestamp: Date.now()
            };
            
        } catch (error) {
            return {
                status: 'critical',
                message: `Cache check failed: ${error.message}`,
                timestamp: Date.now()
            };
        }
    }

    async checkMemoryHealth() {
        try {
            const memUsage = process.memoryUsage();
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const usedMem = totalMem - freeMem;
            const memPercent = usedMem / totalMem;
            
            this.metrics.memoryUsage = {
                rss: memUsage.rss,
                heapUsed: memUsage.heapUsed,
                heapTotal: memUsage.heapTotal,
                external: memUsage.external,
                systemUsed: usedMem,
                systemTotal: totalMem,
                systemPercent: memPercent
            };
            
            let status = 'healthy';
            let message = `System: ${Math.round(memPercent * 100)}%, Heap: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`;
            
            if (memPercent > this.thresholds.memory.critical) {
                status = 'critical';
                message += ' (Critical memory usage)';
            } else if (memPercent > this.thresholds.memory.warning) {
                status = 'warning';
                message += ' (High memory usage)';
            }
            
            return {
                status,
                message,
                memoryUsage: this.metrics.memoryUsage,
                timestamp: Date.now()
            };
            
        } catch (error) {
            return {
                status: 'critical',
                message: `Memory check failed: ${error.message}`,
                timestamp: Date.now()
            };
        }
    }

    async checkCPUHealth() {
        try {
            const cpus = os.cpus();
            const loadAvg = os.loadavg();
            const cpuUsage = loadAvg[0] / cpus.length; // 1-minute load average
            
            this.metrics.cpuUsage = cpuUsage;
            
            let status = 'healthy';
            let message = `Usage: ${Math.round(cpuUsage * 100)}%`;
            
            if (cpuUsage > this.thresholds.cpu.critical) {
                status = 'critical';
                message += ' (Critical CPU usage)';
            } else if (cpuUsage > this.thresholds.cpu.warning) {
                status = 'warning';
                message += ' (High CPU usage)';
            }
            
            return {
                status,
                message,
                cpuUsage,
                cpuCount: cpus.length,
                loadAverage: loadAvg,
                timestamp: Date.now()
            };
            
        } catch (error) {
            return {
                status: 'warning',
                message: `CPU check failed: ${error.message}`,
                timestamp: Date.now()
            };
        }
    }

    async checkDiskHealth() {
        try {
            // Basic disk space check (platform-dependent)
            const stats = require('fs').statSync('.');
            
            return {
                status: 'healthy',
                message: 'Disk space check not implemented',
                timestamp: Date.now()
            };
            
        } catch (error) {
            return {
                status: 'warning',
                message: `Disk check failed: ${error.message}`,
                timestamp: Date.now()
            };
        }
    }

    async checkNetworkHealth() {
        try {
            // Simple network connectivity check
            const startTime = performance.now();
            
            // Test external connectivity
            const response = await fetch('https://discord.com/api/v10/gateway', {
                method: 'GET',
                timeout: 5000
            });
            
            const responseTime = performance.now() - startTime;
            
            let status = 'healthy';
            let message = `Response time: ${Math.round(responseTime)}ms`;
            
            if (!response.ok) {
                status = 'warning';
                message = `HTTP ${response.status}`;
            } else if (responseTime > 3000) {
                status = 'warning';
                message += ' (Slow network)';
            }
            
            return {
                status,
                message,
                responseTime,
                timestamp: Date.now()
            };
            
        } catch (error) {
            return {
                status: 'critical',
                message: `Network check failed: ${error.message}`,
                timestamp: Date.now()
            };
        }
    }

    updateMetrics(componentResults, checkDuration) {
        this.metrics.uptime = process.uptime();
        this.metrics.responseTime = checkDuration;
        
        // Calculate error rate based on failed checks
        const totalChecks = componentResults.size;
        const failedChecks = Array.from(componentResults.values())
            .filter(result => result.status === 'critical').length;
        
        this.metrics.errorRate = totalChecks > 0 ? failedChecks / totalChecks : 0;
    }

    addHealthHistory(healthData) {
        this.healthHistory.push(healthData);
        
        if (this.healthHistory.length > this.maxHistorySize) {
            this.healthHistory = this.healthHistory.slice(-this.maxHistorySize);
        }
    }

    async checkAlertConditions(componentResults) {
        try {
            const now = Date.now();
            
            for (const [componentKey, result] of componentResults) {
                if (result.status === 'critical' || result.status === 'warning') {
                    const alertKey = `${componentKey}_${result.status}`;
                    const lastAlert = this.alertHistory.get(alertKey);
                    
                    // Avoid alert spam - only alert once per hour for the same issue
                    if (!lastAlert || now - lastAlert > 3600000) {
                        await this.sendAlert(componentKey, result);
                        this.alertHistory.set(alertKey, now);
                    }
                }
            }
            
        } catch (error) {
            this.logger.error('Alert condition check failed:', error);
        }
    }

    async sendAlert(componentKey, result) {
        try {
            const component = this.components.get(componentKey);
            const severity = result.status === 'critical' ? 'high' : 'medium';
            
            this.logger.logSecurityEvent(
                'HEALTH_ALERT',
                severity,
                {
                    component: component.name,
                    status: result.status,
                    message: result.message,
                    critical: component.critical
                }
            );
            
            // Additional alert mechanisms could be implemented here
            // - Email notifications
            // - Slack/Discord webhooks
            // - SMS alerts
            // - Dashboard notifications
            
        } catch (error) {
            this.logger.error('Failed to send health alert:', error);
        }
    }

    startPeriodicChecks() {
        setInterval(async () => {
            try {
                await this.performHealthCheck();
            } catch (error) {
                this.logger.error('Periodic health check failed:', error);
            }
        }, this.checkInterval);
        
        this.logger.info(`Started periodic health checks every ${this.checkInterval}ms`);
    }

    async performStartupHealthCheck() {
        try {
            this.logger.info('Performing startup health check...');
            
            const result = await this.performHealthCheck();
            
            if (result.status === 'critical') {
                this.logger.error('Startup health check failed - system in critical state');
                this.logger.error('Failed components:', 
                    Object.entries(result.components)
                        .filter(([_, comp]) => comp.status === 'critical')
                        .map(([name, comp]) => `${name}: ${comp.message}`)
                );
            } else {
                this.logger.info(`Startup health check completed - status: ${result.status}`);
            }
            
            return result;
            
        } catch (error) {
            this.logger.error('Startup health check failed:', error);
            throw error;
        }
    }

    getHealthStatus() {
        return {
            ...this.healthStatus,
            metrics: this.metrics,
            uptime: process.uptime(),
            timestamp: Date.now()
        };
    }

    getHealthHistory(limit = 50) {
        return this.healthHistory.slice(-limit);
    }

    getComponentStatus(componentKey) {
        if (!this.components.has(componentKey)) {
            return null;
        }
        
        return {
            name: this.components.get(componentKey).name,
            status: this.healthStatus[componentKey] || 'unknown',
            lastCheck: this.healthStatus.lastCheck
        };
    }

    getAllComponentsStatus() {
        const components = {};
        
        for (const [key, component] of this.components) {
            components[key] = {
                name: component.name,
                status: this.healthStatus[key] || 'unknown',
                critical: component.critical
            };
        }
        
        return components;
    }

    async forceHealthCheck() {
        this.logger.info('Forcing immediate health check...');
        return await this.performHealthCheck();
    }

    updateThresholds(newThresholds) {
        Object.assign(this.thresholds, newThresholds);
        this.logger.info('Health monitoring thresholds updated');
    }

    getMetrics() {
        return {
            ...this.metrics,
            thresholds: this.thresholds,
            alertHistory: this.alertHistory.size,
            historySize: this.healthHistory.length
        };
    }

    isHealthy() {
        return this.healthStatus.overall === 'healthy';
    }

    isInitialized() {
        return this.initialized;
    }
}

module.exports = HealthMonitor;