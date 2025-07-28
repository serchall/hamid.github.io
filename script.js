// Global variables
let products = [];
let cart = [];

// Google Analytics Tracking Functions
function trackEvent(eventName, parameters = {}) {
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, parameters);
    }
}

function trackPageView(pageTitle, pageLocation) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'page_view', {
            page_title: pageTitle,
            page_location: pageLocation
        });
    }
}

function trackUserEngagement(engagementTime = 1000) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'user_engagement', {
            engagement_time_msec: engagementTime
        });
    }
}

// Track begin checkout
function trackBeginCheckout() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    trackEvent('begin_checkout', {
        currency: 'IRR',
        value: total,
        items: cart.map(item => ({
            item_id: item._id,
            item_name: item.name,
            price: item.price,
            quantity: item.quantity
        }))
    });
}

// Track page views for different pages
function trackPageView() {
    const pageTitle = document.title;
    const pageLocation = window.location.href;
    
    trackEvent('page_view', {
        page_title: pageTitle,
        page_location: pageLocation
    });
}

// Check authentication status on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    loadProducts();
    loadCart();
    
    // Track page view
    trackPageView();
    
    // Track user engagement
    trackUserEngagement();
});

// Authentication functions
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        // User is logged in
        document.getElementById('authLinks').classList.add('d-none');
        document.getElementById('profileLink').classList.remove('d-none');
        document.getElementById('logoutBtn').classList.remove('d-none');
    } else {
        // User is not logged in
        document.getElementById('authLinks').classList.remove('d-none');
        document.getElementById('profileLink').classList.add('d-none');
        document.getElementById('logoutBtn').classList.add('d-none');
    }
}

function logout() {
    // Track logout event
    trackEvent('user_logout', {
        user_id: localStorage.getItem('user_id')
    });
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_id');
    checkAuthStatus();
    window.location.href = '/';
}

// Load products from API
async function loadProducts() {
    const productsContainer = document.getElementById('products');
    
    // Show loading
    productsContainer.innerHTML = `
        <div class="col-12">
            <div class="loading">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">در حال بارگذاری...</span>
                </div>
                <p class="mt-2">در حال بارگذاری محصولات...</p>
            </div>
        </div>
    `;

    try {
        const response = await fetch('/api/products');
        const data = await response.json();
        
        if (data.success) {
            products = data.products;
            renderProducts();
        } else {
            // Fallback to default products
            products = [
                {
                    _id: '1',
                    name: 'گوشی موبایل',
                    price: 12000000,
                    image: 'https://via.placeholder.com/300x200/007bff/ffffff?text=گوشی+موبایل',
                    description: 'گوشی موبایل هوشمند با کیفیت بالا'
                },
                {
                    _id: '2',
                    name: 'لپ‌تاپ',
                    price: 25000000,
                    image: 'https://via.placeholder.com/300x200/28a745/ffffff?text=لپ‌تاپ',
                    description: 'لپ‌تاپ قدرتمند برای کار و بازی'
                },
                {
                    _id: '3',
                    name: 'هدفون',
                    price: 800000,
                    image: 'https://via.placeholder.com/300x200/dc3545/ffffff?text=هدفون',
                    description: 'هدفون بی‌سیم با کیفیت صوتی عالی'
                }
            ];
            renderProducts();
        }
    } catch (error) {
        console.error('Error loading products:', error);
        // Show error message
        productsContainer.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger" role="alert">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    خطا در بارگذاری محصولات. لطفاً صفحه را رفرش کنید.
                </div>
            </div>
        `;
    }
}

// Render products with Bootstrap cards
function renderProducts() {
    const productsContainer = document.getElementById('products');
    
    if (products.length === 0) {
        productsContainer.innerHTML = `
            <div class="col-12">
                <div class="text-center text-muted">
                    <i class="fas fa-box-open fa-3x mb-3"></i>
                    <p>هیچ محصولی یافت نشد.</p>
                </div>
            </div>
        `;
        return;
    }

    const productsHTML = products.map(product => `
        <div class="col-lg-4 col-md-6 col-sm-12 mb-4">
            <div class="product-card fade-in">
                <img src="${product.image}" alt="${product.name}" class="img-fluid">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <div class="price">${product.price.toLocaleString()} تومان</div>
                <button class="btn btn-primary" onclick="addToCart('${product._id}')">
                    <i class="fas fa-cart-plus me-2"></i>افزودن به سبد
                </button>
            </div>
        </div>
    `).join('');

    productsContainer.innerHTML = productsHTML;
}

// Add product to cart
async function addToCart(productId) {
    try {
        // Get product details from API
        const response = await fetch(`/api/products/${productId}`);
        const data = await response.json();
        
        if (data.success) {
            const product = data.product;
            // Track add to cart event
            trackEvent('add_to_cart', {
                currency: 'IRR',
                value: product.price,
                items: [{
                    item_id: product._id,
                    item_name: product.name,
                    price: product.price,
                    quantity: 1
                }]
            });
            addToCartLocal(product);
        } else {
            // Fallback: find product in local array
            const product = products.find(p => p._id === productId);
            if (product) {
                // Track add to cart event
                trackEvent('add_to_cart', {
                    currency: 'IRR',
                    value: product.price,
                    items: [{
                        item_id: product._id,
                        item_name: product.name,
                        price: product.price,
                        quantity: 1
                    }]
                });
                addToCartLocal(product);
            }
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        // Fallback: find product in local array
        const product = products.find(p => p._id === productId);
        if (product) {
            // Track add to cart event
            trackEvent('add_to_cart', {
                currency: 'IRR',
                value: product.price,
                items: [{
                    item_id: product._id,
                    item_name: product.name,
                    price: product.price,
                    quantity: 1
                }]
            });
            addToCartLocal(product);
        }
    }
}

function addToCartLocal(product) {
    const existingItem = cart.find(item => item._id === product._id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            _id: product._id,
            name: product.name,
            price: product.price,
            quantity: 1
        });
    }
    
    saveCart();
    renderCart();
    
    // Show success message
    showAlert('محصول به سبد خرید اضافه شد!', 'success');
}

// Render cart with Bootstrap styling
function renderCart() {
    const cartItemsContainer = document.getElementById('cart-items');
    const totalAmountElement = document.getElementById('total-amount');
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>سبد خرید خالی است</p>
            </div>
        `;
        totalAmountElement.textContent = '0 تومان';
        return;
    }

    const cartHTML = cart.map(item => `
        <div class="cart-item slide-in">
            <div class="item-info">
                <div class="item-name">${item.name}</div>
                <div class="item-price">${item.price.toLocaleString()} تومان</div>
            </div>
            <div class="d-flex align-items-center">
                <span class="item-qty">${item.quantity}</span>
                <button class="btn-remove" onclick="removeFromCart('${item._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');

    cartItemsContainer.innerHTML = cartHTML;
    
    // Calculate and display total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    totalAmountElement.textContent = `${total.toLocaleString()} تومان`;
}

// Remove item from cart
function removeFromCart(productId) {
    const removedItem = cart.find(item => item._id === productId);
    if (removedItem) {
        // Track remove from cart event
        trackEvent('remove_from_cart', {
            currency: 'IRR',
            value: removedItem.price * removedItem.quantity,
            items: [{
                item_id: removedItem._id,
                item_name: removedItem.name,
                price: removedItem.price,
                quantity: removedItem.quantity
            }]
        });
    }
    
    cart = cart.filter(item => item._id !== productId);
    saveCart();
    renderCart();
    showAlert('محصول از سبد خرید حذف شد!', 'info');
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Load cart from localStorage
function loadCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        renderCart();
    }
}

// Show alert message
function showAlert(message, type = 'info') {
    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Add to page
    document.body.appendChild(alertDiv);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 3000);
}

// Handle responsive behavior
window.addEventListener('resize', function() {
    // Add any responsive-specific logic here
    const isMobile = window.innerWidth < 768;
    
    // Example: Adjust cart visibility on mobile
    if (isMobile) {
        // Mobile-specific adjustments
    }
});

// Add smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
