// Enhanced Cart Manager with 20+ Features
class CartManager {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('cart')) || [];
        this.shippingOptions = [];
        this.coupons = [];
        this.selectedCoupon = null;
        
        this.setupCartEvents();
        this.initializeCartFeatures();
    }

    setupCartEvents() {
        // Cart item management
        this.setupItemManagement();
        
        // Quantity controls
        this.setupQuantityControls();
        
        // Checkout process
        this.setupCheckoutProcess();
        
        // Coupon and discounts
        this.setupDiscounts();
    }

    setupItemManagement() {
        // Remove items
        document.addEventListener('click', (e) => {
            if (e.target.matches('.remove-item-btn') || e.target.closest('.remove-item-btn')) {
                const productId = e.target.closest('[data-product-id]').getAttribute('data-product-id');
                this.removeFromCart(productId);
            }
        });

        // Save for later
        document.addEventListener('click', (e) => {
            if (e.target.matches('.save-for-later-btn') || e.target.closest('.save-for-later-btn')) {
                const productId = e.target.closest('[data-product-id]').getAttribute('data-product-id');
                this.saveForLater(productId);
            }
        });

        // Move to cart from saved
        document.addEventListener('click', (e) => {
            if (e.target.matches('.move-to-cart-btn') || e.target.closest('.move-to-cart-btn')) {
                const productId = e.target.closest('[data-product-id]').getAttribute('data-product-id');
                this.moveToCart(productId);
            }
        });
    }

    setupQuantityControls() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('.quantity-decrease') || e.target.closest('.quantity-decrease')) {
                const productId = e.target.closest('[data-product-id]').getAttribute('data-product-id');
                this.decreaseQuantity(productId);
            }

            if (e.target.matches('.quantity-increase') || e.target.closest('.quantity-increase')) {
                const productId = e.target.closest('[data-product-id]').getAttribute('data-product-id');
                this.increaseQuantity(productId);
            }
        });

        // Quantity input changes
        document.addEventListener('input', utils.debounce((e) => {
            if (e.target.matches('.quantity-input')) {
                const productId = e.target.closest('[data-product-id]').getAttribute('data-product-id');
                const quantity = parseInt(e.target.value) || 1;
                this.updateQuantity(productId, quantity);
            }
        }, 500));
    }

    setupCheckoutProcess() {
        // Proceed to checkout
        document.getElementById('checkoutBtn')?.addEventListener('click', () => {
            this.proceedToCheckout();
        });

        // Continue shopping
        document.getElementById('continueShoppingBtn')?.addEventListener('click', () => {
            app.navigateToPage('products');
        });

        // Shipping method selection
        document.addEventListener('change', (e) => {
            if (e.target.matches('input[name="shippingMethod"]')) {
                this.updateShippingMethod(e.target.value);
            }
        });
    }

    setupDiscounts() {
        // Apply coupon
        document.getElementById('applyCouponBtn')?.addEventListener('click', () => {
            this.applyCoupon();
        });

        // Remove coupon
        document.getElementById('removeCouponBtn')?.addEventListener('click', () => {
            this.removeCoupon();
        });
    }

    initializeCartFeatures() {
        this.loadShippingOptions();
        this.loadAvailableCoupons();
        this.setupCartPersistance();
        this.initializeCartAnalytics();
    }

    async addToCart(productId, quantity = 1) {
        try {
            // Check if product already in cart
            const existingItem = this.items.find(item => item.product === productId);
            
            if (existingItem) {
                // Update quantity
                existingItem.quantity += quantity;
            } else {
                // Get product details
                const product = await utils.apiCall(`/products/${productId}`);
                
                const cartItem = {
                    product: productId,
                    quantity: quantity,
                    price: product.price,
                    productDetails: product,
                    addedAt: new Date().toISOString()
                };
                
                this.items.push(cartItem);
            }

            this.saveCart();
            this.renderCart();
            this.updateCartBadge();
            
            utils.showToast('Success', 'Product added to cart', 'success');
            
            // Track cart addition
            this.trackCartAction('add', productId, quantity);

        } catch (error) {
            console.error('Failed to add to cart:', error);
            utils.showToast('Error', 'Failed to add product to cart', 'error');
        }
    }

    removeFromCart(productId) {
        this.items = this.items.filter(item => item.product !== productId);
        this.saveCart();
        this.renderCart();
        this.updateCartBadge();
        
        utils.showToast('Removed', 'Product removed from cart', 'info');
        
        // Track cart removal
        this.trackCartAction('remove', productId);
    }

    updateQuantity(productId, quantity) {
        const item = this.items.find(item => item.product === productId);
        if (item && quantity > 0) {
            item.quantity = quantity;
            this.saveCart();
            this.renderCart();
            
            // Track quantity change
            this.trackCartAction('update_quantity', productId, quantity);
        }
    }

    increaseQuantity(productId) {
        const item = this.items.find(item => item.product === productId);
        if (item) {
            item.quantity += 1;
            this.saveCart();
            this.renderCart();
        }
    }

    decreaseQuantity(productId) {
        const item = this.items.find(item => item.product === productId);
        if (item && item.quantity > 1) {
            item.quantity -= 1;
            this.saveCart();
            this.renderCart();
        }
    }

    renderCart() {
        const cartContainer = document.getElementById('cartContainer');
        if (!cartContainer) return;

        if (this.items.length === 0) {
            cartContainer.innerHTML = this.createEmptyCartState();
            return;
        }

        cartContainer.innerHTML = `
            <div class="cart-items">
                ${this.items.map(item => this.createCartItem(item)).join('')}
            </div>
            
            <div class="cart-summary">
                ${this.createCartSummary()}
            </div>
        `;

        this.attachCartEventListeners();
    }

    createCartItem(item) {
        const product = item.productDetails;
        const totalPrice = item.price * item.quantity;

        return `
            <div class="cart-item" data-product-id="${item.product}">
                <div class="item-image">
                    ${product.images && product.images.length > 0 ? 
                        `<img src="${product.images[0].url}" alt="${product.name}">` :
                        '<div class="no-image">🌱</div>'
                    }
                </div>
                
                <div class="item-details">
                    <h4 class="item-name">${product.name}</h4>
                    <div class="item-farmer">By: ${product.farmer?.name || 'Unknown'}</div>
                    <div class="item-location">
                        <span class="material-icons">location_on</span>
                        ${product.location?.county || 'N/A'}
                    </div>
                    <div class="item-price">${utils.formatCurrency(item.price)}/${product.unit}</div>
                </div>
                
                <div class="item-controls">
                    <div class="quantity-controls">
                        <button class="btn-icon quantity-decrease" 
                                ${item.quantity <= 1 ? 'disabled' : ''}>
                            <span class="material-icons">remove</span>
                        </button>
                        <input type="number" class="quantity-input" 
                               value="${item.quantity}" min="1" 
                               max="${product.quantity}">
                        <button class="btn-icon quantity-increase"
                                ${item.quantity >= product.quantity ? 'disabled' : ''}>
                            <span class="material-icons">add</span>
                        </button>
                    </div>
                    
                    <div class="item-total">
                        ${utils.formatCurrency(totalPrice)}
                    </div>
                    
                    <div class="item-actions">
                        <button class="btn-icon save-for-later-btn" title="Save for later">
                            <span class="material-icons">bookmark_border</span>
                        </button>
                        <button class="btn-icon remove-item-btn" title="Remove item">
                            <span class="material-icons">delete</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    createCartSummary() {
        const subtotal = this.calculateSubtotal();
        const shipping = this.calculateShipping();
        const discount = this.calculateDiscount();
        const total = subtotal + shipping - discount;

        return `
            <div class="summary-card">
                <h3>Order Summary</h3>
                
                <div class="summary-row">
                    <span>Subtotal (${this.items.length} items):</span>
                    <span>${utils.formatCurrency(subtotal)}</span>
                </div>
                
                <div class="summary-row">
                    <span>Shipping:</span>
                    <span>${utils.formatCurrency(shipping)}</span>
                </div>
                
                ${discount > 0 ? `
                    <div class="summary-row discount">
                        <span>Discount:</span>
                        <span>-${utils.formatCurrency(discount)}</span>
                    </div>
                ` : ''}
                
                <div class="summary-row total">
                    <span>Total:</span>
                    <span>${utils.formatCurrency(total)}</span>
                </div>
                
                <div class="coupon-section">
                    <div class="coupon-input">
                        <input type="text" id="couponCode" placeholder="Enter coupon code">
                        <button class="btn btn-outline" id="applyCouponBtn">Apply</button>
                    </div>
                    ${this.selectedCoupon ? `
                        <div class="applied-coupon">
                            <span>Applied: ${this.selectedCoupon.code}</span>
                            <button class="btn-icon" id="removeCouponBtn">
                                <span class="material-icons">close</span>
                            </button>
                        </div>
                    ` : ''}
                </div>
                
                <div class="checkout-actions">
                    <button class="btn btn-primary btn-large" id="checkoutBtn">
                        <span class="material-icons">shopping_cart_checkout</span>
                        Proceed to Checkout
                    </button>
                    
                    <button class="btn btn-outline btn-large" id="continueShoppingBtn">
                        <span class="material-icons">arrow_back</span>
                        Continue Shopping
                    </button>
                </div>
            </div>
        `;
    }

    calculateSubtotal() {
        return this.items.reduce((total, item) => 
            total + (item.price * item.quantity), 0
        );
    }

    calculateShipping() {
        // Simple shipping calculation based on item count
        return this.items.length * 100; // 100 KSH per item
    }

    calculateDiscount() {
        if (!this.selectedCoupon) return 0;

        const subtotal = this.calculateSubtotal();
        
        switch (this.selectedCoupon.type) {
            case 'percentage':
                return subtotal * (this.selectedCoupon.value / 100);
            case 'fixed':
                return Math.min(this.selectedCoupon.value, subtotal);
            default:
                return 0;
        }
    }

    async proceedToCheckout() {
        if (!utils.isLoggedIn()) {
            utils.showToast('Please Login', 'You need to login to checkout', 'warning');
            app.navigateToPage('auth');
            return;
        }

        if (this.items.length === 0) {
            utils.showToast('Cart Empty', 'Add items to cart before checkout', 'warning');
            return;
        }

        try {
            // Create order from cart items
            const orderData = {
                items: this.items.map(item => ({
                    product: item.product,
                    quantity: item.quantity,
                    price: item.price
                })),
                shippingAddress: this.getShippingAddress(),
                deliveryMethod: this.getSelectedShippingMethod(),
                paymentMethod: 'mpesa' // Default to M-Pesa
            };

            const order = await utils.apiCall('/orders', {
                method: 'POST',
                body: JSON.stringify(orderData)
            });

            // Clear cart
            this.clearCart();
            
            // Navigate to order confirmation
            app.navigateToPage('order-confirmation', { orderId: order._id });
            
            utils.showToast('Success', 'Order placed successfully!', 'success');

        } catch (error) {
            console.error('Checkout failed:', error);
            utils.showToast('Error', 'Failed to place order', 'error');
        }
    }

    // Feature 21: Coupon and Discount System
    async applyCoupon() {
        const couponCode = document.getElementById('couponCode')?.value.trim();
        if (!couponCode) return;

        try {
            // In a real app, this would validate with the backend
            const coupon = this.coupons.find(c => c.code === couponCode.toUpperCase());
            
            if (coupon && this.isCouponValid(coupon)) {
                this.selectedCoupon = coupon;
                this.saveCart();
                this.renderCart();
                
                utils.showToast('Success', `Coupon ${coupon.code} applied!`, 'success');
            } else {
                utils.showToast('Invalid Coupon', 'The coupon code is invalid or expired', 'error');
            }

        } catch (error) {
            console.error('Failed to apply coupon:', error);
            utils.showToast('Error', 'Failed to apply coupon', 'error');
        }
    }

    removeCoupon() {
        this.selectedCoupon = null;
        this.saveCart();
        this.renderCart();
        
        utils.showToast('Coupon Removed', 'Discount has been removed', 'info');
    }

    isCouponValid(coupon) {
        const now = new Date();
        const validFrom = new Date(coupon.validFrom);
        const validTo = new Date(coupon.validTo);
        
        return now >= validFrom && now <= validTo && 
               this.calculateSubtotal() >= (coupon.minOrder || 0);
    }

    // Feature 22: Cart Persistence and Sync
    setupCartPersistance() {
        // Save cart to localStorage on changes
        window.addEventListener('beforeunload', () => {
            this.saveCart();
        });

        // Load cart on startup
        this.loadCart();
    }

    saveCart() {
        const cartData = {
            items: this.items,
            coupon: this.selectedCoupon,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('cart', JSON.stringify(cartData));
    }

    loadCart() {
        try {
            const savedCart = JSON.parse(localStorage.getItem('cart'));
            if (savedCart && savedCart.items) {
                this.items = savedCart.items;
                this.selectedCoupon = savedCart.coupon || null;
                this.updateCartBadge();
            }
        } catch (error) {
            console.error('Failed to load cart:', error);
            this.items = [];
        }
    }

    clearCart() {
        this.items = [];
        this.selectedCoupon = null;
        this.saveCart();
        this.updateCartBadge();
    }

    // Feature 23: Cart Analytics
    initializeCartAnalytics() {
        this.cartAnalytics = {
            itemsAdded: 0,
            itemsRemoved: 0,
            totalValue: 0,
            abandonedCarts: 0
        };
    }

    trackCartAction(action, productId, quantity = 1) {
        const analyticsData = {
            action,
            productId,
            quantity,
            timestamp: new Date().toISOString(),
            cartSize: this.items.length,
            cartValue: this.calculateSubtotal()
        };

        // In a real app, this would send to analytics service
        console.log('Cart Action:', analyticsData);
    }

    // Utility Methods
    updateCartBadge() {
        const badge = document.getElementById('cartBadge');
        const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
        
        if (badge) {
            badge.textContent = totalItems > 0 ? totalItems : '';
            badge.style.display = totalItems > 0 ? 'block' : 'none';
        }
    }

    getItemCount() {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    getCartTotal() {
        return this.calculateSubtotal() + this.calculateShipping() - this.calculateDiscount();
    }

    createEmptyCartState() {
        return `
            <div class="empty-state">
                <div class="empty-icon">🛒</div>
                <h3>Your Cart is Empty</h3>
                <p>Add some fresh products from our marketplace to get started!</p>
                <button class="btn btn-primary" onclick="app.navigateToPage('products')">
                    <span class="material-icons">store</span>
                    Browse Products
                </button>
            </div>
        `;
    }

    attachCartEventListeners() {
        // Additional event listeners for cart interactions
        document.querySelectorAll('.save-for-later-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = btn.closest('[data-product-id]').getAttribute('data-product-id');
                this.saveForLater(productId);
            });
        });
    }

    async saveForLater(productId) {
        // Move item to saved for later list
        const savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];
        const item = this.items.find(item => item.product === productId);
        
        if (item) {
            savedItems.push(item);
            localStorage.setItem('savedItems', JSON.stringify(savedItems));
            this.removeFromCart(productId);
            
            utils.showToast('Saved', 'Item saved for later', 'success');
        }
    }

    async moveToCart(productId) {
        // Move item from saved to cart
        const savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];
        const itemIndex = savedItems.findIndex(item => item.product === productId);
        
        if (itemIndex !== -1) {
            const item = savedItems[itemIndex];
            await this.addToCart(item.product, item.quantity);
            savedItems.splice(itemIndex, 1);
            localStorage.setItem('savedItems', JSON.stringify(savedItems));
        }
    }

    loadShippingOptions() {
        this.shippingOptions = [
            { id: 'pickup', name: 'Pickup from Farmer', cost: 0, description: 'Collect from the farmer directly' },
            { id: 'standard', name: 'Standard Delivery', cost: 200, description: '2-3 business days' },
            { id: 'express', name: 'Express Delivery', cost: 500, description: 'Next day delivery' }
        ];
    }

    loadAvailableCoupons() {
        this.coupons = [
            { 
                code: 'WELCOME10', 
                type: 'percentage', 
                value: 10, 
                minOrder: 1000,
                validFrom: '2024-01-01',
                validTo: '2024-12-31',
                description: '10% off your first order'
            },
            { 
                code: 'FRESH50', 
                type: 'fixed', 
                value: 50, 
                minOrder: 500,
                validFrom: '2024-01-01',
                validTo: '2024-12-31',
                description: '50 KSH off on fresh produce'
            }
        ];
    }

    getShippingAddress() {
        // In a real app, this would get from user profile or form
        return {
            county: 'Nairobi',
            subCounty: 'Westlands',
            street: '123 Market Street',
            additionalInfo: 'Near the main market'
        };
    }

    getSelectedShippingMethod() {
        const selected = document.querySelector('input[name="shippingMethod"]:checked');
        return selected ? selected.value : 'pickup';
    }

    updateShippingMethod(method) {
        this.saveCart();
        this.renderCart();
    }
}

// Initialize cart manager
const cart = new CartManager();
