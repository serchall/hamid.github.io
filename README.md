# فروشگاه ساده - Simple Shop

یک پلتفرم جامع تجارت الکترونیک و محتوا با قابلیت‌های احراز هویت، چت، دوره‌های آموزشی و ویدئو.

## 🚀 ویژگی‌ها

- **فروشگاه آنلاین**: مدیریت محصولات و سبد خرید
- **احراز هویت امن**: ثبت‌نام و ورود با JWT
- **چت زنده**: ارتباط آنلاین با Socket.io
- **دوره‌های آموزشی**: مدیریت و ثبت‌نام در دوره‌ها
- **ویدئوها**: آپلود و اشتراک‌گذاری ویدئو
- **پنل ادمین**: مدیریت کامل سیستم
- **اعلان‌ها**: سیستم اعلان‌های زنده
- **طراحی واکنش‌گرا**: سازگار با موبایل و دسکتاپ
- **امنیت بالا**: XSS، CSRF، رمزنگاری پسورد
- **تحلیل‌گر وب**: Google Analytics برای ردیابی رفتار کاربران

## 🛠️ تکنولوژی‌ها

### Frontend
- HTML5, CSS3, JavaScript (Vanilla)
- Bootstrap 5 (طراحی واکنش‌گرا)
- Font Awesome (آیکون‌ها)
- Socket.io Client (چت زنده)

### Backend
- Node.js & Express.js
- MongoDB & Mongoose
- JWT Authentication
- Socket.io (چت زنده)
- Multer (آپلود فایل)
- bcrypt (رمزنگاری)
- XSS & CSRF Protection

## 📦 نصب و راه‌اندازی

### پیش‌نیازها
- Node.js (نسخه 16 یا بالاتر)
- MongoDB (محلی یا Atlas)
- npm یا yarn

### مراحل نصب

1. **کلون کردن پروژه**
```bash
git clone https://github.com/yourusername/simple-shop.git
cd simple-shop
```

2. **نصب وابستگی‌ها**
```bash
npm install
```

3. **تنظیم متغیرهای محیطی**
```bash
cp env.example .env
```
فایل `.env` را ویرایش کنید و مقادیر مناسب را وارد کنید.

4. **راه‌اندازی MongoDB**
- برای توسعه محلی: MongoDB را نصب و اجرا کنید
- برای تولید: از MongoDB Atlas استفاده کنید

5. **اجرای پروژه**
```bash
# توسعه
npm run dev

# تولید
npm start
```

پروژه در آدرس `http://localhost:3000` در دسترس خواهد بود.

## 🌐 Deployment

### Heroku

1. **ایجاد حساب Heroku**
```bash
# نصب Heroku CLI
npm install -g heroku

# ورود به Heroku
heroku login
```

2. **ایجاد اپلیکیشن**
```bash
heroku create your-app-name
```

3. **تنظیم متغیرهای محیطی**
```bash
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your-mongodb-atlas-uri
heroku config:set JWT_SECRET=your-super-secret-jwt-key
```

4. **Deploy**
```bash
git add .
git commit -m "Ready for deployment"
git push heroku main
```

### Vercel

1. **ایجاد حساب Vercel**
- به [vercel.com](https://vercel.com) بروید
- با GitHub وارد شوید

2. **Import پروژه**
- روی "New Project" کلیک کنید
- repository را انتخاب کنید
- تنظیمات را تأیید کنید

3. **تنظیم متغیرهای محیطی**
- در Vercel Dashboard، به بخش Environment Variables بروید
- متغیرهای زیر را اضافه کنید:
  - `MONGODB_URI`
  - `JWT_SECRET`
  - `NODE_ENV=production`

4. **Deploy**
- Vercel به طور خودکار از GitHub deploy می‌کند
- هر push به main branch باعث redeploy می‌شود

### DigitalOcean App Platform

1. **ایجاد حساب DigitalOcean**
- به [digitalocean.com](https://digitalocean.com) بروید
- حساب کاربری ایجاد کنید

2. **ایجاد App**
- در Dashboard، روی "Create App" کلیک کنید
- GitHub repository را انتخاب کنید
- نوع اپلیکیشن را "Node.js" انتخاب کنید

3. **تنظیمات**
- Build Command: `npm install`
- Run Command: `npm start`
- Environment Variables را تنظیم کنید

4. **Deploy**
- روی "Create Resources" کلیک کنید
- اپلیکیشن شما deploy خواهد شد

## 🔧 تنظیمات تولید

### متغیرهای محیطی ضروری

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/simple-shop
JWT_SECRET=your-super-secret-jwt-key
PORT=3000
```

### امنیت

- **JWT Secret**: یک کلید قوی و تصادفی تولید کنید
- **MongoDB**: از MongoDB Atlas یا سرویس ابری استفاده کنید
- **HTTPS**: در تولید حتماً از HTTPS استفاده کنید
- **CORS**: origin های مجاز را محدود کنید

### بهینه‌سازی

- **Compression**: فعال است
- **Helmet**: امنیت HTTP headers
- **Rate Limiting**: برای جلوگیری از حملات DDoS
- **File Upload**: محدودیت اندازه فایل

## 📁 ساختار پروژه

```
simple-shop/
├── components/
│   └── NotificationWidget.js
├── middleware/
│   ├── auth.js
│   └── upload.js
├── models/
│   ├── User.js
│   ├── Product.js
│   ├── Order.js
│   ├── Course.js
│   ├── Message.js
│   ├── Video.js
│   └── Notification.js
├── uploads/
├── .env
├── .gitignore
├── env.example
├── index.html
├── auth.html
├── payment.html
├── profile.html
├── courses.html
├── chat.html
├── videos.html
├── admin.html
├── style.css
├── script.js
├── server.js
├── package.json
├── Procfile
├── vercel.json
└── README.md
```

## 🔌 API Endpoints

### احراز هویت
- `POST /api/register` - ثبت‌نام
- `POST /api/login` - ورود
- `GET /api/profile` - دریافت پروفایل
- `PUT /api/profile/update` - بروزرسانی پروفایل

### محصولات
- `GET /api/products` - دریافت محصولات
- `POST /api/products` - افزودن محصول
- `GET /api/products/:id` - دریافت محصول خاص

### سفارشات
- `POST /api/orders` - ثبت سفارش
- `GET /api/orders` - دریافت سفارشات

### دوره‌ها
- `GET /api/courses` - دریافت دوره‌ها
- `POST /api/courses` - افزودن دوره
- `POST /api/courses/:id/enroll` - ثبت‌نام در دوره

### چت
- `POST /api/messages` - ارسال پیام
- `GET /api/messages` - دریافت پیام‌ها

### ویدئوها
- `GET /api/videos` - دریافت ویدئوها
- `POST /api/videos` - افزودن ویدئو
- `POST /api/videos/:id/like` - لایک ویدئو
- `POST /api/videos/:id/comment` - کامنت ویدئو

### ادمین
- `GET /api/admin/stats` - آمار داشبورد
- `GET /api/admin/users` - دریافت کاربران
- `DELETE /api/admin/users/:id` - حذف کاربر
- `DELETE /api/admin/products/:id` - حذف محصول
- `DELETE /api/admin/courses/:id` - حذف دوره
- `DELETE /api/admin/videos/:id` - حذف ویدئو

### آپلود
- `POST /api/upload/profile-image` - آپلود تصویر پروفایل
- `POST /api/upload/product-image` - آپلود تصویر محصول
- `POST /api/upload/video` - آپلود ویدئو

### اعلان‌ها
- `GET /api/notifications` - دریافت اعلان‌ها
- `PUT /api/notifications/:id/read` - علامت‌گذاری خوانده شده
- `DELETE /api/notifications/:id` - حذف اعلان

## 📊 Google Analytics

### راه‌اندازی

1. **ایجاد حساب Google Analytics**
   - به [Google Analytics](https://analytics.google.com) بروید
   - حساب جدید ایجاد کنید
   - Property جدید برای سایت خود بسازید
   - Measurement ID را کپی کنید (مثل `G-XXXXXXXXXX`)

2. **تنظیم در کد**
   - فایل `index.html` را باز کنید
   - `GA_MEASUREMENT_ID` را با Measurement ID خود جایگزین کنید:
   ```html
   <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
   <script>
       window.dataLayer = window.dataLayer || [];
       function gtag(){dataLayer.push(arguments);}
       gtag('js', new Date());
       gtag('config', 'G-XXXXXXXXXX');
   </script>
   ```

### رویدادهای ردیابی شده

#### **E-commerce Events**
- `add_to_cart` - افزودن به سبد خرید
- `remove_from_cart` - حذف از سبد خرید
- `begin_checkout` - شروع فرآیند خرید
- `purchase` - تکمیل خرید

#### **User Events**
- `login` - ورود کاربر
- `logout` - خروج کاربر
- `page_view` - مشاهده صفحه
- `user_engagement` - تعامل کاربر

#### **Content Events**
- `video_view` - مشاهده ویدئو
- `course_enrollment` - ثبت‌نام در دوره
- `search` - جستجو

#### **Behavior Events**
- `scroll_depth` - عمق اسکرول (25%, 50%, 75%, 100%)
- `time_on_page` - زمان حضور در صفحه

### استفاده از Analytics API

```javascript
// ردیابی رویداد سفارشی
analytics.trackEvent('custom_event', {
    category: 'engagement',
    action: 'button_click',
    label: 'hero_section'
});

// ردیابی خرید
analytics.trackPurchase('TXN_123', cartItems, totalAmount);

// ردیابی ثبت‌نام در دوره
analytics.trackCourseEnrollment('JavaScript Basics', 'JS101', 500000);
```

### مشاهده آمار

1. **Google Analytics Dashboard**
   - تعداد بازدیدکنندگان
   - صفحات پربازدید
   - منبع ترافیک
   - رفتار کاربران

2. **E-commerce Reports**
   - فروش و درآمد
   - محصولات پرفروش
   - نرخ تبدیل
   - سبد خرید رها شده

3. **User Behavior**
   - مسیر کاربران
   - زمان حضور
   - نرخ پرش
   - عمق اسکرول

## 🐛 عیب‌یابی

### مشکلات رایج

1. **خطای MongoDB Connection**
   - اطمینان حاصل کنید MongoDB در حال اجرا است
   - URI اتصال را بررسی کنید

2. **خطای Port**
   - پورت 3000 را بررسی کنید
   - متغیر `PORT` را تنظیم کنید

3. **خطای File Upload**
   - پوشه `uploads` وجود دارد
   - مجوزهای نوشتن را بررسی کنید

4. **خطای CORS**
   - origin های مجاز را تنظیم کنید
   - درخواست‌ها از دامنه مجاز ارسال شوند

## 🤝 مشارکت

1. Fork کنید
2. Branch جدید ایجاد کنید (`git checkout -b feature/amazing-feature`)
3. تغییرات را commit کنید (`git commit -m 'Add amazing feature'`)
4. Push کنید (`git push origin feature/amazing-feature`)
5. Pull Request ایجاد کنید

## 📄 لایسنس

این پروژه تحت لایسنس MIT منتشر شده است.

## 📞 پشتیبانی

- ایمیل: support@example.com
- GitHub Issues: [اینجا](https://github.com/yourusername/simple-shop/issues)

---

**نکته**: این پروژه برای اهداف آموزشی و توسعه ایجاد شده است. برای استفاده در تولید، حتماً تنظیمات امنیتی را بررسی و بهبود دهید. 