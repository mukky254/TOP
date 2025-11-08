// Main application initialization
class UkulimaApp {
    constructor() {
        this.init();
    }

    async init() {
        // Hide loading screen
        this.hideLoadingScreen();

        // Initialize utilities
        await utils.init();

        // Populate form data
        authManager.populateCounties();

        // Load initial data
        await this.loadInitialData();

        // Setup service worker for PWA
        this.setupServiceWorker();

        // Setup offline detection
        this.setupOfflineDetection();

        console.log('Ukulima Biashara app initialized successfully!');
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            setTimeout(() => {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }, 1000);
        }
    }

    async loadInitialData() {
        // Load featured products on home page
        if (document.getElementById('homePage').classList.contains('active')) {
            await products.loadFeaturedProducts();
        }

        // Load products on products page
        if (document.getElementById('productsPage').classList.contains('active')) {
            await products.loadProducts(true);
        }

        // Load user-specific data if logged in
        if (utils.isLoggedIn()) {
            await orders.loadOrders();
            await messages.loadConversations();
        }
    }

    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('SW registered: ', registration);
                })
                .catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
                });
        }
    }

    setupOfflineDetection() {
        window.addEventListener('online', () => {
            utils.showToast('You\'re back online', 'Connection restored', 'success');
        });

        window.addEventListener('offline', () => {
            utils.showToast('You\'re offline', 'Some features may not work', 'error');
        });
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new UkulimaApp();
});

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});
