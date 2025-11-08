// Orders management
class OrdersManager {
    constructor() {
        this.orders = [];
        this.cart = JSON.parse(localStorage.getItem('cart')) || [];
        this.setupOrderEvents();
    }

    setupOrderEvents() {
        // Cart management would be implemented here
    }

    async loadOrders() {
        if (!utils.isLoggedIn()) return;

        try {
            const data = await utils.apiCall('/orders/myorders');
            this.orders = data;
            this.renderOrders();
            this.updateOrderBadge();
        } catch (error) {
            console.error('Failed to load orders:', error);
        }
    }

    renderOrders() {
        // Implementation for rendering orders
    }

    async addToCart(productId) {
        if (!utils.isLoggedIn()) {
            utils.showToast('Info', 'Please login to add items to cart', 'info');
            utils.navigateToPage('auth');
            return;
        }

        try {
            // Get product details
            const product = await utils.apiCall(`/products/${productId}`);
            
            const cartItem = {
                product: productId,
                quantity: product.minOrder || 1,
                price: product.price,
                productDetails: product
            };

            this.cart.push(cartItem);
            this.saveCart();
            
            utils.showToast('Success', 'Product added to cart', 'success');
        } catch (error) {
            console.error('Failed to add to cart:', error);
        }
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
    }

    updateOrderBadge() {
        const pendingOrders = this.orders.filter(order => 
            ['pending', 'confirmed', 'preparing'].includes(order.status)
        ).length;

        const badge = document.getElementById('orderBadge');
        if (badge) {
            badge.textContent = pendingOrders > 0 ? pendingOrders : '';
            badge.style.display = pendingOrders > 0 ? 'block' : 'none';
        }
    }
}

// Initialize orders manager
const orders = new OrdersManager();
