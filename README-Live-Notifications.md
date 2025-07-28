# سیستم اعلان‌های زنده

## 📋 معرفی

سیستم اعلان‌های زنده یک سیستم نوتیفیکیشن بلادرنگ است که از WebSocket برای ارسال اعلان‌های فوری به کاربران استفاده می‌کند. این سیستم قابلیت نمایش اعلان‌های مختلف مانند پیام‌های جدید، درخواست‌های دوستی و خریدهای موفق را دارد.

## ✨ ویژگی‌ها

### **🔔 انواع اعلان‌ها:**
- ✅ **پیام جدید**: اعلان دریافت پیام جدید در چت
- ✅ **درخواست دوستی**: اعلان درخواست دوستی جدید
- ✅ **خرید موفق**: اعلان تکمیل سفارش
- ✅ **اعلان سیستمی**: اعلان‌های عمومی سیستم

### **🎨 ویژگی‌های بصری:**
- ✅ **نمایش بلادرنگ**: اعلان‌ها فوراً نمایش داده می‌شوند
- ✅ **انیمیشن‌های نرم**: ورود و خروج با انیمیشن
- ✅ **رنگ‌بندی متفاوت**: هر نوع اعلان رنگ مخصوص خود را دارد
- ✅ **نوار پیشرفت**: نشانگر زمان باقی‌مانده اعلان
- ✅ **صدای اعلان**: پخش صدای کوتاه برای جلب توجه

### **📱 ویژگی‌های تعاملی:**
- ✅ **کلیک روی اعلان**: هدایت به صفحه مربوطه
- ✅ **بستن اعلان**: امکان بستن دستی اعلان
- ✅ **حذف خودکار**: اعلان‌ها بعد از 5 ثانیه حذف می‌شوند
- ✅ **نشانگر تعداد**: نمایش تعداد اعلان‌های نخوانده

## 🏗️ معماری

### **Backend (server.js):**
- **WebSocket**: اتصال بلادرنگ با Socket.IO
- **دیتابیس**: ذخیره اعلان‌ها در SQLite
- **API Endpoints**: مدیریت اعلان‌ها و درخواست‌های دوستی
- **توابع کمکی**: ایجاد و ارسال اعلان‌ها

### **Frontend (live-notifications.js):**
- **کلاس LiveNotificationSystem**: مدیریت کامل اعلان‌ها
- **WebSocket Client**: دریافت اعلان‌های زنده
- **UI Management**: نمایش و مدیریت اعلان‌ها
- **Local Storage**: ذخیره موقت اعلان‌ها

### **Styling (live-notifications.css):**
- **طراحی مدرن**: استایل‌های زیبا و حرفه‌ای
- **واکنش‌گرا**: سازگار با موبایل و دسکتاپ
- **انیمیشن‌ها**: انیمیشن‌های نرم و جذاب
- **حالت تاریک**: پشتیبانی از تم تاریک

## 🚀 نصب و راه‌اندازی

### 1. فایل‌های مورد نیاز
```bash
# فایل‌های CSS و JS
live-notifications.css
live-notifications.js

# به‌روزرسانی server.js
# اضافه کردن جداول دیتابیس و WebSocket handlers
```

### 2. اضافه کردن به صفحات
```html
<!-- در head -->
<link href="live-notifications.css" rel="stylesheet">

<!-- در body -->
<script src="/socket.io/socket.io.js"></script>
<script src="live-notifications.js"></script>
```

### 3. راه‌اندازی خودکار
```javascript
// سیستم به صورت خودکار راه‌اندازی می‌شود
document.addEventListener('DOMContentLoaded', () => {
    liveNotifications.init();
});
```

## 📊 جداول دیتابیس

### **live_notifications:**
```sql
CREATE TABLE live_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    type TEXT NOT NULL, -- 'message', 'friend_request', 'purchase', 'system'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data TEXT, -- JSON data for additional info
    isRead INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users (id)
);
```

### **friend_requests:**
```sql
CREATE TABLE friend_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fromUserId INTEGER,
    toUserId INTEGER,
    status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fromUserId) REFERENCES users (id),
    FOREIGN KEY (toUserId) REFERENCES users (id),
    UNIQUE(fromUserId, toUserId)
);
```

## 🔌 API Endpoints

### **GET /api/notifications/live**
دریافت لیست اعلان‌های زنده کاربر

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
    "success": true,
    "notifications": [
        {
            "id": 1,
            "type": "message",
            "title": "پیام جدید",
            "message": "علی: سلام، چطوری؟",
            "data": { "conversationId": 1 },
            "isRead": 0,
            "createdAt": "2024-01-01T12:00:00Z"
        }
    ]
}
```

### **POST /api/notifications/live/:id/read**
علامت‌گذاری اعلان به عنوان خوانده شده

### **DELETE /api/notifications/live/:id**
حذف اعلان

### **POST /api/friend-request**
ارسال درخواست دوستی

**Request:**
```json
{
    "toUserId": 2
}
```

### **GET /api/friend-requests**
دریافت درخواست‌های دوستی

### **POST /api/friend-request/:id/respond**
پاسخ به درخواست دوستی

**Request:**
```json
{
    "action": "accept" // یا "reject"
}
```

## 🔄 WebSocket Events

### **Client to Server:**
```javascript
// احراز هویت
socket.emit('authenticate', { token: 'jwt_token' });
```

### **Server to Client:**
```javascript
// دریافت اعلان زنده
socket.on('live_notification', (notification) => {
    console.log('اعلان جدید:', notification);
});
```

## 🎨 استایل‌های CSS

### **رنگ‌های انواع اعلان:**
- **پیام**: آبی (`#007bff`)
- **درخواست دوستی**: سبز (`#28a745`)
- **خرید**: زرد (`#ffc107`)
- **سیستم**: خاکستری (`#6c757d`)

### **انیمیشن‌ها:**
```css
/* ورود اعلان */
@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

/* خروج اعلان */
@keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
}

/* نوار پیشرفت */
@keyframes progress {
    from { width: 100%; }
    to { width: 0%; }
}
```

## 📱 استفاده

### **1. راه‌اندازی سیستم:**
```javascript
// سیستم به صورت خودکار راه‌اندازی می‌شود
// یا به صورت دستی:
liveNotifications.init();
```

### **2. ارسال درخواست دوستی:**
```javascript
try {
    await liveNotifications.sendFriendRequest(userId);
    console.log('درخواست دوستی ارسال شد');
} catch (error) {
    console.error('خطا:', error.message);
}
```

### **3. نمایش اعلان سیستمی:**
```javascript
liveNotifications.showSystemNotification('عملیات موفق بود', 'success');
```

### **4. دریافت تعداد اعلان‌های نخوانده:**
```javascript
const unreadCount = liveNotifications.getUnreadCount();
console.log('اعلان‌های نخوانده:', unreadCount);
```

## 🎯 قابلیت‌های پیشرفته

### **✅ پیاده‌سازی شده:**
- نمایش بلادرنگ اعلان‌ها
- انیمیشن‌های نرم
- صدای اعلان
- مدیریت درخواست‌های دوستی
- ذخیره در دیتابیس
- نشانگر تعداد

### **🔄 در حال توسعه:**
- [ ] اعلان‌های push (Push Notifications)
- [ ] تنظیمات اعلان‌ها
- [ ] گروه‌بندی اعلان‌ها
- [ ] فیلتر کردن اعلان‌ها
- [ ] اعلان‌های با تصویر

### **📋 برنامه آینده:**
- [ ] اعلان‌های ایمیل
- [ ] اعلان‌های SMS
- [ ] اعلان‌های برنامه‌ریزی شده
- [ ] اعلان‌های گروهی
- [ ] آمار و گزارش‌گیری

## 🛠️ توسعه

### **اضافه کردن نوع اعلان جدید:**
```javascript
// در server.js
await createLiveNotification(
    userId,
    'new_type',
    'عنوان اعلان',
    'متن اعلان',
    { additionalData: 'value' }
);
```

### **سفارشی‌سازی استایل:**
```css
.live-notification[data-type="new_type"] {
    border-right-color: #your-color;
}

.live-notification[data-type="new_type"]::before {
    background: linear-gradient(90deg, #your-color, #your-dark-color);
}
```

### **اضافه کردن آیکون:**
```javascript
// در live-notifications.js
getNotificationIcon(type) {
    const icons = {
        // ... existing icons
        'new_type': 'fas fa-your-icon'
    };
    return icons[type] || 'fas fa-bell';
}
```

## 📊 عملکرد

### **بهینه‌سازی‌ها:**
- حداکثر 50 اعلان در localStorage
- حذف خودکار بعد از 5 ثانیه
- انیمیشن‌های بهینه شده
- مدیریت حافظه

### **محدودیت‌ها:**
- حداکثر 4 اعلان همزمان
- حداکثر 100 کاراکتر در عنوان
- حداکثر 200 کاراکتر در متن

## 🛠️ عیب‌یابی

### **مشکلات رایج:**

#### اعلان‌ها نمایش داده نمی‌شوند
```
مشکل: WebSocket متصل نیست
راه‌حل: بررسی اتصال اینترنت و احراز هویت
```

#### صدای اعلان کار نمی‌کند
```
مشکل: Web Audio API پشتیبانی نمی‌شود
راه‌حل: استفاده از مرورگر مدرن
```

#### اعلان‌ها در موبایل مشکل دارند
```
مشکل: تنظیمات z-index
راه‌حل: بررسی CSS موبایل
```

### **لاگ‌های مفید:**
```javascript
// بررسی وضعیت سیستم
console.log('وضعیت سیستم:', liveNotifications.isInitialized);

// بررسی تعداد اعلان‌ها
console.log('تعداد اعلان‌ها:', liveNotifications.getAllNotifications().length);

// بررسی اتصال WebSocket
console.log('اتصال WebSocket:', liveNotifications.socket?.connected);
```

## 🔄 به‌روزرسانی‌ها

### **نسخه 1.0 (فعلی):**
- ✅ سیستم پایه اعلان‌ها
- ✅ WebSocket integration
- ✅ درخواست‌های دوستی
- ✅ اعلان‌های خرید

### **نسخه 1.1 (آینده):**
- [ ] Push Notifications
- [ ] تنظیمات کاربری
- [ ] اعلان‌های ایمیل

### **نسخه 1.2 (آینده):**
- [ ] اعلان‌های برنامه‌ریزی شده
- [ ] آمار و گزارش‌گیری
- [ ] API پیشرفته

## 📞 پشتیبانی

برای سوالات و مشکلات:
1. بررسی لاگ‌های کنسول
2. تست اتصال WebSocket
3. بررسی احراز هویت
4. مراجعه به مستندات API

---

**نکته**: این سیستم برای محیط‌های production نیاز به تنظیمات اضافی امنیتی و بهینه‌سازی دارد. 