// Supabase Configuration with YOUR Project
const SUPABASE_URL = 'https://gdwwtmjpmdvfsorwdev.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdkd3d0bWpwbWR2ZnNvcndkZXYiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcwMjE2Mjg0MiwiZXhwIjoyMDE3NzM4ODQyfQ.8a3d6e7f8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5';

// Initialize Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class SupabaseManager {
    constructor() {
        this.currentUser = null;
        this.userProfile = null;
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Supabase...');
        
        // Check current auth status
        const { data: { session }, error } = await supabase.auth.getSession();
        if (session) {
            console.log('✅ User already signed in:', session.user);
            this.currentUser = session.user;
            await this.loadUserProfile(session.user.id);
        }
        
        // Listen for auth changes
        supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('🔐 Auth state changed:', event);
            
            if (event === 'SIGNED_IN' && session) {
                this.currentUser = session.user;
                await this.loadUserProfile(session.user.id);
                utils.showToast('Welcome!', 'Signed in successfully', 'success');
                utils.navigateToPage('dashboard');
            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null;
                this.userProfile = null;
                utils.showToast('Signed out', 'Come back soon!', 'info');
                utils.navigateToPage('home');
            }
            
            utils.updateUI();
        });
    }

    // Fast Authentication Methods
    async signUp(userData) {
        console.log('👤 Signing up user:', userData);
        
        const { email, password, name, phone, role, county, subCounty, farmDetails, businessName } = userData;
        
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                    phone,
                    role,
                    county,
                    subCounty,
                    farmDetails: farmDetails || '',
                    businessName: businessName || ''
                }
            }
        });

        if (error) {
            console.error('❌ Signup error:', error);
            throw error;
        }
        
        console.log('✅ Signup successful:', data);
        return data;
    }

    async signIn(email, password) {
        console.log('🔐 Signing in:', email);
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.error('❌ Signin error:', error);
            throw error;
        }
        
        console.log('✅ Signin successful:', data);
        return data;
    }

    async signOut() {
        console.log('🚪 Signing out...');
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    }

    // User Profile Management
    async loadUserProfile(userId) {
        console.log('📋 Loading user profile for:', userId);
        
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('❌ Profile load error:', error);
            // Create profile if it doesn't exist
            await this.createUserProfile(userId);
            return;
        }

        if (data) {
            this.userProfile = data;
            console.log('✅ Profile loaded:', data);
        }
        
        return data;
    }

    async createUserProfile(userId) {
        console.log('📝 Creating user profile for:', userId);
        
        const userMetadata = this.currentUser.user_metadata;
        const { data, error } = await supabase
            .from('profiles')
            .insert([{
                id: userId,
                name: userMetadata.name,
                phone: userMetadata.phone,
                role: userMetadata.role,
                county: userMetadata.county,
                sub_county: userMetadata.subCounty,
                farm_details: userMetadata.farmDetails,
                business_name: userMetadata.businessName
            }])
            .select()
            .single();

        if (error) {
            console.error('❌ Profile creation error:', error);
            throw error;
        }

        this.userProfile = data;
        console.log('✅ Profile created:', data);
        return data;
    }

    // Fast Products Management
    async getProducts(filters = {}) {
        console.log('🛍️ Loading products with filters:', filters);
        
        let query = supabase
            .from('products')
            .select(`
                *,
                profiles!inner (
                    name,
                    phone,
                    county,
                    rating
                )
            `)
            .eq('is_available', true);

        // Apply filters
        if (filters.category) query = query.eq('category', filters.category);
        if (filters.county) query = query.eq('county', filters.county);
        if (filters.search) query = query.ilike('name', `%${filters.search}%`);
        if (filters.minPrice) query = query.gte('price', filters.minPrice);
        if (filters.maxPrice) query = query.lte('price', filters.maxPrice);
        if (filters.isOrganic) query = query.eq('is_organic', true);
        if (filters.isFresh) query = query.eq('is_fresh', true);

        // Apply sorting
        if (filters.sort === 'price_low') query = query.order('price', { ascending: true });
        else if (filters.sort === 'price_high') query = query.order('price', { ascending: false });
        else if (filters.sort === 'rating') query = query.order('rating', { ascending: false });
        else query = query.order('created_at', { ascending: false });

        const { data, error } = await query;
        
        if (error) {
            console.error('❌ Products load error:', error);
            throw error;
        }
        
        console.log(`✅ Loaded ${data?.length || 0} products`);
        return data || [];
    }

    async createProduct(productData) {
        console.log('➕ Creating product:', productData);
        
        if (!this.currentUser) {
            throw new Error('Must be logged in to create products');
        }

        const { data, error } = await supabase
            .from('products')
            .insert([{ 
                ...productData, 
                farmer_id: this.currentUser.id 
            }])
            .select()
            .single();

        if (error) {
            console.error('❌ Product creation error:', error);
            throw error;
        }
        
        console.log('✅ Product created:', data);
        return data;
    }

    // Fast Orders Management
    async createOrder(orderData) {
        console.log('📦 Creating order:', orderData);
        
        const orderNumber = 'UK' + Date.now() + Math.random().toString(36).substr(2, 5);
        
        const { data, error } = await supabase
            .from('orders')
            .insert([{ 
                ...orderData, 
                order_number: orderNumber,
                customer_id: this.currentUser.id 
            }])
            .select()
            .single();

        if (error) {
            console.error('❌ Order creation error:', error);
            throw error;
        }
        
        console.log('✅ Order created:', data);
        return data;
    }

    async getOrders() {
        console.log('📋 Loading orders...');
        
        if (!this.currentUser) return [];

        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                customer:customer_id (name, phone),
                farmer:farmer_id (name, phone)
            `)
            .or(`customer_id.eq.${this.currentUser.id},farmer_id.eq.${this.currentUser.id}`)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Orders load error:', error);
            return [];
        }
        
        console.log(`✅ Loaded ${data?.length || 0} orders`);
        return data || [];
    }

    // Real-time Features
    subscribeToOrders(callback) {
        return supabase
            .channel('orders')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'orders' },
                callback
            )
            .subscribe();
    }

    // Utility Methods
    getCurrentUser() {
        return {
            ...this.currentUser,
            ...this.userProfile
        };
    }

    isLoggedIn() {
        return !!this.currentUser;
    }

    getUserRole() {
        return this.userProfile?.role || this.currentUser?.user_metadata?.role;
    }
}

// Initialize Supabase Manager
const supabaseManager = new SupabaseManager();
