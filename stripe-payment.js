// سیستم پرداخت Stripe
class StripePaymentSystem {
    constructor() {
        this.stripe = null;
        this.elements = null;
        this.cardElement = null;
        this.paymentIntent = null;
        this.isInitialized = false;
    }

    // راه‌اندازی سیستم
    async init() {
        if (this.isInitialized) return;
        
        try {
            // دریافت کلید عمومی Stripe
            const response = await fetch('/api/payment/stripe-key');
            const data = await response.json();
            
            if (data.success) {
                this.stripe = Stripe(data.publishableKey);
                this.isInitialized = true;
                console.log('💳 سیستم پرداخت Stripe راه‌اندازی شد');
            } else {
                throw new Error('خطا در دریافت کلید Stripe');
            }
        } catch (error) {
            console.error('خطا در راه‌اندازی Stripe:', error);
            throw error;
        }
    }

    // ایجاد فرم پرداخت
    createPaymentForm(containerId) {
        if (!this.stripe) {
            throw new Error('Stripe راه‌اندازی نشده است');
        }

        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error('کانتینر فرم پرداخت یافت نشد');
        }

        // ایجاد Elements
        this.elements = this.stripe.elements();
        
        // ایجاد کارت Element
        this.cardElement = this.elements.create('card', {
            style: {
                base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                        color: '#aab7c4',
                    },
                },
                invalid: {
                    color: '#9e2146',
                },
            },
        });

        // اضافه کردن کارت به فرم
        this.cardElement.mount(`#${containerId} .card-element`);

        // اضافه کردن event listeners
        this.cardElement.on('change', this.handleCardChange.bind(this));
    }

    // مدیریت تغییرات کارت
    handleCardChange(event) {
        const displayError = document.getElementById('card-errors');
        if (event.error) {
            displayError.textContent = event.error.message;
        } else {
            displayError.textContent = '';
        }
    }

    // ایجاد Payment Intent
    async createPaymentIntent(productId) {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('توکن احراز هویت یافت نشد');
            }

            const response = await fetch('/api/payment/create-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ productId })
            });

            const data = await response.json();
            
            if (data.success) {
                this.paymentIntent = {
                    id: data.paymentIntentId,
                    clientSecret: data.clientSecret
                };
                return data;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('خطا در ایجاد Payment Intent:', error);
            throw error;
        }
    }

    // پردازش پرداخت
    async processPayment() {
        if (!this.stripe || !this.cardElement || !this.paymentIntent) {
            throw new Error('سیستم پرداخت آماده نیست');
        }

        try {
            // نمایش loading
            this.showLoading(true);

            const { error, paymentIntent } = await this.stripe.confirmCardPayment(
                this.paymentIntent.clientSecret,
                {
                    payment_method: {
                        card: this.cardElement,
                        billing_details: {
                            name: document.getElementById('cardholder-name')?.value || 'کاربر',
                        },
                    }
                }
            );

            if (error) {
                throw new Error(error.message);
            }

            if (paymentIntent.status === 'succeeded') {
                return {
                    success: true,
                    paymentIntent: paymentIntent
                };
            } else {
                throw new Error('پرداخت ناموفق بود');
            }
        } catch (error) {
            console.error('خطا در پردازش پرداخت:', error);
            throw error;
        } finally {
            this.showLoading(false);
        }
    }

    // ایجاد Checkout Session
    async createCheckoutSession(productId) {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('توکن احراز هویت یافت نشد');
            }

            const response = await fetch('/api/payment/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ productId })
            });

            const data = await response.json();
            
            if (data.success) {
                return data;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('خطا در ایجاد Checkout Session:', error);
            throw error;
        }
    }

    // هدایت به Checkout
    async redirectToCheckout(productId) {
        try {
            const sessionData = await this.createCheckoutSession(productId);
            
            // هدایت به صفحه Checkout Stripe
            const result = await this.stripe.redirectToCheckout({
                sessionId: sessionData.sessionId
            });

            if (result.error) {
                throw new Error(result.error.message);
            }
        } catch (error) {
            console.error('خطا در هدایت به Checkout:', error);
            throw error;
        }
    }

    // نمایش/مخفی کردن loading
    showLoading(show) {
        const loadingElement = document.getElementById('payment-loading');
        const submitButton = document.getElementById('payment-submit');
        
        if (loadingElement) {
            loadingElement.style.display = show ? 'block' : 'none';
        }
        
        if (submitButton) {
            submitButton.disabled = show;
            submitButton.textContent = show ? 'در حال پردازش...' : 'پرداخت';
        }
    }

    // نمایش پیام موفقیت
    showSuccess(message) {
        const successElement = document.getElementById('payment-success');
        if (successElement) {
            successElement.textContent = message;
            successElement.style.display = 'block';
            successElement.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // نمایش پیام خطا
    showError(message) {
        const errorElement = document.getElementById('payment-error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            errorElement.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // پاک کردن فرم
    clearForm() {
        if (this.cardElement) {
            this.cardElement.clear();
        }
        
        const cardholderName = document.getElementById('cardholder-name');
        if (cardholderName) {
            cardholderName.value = '';
        }
        
        this.hideMessages();
    }

    // مخفی کردن پیام‌ها
    hideMessages() {
        const successElement = document.getElementById('payment-success');
        const errorElement = document.getElementById('payment-error');
        
        if (successElement) {
            successElement.style.display = 'none';
        }
        
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    // دریافت اطلاعات محصول
    async getProduct(productId) {
        try {
            const response = await fetch(`/api/products/${productId}`);
            const data = await response.json();
            
            if (data.success) {
                return data.product;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('خطا در دریافت محصول:', error);
            throw error;
        }
    }

    // دریافت لیست محصولات
    async getProducts() {
        try {
            const response = await fetch('/api/products');
            const data = await response.json();
            
            if (data.success) {
                return data.products;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('خطا در دریافت محصولات:', error);
            throw error;
        }
    }

    // دریافت تراکنش‌های کاربر
    async getUserTransactions() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('توکن احراز هویت یافت نشد');
            }

            const response = await fetch('/api/transactions', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            
            if (data.success) {
                return data.transactions;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('خطا در دریافت تراکنش‌ها:', error);
            throw error;
        }
    }

    // دریافت خریدهای کاربر
    async getUserPurchases() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('توکن احراز هویت یافت نشد');
            }

            const response = await fetch('/api/purchases', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            
            if (data.success) {
                return data.purchases;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('خطا در دریافت خریدها:', error);
            throw error;
        }
    }

    // فرمت کردن قیمت
    formatPrice(amount, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }

    // فرمت کردن تاریخ
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // بررسی وضعیت پرداخت
    getPaymentStatus(status) {
        const statusMap = {
            'pending': { text: 'در انتظار', class: 'warning' },
            'succeeded': { text: 'موفق', class: 'success' },
            'failed': { text: 'ناموفق', class: 'danger' },
            'canceled': { text: 'لغو شده', class: 'secondary' }
        };
        
        return statusMap[status] || { text: 'نامشخص', class: 'secondary' };
    }
}

// ایجاد نمونه سراسری
const stripePayment = new StripePaymentSystem();

// راه‌اندازی خودکار
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await stripePayment.init();
    } catch (error) {
        console.error('خطا در راه‌اندازی سیستم پرداخت:', error);
    }
});

// توابع عمومی برای استفاده در HTML
async function initializePaymentForm(containerId) {
    try {
        stripePayment.createPaymentForm(containerId);
    } catch (error) {
        console.error('خطا در ایجاد فرم پرداخت:', error);
        alert('خطا در ایجاد فرم پرداخت: ' + error.message);
    }
}

async function processPayment(productId) {
    try {
        // ایجاد Payment Intent
        await stripePayment.createPaymentIntent(productId);
        
        // پردازش پرداخت
        const result = await stripePayment.processPayment();
        
        if (result.success) {
            stripePayment.showSuccess('پرداخت با موفقیت انجام شد!');
            stripePayment.clearForm();
            
            // هدایت به صفحه موفقیت
            setTimeout(() => {
                window.location.href = '/payment-success.html';
            }, 2000);
        }
    } catch (error) {
        console.error('خطا در پرداخت:', error);
        stripePayment.showError('خطا در پرداخت: ' + error.message);
    }
}

async function redirectToCheckout(productId) {
    try {
        await stripePayment.redirectToCheckout(productId);
    } catch (error) {
        console.error('خطا در هدایت به Checkout:', error);
        alert('خطا در هدایت به صفحه پرداخت: ' + error.message);
    }
}

async function loadProducts(containerId) {
    try {
        const products = await stripePayment.getProducts();
        const container = document.getElementById(containerId);
        
        if (!container) return;
        
        container.innerHTML = products.map(product => `
            <div class="col-md-4 mb-4">
                <div class="card h-100">
                    ${product.imageUrl ? `<img src="${product.imageUrl}" class="card-img-top" alt="${product.name}">` : ''}
                    <div class="card-body">
                        <h5 class="card-title">${product.name}</h5>
                        <p class="card-text">${product.description}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="h5 text-primary">${stripePayment.formatPrice(product.price)}</span>
                            <button class="btn btn-primary" onclick="redirectToCheckout(${product.id})">
                                خرید
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('خطا در بارگذاری محصولات:', error);
    }
}

async function loadUserTransactions(containerId) {
    try {
        const transactions = await stripePayment.getUserTransactions();
        const container = document.getElementById(containerId);
        
        if (!container) return;
        
        container.innerHTML = transactions.map(transaction => {
            const status = stripePayment.getPaymentStatus(transaction.status);
            return `
                <tr>
                    <td>${transaction.productName}</td>
                    <td>${stripePayment.formatPrice(transaction.amount)}</td>
                    <td><span class="badge bg-${status.class}">${status.text}</span></td>
                    <td>${stripePayment.formatDate(transaction.createdAt)}</td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('خطا در بارگذاری تراکنش‌ها:', error);
    }
}

async function loadUserPurchases(containerId) {
    try {
        const purchases = await stripePayment.getUserPurchases();
        const container = document.getElementById(containerId);
        
        if (!container) return;
        
        container.innerHTML = purchases.map(purchase => `
            <div class="col-md-6 mb-3">
                <div class="card">
                    ${purchase.imageUrl ? `<img src="${purchase.imageUrl}" class="card-img-top" alt="${purchase.productName}">` : ''}
                    <div class="card-body">
                        <h6 class="card-title">${purchase.productName}</h6>
                        <p class="card-text">${purchase.description}</p>
                        <div class="d-flex justify-content-between">
                            <small class="text-muted">${stripePayment.formatDate(purchase.purchaseDate)}</small>
                            <span class="text-success">${stripePayment.formatPrice(purchase.amount)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('خطا در بارگذاری خریدها:', error);
    }
} 