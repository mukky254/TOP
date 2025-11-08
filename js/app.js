// Enhanced Main Application
class UkulimaApp {
    constructor() {
        this.currentView = 'home';
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Ukulima Biashara...');
        
        // Initialize all modules
        await this.initializeModules();
        
        // Setup event listeners
        this.setupGlobalEventListeners();
        
        // Load initial data
        await this.loadInitialData();
        
        // Hide loading screen
        this.hideLoadingScreen();
        
        // Start background services
        this.startBackgroundServices();
        
        console.log('✅ Ukulima Biashara initialized successfully!');
    }

    async initializeModules() {
        // Initialize all managers
        this.auth = new AuthManager();
        this.products = new ProductsManager();
        this.orders = new OrdersManager();
        this.messages = new MessagesManager();
        this.cart = new CartManager();
        this.dashboard = new DashboardManager();
        this.voice = new VoiceAssistant();
        this.notifications = new NotificationManager();
        this.offline = new OfflineManager();
        this.analytics = new AnalyticsManager();
        
        // Wait for critical modules to load
        await Promise.all([
            this.auth.initialize(),
            this.offline.initialize()
        ]);
    }

    setupGlobalEventListeners() {
        // Global click handlers
        document.addEventListener('click', this.handleGlobalClick.bind(this));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
        
        // Online/offline detection
        window.addEventListener('online', () => this.handleOnlineStatus());
        window.addEventListener('offline', () => this.handleOfflineStatus());
        
        // Visibility change (tab focus)
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
        
        // Before unload
        window.addEventListener('beforeunload', (e) => this.handleBeforeUnload(e));
    }

    handleGlobalClick(e) {
        const target = e.target;
        
        // Handle navigation links
        if (target.matches('[data-page]') || target.closest('[data-page]')) {
            e.preventDefault();
            const page = target.getAttribute('data-page') || target.closest('[data-page]').getAttribute('data-page');
            this.navigateToPage(page);
        }
        
        // Handle action buttons
        if (target.matches('[data-action]') || target.closest('[data-action]')) {
            const action = target.getAttribute('data-action') || target.closest('[data-action]').getAttribute('data-action');
            this.handleAction(action, target);
        }
        
        // Handle modal closes
        if (target.matches('.modal-close, .modal .btn-close') || target.closest('.modal-close')) {
            this.closeActiveModal();
        }
    }

    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + K for search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            this.focusSearch();
        }
        
        // Escape key
        if (e.key === 'Escape') {
            this.closeActiveModal();
            this.closeAllDropdowns();
        }
        
        // Voice command trigger
        if (e.altKey && e.key === 'v') {
            e.preventDefault();
            this.voice.toggleListening();
        }
    }

    navigateToPage(page, data = {}) {
        console.log(`📍 Navigating to: ${page}`, data);
        
        // Update current view
        this.currentView = page;
        
        // Hide all pages
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        
        // Show target page
        const targetPage = document.getElementById(`${page}Page`);
        if (targetPage) {
            targetPage.classList.add('active');
            
            // Trigger page-specific initialization
            this.initializePage(page, data);
        } else {
            console.warn(`Page not found: ${page}`);
            this.navigateToPage('home');
        }
        
        // Update navigation state
        this.updateNavigationState(page);
        
        // Update browser history
        this.updateBrowserHistory(page, data);
        
        // Track page view
        this.analytics.trackPageView(page);
    }

    initializePage(page, data) {
        switch (page) {
            case 'home':
                this.products.loadFeaturedProducts();
                this.updateStats();
                break;
            case 'products':
                this.products.loadProducts(true);
                break;
            case 'dashboard':
                this.dashboard.loadDashboardData();
                break;
            case 'cart':
                this.cart.renderCart();
                break;
            case 'orders':
                this.orders.loadOrders();
                break;
            case 'messages':
                this.messages.loadConversations();
                break;
            case 'profile':
                this.auth.loadProfileData();
                break;
        }
    }

    updateNavigationState(page) {
        // Update active nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === page) {
                link.classList.add('active');
            }
        });
        
        // Update document title
        const pageTitles = {
            home: 'Ukulima Biashara - Connect Farmers & Buyers',
            products: 'Browse Products - Ukulima Biashara',
            dashboard: 'Dashboard - Ukulima Biashara',
            cart: 'Shopping Cart - Ukulima Biashara',
            orders: 'My Orders - Ukulima Biashara',
            messages: 'Messages - Ukulima Biashara',
            profile: 'My Profile - Ukulima Biashara'
        };
        
        document.title = pageTitles[page] || 'Ukulima Biashara';
    }

    updateBrowserHistory(page, data) {
        const url = new URL(window.location);
        url.hash = page;
        
        if (Object.keys(data).length > 0) {
            url.search = new URLSearchParams(data).toString();
        }
        
        window.history.pushState({ page, data }, '', url);
    }

    async loadInitialData() {
        try {
            // Load essential data in parallel
            await Promise.allSettled([
                this.products.loadCategories(),
                this.auth.populateCounties(),
                this.notifications.initialize()
            ]);
            
            // Load user-specific data if logged in
            if (utils.isLoggedIn()) {
                await this.loadUserData();
            }
            
        } catch (error) {
            console.error('Failed to load initial data:', error);
            this.notifications.show('Warning', 'Some data may not load correctly', 'warning');
        }
    }

    async loadUserData() {
        const promises = [
            this.orders.loadOrders(),
            this.messages.loadConversations(),
            this.cart.loadCart(),
            this.dashboard.loadQuickStats()
        ];
        
        await Promise.allSettled(promises);
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }

    startBackgroundServices() {
        // Start periodic data sync
        this.startDataSync();
        
        // Start notification polling
        this.startNotificationPolling();
        
        // Start analytics heartbeat
        this.startAnalyticsHeartbeat();
    }

    startDataSync() {
        // Sync every 2 minutes
        setInterval(() => {
            if (utils.isLoggedIn() && navigator.onLine) {
                this.syncData();
            }
        }, 120000);
    }

    async syncData() {
        try {
            await Promise.allSettled([
                this.orders.syncOrders(),
                this.messages.syncMessages(),
                this.products.syncProducts()
            ]);
        } catch (error) {
            console.warn('Background sync failed:', error);
        }
    }

    startNotificationPolling() {
        // Check for new notifications every minute
        setInterval(() => {
            if (utils.isLoggedIn()) {
                this.notifications.checkNewNotifications();
            }
        }, 60000);
    }

    startAnalyticsHeartbeat() {
        // Send heartbeat every 30 seconds
        setInterval(() => {
            this.analytics.sendHeartbeat(this.currentView);
        }, 30000);
    }

    handleOnlineStatus() {
        this.notifications.show('You\'re back online', 'Connection restored', 'success');
        this.syncData(); // Sync immediately when back online
    }

    handleOfflineStatus() {
        this.notifications.show('You\'re offline', 'Some features may not work', 'warning');
    }

    handleVisibilityChange() {
        if (!document.hidden && utils.isLoggedIn()) {
            // Tab became visible, refresh important data
            this.messages.loadConversations();
            this.orders.loadOrders();
        }
    }

    handleBeforeUnload(e) {
        // Save any unsaved data
        this.offline.savePendingActions();
        
        // Don't show confirmation for now
        // e.preventDefault();
        // e.returnValue = '';
    }

    focusSearch() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }

    closeActiveModal() {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    closeAllDropdowns() {
        document.querySelectorAll('.dropdown-menu.show').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
    }

    handleAction(action, target) {
        console.log(`🎯 Handling action: ${action}`, target);
        
        const actions = {
            'voice-search': () => this.voice.startVoiceSearch(),
            'toggle-theme': () => this.toggleTheme(),
            'toggle-sidebar': () => this.toggleSidebar(),
            'print-page': () => window.print(),
            'share-page': () => this.shareCurrentPage(),
            'report-issue': () => this.reportIssue(),
            'give-feedback': () => this.giveFeedback(),
            'view-tutorial': () => this.showTutorial()
        };
        
        if (actions[action]) {
            actions[action]();
        } else {
            console.warn(`Unknown action: ${action}`);
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        this.notifications.show('Theme Changed', `Switched to ${newTheme} mode`, 'info');
    }

    toggleSidebar() {
        document.body.classList.toggle('sidebar-collapsed');
    }

    shareCurrentPage() {
        if (navigator.share) {
            navigator.share({
                title: document.title,
                url: window.location.href,
                text: 'Check out Ukulima Biashara - Agricultural Marketplace'
            });
        } else {
            // Fallback to copying to clipboard
            navigator.clipboard.writeText(window.location.href);
            this.notifications.show('Link Copied', 'Page URL copied to clipboard', 'success');
        }
    }

    reportIssue() {
        const issueData = {
            page: this.currentView,
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        };
        
        console.log('Reporting issue:', issueData);
        this.notifications.show('Issue Reported', 'Thank you for your feedback', 'success');
    }

    giveFeedback() {
        this.showModal('feedbackModal', {
            title: 'Send Feedback',
            content: this.createFeedbackForm()
        });
    }

    showTutorial() {
        this.showModal('tutorialModal', {
            title: 'How to Use Ukulima Biashara',
            content: this.createTutorialContent()
        });
    }

    showModal(modalId, options = {}) {
        const modal = document.getElementById(modalId) || this.createModal(modalId, options);
        modal.classList.add('active');
    }

    createModal(modalId, options) {
        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${options.title || 'Modal'}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    ${options.content || ''}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        return modal;
    }

    async updateStats() {
        try {
            // Simulate API call for stats
            const stats = {
                farmers: '1,250+',
                products: '3,450+',
                orders: '2,100+',
                counties: '47'
            };
            
            Object.keys(stats).forEach(stat => {
                const element = document.getElementById(`${stat}Count`);
                if (element) {
                    element.textContent = stats[stat];
                }
            });
        } catch (error) {
            console.error('Failed to update stats:', error);
        }
    }
}

// Enhanced Utils with additional features
class EnhancedUtils extends Utils {
    constructor() {
        super();
        this.theme = localStorage.getItem('theme') || 'light';
        this.language = localStorage.getItem('language') || 'en';
        this.initEnhancedFeatures();
    }

    initEnhancedFeatures() {
        this.applyTheme();
        this.applyLanguage();
        this.setupPerformanceMonitoring();
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
    }

    applyLanguage() {
        document.documentElement.setAttribute('lang', this.language);
    }

    setupPerformanceMonitoring() {
        // Monitor page load performance
        window.addEventListener('load', () => {
            const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
            console.log(`Page loaded in ${loadTime}ms`);
            
            if (loadTime > 3000) {
                console.warn('Slow page load detected');
            }
        });
    }

    // Enhanced API call with retry logic
    async apiCallWithRetry(endpoint, options = {}, maxRetries = 3) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await this.apiCall(endpoint, options);
            } catch (error) {
                lastError = error;
                
                if (attempt === maxRetries) break;
                
                // Exponential backoff
                const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
                console.warn(`API call failed (attempt ${attempt}), retrying in ${delay}ms...`);
                await this.sleep(delay);
            }
        }
        
        throw lastError;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // File handling utilities
    async readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    validateImageFile(file) {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        const maxSize = 5 * 1024 * 1024; // 5MB
        
        if (!validTypes.includes(file.type)) {
            throw new Error('Please select a JPEG, PNG, or WebP image');
        }
        
        if (file.size > maxSize) {
            throw new Error('Image must be smaller than 5MB');
        }
        
        return true;
    }

    // Geolocation utilities
    async getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported'));
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                position => resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy
                }),
                error => reject(error),
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000
                }
            );
        });
    }

    // Local storage with expiration
    setWithExpiry(key, value, ttl) {
        const item = {
            value: value,
            expiry: Date.now() + ttl
        };
        localStorage.setItem(key, JSON.stringify(item));
    }

    getWithExpiry(key) {
        const itemStr = localStorage.getItem(key);
        
        if (!itemStr) return null;
        
        const item = JSON.parse(itemStr);
        
        if (Date.now() > item.expiry) {
            localStorage.removeItem(key);
            return null;
        }
        
        return item.value;
    }

    // Currency formatting for Kenya
    formatKenyanCurrency(amount) {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    // Phone number formatting
    formatPhoneNumber(phone) {
        // Kenyan phone number formatting
        const cleaned = phone.replace(/\D/g, '');
        
        if (cleaned.startsWith('254')) {
            return `+${cleaned}`;
        } else if (cleaned.startsWith('0')) {
            return `+254${cleaned.substring(1)}`;
        } else {
            return `+254${cleaned}`;
        }
    }

    // Swahili text utilities
    translate(key) {
        const translations = {
            'en': {
                'welcome': 'Welcome',
                'products': 'Products',
                'farmers': 'Farmers',
                'orders': 'Orders',
                'messages': 'Messages'
            },
            'sw': {
                'welcome': 'Karibu',
                'products': 'Bidhaa',
                'farmers': 'Wakulima',
                'orders': 'Maagizo',
                'messages': 'Ujumbe'
            }
        };
        
        return translations[this.language]?.[key] || key;
    }

    switchLanguage(lang) {
        this.language = lang;
        localStorage.setItem('language', lang);
        this.applyLanguage();
        this.showToast('Language Changed', `Switched to ${lang.toUpperCase()}`, 'success');
    }

    // Performance monitoring
    measurePerformance(name, fn) {
        const startTime = performance.now();
        const result = fn();
        const endTime = performance.now();
        
        console.log(`⏱️ ${name} took ${(endTime - startTime).toFixed(2)}ms`);
        
        return result;
    }

    // Security utilities
    sanitizeHTML(html) {
        const temp = document.createElement('div');
        temp.textContent = html;
        return temp.innerHTML;
    }

    generateCSRFToken() {
        return 'csrf_' + Math.random().toString(36).substr(2, 9);
    }
}

// Override the original utils with enhanced version
const utils = new EnhancedUtils();

// Initialize the enhanced app
document.addEventListener('DOMContentLoaded', () => {
    window.app = new UkulimaApp();
});

// Export for global access
window.utils = utils;
