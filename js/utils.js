// Utility functions for Ukulima Biashara
class Utils {
    constructor() {
        this.API_BASE = 'https://ukulima-backend-k23d.onrender.com/api';
        this.currentUser = null;
        this.token = localStorage.getItem('token');
    }

    // API request helper
    async apiCall(endpoint, options = {}) {
        const url = `${this.API_BASE}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('API Call Error:', error);
            this.showToast('Error', error.message, 'error');
            throw error;
        }
    }

    // Show toast notification
    showToast(title, message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
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
        `;

        toastContainer.appendChild(toast);

        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);

        // Remove toast after delay
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    // Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES'
        }).format(amount);
    }

    // Format date
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-KE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Format relative time
    formatRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        
        return this.formatDate(dateString);
    }

    // Debounce function
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

    // Validate email
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Validate phone (Kenyan)
    validatePhone(phone) {
        const re = /^(\+?254|0)?[17]\d{8}$/;
        return re.test(phone.replace(/\s/g, ''));
    }

    // Generate random ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Get user initials
    getUserInitials(name) {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    // Calculate average rating
    calculateAverageRating(reviews) {
        if (!reviews || reviews.length === 0) return 0;
        const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
        return (sum / reviews.length).toFixed(1);
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

    // Product categories
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

    // Units
    getUnits() {
        return ['kg', 'g', 'piece', 'bunch', 'crate', 'bag', 'liter'];
    }

    // Check if user is logged in
    isLoggedIn() {
        return !!this.token && !!this.currentUser;
    }

    // Get user role
    getUserRole() {
        return this.currentUser?.role;
    }

    // Check if user is farmer
    isFarmer() {
        return this.getUserRole() === 'farmer';
    }

    // Check if user is wholesaler
    isWholesaler() {
        return this.getUserRole() === 'wholesaler';
    }

    // Check if user is retailer
    isRetailer() {
        return this.getUserRole() === 'retailer';
    }

    // Logout user
    logout() {
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('token');
        this.showToast('Success', 'Logged out successfully', 'success');
        this.navigateToPage('home');
        this.updateUI();
    }

    // Navigate to page
    navigateToPage(page) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        
        // Show target page
        const targetPage = document.getElementById(`${page}Page`);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === page) {
                link.classList.add('active');
            }
        });

        // Update URL hash
        window.location.hash = page;
    }

    // Update UI based on auth state
    updateUI() {
        const navUser = document.getElementById('navUser');
        const addProductBtn = document.getElementById('addProductBtn');
        const authPage = document.getElementById('authPage');

        if (this.isLoggedIn()) {
            navUser.style.display = 'block';
            if (this.isFarmer()) {
                addProductBtn.style.display = 'block';
            }
            authPage.style.display = 'none';
            
            // Update user info
            const userInfo = document.getElementById('userInfo');
            if (userInfo) {
                userInfo.innerHTML = `
                    <div class="user-avatar">${this.getUserInitials(this.currentUser.name)}</div>
                    <div class="user-details">
                        <div class="user-name">${this.currentUser.name}</div>
                        <div class="user-role">${this.currentUser.role}</div>
                    </div>
                `;
            }
        } else {
            navUser.style.display = 'none';
            addProductBtn.style.display = 'none';
        }
    }

    // Load user data
    async loadUserData() {
        if (!this.token) return;

        try {
            const userData = await this.apiCall('/auth/me');
            this.currentUser = userData;
            this.updateUI();
        } catch (error) {
            console.error('Failed to load user data:', error);
            this.logout();
        }
    }

    // Initialize app
    async init() {
        await this.loadUserData();
        this.setupEventListeners();
        
        // Handle hash navigation
        const hash = window.location.hash.substring(1) || 'home';
        this.navigateToPage(hash);
    }

    // Setup event listeners
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                this.navigateToPage(page);
            });
        });

        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.logout();
        });

        // Auth tabs
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.getAttribute('data-tab');
                this.switchAuthTab(tabName);
            });
        });

        // Role-specific fields
        document.getElementById('registerRole')?.addEventListener('change', (e) => {
            this.toggleRoleFields(e.target.value);
        });
    }

    // Switch auth tab
    switchAuthTab(tabName) {
        // Update tabs
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName);
        });

        // Update forms
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.toggle('active', form.id === `${tabName}Form`);
        });

        // Update titles
        const authTitle = document.getElementById('authTitle');
        const authSubtitle = document.getElementById('authSubtitle');
        
        if (tabName === 'login') {
            authTitle.textContent = 'Welcome Back';
            authSubtitle.textContent = 'Sign in to your account';
        } else {
            authTitle.textContent = 'Create Account';
            authSubtitle.textContent = 'Join Ukulima Biashara today';
        }
    }

    // Toggle role-specific fields
    toggleRoleFields(role) {
        // Hide all role fields
        document.querySelectorAll('.role-fields').forEach(field => {
            field.style.display = 'none';
        });

        // Show relevant fields
        if (role === 'farmer') {
            document.getElementById('farmerFields').style.display = 'block';
        } else if (role === 'wholesaler' || role === 'retailer') {
            document.getElementById('businessFields').style.display = 'block';
        }
    }
}

// Initialize utils
const utils = new Utils();
