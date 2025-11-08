// Fixed Authentication Manager
class AuthManager {
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
        console.log('🔐 Handling login...');
        
        const email = document.getElementById('loginEmail')?.value;
        const password = document.getElementById('loginPassword')?.value;

        if (!email || !password) {
            utils.showToast('Error', 'Please fill in all fields', 'error');
            return;
        }

        if (!utils.validateEmail(email)) {
            utils.showToast('Error', 'Please enter a valid email address', 'error');
            return;
        }

        try {
            const data = await utils.apiCall('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            console.log('✅ Login successful:', data);

            // Store token and user data
            utils.token = data.token;
            utils.currentUser = data;
            localStorage.setItem('token', data.token);

            utils.showToast('Success', 'Logged in successfully!', 'success');
            
            // Update UI and navigate
            utils.updateUI();
            utils.navigateToPage('dashboard');

            // Load user-specific data
            setTimeout(() => {
                if (window.products) products.loadProducts();
                if (window.orders) orders.loadOrders();
                if (window.messages) messages.loadConversations();
            }, 1000);

        } catch (error) {
            console.error('❌ Login failed:', error);
            utils.showToast('Error', error.message || 'Login failed. Please check your credentials.', 'error');
        }
    }

    async handleRegister() {
        console.log('👤 Handling registration...');
        
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

        // Validation
        if (!this.validateRegistration(formData)) return;

        try {
            console.log('📝 Sending registration data:', formData);

            const data = await utils.apiCall('/auth/register', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            console.log('✅ Registration successful:', data);

            utils.showToast('Success', 'Account created successfully!', 'success');
            
            // Auto-login after registration
            utils.token = data.token;
            utils.currentUser = data;
            localStorage.setItem('token', data.token);

            // Update UI and navigate
            utils.updateUI();
            utils.navigateToPage('dashboard');

        } catch (error) {
            console.error('❌ Registration failed:', error);
            utils.showToast('Error', error.message || 'Registration failed. Please try again.', 'error');
        }
    }

    validateRegistration(formData) {
        console.log('🔍 Validating registration data...');
        
        // Check required fields
        const required = ['name', 'email', 'phone', 'password', 'role', 'county', 'subCounty'];
        for (const field of required) {
            if (!formData[field]) {
                utils.showToast('Error', `Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`, 'error');
                return false;
            }
        }

        // Validate email
        if (!utils.validateEmail(formData.email)) {
            utils.showToast('Error', 'Please enter a valid email address', 'error');
            return false;
        }

        // Validate phone (simplified for Kenya)
        if (!this.validateKenyanPhone(formData.phone)) {
            utils.showToast('Error', 'Please enter a valid Kenyan phone number (e.g., 0712345678)', 'error');
            return false;
        }

        // Validate password
        if (formData.password.length < 6) {
            utils.showToast('Error', 'Password must be at least 6 characters long', 'error');
            return false;
        }

        const confirmPassword = document.getElementById('registerConfirmPassword')?.value;
        if (formData.password !== confirmPassword) {
            utils.showToast('Error', 'Passwords do not match', 'error');
            return false;
        }

        console.log('✅ Registration data validated');
        return true;
    }

    validateKenyanPhone(phone) {
        // Simple Kenyan phone validation
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length >= 9 && cleaned.length <= 12;
    }

    switchAuthTab(tabName) {
        console.log('🔄 Switching to tab:', tabName);
        
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
        console.log('🎭 Toggling role fields for:', role);
        
        // Hide all role fields
        document.querySelectorAll('.role-fields').forEach(field => {
            field.style.display = 'none';
        });

        // Show relevant fields
        if (role === 'farmer') {
            const farmerFields = document.getElementById('farmerFields');
            if (farmerFields) farmerFields.style.display = 'block';
        } else if (role === 'wholesaler' || role === 'retailer') {
            const businessFields = document.getElementById('businessFields');
            if (businessFields) businessFields.style.display = 'block';
        }
    }

    // Populate counties dropdown
    populateCounties() {
        console.log('🏞️ Populating counties...');
        const countySelects = document.querySelectorAll('select[id*="County"]');
        const counties = utils.getCounties();

        countySelects.forEach(select => {
            if (select) {
                select.innerHTML = '<option value="">Select County</option>' +
                    counties.map(county => `<option value="${county}">${county}</option>`).join('');
            }
        });
    }

    // Load user profile data
    async loadProfileData() {
        if (!utils.isLoggedIn()) return;

        try {
            const userData = await utils.apiCall('/auth/me');
            this.renderProfileForm(userData);
        } catch (error) {
            console.error('Failed to load profile data:', error);
        }
    }

    renderProfileForm(userData) {
        const profileForm = document.getElementById('profileForm');
        if (!profileForm) return;

        profileForm.innerHTML = `
            <div class="form-group">
                <label for="profileName">Full Name</label>
                <input type="text" id="profileName" value="${userData.name || ''}" required>
            </div>
            <div class="form-group">
                <label for="profileEmail">Email</label>
                <input type="email" id="profileEmail" value="${userData.email || ''}" required>
            </div>
            <div class="form-group">
                <label for="profilePhone">Phone</label>
                <input type="tel" id="profilePhone" value="${userData.phone || ''}" required>
            </div>
            <div class="form-group">
                <label for="profileCounty">County</label>
                <select id="profileCounty" required>
                    <option value="">Select County</option>
                    ${utils.getCounties().map(county => 
                        `<option value="${county}" ${userData.profile?.location?.county === county ? 'selected' : ''}>${county}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="form-group">
                <label for="profileSubCounty">Sub-County</label>
                <input type="text" id="profileSubCounty" value="${userData.profile?.location?.subCounty || ''}" required>
            </div>
            ${userData.role === 'farmer' ? `
                <div class="form-group">
                    <label for="profileFarmDetails">Farm Details</label>
                    <textarea id="profileFarmDetails">${userData.profile?.farmDetails || ''}</textarea>
                </div>
            ` : `
                <div class="form-group">
                    <label for="profileBusinessName">Business Name</label>
                    <input type="text" id="profileBusinessName" value="${userData.profile?.businessName || ''}">
                </div>
            `}
            <button type="submit" class="btn btn-primary btn-full">Update Profile</button>
        `;

        // Add form submit event
        profileForm.onsubmit = async (e) => {
            e.preventDefault();
            await this.updateProfile(userData._id);
        };
    }

    async updateProfile(userId) {
        try {
            const updateData = {
                name: document.getElementById('profileName')?.value,
                email: document.getElementById('profileEmail')?.value,
                phone: document.getElementById('profilePhone')?.value,
                county: document.getElementById('profileCounty')?.value,
                subCounty: document.getElementById('profileSubCounty')?.value
            };

            // Add role-specific data
            if (utils.isFarmer()) {
                updateData.farmDetails = document.getElementById('profileFarmDetails')?.value;
            } else {
                updateData.businessName = document.getElementById('profileBusinessName')?.value;
            }

            await utils.apiCall(`/users/profile`, {
                method: 'PUT',
                body: JSON.stringify(updateData)
            });

            utils.showToast('Success', 'Profile updated successfully!', 'success');
            
            // Reload user data
            await utils.loadUserData();

        } catch (error) {
            console.error('Failed to update profile:', error);
            utils.showToast('Error', 'Failed to update profile', 'error');
        }
    }
}

// Initialize auth manager
const authManager = new AuthManager();
