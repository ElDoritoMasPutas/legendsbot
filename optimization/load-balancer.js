const cluster = require('cluster');
const os = require('os');
const { EventEmitter } = require('events');
const config = require('../config/enhanced-config.js');
const Logger = require('../logging/enhanced-logger.js');

class LoadBalancer extends EventEmitter {
    constructor() {
        super();
        this.logger = new Logger('LoadBalancer');
        this.initialized = false;
        
        this.workers = new Map();
        this.workerStats = new Map();
        this.loadDistribution = new Map();
        
        this.config = {
            maxWorkers: config.performance.clustering.workers || os.cpus().length,
            strategy: 'round_robin', // round_robin, least_connections, weighted, cpu_based
            healthCheckInterval: 30000,
            restartDelay: 5000,
            maxRestarts: 5,
            gracefulShutdownTimeout: 30000
        };
        
        this.currentWorkerIndex = 0;
        this.totalRequests = 0;
        this.strategies = {
            round_robin: this.roundRobinStrategy.bind(this),
            least_connections: this.leastConnectionsStrategy.bind(this),
            weighted: this.weightedStrategy.bind(this),
            cpu_based: this.cpuBasedStrategy.bind(this)
        };
        
        this.stats = {
            workersSpawned: 0,
            workersRestarted: 0,
            requestsDistributed: 0,
            averageResponseTime: 0,
            totalErrors: 0
        };
        
        this.isShuttingDown = false;
    }

    async initialize() {
        try {
            this.logger.info('Initializing Load Balancer...');
            
            if (!config.performance.clustering.enabled) {
                this.logger.info('Clustering is disabled - skipping load balancer initialization');
                return;
            }
            
            if (cluster.isMaster) {
                await this.initializeMaster();
            } else {
                await this.initializeWorker();
            }
            
            this.initialized = true;
            this.logger.info('Load Balancer initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize Load Balancer:', error);
            throw error;
        }
    }

    async initializeMaster() {
        try {
            this.logger.info('Initializing master process...');
            
            // Setup master process event handlers
            this.setupMasterEventHandlers();
            
            // Spawn initial workers
            await this.spawnWorkers();
            
            // Setup health monitoring
            this.setupHealthMonitoring();
            
            // Setup graceful shutdown
            this.setupGracefulShutdown();
            
            this.logger.info(`Master process initialized with ${this.workers.size} workers`);
            
        } catch (error) {
            this.logger.error('Failed to initialize master process:', error);
            throw error;
        }
    }

    async initializeWorker() {
        try {
            this.logger.info(`Worker ${process.pid} initializing...`);
            
            // Setup worker event handlers
            this.setupWorkerEventHandlers();
            
            // Send ready signal to master
            process.send({ type: 'worker_ready', pid: process.pid });
            
            this.logger.info(`Worker ${process.pid} initialized`);
            
        } catch (error) {
            this.logger.error(`Worker ${process.pid} initialization failed:`, error);
            throw error;
        }
    }

    setupMasterEventHandlers() {
        cluster.on('fork', (worker) => {
            this.logger.info(`Worker ${worker.process.pid} forked`);
            
            this.workers.set(worker.id, {
                worker,
                pid: worker.process.pid,
                connections: 0,
                requests: 0,
                errors: 0,
                cpuUsage: 0,
                memoryUsage: 0,
                startTime: Date.now(),
                lastHeartbeat: Date.now(),
                restarts: 0,
                weight: 1
            });
            
            this.stats.workersSpawned++;
        });
        
        cluster.on('online', (worker) => {
            this.logger.info(`Worker ${worker.process.pid} is online`);
            
            const workerData = this.workers.get(worker.id);
            if (workerData) {
                workerData.status = 'online';
                workerData.onlineTime = Date.now();
            }
        });
        
        cluster.on('listening', (worker, address) => {
            this.logger.info(`Worker ${worker.process.pid} listening on ${address.address}:${address.port}`);
            
            const workerData = this.workers.get(worker.id);
            if (workerData) {
                workerData.status = 'listening';
                workerData.address = address;
            }
        });
        
        cluster.on('disconnect', (worker) => {
            this.logger.warn(`Worker ${worker.process.pid} disconnected`);
            
            const workerData = this.workers.get(worker.id);
            if (workerData) {
                workerData.status = 'disconnected';
                workerData.disconnectTime = Date.now();
            }
        });
        
        cluster.on('exit', (worker, code, signal) => {
            this.logger.warn(`Worker ${worker.process.pid} exited with code ${code} and signal ${signal}`);
            
            const workerData = this.workers.get(worker.id);
            if (workerData) {
                workerData.status = 'exited';
                workerData.exitTime = Date.now();
                workerData.exitCode = code;
                workerData.exitSignal = signal;
            }
            
            // Restart worker if not shutting down
            if (!this.isShuttingDown && workerData && workerData.restarts < this.config.maxRestarts) {
                setTimeout(async () => {
                    await this.restartWorker(worker.id);
                }, this.config.restartDelay);
            }
            
            this.workers.delete(worker.id);
        });
        
        // Handle worker messages
        cluster.on('message', (worker, message) => {
            this.handleWorkerMessage(worker, message);
        });
    }

    setupWorkerEventHandlers() {
        // Handle messages from master
        process.on('message', (message) => {
            this.handleMasterMessage(message);
        });
        
        // Send periodic heartbeat to master
        setInterval(() => {
            this.sendHeartbeat();
        }, 10000); // Every 10 seconds
        
        // Handle graceful shutdown
        process.on('SIGTERM', () => {
            this.gracefulWorkerShutdown();
        });
        
        process.on('SIGINT', () => {
            this.gracefulWorkerShutdown();
        });
    }

    async spawnWorkers() {
        try {
            const numWorkers = Math.min(this.config.maxWorkers, os.cpus().length);
            
            this.logger.info(`Spawning ${numWorkers} workers...`);
            
            for (let i = 0; i < numWorkers; i++) {
                cluster.fork();
            }
            
            // Wait for all workers to be ready
            await this.waitForWorkers();
            
        } catch (error) {
            this.logger.error('Failed to spawn workers:', error);
            throw error;
        }
    }

    async waitForWorkers() {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                const readyWorkers = Array.from(this.workers.values())
                    .filter(w => w.status === 'listening').length;
                
                if (readyWorkers >= this.config.maxWorkers) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
            
            // Timeout after 30 seconds
            setTimeout(() => {
                clearInterval(checkInterval);
                resolve();
            }, 30000);
        });
    }

    async restartWorker(workerId) {
        try {
            const workerData = this.workers.get(workerId);
            if (!workerData) return;
            
            workerData.restarts++;
            this.stats.workersRestarted++;
            
            this.logger.info(`Restarting worker ${workerId} (restart #${workerData.restarts})`);
            
            // Spawn new worker
            const newWorker = cluster.fork();
            
            this.logger.info(`Worker ${workerId} restarted as ${newWorker.process.pid}`);
            
        } catch (error) {
            this.logger.error(`Failed to restart worker ${workerId}:`, error);
        }
    }

    setupHealthMonitoring() {
        setInterval(() => {
            this.performHealthCheck();
        }, this.config.healthCheckInterval);
        
        this.logger.info(`Health monitoring started with ${this.config.healthCheckInterval}ms interval`);
    }

    async performHealthCheck() {
        try {
            const now = Date.now();
            
            for (const [workerId, workerData] of this.workers) {
                // Check if worker is responsive
                const timeSinceHeartbeat = now - workerData.lastHeartbeat;
                
                if (timeSinceHeartbeat > this.config.healthCheckInterval * 2) {
                    this.logger.warn(`Worker ${workerData.pid} is unresponsive (${timeSinceHeartbeat}ms since last heartbeat)`);
                    
                    // Kill unresponsive worker
                    if (workerData.worker && !workerData.worker.isDead()) {
                        workerData.worker.kill('SIGTERM');
                    }
                }
                
                // Update worker statistics
                this.updateWorkerStats(workerData);
            }
            
        } catch (error) {
            this.logger.error('Health check failed:', error);
        }
    }

    updateWorkerStats(workerData) {
        try {
            // Calculate uptime
            workerData.uptime = Date.now() - workerData.startTime;
            
            // Update load distribution
            this.loadDistribution.set(workerData.worker.id, {
                connections: workerData.connections,
                requests: workerData.requests,
                errors: workerData.errors,
                cpuUsage: workerData.cpuUsage,
                memoryUsage: workerData.memoryUsage,
                uptime: workerData.uptime
            });
            
        } catch (error) {
            this.logger.error('Failed to update worker stats:', error);
        }
    }

    handleWorkerMessage(worker, message) {
        try {
            const workerData = this.workers.get(worker.id);
            if (!workerData) return;
            
            switch (message.type) {
                case 'heartbeat':
                    workerData.lastHeartbeat = Date.now();
                    workerData.cpuUsage = message.cpuUsage || 0;
                    workerData.memoryUsage = message.memoryUsage || 0;
                    break;
                    
                case 'request_start':
                    workerData.connections++;
                    workerData.requests++;
                    this.stats.requestsDistributed++;
                    break;
                    
                case 'request_end':
                    workerData.connections = Math.max(0, workerData.connections - 1);
                    if (message.responseTime) {
                        this.updateResponseTime(message.responseTime);
                    }
                    break;
                    
                case 'error':
                    workerData.errors++;
                    this.stats.totalErrors++;
                    this.logger.error(`Worker ${worker.process.pid} error:`, message.error);
                    break;
                    
                case 'worker_ready':
                    workerData.status = 'ready';
                    break;
                    
                default:
                    this.logger.debug(`Unknown message type from worker ${worker.process.pid}:`, message.type);
            }
            
        } catch (error) {
            this.logger.error('Failed to handle worker message:', error);
        }
    }

    handleMasterMessage(message) {
        try {
            switch (message.type) {
                case 'shutdown':
                    this.gracefulWorkerShutdown();
                    break;
                    
                case 'health_check':
                    this.sendHeartbeat();
                    break;
                    
                default:
                    this.logger.debug('Unknown message type from master:', message.type);
            }
            
        } catch (error) {
            this.logger.error('Failed to handle master message:', error);
        }
    }

    sendHeartbeat() {
        try {
            if (process.send) {
                const memUsage = process.memoryUsage();
                
                process.send({
                    type: 'heartbeat',
                    pid: process.pid,
                    cpuUsage: process.cpuUsage(),
                    memoryUsage: memUsage.heapUsed,
                    uptime: process.uptime()
                });
            }
        } catch (error) {
            this.logger.error('Failed to send heartbeat:', error);
        }
    }

    updateResponseTime(responseTime) {
        if (this.stats.averageResponseTime === 0) {
            this.stats.averageResponseTime = responseTime;
        } else {
            this.stats.averageResponseTime = (this.stats.averageResponseTime + responseTime) / 2;
        }
    }

    // Load balancing strategies
    selectWorker() {
        const strategy = this.strategies[this.config.strategy];
        if (!strategy) {
            this.logger.error(`Unknown load balancing strategy: ${this.config.strategy}`);
            return this.roundRobinStrategy();
        }
        
        return strategy();
    }

    roundRobinStrategy() {
        const workers = Array.from(this.workers.values())
            .filter(w => w.status === 'listening');
        
        if (workers.length === 0) return null;
        
        const worker = workers[this.currentWorkerIndex % workers.length];
        this.currentWorkerIndex++;
        
        return worker;
    }

    leastConnectionsStrategy() {
        const workers = Array.from(this.workers.values())
            .filter(w => w.status === 'listening')
            .sort((a, b) => a.connections - b.connections);
        
        return workers[0] || null;
    }

    weightedStrategy() {
        const workers = Array.from(this.workers.values())
            .filter(w => w.status === 'listening');
        
        if (workers.length === 0) return null;
        
        // Calculate total weight
        const totalWeight = workers.reduce((sum, w) => sum + w.weight, 0);
        
        // Generate random number
        let random = Math.random() * totalWeight;
        
        // Select worker based on weight
        for (const worker of workers) {
            random -= worker.weight;
            if (random <= 0) {
                return worker;
            }
        }
        
        return workers[0];
    }

    cpuBasedStrategy() {
        const workers = Array.from(this.workers.values())
            .filter(w => w.status === 'listening')
            .sort((a, b) => a.cpuUsage - b.cpuUsage);
        
        return workers[0] || null;
    }

    // Request distribution
    distributeRequest(req, res) {
        try {
            const worker = this.selectWorker();
            
            if (!worker) {
                this.logger.error('No available workers for request');
                res.status(503).json({ error: 'Service Unavailable' });
                return;
            }
            
            // Send request start notification
            worker.worker.send({
                type: 'request_start',
                requestId: req.id || this.generateRequestId()
            });
            
            // Forward request to worker
            this.forwardRequest(req, res, worker);
            
        } catch (error) {
            this.logger.error('Failed to distribute request:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    forwardRequest(req, res, workerData) {
        try {
            // In a real implementation, this would forward the HTTP request
            // to the worker process. For now, this is a placeholder.
            
            const startTime = Date.now();
            
            // Simulate request forwarding
            res.on('finish', () => {
                const responseTime = Date.now() - startTime;
                
                workerData.worker.send({
                    type: 'request_end',
                    responseTime
                });
            });
            
        } catch (error) {
            this.logger.error('Failed to forward request:', error);
        }
    }

    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Graceful shutdown
    setupGracefulShutdown() {
        process.on('SIGTERM', () => {
            this.gracefulShutdown();
        });
        
        process.on('SIGINT', () => {
            this.gracefulShutdown();
        });
    }

    async gracefulShutdown() {
        try {
            this.logger.info('Initiating graceful shutdown...');
            this.isShuttingDown = true;
            
            // Send shutdown signal to all workers
            for (const workerData of this.workers.values()) {
                if (workerData.worker && !workerData.worker.isDead()) {
                    workerData.worker.send({ type: 'shutdown' });
                }
            }
            
            // Wait for workers to shutdown gracefully
            await this.waitForWorkersShutdown();
            
            // Force kill any remaining workers
            for (const workerData of this.workers.values()) {
                if (workerData.worker && !workerData.worker.isDead()) {
                    workerData.worker.kill('SIGKILL');
                }
            }
            
            this.logger.info('Graceful shutdown completed');
            process.exit(0);
            
        } catch (error) {
            this.logger.error('Graceful shutdown failed:', error);
            process.exit(1);
        }
    }

    async gracefulWorkerShutdown() {
        try {
            this.logger.info(`Worker ${process.pid} shutting down gracefully...`);
            
            // Close server connections
            // Implementation would depend on the specific server setup
            
            setTimeout(() => {
                process.exit(0);
            }, this.config.gracefulShutdownTimeout);
            
        } catch (error) {
            this.logger.error('Worker graceful shutdown failed:', error);
            process.exit(1);
        }
    }

    async waitForWorkersShutdown() {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                const aliveWorkers = Array.from(this.workers.values())
                    .filter(w => w.worker && !w.worker.isDead()).length;
                
                if (aliveWorkers === 0) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 1000);
            
            // Timeout after graceful shutdown timeout
            setTimeout(() => {
                clearInterval(checkInterval);
                resolve();
            }, this.config.gracefulShutdownTimeout);
        });
    }

    // Public API
    getWorkerStats() {
        const stats = {};
        
        for (const [workerId, workerData] of this.workers) {
            stats[workerId] = {
                pid: workerData.pid,
                status: workerData.status,
                connections: workerData.connections,
                requests: workerData.requests,
                errors: workerData.errors,
                cpuUsage: workerData.cpuUsage,
                memoryUsage: workerData.memoryUsage,
                uptime: workerData.uptime,
                restarts: workerData.restarts,
                weight: workerData.weight
            };
        }
        
        return stats;
    }

    getLoadDistribution() {
        return Object.fromEntries(this.loadDistribution);
    }

    getClusterStats() {
        return {
            ...this.stats,
            totalWorkers: this.workers.size,
            activeWorkers: Array.from(this.workers.values())
                .filter(w => w.status === 'listening').length,
            strategy: this.config.strategy,
            maxWorkers: this.config.maxWorkers
        };
    }

    setLoadBalancingStrategy(strategy) {
        if (this.strategies[strategy]) {
            this.config.strategy = strategy;
            this.logger.info(`Load balancing strategy changed to: ${strategy}`);
        } else {
            throw new Error(`Unknown load balancing strategy: ${strategy}`);
        }
    }

    setWorkerWeight(workerId, weight) {
        const workerData = this.workers.get(workerId);
        if (workerData) {
            workerData.weight = weight;
            this.logger.info(`Worker ${workerId} weight set to: ${weight}`);
        } else {
            throw new Error(`Worker ${workerId} not found`);
        }
    }

    isInitialized() {
        return this.initialized;
    }

    isMaster() {
        return cluster.isMaster;
    }

    isWorker() {
        return cluster.isWorker;
    }
}

module.exports = LoadBalancer;