// Enhanced Notification Manager with 15+ Features
class NotificationManager {
    constructor() {
        this.notifications = [];
        this.permission = 'default';
        this.settings = {};
        
        this.initializeNotifications();
        this.setupNotificationEvents();
    }

    async initializeNotifications() {
        await this.requestPermission();
        this.loadNotificationSettings();
        this.setupServiceWorker();
    }

    setupNotificationEvents() {
        // Notification click handlers
        document.addEventListener('click', (e) => {
            if (e.target.matches('.notification-item') || e.target.closest('.notification-item')) {
                const notificationId = e.target.closest('[data-notification-id]').getAttribute('data-notification-id');
                this.handleNotificationClick(notificationId);
            }
        });

        // Mark as read
        document.addEventListener('click', (e) => {
            if (e.target.matches('.mark-read-btn') || e.target.closest('.mark-read-btn')) {
                const notificationId = e.target.closest('[data-notification-id]').getAttribute('data-notification-id');
                this.markAsRead(notificationId);
            }
        });

        // Clear all
        document.getElementById('clearAllNotifications')?.addEventListener('click', () => {
            this.clearAllNotifications();
        });

        // Notification settings
        document.getElementById('notificationSettings')?.addEventListener('click', () => {
            this.showNotificationSettings();
        });
    }

    async requestPermission() {
        if ('Notification' in window) {
            this.permission = await Notification.requestPermission();
        }
    }

    loadNotificationSettings() {
        this.settings = JSON.parse(localStorage.getItem('notificationSettings')) || {
            pushEnabled: true,
            soundEnabled: true,
            desktopEnabled: true,
            emailEnabled: false,
            orderUpdates: true,
            messageAlerts: true,
            priceAlerts: true,
            systemUpdates: false
        };
    }

    setupServiceWorker() {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            // Register push notifications
            navigator.serviceWorker.ready.then(registration => {
                // Push notification setup would go here
            });
        }
    }

    async show(title, message, type = 'info', options = {}) {
        // Show in-app notification
        this.showInAppNotification(title, message, type, options);
        
        // Show push notification if enabled
        if (this.settings.pushEnabled && this.permission === 'granted') {
            this.showPushNotification(title, message, options);
        }
        
        // Play sound if enabled
        if (this.settings.soundEnabled) {
            this.playNotificationSound();
        }
        
        // Save to notification history
        this.saveToHistory(title, message, type, options);
    }

    showInAppNotification(title, message, type, options) {
        const toast = document.createElement('div');
        toast.className = `toast notification-toast ${type}`;
        toast.innerHTML = `
            <div class="toast-icon">
                <span class="material-icons">${this.getNotificationIcon(type)}</span>
            </div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">
                <span class="material-icons">close</span>
            </button>
        `;

        document.getElementById('toastContainer').appendChild(toast);

        // Animate in
        setTimeout(() => toast.classList.add('show'), 100);

        // Auto remove after delay
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, options.duration || 5000);

        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        });

        // Click action
        if (options.action) {
            toast.addEventListener('click', () => {
                this.handleNotificationAction(options.action);
            });
        }
    }

    showPushNotification(title, message, options) {
        if (this.permission === 'granted') {
            const notification = new Notification(title, {
                body: message,
                icon: '/assets/icons/icon-192x192.png',
                badge: '/assets/icons/icon-72x72.png',
                tag: options.tag || 'ukulima-notification',
                data: options.data || {}
            });

            notification.onclick = () => {
                this.handlePushNotificationClick(notification);
                notification.close();
            };

            // Auto close after 8 seconds
            setTimeout(() => notification.close(), 8000);
        }
    }

    playNotificationSound() {
        const audio = new Audio('/assets/audio/notification.mp3');
        audio.play().catch(() => {
            // Sound play failed, ignore
        });
    }

    saveToHistory(title, message, type, options) {
        const notification = {
            id: utils.generateId(),
            title,
            message,
            type,
            timestamp: new Date().toISOString(),
            read: false,
            ...options
        };

        this.notifications.unshift(notification);
        this.saveNotifications();
        this.updateNotificationBadge();
        
        // Limit history to 100 items
        if (this.notifications.length > 100) {
            this.notifications = this.notifications.slice(0, 100);
        }
    }

    // Feature 16: Notification Center
    showNotificationCenter() {
        const modal = document.getElementById('notificationCenter') || this.createNotificationCenter();
        this.renderNotificationCenter();
        modal.classList.add('active');
    }

    createNotificationCenter() {
        const modal = document.createElement('div');
        modal.id = 'notificationCenter';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Notifications</h3>
                    <div class="header-actions">
                        <button class="btn-icon" id="markAllReadBtn">
                            <span class="material-icons">drafts</span>
                        </button>
                        <button class="btn-icon" id="clearAllNotifications">
                            <span class="material-icons">delete_sweep</span>
                        </button>
                        <button class="btn-icon" id="notificationSettings">
                            <span class="material-icons">settings</span>
                        </button>
                        <button class="modal-close">&times;</button>
                    </div>
                </div>
                <div class="modal-body">
                    <div id="notificationList"></div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        return modal;
    }

    renderNotificationCenter() {
        const list = document.getElementById('notificationList');
        if (!list) return;

        if (this.notifications.length === 0) {
            list.innerHTML = this.createEmptyNotificationsState();
            return;
        }

        list.innerHTML = this.notifications.map(notification => 
            this.createNotificationItem(notification)
        ).join('');

        this.attachNotificationEventListeners();
    }

    createNotificationItem(notification) {
        return `
            <div class="notification-item ${notification.read ? 'read' : 'unread'}" 
                 data-notification-id="${notification.id}">
                <div class="notification-icon">
                    <span class="material-icons">${this.getNotificationIcon(notification.type)}</span>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">
                        ${utils.formatRelativeTime(notification.timestamp)}
                    </div>
                </div>
                <div class="notification-actions">
                    ${!notification.read ? `
                        <button class="btn-icon mark-read-btn" title="Mark as read">
                            <span class="material-icons">mark_email_read</span>
                        </button>
                    ` : ''}
                    <button class="btn-icon delete-notification-btn" title="Delete">
                        <span class="material-icons">delete</span>
                    </button>
                </div>
            </div>
        `;
    }

    // Feature 17: Smart Notification Scheduling
    scheduleNotification(title, message, scheduleTime, options = {}) {
        const now = new Date();
        const schedule = new Date(scheduleTime);
        const delay = schedule.getTime() - now.getTime();

        if (delay > 0) {
            setTimeout(() => {
                this.show(title, message, options.type || 'info', options);
            }, delay);
        }
    }

    // Feature 18: Notification Categories and Filtering
    filterNotifications(category) {
        const filtered = category === 'all' ? 
            this.notifications : 
            this.notifications.filter(n => n.category === category);

        this.renderFilteredNotifications(filtered);
    }

    // Feature 19: Notification Preferences Management
    showNotificationSettings() {
        const modal = document.getElementById('notificationSettingsModal') || this.createSettingsModal();
        this.renderNotificationSettings();
        modal.classList.add('active');
    }

    createSettingsModal() {
        const modal = document.createElement('div');
        modal.id = 'notificationSettingsModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Notification Settings</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="notificationSettingsContent"></div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        return modal;
    }

    renderNotificationSettings() {
        const content = document.getElementById('notificationSettingsContent');
        if (!content) return;

        content.innerHTML = `
            <div class="settings-section">
                <h4>Notification Channels</h4>
                ${this.createSettingToggle('pushEnabled', 'Push Notifications', 'Receive browser push notifications')}
                ${this.createSettingToggle('soundEnabled', 'Sound Alerts', 'Play sound for new notifications')}
                ${this.createSettingToggle('desktopEnabled', 'Desktop Notifications', 'Show desktop notifications')}
            </div>
            
            <div class="settings-section">
                <h4>Notification Types</h4>
                ${this.createSettingToggle('orderUpdates', 'Order Updates', 'Notifications about order status changes')}
                ${this.createSettingToggle('messageAlerts', 'Message Alerts', 'Notifications for new messages')}
                ${this.createSettingToggle('priceAlerts', 'Price Alerts', 'Notifications for price changes')}
                ${this.createSettingToggle('systemUpdates', 'System Updates', 'Platform updates and announcements')}
            </div>
            
            <div class="settings-actions">
                <button class="btn btn-primary" id="saveNotificationSettings">Save Settings</button>
                <button class="btn btn-outline" id="testNotifications">Test Notifications</button>
            </div>
        `;

        this.attachSettingsEventListeners();
    }

    createSettingToggle(key, label, description) {
        const isChecked = this.settings[key] ? 'checked' : '';
        return `
            <div class="setting-toggle">
                <label class="toggle-label">
                    <input type="checkbox" ${isChecked} data-setting="${key}">
                    <span class="toggle-slider"></span>
                </label>
                <div class="toggle-content">
                    <div class="toggle-title">${label}</div>
                    <div class="toggle-description">${description}</div>
                </div>
            </div>
        `;
    }

    // Utility Methods
    getNotificationIcon(type) {
        const icons = {
            info: 'info',
            success: 'check_circle',
            warning: 'warning',
            error: 'error',
            order: 'shopping_cart',
            message: 'chat',
            system: 'notifications'
        };
        return icons[type] || 'notifications';
    }

    markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            this.saveNotifications();
            this.updateNotificationBadge();
            this.renderNotificationCenter();
        }
    }

    markAllAsRead() {
        this.notifications.forEach(notification => {
            notification.read = true;
        });
        this.saveNotifications();
        this.updateNotificationBadge();
        this.renderNotificationCenter();
    }

    clearAllNotifications() {
        this.notifications = [];
        this.saveNotifications();
        this.updateNotificationBadge();
        this.renderNotificationCenter();
    }

    saveNotifications() {
        localStorage.setItem('notifications', JSON.stringify(this.notifications));
    }

    saveSettings() {
        localStorage.setItem('notificationSettings', JSON.stringify(this.settings));
    }

    updateNotificationBadge() {
        const unreadCount = this.notifications.filter(n => !n.read).length;
        const badge = document.getElementById('notificationBadge');
        
        if (badge) {
            badge.textContent = unreadCount > 0 ? unreadCount : '';
            badge.style.display = unreadCount > 0 ? 'block' : 'none';
        }
    }

    createEmptyNotificationsState() {
        return `
            <div class="empty-state">
                <div class="empty-icon">🔔</div>
                <h3>No Notifications</h3>
                <p>You're all caught up! New notifications will appear here.</p>
            </div>
        `;
    }

    attachNotificationEventListeners() {
        // Mark all as read
        document.getElementById('markAllReadBtn')?.addEventListener('click', () => {
            this.markAllAsRead();
        });

        // Delete individual notifications
        document.querySelectorAll('.delete-notification-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const notificationId = btn.closest('[data-notification-id]').getAttribute('data-notification-id');
                this.deleteNotification(notificationId);
            });
        });
    }

    attachSettingsEventListeners() {
        // Save settings
        document.getElementById('saveNotificationSettings')?.addEventListener('click', () => {
            this.saveNotificationSettings();
        });

        // Test notifications
        document.getElementById('testNotifications')?.addEventListener('click', () => {
            this.testNotifications();
        });

        // Toggle changes
        document.querySelectorAll('input[data-setting]').forEach(input => {
            input.addEventListener('change', (e) => {
                this.settings[e.target.getAttribute('data-setting')] = e.target.checked;
            });
        });
    }

    saveNotificationSettings() {
        this.saveSettings();
        utils.showToast('Success', 'Notification settings saved', 'success');
        
        const modal = document.getElementById('notificationSettingsModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    testNotifications() {
        this.show('Test Notification', 'This is a test notification from Ukulima Biashara', 'info');
    }

    deleteNotification(notificationId) {
        this.notifications = this.notifications.filter(n => n.id !== notificationId);
        this.saveNotifications();
        this.updateNotificationBadge();
        this.renderNotificationCenter();
    }

    handleNotificationClick(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification && notification.action) {
            this.handleNotificationAction(notification.action);
        }
        this.markAsRead(notificationId);
    }

    handleNotificationAction(action) {
        const actions = {
            view_order: () => app.navigateToPage('orders'),
            view_messages: () => app.navigateToPage('messages'),
            view_product: (productId) => products.showProductDetails(productId),
            view_profile: (userId) => app.navigateToPage('profile', { id: userId })
        };

        if (actions[action.type]) {
            actions[action.type](action.data);
        }
    }

    handlePushNotificationClick(notification) {
        if (notification.data && notification.data.action) {
            this.handleNotificationAction(notification.data.action);
        }
    }
}

// Initialize notification manager
const notifications = new NotificationManager();
