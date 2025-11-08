// Enhanced Utils with Fixed API Calls
class Utils {
    constructor() {
        this.API_BASE = 'https://ukulima-backend-k23d.onrender.com/api';
        this.currentUser = null;
        this.token = localStorage.getItem('token');
        this.init();
    }

    // Enhanced API request helper with better error handling
    async apiCall(endpoint, options = {}) {
        const url = `${this.API_BASE}${endpoint}`;
        
        console.log(`🌐 API Call: ${options.method || 'GET'} ${url}`);
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Add authorization header if token exists
        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        // Remove body for GET requests
        if ((options.method === 'GET' || !options.method) && options.body) {
            delete config.body;
        }

        // Stringify body if it's an object
        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(url, config);
            console.log(`📡 Response status: ${response.status}`);

            let data;
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                console.warn('Non-JSON response:', text);
                throw new Error('Server returned non-JSON response');
            }

            if (!response.ok) {
                console.error('❌ API Error:', data);
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            console.log('✅ API Call successful:', data);
            return data;

        } catch (error) {
            console.error('💥 API Call failed:', error);
            
            let errorMessage = error.message;
            
            // Handle network errors
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage = 'Network error: Please check your internet connection';
            }
            
            // Handle CORS errors
            if (error.message.includes('CORS')) {
                errorMessage = 'CORS error: Please check backend configuration';
            }

            this.showToast('API Error', errorMessage, 'error');
            throw new Error(errorMessage);
        }
    }

    // Test backend connection
    async testBackendConnection() {
        try {
            console.log('🔗 Testing backend connection...');
            const response = await fetch(this.API_BASE.replace('/api', ''));
            console.log('✅ Backend is reachable');
            return true;
        } catch (error) {
            console.error('❌ Backend connection failed:', error);
            this.showToast('Connection Error', 'Cannot connect to server. Please try again later.', 'error');
            return false;
        }
    }

    // Enhanced user data loading
    async loadUserData() {
        if (!this.token) {
            console.log('🔐 No token found, user not logged in');
            this.currentUser = null;
            this.updateUI();
            return;
        }

        try {
            console.log('👤 Loading user data...');
            const userData = await this.apiCall('/auth/me');
            this.currentUser = userData;
            this.updateUI();
            console.log('✅ User data loaded:', userData);
        } catch (error) {
            console.error('❌ Failed to load user data:', error);
            // Clear invalid token
            this.token = null;
            this.currentUser = null;
            localStorage.removeItem('token');
            this.updateUI();
        }
    }

    // Enhanced navigation
    navigateToPage(page, data = {}) {
        console.log(`📍 Navigating to: ${page}`, data);
        
        // Hide all pages
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });
        
        // Show target page
        const targetPage = document.getElementById(`${page}Page`);
        if (targetPage) {
            targetPage.classList.add('active');
            
            // Update URL hash
            window.location.hash = page;
            
            // Update navigation
            this.updateNavigation(page);
            
            // Initialize page-specific content
            this.initializePage(page, data);
        } else {
            console.warn(`Page not found: ${page}`);
            this.navigateToPage('home');
        }
    }

    updateNavigation(activePage) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === activePage) {
                link.classList.add('active');
            }
        });
    }

    initializePage(page, data) {
        console.log(`🚀 Initializing page: ${page}`);
        
        switch (page) {
            case 'home':
                if (window.products) {
                    products.loadFeaturedProducts();
                }
                this.updateStats();
                break;
                
            case 'products':
                if (window.products) {
                    products.loadProducts(true);
                }
                break;
                
            case 'dashboard':
                if (window.dashboard) {
                    dashboard.loadDashboardData();
                }
                break;
                
            case 'auth':
                // Ensure auth forms are properly set up
                if (window.authManager) {
                    authManager.populateCounties();
                }
                break;
                
            case 'orders':
                if (window.orders && this.isLoggedIn()) {
                    orders.loadOrders();
                }
                break;
                
            case 'messages':
                if (window.messages && this.isLoggedIn()) {
                    messages.loadConversations();
                }
                break;
        }
    }

    // Enhanced UI update
    updateUI() {
        console.log('🎨 Updating UI based on auth state');
        
        const navUser = document.getElementById('navUser');
        const addProductBtn = document.getElementById('addProductBtn');
        const authElements = document.querySelectorAll('.auth-required');
        const guestElements = document.querySelectorAll('.guest-only');

        if (this.isLoggedIn()) {
            // User is logged in
            if (navUser) navUser.style.display = 'block';
            if (addProductBtn && this.isFarmer()) {
                addProductBtn.style.display = 'block';
            }
            
            // Show/hide elements based on auth
            authElements.forEach(el => el.style.display = 'block');
            guestElements.forEach(el => el.style.display = 'none');
            
            // Update user info in navigation
            this.updateUserInfo();
            
        } else {
            // User is not logged in
            if (navUser) navUser.style.display = 'none';
            if (addProductBtn) addProductBtn.style.display = 'none';
            
            // Show/hide elements based on auth
            authElements.forEach(el => el.style.display = 'none');
            guestElements.forEach(el => el.style.display = 'block');
        }
    }

    updateUserInfo() {
        const userInfo = document.getElementById('userInfo');
        if (userInfo && this.currentUser) {
            userInfo.innerHTML = `
                <div class="user-avatar">${this.getUserInitials(this.currentUser.name)}</div>
                <div class="user-details">
                    <div class="user-name">${this.currentUser.name}</div>
                    <div class="user-role">${this.currentUser.role}</div>
                </div>
            `;
        }
    }

    // Enhanced logout
    logout() {
        console.log('🚪 Logging out...');
        
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('token');
        
        this.showToast('Success', 'Logged out successfully', 'success');
        this.navigateToPage('home');
        this.updateUI();
        
        // Clear any user-specific data
        if (window.orders) orders.orders = [];
        if (window.messages) messages.conversations = [];
        if (window.cart) cart.clearCart();
    }

    // Initialize app
    async init() {
        console.log('🚀 Initializing Ukulima Biashara...');
        
        // Test backend connection
        await this.testBackendConnection();
        
        // Load user data if token exists
        await this.loadUserData();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Handle initial page load
        const hash = window.location.hash.substring(1) || 'home';
        this.navigateToPage(hash);
        
        console.log('✅ App initialized successfully');
    }

    setupEventListeners() {
        // Navigation
        document.addEventListener('click', (e) => {
            const navLink = e.target.closest('.nav-link');
            if (navLink) {
                e.preventDefault();
                const page = navLink.getAttribute('data-page');
                this.navigateToPage(page);
            }
        });

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }

        // Mobile menu toggle
        const navToggle = document.getElementById('navToggle');
        const navMenu = document.getElementById('navMenu');
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
            });
        }
    }

    // Enhanced validation functions
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    validatePhone(phone) {
        // Kenyan phone number validation
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length >= 9 && cleaned.length <= 12;
    }

    // Utility functions
    getUserInitials(name) {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES'
        }).format(amount);
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-KE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatRelativeTime(dateString) {
        if (!dateString) return 'Unknown';
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        
        return this.formatDate(dateString);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    showToast(title, message, type = 'info') {
        console.log(`📢 Toast: ${type} - ${title}: ${message}`);
        
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? 'check_circle' : 
                    type === 'error' ? 'error' : 'info';
        
        toast.innerHTML = `
            <span class="material-icons toast-icon">${icon}</span>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">
                <span class="material-icons">close</span>
            </button>
        `;

        toastContainer.appendChild(toast);

        // Show toast with animation
        setTimeout(() => toast.classList.add('show'), 100);

        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        });

        // Auto remove after delay
        setTimeout(() => {
            if (toast.parentNode) {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    }

    // Kenyan counties
    getCounties() {
        return [
            'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika',
            'Machakos', 'Meru', 'Nyeri', 'Garissa', 'Kakamega', 'Malindi',
            'Kitale', 'Lamu', 'Isiolo', 'Nanyuki', 'Naivasha', 'Karatina',
            'Kiambu', 'Kitui', 'Embu', 'Busia', 'Homa Bay', 'Bungoma',
            'Kericho', 'Kilifi', 'Kwale', 'Lamu', 'Mandera', 'Marsabit',
            'Migori', 'Muranga', 'Nyamira', 'Nyandarua', 'Nandi', 'Narok',
            'Samburu', 'Siaya', 'Taita Taveta', 'Tana River', 'Trans Nzoia',
            'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot'
        ];
    }

    getCategories() {
        return {
            'vegetables': 'Vegetables',
            'fruits': 'Fruits',
            'grains': 'Grains',
            'dairy': 'Dairy',
            'poultry': 'Poultry',
            'livestock': 'Livestock',
            'other': 'Other'
        };
    }

    // Auth state checks
    isLoggedIn() {
        return !!this.token && !!this.currentUser;
    }

    getUserRole() {
        return this.currentUser?.role;
    }

    isFarmer() {
        return this.getUserRole() === 'farmer';
    }

    isWholesaler() {
        return this.getUserRole() === 'wholesaler';
    }

    isRetailer() {
        return this.getUserRole() === 'retailer';
    }

    // Stats update for home page
    async updateStats() {
        try {
            // These would come from API in real implementation
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

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}

// Initialize utils
const utils = new Utils();

// Make utils available globally for debugging
window.utils = utils;
window.authManager = authManager;
