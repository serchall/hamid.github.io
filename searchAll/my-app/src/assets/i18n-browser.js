// مدیریت چندزبانه با i18next
class I18nManager {
    constructor() {
        this.currentLanguage = 'fa';
        this.translations = {
            fa: {},
            en: {},
            ar: {},
            fr: {}
        };
        
        this.init();
    }

    // راه‌اندازی
    async init() {
        // بارگذاری ترجمه‌ها
        await this.loadTranslations();
        
        // تنظیم زبان پیش‌فرض
        this.setLanguage(this.getStoredLanguage() || 'fa');
        
        // اضافه کردن event listeners
        this.addEventListeners();
        
        console.log('✅ سیستم چندزبانه راه‌اندازی شد');
    }

    // بارگذاری ترجمه‌ها
    async loadTranslations() {
        try {
            // بارگذاری ترجمه فارسی
            const faResponse = await fetch('/locales/fa/translation.json');
            this.translations.fa = await faResponse.json();
            
            // بارگذاری ترجمه انگلیسی
            const enResponse = await fetch('/locales/en/translation.json');
            this.translations.en = await enResponse.json();
            
            // بارگذاری ترجمه عربی
            const arResponse = await fetch('/locales/ar/translation.json');
            this.translations.ar = await arResponse.json();
            
            // بارگذاری ترجمه فرانسوی
            const frResponse = await fetch('/locales/fr/translation.json');
            this.translations.fr = await frResponse.json();
            
            // بارگذاری ترجمه Deutsch
            const deResponse = await fetch('/locales/de/translation.json');
            this.translations.de = await deResponse.json();
            
        } catch (error) {
            console.error('خطا در بارگذاری ترجمه‌ها:', error);
            // استفاده از ترجمه‌های پیش‌فرض
            this.loadDefaultTranslations();
        }
    }

    // بارگذاری ترجمه‌های پیش‌فرض
    loadDefaultTranslations() {
        this.translations = {
            fa: {
                "common": {
                    "home": "خانه",
                    "about": "درباره ما",
                    "contact": "تماس با ما",
                    "login": "ورود",
                    "register": "ثبت‌نام",
                    "logout": "خروج",
                    "profile": "پروفایل",
                    "settings": "تنظیمات",
                    "search": "جستجو",
                    "submit": "ارسال",
                    "cancel": "لغو",
                    "save": "ذخیره",
                    "edit": "ویرایش",
                    "delete": "حذف",
                    "back": "بازگشت",
                    "next": "بعدی",
                    "previous": "قبلی",
                    "loading": "در حال بارگذاری...",
                    "error": "خطا",
                    "success": "موفقیت",
                    "warning": "هشدار",
                    "info": "اطلاعات",
                    "yes": "بله",
                    "no": "خیر",
                    "ok": "تأیید",
                    "close": "بستن",
                    "open": "باز کردن",
                    "download": "دانلود",
                    "upload": "آپلود",
                    "view": "مشاهده",
                    "add": "افزودن",
                    "remove": "حذف",
                    "select": "انتخاب",
                    "all": "همه",
                    "none": "هیچ‌کدام",
                    "language": "زبان",
                    "theme": "تم",
                    "dark": "تاریک",
                    "light": "روشن"
                },
                "navigation": {
                    "home": "خانه",
                    "shop": "فروشگاه",
                    "courses": "دوره‌ها",
                    "videos": "ویدیوها",
                    "support": "پشتیبانی",
                    "admin": "مدیریت",
                    "profile": "پروفایل",
                    "settings": "تنظیمات",
                    "logout": "خروج"
                }
            },
            en: {
                "common": {
                    "home": "Home",
                    "about": "About",
                    "contact": "Contact",
                    "login": "Login",
                    "register": "Register",
                    "logout": "Logout",
                    "profile": "Profile",
                    "settings": "Settings",
                    "search": "Search",
                    "submit": "Submit",
                    "cancel": "Cancel",
                    "save": "Save",
                    "edit": "Edit",
                    "delete": "Delete",
                    "back": "Back",
                    "next": "Next",
                    "previous": "Previous",
                    "loading": "Loading...",
                    "error": "Error",
                    "success": "Success",
                    "warning": "Warning",
                    "info": "Info",
                    "yes": "Yes",
                    "no": "No",
                    "ok": "OK",
                    "close": "Close",
                    "open": "Open",
                    "download": "Download",
                    "upload": "Upload",
                    "view": "View",
                    "add": "Add",
                    "remove": "Remove",
                    "select": "Select",
                    "all": "All",
                    "none": "None",
                    "language": "Language",
                    "theme": "Theme",
                    "dark": "Dark",
                    "light": "Light"
                },
                "navigation": {
                    "home": "Home",
                    "shop": "Shop",
                    "courses": "Courses",
                    "videos": "Videos",
                    "support": "Support",
                    "admin": "Admin",
                    "profile": "Profile",
                    "settings": "Settings",
                    "logout": "Logout"
                }
            },
            ar: {
                "common": {
                    "home": "الرئيسية",
                    "about": "حول",
                    "contact": "اتصل بنا",
                    "login": "تسجيل الدخول",
                    "register": "التسجيل",
                    "logout": "تسجيل الخروج",
                    "profile": "الملف الشخصي",
                    "settings": "الإعدادات",
                    "search": "البحث",
                    "submit": "إرسال",
                    "cancel": "إلغاء",
                    "save": "حفظ",
                    "edit": "تعديل",
                    "delete": "حذف",
                    "back": "رجوع",
                    "next": "التالي",
                    "previous": "السابق",
                    "loading": "جاري التحميل...",
                    "error": "خطأ",
                    "success": "نجح",
                    "warning": "تحذير",
                    "info": "معلومات",
                    "yes": "نعم",
                    "no": "لا",
                    "ok": "موافق",
                    "close": "إغلاق",
                    "open": "فتح",
                    "download": "تحميل",
                    "upload": "رفع",
                    "view": "عرض",
                    "add": "إضافة",
                    "remove": "إزالة",
                    "select": "اختيار",
                    "all": "الكل",
                    "none": "لا شيء",
                    "language": "اللغة",
                    "theme": "المظهر",
                    "dark": "داكن",
                    "light": "فاتح"
                },
                "navigation": {
                    "home": "الرئيسية",
                    "shop": "المتجر",
                    "courses": "الدورات",
                    "videos": "الفيديوهات",
                    "support": "الدعم",
                    "admin": "الإدارة",
                    "profile": "الملف الشخصي",
                    "settings": "الإعدادات",
                    "logout": "تسجيل الخروج"
                }
            },
            fr: {
                "common": {
                    "home": "Accueil",
                    "about": "À propos",
                    "contact": "Contact",
                    "login": "Connexion",
                    "register": "Inscription",
                    "logout": "Déconnexion",
                    "profile": "Profil",
                    "settings": "Paramètres",
                    "search": "Rechercher",
                    "submit": "Soumettre",
                    "cancel": "Annuler",
                    "save": "Enregistrer",
                    "edit": "Modifier",
                    "delete": "Supprimer",
                    "back": "Retour",
                    "next": "Suivant",
                    "previous": "Précédent",
                    "loading": "Chargement...",
                    "error": "Erreur",
                    "success": "Succès",
                    "warning": "Avertissement",
                    "info": "Information",
                    "yes": "Oui",
                    "no": "Non",
                    "ok": "OK",
                    "close": "Fermer",
                    "open": "Ouvrir",
                    "download": "Télécharger",
                    "upload": "Télécharger",
                    "view": "Voir",
                    "add": "Ajouter",
                    "remove": "Supprimer",
                    "select": "Sélectionner",
                    "all": "Tout",
                    "none": "Aucun",
                    "language": "Langue",
                    "theme": "Thème",
                    "dark": "Sombre",
                    "light": "Clair"
                },
                "navigation": {
                    "home": "Accueil",
                    "shop": "Boutique",
                    "courses": "Cours",
                    "videos": "Vidéos",
                    "support": "Support",
                    "admin": "Administration",
                    "profile": "Profil",
                    "settings": "Paramètres",
                    "logout": "Déconnexion"
                }
            }
        };
    }

    // تنظیم زبان
    setLanguage(language) {
        this.currentLanguage = language;
        localStorage.setItem('language', language);
        
        // تغییر جهت صفحه
        this.setPageDirection(language);
        
        // به‌روزرسانی عناصر صفحه
        this.updatePageElements();
        
        // ارسال event برای اطلاع سایر کامپوننت‌ها
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language } }));
        
        console.log(`🌐 زبان به ${language} تغییر یافت`);
    }

    // تنظیم جهت صفحه
    setPageDirection(language) {
        const html = document.documentElement;
        const body = document.body;
        
        if (language === 'fa' || language === 'ar' || language === 'de') {
            html.setAttribute('dir', 'rtl');
            html.setAttribute('lang', language);
            body.classList.add('rtl');
            body.classList.remove('ltr');
        } else {
            html.setAttribute('dir', 'ltr');
            html.setAttribute('lang', language);
            body.classList.add('ltr');
            body.classList.remove('rtl');
        }
    }

    // به‌روزرسانی عناصر صفحه
    updatePageElements() {
        // به‌روزرسانی عناصر با data-i18n
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            if (translation) {
                element.textContent = translation;
            }
        });
        
        // به‌روزرسانی عناصر با data-i18n-placeholder
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            const translation = this.t(key);
            if (translation) {
                element.placeholder = translation;
            }
        });
        
        // به‌روزرسانی عناصر با data-i18n-title
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            const translation = this.t(key);
            if (translation) {
                element.title = translation;
            }
        });
    }

    // ترجمه کلید
    t(key, params = {}) {
        const keys = key.split('.');
        let translation = this.translations[this.currentLanguage];
        
        for (const k of keys) {
            if (translation && translation[k]) {
                translation = translation[k];
            } else {
                // اگر ترجمه یافت نشد، کلید را برگردان
                return key;
            }
        }
        
        // جایگزینی پارامترها
        if (typeof translation === 'string') {
            Object.keys(params).forEach(param => {
                translation = translation.replace(`{{${param}}}`, params[param]);
            });
        }
        
        return translation;
    }

    // دریافت زبان ذخیره شده
    getStoredLanguage() {
        return localStorage.getItem('language');
    }

    // دریافت زبان فعلی
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    // تغییر زبان
    changeLanguage(language) {
        if (language !== this.currentLanguage) {
            this.setLanguage(language);
        }
    }

    // اضافه کردن event listeners
    addEventListeners() {
        // تغییر زبان از طریق دکمه‌ها
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-language]')) {
                const language = e.target.getAttribute('data-language');
                this.changeLanguage(language);
            }
        });
        
        // تغییر زبان از طریق select
        document.addEventListener('change', (e) => {
            if (e.target.matches('#languageSelect')) {
                const language = e.target.value;
                this.changeLanguage(language);
            }
        });
    }

    // ایجاد دکمه انتخاب زبان
    createLanguageSelector() {
        return `
            <div class="language-selector dropdown">
                <button class="btn btn-outline-light dropdown-toggle" type="button" data-bs-toggle="dropdown">
                    <i class="fas fa-globe me-1"></i>
                    <span data-i18n="common.language">زبان</span>
                </button>
                <ul class="dropdown-menu">
                    <li>
                        <a class="dropdown-item" href="#" data-language="fa">
                            <span class="flag-icon" style="background: linear-gradient(to bottom, #239f56 0%, #239f56 50%, #da0000 50%, #da0000 100%);"></span>
                            فارسی
                        </a>
                    </li>
                    <li>
                        <a class="dropdown-item" href="#" data-language="en">
                            <span class="flag-icon" style="background: linear-gradient(to bottom, #b22234 0%, #b22234 50%, #ffffff 50%, #ffffff 100%);"></span>
                            English
                        </a>
                    </li>
                    <li>
                        <a class="dropdown-item" href="#" data-language="ar">
                            <span class="flag-icon" style="background: linear-gradient(to bottom, #000000 0%, #000000 33%, #ffffff 33%, #ffffff 66%, #006c35 66%, #006c35 100%);"></span>
                            العربية
                        </a>
                    </li>
                    <li>
                        <a class="dropdown-item" href="#" data-language="fr">
                            <span class="flag-icon" style="background: linear-gradient(to right, #002395 0%, #002395 33%, #ffffff 33%, #ffffff 66%, #ed2939 66%, #ed2939 100%);"></span>
                            Français
                        </a>
                    </li>
                    <li>
                        <a class="dropdown-item" href="#" data-language="de">
                            <span class="flag-icon" style="background: linear-gradient(to bottom, #000000 0%, #000000 33%, #dd0000 33%, #dd0000 66%, #ffce00 66%, #ffce00 100%);"></span>
                            Deutsch
                        </a>
                    </li>
                </ul>
            </div>
        `;
    }

    // ایجاد select انتخاب زبان
    createLanguageSelect() {
        return `
            <select id="languageSelect" class="form-select form-select-sm">
                <option value="fa" ${this.currentLanguage === 'fa' ? 'selected' : ''}>
                    فارسی
                </option>
                <option value="en" ${this.currentLanguage === 'en' ? 'selected' : ''}>
                    English
                </option>
                <option value="ar" ${this.currentLanguage === 'ar' ? 'selected' : ''}>
                    العربية
                </option>
                <option value="fr" ${this.currentLanguage === 'fr' ? 'selected' : ''}>
                    Français
                </option>
                <option value="de" ${this.currentLanguage === 'de' ? 'selected' : ''}>
                    Deutsch
                </option>
            </select>
        `;
    }

    // به‌روزرسانی عنصر با ترجمه
    updateElement(element, key, params = {}) {
        const translation = this.t(key, params);
        if (translation && translation !== key) {
            element.textContent = translation;
        }
    }

    // به‌روزرسانی placeholder
    updatePlaceholder(element, key, params = {}) {
        const translation = this.t(key, params);
        if (translation && translation !== key) {
            element.placeholder = translation;
        }
    }

    // به‌روزرسانی title
    updateTitle(element, key, params = {}) {
        const translation = this.t(key, params);
        if (translation && translation !== key) {
            element.title = translation;
        }
    }

    // ترجمه کل صفحه
    translatePage() {
        this.updatePageElements();
    }

    // دریافت ترجمه‌های موجود
    getAvailableLanguages() {
        return Object.keys(this.translations);
    }

    // بررسی وجود ترجمه
    hasTranslation(key) {
        const translation = this.t(key);
        return translation !== key;
    }
}

// ایجاد نمونه سراسری
const i18n = new I18nManager();

// توابع عمومی برای استفاده در HTML
function t(key, params = {}) {
    return i18n.t(key, params);
}

function changeLanguage(language) {
    i18n.changeLanguage(language);
}

function getCurrentLanguage() {
    return i18n.getCurrentLanguage();
}

// راه‌اندازی خودکار
document.addEventListener('DOMContentLoaded', () => {
    // اضافه کردن CSS برای RTL
    if (i18n.getCurrentLanguage() === 'fa') {
        const style = document.createElement('style');
        style.textContent = `
            .rtl {
                direction: rtl;
                text-align: right;
            }
            
            .rtl .dropdown-menu {
                right: 0;
                left: auto;
            }
            
            .rtl .me-1 {
                margin-left: 0.25rem !important;
                margin-right: 0 !important;
            }
            
            .rtl .me-2 {
                margin-left: 0.5rem !important;
                margin-right: 0 !important;
            }
            
            .rtl .ms-1 {
                margin-right: 0.25rem !important;
                margin-left: 0 !important;
            }
            
            .rtl .ms-2 {
                margin-right: 0.5rem !important;
                margin-left: 0 !important;
            }
            
            .rtl .text-start {
                text-align: right !important;
            }
            
            .rtl .text-end {
                text-align: left !important;
            }
        `;
        document.head.appendChild(style);
    }
}); 