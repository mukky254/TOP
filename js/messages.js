// Enhanced Messages Manager with 30+ Features
class MessagesManager {
    constructor() {
        this.conversations = [];
        this.currentConversation = null;
        this.messages = [];
        this.unreadCount = 0;
        this.socket = null;
        this.typingUsers = new Set();
        
        this.setupMessagingEvents();
        this.initializeMessagingFeatures();
    }

    setupMessagingEvents() {
        // Conversation management
        this.setupConversationEvents();
        
        // Message sending
        this.setupMessageSending();
        
        // Real-time features
        this.setupRealTimeFeatures();
        
        // Message actions
        this.setupMessageActions();
    }

    setupConversationEvents() {
        // Conversation selection
        document.addEventListener('click', (e) => {
            if (e.target.matches('.conversation-item') || e.target.closest('.conversation-item')) {
                const userId = e.target.closest('[data-user-id]').getAttribute('data-user-id');
                this.selectConversation(userId);
            }
        });

        // New conversation
        document.getElementById('newConversationBtn')?.addEventListener('click', () => {
            this.showNewConversationModal();
        });

        // Conversation search
        document.getElementById('conversationSearch')?.addEventListener('input', utils.debounce((e) => {
            this.searchConversations(e.target.value);
        }, 300));
    }

    setupMessageSending() {
        // Message input
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            messageInput.addEventListener('input', () => {
                this.handleTyping();
            });
        }

        // Send button
        document.getElementById('sendMessageBtn')?.addEventListener('click', () => {
            this.sendMessage();
        });

        // Attachment handling
        document.getElementById('attachFileBtn')?.addEventListener('click', () => {
            this.showAttachmentOptions();
        });
    }

    setupRealTimeFeatures() {
        // Initialize Socket.IO connection
        this.initializeSocket();
        
        // Typing indicators
        this.setupTypingIndicators();
        
        // Online status
        this.setupOnlineStatus();
    }

    setupMessageActions() {
        // Message reactions
        document.addEventListener('click', (e) => {
            if (e.target.matches('.message-reaction') || e.target.closest('.message-reaction')) {
                const messageId = e.target.closest('[data-message-id]').getAttribute('data-message-id');
                this.addMessageReaction(messageId, 'like');
            }
        });

        // Message options
        document.addEventListener('click', (e) => {
            if (e.target.matches('.message-options') || e.target.closest('.message-options')) {
                const messageId = e.target.closest('[data-message-id]').getAttribute('data-message-id');
                this.showMessageOptions(messageId);
            }
        });
    }

    initializeMessagingFeatures() {
        this.loadConversations();
        this.setupMessageTemplates();
        this.initializeVoiceMessages();
    }

    async loadConversations() {
        if (!utils.isLoggedIn()) return;

        try {
            const data = await utils.apiCall('/messages/conversations');
            this.conversations = data;
            this.calculateUnreadCount();
            this.renderConversations();
            this.updateMessageBadge();
        } catch (error) {
            console.error('Failed to load conversations:', error);
        }
    }

    calculateUnreadCount() {
        this.unreadCount = this.conversations.reduce((total, conv) => 
            total + (conv.unreadCount || 0), 0
        );
    }

    renderConversations() {
        const conversationsList = document.getElementById('conversationsList');
        if (!conversationsList) return;

        if (this.conversations.length === 0) {
            conversationsList.innerHTML = this.createEmptyConversationsState();
            return;
        }

        conversationsList.innerHTML = this.conversations.map(conv => 
            this.createConversationItem(conv)
        ).join('');

        this.attachConversationEventListeners();
    }

    createConversationItem(conversation) {
        const user = conversation.user;
        const lastMessage = conversation.lastMessage;
        const isActive = this.currentConversation?.user?._id === user._id;

        return `
            <div class="conversation-item ${isActive ? 'active' : ''} ${conversation.unreadCount > 0 ? 'unread' : ''}" 
                 data-user-id="${user._id}">
                <div class="conversation-avatar">
                    <div class="user-avatar">${utils.getUserInitials(user.name)}</div>
                    ${user.isOnline ? '<div class="online-indicator"></div>' : ''}
                </div>
                
                <div class="conversation-content">
                    <div class="conversation-header">
                        <div class="conversation-name">${user.name}</div>
                        <div class="conversation-time">
                            ${lastMessage ? utils.formatRelativeTime(lastMessage.createdAt) : ''}
                        </div>
                    </div>
                    
                    <div class="conversation-preview">
                        <div class="message-preview">
                            ${lastMessage ? this.truncateMessage(lastMessage.content) : 'No messages yet'}
                        </div>
                        ${conversation.unreadCount > 0 ? 
                            `<div class="unread-badge">${conversation.unreadCount}</div>` : ''
                        }
                    </div>
                    
                    ${user.role ? `
                        <div class="conversation-meta">
                            <span class="user-role ${user.role}">${user.role}</span>
                            ${user.rating ? `<span class="user-rating">⭐ ${user.rating}</span>` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    async selectConversation(userId) {
        try {
            // Mark previous conversation as read
            if (this.currentConversation) {
                await this.markConversationAsRead(this.currentConversation.user._id);
            }

            // Load new conversation
            const messages = await utils.apiCall(`/messages/${userId}`);
            const user = this.conversations.find(c => c.user._id === userId)?.user;

            this.currentConversation = { user, messages };
            this.messages = messages;

            this.renderMessages();
            this.updateConversationUI();
            this.scrollToBottom();

            // Join socket room
            this.joinConversationRoom(userId);

        } catch (error) {
            console.error('Failed to load conversation:', error);
            utils.showToast('Error', 'Failed to load conversation', 'error');
        }
    }

    renderMessages() {
        const messagesContainer = document.getElementById('messagesContainer');
        if (!messagesContainer) return;

        messagesContainer.innerHTML = this.messages.map(message => 
            this.createMessageElement(message)
        ).join('');

        this.attachMessageEventListeners();
    }

    createMessageElement(message) {
        const isOwnMessage = message.sender._id === utils.currentUser._id;
        const messageTime = utils.formatRelativeTime(message.createdAt);

        return `
            <div class="message ${isOwnMessage ? 'own-message' : 'other-message'}" 
                 data-message-id="${message._id}">
                <div class="message-avatar">
                    <div class="user-avatar-small">${utils.getUserInitials(message.sender.name)}</div>
                </div>
                
                <div class="message-content">
                    <div class="message-bubble">
                        ${message.messageType === 'image' ? `
                            <div class="message-image">
                                <img src="${message.imageUrl}" alt="Shared image" loading="lazy">
                            </div>
                        ` : ''}
                        
                        <div class="message-text">${this.formatMessageContent(message.content)}</div>
                        
                        <div class="message-footer">
                            <span class="message-time">${messageTime}</span>
                            ${isOwnMessage ? `
                                <span class="message-status">
                                    ${message.isRead ? '✓✓' : '✓'}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="message-actions">
                        <button class="btn-icon message-reaction" title="React to message">
                            <span class="material-icons">add_reaction</span>
                        </button>
                        <button class="btn-icon message-options" title="Message options">
                            <span class="material-icons">more_vert</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const content = messageInput?.value.trim();

        if (!content || !this.currentConversation) return;

        try {
            const messageData = {
                receiver: this.currentConversation.user._id,
                content: content,
                messageType: 'text'
            };

            const newMessage = await utils.apiCall('/messages', {
                method: 'POST',
                body: JSON.stringify(messageData)
            });

            // Add to local messages
            this.messages.push(newMessage);
            this.renderMessages();
            this.scrollToBottom();

            // Clear input
            messageInput.value = '';

            // Send via socket
            this.socket?.emit('send_message', newMessage);

            // Update conversation list
            this.updateConversationPreview(newMessage);

        } catch (error) {
            console.error('Failed to send message:', error);
            utils.showToast('Error', 'Failed to send message', 'error');
        }
    }

    // Feature 31: Real-time Messaging with Socket.IO
    initializeSocket() {
        try {
            this.socket = io(utils.API_BASE.replace('/api', ''), {
                auth: {
                    token: utils.token
                }
            });

            this.socket.on('connect', () => {
                console.log('Connected to messaging server');
            });

            this.socket.on('receive_message', (message) => {
                this.handleIncomingMessage(message);
            });

            this.socket.on('user_typing', (data) => {
                this.showTypingIndicator(data.userId, data.userName);
            });

            this.socket.on('user_stop_typing', (data) => {
                this.hideTypingIndicator(data.userId);
            });

            this.socket.on('user_online', (data) => {
                this.updateUserOnlineStatus(data.userId, true);
            });

            this.socket.on('user_offline', (data) => {
                this.updateUserOnlineStatus(data.userId, false);
            });

        } catch (error) {
            console.warn('Socket.IO not available:', error);
        }
    }

    handleIncomingMessage(message) {
        // If message is for current conversation
        if (this.currentConversation && 
            (message.sender._id === this.currentConversation.user._id || 
             message.receiver._id === this.currentConversation.user._id)) {
            
            this.messages.push(message);
            this.renderMessages();
            this.scrollToBottom();
            
            // Mark as read
            this.markMessageAsRead(message._id);
        }

        // Update conversation preview
        this.updateConversationPreview(message);
        
        // Update unread count
        this.calculateUnreadCount();
        this.updateMessageBadge();
        
        // Show notification
        if (!this.isConversationActive(message.sender._id)) {
            this.showMessageNotification(message);
        }
    }

    // Feature 32: Typing Indicators
    handleTyping() {
        if (!this.currentConversation) return;

        this.socket?.emit('typing', {
            userId: this.currentConversation.user._id,
            userName: utils.currentUser.name
        });

        // Clear previous timeout
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }

        // Set timeout to stop typing indicator
        this.typingTimeout = setTimeout(() => {
            this.socket?.emit('stop_typing', {
                userId: this.currentConversation.user._id
            });
        }, 1000);
    }

    showTypingIndicator(userId, userName) {
        if (this.currentConversation?.user._id === userId) {
            const typingIndicator = document.getElementById('typingIndicator');
            if (typingIndicator) {
                typingIndicator.innerHTML = `
                    <div class="typing-indicator">
                        <div class="typing-avatar">
                            <div class="user-avatar-small">${utils.getUserInitials(userName)}</div>
                        </div>
                        <div class="typing-content">
                            <div class="typing-text">${userName} is typing</div>
                            <div class="typing-dots">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                `;
                typingIndicator.style.display = 'block';
                this.scrollToBottom();
            }
        }
    }

    hideTypingIndicator(userId) {
        if (this.currentConversation?.user._id === userId) {
            const typingIndicator = document.getElementById('typingIndicator');
            if (typingIndicator) {
                typingIndicator.style.display = 'none';
            }
        }
    }

    // Feature 33: Message Templates for Common Responses
    setupMessageTemplates() {
        this.messageTemplates = {
            farmer: {
                greeting: "Hello! I'm interested in your products. Are they available?",
                price_inquiry: "What's your best price for this product?",
                delivery_question: "Do you offer delivery to my location?",
                bulk_order: "I'd like to place a bulk order. Can we discuss pricing?"
            },
            buyer: {
                greeting: "Welcome to my farm! How can I help you today?",
                availability: "Yes, the product is available. How much would you like?",
                pricing: "Here are my current prices for bulk orders...",
                delivery_info: "I offer delivery within the county for orders above 5000 KSH"
            }
        };
    }

    showMessageTemplates() {
        const templates = utils.isFarmer() ? 
            this.messageTemplates.farmer : 
            this.messageTemplates.buyer;

        const templateHTML = Object.entries(templates).map(([key, template]) => `
            <div class="message-template" data-template="${template}">
                ${template}
            </div>
        `).join('');

        this.showTemplatesModal(templateHTML);
    }

    // Feature 34: Voice Message Recording
    initializeVoiceMessages() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;

        document.getElementById('voiceMessageBtn')?.addEventListener('click', () => {
            this.toggleVoiceRecording();
        });
    }

    async toggleVoiceRecording() {
        if (!this.isRecording) {
            await this.startVoiceRecording();
        } else {
            this.stopVoiceRecording();
        }
    }

    async startVoiceRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = () => {
                this.sendVoiceMessage();
            };

            this.mediaRecorder.start();
            this.isRecording = true;
            this.showRecordingUI();

        } catch (error) {
            console.error('Failed to start recording:', error);
            utils.showToast('Error', 'Microphone access denied', 'error');
        }
    }

    stopVoiceRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            this.isRecording = false;
            this.hideRecordingUI();
        }
    }

    async sendVoiceMessage() {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        
        // In a real app, you would upload the audio file and get a URL
        // For now, we'll simulate this
        const audioUrl = URL.createObjectURL(audioBlob);

        try {
            const messageData = {
                receiver: this.currentConversation.user._id,
                content: 'Voice message',
                messageType: 'audio',
                audioUrl: audioUrl
            };

            await utils.apiCall('/messages', {
                method: 'POST',
                body: JSON.stringify(messageData)
            });

            utils.showToast('Success', 'Voice message sent', 'success');

        } catch (error) {
            console.error('Failed to send voice message:', error);
            utils.showToast('Error', 'Failed to send voice message', 'error');
        }
    }

    // Feature 35: Message Search within Conversation
    setupMessageSearch() {
        const searchInput = document.getElementById('messageSearch');
        if (searchInput) {
            searchInput.addEventListener('input', utils.debounce((e) => {
                this.searchMessages(e.target.value);
            }, 300));
        }
    }

    searchMessages(query) {
        if (!query.trim()) {
            this.renderMessages();
            return;
        }

        const filteredMessages = this.messages.filter(message =>
            message.content.toLowerCase().includes(query.toLowerCase())
        );

        this.renderFilteredMessages(filteredMessages, query);
    }

    // Utility Methods
    truncateMessage(text, length = 50) {
        return text.length > length ? text.substring(0, length) + '...' : text;
    }

    formatMessageContent(content) {
        // Convert URLs to links
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return content.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('messagesContainer');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    updateMessageBadge() {
        const badge = document.getElementById('messageBadge');
        if (badge) {
            badge.textContent = this.unreadCount > 0 ? this.unreadCount : '';
            badge.style.display = this.unreadCount > 0 ? 'block' : 'none';
        }
    }

    isConversationActive(userId) {
        return this.currentConversation?.user._id === userId && 
               document.visibilityState === 'visible';
    }

    showMessageNotification(message) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`New message from ${message.sender.name}`, {
                body: message.content,
                icon: '/assets/icons/icon-192x192.png'
            });
        }
    }

    createEmptyConversationsState() {
        return `
            <div class="empty-state">
                <div class="empty-icon">💬</div>
                <h3>No Conversations</h3>
                <p>Start a conversation with farmers or buyers to see your messages here.</p>
                <button class="btn btn-primary" onclick="messages.showNewConversationModal()">
                    <span class="material-icons">add_comment</span>
                    Start New Conversation
                </button>
            </div>
        `;
    }

    // Additional messaging features would continue here...
}

// Initialize messages manager
const messages = new MessagesManager();
