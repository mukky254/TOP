// Ultra-Fast Authentication with Supabase
class FastAuthManager {
    constructor() {
        this.setupAuthForms();
        this.populateCounties();
    }

    setupAuthForms() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleLogin();
            });
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleRegister();
            });
        }

        // Auth tabs
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = tab.getAttribute('data-tab');
                this.switchAuthTab(tabName);
            });
        });

        // Role-specific fields
        const roleSelect = document.getElementById('registerRole');
        if (roleSelect) {
            roleSelect.addEventListener('change', (e) => {
                this.toggleRoleFields(e.target.value);
            });
        }

        // Get started button
        const getStartedBtn = document.getElementById('getStartedBtn');
        if (getStartedBtn) {
            getStartedBtn.addEventListener('click', () => {
                utils.navigateToPage('auth');
                this.switchAuthTab('register');
            });
        }
    }

    async handleLogin() {
        const email = document.getElementById('loginEmail')?.value;
        const password = document.getElementById('loginPassword')?.value;

        if (!email || !password) {
            utils.showToast('Error', 'Please fill in all fields', 'error');
            return;
        }

        try {
            utils.showToast('Signing in...', 'Please wait', 'info');
            
            await supabaseManager.signIn(email, password);
            // Navigation happens automatically via auth state change
            
        } catch (error) {
            console.error('Login error:', error);
            utils.showToast('Error', error.message, 'error');
        }
    }

    async handleRegister() {
        const formData = {
            name: document.getElementById('registerName')?.value,
            email: document.getElementById('registerEmail')?.value,
            phone: document.getElementById('registerPhone')?.value,
            password: document.getElementById('registerPassword')?.value,
            role: document.getElementById('registerRole')?.value,
            county: document.getElementById('registerCounty')?.value,
            subCounty: document.getElementById('registerSubCounty')?.value
        };

        // Add role-specific data
        if (formData.role === 'farmer') {
            formData.farmDetails = document.getElementById('farmDetails')?.value || '';
        } else {
            formData.businessName = document.getElementById('businessName')?.value || '';
        }

        if (!this.validateRegistration(formData)) return;

        try {
            utils.showToast('Creating account...', 'Please wait', 'info');
            
            const { user } = await supabaseManager.signUp(formData);
            
            if (user) {
                utils.showToast('Success', 'Account created! You can now sign in.', 'success');
                this.switchAuthTab('login');
                
                // Pre-fill login form
                document.getElementById('loginEmail').value = formData.email;
                document.getElementById('loginPassword').value = '';
            }
            
        } catch (error) {
            console.error('Registration error:', error);
            utils.showToast('Error', error.message, 'error');
        }
    }

    validateRegistration(formData) {
        const required = ['name', 'email', 'phone', 'password', 'role', 'county', 'subCounty'];
        for (const field of required) {
            if (!formData[field]) {
                utils.showToast('Error', `Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`, 'error');
                return false;
            }
        }

        if (!utils.validateEmail(formData.email)) {
            utils.showToast('Error', 'Please enter a valid email address', 'error');
            return false;
        }

        if (formData.password.length < 6) {
            utils.showToast('Error', 'Password must be at least 6 characters', 'error');
            return false;
        }

        const confirmPassword = document.getElementById('registerConfirmPassword')?.value;
        if (formData.password !== confirmPassword) {
            utils.showToast('Error', 'Passwords do not match', 'error');
            return false;
        }

        return true;
    }

    switchAuthTab(tabName) {
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName);
        });

        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.toggle('active', form.id === `${tabName}Form`);
        });

        const authTitle = document.getElementById('authTitle');
        const authSubtitle = document.getElementById('authSubtitle');
        
        if (authTitle && authSubtitle) {
            if (tabName === 'login') {
                authTitle.textContent = 'Welcome Back';
                authSubtitle.textContent = 'Sign in to your account';
            } else {
                authTitle.textContent = 'Create Account';
                authSubtitle.textContent = 'Join Ukulima Biashara today';
            }
        }
    }

    toggleRoleFields(role) {
        document.querySelectorAll('.role-fields').forEach(field => {
            field.style.display = 'none';
        });

        if (role === 'farmer') {
            const farmerFields = document.getElementById('farmerFields');
            if (farmerFields) farmerFields.style.display = 'block';
        } else if (role === 'wholesaler' || role === 'retailer') {
            const businessFields = document.getElementById('businessFields');
            if (businessFields) businessFields.style.display = 'block';
        }
    }

    populateCounties() {
        const countySelects = document.querySelectorAll('select[id*="County"]');
        const counties = utils.getCounties();

        countySelects.forEach(select => {
            if (select) {
                select.innerHTML = '<option value="">Select County</option>' +
                    counties.map(county => `<option value="${county}">${county}</option>`).join('');
            }
        });
    }
}

// Initialize auth manager
const authManager = new FastAuthManager();
