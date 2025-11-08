// Enhanced Dashboard Manager with 40+ Features
class DashboardManager {
    constructor() {
        this.stats = {};
        this.recentActivity = [];
        this.quickActions = [];
        this.alerts = [];
        
        this.setupDashboardEvents();
        this.initializeDashboardFeatures();
    }

    setupDashboardEvents() {
        // Quick action buttons
        this.setupQuickActions();
        
        // Stats cards interactions
        this.setupStatsInteractions();
        
        // Activity feed
        this.setupActivityFeed();
        
        // Alert system
        this.setupAlerts();
    }

    setupQuickActions() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('.quick-action-btn') || e.target.closest('.quick-action-btn')) {
                const action = e.target.getAttribute('data-action');
                this.handleQuickAction(action);
            }
        });
    }

    setupStatsInteractions() {
        // Stats card clicks for detailed views
        document.addEventListener('click', (e) => {
            if (e.target.matches('.stat-card') || e.target.closest('.stat-card')) {
                const statType = e.target.closest('[data-stat-type]').getAttribute('data-stat-type');
                this.showStatDetails(statType);
            }
        });
    }

    setupActivityFeed() {
        // Load more activities
        document.getElementById('loadMoreActivities')?.addEventListener('click', () => {
            this.loadMoreActivities();
        });

        // Filter activities
        document.getElementById('activityFilter')?.addEventListener('change', (e) => {
            this.filterActivities(e.target.value);
        });
    }

    setupAlerts() {
        // Dismiss alerts
        document.addEventListener('click', (e) => {
            if (e.target.matches('.alert-dismiss') || e.target.closest('.alert-dismiss')) {
                const alertId = e.target.closest('[data-alert-id]').getAttribute('data-alert-id');
                this.dismissAlert(alertId);
            }
        });

        // Alert settings
        document.getElementById('alertSettingsBtn')?.addEventListener('click', () => {
            this.showAlertSettings();
        });
    }

    initializeDashboardFeatures() {
        this.loadDashboardData();
        this.setupRealTimeUpdates();
        this.initializePersonalization();
    }

    async loadDashboardData() {
        if (!utils.isLoggedIn()) return;

        try {
            await Promise.all([
                this.loadQuickStats(),
                this.loadRecentActivity(),
                this.loadAlerts(),
                this.loadQuickActions()
            ]);

            this.renderDashboard();

        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
    }

    async loadQuickStats() {
        // Simulate API call for stats
        this.stats = {
            totalProducts: await this.getProductCount(),
            totalOrders: await this.getOrderCount(),
            totalRevenue: await this.getRevenue(),
            newMessages: await this.getMessageCount(),
            pendingOrders: await this.getPendingOrderCount(),
            lowStockItems: await this.getLowStockCount(),
            customerSatisfaction: await this.getSatisfactionScore(),
            monthlyGrowth: await this.getGrowthRate()
        };
    }

    async loadRecentActivity() {
        // Combine activities from different sources
        const activities = [
            ...await this.getOrderActivities(),
            ...await this.getMessageActivities(),
            ...await this.getProductActivities(),
            ...await this.getSystemActivities()
        ];

        // Sort by date and limit
        this.recentActivity = activities
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10);
    }

    async loadAlerts() {
        this.alerts = [
            {
                id: 1,
                type: 'warning',
                title: 'Low Stock Alert',
                message: '5 products are running low on stock',
                action: 'restock',
                timestamp: new Date().toISOString()
            },
            {
                id: 2,
                type: 'info',
                title: 'New Message',
                message: 'You have 3 unread messages',
                action: 'view_messages',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 3,
                type: 'success',
                title: 'Order Completed',
                message: 'Order #UK12345 has been delivered successfully',
                action: 'view_order',
                timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
            }
        ];
    }

    async loadQuickActions() {
        const userRole = utils.getUserRole();
        
        this.quickActions = {
            farmer: [
                { action: 'add_product', label: 'Add New Product', icon: 'add', color: 'primary' },
                { action: 'view_orders', label: 'View Orders', icon: 'list_alt', color: 'secondary' },
                { action: 'update_inventory', label: 'Update Inventory', icon: 'inventory', color: 'warning' },
                { action: 'view_analytics', label: 'Sales Analytics', icon: 'analytics', color: 'info' }
            ],
            wholesaler: [
                { action: 'browse_products', label: 'Browse Products', icon: 'store', color: 'primary' },
                { action: 'place_order', label: 'Place Order', icon: 'add_shopping_cart', color: 'secondary' },
                { action: 'view_suppliers', label: 'Find Farmers', icon: 'agriculture', color: 'success' },
                { action: 'track_orders', label: 'Track Orders', icon: 'local_shipping', color: 'info' }
            ],
            retailer: [
                { action: 'browse_products', label: 'Shop Products', icon: 'shopping_basket', color: 'primary' },
                { action: 'view_wholesalers', label: 'Find Wholesalers', icon: 'store', color: 'secondary' },
                { action: 'manage_orders', label: 'My Orders', icon: 'list_alt', color: 'warning' },
                { action: 'view_promotions', label: 'Special Offers', icon: 'local_offer', color: 'success' }
            ]
        }[userRole] || [];
    }

    renderDashboard() {
        this.renderStats();
        this.renderQuickActions();
        this.renderRecentActivity();
        this.renderAlerts();
        this.renderCharts();
    }

    renderStats() {
        const statsContainer = document.getElementById('dashboardStats');
        if (!statsContainer) return;

        statsContainer.innerHTML = `
            <div class="stats-grid">
                ${this.createStatCard('products', 'Total Products', this.stats.totalProducts, 'inventory', 'primary')}
                ${this.createStatCard('orders', 'Total Orders', this.stats.totalOrders, 'shopping_cart', 'success')}
                ${this.createStatCard('revenue', 'Total Revenue', utils.formatKenyanCurrency(this.stats.totalRevenue), 'payments', 'warning')}
                ${this.createStatCard('messages', 'New Messages', this.stats.newMessages, 'chat', 'info')}
                ${this.createStatCard('pending', 'Pending Orders', this.stats.pendingOrders, 'schedule', 'secondary')}
                ${this.createStatCard('satisfaction', 'Satisfaction', `${this.stats.customerSatisfaction}%`, 'star', 'success')}
            </div>
        `;
    }

    createStatCard(type, label, value, icon, color) {
        return `
            <div class="stat-card ${color}" data-stat-type="${type}">
                <div class="stat-icon">
                    <span class="material-icons">${icon}</span>
                </div>
                <div class="stat-content">
                    <div class="stat-value">${value}</div>
                    <div class="stat-label">${label}</div>
                    ${this.stats.monthlyGrowth ? `
                        <div class="stat-trend ${this.stats.monthlyGrowth >= 0 ? 'positive' : 'negative'}">
                            <span class="material-icons">${this.stats.monthlyGrowth >= 0 ? 'trending_up' : 'trending_down'}</span>
                            ${Math.abs(this.stats.monthlyGrowth)}%
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderQuickActions() {
        const actionsContainer = document.getElementById('quickActions');
        if (!actionsContainer) return;

        actionsContainer.innerHTML = `
            <h3>Quick Actions</h3>
            <div class="quick-actions-grid">
                ${this.quickActions.map(action => `
                    <button class="quick-action-btn ${action.color}" data-action="${action.action}">
                        <span class="material-icons">${action.icon}</span>
                        <span class="action-label">${action.label}</span>
                    </button>
                `).join('')}
            </div>
        `;
    }

    renderRecentActivity() {
        const activityContainer = document.getElementById('recentActivity');
        if (!activityContainer) return;

        activityContainer.innerHTML = `
            <div class="activity-header">
                <h3>Recent Activity</h3>
                <select id="activityFilter" class="filter-select">
                    <option value="all">All Activities</option>
                    <option value="orders">Orders</option>
                    <option value="messages">Messages</option>
                    <option value="products">Products</option>
                </select>
            </div>
            <div class="activity-feed">
                ${this.recentActivity.map(activity => this.createActivityItem(activity)).join('')}
            </div>
            ${this.recentActivity.length >= 10 ? `
                <button class="btn btn-outline btn-full" id="loadMoreActivities">
                    Load More Activities
                </button>
            ` : ''}
        `;
    }

    createActivityItem(activity) {
        return `
            <div class="activity-item" data-activity-type="${activity.type}">
                <div class="activity-icon">
                    <span class="material-icons">${this.getActivityIcon(activity.type)}</span>
                </div>
                <div class="activity-content">
                    <div class="activity-message">${activity.message}</div>
                    <div class="activity-time">${utils.formatRelativeTime(activity.timestamp)}</div>
                </div>
                ${activity.action ? `
                    <button class="btn-icon activity-action" data-action="${activity.action}">
                        <span class="material-icons">arrow_forward</span>
                    </button>
                ` : ''}
            </div>
        `;
    }

    renderAlerts() {
        const alertsContainer = document.getElementById('dashboardAlerts');
        if (!alertsContainer) return;

        if (this.alerts.length === 0) {
            alertsContainer.innerHTML = `
                <div class="no-alerts">
                    <span class="material-icons">check_circle</span>
                    <span>No new alerts</span>
                </div>
            `;
            return;
        }

        alertsContainer.innerHTML = `
            <div class="alerts-header">
                <h3>Alerts & Notifications</h3>
                <button class="btn-icon" id="alertSettingsBtn">
                    <span class="material-icons">settings</span>
                </button>
            </div>
            <div class="alerts-list">
                ${this.alerts.map(alert => this.createAlertItem(alert)).join('')}
            </div>
        `;
    }

    createAlertItem(alert) {
        return `
            <div class="alert-item ${alert.type}" data-alert-id="${alert.id}">
                <div class="alert-icon">
                    <span class="material-icons">${this.getAlertIcon(alert.type)}</span>
                </div>
                <div class="alert-content">
                    <div class="alert-title">${alert.title}</div>
                    <div class="alert-message">${alert.message}</div>
                    <div class="alert-time">${utils.formatRelativeTime(alert.timestamp)}</div>
                </div>
                <div class="alert-actions">
                    ${alert.action ? `
                        <button class="btn btn-outline btn-small alert-action-btn" 
                                data-action="${alert.action}">
                            Action
                        </button>
                    ` : ''}
                    <button class="btn-icon alert-dismiss">
                        <span class="material-icons">close</span>
                    </button>
                </div>
            </div>
        `;
    }

    renderCharts() {
        // Initialize charts if chart container exists
        const chartsContainer = document.getElementById('dashboardCharts');
        if (chartsContainer) {
            this.initializeCharts();
        }
    }

    // Feature 41: Real-time Dashboard Updates
    setupRealTimeUpdates() {
        // Update dashboard every 30 seconds
        setInterval(() => {
            if (document.visibilityState === 'visible') {
                this.loadQuickStats();
                this.loadRecentActivity();
                this.loadAlerts();
            }
        }, 30000);

        // Listen for real-time events
        this.setupRealTimeListeners();
    }

    setupRealTimeListeners() {
        // Listen for new orders, messages, etc.
        // This would connect to WebSocket in a real implementation
        window.addEventListener('newOrder', () => {
            this.loadQuickStats();
            this.loadRecentActivity();
        });

        window.addEventListener('newMessage', () => {
            this.loadQuickStats();
            this.loadRecentActivity();
        });
    }

    // Feature 42: Personalized Dashboard
    initializePersonalization() {
        this.loadDashboardPreferences();
        this.setupDashboardCustomization();
    }

    loadDashboardPreferences() {
        const preferences = JSON.parse(localStorage.getItem('dashboardPreferences')) || {
            layout: 'default',
            visibleWidgets: ['stats', 'actions', 'activity', 'alerts'],
            refreshRate: 30
        };
        
        this.applyDashboardPreferences(preferences);
    }

    applyDashboardPreferences(preferences) {
        // Show/hide widgets based on preferences
        preferences.visibleWidgets.forEach(widget => {
            const element = document.getElementById(`${widget}Widget`);
            if (element) {
                element.style.display = 'block';
            }
        });
    }

    // Feature 43: Advanced Analytics Charts
    initializeCharts() {
        // Initialize sales chart
        this.initSalesChart();
        
        // Initialize product performance chart
        this.initProductPerformanceChart();
        
        // Initialize customer satisfaction chart
        this.initSatisfactionChart();
    }

    initSalesChart() {
        const ctx = document.getElementById('salesChart')?.getContext('2d');
        if (!ctx) return;

        // Sample chart data
        const data = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Sales (KES)',
                data: [12000, 19000, 15000, 25000, 22000, 30000],
                borderColor: '#2E7D32',
                backgroundColor: 'rgba(46, 125, 50, 0.1)',
                fill: true
            }]
        };

        // In a real app, you would use Chart.js or similar
        console.log('Initializing sales chart with data:', data);
    }

    // Utility Methods
    getActivityIcon(activityType) {
        const icons = {
            order: 'shopping_cart',
            message: 'chat',
            product: 'inventory',
            system: 'notifications',
            payment: 'payments'
        };
        return icons[activityType] || 'notifications';
    }

    getAlertIcon(alertType) {
        const icons = {
            warning: 'warning',
            info: 'info',
            success: 'check_circle',
            error: 'error'
        };
        return icons[alertType] || 'notifications';
    }

    handleQuickAction(action) {
        const actions = {
            add_product: () => products.showAddProductModal(),
            view_orders: () => app.navigateToPage('orders'),
            update_inventory: () => this.showInventoryManagement(),
            view_analytics: () => this.showAnalyticsDashboard(),
            browse_products: () => app.navigateToPage('products'),
            place_order: () => app.navigateToPage('products'),
            view_suppliers: () => app.navigateToPage('farmers'),
            track_orders: () => app.navigateToPage('orders'),
            manage_orders: () => app.navigateToPage('orders'),
            view_promotions: () => this.showPromotions()
        };

        if (actions[action]) {
            actions[action]();
        }
    }

    // Mock data methods (in real app, these would be API calls)
    async getProductCount() { return 24; }
    async getOrderCount() { return 156; }
    async getRevenue() { return 125000; }
    async getMessageCount() { return 8; }
    async getPendingOrderCount() { return 12; }
    async getLowStockCount() { return 5; }
    async getSatisfactionScore() { return 94; }
    async getGrowthRate() { return 12.5; }

    async getOrderActivities() {
        return [
            {
                type: 'order',
                message: 'New order #UK12345 received',
                timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
                action: 'view_order'
            }
        ];
    }

    async getMessageActivities() {
        return [
            {
                type: 'message',
                message: 'New message from John Doe',
                timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
                action: 'view_messages'
            }
        ];
    }

    async getProductActivities() {
        return [
            {
                type: 'product',
                message: 'Product "Fresh Tomatoes" is running low',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                action: 'update_inventory'
            }
        ];
    }

    async getSystemActivities() {
        return [
            {
                type: 'system',
                message: 'System backup completed successfully',
                timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
            }
        ];
    }
}

// Initialize dashboard manager
const dashboard = new DashboardManager();
