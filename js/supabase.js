// Supabase Configuration
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

// Initialize Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class SupabaseManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    async init() {
        // Check current auth status
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            this.currentUser = session.user;
            await this.loadUserProfile(session.user.id);
        }
        
        // Listen for auth changes
        supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                this.currentUser = session.user;
                this.loadUserProfile(session.user.id);
            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null;
            }
            utils.updateUI();
        });
    }

    // Authentication Methods
    async signUp(userData) {
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
                    farmDetails,
                    businessName
                }
            }
        });

        if (error) throw error;
        return data;
    }

    async signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        return data;
    }

    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    }

    // User Profile Management
    async loadUserProfile(userId) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (!error && data) {
            this.currentUser = { ...this.currentUser, ...data };
        }
        return data;
    }

    async updateProfile(profileData) {
        const { data, error } = await supabase
            .from('profiles')
            .update(profileData)
            .eq('id', this.currentUser.id)
            .select()
            .single();

        if (error) throw error;
        this.currentUser = { ...this.currentUser, ...data };
        return data;
    }

    // Products Management
    async getProducts(filters = {}) {
        let query = supabase
            .from('products')
            .select(`
                *,
                profiles:farmer_id (name, phone, county, rating)
            `)
            .eq('is_available', true);

        // Apply filters
        if (filters.category) query = query.eq('category', filters.category);
        if (filters.county) query = query.eq('county', filters.county);
        if (filters.search) query = query.textSearch('name', filters.search);
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
        if (error) throw error;
        return data;
    }

    async createProduct(productData) {
        const { data, error } = await supabase
            .from('products')
            .insert([{ ...productData, farmer_id: this.currentUser.id }])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Orders Management
    async createOrder(orderData) {
        const orderNumber = 'UK' + Date.now();
        
        const { data, error } = await supabase
            .from('orders')
            .insert([{ ...orderData, order_number: orderNumber }])
            .select(`
                *,
                customer:customer_id (name, phone),
                farmer:farmer_id (name, phone),
                order_items:order_items ( * )
            `)
            .single();

        if (error) throw error;
        return data;
    }

    async getOrders() {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                customer:customer_id (name, phone, avatar_url),
                farmer:farmer_id (name, phone, avatar_url),
                order_items:order_items ( *, products (name, images, unit) )
            `)
            .or(`customer_id.eq.${this.currentUser.id},farmer_id.eq.${this.currentUser.id}`)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    // Real-time Subscriptions
    subscribeToOrders(callback) {
        return supabase
            .channel('orders')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'orders' },
                callback
            )
            .subscribe();
    }

    subscribeToMessages(userId, callback) {
        return supabase
            .channel('messages')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${userId}` },
                callback
            )
            .subscribe();
    }
}

// Initialize Supabase Manager
const supabaseManager = new SupabaseManager();
