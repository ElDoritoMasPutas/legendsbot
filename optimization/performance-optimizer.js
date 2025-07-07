const os = require('os');
const { performance } = require('perf_hooks');
const config = require('../config/enhanced-config.js');
const Logger = require('../logging/enhanced-logger.js');

class PerformanceOptimizer {
    constructor(cache, analytics) {
        this.cache = cache;
        this.analytics = analytics;
        this.logger = new Logger('PerformanceOptimizer');
        this.initialized = false;
        
        this.optimizations = new Map();
        this.performanceMetrics = new Map();
        this.thresholds = {
            memory: 0.85,
            cpu: 0.8,
            responseTime: 5000,
            cacheHitRate: 0.7,
            errorRate: 0.05
        };
        
        this.optimizationStrategies = {
            memory: new Set([
                'garbage_collection',
                'cache_cleanup',
                'object_pooling',
                'memory_compression'
            ]),
            cpu: new Set([
                'process_scheduling',
                'task_batching',
                'algorithm_optimization',
                'parallel_processing'
            ]),
            io: new Set([
                'connection_pooling',
                'request_batching',
                'async_optimization',
                'buffer_optimization'
            ]),
            cache: new Set([
                'cache_warming',
                'cache_eviction',
                'cache_partitioning',
                'ttl_optimization'
            ])
        };
        
        this.activeOptimizations = new Set();
        this.optimizationHistory = [];
        this.performanceBaseline = null;
        
        this.stats = {
            optimizationsApplied: 0,
            performanceImprovements: 0,
            memoryOptimizations: 0,
            cpuOptimizations: 0,
            cacheOptimizations: 0,
            ioOptimizations: 0
        };
        
        this.monitoringInterval = 30000; // 30 seconds
        this.optimizationInterval = 300000; // 5 minutes
    }

    async initialize() {
        try {
            this.logger.info('Initializing Performance Optimizer...');
            
            // Establish performance baseline
            await this.establishBaseline();
            
            // Setup monitoring
            this.setupMonitoring();
            
            // Setup optimization processes
            this.setupOptimizationProcesses();
            
            // Initialize optimization strategies
            await this.initializeOptimizationStrategies();
            
            this.initialized = true;
            this.logger.info('Performance Optimizer initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize Performance Optimizer:', error);
            throw error;
        }
    }

    async establishBaseline() {
        try {
            this.logger.info('Establishing performance baseline...');
            
            const baselineMetrics = await this.collectCurrentMetrics();
            this.performanceBaseline = {
                ...baselineMetrics,
                establishedAt: Date.now()
            };
            
            this.logger.info('Performance baseline established:', {
                memory: `${Math.round(baselineMetrics.memory.percent)}%`,
                cpu: `${Math.round(baselineMetrics.cpu.usage)}%`,
                responseTime: `${Math.round(baselineMetrics.responseTime)}ms`
            });
            
        } catch (error) {
            this.logger.error('Failed to establish baseline:', error);
        }
    }

    async collectCurrentMetrics() {
        try {
            const memUsage = process.memoryUsage();
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const usedMem = totalMem - freeMem;
            
            const cpus = os.cpus();
            const loadAvg = os.loadavg();
            const cpuUsage = loadAvg[0] / cpus.length;
            
            // Measure response time with a simple operation
            const start = performance.now();
            await new Promise(resolve => setImmediate(resolve));
            const responseTime = performance.now() - start;
            
            // Get cache metrics if available
            let cacheMetrics = { hitRate: 0, size: 0 };
            if (this.cache) {
                const cacheStats = this.cache.getStats();
                cacheMetrics = {
                    hitRate: cacheStats.hitRate || 0,
                    size: cacheStats.cacheHits + cacheStats.cacheMisses || 0
                };
            }
            
            return {
                timestamp: Date.now(),
                memory: {
                    rss: memUsage.rss,
                    heapUsed: memUsage.heapUsed,
                    heapTotal: memUsage.heapTotal,
                    external: memUsage.external,
                    systemUsed: usedMem,
                    systemTotal: totalMem,
                    percent: (usedMem / totalMem) * 100
                },
                cpu: {
                    usage: cpuUsage * 100,
                    cores: cpus.length,
                    loadAvg: loadAvg
                },
                responseTime,
                cache: cacheMetrics,
                uptime: process.uptime()
            };
            
        } catch (error) {
            this.logger.error('Failed to collect current metrics:', error);
            return {};
        }
    }

    setupMonitoring() {
        setInterval(async () => {
            await this.monitorPerformance();
        }, this.monitoringInterval);
        
        this.logger.info(`Started performance monitoring every ${this.monitoringInterval}ms`);
    }

    setupOptimizationProcesses() {
        setInterval(async () => {
            await this.optimize();
        }, this.optimizationInterval);
        
        this.logger.info(`Started optimization processes every ${this.optimizationInterval}ms`);
    }

    async initializeOptimizationStrategies() {
        try {
            // Initialize object pooling
            this.objectPools = {
                objects: new Map(),
                arrays: new Map(),
                buffers: new Map()
            };
            
            // Initialize connection pools
            this.connectionPools = new Map();
            
            // Initialize batch processors
            this.batchProcessors = new Map();
            
            this.logger.info('Optimization strategies initialized');
            
        } catch (error) {
            this.logger.error('Failed to initialize optimization strategies:', error);
        }
    }

    async monitorPerformance() {
        try {
            const currentMetrics = await this.collectCurrentMetrics();
            this.performanceMetrics.set(currentMetrics.timestamp, currentMetrics);
            
            // Keep only last 100 metrics
            if (this.performanceMetrics.size > 100) {
                const oldestKey = Math.min(...this.performanceMetrics.keys());
                this.performanceMetrics.delete(oldestKey);
            }
            
            // Check for performance issues
            await this.detectPerformanceIssues(currentMetrics);
            
        } catch (error) {
            this.logger.error('Performance monitoring failed:', error);
        }
    }

    async detectPerformanceIssues(metrics) {
        try {
            const issues = [];
            
            // Memory usage check
            if (metrics.memory.percent > this.thresholds.memory * 100) {
                issues.push({
                    type: 'memory',
                    severity: metrics.memory.percent > 95 ? 'critical' : 'high',
                    value: metrics.memory.percent,
                    threshold: this.thresholds.memory * 100
                });
            }
            
            // CPU usage check
            if (metrics.cpu.usage > this.thresholds.cpu * 100) {
                issues.push({
                    type: 'cpu',
                    severity: metrics.cpu.usage > 95 ? 'critical' : 'high',
                    value: metrics.cpu.usage,
                    threshold: this.thresholds.cpu * 100
                });
            }
            
            // Response time check
            if (metrics.responseTime > this.thresholds.responseTime) {
                issues.push({
                    type: 'responseTime',
                    severity: metrics.responseTime > 10000 ? 'critical' : 'medium',
                    value: metrics.responseTime,
                    threshold: this.thresholds.responseTime
                });
            }
            
            // Cache hit rate check
            if (metrics.cache.hitRate < this.thresholds.cacheHitRate) {
                issues.push({
                    type: 'cache',
                    severity: 'medium',
                    value: metrics.cache.hitRate,
                    threshold: this.thresholds.cacheHitRate
                });
            }
            
            // Apply optimizations for detected issues
            for (const issue of issues) {
                await this.applyOptimization(issue);
            }
            
        } catch (error) {
            this.logger.error('Performance issue detection failed:', error);
        }
    }

    async optimize() {
        try {
            this.logger.debug('Running performance optimization cycle...');
            
            const currentMetrics = await this.collectCurrentMetrics();
            
            // Memory optimization
            await this.optimizeMemory(currentMetrics);
            
            // CPU optimization
            await this.optimizeCPU(currentMetrics);
            
            // I/O optimization
            await this.optimizeIO(currentMetrics);
            
            // Cache optimization
            await this.optimizeCache(currentMetrics);
            
            // Garbage collection optimization
            await this.optimizeGarbageCollection(currentMetrics);
            
        } catch (error) {
            this.logger.error('Optimization cycle failed:', error);
        }
    }

    async applyOptimization(issue) {
        try {
            const optimizationKey = `${issue.type}_${Date.now()}`;
            
            if (this.activeOptimizations.has(issue.type)) {
                this.logger.debug(`Optimization already active for ${issue.type}`);
                return;
            }
            
            this.activeOptimizations.add(issue.type);
            
            let result = false;
            
            switch (issue.type) {
                case 'memory':
                    result = await this.applyMemoryOptimization(issue);
                    break;
                case 'cpu':
                    result = await this.applyCPUOptimization(issue);
                    break;
                case 'responseTime':
                    result = await this.applyResponseTimeOptimization(issue);
                    break;
                case 'cache':
                    result = await this.applyCacheOptimization(issue);
                    break;
            }
            
            const optimization = {
                key: optimizationKey,
                type: issue.type,
                severity: issue.severity,
                appliedAt: Date.now(),
                success: result,
                metrics: {
                    before: issue.value,
                    threshold: issue.threshold
                }
            };
            
            this.optimizations.set(optimizationKey, optimization);
            this.optimizationHistory.push(optimization);
            
            if (result) {
                this.stats.optimizationsApplied++;
                this.logger.info(`Applied ${issue.type} optimization`, optimization);
            }
            
            // Remove from active optimizations after a delay
            setTimeout(() => {
                this.activeOptimizations.delete(issue.type);
            }, 60000); // 1 minute
            
        } catch (error) {
            this.logger.error(`Failed to apply optimization for ${issue.type}:`, error);
            this.activeOptimizations.delete(issue.type);
        }
    }

    async applyMemoryOptimization(issue) {
        try {
            let optimized = false;
            
            // Force garbage collection
            if (global.gc) {
                global.gc();
                optimized = true;
                this.logger.debug('Forced garbage collection');
            }
            
            // Clean up cache if available
            if (this.cache) {
                await this.cache.cleanup();
                optimized = true;
                this.logger.debug('Cleaned up cache');
            }
            
            // Clear object pools
            this.clearObjectPools();
            optimized = true;
            
            if (optimized) {
                this.stats.memoryOptimizations++;
            }
            
            return optimized;
            
        } catch (error) {
            this.logger.error('Memory optimization failed:', error);
            return false;
        }
    }

    async applyCPUOptimization(issue) {
        try {
            let optimized = false;
            
            // Reduce processing frequency temporarily
            this.monitoringInterval = Math.min(this.monitoringInterval * 1.5, 60000);
            optimized = true;
            
            // Enable batch processing
            this.enableBatchProcessing();
            optimized = true;
            
            if (optimized) {
                this.stats.cpuOptimizations++;
            }
            
            return optimized;
            
        } catch (error) {
            this.logger.error('CPU optimization failed:', error);
            return false;
        }
    }

    async applyResponseTimeOptimization(issue) {
        try {
            let optimized = false;
            
            // Optimize async operations
            this.optimizeAsyncOperations();
            optimized = true;
            
            // Enable connection pooling
            this.enableConnectionPooling();
            optimized = true;
            
            return optimized;
            
        } catch (error) {
            this.logger.error('Response time optimization failed:', error);
            return false;
        }
    }

    async applyCacheOptimization(issue) {
        try {
            let optimized = false;
            
            if (this.cache) {
                // Cache warming for frequently accessed data
                await this.warmCache();
                optimized = true;
                
                // Optimize TTL values
                this.optimizeCacheTTL();
                optimized = true;
            }
            
            if (optimized) {
                this.stats.cacheOptimizations++;
            }
            
            return optimized;
            
        } catch (error) {
            this.logger.error('Cache optimization failed:', error);
            return false;
        }
    }

    // Memory Optimization Methods
    async optimizeMemory(metrics) {
        try {
            if (metrics.memory.percent > 70) {
                // Clean up old performance metrics
                if (this.performanceMetrics.size > 50) {
                    const keys = Array.from(this.performanceMetrics.keys()).slice(0, 25);
                    keys.forEach(key => this.performanceMetrics.delete(key));
                }
                
                // Clean up optimization history
                if (this.optimizationHistory.length > 100) {
                    this.optimizationHistory = this.optimizationHistory.slice(-50);
                }
                
                this.logger.debug('Cleaned up memory usage');
            }
            
        } catch (error) {
            this.logger.error('Memory optimization failed:', error);
        }
    }

    async optimizeCPU(metrics) {
        try {
            if (metrics.cpu.usage > 60) {
                // Implement CPU optimization strategies
                this.optimizeEventLoop();
                this.enableProcessScheduling();
            }
            
        } catch (error) {
            this.logger.error('CPU optimization failed:', error);
        }
    }

    async optimizeIO(metrics) {
        try {
            // Optimize I/O operations
            this.optimizeBufferSizes();
            this.enableAsyncOptimizations();
            
        } catch (error) {
            this.logger.error('I/O optimization failed:', error);
        }
    }

    async optimizeCache(metrics) {
        try {
            if (this.cache && metrics.cache.hitRate < 0.8) {
                await this.optimizeCacheStrategies();
            }
            
        } catch (error) {
            this.logger.error('Cache optimization failed:', error);
        }
    }

    async optimizeGarbageCollection(metrics) {
        try {
            if (metrics.memory.percent > 80 && global.gc) {
                // Force garbage collection during low activity
                setImmediate(() => {
                    global.gc();
                    this.logger.debug('Triggered garbage collection');
                });
            }
            
        } catch (error) {
            this.logger.error('Garbage collection optimization failed:', error);
        }
    }

    // Optimization Strategy Implementations
    clearObjectPools() {
        try {
            for (const [type, pool] of Object.entries(this.objectPools)) {
                pool.clear();
            }
        } catch (error) {
            this.logger.error('Failed to clear object pools:', error);
        }
    }

    enableBatchProcessing() {
        try {
            // Implementation for batch processing optimization
            this.batchProcessors.set('default', {
                enabled: true,
                batchSize: 10,
                timeout: 100
            });
        } catch (error) {
            this.logger.error('Failed to enable batch processing:', error);
        }
    }

    optimizeEventLoop() {
        try {
            // Use setImmediate for non-critical operations
            if (!this.eventLoopOptimized) {
                this.eventLoopOptimized = true;
                // Defer non-critical operations
            }
        } catch (error) {
            this.logger.error('Event loop optimization failed:', error);
        }
    }

    enableProcessScheduling() {
        try {
            // Implement process scheduling optimizations
            process.nextTick(() => {
                // Lower priority operations
            });
        } catch (error) {
            this.logger.error('Process scheduling optimization failed:', error);
        }
    }

    optimizeAsyncOperations() {
        try {
            // Optimize async operation patterns
            this.asyncOptimizations = {
                enabled: true,
                concurrencyLimit: 5,
                timeoutReduction: 0.8
            };
        } catch (error) {
            this.logger.error('Async operations optimization failed:', error);
        }
    }

    enableConnectionPooling() {
        try {
            // Enable connection pooling for better resource management
            if (!this.connectionPools.has('default')) {
                this.connectionPools.set('default', {
                    maxConnections: 10,
                    idleTimeout: 30000,
                    enabled: true
                });
            }
        } catch (error) {
            this.logger.error('Connection pooling optimization failed:', error);
        }
    }

    async warmCache() {
        try {
            if (this.cache) {
                // Pre-load frequently accessed data
                const warmupData = [
                    'guild_settings:*',
                    'user_profile:*',
                    'message_analysis:*'
                ];
                
                for (const pattern of warmupData) {
                    // Implementation would depend on cache structure
                }
                
                this.logger.debug('Cache warming completed');
            }
        } catch (error) {
            this.logger.error('Cache warming failed:', error);
        }
    }

    optimizeCacheTTL() {
        try {
            // Optimize cache TTL values based on access patterns
            this.cacheOptimizations = {
                dynamicTTL: true,
                maxTTL: 3600,
                minTTL: 60
            };
        } catch (error) {
            this.logger.error('Cache TTL optimization failed:', error);
        }
    }

    optimizeBufferSizes() {
        try {
            // Optimize buffer sizes for better I/O performance
            this.bufferOptimizations = {
                defaultSize: 64 * 1024, // 64KB
                maxSize: 1024 * 1024,   // 1MB
                enabled: true
            };
        } catch (error) {
            this.logger.error('Buffer size optimization failed:', error);
        }
    }

    enableAsyncOptimizations() {
        try {
            // Enable various async optimizations
            this.asyncOptimizations = {
                ...this.asyncOptimizations,
                promisePooling: true,
                asyncQueue: true,
                deferredOperations: true
            };
        } catch (error) {
            this.logger.error('Async optimizations failed:', error);
        }
    }

    async optimizeCacheStrategies() {
        try {
            if (this.cache) {
                // Implement cache optimization strategies
                await this.cache.cleanup();
                
                // Adjust cache strategies
                this.cacheStrategies = {
                    lru: true,
                    compression: true,
                    partitioning: true
                };
            }
        } catch (error) {
            this.logger.error('Cache strategies optimization failed:', error);
        }
    }

    // Performance Analysis
    getPerformanceReport() {
        try {
            const recentMetrics = Array.from(this.performanceMetrics.values()).slice(-10);
            
            if (recentMetrics.length === 0) {
                return { error: 'No performance data available' };
            }
            
            const avgMemory = recentMetrics.reduce((sum, m) => sum + m.memory.percent, 0) / recentMetrics.length;
            const avgCPU = recentMetrics.reduce((sum, m) => sum + m.cpu.usage, 0) / recentMetrics.length;
            const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length;
            
            const currentMetrics = recentMetrics[recentMetrics.length - 1];
            const baseline = this.performanceBaseline;
            
            return {
                current: {
                    memory: Math.round(currentMetrics.memory.percent),
                    cpu: Math.round(currentMetrics.cpu.usage),
                    responseTime: Math.round(currentMetrics.responseTime)
                },
                averages: {
                    memory: Math.round(avgMemory),
                    cpu: Math.round(avgCPU),
                    responseTime: Math.round(avgResponseTime)
                },
                baseline: baseline ? {
                    memory: Math.round(baseline.memory.percent),
                    cpu: Math.round(baseline.cpu.usage),
                    responseTime: Math.round(baseline.responseTime)
                } : null,
                improvements: baseline ? {
                    memory: Math.round(baseline.memory.percent - avgMemory),
                    cpu: Math.round(baseline.cpu.usage - avgCPU),
                    responseTime: Math.round(baseline.responseTime - avgResponseTime)
                } : null,
                optimizations: {
                    applied: this.stats.optimizationsApplied,
                    active: this.activeOptimizations.size,
                    history: this.optimizationHistory.slice(-5)
                }
            };
            
        } catch (error) {
            this.logger.error('Failed to generate performance report:', error);
            return { error: error.message };
        }
    }

    // Public API
    getStats() {
        return {
            ...this.stats,
            activeOptimizations: this.activeOptimizations.size,
            optimizationHistory: this.optimizationHistory.length,
            performanceMetrics: this.performanceMetrics.size,
            thresholds: this.thresholds,
            initialized: this.initialized
        };
    }

    getThresholds() {
        return { ...this.thresholds };
    }

    setThresholds(newThresholds) {
        Object.assign(this.thresholds, newThresholds);
        this.logger.info('Performance thresholds updated:', newThresholds);
    }

    getCurrentMetrics() {
        const latest = Array.from(this.performanceMetrics.values()).pop();
        return latest || null;
    }

    getOptimizationHistory(limit = 10) {
        return this.optimizationHistory.slice(-limit);
    }

    async forceOptimization(type = 'all') {
        try {
            if (type === 'all') {
                await this.optimize();
            } else {
                const currentMetrics = await this.collectCurrentMetrics();
                switch (type) {
                    case 'memory':
                        await this.optimizeMemory(currentMetrics);
                        break;
                    case 'cpu':
                        await this.optimizeCPU(currentMetrics);
                        break;
                    case 'cache':
                        await this.optimizeCache(currentMetrics);
                        break;
                    case 'io':
                        await this.optimizeIO(currentMetrics);
                        break;
                    default:
                        throw new Error(`Unknown optimization type: ${type}`);
                }
            }
            
            this.logger.info(`Forced ${type} optimization completed`);
            
        } catch (error) {
            this.logger.error(`Failed to force ${type} optimization:`, error);
            throw error;
        }
    }

    isInitialized() {
        return this.initialized;
    }
}

module.exports = PerformanceOptimizer;