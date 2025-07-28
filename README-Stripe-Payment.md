# سیستم پرداخت Stripe

## 📋 معرفی

سیستم پرداخت Stripe یک راه‌حل کامل و امن برای پرداخت‌های آنلاین است که به کاربران امکان خرید دوره‌ها و محصولات با کارت‌های بانکی مختلف را می‌دهد.

## ✨ ویژگی‌های سیستم

### **💳 پرداخت‌های امن:**
- ✅ **Stripe Elements**: فرم‌های پرداخت امن و زیبا
- ✅ **Checkout Sessions**: صفحه پرداخت اختصاصی Stripe
- ✅ **Payment Intents**: پردازش امن تراکنش‌ها
- ✅ **Webhook Integration**: پردازش خودکار رویدادها

### **🛡️ امنیت:**
- ✅ **PCI Compliance**: مطابق با استانداردهای امنیتی
- ✅ **Tokenization**: رمزنگاری اطلاعات کارت
- ✅ **Fraud Protection**: محافظت در برابر کلاهبرداری
- ✅ **3D Secure**: احراز هویت اضافی

### **📊 مدیریت تراکنش‌ها:**
- ✅ **ثبت تراکنش‌ها**: ذخیره کامل اطلاعات پرداخت
- ✅ **پیگیری وضعیت**: نظارت بر وضعیت تراکنش‌ها
- ✅ **گزارش‌گیری**: گزارش‌های تفصیلی
- ✅ **بازپرداخت**: مدیریت بازپرداخت‌ها

## 🚀 نحوه استفاده

### **1. راه‌اندازی Stripe:**
```bash
# نصب پکیج Stripe
npm install stripe

# تنظیم متغیرهای محیطی
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### **2. ایجاد محصول در Stripe:**
```javascript
// ایجاد محصول
const product = await stripe.products.create({
    name: 'دوره آموزشی',
    description: 'توضیحات دوره'
});

// ایجاد قیمت
const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 2999, // $29.99
    currency: 'usd'
});
```

### **3. پردازش پرداخت:**
```javascript
// ایجاد Payment Intent
const paymentIntent = await stripe.paymentIntents.create({
    amount: 2999,
    currency: 'usd',
    automatic_payment_methods: {
        enabled: true,
    }
});
```

## 🏗️ معماری سیستم

### **Backend (Node.js/Express):**
```
server.js
├── Stripe Integration
├── Payment APIs
├── Webhook Handlers
└── Database Operations
```

### **Frontend (JavaScript):**
```
stripe-payment.js
├── Stripe Elements
├── Payment Processing
├── UI Management
└── Error Handling
```

### **Pages:**
```
payment-page.html      # صفحه پرداخت
payment-success.html   # صفحه موفقیت
payment-cancel.html    # صفحه لغو
```

## 📊 جداول دیتابیس

### **جدول محصولات:**
```sql
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    type TEXT NOT NULL, -- 'course', 'product'
    imageUrl TEXT,
    stripeProductId TEXT,
    stripePriceId TEXT,
    isActive INTEGER DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### **جدول تراکنش‌ها:**
```sql
CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    productId INTEGER,
    stripePaymentIntentId TEXT,
    stripeSessionId TEXT,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'usd',
    status TEXT NOT NULL, -- 'pending', 'succeeded', 'failed', 'canceled'
    paymentMethod TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users (id),
    FOREIGN KEY (productId) REFERENCES products (id)
);
```

### **جدول خریدهای کاربران:**
```sql
CREATE TABLE user_purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    productId INTEGER,
    transactionId INTEGER,
    purchaseDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'active', -- 'active', 'expired', 'refunded'
    FOREIGN KEY (userId) REFERENCES users (id),
    FOREIGN KEY (productId) REFERENCES products (id),
    FOREIGN KEY (transactionId) REFERENCES transactions (id)
);
```

## 🔌 API Endpoints

### **محصولات:**
```javascript
GET /api/products              # دریافت لیست محصولات
GET /api/products/:id          # دریافت محصول خاص
```

### **پرداخت:**
```javascript
POST /api/payment/create-payment-intent     # ایجاد Payment Intent
POST /api/payment/create-checkout-session   # ایجاد Checkout Session
GET /api/payment/stripe-key                 # دریافت کلید عمومی
POST /api/payment/webhook                   # Webhook Stripe
```

### **تراکنش‌ها:**
```javascript
GET /api/transactions          # دریافت تراکنش‌های کاربر
GET /api/purchases            # دریافت خریدهای کاربر
```

## 🎨 رابط کاربری

### **صفحه پرداخت:**
- فرم کارت بانکی زیبا
- نمایش اطلاعات محصول
- انیمیشن‌های جذاب
- پیام‌های خطا و موفقیت

### **صفحه موفقیت:**
- انیمیشن کنفتی
- جزئیات تراکنش
- دکمه‌های هدایت
- پیام تبریک

### **صفحه لغو:**
- پیام اطمینان‌بخش
- راهنمای کمک
- دکمه تلاش مجدد
- لینک‌های پشتیبانی

## 🔄 جریان پرداخت

### **1. انتخاب محصول:**
```
کاربر → انتخاب محصول → کلیک خرید
```

### **2. ایجاد تراکنش:**
```
Frontend → API → Stripe → Payment Intent
```

### **3. پردازش پرداخت:**
```
کاربر → وارد کردن کارت → Stripe → تایید
```

### **4. تکمیل تراکنش:**
```
Stripe → Webhook → Backend → Database → اعلان
```

### **5. هدایت کاربر:**
```
Frontend → صفحه موفقیت/لغو → پروفایل
```

## 🛠️ Webhook Events

### **رویدادهای پردازش شده:**
```javascript
'payment_intent.succeeded'     // پرداخت موفق
'checkout.session.completed'   // تکمیل Checkout
'payment_intent.payment_failed' // پرداخت ناموفق
```

### **پردازش Webhook:**
```javascript
// تایید امضای Webhook
const event = stripe.webhooks.constructEvent(
    req.body, sig, endpointSecret
);

// پردازش بر اساس نوع رویداد
switch (event.type) {
    case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
    // ...
}
```

## 💳 کارت‌های پشتیبانی شده

### **کارت‌های اعتباری:**
- ✅ Visa
- ✅ Mastercard
- ✅ American Express
- ✅ Discover

### **کارت‌های نقدی:**
- ✅ Visa Debit
- ✅ Mastercard Debit
- ✅ Maestro

### **کیف‌های دیجیتال:**
- ✅ Apple Pay
- ✅ Google Pay
- ✅ Microsoft Pay

## 🔧 تنظیمات

### **متغیرهای محیطی:**
```bash
# کلیدهای Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# تنظیمات سرور
NODE_ENV=development
PORT=3000
```

### **تنظیمات Webhook:**
```
URL: https://yourdomain.com/api/payment/webhook
Events: payment_intent.succeeded, checkout.session.completed
```

## 📱 سازگاری

### **مرورگرها:**
- ✅ Chrome (نسخه 60+)
- ✅ Firefox (نسخه 55+)
- ✅ Safari (نسخه 12+)
- ✅ Edge (نسخه 79+)

### **دستگاه‌ها:**
- ✅ دسکتاپ
- ✅ تبلت
- ✅ موبایل

### **سیستم‌عامل‌ها:**
- ✅ Windows
- ✅ macOS
- ✅ Linux
- ✅ iOS
- ✅ Android

## 🛡️ امنیت

### **محافظت‌های امنیتی:**
- **PCI DSS Compliance**: مطابق با استانداردهای امنیتی
- **Tokenization**: رمزنگاری اطلاعات حساس
- **HTTPS**: ارتباط امن
- **CORS**: کنترل دسترسی
- **Rate Limiting**: محدودیت درخواست‌ها

### **بهترین شیوه‌ها:**
- استفاده از کلیدهای تست در محیط توسعه
- تایید امضای Webhook
- ذخیره‌سازی امن اطلاعات
- لاگ‌گیری کامل

## 📊 گزارش‌گیری

### **گزارش‌های موجود:**
- تعداد تراکنش‌ها
- مبلغ کل فروش
- نرخ موفقیت
- تراکنش‌های ناموفق
- محصولات پرفروش

### **داشبورد Stripe:**
- گزارش‌های تفصیلی
- نمودارهای تحلیلی
- مدیریت بازپرداخت‌ها
- نظارت بر کلاهبرداری

## 🔄 بازپرداخت

### **انواع بازپرداخت:**
- **بازپرداخت کامل**: بازگشت کل مبلغ
- **بازپرداخت جزئی**: بازگشت بخشی از مبلغ
- **بازپرداخت خودکار**: در صورت خطا

### **مدیریت بازپرداخت:**
```javascript
// ایجاد بازپرداخت
const refund = await stripe.refunds.create({
    payment_intent: 'pi_xxx',
    amount: 1000 // $10.00
});
```

## 🚨 عیب‌یابی

### **مشکلات رایج:**

#### کلید Stripe نامعتبر
```
مشکل: خطای احراز هویت Stripe
راه‌حل: بررسی کلیدهای API
```

#### Webhook ناموفق
```
مشکل: عدم دریافت رویدادها
راه‌حل: بررسی URL و امضای Webhook
```

#### پرداخت ناموفق
```
مشکل: رد شدن پرداخت
راه‌حل: بررسی اطلاعات کارت و موجودی
```

### **لاگ‌های مفید:**
```javascript
// بررسی وضعیت Stripe
console.log('Stripe Status:', stripe.getApiField('version'));

// بررسی Webhook
console.log('Webhook Event:', event.type);

// بررسی تراکنش
console.log('Transaction Status:', transaction.status);
```

## 📈 عملکرد

### **بهینه‌سازی‌ها:**
- استفاده از Stripe Elements برای عملکرد بهتر
- کش کردن کلیدهای عمومی
- پردازش غیرهمزمان Webhook
- مدیریت خطاهای شبکه

### **محدودیت‌ها:**
- نیاز به HTTPS در تولید
- محدودیت‌های Stripe API
- وابستگی به سرویس خارجی

## 🔄 به‌روزرسانی‌ها

### **نسخه 1.0 (فعلی):**
- ✅ پرداخت‌های پایه
- ✅ Checkout Sessions
- ✅ Webhook Integration
- ✅ مدیریت تراکنش‌ها

### **نسخه 1.1 (آینده):**
- [ ] پرداخت‌های تکراری
- [ ] اشتراک‌ها
- [ ] پرداخت‌های بین‌المللی
- [ ] ارزهای مختلف

### **نسخه 1.2 (آینده):**
- [ ] Apple Pay/Google Pay
- [ ] پرداخت‌های موبایل
- [ ] گزارش‌های پیشرفته
- [ ] داشبورد مدیریتی

## 📞 پشتیبانی

### **مستندات:**
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)

### **کمک:**
- بررسی لاگ‌های سرور
- تست با کارت‌های تست Stripe
- تماس با پشتیبانی Stripe

---

**نکته**: برای استفاده در محیط تولید، حتماً کلیدهای واقعی Stripe را تنظیم کنید و HTTPS را فعال کنید. 