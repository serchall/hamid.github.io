# سیستم پرداخت تستی داخلی

## 📋 معرفی

سیستم پرداخت تستی داخلی یک راه‌حل کامل برای تست و توسعه پرداخت‌های آنلاین بدون نیاز به سرویس‌های خارجی مانند Stripe است. این سیستم شامل کارت‌های تستی، اعتبارسنجی و پردازش تراکنش‌ها می‌باشد.

## ✨ ویژگی‌های سیستم

### **💳 کارت‌های تستی:**
- ✅ **کارت‌های موفق**: پرداخت‌های موفق با موجودی کافی
- ✅ **کارت‌های ناموفق**: شبیه‌سازی خطاهای مختلف
- ✅ **تولید خودکار**: ایجاد کارت‌های تستی جدید
- ✅ **اعتبارسنجی**: بررسی فرمت و اعتبار کارت‌ها

### **🛡️ امنیت:**
- ✅ **اعتبارسنجی کامل**: بررسی تمام فیلدهای کارت
- ✅ **تاریخ انقضا**: بررسی اعتبار زمانی کارت
- ✅ **موجودی**: کنترل موجودی کارت‌های تستی
- ✅ **لاگ‌گیری**: ثبت کامل تراکنش‌ها

### **📊 مدیریت تراکنش‌ها:**
- ✅ **ثبت تراکنش‌ها**: ذخیره کامل اطلاعات پرداخت
- ✅ **پیگیری وضعیت**: نظارت بر وضعیت تراکنش‌ها
- ✅ **گزارش‌گیری**: گزارش‌های تفصیلی
- ✅ **اعلان‌ها**: اطلاع‌رسانی خریدهای موفق

## 🚀 نحوه استفاده

### **1. راه‌اندازی:**
```bash
# نیازی به نصب پکیج اضافی نیست
# سیستم کاملاً داخلی است
```

### **2. کارت‌های تستی موجود:**
```javascript
// کارت‌های موفق
'4242424242424242' // موجودی: $1000
'4000000000000002' // موجودی: $500

// کارت‌های ناموفق
'4000000000009995' // موجودی ناکافی
'4000000000009987' // کارت رد شده
'4000000000009979' // کارت منقضی شده
```

### **3. پردازش پرداخت:**
```javascript
// هدایت به صفحه پرداخت
window.location.href = '/test-payment-page.html?productId=1';
```

## 🏗️ معماری سیستم

### **Backend (Node.js/Express):**
```
server.js
├── TestPaymentSystem Class
├── Payment APIs
├── Card Validation
└── Database Operations
```

### **Frontend (JavaScript):**
```
test-payment.js
├── Payment Form
├── Card Validation
├── UI Management
└── Error Handling
```

### **Pages:**
```
test-payment-page.html    # صفحه پرداخت تستی
payment-success.html      # صفحه موفقیت
payment-cancel.html       # صفحه لغو
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
POST /api/payment/process      # پردازش پرداخت
GET /api/payment/test-cards    # دریافت کارت‌های تستی
POST /api/payment/generate-test-card  # تولید کارت تستی جدید
POST /api/payment/validate-card       # اعتبارسنجی کارت
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
- کارت‌های تستی قابل انتخاب
- پیش‌نمایش کارت
- انیمیشن‌های جذاب

### **ویژگی‌های فرم:**
- فرمت خودکار شماره کارت
- اعتبارسنجی فیلدها
- نمایش خطاها
- Loading state
- پیش‌نمایش کارت

### **کارت‌های تستی:**
- انتخاب آسان با کلیک
- نمایش موجودی
- توضیحات کامل
- تولید کارت جدید

## 🔄 جریان پرداخت

### **1. انتخاب محصول:**
```
کاربر → انتخاب محصول → کلیک خرید
```

### **2. بارگذاری صفحه پرداخت:**
```
Frontend → API → دریافت اطلاعات محصول
```

### **3. انتخاب کارت تستی:**
```
کاربر → انتخاب کارت → پر کردن خودکار فرم
```

### **4. پردازش پرداخت:**
```
Frontend → API → اعتبارسنجی → پردازش → ثبت
```

### **5. تکمیل تراکنش:**
```
Backend → Database → اعلان → هدایت کاربر
```

## 🛡️ امنیت

### **اعتبارسنجی‌ها:**
- **فرمت کارت**: بررسی 16 رقمی بودن
- **تاریخ انقضا**: بررسی اعتبار زمانی
- **CVC**: بررسی کد امنیتی
- **موجودی**: کنترل موجودی کارت

### **پیام‌های خطا:**
- کارت نامعتبر
- موجودی ناکافی
- کارت منقضی شده
- کارت رد شده

## 💳 کارت‌های تستی

### **کارت‌های موفق:**
```javascript
{
    cardNumber: '4242424242424242',
    expiryMonth: '12',
    expiryYear: '2025',
    cvc: '123',
    balance: 1000,
    description: 'کارت موفق - موجودی: $1000'
}
```

### **کارت‌های ناموفق:**
```javascript
{
    cardNumber: '4000000000009995',
    expiryMonth: '12',
    expiryYear: '2025',
    cvc: '123',
    reason: 'insufficient_funds',
    description: 'کارت ناموفق - موجودی ناکافی'
}
```

### **تولید کارت جدید:**
```javascript
// تولید کارت تستی جدید
const newCard = testPayment.generateTestCard();
```

## 🎯 قابلیت‌های پیشرفته

### **✅ پیاده‌سازی شده:**
- سیستم پرداخت کامل
- کارت‌های تستی متنوع
- اعتبارسنجی کامل
- رابط کاربری زیبا
- پیش‌نمایش کارت
- تولید کارت جدید

### **🔄 در حال توسعه:**
- [ ] پرداخت‌های تکراری
- [ ] اشتراک‌ها
- [ ] بازپرداخت
- [ ] گزارش‌های پیشرفته

### **📋 برنامه آینده:**
- [ ] کارت‌های مجازی
- [ ] پرداخت‌های موبایل
- [ ] داشبورد مدیریتی
- [ ] آمار و تحلیل

## 📊 عملکرد

### **بهینه‌سازی‌ها:**
- اعتبارسنجی فوری
- فرمت خودکار فیلدها
- مدیریت خطاها
- رابط کاربری واکنش‌گرا

### **محدودیت‌ها:**
- فقط برای تست و توسعه
- عدم اتصال به درگاه‌های واقعی
- محدودیت در تعداد کارت‌های تستی

## 🛠️ عیب‌یابی

### **مشکلات رایج:**

#### کارت نامعتبر
```
مشکل: کارت در سیستم ثبت نشده
راه‌حل: استفاده از کارت‌های تستی موجود
```

#### موجودی ناکافی
```
مشکل: موجودی کارت کمتر از مبلغ
راه‌حل: استفاده از کارت با موجودی کافی
```

#### خطای اعتبارسنجی
```
مشکل: فرمت نادرست فیلدها
راه‌حل: بررسی فرمت ورودی‌ها
```

### **لاگ‌های مفید:**
```javascript
// بررسی وضعیت سیستم
console.log('Test Payment Status:', testPayment.isInitialized);

// بررسی کارت‌های تستی
console.log('Test Cards:', testPayment.getTestCards());

// بررسی محصول فعلی
console.log('Current Product:', testPayment.getCurrentProduct());
```

## 🔄 به‌روزرسانی‌ها

### **نسخه 1.0 (فعلی):**
- ✅ سیستم پرداخت پایه
- ✅ کارت‌های تستی
- ✅ اعتبارسنجی کامل
- ✅ رابط کاربری زیبا

### **نسخه 1.1 (آینده):**
- [ ] کارت‌های مجازی
- [ ] پرداخت‌های تکراری
- [ ] گزارش‌های پیشرفته

### **نسخه 1.2 (آینده):**
- [ ] داشبورد مدیریتی
- [ ] آمار و تحلیل
- [ ] API پیشرفته

## 📞 پشتیبانی

### **مستندات:**
- بررسی کدهای خطا
- تست با کارت‌های مختلف
- بررسی لاگ‌های سرور

### **کمک:**
- استفاده از کارت‌های تستی موجود
- بررسی فرمت ورودی‌ها
- تست با محصولات مختلف

---

**نکته**: این سیستم فقط برای تست و توسعه طراحی شده و نباید در محیط تولید استفاده شود. 