#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// تنظیمات زبان‌های پشتیبانی شده
const supportedLanguages = {
    'fa': {
        name: 'فارسی',
        nativeName: 'فارسی',
        flag: 'linear-gradient(to bottom, #239f56 0%, #239f56 50%, #da0000 50%, #da0000 100%)',
        rtl: true
    },
    'en': {
        name: 'English',
        nativeName: 'English',
        flag: 'linear-gradient(to bottom, #b22234 0%, #b22234 50%, #ffffff 50%, #ffffff 100%)',
        rtl: false
    },
    'ar': {
        name: 'العربية',
        nativeName: 'العربية',
        flag: 'linear-gradient(to bottom, #000000 0%, #000000 33%, #ffffff 33%, #ffffff 66%, #006c35 66%, #006c35 100%)',
        rtl: true
    },
    'fr': {
        name: 'Français',
        nativeName: 'Français',
        flag: 'linear-gradient(to right, #002395 0%, #002395 33%, #ffffff 33%, #ffffff 66%, #ed2939 66%, #ed2939 100%)',
        rtl: false
    },
    'de': {
        name: 'Deutsch',
        nativeName: 'Deutsch',
        flag: 'linear-gradient(to bottom, #000000 0%, #000000 33%, #dd0000 33%, #dd0000 66%, #ffce00 66%, #ffce00 100%)',
        rtl: false
    },
    'es': {
        name: 'Español',
        nativeName: 'Español',
        flag: 'linear-gradient(to bottom, #aa151b 0%, #aa151b 25%, #f1bf00 25%, #f1bf00 75%, #aa151b 75%, #aa151b 100%)',
        rtl: false
    },
    'zh': {
        name: '中文',
        nativeName: '中文',
        flag: '#de2910',
        rtl: false
    },
    'ru': {
        name: 'Русский',
        nativeName: 'Русский',
        flag: 'linear-gradient(to bottom, #ffffff 0%, #ffffff 33%, #0039a6 33%, #0039a6 66%, #d52b1e 66%, #d52b1e 100%)',
        rtl: false
    },
    'ja': {
        name: '日本語',
        nativeName: '日本語',
        flag: '#ffffff',
        rtl: false
    },
    'ko': {
        name: '한국어',
        nativeName: '한국어',
        flag: '#cd2e3a',
        rtl: false
    }
};

// قالب ترجمه پایه
const baseTranslation = {
    "common": {
        "home": "",
        "about": "",
        "contact": "",
        "login": "",
        "register": "",
        "logout": "",
        "profile": "",
        "settings": "",
        "search": "",
        "submit": "",
        "cancel": "",
        "save": "",
        "edit": "",
        "delete": "",
        "back": "",
        "next": "",
        "previous": "",
        "loading": "",
        "error": "",
        "success": "",
        "warning": "",
        "info": "",
        "yes": "",
        "no": "",
        "ok": "",
        "close": "",
        "open": "",
        "download": "",
        "upload": "",
        "view": "",
        "add": "",
        "remove": "",
        "select": "",
        "all": "",
        "none": "",
        "language": "",
        "theme": "",
        "dark": "",
        "light": ""
    },
    "navigation": {
        "home": "",
        "shop": "",
        "courses": "",
        "videos": "",
        "support": "",
        "admin": "",
        "profile": "",
        "settings": "",
        "logout": ""
    },
    "auth": {
        "login": "",
        "register": "",
        "logout": "",
        "email": "",
        "password": "",
        "confirmPassword": "",
        "name": "",
        "forgotPassword": "",
        "rememberMe": "",
        "loginSuccess": "",
        "registerSuccess": "",
        "invalidCredentials": "",
        "emailExists": "",
        "passwordMismatch": "",
        "twoFactorAuth": "",
        "enterCode": "",
        "resendCode": "",
        "verifyCode": ""
    },
    "shop": {
        "title": "",
        "products": "",
        "addToCart": "",
        "cart": "",
        "checkout": "",
        "price": "",
        "quantity": "",
        "total": "",
        "emptyCart": "",
        "removeItem": "",
        "continueShopping": "",
        "orderSummary": "",
        "payment": "",
        "orderComplete": ""
    },
    "courses": {
        "title": "",
        "courses": "",
        "viewCourse": "",
        "enroll": "",
        "progress": "",
        "certificate": "",
        "lessons": "",
        "duration": "",
        "level": "",
        "instructor": "",
        "description": "",
        "requirements": "",
        "whatYouLearn": "",
        "courseContent": "",
        "quiz": "",
        "assignment": "",
        "downloadCertificate": ""
    },
    "videos": {
        "title": "",
        "videos": "",
        "uploadVideo": "",
        "play": "",
        "pause": "",
        "like": "",
        "dislike": "",
        "share": "",
        "comment": "",
        "views": "",
        "duration": "",
        "category": "",
        "searchVideos": "",
        "trending": "",
        "latest": "",
        "recommended": ""
    },
    "support": {
        "title": "",
        "tickets": "",
        "newTicket": "",
        "liveChat": "",
        "createTicket": "",
        "subject": "",
        "description": "",
        "priority": "",
        "category": "",
        "status": "",
        "replies": "",
        "sendReply": "",
        "startChat": "",
        "closeChat": "",
        "waiting": "",
        "inProgress": "",
        "resolved": "",
        "closed": "",
        "urgent": "",
        "high": "",
        "medium": "",
        "low": "",
        "technical": "",
        "billing": "",
        "general": "",
        "bugReport": ""
    },
    "profile": {
        "title": "",
        "personalInfo": "",
        "editProfile": "",
        "changePassword": "",
        "myCourses": "",
        "myOrders": "",
        "myVideos": "",
        "uploadProfilePic": "",
        "firstName": "",
        "lastName": "",
        "phone": "",
        "address": "",
        "bio": "",
        "saveChanges": "",
        "oldPassword": "",
        "newPassword": "",
        "confirmNewPassword": ""
    },
    "admin": {
        "title": "",
        "dashboard": "",
        "users": "",
        "products": "",
        "orders": "",
        "courses": "",
        "videos": "",
        "tickets": "",
        "reports": "",
        "settings": "",
        "addUser": "",
        "editUser": "",
        "deleteUser": "",
        "userManagement": "",
        "systemSettings": "",
        "backup": "",
        "logs": ""
    },
    "notifications": {
        "title": "",
        "notifications": "",
        "markAsRead": "",
        "delete": "",
        "noNotifications": "",
        "newMessage": "",
        "friendRequest": "",
        "orderUpdate": "",
        "courseUpdate": "",
        "systemNotification": ""
    },
    "payment": {
        "title": "",
        "paymentMethod": "",
        "cardNumber": "",
        "expiryDate": "",
        "cvv": "",
        "cardholderName": "",
        "processPayment": "",
        "paymentSuccess": "",
        "paymentFailed": "",
        "paymentCancelled": "",
        "amount": "",
        "currency": "",
        "transactionId": "",
        "testPayment": "",
        "testCards": "",
        "generateTestCard": ""
    },
    "messenger": {
        "title": "",
        "conversations": "",
        "newMessage": "",
        "sendMessage": "",
        "typeMessage": "",
        "online": "",
        "offline": "",
        "lastSeen": "",
        "searchConversations": "",
        "createGroup": "",
        "addMember": "",
        "removeMember": "",
        "leaveGroup": ""
    },
    "footer": {
        "aboutUs": "",
        "contactUs": "",
        "privacyPolicy": "",
        "termsOfService": "",
        "help": "",
        "faq": "",
        "copyright": "",
        "followUs": "",
        "newsletter": "",
        "subscribe": "",
        "emailPlaceholder": ""
    }
};

// تابع اصلی
function addLanguage(langCode) {
    const lang = supportedLanguages[langCode];
    
    if (!lang) {
        console.error(`❌ زبان ${langCode} پشتیبانی نمی‌شود`);
        console.log('✅ زبان‌های پشتیبانی شده:');
        Object.keys(supportedLanguages).forEach(code => {
            console.log(`   ${code}: ${supportedLanguages[code].name}`);
        });
        return;
    }

    console.log(`🌐 اضافه کردن زبان ${lang.name} (${langCode})...`);

    // ایجاد پوشه زبان
    const langDir = path.join(__dirname, 'locales', langCode);
    if (!fs.existsSync(langDir)) {
        fs.mkdirSync(langDir, { recursive: true });
        console.log(`📁 پوشه ${langDir} ایجاد شد`);
    }

    // ایجاد فایل ترجمه
    const translationFile = path.join(langDir, 'translation.json');
    if (fs.existsSync(translationFile)) {
        console.log(`⚠️  فایل ترجمه ${langCode} قبلاً وجود دارد`);
        const overwrite = process.argv.includes('--force');
        if (!overwrite) {
            console.log('برای بازنویسی از --force استفاده کنید');
            return;
        }
    }

    fs.writeFileSync(translationFile, JSON.stringify(baseTranslation, null, 2));
    console.log(`📄 فایل ترجمه ${translationFile} ایجاد شد`);

    // به‌روزرسانی i18n-browser.js
    updateI18nBrowser(langCode, lang);

    // به‌روزرسانی index.html
    updateIndexHtml(langCode, lang);

    console.log(`✅ زبان ${lang.name} با موفقیت اضافه شد!`);
    console.log(`📝 لطفاً فایل ${translationFile} را ویرایش کنید و ترجمه‌ها را اضافه کنید`);
}

// به‌روزرسانی i18n-browser.js
function updateI18nBrowser(langCode, lang) {
    const i18nFile = path.join(__dirname, 'i18n-browser.js');
    
    if (!fs.existsSync(i18nFile)) {
        console.log('⚠️ فایل i18n-browser.js یافت نشد');
        return;
    }

    let content = fs.readFileSync(i18nFile, 'utf8');

    // اضافه کردن بارگذاری زبان جدید
    const loadPattern = /\/\/ بارگذاری ترجمه فرانسوی[\s\S]*?this\.translations\.fr = await frResponse\.json\(\);/;
    const newLoad = `// بارگذاری ترجمه فرانسوی
            const frResponse = await fetch('/locales/fr/translation.json');
            this.translations.fr = await frResponse.json();
            
            // بارگذاری ترجمه ${lang.name}
            const ${langCode}Response = await fetch('/locales/${langCode}/translation.json');
            this.translations.${langCode} = await ${langCode}Response.json();`;

    content = content.replace(loadPattern, newLoad);

    // اضافه کردن به setPageDirection
    const directionPattern = /if \(language === 'fa' \|\| language === 'ar'\)/;
    const newDirection = `if (language === 'fa' || language === 'ar' || language === '${langCode}')`;

    content = content.replace(directionPattern, newDirection);

    // اضافه کردن به createLanguageSelector
    const selectorPattern = /<li>\s*<a class="dropdown-item" href="#" data-language="fr">[\s\S]*?<\/li>\s*<\/ul>/;
    const newSelector = `<li>
                        <a class="dropdown-item" href="#" data-language="fr">
                            <span class="flag-icon" style="background: linear-gradient(to right, #002395 0%, #002395 33%, #ffffff 33%, #ffffff 66%, #ed2939 66%, #ed2939 100%);"></span>
                            Français
                        </a>
                    </li>
                    <li>
                        <a class="dropdown-item" href="#" data-language="${langCode}">
                            <span class="flag-icon" style="background: ${lang.flag};"></span>
                            ${lang.nativeName}
                        </a>
                    </li>
                </ul>`;

    content = content.replace(selectorPattern, newSelector);

    // اضافه کردن به createLanguageSelect
    const selectPattern = /<option value="fr" \${this\.currentLanguage === 'fr' \? 'selected' : ''}>\s*Français\s*<\/option>\s*<\/select>/;
    const newSelect = `<option value="fr" \${this.currentLanguage === 'fr' ? 'selected' : ''}>
                    Français
                </option>
                <option value="${langCode}" \${this.currentLanguage === '${langCode}' ? 'selected' : ''}>
                    ${lang.nativeName}
                </option>
            </select>`;

    content = content.replace(selectPattern, newSelect);

    fs.writeFileSync(i18nFile, content);
    console.log(`📝 فایل i18n-browser.js به‌روزرسانی شد`);
}

// به‌روزرسانی index.html
function updateIndexHtml(langCode, lang) {
    const indexFile = path.join(__dirname, 'index.html');
    
    if (!fs.existsSync(indexFile)) {
        console.log('⚠️ فایل index.html یافت نشد');
        return;
    }

    let content = fs.readFileSync(indexFile, 'utf8');

    // اضافه کردن دکمه زبان جدید
    const menuPattern = /<li>\s*<a class="dropdown-item" href="#" data-language="fr">[\s\S]*?<\/li>\s*<\/ul>/;
    const newMenu = `<li>
                        <a class="dropdown-item" href="#" data-language="fr">
                            <span class="flag-icon" style="background: linear-gradient(to right, #002395 0%, #002395 33%, #ffffff 33%, #ffffff 66%, #ed2939 66%, #ed2939 100%);"></span>
                            Français
                        </a>
                    </li>
                    <li>
                        <a class="dropdown-item" href="#" data-language="${langCode}">
                            <span class="flag-icon" style="background: ${lang.flag};"></span>
                            ${lang.nativeName}
                        </a>
                    </li>
                </ul>`;

    content = content.replace(menuPattern, newMenu);

    fs.writeFileSync(indexFile, content);
    console.log(`📝 فایل index.html به‌روزرسانی شد`);
}

// نمایش راهنما
function showHelp() {
    console.log(`
🌐 ابزار اضافه کردن زبان جدید

نحوه استفاده:
  node add-language.js [کد_زبان]

مثال‌ها:
  node add-language.js de    # اضافه کردن آلمانی
  node add-language.js es    # اضافه کردن اسپانیایی
  node add-language.js zh    # اضافه کردن چینی

زبان‌های پشتیبانی شده:
${Object.keys(supportedLanguages).map(code => `  ${code}: ${supportedLanguages[code].name}`).join('\n')}

گزینه‌ها:
  --force    بازنویسی فایل‌های موجود
  --help     نمایش این راهنما
    `);
}

// اجرای اصلی
const args = process.argv.slice(2);

if (args.includes('--help') || args.length === 0) {
    showHelp();
    process.exit(0);
}

const langCode = args[0];
addLanguage(langCode); 