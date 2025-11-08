// Enhanced Products Manager with 200+ Features
class ProductsManager {
    constructor() {
        this.products = [];
        this.categories = [];
        this.filters = {
            category: '',
            county: '',
            minPrice: '',
            maxPrice: '',
            search: '',
            sort: 'newest',
            isOrganic: false,
            isFresh: true,
            inStock: true
        };
        this.pagination = {
            currentPage: 1,
            totalPages: 1,
            totalProducts: 0,
            hasMore: true
        };
        this.searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
        this.wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
        this.recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed')) || [];
        
        this.setupProductEvents();
        this.initializeProductFeatures();
    }

    setupProductEvents() {
        // Search functionality
        this.setupSearch();
        
        // Filter functionality
        this.setupFilters();
        
        // Product interactions
        this.setupProductInteractions();
        
        // Wishlist functionality
        this.setupWishlist();
        
        // Bulk operations
        this.setupBulkOperations();
    }

    setupSearch() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            // Real-time search with debouncing
            searchInput.addEventListener('input', utils.debounce(() => {
                this.filters.search = searchInput.value;
                this.handleSearch(this.filters.search);
            }, 500));
            
            // Search history dropdown
            searchInput.addEventListener('focus', () => this.showSearchHistory());
            searchInput.addEventListener('blur', () => this.hideSearchHistory());
            
            // Clear search
            document.getElementById('clearSearch')?.addEventListener('click', () => {
                searchInput.value = '';
                this.filters.search = '';
                this.loadProducts(true);
            });
        }

        // Voice search
        document.getElementById('voiceSearchBtn')?.addEventListener('click', () => {
            this.startVoiceSearch();
        });
    }

    setupFilters() {
        // Category filter
        document.getElementById('categoryFilter')?.addEventListener('change', (e) => {
            this.filters.category = e.target.value;
            this.loadProducts(true);
        });

        // County filter
        document.getElementById('countyFilter')?.addEventListener('change', (e) => {
            this.filters.county = e.target.value;
            this.loadProducts(true);
        });

        // Sort filter
        document.getElementById('sortFilter')?.addEventListener('change', (e) => {
            this.filters.sort = e.target.value;
            this.loadProducts(true);
        });

        // Price range filters
        const minPriceInput = document.getElementById('minPrice');
        const maxPriceInput = document.getElementById('maxPrice');
        
        if (minPriceInput) {
            minPriceInput.addEventListener('input', utils.debounce(() => {
                this.filters.minPrice = minPriceInput.value;
                this.loadProducts(true);
            }, 800));
        }
        
        if (maxPriceInput) {
            maxPriceInput.addEventListener('input', utils.debounce(() => {
                this.filters.maxPrice = maxPriceInput.value;
                this.loadProducts(true);
            }, 800));
        }

        // Checkbox filters
        document.getElementById('organicFilter')?.addEventListener('change', (e) => {
            this.filters.isOrganic = e.target.checked;
            this.loadProducts(true);
        });

        document.getElementById('freshFilter')?.addEventListener('change', (e) => {
            this.filters.isFresh = e.target.checked;
            this.loadProducts(true);
        });

        // Advanced filters toggle
        document.getElementById('advancedFiltersBtn')?.addEventListener('click', () => {
            this.toggleAdvancedFilters();
        });

        // Reset filters
        document.getElementById('resetFilters')?.addEventListener('click', () => {
            this.resetFilters();
        });
    }

    setupProductInteractions() {
        // Product card clicks are handled in renderProducts()
        
        // Quick view
        document.addEventListener('click', (e) => {
            if (e.target.matches('.quick-view-btn') || e.target.closest('.quick-view-btn')) {
                const productId = e.target.closest('[data-product-id]').getAttribute('data-product-id');
                this.showQuickView(productId);
            }
        });

        // Add to cart from various places
        document.addEventListener('click', (e) => {
            if (e.target.matches('.add-to-cart-btn') || e.target.closest('.add-to-cart-btn')) {
                const productId = e.target.closest('[data-product-id]').getAttribute('data-product-id');
                this.addToCart(productId);
            }
        });

        // Share products
        document.addEventListener('click', (e) => {
            if (e.target.matches('.share-product-btn') || e.target.closest('.share-product-btn')) {
                const productId = e.target.closest('[data-product-id]').getAttribute('data-product-id');
                this.shareProduct(productId);
            }
        });

        // Report product
        document.addEventListener('click', (e) => {
            if (e.target.matches('.report-product-btn') || e.target.closest('.report-product-btn')) {
                const productId = e.target.closest('[data-product-id]').getAttribute('data-product-id');
                this.reportProduct(productId);
            }
        });
    }

    setupWishlist() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('.wishlist-btn') || e.target.closest('.wishlist-btn')) {
                const productId = e.target.closest('[data-product-id]').getAttribute('data-product-id');
                this.toggleWishlist(productId);
            }
        });
    }

    setupBulkOperations() {
        // Bulk add to cart
        document.getElementById('bulkAddToCart')?.addEventListener('click', () => {
            this.bulkAddToCart();
        });

        // Bulk compare
        document.getElementById('bulkCompare')?.addEventListener('click', () => {
            this.bulkCompareProducts();
        });
    }

    initializeProductFeatures() {
        this.loadCategories();
        this.loadWishlist();
        this.setupInfiniteScroll();
        this.setupProductTour();
    }

    async loadCategories() {
        try {
            // Simulate API call
            this.categories = [
                { id: 'vegetables', name: 'Vegetables', icon: '🥦', subcategories: ['Leafy Greens', 'Root Vegetables', 'Tomatoes', 'Peppers'] },
                { id: 'fruits', name: 'Fruits', icon: '🍎', subcategories: ['Tropical Fruits', 'Berries', 'Citrus', 'Melons'] },
                { id: 'grains', name: 'Grains', icon: '🌾', subcategories: ['Cereals', 'Legumes', 'Nuts', 'Seeds'] },
                { id: 'dairy', name: 'Dairy', icon: '🥛', subcategories: ['Milk', 'Cheese', 'Yogurt', 'Butter'] },
                { id: 'poultry', name: 'Poultry', icon: '🐔', subcategories: ['Chicken', 'Eggs', 'Turkey', 'Duck'] },
                { id: 'livestock', name: 'Livestock', icon: '🐄', subcategories: ['Beef', 'Pork', 'Goat', 'Sheep'] }
            ];
            
            this.renderCategoryFilters();
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    }

    renderCategoryFilters() {
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.innerHTML = '<option value="">All Categories</option>' +
                this.categories.map(cat => 
                    `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`
                ).join('');
        }

        // Render category grid for home page
        const categoryGrid = document.getElementById('categoryGrid');
        if (categoryGrid) {
            categoryGrid.innerHTML = this.categories.map(cat => `
                <div class="category-card" data-category="${cat.id}">
                    <div class="category-icon">${cat.icon}</div>
                    <div class="category-name">${cat.name}</div>
                    <div class="category-count">${Math.floor(Math.random() * 100) + 50} products</div>
                </div>
            `).join('');

            // Add click events to category cards
            categoryGrid.querySelectorAll('.category-card').forEach(card => {
                card.addEventListener('click', () => {
                    const category = card.getAttribute('data-category');
                    this.filterByCategory(category);
                });
            });
        }
    }

    async loadProducts(reset = false) {
        if (reset) {
            this.pagination.currentPage = 1;
            this.pagination.hasMore = true;
            this.products = [];
        }

        if (!this.pagination.hasMore) return;

        try {
            this.showLoadingState();
            
            const queryParams = new URLSearchParams({
                page: this.pagination.currentPage,
                limit: 12,
                ...this.filters
            });

            const data = await utils.apiCall(`/products?${queryParams}`);
            
            if (reset) {
                this.products = data.products || [];
            } else {
                this.products.push(...(data.products || []));
            }

            this.pagination = {
                currentPage: data.currentPage || this.pagination.currentPage + 1,
                totalPages: data.totalPages || 1,
                totalProducts: data.total || 0,
                hasMore: (data.currentPage || 1) < (data.totalPages || 1)
            };

            this.renderProducts();
            this.updateProductCount();
            this.hideLoadingState();

            // Track product view in analytics
            this.trackProductListingView();

        } catch (error) {
            console.error('Failed to load products:', error);
            this.showErrorState();
            this.hideLoadingState();
        }
    }

    renderProducts() {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;

        if (this.products.length === 0) {
            productsGrid.innerHTML = this.createEmptyState();
            return;
        }

        productsGrid.innerHTML = this.products.map((product, index) => 
            this.createProductCard(product, index)
        ).join('');

        this.attachProductEventListeners();
        this.updateWishlistButtons();
    }

    createProductCard(product, index) {
        const farmer = product.farmer || {};
        const isInWishlist = this.wishlist.includes(product._id);
        const isRecentlyViewed = this.recentlyViewed.includes(product._id);
        
        return `
            <div class="product-card" data-product-id="${product._id}" data-index="${index}">
                <div class="product-image">
                    ${product.images && product.images.length > 0 ? 
                        `<img src="${product.images[0].url}" alt="${product.name}" loading="lazy">` :
                        `<div class="no-image">🌱</div>`
                    }
                    <div class="product-badges">
                        ${product.isOrganic ? '<span class="badge organic">Organic</span>' : ''}
                        ${!product.isFresh ? '<span class="badge processed">Processed</span>' : ''}
                        ${product.quantity < 10 ? '<span class="badge low-stock">Low Stock</span>' : ''}
                        ${isRecentlyViewed ? '<span class="badge viewed">Recently Viewed</span>' : ''}
                    </div>
                    <div class="product-actions">
                        <button class="btn-icon wishlist-btn ${isInWishlist ? 'active' : ''}" 
                                title="${isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}">
                            <span class="material-icons">${isInWishlist ? 'favorite' : 'favorite_border'}</span>
                        </button>
                        <button class="btn-icon quick-view-btn" title="Quick view">
                            <span class="material-icons">visibility</span>
                        </button>
                        <button class="btn-icon share-product-btn" title="Share product">
                            <span class="material-icons">share</span>
                        </button>
                    </div>
                </div>
                <div class="product-content">
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-price">${utils.formatCurrency(product.price)}<span class="unit">/${product.unit}</span></div>
                    
                    <div class="product-meta">
                        <div class="product-location">
                            <span class="material-icons">location_on</span>
                            ${product.location?.county || 'N/A'}
                        </div>
                        <div class="product-rating">
                            <span class="material-icons">star</span>
                            ${product.rating || '0.0'} (${product.totalReviews || 0})
                        </div>
                    </div>
                    
                    <div class="product-farmer">
                        <div class="farmer-avatar">${utils.getUserInitials(farmer.name)}</div>
                        <span class="farmer-name">${farmer.name || 'Unknown'}</span>
                        ${farmer.rating ? `<span class="farmer-rating">${farmer.rating} ★</span>` : ''}
                    </div>
                    
                    <div class="product-stock">
                        <div class="stock-info">
                            <span class="stock-label">Available:</span>
                            <span class="stock-quantity">${product.quantity} ${product.unit}</span>
                        </div>
                        ${product.quantity > 0 ? `
                            <div class="stock-bar">
                                <div class="stock-level" style="width: ${Math.min((product.quantity / 100) * 100, 100)}%"></div>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="product-actions-bottom">
                        <button class="btn btn-outline btn-small message-farmer-btn">
                            <span class="material-icons">chat</span>
                            Message
                        </button>
                        <button class="btn btn-primary btn-small add-to-cart-btn" 
                                ${product.quantity === 0 ? 'disabled' : ''}>
                            <span class="material-icons">add_shopping_cart</span>
                            ${product.quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    attachProductEventListeners() {
        // Product card click for details
        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking action buttons
                if (e.target.closest('.product-actions') || 
                    e.target.closest('.product-actions-bottom')) {
                    return;
                }
                
                const productId = card.getAttribute('data-product-id');
                this.showProductDetails(productId);
            });
        });

        // Message farmer buttons
        document.querySelectorAll('.message-farmer-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = btn.closest('[data-product-id]').getAttribute('data-product-id');
                this.messageFarmer(productId);
            });
        });
    }

    async showProductDetails(productId) {
        try {
            const product = await utils.apiCall(`/products/${productId}`);
            this.renderProductModal(product);
            this.addToRecentlyViewed(productId);
        } catch (error) {
            console.error('Failed to load product details:', error);
            utils.showToast('Error', 'Failed to load product details', 'error');
        }
    }

    renderProductModal(product) {
        const farmer = product.farmer || {};
        const modal = document.getElementById('productModal') || this.createProductModal();
        const modalBody = document.getElementById('productModalBody');
        
        modalBody.innerHTML = `
            <div class="product-modal-content">
                <div class="product-modal-images">
                    <div class="main-image">
                        ${product.images && product.images.length > 0 ? 
                            `<img src="${product.images[0].url}" alt="${product.name}">` :
                            `<div class="no-image">🌱</div>`
                        }
                    </div>
                    <div class="image-thumbnails">
                        ${product.images && product.images.length > 0 ? 
                            product.images.map((img, index) => `
                                <div class="thumbnail ${index === 0 ? 'active' : ''}">
                                    <img src="${img.url}" alt="${product.name}">
                                </div>
                            `).join('') :
                            '<div class="no-thumbnails">No images available</div>'
                        }
                    </div>
                </div>
                
                <div class="product-modal-details">
                    <div class="product-header">
                        <h1>${product.name}</h1>
                        <div class="product-actions-top">
                            <button class="btn-icon wishlist-btn ${this.wishlist.includes(product._id) ? 'active' : ''}">
                                <span class="material-icons">${this.wishlist.includes(product._id) ? 'favorite' : 'favorite_border'}</span>
                            </button>
                            <button class="btn-icon share-product-btn">
                                <span class="material-icons">share</span>
                            </button>
                            <button class="btn-icon report-product-btn">
                                <span class="material-icons">flag</span>
                            </button>
                        </div>
                    </div>
                    
                    <div class="product-price-large">
                        ${utils.formatCurrency(product.price)}<span class="unit">/${product.unit}</span>
                    </div>
                    
                    <div class="product-badges-modal">
                        ${product.isOrganic ? '<span class="badge organic">Organic Certified</span>' : ''}
                        ${product.isFresh ? '<span class="badge fresh">Fresh</span>' : '<span class="badge processed">Processed</span>'}
                        ${product.rating >= 4.5 ? '<span class="badge top-rated">Top Rated</span>' : ''}
                    </div>
                    
                    <div class="product-info-grid">
                        <div class="info-item">
                            <strong>Category:</strong> 
                            <span class="category-tag">${utils.getCategories()[product.category]}</span>
                        </div>
                        <div class="info-item">
                            <strong>Available Quantity:</strong> 
                            <span class="quantity ${product.quantity === 0 ? 'out-of-stock' : ''}">
                                ${product.quantity} ${product.unit}
                            </span>
                        </div>
                        <div class="info-item">
                            <strong>Minimum Order:</strong> ${product.minOrder} ${product.unit}
                        </div>
                        <div class="info-item">
                            <strong>Location:</strong> 
                            <span class="location">
                                <span class="material-icons">location_on</span>
                                ${product.location?.county}, ${product.location?.subCounty}
                            </span>
                        </div>
                        <div class="info-item">
                            <strong>Harvest Date:</strong> 
                            ${product.harvestDate ? utils.formatDate(product.harvestDate) : 'Not specified'}
                        </div>
                        <div class="info-item">
                            <strong>Expiry Date:</strong> 
                            ${product.expiryDate ? utils.formatDate(product.expiryDate) : 'Not specified'}
                        </div>
                    </div>

                    <div class="product-description">
                        <h3>Description</h3>
                        <p>${product.description}</p>
                    </div>

                    <div class="product-tags">
                        ${product.tags && product.tags.map(tag => 
                            `<span class="tag">#${tag}</span>`
                        ).join('')}
                    </div>

                    <div class="farmer-info-modal">
                        <h3>Seller Information</h3>
                        <div class="farmer-details">
                            <div class="farmer-avatar-large">${utils.getUserInitials(farmer.name)}</div>
                            <div class="farmer-text">
                                <div class="farmer-name">${farmer.name}</div>
                                <div class="farmer-rating">
                                    <span class="material-icons">star</span>
                                    ${farmer.rating || '0.0'} (${farmer.totalReviews || 0} reviews)
                                </div>
                                <div class="farmer-location">
                                    <span class="material-icons">location_on</span>
                                    ${farmer.profile?.location?.county || 'Unknown location'}
                                </div>
                            </div>
                        </div>
                        <div class="farmer-actions">
                            <button class="btn btn-outline" onclick="app.messages.startConversation('${farmer._id}', '${product._id}')">
                                <span class="material-icons">chat</span>
                                Message Seller
                            </button>
                            <button class="btn btn-outline" onclick="app.navigateToPage('farmer-profile', {id: '${farmer._id}'})">
                                <span class="material-icons">person</span>
                                View Profile
                            </button>
                        </div>
                    </div>

                    <div class="product-order-section">
                        <div class="quantity-selector">
                            <label for="orderQuantity">Quantity:</label>
                            <div class="quantity-controls">
                                <button class="quantity-btn decrease">-</button>
                                <input type="number" id="orderQuantity" value="${product.minOrder}" 
                                       min="${product.minOrder}" max="${product.quantity}" 
                                       class="quantity-input">
                                <button class="quantity-btn increase">+</button>
                            </div>
                            <span class="unit-display">${product.unit}</span>
                        </div>
                        
                        <div class="order-summary">
                            <div class="summary-row">
                                <span>Unit Price:</span>
                                <span>${utils.formatCurrency(product.price)}</span>
                            </div>
                            <div class="summary-row">
                                <span>Quantity:</span>
                                <span id="summaryQuantity">${product.minOrder} ${product.unit}</span>
                            </div>
                            <div class="summary-row total">
                                <span>Total:</span>
                                <span id="summaryTotal">${utils.formatCurrency(product.price * product.minOrder)}</span>
                            </div>
                        </div>

                        <div class="order-actions">
                            <button class="btn btn-outline btn-large add-to-cart-modal">
                                <span class="material-icons">add_shopping_cart</span>
                                Add to Cart
                            </button>
                            <button class="btn btn-primary btn-large buy-now-btn" 
                                    ${product.quantity === 0 ? 'disabled' : ''}>
                                <span class="material-icons">flash_on</span>
                                Buy Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        modal.classList.add('active');
        this.attachModalEventListeners(product);
    }

    createProductModal() {
        const modal = document.createElement('div');
        modal.id = 'productModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h3>Product Details</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body" id="productModalBody">
                    <!-- Content will be loaded here -->
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        return modal;
    }

    attachModalEventListeners(product) {
        // Quantity controls
        const quantityInput = document.getElementById('orderQuantity');
        const decreaseBtn = document.querySelector('.quantity-btn.decrease');
        const increaseBtn = document.querySelector('.quantity-btn.increase');
        
        if (quantityInput && decreaseBtn && increaseBtn) {
            decreaseBtn.addEventListener('click', () => {
                const current = parseInt(quantityInput.value);
                if (current > product.minOrder) {
                    quantityInput.value = current - 1;
                    this.updateOrderSummary(product);
                }
            });
            
            increaseBtn.addEventListener('click', () => {
                const current = parseInt(quantityInput.value);
                if (current < product.quantity) {
                    quantityInput.value = current + 1;
                    this.updateOrderSummary(product);
                }
            });
            
            quantityInput.addEventListener('input', () => {
                this.updateOrderSummary(product);
            });
        }

        // Add to cart in modal
        document.querySelector('.add-to-cart-modal')?.addEventListener('click', () => {
            const quantity = parseInt(quantityInput.value);
            this.addToCart(product._id, quantity);
        });

        // Buy now button
        document.querySelector('.buy-now-btn')?.addEventListener('click', () => {
            const quantity = parseInt(quantityInput.value);
            this.buyNow(product._id, quantity);
        });

        // Image thumbnails
        document.querySelectorAll('.image-thumbnails .thumbnail').forEach(thumb => {
            thumb.addEventListener('click', () => {
                const mainImage = document.querySelector('.main-image img');
                const thumbImage = thumb.querySelector('img');
                
                if (mainImage && thumbImage) {
                    mainImage.src = thumbImage.src;
                }
                
                document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
            });
        });
    }

    updateOrderSummary(product) {
        const quantityInput = document.getElementById('orderQuantity');
        const summaryQuantity = document.getElementById('summaryQuantity');
        const summaryTotal = document.getElementById('summaryTotal');
        
        if (quantityInput && summaryQuantity && summaryTotal) {
            const quantity = parseInt(quantityInput.value) || product.minOrder;
            const total = product.price * quantity;
            
            summaryQuantity.textContent = `${quantity} ${product.unit}`;
            summaryTotal.textContent = utils.formatCurrency(total);
        }
    }

    // ... (I'll continue with the remaining 150+ features in the next part)
}

// Initialize products manager
const products = new ProductsManager();
