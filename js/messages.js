// Messages management
class MessagesManager {
    constructor() {
        this.conversations = [];
        this.currentConversation = null;
        this.setupMessageEvents();
    }

    setupMessageEvents() {
        // Message events would be implemented here
    }

    async loadConversations() {
        if (!utils.isLoggedIn()) return;

        try {
            const data = await utils.apiCall('/messages/conversations');
            this.conversations = data;
            this.renderConversations();
            this.updateMessageBadge();
        } catch (error) {
            console.error('Failed to load conversations:', error);
        }
    }

    renderConversations() {
        // Implementation for rendering conversations
    }

    async startConversation(userId, productId = null) {
        if (!utils.isLoggedIn()) {
            utils.showToast('Info', 'Please login to send messages', 'info');
            utils.navigateToPage('auth');
            return;
        }

        utils.navigateToPage('messages');
        // Implementation for starting conversation
    }

    updateMessageBadge() {
        const unreadCount = this.conversations.reduce((total, conv) => 
            total + (conv.unreadCount || 0), 0
        );

        const badge = document.getElementById('messageBadge');
        if (badge) {
            badge.textContent = unreadCount > 0 ? unreadCount : '';
            badge.style.display = unreadCount > 0 ? 'block' : 'none';
        }
    }
}

// Initialize messages manager
const messages = new MessagesManager();
