// Enhanced Offline Manager with 10+ Features
class OfflineManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.pendingActions = [];
        this.syncQueue = [];
        this.offlineData = {};
        
        this.initializeOfflineFeatures();
        this.setupOfflineEvents();
    }

    async initializeOfflineFeatures() {
        await this.setupServiceWorker();
        this.loadPendingActions();
        this.setupBackgroundSync();
        this.initializeCache();
    }

    setupOfflineEvents() {
        // Online/offline detection
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());

        // Page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isOnline) {
                this.processSyncQueue();
            }
        });

        // Before unload - save pending actions
        window.addEventListener('beforeunload', () => {
            this.savePendingActions();
        });
    }

    async setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.worker.register('/sw.js');
                console.log('ServiceWorker registered');
            } catch (error) {
                console.warn('ServiceWorker registration failed:', error);
            }
        }
    }

    setupBackgroundSync() {
        if ('sync' in registration) {
            // Register background sync for pending actions
            registration.sync.register('pending-actions')
                .then(() => console.log('Background sync registered'))
                .catch(() => console.warn('Background sync not supported'));
        }
    }

    initializeCache() {
        // Initialize cache for critical resources
        this.criticalResources = [
            '/',
            '/css/style.css',
            '/css/responsive.css',
            '/js/app.js',
            '/js/utils.js',
            '/manifest.json'
        ];

        this.precacheResources();
    }

    async precacheResources() {
        if ('caches' in window) {
            try {
                const cache = await caches.open('ukulima-v1');
                await cache.addAll(this.criticalResources);
            } catch (error) {
                console.warn('Precaching failed:', error);
            }
        }
    }

    handleOnline() {
        this.isOnline = true;
        utils.showToast('Back Online', 'Connection restored', 'success');
        
        // Process any pending actions
        this.processPendingActions();
        this.processSyncQueue();
        
        // Sync all data
        this.syncAllData();
    }

    handleOffline() {
        this.isOnline = false;
        utils.showToast('Offline Mode', 'Some features limited', 'warning');
        
        // Enable offline UI
        this.enableOfflineUI();
    }

    enableOfflineUI() {
        document.body.classList.add('offline');
        
        // Show offline indicator
        this.showOfflineIndicator();
        
        // Disable features that require online
        this.disableOnlineFeatures();
    }

    disableOfflineUI() {
        document.body.classList.remove('offline');
        this.hideOfflineIndicator();
        this.enableOnlineFeatures();
    }

    showOfflineIndicator() {
        let indicator = document.getElementById('offlineIndicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'offlineIndicator';
            indicator.className = 'offline-indicator';
            indicator.innerHTML = `
                <span class="material-icons">wifi_off</span>
                <span>You are currently offline</span>
            `;
            document.body.appendChild(indicator);
        }
        indicator.style.display = 'block';
    }

    hideOfflineIndicator() {
        const indicator = document.getElementById('offlineIndicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }

    disableOnlineFeatures() {
        // Disable forms that require online connection
        document.querySelectorAll('form[data-requires-online]').forEach(form => {
            form.querySelectorAll('button[type="submit"]').forEach(btn => {
                btn.disabled = true;
                btn.title = 'Available when online';
            });
        });
    }

    enableOnlineFeatures() {
        document.querySelectorAll('form[data-requires-online]').forEach(form => {
            form.querySelectorAll('button[type="submit"]').forEach(btn => {
                btn.disabled = false;
                btn.title = '';
            });
        });
    }

    // Feature 11: Offline Action Queue
    queueAction(action) {
        this.pendingActions.push({
            ...action,
            id: utils.generateId(),
            timestamp: new Date().toISOString(),
            retryCount: 0
        });

        this.savePendingActions();

        // If online, process immediately
        if (this.isOnline) {
            this.processPendingActions();
        }
    }

    async processPendingActions() {
        if (!this.isOnline || this.processingActions) return;

        this.processingActions = true;

        for (let i = 0; i < this.pendingActions.length; i++) {
            const action = this.pendingActions[i];
            
            try {
                await this.executeAction(action);
                
                // Remove successful action
                this.pendingActions.splice(i, 1);
                i--;
                
            } catch (error) {
                console.warn('Failed to execute action:', action, error);
                action.retryCount++;
                
                // Remove after too many retries
                if (action.retryCount >= 3) {
                    this.pendingActions.splice(i, 1);
                    i--;
                    this.saveFailedAction(action, error);
                }
            }
        }

        this.savePendingActions();
        this.processingActions = false;
    }

    async executeAction(action) {
        switch (action.type) {
            case 'api_call':
                return await utils.apiCall(action.endpoint, action.options);
            
            case 'create_order':
                return await orders.createOrder(action.data);
            
            case 'send_message':
                return await messages.sendMessage(action.data);
            
            case 'update_product':
                return await products.updateProduct(action.productId, action.data);
            
            default:
                throw new Error(`Unknown action type: ${action.type}`);
        }
    }

    // Feature 12: Offline Data Storage
    storeOfflineData(key, data) {
        this.offlineData[key] = {
            data,
            timestamp: new Date().toISOString(),
            version: 1
        };
        
        this.saveOfflineData();
    }

    getOfflineData(key) {
        return this.offlineData[key]?.data || null;
    }

    // Feature 13: Background Sync
    async syncAllData() {
        if (!this.isOnline) return;

        const syncTasks = [
            this.syncOrders(),
            this.syncMessages(),
            this.syncProducts(),
            this.syncUserData()
        ];

        await Promise.allSettled(syncTasks);
    }

    async syncOrders() {
        try {
            await orders.loadOrders();
            console.log('Orders synced successfully');
        } catch (error) {
            console.warn('Order sync failed:', error);
        }
    }

    async syncMessages() {
        try {
            await messages.loadConversations();
            console.log('Messages synced successfully');
        } catch (error) {
            console.warn('Message sync failed:', error);
        }
    }

    async syncProducts() {
        try {
            await products.loadProducts(true);
            console.log('Products synced successfully');
        } catch (error) {
            console.warn('Product sync failed:', error);
        }
    }

    async syncUserData() {
        try {
            await utils.loadUserData();
            console.log('User data synced successfully');
        } catch (error) {
            console.warn('User data sync failed:', error);
        }
    }

    // Feature 14: Cache Management
    async cacheResource(url, options = {}) {
        if (!('caches' in window)) return;

        try {
            const cache = await caches.open('ukulima-dynamic');
            const response = await fetch(url, options);
            
            if (response.ok) {
                await cache.put(url, response.clone());
            }
            
            return response;
        } catch (error) {
            // Try to serve from cache
            const cached = await caches.match(url);
            if (cached) {
                return cached;
            }
            throw error;
        }
    }

    async clearOldCaches() {
        if (!('caches' in window)) return;

        const cacheNames = await caches.keys();
        const currentCache = 'ukulima-v1';

        for (const cacheName of cacheNames) {
            if (cacheName !== currentCache) {
                await caches.delete(cacheName);
            }
        }
    }

    // Feature 15: Offline Analytics
    trackOfflineEvent(event, data) {
        const offlineEvents = JSON.parse(localStorage.getItem('offlineAnalytics')) || [];
        
        offlineEvents.push({
            event,
            data,
            timestamp: new Date().toISOString(),
            online: this.isOnline
        });

        // Keep only last 100 events
        if (offlineEvents.length > 100) {
            offlineEvents.splice(0, offlineEvents.length - 100);
        }

        localStorage.setItem('offlineAnalytics', JSON.stringify(offlineEvents));

        // Sync when online
        if (this.isOnline) {
            this.syncAnalytics();
        }
    }

    async syncAnalytics() {
        const offlineEvents = JSON.parse(localStorage.getItem('offlineAnalytics')) || [];
        
        if (offlineEvents.length === 0) return;

        try {
            // Send to analytics endpoint
            await utils.apiCall('/analytics/events', {
                method: 'POST',
                body: JSON.stringify({ events: offlineEvents })
            });

            // Clear sent events
            localStorage.removeItem('offlineAnalytics');
            
        } catch (error) {
            console.warn('Analytics sync failed:', error);
        }
    }

    // Utility Methods
    savePendingActions() {
        localStorage.setItem('pendingActions', JSON.stringify(this.pendingActions));
    }

    loadPendingActions() {
        try {
            this.pendingActions = JSON.parse(localStorage.getItem('pendingActions')) || [];
        } catch (error) {
            this.pendingActions = [];
        }
    }

    saveOfflineData() {
        localStorage.setItem('offlineData', JSON.stringify(this.offlineData));
    }

    loadOfflineData() {
        try {
            this.offlineData = JSON.parse(localStorage.getItem('offlineData')) || {};
        } catch (error) {
            this.offlineData = {};
        }
    }

    saveFailedAction(action, error) {
        const failedActions = JSON.parse(localStorage.getItem('failedActions')) || [];
        failedActions.push({ action, error, failedAt: new Date().toISOString() });
        localStorage.setItem('failedActions', JSON.stringify(failedActions));
    }

    processSyncQueue() {
        if (this.isOnline && this.syncQueue.length > 0) {
            this.syncQueue.forEach(task => task());
            this.syncQueue = [];
        }
    }

    addToSyncQueue(task) {
        this.syncQueue.push(task);
        if (this.isOnline) {
            this.processSyncQueue();
        }
    }

    // Network status monitoring
    getNetworkStatus() {
        return {
            online: this.isOnline,
            connectionType: this.getConnectionType(),
            effectiveType: this.getEffectiveType(),
            downlink: this.getDownlink(),
            rtt: this.getRTT()
        };
    }

    getConnectionType() {
        return navigator.connection?.type || 'unknown';
    }

    getEffectiveType() {
        return navigator.connection?.effectiveType || '4g';
    }

    getDownlink() {
        return navigator.connection?.downlink || 10;
    }

    getRTT() {
        return navigator.connection?.rtt || 50;
    }

    // Offline capability detection
    isFeatureAvailableOffline(feature) {
        const offlineFeatures = [
            'browse_products',
            'view_profile',
            'view_orders',
            'compose_message'
        ];

        return offlineFeatures.includes(feature);
    }

    // Storage management
    getStorageUsage() {
        let total = 0;
        for (const key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length;
            }
        }
        return total;
    }

    clearExpiredData() {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Clear old cached data
        for (const key in this.offlineData) {
            const timestamp = new Date(this.offlineData[key].timestamp);
            if (timestamp < oneWeekAgo) {
                delete this.offlineData[key];
            }
        }

        this.saveOfflineData();
    }
}

// Initialize offline manager
const offline = new OfflineManager();
