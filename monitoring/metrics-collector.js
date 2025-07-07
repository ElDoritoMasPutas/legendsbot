const os = require('os');
const { performance } = require('perf_hooks');
const config = require('../config/enhanced-config.js');
const Logger = require('../logging/enhanced-logger.js');

class MetricsCollector {
    constructor(analytics, cache) {
        this.analytics = analytics;
        this.cache = cache;
        this.logger = new Logger('MetricsCollector');
        this.initialized = false;
        
        this.metrics = new Map();
        this.collectors = new Map();
        this.aggregatedMetrics = new Map();
        
        this.collectionInterval = config.monitoring.metrics.interval || 60000; // 1 minute
        this.retentionPeriod = config.monitoring.metrics.retention || 2592000000; // 30 days
        
        this.systemMetrics = {
            cpu: { usage: 0, cores: 0, loadAvg: [] },
            memory: { used: 0, total: 0, free: 0, percent: 0 },
            disk: { used: 0, total: 0, free: 0, percent: 0 },
            network: { bytesIn: 0, bytesOut: 0, packetsIn: 0, packetsOut: 0 },
            process: { uptime: 0, pid: 0, memoryUsage: {} }
        };
        
        this.applicationMetrics = {
            discord: { ping: 0, guilds: 0, users: 0, channels: 0 },
            database: { connections: 0, queries: 0, errors: 0, latency: 0 },
            cache: { hits: 0, misses: 0, memory: 0, connections: 0 },
            commands: { executed: 0, failed: 0, avgResponseTime: 0 },
            messages: { processed: 0, analyzed: 0, flagged: 0 },
            moderation: { actions: 0, warnings: 0, bans: 0, kicks: 0 },
            ai: { requests: 0, responses: 0, errors: 0, avgLatency: 0 },
            translation: { requests: 0, cached: 0, errors: 0 },
            security: { threats: 0, blocked: 0, flagged: 0 }
        };
        
        this.performanceMetrics = {
            responseTime: { min: 0, max: 0, avg: 0, p95: 0, p99: 0 },
            throughput: { rps: 0, rpm: 0, rph: 0 },
            errors: { rate: 0, count: 0, types: {} },
            availability: { uptime: 100, downtime: 0 }
        };
        
        this.customMetrics = new Map();
        this.metricHistory = [];
        this.maxHistorySize = 1440; // 24 hours at 1-minute intervals
        
        this.registerDefaultCollectors();
    }

    async initialize() {
        try {
            this.logger.info('Initializing Metrics Collector...');
            
            // Start metric collection
            this.startCollection();
            
            // Setup aggregation processes
            this.setupAggregation();
            
            // Setup cleanup processes
            this.setupCleanup();
            
            this.initialized = true;
            this.logger.info('Metrics Collector initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize Metrics Collector:', error);
            throw error;
        }
    }

    registerDefaultCollectors() {
        // System metrics collectors
        this.collectors.set('cpu', this.collectCPUMetrics.bind(this));
        this.collectors.set('memory', this.collectMemoryMetrics.bind(this));
        this.collectors.set('disk', this.collectDiskMetrics.bind(this));
        this.collectors.set('network', this.collectNetworkMetrics.bind(this));
        this.collectors.set('process', this.collectProcessMetrics.bind(this));
        
        // Application metrics collectors
        this.collectors.set('discord', this.collectDiscordMetrics.bind(this));
        this.collectors.set('database', this.collectDatabaseMetrics.bind(this));
        this.collectors.set('cache', this.collectCacheMetrics.bind(this));
        this.collectors.set('commands', this.collectCommandMetrics.bind(this));
        this.collectors.set('messages', this.collectMessageMetrics.bind(this));
        this.collectors.set('moderation', this.collectModerationMetrics.bind(this));
        this.collectors.set('ai', this.collectAIMetrics.bind(this));
        this.collectors.set('translation', this.collectTranslationMetrics.bind(this));
        this.collectors.set('security', this.collectSecurityMetrics.bind(this));
        
        // Performance metrics collectors
        this.collectors.set('performance', this.collectPerformanceMetrics.bind(this));
        
        this.logger.info(`Registered ${this.collectors.size} metric collectors`);
    }

    async collectMetrics() {
        try {
            const startTime = performance.now();
            const timestamp = Date.now();
            const collectionResults = new Map();
            
            // Collect all metrics
            for (const [name, collector] of this.collectors) {
                try {
                    const metrics = await collector();
                    collectionResults.set(name, metrics);
                } catch (error) {
                    this.logger.error(`Failed to collect ${name} metrics:`, error);
                    collectionResults.set(name, { error: error.message });
                }
            }
            
            // Collect custom metrics
            for (const [name, customCollector] of this.customMetrics) {
                try {
                    const metrics = await customCollector();
                    collectionResults.set(`custom_${name}`, metrics);
                } catch (error) {
                    this.logger.error(`Failed to collect custom metric ${name}:`, error);
                }
            }
            
            const collectionTime = performance.now() - startTime;
            
            // Store metrics
            const metricsSnapshot = {
                timestamp,
                collectionTime,
                system: this.systemMetrics,
                application: this.applicationMetrics,
                performance: this.performanceMetrics,
                custom: Object.fromEntries(this.customMetrics.keys()),
                raw: Object.fromEntries(collectionResults)
            };
            
            // Add to history
            this.addToHistory(metricsSnapshot);
            
            // Cache current metrics
            await this.cacheMetrics(metricsSnapshot);
            
            // Store in analytics
            if (this.analytics) {
                await this.analytics.trackCommandUsage(null, null, 'metrics_collected', true);
            }
            
            this.logger.debug(`Collected metrics in ${Math.round(collectionTime)}ms`);
            
            return metricsSnapshot;
            
        } catch (error) {
            this.logger.error('Metrics collection failed:', error);
            return null;
        }
    }

    // System Metrics Collectors
    async collectCPUMetrics() {
        try {
            const cpus = os.cpus();
            const loadAvg = os.loadavg();
            
            // Calculate CPU usage (simplified)
            let totalIdle = 0;
            let totalTick = 0;
            
            cpus.forEach(cpu => {
                for (const type in cpu.times) {
                    totalTick += cpu.times[type];
                }
                totalIdle += cpu.times.idle;
            });
            
            const idle = totalIdle / cpus.length;
            const total = totalTick / cpus.length;
            const usage = 100 - ~~(100 * idle / total);
            
            this.systemMetrics.cpu = {
                usage,
                cores: cpus.length,
                loadAvg,
                model: cpus[0]?.model || 'Unknown'
            };
            
            return this.systemMetrics.cpu;
            
        } catch (error) {
            this.logger.error('CPU metrics collection failed:', error);
            return { error: error.message };
        }
    }

    async collectMemoryMetrics() {
        try {
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const usedMem = totalMem - freeMem;
            const memPercent = (usedMem / totalMem) * 100;
            
            this.systemMetrics.memory = {
                used: usedMem,
                total: totalMem,
                free: freeMem,
                percent: memPercent,
                usedMB: Math.round(usedMem / 1024 / 1024),
                totalMB: Math.round(totalMem / 1024 / 1024),
                freeMB: Math.round(freeMem / 1024 / 1024)
            };
            
            return this.systemMetrics.memory;
            
        } catch (error) {
            this.logger.error('Memory metrics collection failed:', error);
            return { error: error.message };
        }
    }

    async collectDiskMetrics() {
        try {
            // Basic disk metrics (platform-dependent implementation needed)
            this.systemMetrics.disk = {
                used: 0,
                total: 0,
                free: 0,
                percent: 0,
                available: true
            };
            
            return this.systemMetrics.disk;
            
        } catch (error) {
            this.logger.error('Disk metrics collection failed:', error);
            return { error: error.message };
        }
    }

    async collectNetworkMetrics() {
        try {
            const networkInterfaces = os.networkInterfaces();
            let bytesIn = 0;
            let bytesOut = 0;
            
            // This would need platform-specific implementation for actual network stats
            this.systemMetrics.network = {
                bytesIn,
                bytesOut,
                packetsIn: 0,
                packetsOut: 0,
                interfaces: Object.keys(networkInterfaces).length
            };
            
            return this.systemMetrics.network;
            
        } catch (error) {
            this.logger.error('Network metrics collection failed:', error);
            return { error: error.message };
        }
    }

    async collectProcessMetrics() {
        try {
            const processMemory = process.memoryUsage();
            
            this.systemMetrics.process = {
                uptime: process.uptime(),
                pid: process.pid,
                memoryUsage: {
                    rss: processMemory.rss,
                    heapUsed: processMemory.heapUsed,
                    heapTotal: processMemory.heapTotal,
                    external: processMemory.external,
                    rssMB: Math.round(processMemory.rss / 1024 / 1024),
                    heapUsedMB: Math.round(processMemory.heapUsed / 1024 / 1024),
                    heapTotalMB: Math.round(processMemory.heapTotal / 1024 / 1024)
                },
                version: process.version,
                arch: process.arch,
                platform: process.platform
            };
            
            return this.systemMetrics.process;
            
        } catch (error) {
            this.logger.error('Process metrics collection failed:', error);
            return { error: error.message };
        }
    }

    // Application Metrics Collectors
    async collectDiscordMetrics() {
        try {
            // These would be injected from the main application
            const client = global.discordClient; // Would be properly injected
            
            if (client && client.isReady()) {
                this.applicationMetrics.discord = {
                    ping: client.ws.ping,
                    guilds: client.guilds.cache.size,
                    users: client.users.cache.size,
                    channels: client.channels.cache.size,
                    uptime: client.uptime,
                    status: client.ws.status,
                    shards: client.shard ? client.shard.count : 1
                };
            } else {
                this.applicationMetrics.discord = {
                    ping: -1,
                    guilds: 0,
                    users: 0,
                    channels: 0,
                    uptime: 0,
                    status: 'disconnected',
                    shards: 0
                };
            }
            
            return this.applicationMetrics.discord;
            
        } catch (error) {
            this.logger.error('Discord metrics collection failed:', error);
            return { error: error.message };
        }
    }

    async collectDatabaseMetrics() {
        try {
            // These would be injected from the database instance
            this.applicationMetrics.database = {
                connections: 1, // Would get from connection pool
                queries: 0,     // Would track query count
                errors: 0,      // Would track error count
                latency: 0      // Would measure query latency
            };
            
            return this.applicationMetrics.database;
            
        } catch (error) {
            this.logger.error('Database metrics collection failed:', error);
            return { error: error.message };
        }
    }

    async collectCacheMetrics() {
        try {
            if (this.cache) {
                const stats = this.cache.getStats();
                this.applicationMetrics.cache = {
                    hits: stats.hits || 0,
                    misses: stats.misses || 0,
                    hitRate: stats.hitRate || 0,
                    memory: 0, // Would get from Redis info
                    connections: stats.connected ? 1 : 0
                };
            }
            
            return this.applicationMetrics.cache;
            
        } catch (error) {
            this.logger.error('Cache metrics collection failed:', error);
            return { error: error.message };
        }
    }

    async collectCommandMetrics() {
        try {
            // These would be tracked by the command manager
            this.applicationMetrics.commands = {
                executed: 0,
                failed: 0,
                avgResponseTime: 0,
                topCommands: []
            };
            
            return this.applicationMetrics.commands;
            
        } catch (error) {
            this.logger.error('Command metrics collection failed:', error);
            return { error: error.message };
        }
    }

    async collectMessageMetrics() {
        try {
            // These would be tracked by the message processor
            this.applicationMetrics.messages = {
                processed: 0,
                analyzed: 0,
                flagged: 0,
                avgProcessingTime: 0
            };
            
            return this.applicationMetrics.messages;
            
        } catch (error) {
            this.logger.error('Message metrics collection failed:', error);
            return { error: error.message };
        }
    }

    async collectModerationMetrics() {
        try {
            // These would be tracked by the moderation system
            this.applicationMetrics.moderation = {
                actions: 0,
                warnings: 0,
                bans: 0,
                kicks: 0,
                autoActions: 0
            };
            
            return this.applicationMetrics.moderation;
            
        } catch (error) {
            this.logger.error('Moderation metrics collection failed:', error);
            return { error: error.message };
        }
    }

    async collectAIMetrics() {
        try {
            // These would be tracked by the AI system
            this.applicationMetrics.ai = {
                requests: 0,
                responses: 0,
                errors: 0,
                avgLatency: 0,
                tokensUsed: 0
            };
            
            return this.applicationMetrics.ai;
            
        } catch (error) {
            this.logger.error('AI metrics collection failed:', error);
            return { error: error.message };
        }
    }

    async collectTranslationMetrics() {
        try {
            // These would be tracked by the translation system
            this.applicationMetrics.translation = {
                requests: 0,
                cached: 0,
                errors: 0,
                languages: 0
            };
            
            return this.applicationMetrics.translation;
            
        } catch (error) {
            this.logger.error('Translation metrics collection failed:', error);
            return { error: error.message };
        }
    }

    async collectSecurityMetrics() {
        try {
            // These would be tracked by the security system
            this.applicationMetrics.security = {
                threats: 0,
                blocked: 0,
                flagged: 0,
                falsePositives: 0
            };
            
            return this.applicationMetrics.security;
            
        } catch (error) {
            this.logger.error('Security metrics collection failed:', error);
            return { error: error.message };
        }
    }

    async collectPerformanceMetrics() {
        try {
            // Calculate performance metrics from history
            const recentMetrics = this.metricHistory.slice(-60); // Last hour
            
            if (recentMetrics.length > 0) {
                const responseTimes = recentMetrics
                    .map(m => m.collectionTime)
                    .filter(t => t > 0)
                    .sort((a, b) => a - b);
                
                if (responseTimes.length > 0) {
                    this.performanceMetrics.responseTime = {
                        min: responseTimes[0],
                        max: responseTimes[responseTimes.length - 1],
                        avg: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
                        p95: responseTimes[Math.floor(responseTimes.length * 0.95)],
                        p99: responseTimes[Math.floor(responseTimes.length * 0.99)]
                    };
                }
            }
            
            this.performanceMetrics.throughput = {
                rps: 0, // Requests per second
                rpm: 0, // Requests per minute
                rph: 0  // Requests per hour
            };
            
            this.performanceMetrics.errors = {
                rate: 0,
                count: 0,
                types: {}
            };
            
            this.performanceMetrics.availability = {
                uptime: process.uptime() / (process.uptime() + 0) * 100, // Simplified
                downtime: 0
            };
            
            return this.performanceMetrics;
            
        } catch (error) {
            this.logger.error('Performance metrics collection failed:', error);
            return { error: error.message };
        }
    }

    // Custom metrics support
    registerCustomMetric(name, collector) {
        if (typeof collector !== 'function') {
            throw new Error('Custom metric collector must be a function');
        }
        
        this.customMetrics.set(name, collector);
        this.logger.info(`Registered custom metric: ${name}`);
    }

    unregisterCustomMetric(name) {
        this.customMetrics.delete(name);
        this.logger.info(`Unregistered custom metric: ${name}`);
    }

    // Recording methods
    async recordProcessingTime(processingTime) {
        try {
            const key = 'processing_times';
            if (!this.metrics.has(key)) {
                this.metrics.set(key, []);
            }
            
            const times = this.metrics.get(key);
            times.push({ time: processingTime, timestamp: Date.now() });
            
            // Keep only last 1000 entries
            if (times.length > 1000) {
                times.splice(0, times.length - 1000);
            }
            
        } catch (error) {
            this.logger.error('Failed to record processing time:', error);
        }
    }

    async recordCounter(name, value = 1) {
        try {
            const current = this.metrics.get(name) || 0;
            this.metrics.set(name, current + value);
        } catch (error) {
            this.logger.error(`Failed to record counter ${name}:`, error);
        }
    }

    async recordGauge(name, value) {
        try {
            this.metrics.set(name, value);
        } catch (error) {
            this.logger.error(`Failed to record gauge ${name}:`, error);
        }
    }

    async recordHistogram(name, value) {
        try {
            const key = `histogram_${name}`;
            if (!this.metrics.has(key)) {
                this.metrics.set(key, []);
            }
            
            const histogram = this.metrics.get(key);
            histogram.push({ value, timestamp: Date.now() });
            
            // Keep only last 1000 values
            if (histogram.length > 1000) {
                histogram.splice(0, histogram.length - 1000);
            }
            
        } catch (error) {
            this.logger.error(`Failed to record histogram ${name}:`, error);
        }
    }

    // Utility methods
    addToHistory(snapshot) {
        this.metricHistory.push(snapshot);
        
        if (this.metricHistory.length > this.maxHistorySize) {
            this.metricHistory.shift();
        }
    }

    async cacheMetrics(snapshot) {
        try {
            await this.cache.set('current_metrics', snapshot, 300); // 5 minutes
            await this.cache.set(`metrics_${snapshot.timestamp}`, snapshot, 3600); // 1 hour
        } catch (error) {
            this.logger.error('Failed to cache metrics:', error);
        }
    }

    startCollection() {
        setInterval(async () => {
            await this.collectMetrics();
        }, this.collectionInterval);
        
        this.logger.info(`Started metrics collection every ${this.collectionInterval}ms`);
    }

    setupAggregation() {
        // Aggregate metrics every 5 minutes
        setInterval(async () => {
            await this.aggregateMetrics();
        }, 300000); // 5 minutes
    }

    async aggregateMetrics() {
        try {
            const now = Date.now();
            const fiveMinutesAgo = now - 300000;
            
            const recentMetrics = this.metricHistory.filter(m => 
                m.timestamp >= fiveMinutesAgo
            );
            
            if (recentMetrics.length === 0) return;
            
            // Calculate aggregations
            const aggregated = {
                timestamp: now,
                period: '5m',
                count: recentMetrics.length,
                
                // System aggregations
                cpu: {
                    avg: this.average(recentMetrics.map(m => m.system.cpu.usage)),
                    max: this.maximum(recentMetrics.map(m => m.system.cpu.usage)),
                    min: this.minimum(recentMetrics.map(m => m.system.cpu.usage))
                },
                
                memory: {
                    avg: this.average(recentMetrics.map(m => m.system.memory.percent)),
                    max: this.maximum(recentMetrics.map(m => m.system.memory.percent)),
                    min: this.minimum(recentMetrics.map(m => m.system.memory.percent))
                },
                
                // Application aggregations
                discord: {
                    avgPing: this.average(recentMetrics.map(m => m.application.discord.ping)),
                    maxGuilds: this.maximum(recentMetrics.map(m => m.application.discord.guilds))
                }
            };
            
            this.aggregatedMetrics.set(now, aggregated);
            
            // Keep only last 288 aggregations (24 hours)
            if (this.aggregatedMetrics.size > 288) {
                const oldestKey = Math.min(...this.aggregatedMetrics.keys());
                this.aggregatedMetrics.delete(oldestKey);
            }
            
        } catch (error) {
            this.logger.error('Metrics aggregation failed:', error);
        }
    }

    setupCleanup() {
        // Clean up old metrics every hour
        setInterval(() => {
            const cutoff = Date.now() - this.retentionPeriod;
            
            // Clean history
            this.metricHistory = this.metricHistory.filter(m => m.timestamp > cutoff);
            
            // Clean aggregated metrics
            for (const [timestamp] of this.aggregatedMetrics) {
                if (timestamp < cutoff) {
                    this.aggregatedMetrics.delete(timestamp);
                }
            }
            
        }, 3600000); // 1 hour
    }

    // Statistical helpers
    average(values) {
        if (values.length === 0) return 0;
        return values.reduce((a, b) => a + b, 0) / values.length;
    }

    maximum(values) {
        if (values.length === 0) return 0;
        return Math.max(...values);
    }

    minimum(values) {
        if (values.length === 0) return 0;
        return Math.min(...values);
    }

    percentile(values, p) {
        if (values.length === 0) return 0;
        const sorted = values.slice().sort((a, b) => a - b);
        const index = Math.ceil(sorted.length * p / 100) - 1;
        return sorted[index] || 0;
    }

    // Public API
    getCurrentMetrics() {
        return {
            timestamp: Date.now(),
            system: this.systemMetrics,
            application: this.applicationMetrics,
            performance: this.performanceMetrics,
            custom: Object.fromEntries(this.customMetrics.keys())
        };
    }

    getMetricHistory(minutes = 60) {
        const cutoff = Date.now() - (minutes * 60 * 1000);
        return this.metricHistory.filter(m => m.timestamp > cutoff);
    }

    getAggregatedMetrics(hours = 1) {
        const cutoff = Date.now() - (hours * 60 * 60 * 1000);
        return Array.from(this.aggregatedMetrics.entries())
            .filter(([timestamp]) => timestamp > cutoff)
            .map(([timestamp, data]) => ({ timestamp, ...data }));
    }

    getStats() {
        return {
            collectorsRegistered: this.collectors.size,
            customMetricsRegistered: this.customMetrics.size,
            historySize: this.metricHistory.length,
            aggregatedSize: this.aggregatedMetrics.size,
            collectionInterval: this.collectionInterval,
            retentionPeriod: this.retentionPeriod,
            initialized: this.initialized
        };
    }

    isInitialized() {
        return this.initialized;
    }
}

module.exports = MetricsCollector;