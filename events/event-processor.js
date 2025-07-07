const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const config = require('../config/enhanced-config.js');
const Logger = require('../logging/enhanced-logger.js');

class EventProcessor {
    constructor(client, database, analytics) {
        this.client = client;
        this.database = database;
        this.analytics = analytics;
        this.logger = new Logger('EventProcessor');
        this.initialized = false;
        
        this.eventHandlers = new Map();
        this.eventQueue = [];
        this.processingQueue = false;
        
        this.stats = {
            eventsProcessed: 0,
            messageEvents: 0,
            memberEvents: 0,
            guildEvents: 0,
            voiceEvents: 0,
            roleEvents: 0,
            channelEvents: 0,
            errors: 0
        };
        
        this.rateLimits = new Map();
        this.maxEventsPerSecond = 100;
        this.queueMaxSize = 1000;
        
        this.registerEventHandlers();
    }

    async initialize() {
        try {
            this.logger.info('Initializing Event Processor...');
            
            // Setup Discord event listeners
            this.setupDiscordEventListeners();
            
            // Start event queue processor
            this.startEventQueueProcessor();
            
            // Setup cleanup processes
            this.setupCleanupProcesses();
            
            this.initialized = true;
            this.logger.info('Event Processor initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize Event Processor:', error);
            throw error;
        }
    }

    registerEventHandlers() {
        // Message Events
        this.eventHandlers.set('messageCreate', this.handleMessageCreate.bind(this));
        this.eventHandlers.set('messageUpdate', this.handleMessageUpdate.bind(this));
        this.eventHandlers.set('messageDelete', this.handleMessageDelete.bind(this));
        this.eventHandlers.set('messageDeleteBulk', this.handleMessageDeleteBulk.bind(this));
        
        // Member Events
        this.eventHandlers.set('guildMemberAdd', this.handleGuildMemberAdd.bind(this));
        this.eventHandlers.set('guildMemberRemove', this.handleGuildMemberRemove.bind(this));
        this.eventHandlers.set('guildMemberUpdate', this.handleGuildMemberUpdate.bind(this));
        this.eventHandlers.set('userUpdate', this.handleUserUpdate.bind(this));
        
        // Guild Events
        this.eventHandlers.set('guildCreate', this.handleGuildCreate.bind(this));
        this.eventHandlers.set('guildDelete', this.handleGuildDelete.bind(this));
        this.eventHandlers.set('guildUpdate', this.handleGuildUpdate.bind(this));
        this.eventHandlers.set('guildUnavailable', this.handleGuildUnavailable.bind(this));
        this.eventHandlers.set('guildAvailable', this.handleGuildAvailable.bind(this));
        
        // Voice Events
        this.eventHandlers.set('voiceStateUpdate', this.handleVoiceStateUpdate.bind(this));
        
        // Role Events
        this.eventHandlers.set('roleCreate', this.handleRoleCreate.bind(this));
        this.eventHandlers.set('roleDelete', this.handleRoleDelete.bind(this));
        this.eventHandlers.set('roleUpdate', this.handleRoleUpdate.bind(this));
        
        // Channel Events
        this.eventHandlers.set('channelCreate', this.handleChannelCreate.bind(this));
        this.eventHandlers.set('channelDelete', this.handleChannelDelete.bind(this));
        this.eventHandlers.set('channelUpdate', this.handleChannelUpdate.bind(this));
        
        // Reaction Events
        this.eventHandlers.set('messageReactionAdd', this.handleMessageReactionAdd.bind(this));
        this.eventHandlers.set('messageReactionRemove', this.handleMessageReactionRemove.bind(this));
        
        // Interaction Events
        this.eventHandlers.set('interactionCreate', this.handleInteractionCreate.bind(this));
        
        // Ban Events
        this.eventHandlers.set('guildBanAdd', this.handleGuildBanAdd.bind(this));
        this.eventHandlers.set('guildBanRemove', this.handleGuildBanRemove.bind(this));
        
        // Invite Events
        this.eventHandlers.set('inviteCreate', this.handleInviteCreate.bind(this));
        this.eventHandlers.set('inviteDelete', this.handleInviteDelete.bind(this));
        
        // Thread Events
        this.eventHandlers.set('threadCreate', this.handleThreadCreate.bind(this));
        this.eventHandlers.set('threadDelete', this.handleThreadDelete.bind(this));
        this.eventHandlers.set('threadUpdate', this.handleThreadUpdate.bind(this));
        
        this.logger.info(`Registered ${this.eventHandlers.size} event handlers`);
    }

    setupDiscordEventListeners() {
        for (const [eventName, handler] of this.eventHandlers) {
            this.client.on(eventName, (...args) => {
                this.queueEvent(eventName, args);
            });
        }
        
        // Error handling
        this.client.on('error', (error) => {
            this.logger.error('Discord client error:', error);
            this.stats.errors++;
        });
        
        this.client.on('warn', (warning) => {
            this.logger.warn('Discord client warning:', warning);
        });
        
        this.client.on('debug', (info) => {
            this.logger.debug('Discord client debug:', info);
        });
    }

    queueEvent(eventName, args) {
        if (this.eventQueue.length >= this.queueMaxSize) {
            this.logger.warn('Event queue is full, dropping oldest events');
            this.eventQueue.shift();
        }
        
        this.eventQueue.push({
            eventName,
            args,
            timestamp: Date.now()
        });
    }

    startEventQueueProcessor() {
        setInterval(async () => {
            if (this.processingQueue || this.eventQueue.length === 0) return;
            
            this.processingQueue = true;
            
            try {
                const batchSize = Math.min(this.maxEventsPerSecond, this.eventQueue.length);
                const eventBatch = this.eventQueue.splice(0, batchSize);
                
                await Promise.allSettled(
                    eventBatch.map(event => this.processEvent(event))
                );
                
            } catch (error) {
                this.logger.error('Event queue processing error:', error);
            } finally {
                this.processingQueue = false;
            }
        }, 1000); // Process every second
    }

    async processEvent(event) {
        try {
            const { eventName, args, timestamp } = event;
            const handler = this.eventHandlers.get(eventName);
            
            if (!handler) {
                this.logger.debug(`No handler for event: ${eventName}`);
                return;
            }
            
            // Check rate limiting
            if (this.isRateLimited(eventName)) {
                this.logger.debug(`Rate limited event: ${eventName}`);
                return;
            }
            
            // Process the event
            await handler(...args);
            
            this.stats.eventsProcessed++;
            this.updateEventStats(eventName);
            
        } catch (error) {
            this.logger.error(`Error processing event ${event.eventName}:`, error);
            this.stats.errors++;
        }
    }

    isRateLimited(eventName) {
        const now = Date.now();
        const rateLimit = this.rateLimits.get(eventName) || { count: 0, resetTime: now + 1000 };
        
        if (now > rateLimit.resetTime) {
            rateLimit.count = 0;
            rateLimit.resetTime = now + 1000;
        }
        
        rateLimit.count++;
        this.rateLimits.set(eventName, rateLimit);
        
        return rateLimit.count > 50; // Max 50 events per second per type
    }

    updateEventStats(eventName) {
        if (eventName.includes('message')) {
            this.stats.messageEvents++;
        } else if (eventName.includes('Member') || eventName.includes('user')) {
            this.stats.memberEvents++;
        } else if (eventName.includes('guild') || eventName.includes('Guild')) {
            this.stats.guildEvents++;
        } else if (eventName.includes('voice') || eventName.includes('Voice')) {
            this.stats.voiceEvents++;
        } else if (eventName.includes('role') || eventName.includes('Role')) {
            this.stats.roleEvents++;
        } else if (eventName.includes('channel') || eventName.includes('Channel')) {
            this.stats.channelEvents++;
        }
    }

    // Message Event Handlers
    async handleMessageCreate(message) {
        if (message.author.bot) return;
        
        try {
            // Store message in database
            await this.database.models.Message.create({
                id: message.id,
                guildId: message.guild?.id,
                channelId: message.channel.id,
                userId: message.author.id,
                content: message.content,
                attachments: message.attachments.map(a => ({
                    id: a.id,
                    name: a.name,
                    url: a.url,
                    size: a.size
                })),
                reactions: []
            });
            
            // Track analytics
            if (this.analytics) {
                await this.analytics.trackMessageEvent(message, {});
            }
            
            // Log to appropriate channels
            await this.logEvent(message.guild?.id, 'messageCreate', {
                user: message.author.tag,
                channel: message.channel.name,
                content: message.content.substring(0, 100)
            });
            
        } catch (error) {
            this.logger.error('Failed to handle messageCreate:', error);
        }
    }

    async handleMessageUpdate(oldMessage, newMessage) {
        if (newMessage.author?.bot) return;
        
        try {
            // Update message in database
            await this.database.models.Message.update(
                { content: newMessage.content },
                { where: { id: newMessage.id } }
            );
            
            // Log message edit
            await this.logEvent(newMessage.guild?.id, 'messageUpdate', {
                user: newMessage.author.tag,
                channel: newMessage.channel.name,
                oldContent: oldMessage.content?.substring(0, 100),
                newContent: newMessage.content.substring(0, 100)
            });
            
        } catch (error) {
            this.logger.error('Failed to handle messageUpdate:', error);
        }
    }

    async handleMessageDelete(message) {
        try {
            // Mark message as deleted in database
            await this.database.models.Message.update(
                { isDeleted: true, deletedAt: new Date() },
                { where: { id: message.id } }
            );
            
            // Log message deletion
            await this.logEvent(message.guild?.id, 'messageDelete', {
                user: message.author?.tag || 'Unknown',
                channel: message.channel.name,
                content: message.content?.substring(0, 100) || 'Unknown content'
            });
            
        } catch (error) {
            this.logger.error('Failed to handle messageDelete:', error);
        }
    }

    async handleMessageDeleteBulk(messages) {
        try {
            const messageIds = messages.map(m => m.id);
            
            // Mark messages as deleted in database
            await this.database.models.Message.update(
                { isDeleted: true, deletedAt: new Date() },
                { where: { id: messageIds } }
            );
            
            // Log bulk deletion
            const firstMessage = messages.first();
            await this.logEvent(firstMessage.guild?.id, 'messageDeleteBulk', {
                count: messages.size,
                channel: firstMessage.channel.name
            });
            
        } catch (error) {
            this.logger.error('Failed to handle messageDeleteBulk:', error);
        }
    }

    // Member Event Handlers
    async handleGuildMemberAdd(member) {
        try {
            // Track analytics
            if (this.analytics) {
                await this.analytics.trackMemberJoin(member);
            }
            
            // Update guild member count
            await this.database.models.Guild.increment('memberCount', {
                where: { id: member.guild.id }
            });
            
            // Log member join
            await this.logEvent(member.guild.id, 'guildMemberAdd', {
                user: member.user.tag,
                userId: member.user.id,
                accountAge: Date.now() - member.user.createdAt.getTime()
            });
            
            // Send welcome message if enabled
            await this.handleWelcomeMessage(member);
            
        } catch (error) {
            this.logger.error('Failed to handle guildMemberAdd:', error);
        }
    }

    async handleGuildMemberRemove(member) {
        try {
            // Track analytics
            if (this.analytics) {
                await this.analytics.trackMemberLeave(member);
            }
            
            // Update guild member count
            await this.database.models.Guild.decrement('memberCount', {
                where: { id: member.guild.id }
            });
            
            // Log member leave
            await this.logEvent(member.guild.id, 'guildMemberRemove', {
                user: member.user.tag,
                userId: member.user.id,
                timeInServer: member.joinedAt ? Date.now() - member.joinedAt.getTime() : null
            });
            
            // Send leave message if enabled
            await this.handleLeaveMessage(member);
            
        } catch (error) {
            this.logger.error('Failed to handle guildMemberRemove:', error);
        }
    }

    async handleGuildMemberUpdate(oldMember, newMember) {
        try {
            const changes = this.getMemberChanges(oldMember, newMember);
            
            if (changes.length > 0) {
                await this.logEvent(newMember.guild.id, 'guildMemberUpdate', {
                    user: newMember.user.tag,
                    changes
                });
            }
            
        } catch (error) {
            this.logger.error('Failed to handle guildMemberUpdate:', error);
        }
    }

    // Voice Event Handlers
    async handleVoiceStateUpdate(oldState, newState) {
        try {
            // Track analytics
            if (this.analytics) {
                await this.analytics.trackVoiceActivity(oldState, newState);
            }
            
            // Determine voice action
            let action = 'unknown';
            if (!oldState.channelId && newState.channelId) {
                action = 'join';
            } else if (oldState.channelId && !newState.channelId) {
                action = 'leave';
            } else if (oldState.channelId !== newState.channelId) {
                action = 'move';
            } else {
                action = 'update';
            }
            
            // Log voice activity
            await this.logEvent(newState.guild?.id, 'voiceStateUpdate', {
                user: newState.member?.user?.tag || 'Unknown',
                action,
                oldChannel: oldState.channel?.name,
                newChannel: newState.channel?.name
            });
            
        } catch (error) {
            this.logger.error('Failed to handle voiceStateUpdate:', error);
        }
    }

    // Guild Event Handlers
    async handleGuildCreate(guild) {
        try {
            this.logger.info(`Bot added to guild: ${guild.name} (${guild.id})`);
            
            // Track analytics
            if (this.analytics) {
                await this.analytics.trackGuildJoin(guild);
            }
            
        } catch (error) {
            this.logger.error('Failed to handle guildCreate:', error);
        }
    }

    async handleGuildDelete(guild) {
        try {
            this.logger.info(`Bot removed from guild: ${guild.name} (${guild.id})`);
            
            // Track analytics
            if (this.analytics) {
                await this.analytics.trackGuildLeave(guild);
            }
            
        } catch (error) {
            this.logger.error('Failed to handle guildDelete:', error);
        }
    }

    async handleGuildUpdate(oldGuild, newGuild) {
        try {
            const changes = this.getGuildChanges(oldGuild, newGuild);
            
            if (changes.length > 0) {
                await this.logEvent(newGuild.id, 'guildUpdate', {
                    guild: newGuild.name,
                    changes
                });
            }
            
        } catch (error) {
            this.logger.error('Failed to handle guildUpdate:', error);
        }
    }

    // Role Event Handlers
    async handleRoleCreate(role) {
        try {
            await this.logEvent(role.guild.id, 'roleCreate', {
                role: role.name,
                permissions: role.permissions.toArray()
            });
        } catch (error) {
            this.logger.error('Failed to handle roleCreate:', error);
        }
    }

    async handleRoleDelete(role) {
        try {
            await this.logEvent(role.guild.id, 'roleDelete', {
                role: role.name
            });
        } catch (error) {
            this.logger.error('Failed to handle roleDelete:', error);
        }
    }

    // Channel Event Handlers
    async handleChannelCreate(channel) {
        try {
            if (channel.guild) {
                await this.logEvent(channel.guild.id, 'channelCreate', {
                    channel: channel.name,
                    type: channel.type
                });
            }
        } catch (error) {
            this.logger.error('Failed to handle channelCreate:', error);
        }
    }

    async handleChannelDelete(channel) {
        try {
            if (channel.guild) {
                await this.logEvent(channel.guild.id, 'channelDelete', {
                    channel: channel.name,
                    type: channel.type
                });
            }
        } catch (error) {
            this.logger.error('Failed to handle channelDelete:', error);
        }
    }

    // Interaction Event Handlers
    async handleInteractionCreate(interaction) {
        try {
            if (interaction.isCommand()) {
                // Track command usage
                if (this.analytics) {
                    await this.analytics.trackCommandUsage(
                        interaction.user.id,
                        interaction.guild?.id,
                        interaction.commandName,
                        true
                    );
                }
            }
        } catch (error) {
            this.logger.error('Failed to handle interactionCreate:', error);
        }
    }

    // Ban Event Handlers
    async handleGuildBanAdd(ban) {
        try {
            await this.logEvent(ban.guild.id, 'guildBanAdd', {
                user: ban.user.tag,
                reason: ban.reason || 'No reason provided'
            });
        } catch (error) {
            this.logger.error('Failed to handle guildBanAdd:', error);
        }
    }

    async handleGuildBanRemove(ban) {
        try {
            await this.logEvent(ban.guild.id, 'guildBanRemove', {
                user: ban.user.tag
            });
        } catch (error) {
            this.logger.error('Failed to handle guildBanRemove:', error);
        }
    }

    // Reaction Event Handlers
    async handleMessageReactionAdd(reaction, user) {
        try {
            if (user.bot) return;
            
            // Update message reactions in database
            await this.updateMessageReactions(reaction.message.id, 'add', {
                emoji: reaction.emoji.name,
                userId: user.id
            });
            
        } catch (error) {
            this.logger.error('Failed to handle messageReactionAdd:', error);
        }
    }

    async handleMessageReactionRemove(reaction, user) {
        try {
            if (user.bot) return;
            
            // Update message reactions in database
            await this.updateMessageReactions(reaction.message.id, 'remove', {
                emoji: reaction.emoji.name,
                userId: user.id
            });
            
        } catch (error) {
            this.logger.error('Failed to handle messageReactionRemove:', error);
        }
    }

    // Utility methods
    async handleWelcomeMessage(member) {
        try {
            // Implementation would depend on server settings
            // This is a placeholder for welcome message functionality
        } catch (error) {
            this.logger.error('Failed to send welcome message:', error);
        }
    }

    async handleLeaveMessage(member) {
        try {
            // Implementation would depend on server settings
            // This is a placeholder for leave message functionality
        } catch (error) {
            this.logger.error('Failed to send leave message:', error);
        }
    }

    getMemberChanges(oldMember, newMember) {
        const changes = [];
        
        if (oldMember.nickname !== newMember.nickname) {
            changes.push(`Nickname: ${oldMember.nickname || 'None'} → ${newMember.nickname || 'None'}`);
        }
        
        const oldRoles = oldMember.roles.cache.map(r => r.name).sort();
        const newRoles = newMember.roles.cache.map(r => r.name).sort();
        
        if (oldRoles.join(',') !== newRoles.join(',')) {
            changes.push(`Roles updated`);
        }
        
        return changes;
    }

    getGuildChanges(oldGuild, newGuild) {
        const changes = [];
        
        if (oldGuild.name !== newGuild.name) {
            changes.push(`Name: ${oldGuild.name} → ${newGuild.name}`);
        }
        
        if (oldGuild.ownerId !== newGuild.ownerId) {
            changes.push(`Owner changed`);
        }
        
        if (oldGuild.iconURL() !== newGuild.iconURL()) {
            changes.push(`Icon updated`);
        }
        
        return changes;
    }

    async updateMessageReactions(messageId, action, reactionData) {
        try {
            const message = await this.database.models.Message.findByPk(messageId);
            if (!message) return;
            
            let reactions = message.reactions || [];
            
            if (action === 'add') {
                reactions.push(reactionData);
            } else if (action === 'remove') {
                reactions = reactions.filter(r => 
                    !(r.emoji === reactionData.emoji && r.userId === reactionData.userId)
                );
            }
            
            await this.database.models.Message.update(
                { reactions },
                { where: { id: messageId } }
            );
            
        } catch (error) {
            this.logger.error('Failed to update message reactions:', error);
        }
    }

    async logEvent(guildId, eventType, data) {
        try {
            if (!guildId) return;
            
            // Store event in analytics
            if (this.analytics) {
                await this.analytics.trackCommandUsage(null, guildId, eventType, true);
            }
            
            // Log to appropriate logging channel
            // Implementation would depend on guild settings
            
        } catch (error) {
            this.logger.debug('Failed to log event:', error);
        }
    }

    setupCleanupProcesses() {
        // Clean up old events from queue
        setInterval(() => {
            const now = Date.now();
            const oldEvents = this.eventQueue.filter(event => 
                now - event.timestamp > 300000 // 5 minutes old
            );
            
            if (oldEvents.length > 0) {
                this.logger.warn(`Removing ${oldEvents.length} old events from queue`);
                this.eventQueue = this.eventQueue.filter(event => 
                    now - event.timestamp <= 300000
                );
            }
        }, 60000); // Check every minute
        
        // Clean up rate limits
        setInterval(() => {
            const now = Date.now();
            for (const [eventName, rateLimit] of this.rateLimits) {
                if (now > rateLimit.resetTime + 60000) { // 1 minute grace period
                    this.rateLimits.delete(eventName);
                }
            }
        }, 300000); // Check every 5 minutes
    }

    getStats() {
        return {
            ...this.stats,
            queueSize: this.eventQueue.length,
            handlersRegistered: this.eventHandlers.size,
            rateLimitsActive: this.rateLimits.size,
            initialized: this.initialized
        };
    }

    isInitialized() {
        return this.initialized;
    }
}

module.exports = EventProcessor;