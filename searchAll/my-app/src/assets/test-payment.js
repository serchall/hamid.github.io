// سیستم پرداخت تستی داخلی
class TestPaymentSystem {
    constructor() {
        this.isInitialized = false;
        this.currentProduct = null;
        this.testCards = [];
    }

    // راه‌اندازی سیستم
    async init() {
        if (this.isInitialized) return;
        
        try {
            // بارگذاری کارت‌های تستی
            await this.loadTestCards();
            this.isInitialized = true;
            console.log('💳 سیستم پرداخت تستی راه‌اندازی شد');
        } catch (error) {
            console.error('خطا در راه‌اندازی سیستم پرداخت:', error);
            throw error;
        }
    }

    // بارگذاری کارت‌های تستی
    async loadTestCards() {
        try {
            const response = await fetch('/api/payment/test-cards');
            const data = await response.json();
            
            if (data.success) {
                this.testCards = data.testCards;
            } else {
                throw new Error('خطا در بارگذاری کارت‌های تستی');
            }
        } catch (error) {
            console.error('خطا در بارگذاری کارت‌های تستی:', error);
            throw error;
        }
    }

    // ایجاد فرم پرداخت
    createPaymentForm(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error('کانتینر فرم پرداخت یافت نشد');
        }

        // ایجاد فرم پرداخت
        container.innerHTML = `
            <div class="payment-form">
                <div class="form-group mb-3">
                    <label for="cardholder-name" class="form-label">
                        <i class="fas fa-user me-2"></i>نام صاحب کارت
                    </label>
                    <input type="text" id="cardholder-name" class="form-control" placeholder="نام و نام خانوادگی" required>
                </div>
                
                <div class="form-group mb-3">
                    <label for="card-number" class="form-label">
                        <i class="fas fa-credit-card me-2"></i>شماره کارت
                    </label>
                    <input type="text" id="card-number" class="form-control" placeholder="1234 5678 9012 3456" maxlength="19" required>
                </div>
                
                <div class="row">
                    <div class="col-md-4">
                        <div class="form-group mb-3">
                            <label for="expiry-month" class="form-label">ماه انقضا</label>
                            <select id="expiry-month" class="form-select" required>
                                <option value="">ماه</option>
                                ${this.generateMonthOptions()}
                            </select>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="form-group mb-3">
                            <label for="expiry-year" class="form-label">سال انقضا</label>
                            <select id="expiry-year" class="form-select" required>
                                <option value="">سال</option>
                                ${this.generateYearOptions()}
                            </select>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="form-group mb-3">
                            <label for="cvc" class="form-label">کد امنیتی</label>
                            <input type="text" id="cvc" class="form-control" placeholder="123" maxlength="4" required>
                        </div>
                    </div>
                </div>
                
                <div class="form-group mb-3">
                    <label class="form-label">کارت‌های تستی</label>
                    <div class="test-cards-container">
                        ${this.generateTestCardsHTML()}
                    </div>
                </div>
                
                <div class="form-group mb-3">
                    <button type="button" class="btn btn-outline-info btn-sm" onclick="testPayment.generateNewTestCard()">
                        <i class="fas fa-plus me-2"></i>تولید کارت تستی جدید
                    </button>
                </div>
                
                <div class="payment-message success" id="payment-success" style="display: none;"></div>
                <div class="payment-message error" id="payment-error" style="display: none;"></div>
                
                <div class="loading-spinner" id="payment-loading" style="display: none;">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">در حال پردازش...</span>
                    </div>
                    <p class="mt-2">در حال پردازش پرداخت...</p>
                </div>
                
                <button type="submit" class="payment-button" id="payment-submit">
                    <i class="fas fa-lock me-2"></i>پرداخت امن
                </button>
            </div>
        `;

        // اضافه کردن event listeners
        this.addEventListeners();
    }

    // تولید گزینه‌های ماه
    generateMonthOptions() {
        let options = '';
        for (let i = 1; i <= 12; i++) {
            const month = i.toString().padStart(2, '0');
            options += `<option value="${month}">${month}</option>`;
        }
        return options;
    }

    // تولید گزینه‌های سال
    generateYearOptions() {
        let options = '';
        const currentYear = new Date().getFullYear();
        for (let i = 0; i < 10; i++) {
            const year = currentYear + i;
            options += `<option value="${year}">${year}</option>`;
        }
        return options;
    }

    // تولید HTML کارت‌های تستی
    generateTestCardsHTML() {
        return this.testCards.map((card, index) => `
            <div class="test-card-item" onclick="testPayment.fillTestCard(${index})">
                <div class="test-card-number">${this.formatCardNumber(card.cardNumber)}</div>
                <div class="test-card-details">
                    <small>${card.expiryMonth}/${card.expiryYear} | ${card.cvc}</small>
                </div>
                <div class="test-card-description">${card.description}</div>
            </div>
        `).join('');
    }

    // فرمت کردن شماره کارت
    formatCardNumber(cardNumber) {
        return cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ');
    }

    // اضافه کردن event listeners
    addEventListeners() {
        // فرمت کردن شماره کارت
        const cardNumberInput = document.getElementById('card-number');
        if (cardNumberInput) {
            cardNumberInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\s/g, '');
                value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
                e.target.value = value;
            });
        }

        // محدود کردن CVC به اعداد
        const cvcInput = document.getElementById('cvc');
        if (cvcInput) {
            cvcInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '');
            });
        }

        // اعتبارسنجی کارت
        const form = document.querySelector('.payment-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.processPayment();
            });
        }
    }

    // پر کردن کارت تستی
    fillTestCard(index) {
        const card = this.testCards[index];
        if (!card) return;

        document.getElementById('card-number').value = this.formatCardNumber(card.cardNumber);
        document.getElementById('expiry-month').value = card.expiryMonth;
        document.getElementById('expiry-year').value = card.expiryYear;
        document.getElementById('cvc').value = card.cvc;
        document.getElementById('cardholder-name').value = 'کاربر تستی';

        this.showSuccess(`کارت تستی "${card.description}" انتخاب شد`);
    }

    // تولید کارت تستی جدید
    async generateNewTestCard() {
        try {
            const response = await fetch('/api/payment/generate-test-card', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            if (data.success) {
                const newCard = data.card;
                this.testCards.push({
                    ...newCard,
                    description: `کارت جدید - موجودی: $${newCard.balance}`
                });
                
                // به‌روزرسانی نمایش کارت‌ها
                const container = document.querySelector('.test-cards-container');
                if (container) {
                    container.innerHTML = this.generateTestCardsHTML();
                }
                
                this.showSuccess('کارت تستی جدید تولید شد');
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('خطا در تولید کارت تستی:', error);
            this.showError('خطا در تولید کارت تستی: ' + error.message);
        }
    }

    // پردازش پرداخت
    async processPayment() {
        try {
            // جمع‌آوری اطلاعات فرم
            const formData = this.collectFormData();
            
            if (!formData) {
                return; // خطا در اعتبارسنجی
            }

            // نمایش loading
            this.showLoading(true);

            // ارسال درخواست پرداخت
            const response = await fetch('/api/payment/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                    productId: this.currentProduct?.id,
                    ...formData
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showSuccess('پرداخت با موفقیت انجام شد!');
                this.clearForm();
                
                // هدایت به صفحه موفقیت
                setTimeout(() => {
                    window.location.href = '/payment-success.html?transactionId=' + data.transactionId;
                }, 2000);
            } else {
                throw new Error(data.message);
            }

        } catch (error) {
            console.error('خطا در پردازش پرداخت:', error);
            this.showError('خطا در پردازش پرداخت: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    // جمع‌آوری اطلاعات فرم
    collectFormData() {
        const cardholderName = document.getElementById('cardholder-name').value.trim();
        const cardNumber = document.getElementById('card-number').value.replace(/\s/g, '');
        const expiryMonth = document.getElementById('expiry-month').value;
        const expiryYear = document.getElementById('expiry-year').value;
        const cvc = document.getElementById('cvc').value;

        // اعتبارسنجی
        if (!cardholderName) {
            this.showError('نام صاحب کارت الزامی است');
            return null;
        }

        if (!cardNumber || cardNumber.length !== 16) {
            this.showError('شماره کارت باید 16 رقم باشد');
            return null;
        }

        if (!expiryMonth || !expiryYear) {
            this.showError('تاریخ انقضا الزامی است');
            return null;
        }

        if (!cvc || cvc.length < 3) {
            this.showError('کد امنیتی الزامی است');
            return null;
        }

        return {
            cardholderName,
            cardNumber,
            expiryMonth,
            expiryYear,
            cvc
        };
    }

    // اعتبارسنجی کارت
    async validateCard(cardNumber, expiryMonth, expiryYear, cvc) {
        try {
            const response = await fetch('/api/payment/validate-card', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    cardNumber,
                    expiryMonth,
                    expiryYear,
                    cvc
                })
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('خطا در اعتبارسنجی کارت:', error);
            return { success: false, message: 'خطا در اعتبارسنجی کارت' };
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
        
        // مخفی کردن پیام خطا
        const errorElement = document.getElementById('payment-error');
        if (errorElement) {
            errorElement.style.display = 'none';
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
        
        // مخفی کردن پیام موفقیت
        const successElement = document.getElementById('payment-success');
        if (successElement) {
            successElement.style.display = 'none';
        }
    }

    // پاک کردن فرم
    clearForm() {
        document.getElementById('cardholder-name').value = '';
        document.getElementById('card-number').value = '';
        document.getElementById('expiry-month').value = '';
        document.getElementById('expiry-year').value = '';
        document.getElementById('cvc').value = '';
        
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

    // تنظیم محصول فعلی
    setCurrentProduct(product) {
        this.currentProduct = product;
    }

    // دریافت محصول فعلی
    getCurrentProduct() {
        return this.currentProduct;
    }

    // دریافت کارت‌های تستی
    getTestCards() {
        return this.testCards;
    }

    // فرمت کردن قیمت
    formatPrice(amount, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }
}

// ایجاد نمونه سراسری
const testPayment = new TestPaymentSystem();

// راه‌اندازی خودکار
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await testPayment.init();
    } catch (error) {
        console.error('خطا در راه‌اندازی سیستم پرداخت:', error);
    }
});

// توابع عمومی برای استفاده در HTML
async function initializeTestPaymentForm(containerId) {
    try {
        await testPayment.createPaymentForm(containerId);
    } catch (error) {
        console.error('خطا در ایجاد فرم پرداخت:', error);
        alert('خطا در ایجاد فرم پرداخت: ' + error.message);
    }
}

async function processTestPayment() {
    try {
        await testPayment.processPayment();
    } catch (error) {
        console.error('خطا در پردازش پرداخت:', error);
        alert('خطا در پردازش پرداخت: ' + error.message);
    }
}

function fillTestCard(index) {
    testPayment.fillTestCard(index);
}

async function generateNewTestCard() {
    await testPayment.generateNewTestCard();
}

// بررسی احراز هویت
function checkAuth() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
} 