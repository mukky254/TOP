// Products management
class ProductsManager {
    constructor() {
        this.products = [];
        this.currentPage = 1;
        this.hasMore = true;
        this.filters = {};
        this.setupProductEvents();
    }

    setupProductEvents() {
        // Add product button
        document.getElementById('addProductBtn')?.addEventListener('click', () => {
            this.showAddProductModal();
        });

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', utils.debounce(() => {
                this.filters.search = searchInput.value;
                this.loadProducts(true);
            }, 500));
        }

        // Filters
        document.getElementById('categoryFilter')?.addEventListener('change', (e) => {
            this.filters.category = e.target.value;
            this.loadProducts(true);
        });

        document.getElementById('countyFilter')?.addEventListener('change', (e) => {
            this.filters.county = e.target.value;
            this.loadProducts(true);
        });

        document.getElementById('sortFilter')?.addEventListener('change', (e) => {
            this.filters.sort = e.target.value;
            this.loadProducts(true);
        });

        // Advanced filters
        document.getElementById('advancedFiltersBtn')?.addEventListener('click', () => {
            this.toggleAdvancedFilters();
        });

        document.getElementById('minPrice')?.addEventListener('input', utils.debounce(() => {
            this.filters.minPrice = document.getElementById('minPrice').value;
            this.loadProducts(true);
        }, 500));

        document.getElementById('maxPrice')?.addEventListener('input', utils.debounce(() => {
            this.filters.maxPrice = document.getElementById('maxPrice').value;
            this.loadProducts(true);
        }, 500));

        document.getElementById('organicFilter')?.addEventListener('change', (e) => {
            this.filters.isOrganic = e.target.checked;
            this.loadProducts(true);
        });

        document.getElementById('freshFilter')?.addEventListener('change', (e) => {
            this.filters.isFresh = e.target.checked;
            this.loadProducts(true);
        });

        // Load more products
        window.addEventListener('scroll', utils.debounce(() => {
            this.checkScrollLoadMore();
        }, 100));
    }

    async loadProducts(reset = false) {
        if (reset) {
            this.currentPage = 1;
            this.hasMore = true;
            this.products = [];
        }

        if (!this.hasMore) return;

        try {
            const queryParams = new URLSearchParams({
                page: this.currentPage,
                limit: 12,
                ...this.filters
            });

            const data = await utils.apiCall(`/products?${queryParams}`);
            
            if (reset) {
                this.products = data.products;
            } else {
                this.products.push(...data.products);
            }

            this.hasMore = this.currentPage < data.totalPages;
            this.currentPage++;

            this.renderProducts();
            this.updateProductCounts();

        } catch (error) {
            console.error('Failed to load products:', error);
        }
    }

    async loadFeaturedProducts() {
        try {
            const data = await utils.apiCall('/products?limit=8&sort=rating');
            this.renderFeaturedProducts(data.products);
        } catch (error) {
            console.error('Failed to load featured products:', error);
        }
    }

    renderProducts() {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;

        if (this.products.length === 0) {
            productsGrid.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons">inventory_2</span>
                    <h3>No products found</h3>
                    <p>Try adjusting your search or filters</p>
                </div>
            `;
            return;
        }

        productsGrid.innerHTML = this.products.map(product => this.createProductCard(product)).join('');
        
        // Add click events to product cards
        productsGrid.querySelectorAll('.product-card').forEach((card, index) => {
            card.addEventListener('click', () => {
                this.showProductModal(this.products[index]);
            });
        });
    }

    renderFeaturedProducts(products) {
        const featuredGrid = document.getElementById('featuredProducts');
        if (!featuredGrid) return;

        featuredGrid.innerHTML = products.map(product => this.createProductCard(product)).join('');
        
        // Add click events
        featuredGrid.querySelectorAll('.product-card').forEach((card, index) => {
            card.addEventListener('click', () => {
                this.showProductModal(products[index]);
            });
        });
    }

    createProductCard(product) {
        const farmer = product.farmer || {};
        return `
            <div class="product-card">
                <div class="product-image">
                    ${product.images && product.images.length > 0 ? 
                        `<img src="${product.images[0].url}" alt="${product.name}">` :
                        `<span class="material-icons">image</span>`
                    }
                    ${product.isOrganic ? '<div class="product-badge">Organic</div>' : ''}
                    ${!product.isFresh ? '<div class="product-badge processed">Processed</div>' : ''}
                </div>
                <div class="product-content">
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-price">${utils.formatCurrency(product.price)}/${product.unit}</div>
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
                        <strong>By:</strong> ${farmer.name || 'Unknown'}
                    </div>
                    <div class="product-actions">
                        <button class="btn btn-outline btn-small" onclick="event.stopPropagation(); messages.startConversation('${farmer._id}', '${product._id}')">
                            <span class="material-icons">chat</span>
                            Message
                        </button>
                        <button class="btn btn-primary btn-small" onclick="event.stopPropagation(); orders.addToCart('${product._id}')">
                            <span class="material-icons">add_shopping_cart</span>
                            Buy
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    showProductModal(product) {
        const modal = document.getElementById('productModal');
        const modalBody = document.getElementById('productModalBody');
        
        if (!modal || !modalBody) return;

        const farmer = product.farmer || {};
        
        modalBody.innerHTML = `
            <div class="product-modal-content">
                <div class="product-modal-images">
                    ${product.images && product.images.length > 0 ? 
                        `<img src="${product.images[0].url}" alt="${product.name}">` :
                        `<div class="no-image"><span class="material-icons">image</span></div>`
                    }
                </div>
                <div class="product-modal-details">
                    <h2>${product.name}</h2>
                    <div class="product-price-large">${utils.formatCurrency(product.price)}/${product.unit}</div>
                    
                    <div class="product-info-grid">
                        <div class="info-item">
                            <strong>Category:</strong> ${utils.getCategories()[product.category]}
                        </div>
                        <div class="info-item">
                            <strong>Available:</strong> ${product.quantity} ${product.unit}
                        </div>
                        <div class="info-item">
                            <strong>Location:</strong> ${product.location?.county}, ${product.location?.subCounty}
                        </div>
                        <div class="info-item">
                            <strong>Minimum Order:</strong> ${product.minOrder} ${product.unit}
                        </div>
                        ${product.isOrganic ? '<div class="info-item organic"><strong>Organic:</strong> Yes</div>' : ''}
                        ${product.harvestDate ? `<div class="info-item"><strong>Harvested:</strong> ${utils.formatDate(product.harvestDate)}</div>` : ''}
                    </div>

                    <div class="product-description">
                        <h4>Description</h4>
                        <p>${product.description}</p>
                    </div>

                    <div class="farmer-info">
                        <h4>Seller Information</h4>
                        <div class="farmer-details">
                            <div class="farmer-avatar">${utils.getUserInitials(farmer.name)}</div>
                            <div class="farmer-text">
                                <div class="farmer-name">${farmer.name}</div>
                                <div class="farmer-rating">
                                    <span class="material-icons">star</span>
                                    ${farmer.rating || '0.0'} (${farmer.totalReviews || 0} reviews)
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="product-modal-actions">
                        <button class="btn btn-outline" onclick="messages.startConversation('${farmer._id}', '${product._id}')">
                            <span class="material-icons">chat</span>
                            Message Seller
                        </button>
                        <button class="btn btn-primary" onclick="orders.addToCart('${product._id}')">
                            <span class="material-icons">add_shopping_cart</span>
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        `;

        modal.classList.add('active');
        
        // Close modal
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.classList.remove('active');
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }

    showAddProductModal() {
        // Implementation for adding products
        utils.showToast('Info', 'Add product feature coming soon!', 'info');
    }

    toggleAdvancedFilters() {
        const advancedFilters = document.getElementById('advancedFilters');
        const isVisible = advancedFilters.style.display !== 'none';
        
        advancedFilters.style.display = isVisible ? 'none' : 'block';
    }

    checkScrollLoadMore() {
        const loadingElement = document.getElementById('productsLoading');
        if (!loadingElement || !this.hasMore) return;

        const rect = loadingElement.getBoundingClientRect();
        if (rect.top < window.innerHeight + 100) {
            this.loadProducts(false);
        }
    }

    updateProductCounts() {
        // Update product count in hero section
        const productsCount = document.getElementById('productsCount');
        if (productsCount) {
            // This would ideally come from API stats
            productsCount.textContent = '1,200+';
        }
    }
}

// Initialize products manager
const products = new ProductsManager();
