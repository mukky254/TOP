// Fast Utils with Supabase
class FastUtils {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    async init() {
        // User state will be managed by Supabase
        this.setupEventListeners();
        
        const hash = window.location.hash.substring(1) || 'home';
        this.navigateToPage(hash);
    }

    // Fast API calls using Supabase
    async apiCall(endpoint, options = {}) {
        // For backward compatibility, route to appropriate Supabase methods
        switch (endpoint) {
            case '/auth/login':
                return await supabaseManager.signIn(options.body.email, options.body.password);
            case '/auth/register':
                return await supabaseManager.signUp(JSON.parse(options.body));
            case '/auth/me':
                return { user: supabaseManager.currentUser };
            case '/products':
                const filters = this.getFiltersFromURL();
                return await supabaseManager.getProducts(filters);
            default:
                throw new Error(`Endpoint ${endpoint} not implemented`);
        }
    }

    getFiltersFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return {
            category: urlParams.get('category'),
            county: urlParams.get('county'),
            search: urlParams.get('search'),
            minPrice: urlParams.get('minPrice'),
            maxPrice: urlParams.get('maxPrice'),
            sort: urlParams.get('sort')
        };
    }

    // Fast navigation
    navigateToPage(page, data = {}) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        
        const targetPage = document.getElementById(`${page}Page`);
        if (targetPage) {
            targetPage.classList.add('active');
            window.location.hash = page;
            this.updateNavigation(page);
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
        const navUser = document.getElementById('navUser');
        const addProductBtn = document.getElementById('addProductBtn');

        if (navUser) navUser.style.display = isLoggedIn ? 'block' : 'none';
        if (addProductBtn) addProductBtn.style.display = (isLoggedIn && this.isFarmer()) ? 'block' : 'none';

        if (isLoggedIn && this.currentUser) {
            this.updateUserInfo();
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

    // Auth state
    isLoggedIn() {
        return !!supabaseManager.currentUser;
    }

    getUserRole() {
        return supabaseManager.currentUser?.role;
    }

    isFarmer() {
        return this.getUserRole() === 'farmer';
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
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES'
        }).format(amount);
    }

    showToast(title, message, type = 'info') {
        // Simple toast implementation
        console.log(`[${type}] ${title}: ${message}`);
        alert(`${title}: ${message}`); // Simple fallback
    }

    getCounties() {
        return ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Machakos', 'Meru'];
    }

    setupEventListeners() {
        // Basic navigation
        document.addEventListener('click', (e) => {
            const navLink = e.target.closest('.nav-link');
            if (navLink) {
                e.preventDefault();
                const page = navLink.getAttribute('data-page');
                this.navigateToPage(page);
            }
        });
    }
}

// Initialize fast utils
const utils = new FastUtils();
