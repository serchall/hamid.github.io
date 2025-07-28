# سیستم احراز هویت دو مرحله‌ای (2FA)

## 📋 فهرست مطالب
- [معرفی](#معرفی)
- [ویژگی‌ها](#ویژگیها)
- [نحوه کار](#نحوه-کار)
- [نصب و راه‌اندازی](#نصب-و-راهاندازی)
- [استفاده](#استفاده)
- [API Endpoints](#api-endpoints)
- [امنیت](#امنیت)
- [عیب‌یابی](#عیبیابی)

## 🎯 معرفی

سیستم احراز هویت دو مرحله‌ای (Two-Factor Authentication) یک لایه امنیتی اضافی برای محافظت از حساب‌های کاربری است. این سیستم علاوه بر رمز عبور، از کد 6 رقمی ارسال شده به ایمیل کاربر نیز استفاده می‌کند.

## ✨ ویژگی‌ها

- **کد 6 رقمی**: تولید کد تصادفی 6 رقمی
- **ارسال ایمیل**: ارسال کد به ایمیل کاربر
- **زمان انقضا**: کد تا 5 دقیقه معتبر است
- **ارسال مجدد**: امکان ارسال مجدد کد
- **فعال/غیرفعال**: امکان فعال یا غیرفعال کردن 2FA
- **رابط کاربری**: فرم زیبا و کاربرپسند
- **امنیت بالا**: محافظت در برابر حملات brute force

## 🔄 نحوه کار

### 1. فرآیند ورود با 2FA
```
کاربر → ورود ایمیل/رمز → بررسی 2FA → ارسال کد → تایید کد → ورود موفق
```

### 2. فرآیند فعال‌سازی 2FA
```
کاربر → پروفایل → فعال‌سازی 2FA → تایید رمز → فعال شدن
```

## 🚀 نصب و راه‌اندازی

### 1. نصب Dependencies
```bash
npm install nodemailer
```

### 2. تنظیمات ایمیل
در فایل `.env` یا متغیرهای محیطی:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
JWT_SECRET=your-secret-key
```

### 3. تنظیمات Gmail
برای استفاده از Gmail:
1. فعال کردن Two-Factor Authentication در Gmail
2. ایجاد App Password
3. استفاده از App Password در EMAIL_PASS

### 4. راه‌اندازی دیتابیس
ستون `twoFactorEnabled` به جدول `users` اضافه می‌شود:

```sql
ALTER TABLE users ADD COLUMN twoFactorEnabled INTEGER DEFAULT 0;
```

## 📱 استفاده

### 1. ورود کاربر
```javascript
// مرحله 1: ورود با ایمیل و رمز
const loginResponse = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
});

const loginData = await loginResponse.json();

if (loginData.requires2FA) {
    // مرحله 2: تایید کد 2FA
    const verifyResponse = await fetch('/api/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            code: '123456', 
            tempToken: loginData.tempToken 
        })
    });
}
```

### 2. فعال‌سازی 2FA
```javascript
const response = await fetch('/api/profile/toggle-2fa', {
    method: 'POST',
    headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ enable: true, password: 'userPassword' })
});
```

### 3. ارسال مجدد کد
```javascript
const response = await fetch('/api/resend-2fa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tempToken })
});
```

## 🔌 API Endpoints

### POST /api/login
ورود کاربر و بررسی نیاز به 2FA

**Request:**
```json
{
    "email": "user@example.com",
    "password": "userPassword"
}
```

**Response (بدون 2FA):**
```json
{
    "success": true,
    "token": "jwt_token",
    "requires2FA": false
}
```

**Response (با 2FA):**
```json
{
    "success": true,
    "requires2FA": true,
    "message": "کد احراز هویت به ایمیل شما ارسال شد",
    "tempToken": "temporary_jwt_token"
}
```

### POST /api/verify-2fa
تایید کد 2FA

**Request:**
```json
{
    "code": "123456",
    "tempToken": "temporary_jwt_token"
}
```

**Response:**
```json
{
    "success": true,
    "token": "final_jwt_token",
    "message": "احراز هویت موفقیت‌آمیز بود"
}
```

### POST /api/resend-2fa
ارسال مجدد کد 2FA

**Request:**
```json
{
    "tempToken": "temporary_jwt_token"
}
```

**Response:**
```json
{
    "success": true,
    "message": "کد جدید ارسال شد"
}
```

### POST /api/profile/toggle-2fa
فعال/غیرفعال کردن 2FA

**Request:**
```json
{
    "enable": true,
    "password": "userPassword"
}
```

**Response:**
```json
{
    "success": true,
    "message": "احراز هویت دو مرحله‌ای فعال شد",
    "twoFactorEnabled": true
}
```

## 🔒 امنیت

### 1. محافظت‌های امنیتی
- **کد موقت**: کدها در حافظه موقت ذخیره می‌شوند
- **زمان انقضا**: کدها پس از 5 دقیقه منقضی می‌شوند
- **توکن موقت**: استفاده از JWT موقت برای مرحله دوم
- **Rate Limiting**: محدودیت ارسال کد
- **Brute Force Protection**: محافظت در برابر حملات

### 2. بهترین شیوه‌ها
- استفاده از App Password برای Gmail
- تغییر JWT_SECRET در محیط production
- استفاده از HTTPS در production
- لاگ کردن فعالیت‌های مشکوک

### 3. محدودیت‌ها
- حداکثر 5 تلاش ورود در 15 دقیقه
- کد 6 رقمی فقط شامل اعداد
- زمان انقضای 5 دقیقه‌ای

## 🛠️ عیب‌یابی

### مشکلات رایج

#### 1. خطا در ارسال ایمیل
```
خطا: خطا در ارسال کد احراز هویت
راه‌حل: بررسی تنظیمات EMAIL_USER و EMAIL_PASS
```

#### 2. کد منقضی شده
```
خطا: کد نامعتبر یا منقضی شده است
راه‌حل: استفاده از دکمه "ارسال مجدد کد"
```

#### 3. خطای Gmail
```
خطا: Authentication failed
راه‌حل: استفاده از App Password به جای رمز اصلی
```

### لاگ‌های مفید
```javascript
// لاگ کردن ارسال کد
console.log(`📧 2FA code sent to ${email}: ${code}`);

// لاگ کردن تایید کد
console.log(`✅ 2FA verification successful for user ${userId}`);

// لاگ کردن خطاها
console.error('❌ 2FA email sending failed:', error);
```

## 📊 آمار و مانیتورینگ

### متغیرهای قابل ردیابی
- تعداد کدهای ارسال شده
- نرخ موفقیت تایید کد
- تعداد تلاش‌های ناموفق
- زمان متوسط تایید

### مثال کد مانیتورینگ
```javascript
// ردیابی آمار 2FA
const twoFactorStats = {
    codesSent: 0,
    codesVerified: 0,
    failedAttempts: 0,
    averageVerificationTime: 0
};
```

## 🔄 به‌روزرسانی‌های آینده

### ویژگی‌های پیشنهادی
- **SMS 2FA**: ارسال کد به شماره تلفن
- **Authenticator Apps**: پشتیبانی از Google Authenticator
- **Backup Codes**: کدهای پشتیبان
- **Remember Device**: به خاطر سپردن دستگاه
- **Multiple Methods**: چندین روش احراز هویت

### بهبودهای امنیتی
- **Hardware Tokens**: پشتیبانی از توکن‌های سخت‌افزاری
- **Biometric**: احراز هویت بیومتریک
- **Risk-Based**: احراز هویت بر اساس ریسک
- **Device Fingerprinting**: شناسایی دستگاه

## 📞 پشتیبانی

برای سوالات و مشکلات:
1. بررسی لاگ‌های سرور
2. تست تنظیمات ایمیل
3. بررسی متغیرهای محیطی
4. مراجعه به مستندات API

---

**نکته**: این سیستم برای محیط‌های production نیاز به تنظیمات اضافی امنیتی دارد. 