# فروشگاه آنلاین و مرکز آموزشی - Frontend

این پروژه یک Single Page Application (SPA) با React است که شامل فروشگاه آنلاین، دوره‌های آموزشی، ویدئوها و پیام‌رسان می‌باشد.

## ویژگی‌ها

- 🛒 **فروشگاه آنلاین** - محصولات متنوع با سبد خرید
- 📚 **دوره‌های آموزشی** - آموزش‌های تخصصی
- 🎥 **ویدئوها** - ویدئوهای آموزشی
- 💬 **پیام‌رسان** - چت زنده با Socket.io
- 🌙 **تم تاریک/روشن** - پشتیبانی از تم تاریک
- 📱 **واکنش‌گرا** - سازگار با موبایل و تبلت
- 🔐 **احراز هویت** - سیستم ورود و ثبت‌نام
- 👨‍💼 **ادمین پنل** - مدیریت محتوا

## نصب و راه‌اندازی

### پیش‌نیازها
- Node.js (نسخه 14 یا بالاتر)
- npm یا yarn

### نصب وابستگی‌ها
```bash
npm install
```

### اجرای پروژه در حالت توسعه
```bash
npm start
```

پروژه در آدرس `http://localhost:3000` اجرا می‌شود.

### ساخت نسخه تولید
```bash
npm run build
```

## ساختار پروژه

```
src/
├── components/          # کامپوننت‌های قابل استفاده مجدد
│   ├── Navbar.js       # نوار ناوبری
│   ├── Sidebar.js      # نوار کناری
│   ├── FloatingChat.js # پیام‌رسان شناور
│   └── ...
├── context/            # Context API برای مدیریت state
│   ├── AuthContext.js  # مدیریت احراز هویت
│   ├── CartContext.js  # مدیریت سبد خرید
│   ├── ChatContext.js  # مدیریت پیام‌رسان
│   └── ThemeContext.js # مدیریت تم
├── pages/              # صفحات اصلی
│   ├── Home.js         # صفحه اصلی
│   ├── Shop.js         # فروشگاه
│   ├── Chat.js         # پیام‌رسان
│   └── ...
├── styles/             # فایل‌های CSS
│   └── App.css         # استایل‌های اصلی
├── App.js              # کامپوننت اصلی
└── index.js            # نقطه ورود
```

## تکنولوژی‌های استفاده شده

- **React 18** - کتابخانه اصلی
- **React Router** - مدیریت مسیرها
- **Bootstrap 5** - فریم‌ورک CSS
- **Socket.io Client** - ارتباط زنده
- **Axios** - درخواست‌های HTTP
- **React Hot Toast** - نوتیفیکیشن‌ها

## API Endpoints

پروژه به backend در آدرس `http://localhost:3001` متصل می‌شود.

### احراز هویت
- `POST /api/auth/login` - ورود
- `POST /api/auth/register` - ثبت‌نام
- `GET /api/auth/profile` - پروفایل کاربر

### محصولات
- `GET /api/products` - لیست محصولات
- `GET /api/products/:id` - جزئیات محصول
- `POST /api/products/:id/review` - افزودن نظر

### سبد خرید
- `POST /api/orders` - ایجاد سفارش
- `GET /api/orders/my` - سفارشات کاربر

## متغیرهای محیطی

فایل `.env` را در پوشه `client` ایجاد کنید:

```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_SOCKET_URL=http://localhost:3001
```

## نکات مهم

1. **Backend**: قبل از اجرای frontend، مطمئن شوید که backend در حال اجرا است.
2. **Socket.io**: برای پیام‌رسان، Socket.io باید در backend فعال باشد.
3. **CORS**: backend باید CORS را برای frontend فعال کند.
4. **پروکسی**: در حالت توسعه، درخواست‌ها به `http://localhost:3001` ارسال می‌شوند.

## مشارکت

برای مشارکت در پروژه:

1. پروژه را fork کنید
2. یک branch جدید ایجاد کنید
3. تغییرات خود را commit کنید
4. Pull Request ارسال کنید

## لایسنس

این پروژه تحت لایسنس MIT منتشر شده است. 