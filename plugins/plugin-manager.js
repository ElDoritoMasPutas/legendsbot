const fs = require('fs-extra');
const path = require('path');
const { EventEmitter } = require('events');
const config = require('../config/enhanced-config.js');
const Logger = require('../logging/enhanced-logger.js');

class PluginManager extends EventEmitter {
    constructor(client, database, synthiaAI) {
        super();
        this.client = client;
        this.database = database;
        this.synthiaAI = synthiaAI;
        this.logger = new Logger('PluginManager');
        this.initialized = false;
        
        this.plugins = new Map();
        this.pluginConfigs = new Map();
        this.pluginDependencies = new Map();
        this.enabledPlugins = new Set();
        this.loadedPlugins = new Set();
        
        this.pluginDirectory = config.plugins.directory || './plugins';
        this.autoLoad = config.plugins.autoLoad || true;
        this.hotReload = config.plugins.hotReload || true;
        this.maxPlugins = config.plugins.maxPlugins || 50;
        
        this.stats = {
            pluginsLoaded: 0,
            pluginsEnabled: 0,
            pluginsDisabled: 0,
            pluginErrors: 0,
            hotReloads: 0
        };
        
        this.pluginSchema = {
            required: ['name', 'version', 'main'],
            optional: ['description', 'author', 'dependencies', 'permissions', 'config']
        };
        
        this.systemHooks = {
            'message': new Set(),
            'command': new Set(),
            'memberJoin': new Set(),
            'memberLeave': new Set(),
            'ready': new Set(),
            'error': new Set()
        };
    }

    async initialize() {
        try {
            this.logger.info('Initializing Plugin Manager...');
            
            // Ensure plugin directory exists
            await fs.ensureDir(this.pluginDirectory);
            
            // Load plugin configurations
            await this.loadPluginConfigs();
            
            // Setup file watchers for hot reload
            if (this.hotReload) {
                this.setupFileWatchers();
            }
            
            // Load default plugins if auto-load is enabled
            if (this.autoLoad) {
                await this.loadDefaultPlugins();
            }
            
            this.initialized = true;
            this.logger.info('Plugin Manager initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize Plugin Manager:', error);
            throw error;
        }
    }

    async loadDefaultPlugins() {
        try {
            const defaultPlugins = config.plugins.defaultEnabled || [];
            
            for (const pluginName of defaultPlugins) {
                try {
                    await this.loadPlugin(pluginName);
                    await this.enablePlugin(pluginName);
                } catch (error) {
                    this.logger.error(`Failed to load default plugin ${pluginName}:`, error);
                }
            }
            
            this.logger.info(`Loaded ${defaultPlugins.length} default plugins`);
            
        } catch (error) {
            this.logger.error('Failed to load default plugins:', error);
        }
    }

    async loadCustomPlugins() {
        try {
            const pluginDirs = await fs.readdir(this.pluginDirectory);
            
            for (const dir of pluginDirs) {
                const pluginPath = path.join(this.pluginDirectory, dir);
                const stat = await fs.stat(pluginPath);
                
                if (stat.isDirectory()) {
                    try {
                        await this.loadPlugin(dir);
                    } catch (error) {
                        this.logger.error(`Failed to load custom plugin ${dir}:`, error);
                    }
                }
            }
            
            this.logger.info(`Scanned ${pluginDirs.length} custom plugin directories`);
            
        } catch (error) {
            this.logger.error('Failed to load custom plugins:', error);
        }
    }

    async loadPlugin(pluginName) {
        try {
            if (this.plugins.has(pluginName)) {
                throw new Error(`Plugin ${pluginName} is already loaded`);
            }
            
            if (this.loadedPlugins.size >= this.maxPlugins) {
                throw new Error(`Maximum number of plugins (${this.maxPlugins}) reached`);
            }
            
            const pluginPath = path.join(this.pluginDirectory, pluginName);
            const manifestPath = path.join(pluginPath, 'manifest.json');
            
            // Load plugin manifest
            if (!await fs.pathExists(manifestPath)) {
                throw new Error(`Plugin manifest not found: ${manifestPath}`);
            }
            
            const manifest = await fs.readJson(manifestPath);
            
            // Validate manifest
            this.validateManifest(manifest);
            
            // Check dependencies
            await this.checkDependencies(manifest);
            
            // Load the main plugin file
            const mainPath = path.join(pluginPath, manifest.main);
            if (!await fs.pathExists(mainPath)) {
                throw new Error(`Plugin main file not found: ${mainPath}`);
            }
            
            // Clear require cache for hot reload
            delete require.cache[require.resolve(mainPath)];
            
            const PluginClass = require(mainPath);
            
            // Create plugin instance
            const plugin = new PluginClass({
                client: this.client,
                database: this.database,
                synthiaAI: this.synthiaAI,
                config: manifest.config || {},
                logger: new Logger(`Plugin:${pluginName}`)
            });
            
            // Initialize plugin
            if (typeof plugin.initialize === 'function') {
                await plugin.initialize();
            }
            
            // Store plugin
            this.plugins.set(pluginName, {
                instance: plugin,
                manifest: manifest,
                path: pluginPath,
                loadedAt: new Date(),
                enabled: false
            });
            
            this.loadedPlugins.add(pluginName);
            this.stats.pluginsLoaded++;
            
            this.logger.info(`Plugin loaded: ${pluginName} v${manifest.version}`);
            this.emit('pluginLoaded', pluginName, manifest);
            
            return plugin;
            
        } catch (error) {
            this.stats.pluginErrors++;
            this.logger.error(`Failed to load plugin ${pluginName}:`, error);
            throw error;
        }
    }

    async unloadPlugin(pluginName) {
        try {
            const pluginData = this.plugins.get(pluginName);
            if (!pluginData) {
                throw new Error(`Plugin ${pluginName} is not loaded`);
            }
            
            // Disable plugin first
            if (this.enabledPlugins.has(pluginName)) {
                await this.disablePlugin(pluginName);
            }
            
            // Call cleanup if available
            if (typeof pluginData.instance.cleanup === 'function') {
                await pluginData.instance.cleanup();
            }
            
            // Remove from system hooks
            this.removePluginFromHooks(pluginName);
            
            // Clear require cache
            const mainPath = path.join(pluginData.path, pluginData.manifest.main);
            delete require.cache[require.resolve(mainPath)];
            
            // Remove from collections
            this.plugins.delete(pluginName);
            this.loadedPlugins.delete(pluginName);
            this.enabledPlugins.delete(pluginName);
            
            this.logger.info(`Plugin unloaded: ${pluginName}`);
            this.emit('pluginUnloaded', pluginName);
            
        } catch (error) {
            this.logger.error(`Failed to unload plugin ${pluginName}:`, error);
            throw error;
        }
    }

    async enablePlugin(pluginName) {
        try {
            const pluginData = this.plugins.get(pluginName);
            if (!pluginData) {
                throw new Error(`Plugin ${pluginName} is not loaded`);
            }
            
            if (this.enabledPlugins.has(pluginName)) {
                throw new Error(`Plugin ${pluginName} is already enabled`);
            }
            
            // Call enable hook if available
            if (typeof pluginData.instance.enable === 'function') {
                await pluginData.instance.enable();
            }
            
            // Register plugin hooks
            this.registerPluginHooks(pluginName, pluginData.instance);
            
            // Mark as enabled
            this.enabledPlugins.add(pluginName);
            pluginData.enabled = true;
            pluginData.enabledAt = new Date();
            
            this.stats.pluginsEnabled++;
            
            this.logger.info(`Plugin enabled: ${pluginName}`);
            this.emit('pluginEnabled', pluginName);
            
        } catch (error) {
            this.logger.error(`Failed to enable plugin ${pluginName}:`, error);
            throw error;
        }
    }

    async disablePlugin(pluginName) {
        try {
            const pluginData = this.plugins.get(pluginName);
            if (!pluginData) {
                throw new Error(`Plugin ${pluginName} is not loaded`);
            }
            
            if (!this.enabledPlugins.has(pluginName)) {
                throw new Error(`Plugin ${pluginName} is not enabled`);
            }
            
            // Call disable hook if available
            if (typeof pluginData.instance.disable === 'function') {
                await pluginData.instance.disable();
            }
            
            // Remove plugin hooks
            this.removePluginFromHooks(pluginName);
            
            // Mark as disabled
            this.enabledPlugins.delete(pluginName);
            pluginData.enabled = false;
            pluginData.disabledAt = new Date();
            
            this.stats.pluginsDisabled++;
            
            this.logger.info(`Plugin disabled: ${pluginName}`);
            this.emit('pluginDisabled', pluginName);
            
        } catch (error) {
            this.logger.error(`Failed to disable plugin ${pluginName}:`, error);
            throw error;
        }
    }

    async reloadPlugin(pluginName) {
        try {
            this.logger.info(`Reloading plugin: ${pluginName}`);
            
            const wasEnabled = this.enabledPlugins.has(pluginName);
            
            // Unload the plugin
            await this.unloadPlugin(pluginName);
            
            // Load it again
            await this.loadPlugin(pluginName);
            
            // Enable it if it was enabled before
            if (wasEnabled) {
                await this.enablePlugin(pluginName);
            }
            
            this.stats.hotReloads++;
            
            this.logger.info(`Plugin reloaded: ${pluginName}`);
            this.emit('pluginReloaded', pluginName);
            
        } catch (error) {
            this.logger.error(`Failed to reload plugin ${pluginName}:`, error);
            throw error;
        }
    }

    validateManifest(manifest) {
        // Check required fields
        for (const field of this.pluginSchema.required) {
            if (!manifest[field]) {
                throw new Error(`Missing required field in manifest: ${field}`);
            }
        }
        
        // Validate version format
        if (!/^\d+\.\d+\.\d+/.test(manifest.version)) {
            throw new Error(`Invalid version format: ${manifest.version}`);
        }
        
        // Validate name format
        if (!/^[a-z0-9-_]+$/i.test(manifest.name)) {
            throw new Error(`Invalid plugin name format: ${manifest.name}`);
        }
        
        // Check for reserved names
        const reservedNames = ['system', 'core', 'admin', 'bot'];
        if (reservedNames.includes(manifest.name.toLowerCase())) {
            throw new Error(`Plugin name is reserved: ${manifest.name}`);
        }
    }

    async checkDependencies(manifest) {
        if (!manifest.dependencies) return;
        
        for (const [depName, depVersion] of Object.entries(manifest.dependencies)) {
            if (!this.loadedPlugins.has(depName)) {
                throw new Error(`Missing dependency: ${depName}`);
            }
            
            const depPlugin = this.plugins.get(depName);
            if (!this.isVersionCompatible(depPlugin.manifest.version, depVersion)) {
                throw new Error(`Incompatible dependency version: ${depName} requires ${depVersion}, got ${depPlugin.manifest.version}`);
            }
        }
    }

    isVersionCompatible(actual, required) {
        // Simple version compatibility check
        const actualParts = actual.split('.').map(Number);
        const requiredParts = required.replace(/[^0-9.]/g, '').split('.').map(Number);
        
        // Major version must match
        if (actualParts[0] !== requiredParts[0]) {
            return false;
        }
        
        // Minor version must be >= required
        if (actualParts[1] < requiredParts[1]) {
            return false;
        }
        
        // Patch version must be >= required if minor versions match
        if (actualParts[1] === requiredParts[1] && actualParts[2] < requiredParts[2]) {
            return false;
        }
        
        return true;
    }

    registerPluginHooks(pluginName, plugin) {
        // Register message hook
        if (typeof plugin.onMessage === 'function') {
            this.systemHooks.message.add({ pluginName, handler: plugin.onMessage.bind(plugin) });
        }
        
        // Register command hook
        if (typeof plugin.onCommand === 'function') {
            this.systemHooks.command.add({ pluginName, handler: plugin.onCommand.bind(plugin) });
        }
        
        // Register member join hook
        if (typeof plugin.onMemberJoin === 'function') {
            this.systemHooks.memberJoin.add({ pluginName, handler: plugin.onMemberJoin.bind(plugin) });
        }
        
        // Register member leave hook
        if (typeof plugin.onMemberLeave === 'function') {
            this.systemHooks.memberLeave.add({ pluginName, handler: plugin.onMemberLeave.bind(plugin) });
        }
        
        // Register ready hook
        if (typeof plugin.onReady === 'function') {
            this.systemHooks.ready.add({ pluginName, handler: plugin.onReady.bind(plugin) });
        }
        
        // Register error hook
        if (typeof plugin.onError === 'function') {
            this.systemHooks.error.add({ pluginName, handler: plugin.onError.bind(plugin) });
        }
    }

    removePluginFromHooks(pluginName) {
        for (const [hookName, hooks] of Object.entries(this.systemHooks)) {
            for (const hook of hooks) {
                if (hook.pluginName === pluginName) {
                    hooks.delete(hook);
                }
            }
        }
    }

    async processMessage(message, analysis) {
        try {
            for (const hook of this.systemHooks.message) {
                try {
                    await hook.handler(message, analysis);
                } catch (error) {
                    this.logger.error(`Plugin ${hook.pluginName} message handler error:`, error);
                }
            }
        } catch (error) {
            this.logger.error('Error processing message hooks:', error);
        }
    }

    async processCommand(interaction) {
        try {
            for (const hook of this.systemHooks.command) {
                try {
                    await hook.handler(interaction);
                } catch (error) {
                    this.logger.error(`Plugin ${hook.pluginName} command handler error:`, error);
                }
            }
        } catch (error) {
            this.logger.error('Error processing command hooks:', error);
        }
    }

    async processMemberJoin(member) {
        try {
            for (const hook of this.systemHooks.memberJoin) {
                try {
                    await hook.handler(member);
                } catch (error) {
                    this.logger.error(`Plugin ${hook.pluginName} member join handler error:`, error);
                }
            }
        } catch (error) {
            this.logger.error('Error processing member join hooks:', error);
        }
    }

    async processMemberLeave(member) {
        try {
            for (const hook of this.systemHooks.memberLeave) {
                try {
                    await hook.handler(member);
                } catch (error) {
                    this.logger.error(`Plugin ${hook.pluginName} member leave handler error:`, error);
                }
            }
        } catch (error) {
            this.logger.error('Error processing member leave hooks:', error);
        }
    }

    setupFileWatchers() {
        if (!this.hotReload) return;
        
        try {
            const chokidar = require('chokidar');
            
            const watcher = chokidar.watch(this.pluginDirectory, {
                ignored: /node_modules|\.git/,
                persistent: true,
                ignoreInitial: true
            });
            
            watcher.on('change', async (filePath) => {
                const pluginName = path.basename(path.dirname(filePath));
                
                if (this.enabledPlugins.has(pluginName)) {
                    this.logger.info(`File changed in plugin ${pluginName}, reloading...`);
                    
                    try {
                        await this.reloadPlugin(pluginName);
                    } catch (error) {
                        this.logger.error(`Hot reload failed for plugin ${pluginName}:`, error);
                    }
                }
            });
            
            this.logger.info('Plugin file watchers initialized for hot reload');
            
        } catch (error) {
            this.logger.warn('Could not setup file watchers (chokidar not available):', error);
        }
    }

    async loadPluginConfigs() {
        try {
            const configPath = path.join(this.pluginDirectory, 'configs');
            
            if (await fs.pathExists(configPath)) {
                const configFiles = await fs.readdir(configPath);
                
                for (const file of configFiles) {
                    if (file.endsWith('.json')) {
                        const pluginName = path.basename(file, '.json');
                        const configFilePath = path.join(configPath, file);
                        const config = await fs.readJson(configFilePath);
                        
                        this.pluginConfigs.set(pluginName, config);
                    }
                }
                
                this.logger.info(`Loaded configs for ${this.pluginConfigs.size} plugins`);
            }
            
        } catch (error) {
            this.logger.error('Failed to load plugin configs:', error);
        }
    }

    async savePluginConfig(pluginName, config) {
        try {
            const configPath = path.join(this.pluginDirectory, 'configs');
            await fs.ensureDir(configPath);
            
            const configFilePath = path.join(configPath, `${pluginName}.json`);
            await fs.writeJson(configFilePath, config, { spaces: 2 });
            
            this.pluginConfigs.set(pluginName, config);
            
        } catch (error) {
            this.logger.error(`Failed to save plugin config for ${pluginName}:`, error);
            throw error;
        }
    }

    getPluginConfig(pluginName) {
        return this.pluginConfigs.get(pluginName) || {};
    }

    async checkForUpdates() {
        try {
            // This would implement plugin update checking
            // For now, it's a placeholder
            this.logger.debug('Checking for plugin updates...');
            
        } catch (error) {
            this.logger.error('Failed to check for plugin updates:', error);
        }
    }

    getPluginInfo(pluginName) {
        const pluginData = this.plugins.get(pluginName);
        if (!pluginData) return null;
        
        return {
            name: pluginName,
            version: pluginData.manifest.version,
            description: pluginData.manifest.description,
            author: pluginData.manifest.author,
            enabled: pluginData.enabled,
            loadedAt: pluginData.loadedAt,
            enabledAt: pluginData.enabledAt,
            disabledAt: pluginData.disabledAt
        };
    }

    getAllPlugins() {
        const plugins = [];
        
        for (const [name, data] of this.plugins) {
            plugins.push({
                name,
                ...data.manifest,
                enabled: data.enabled,
                loadedAt: data.loadedAt
            });
        }
        
        return plugins;
    }

    getEnabledPlugins() {
        return Array.from(this.enabledPlugins);
    }

    getStats() {
        return {
            ...this.stats,
            totalPlugins: this.plugins.size,
            enabledPlugins: this.enabledPlugins.size,
            loadedPlugins: this.loadedPlugins.size,
            hooks: Object.fromEntries(
                Object.entries(this.systemHooks).map(([name, hooks]) => [name, hooks.size])
            ),
            initialized: this.initialized
        };
    }

    isInitialized() {
        return this.initialized;
    }
}

module.exports = PluginManager;