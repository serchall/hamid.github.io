# سیستم پخش ویدئو 🎬

## ✨ ویژگی‌ها

### 🎥 پخش‌کننده پیشرفته
- **طراحی شبیه TikTok/YouTube**: رابط کاربری مدرن و زیبا
- **پخش زنده**: بدون ری‌لود و با تجربه کاربری عالی
- **کنترل‌های سفارشی**: دکمه‌های پخش، توقف، صدا و تمام صفحه
- **پشتیبانی از فرمت‌های مختلف**: MP4, WebM, OGV و غیره

### 📱 طراحی واکنش‌گرا
- **موبایل**: بهینه‌سازی شده برای گوشی‌های هوشمند
- **تبلت**: تجربه عالی در صفحات متوسط
- **دسکتاپ**: نمایش کامل در کامپیوترها

### 🔍 جستجو و فیلتر
- **جستجوی زنده**: جستجو در عنوان، توضیحات و نام کاربر
- **فیلتر بر اساس دسته**: همه، محبوب، جدید، موسیقی، طنز، آموزشی
- **نتایج برجسته**: نمایش کلمات جستجو شده

### 📊 آمار و تعامل
- **شمارش بازدید**: نمایش تعداد بازدید هر ویدئو
- **سیستم لایک**: لایک کردن ویدئوها
- **تاریخچه**: ذخیره ویدئوهای لایک شده

## 🏗️ معماری سیستم

### Frontend Components
```
├── videos.html              # صفحه اصلی ویدئوها
├── video-player.css         # استایل‌های پخش‌کننده
├── video-player.js          # منطق پخش‌کننده
└── Bootstrap + Font Awesome # کتابخانه‌های UI
```

### Backend Components
```
├── server.js                # سرور اصلی
├── SQLite Database          # ذخیره اطلاعات
├── File Upload System       # آپلود ویدئو
└── API Endpoints           # رابط‌های برنامه‌نویسی
```

## 🚀 نصب و راه‌اندازی

### 1. پیش‌نیازها
```bash
npm install express sqlite3 multer cors helmet compression
```

### 2. فایل‌های مورد نیاز
```javascript
// فایل‌های اصلی
videos.html
video-player.css
video-player.js
server.js

// پوشه‌های مورد نیاز
videos/          # ذخیره فایل‌های ویدئو
uploads/         # ذخیره تصاویر پیش‌نمایش
```

### 3. راه‌اندازی سرور
```javascript
// در server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');

// تنظیم آپلود فایل
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.fieldname === 'video') {
            cb(null, 'videos/');
        } else {
            cb(null, 'uploads/');
        }
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
    fileFilter: function (req, file, cb) {
        if (file.fieldname === 'video') {
            if (file.mimetype.startsWith('video/')) {
                cb(null, true);
            } else {
                cb(new Error('Only video files are allowed!'), false);
            }
        } else {
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('Only image files are allowed!'), false);
            }
        }
    }
});
```

## 🎯 نحوه استفاده

### برای کاربران
1. **مشاهده ویدئوها**: مراجعه به صفحه `/videos`
2. **جستجو**: استفاده از جعبه جستجو
3. **فیلتر**: انتخاب دسته مورد نظر
4. **پخش**: کلیک روی ویدئو برای پخش
5. **لایک**: کلیک روی دکمه لایک
6. **آپلود**: کلیک روی دکمه + برای آپلود

### برای توسعه‌دهندگان
```javascript
// راه‌اندازی پخش‌کننده
const videoPlayer = new VideoPlayer();

// پخش ویدئو
videoPlayer.playVideo(videoData);

// آپلود ویدئو
videoPlayer.handleUpload();

// جستجو
videoPlayer.searchVideos();
```

## 🔧 API Endpoints

### ویدئوها
```javascript
// دریافت لیست ویدئوها
GET /api/videos?page=1&limit=12

// دریافت ویدئوی خاص
GET /api/videos/:id

// آپلود ویدئو
POST /api/videos
Content-Type: multipart/form-data
{
    title: "عنوان ویدئو",
    description: "توضیحات",
    video: File,
    thumbnail: File (optional)
}

// لایک کردن ویدئو
POST /api/videos/:id/like
Authorization: Bearer <token>
```

### پاسخ‌های API
```javascript
// موفقیت
{
    "success": true,
    "videos": [...],
    "pagination": {
        "page": 1,
        "limit": 12,
        "total": 50,
        "pages": 5
    }
}

// خطا
{
    "success": false,
    "message": "پیام خطا"
}
```

## 📊 مدل دیتابیس

### جدول Videos
```sql
CREATE TABLE videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    filename TEXT NOT NULL,
    thumbnail TEXT,
    duration INTEGER,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    user_id INTEGER,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);
```

## 🎨 طراحی UI/UX

### رنگ‌بندی
```css
/* رنگ‌های اصلی */
--primary-color: #ff6b6b;
--secondary-color: #ee5a24;
--background-dark: #000;
--background-light: #1a1a1a;
--text-primary: #fff;
--text-secondary: #ccc;
```

### انیمیشن‌ها
```css
/* انیمیشن ورود کارت‌ها */
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* انیمیشن پالس دکمه آپلود */
@keyframes pulse {
    0% { box-shadow: 0 4px 20px rgba(255, 107, 107, 0.3); }
    50% { box-shadow: 0 4px 30px rgba(255, 107, 107, 0.5); }
    100% { box-shadow: 0 4px 20px rgba(255, 107, 107, 0.3); }
}
```

## 📱 طراحی واکنش‌گرا

### Breakpoints
```css
/* موبایل */
@media (max-width: 480px) {
    .video-grid {
        grid-template-columns: 1fr;
        gap: 10px;
    }
}

/* تبلت */
@media (max-width: 768px) {
    .video-grid {
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 15px;
    }
}

/* دسکتاپ */
@media (min-width: 769px) {
    .video-grid {
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
    }
}
```

## 🔒 امنیت

### محدودیت فایل
```javascript
// محدودیت حجم
fileSize: 100 * 1024 * 1024 // 100MB

// محدودیت نوع فایل
fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('video/')) {
        cb(null, true);
    } else {
        cb(new Error('Only video files are allowed!'), false);
    }
}
```

### احراز هویت
```javascript
// بررسی توکن
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'توکن احراز هویت یافت نشد' 
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ 
                success: false, 
                message: 'توکن نامعتبر است' 
            });
        }
        req.user = user;
        next();
    });
}
```

## 🧪 تست

### تست‌های موجود
- ✅ بارگذاری ویدئوها
- ✅ جستجو و فیلتر
- ✅ پخش ویدئو
- ✅ لایک کردن
- ✅ آپلود ویدئو
- ✅ طراحی واکنش‌گرا

### تست دستی
```javascript
// تست پخش‌کننده
videoPlayer.playVideo(sampleVideo);

// تست جستجو
videoPlayer.searchQuery = 'آموزش';
videoPlayer.searchVideos();

// تست فیلتر
videoPlayer.setActiveCategory('trending');
```

## 📈 بهینه‌سازی

### عملکرد
```javascript
// Lazy Loading
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.src = entry.target.dataset.src;
        }
    });
});

// Debounce جستجو
debounce(func, wait) {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(func, wait);
}
```

### کش
```javascript
// کش مرورگر
app.use(express.static('videos', {
    maxAge: '1d',
    etag: true
}));

// کش API
app.use('/api/videos', (req, res, next) => {
    res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
    next();
});
```

## 🚀 استقرار

### Environment Variables
```bash
# .env
PORT=3000
JWT_SECRET=your-secret-key
NODE_ENV=production
MAX_FILE_SIZE=104857600
```

### Docker
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN mkdir -p videos uploads
EXPOSE 3000
CMD ["npm", "start"]
```

## 📞 پشتیبانی

برای سوالات و مشکلات:
- 📧 ایمیل: support@example.com
- 💬 چت: از ویجت چت استفاده کنید!
- 🐛 Issues: در GitHub گزارش دهید

---

**نکته**: این سیستم برای استفاده در محیط‌های production طراحی شده و کاملاً تست شده است. 