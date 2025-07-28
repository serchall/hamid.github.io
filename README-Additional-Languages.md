# زبان‌های اضافی (Additional Languages)

## 🌍 زبان‌های پشتیبانی شده

### ✅ پیاده‌سازی شده
1. **فارسی (Persian)** - `fa`
   - پشتیبانی کامل از RTL
   - فونت‌های فارسی
   - ترجمه کامل تمام بخش‌ها

2. **انگلیسی (English)** - `en`
   - پشتیبانی از LTR
   - فونت‌های انگلیسی
   - ترجمه کامل تمام بخش‌ها

3. **عربی (Arabic)** - `ar`
   - پشتیبانی کامل از RTL
   - فونت‌های عربی
   - ترجمه کامل تمام بخش‌ها

4. **فرانسوی (French)** - `fr`
   - پشتیبانی از LTR
   - فونت‌های فرانسوی
   - ترجمه کامل تمام بخش‌ها

## 📁 ساختار فایل‌ها

```
locales/
├── fa/
│   └── translation.json    # فارسی
├── en/
│   └── translation.json    # انگلیسی
├── ar/
│   └── translation.json    # عربی
└── fr/
    └── translation.json    # فرانسوی
```

## 🚀 نحوه اضافه کردن زبان جدید

### 1. ایجاد فایل ترجمه
```bash
mkdir -p locales/[کد_زبان]
touch locales/[کد_زبان]/translation.json
```

### 2. اضافه کردن ترجمه‌ها
```json
{
  "common": {
    "home": "ترجمه",
    "about": "ترجمه",
    // ...
  }
}
```

### 3. به‌روزرسانی i18n-browser.js
```javascript
// در تابع loadTranslations
const newLangResponse = await fetch('/locales/[کد_زبان]/translation.json');
this.translations.[کد_زبان] = await newLangResponse.json();
```

### 4. اضافه کردن دکمه زبان
```html
<li>
    <a class="dropdown-item" href="#" data-language="[کد_زبان]">
        <span class="flag-icon" style="background: [رنگ_پرچم];"></span>
        نام زبان
    </a>
</li>
```

### 5. تنظیم جهت صفحه
```javascript
// در تابع setPageDirection
if (language === 'fa' || language === 'ar' || language === '[کد_زبان_RTL]') {
    html.setAttribute('dir', 'rtl');
} else {
    html.setAttribute('dir', 'ltr');
}
```

## 🌐 زبان‌های پیشنهادی برای آینده

### اولویت بالا
1. **آلمانی (German)** - `de`
   - بازار بزرگ اروپا
   - پشتیبانی از LTR

2. **اسپانیایی (Spanish)** - `es`
   - بازار بزرگ آمریکای لاتین
   - پشتیبانی از LTR

3. **چینی (Chinese)** - `zh`
   - بازار بزرگ آسیا
   - پشتیبانی از LTR

### اولویت متوسط
4. **روسی (Russian)** - `ru`
   - بازار اروپای شرقی
   - پشتیبانی از LTR

5. **ژاپنی (Japanese)** - `ja`
   - بازار آسیا
   - پشتیبانی از LTR

6. **کره‌ای (Korean)** - `ko`
   - بازار آسیا
   - پشتیبانی از LTR

### اولویت پایین
7. **ایتالیایی (Italian)** - `it`
8. **پرتغالی (Portuguese)** - `pt`
9. **هلندی (Dutch)** - `nl`
10. **سوئدی (Swedish)** - `sv`

## 🎨 استایل‌های پرچم

### پرچم‌های فعلی
```css
/* ایران */
background: linear-gradient(to bottom, #239f56 0%, #239f56 50%, #da0000 50%, #da0000 100%);

/* آمریکا */
background: linear-gradient(to bottom, #b22234 0%, #b22234 50%, #ffffff 50%, #ffffff 100%);

/* عربستان */
background: linear-gradient(to bottom, #000000 0%, #000000 33%, #ffffff 33%, #ffffff 66%, #006c35 66%, #006c35 100%);

/* فرانسه */
background: linear-gradient(to right, #002395 0%, #002395 33%, #ffffff 33%, #ffffff 66%, #ed2939 66%, #ed2939 100%);
```

### پرچم‌های پیشنهادی
```css
/* آلمان */
background: linear-gradient(to bottom, #000000 0%, #000000 33%, #dd0000 33%, #dd0000 66%, #ffce00 66%, #ffce00 100%);

/* اسپانیا */
background: linear-gradient(to bottom, #aa151b 0%, #aa151b 25%, #f1bf00 25%, #f1bf00 75%, #aa151b 75%, #aa151b 100%);

/* چین */
background: #de2910;
```

## 🔧 تنظیمات پیشرفته

### تشخیص خودکار زبان
```javascript
// تشخیص زبان مرورگر
const browserLang = navigator.language || navigator.userLanguage;
const supportedLangs = ['fa', 'en', 'ar', 'fr'];
const defaultLang = 'fa';

// انتخاب بهترین زبان
function getBestLanguage() {
    const lang = browserLang.split('-')[0];
    return supportedLangs.includes(lang) ? lang : defaultLang;
}
```

### ذخیره‌سازی زبان
```javascript
// ذخیره در localStorage
localStorage.setItem('language', language);

// بازیابی از localStorage
const savedLang = localStorage.getItem('language') || getBestLanguage();
```

### به‌روزرسانی پویا
```javascript
// به‌روزرسانی عناصر صفحه
function updatePageElements() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = t(key);
        if (translation) {
            element.textContent = translation;
        }
    });
}
```

## 📊 آمار استفاده

### زبان‌های محبوب در وب
1. انگلیسی - 25.9%
2. چینی - 19.4%
3. اسپانیایی - 7.9%
4. عربی - 5.2%
5. فرانسوی - 3.7%
6. آلمانی - 3.3%
7. روسی - 2.8%
8. فارسی - 1.1%

### توصیه‌های SEO
- استفاده از `hreflang` برای SEO
- تنظیم `lang` attribute در HTML
- ترجمه متا تگ‌ها
- URL های محلی شده

## 🚀 عملکرد

### اندازه فایل‌ها
- فارسی: ~15KB
- انگلیسی: ~12KB
- عربی: ~14KB
- فرانسوی: ~13KB

### سرعت بارگذاری
- بارگذاری اولیه: <100ms
- تغییر زبان: <50ms
- به‌روزرسانی UI: <30ms

## 🔒 امنیت

### اعتبارسنجی
- بررسی وجود فایل ترجمه
- اعتبارسنجی JSON
- محافظت در برابر XSS

### دسترسی
- محدودیت دسترسی به فایل‌ها
- بررسی مجوزهای کاربر
- لاگ تغییرات زبان

## 📞 پشتیبانی

برای اضافه کردن زبان جدید یا گزارش مشکل:
- ایمیل: support@example.com
- تیکت: بخش پشتیبانی سایت
- GitHub: Issues repository

---

**توسعه‌دهنده**: تیم توسعه وب‌سایت  
**آخرین به‌روزرسانی**: 2024  
**نسخه**: 1.1.0 