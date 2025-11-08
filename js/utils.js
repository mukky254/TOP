// Optimized Utils for Supabase
class FastUtils {
    constructor() {
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Fast Utils...');
        this.setupEventListeners();
        
        // Handle initial page load
        const hash = window.location.hash.substring(1) || 'home';
        this.navigateToPage(hash);
        
        console.log('✅ Fast Utils initialized');
    }

    // Fast navigation
    navigateToPage(page, data = {}) {
        console.log(`📍 Navigating to: ${page}`);
        
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        
        const targetPage = document.getElementById(`${page}Page`);
        if (targetPage) {
            targetPage.classList.add('active');
            window.location.hash = page;
            this.updateNavigation(page);
            
            // Initialize page content
            setTimeout(() => this.initializePage(page), 100);
        }
    }

    initializePage(page) {
        switch (page) {
            case 'home':
                this.loadHomePage();
                break;
            case 'products':
                this.loadProductsPage();
                break;
            case 'dashboard':
                this.loadDashboardPage();
                break;
        }
    }

    async loadHomePage() {
        // Load featured products
        if (window.products) {
            products.loadFeaturedProducts();
        }
        this.updateStats();
    }

    async loadProductsPage() {
        if (window.products) {
            products.loadProducts(true);
        }
    }

    async loadDashboardPage() {
        if (window.dashboard && this.isLoggedIn()) {
            dashboard.loadDashboardData();
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

    // Fast UI updates
    updateUI() {
        const isLoggedIn = this.isLoggedIn();
        const user = this.getCurrentUser();
        
        console.log('🎨 Updating UI, logged in:', isLoggedIn);

        // Update navigation
        const navUser = document.getElementById('navUser');
        const addProductBtn = document.getElementById('addProductBtn');
        const authElements = document.querySelectorAll('.auth-required');
        const guestElements = document.querySelectorAll('.guest-only');

        if (navUser) navUser.style.display = isLoggedIn ? 'block' : 'none';
        if (addProductBtn) addProductBtn.style.display = (isLoggedIn && this.isFarmer()) ? 'block' : 'none';

        authElements.forEach(el => el.style.display = isLoggedIn ? 'block' : 'none');
        guestElements.forEach(el => el.style.display = isLoggedIn ? 'none' : 'block');

        if (isLoggedIn && user) {
            this.updateUserInfo(user);
        }
    }

    updateUserInfo(user) {
        const userInfo = document.getElementById('userInfo');
        if (userInfo) {
            const userName = user.name || user.user_metadata?.name || 'User';
            const userRole = user.role || user.user_metadata?.role || 'member';
            
            userInfo.innerHTML = `
                <div class="user-avatar">${this.getUserInitials(userName)}</div>
                <div class="user-details">
                    <div class="user-name">${userName}</div>
                    <div class="user-role">${userRole}</div>
                </div>
            `;
        }
    }

    // Auth state
    isLoggedIn() {
        return supabaseManager.isLoggedIn();
    }

    getCurrentUser() {
        return supabaseManager.getCurrentUser();
    }

    getUserRole() {
        return supabaseManager.getUserRole();
    }

    isFarmer() {
        return this.getUserRole() === 'farmer';
    }

    async logout() {
        try {
            await supabaseManager.signOut();
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    // Utility functions
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    getUserInitials(name) {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }

    formatCurrency(amount) {
        if (!amount) return 'KES 0';
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 0
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

    showToast(title, message, type = 'info') {
        // Simple toast implementation
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <strong>${title}:</strong> ${message}
            </div>
            <button class="toast-close">&times;</button>
        `;
        
        const container = document.getElementById('toastContainer') || document.body;
        container.appendChild(toast);
        
        // Auto remove
        setTimeout(() => {
            toast.remove();
        }, 5000);
        
        // Close button
        toast.querySelector('.toast-close').onclick = () => toast.remove();
    }

    getCounties() {
        return [
            'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika',
            'Machakos', 'Meru', 'Nyeri', 'Garissa', 'Kakamega', 'Malindi',
            'Kitale', 'Lamu', 'Isiolo', 'Nanyuki', 'Naivasha', 'Karatina'
        ];
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

        // Mobile menu
        const navToggle = document.getElementById('navToggle');
        const navMenu = document.getElementById('navMenu');
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
            });
        }
    }

    updateStats() {
        // Simple stats for home page
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
    }
}

// Initialize fast utils
const utils = new FastUtils();
