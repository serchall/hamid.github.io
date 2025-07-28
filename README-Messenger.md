# سیستم پیام‌رسان آنلاین

## 📋 فهرست مطالب
- [معرفی](#معرفی)
- [ویژگی‌ها](#ویژگیها)
- [معماری](#معماری)
- [نصب و راه‌اندازی](#نصب-و-راهاندازی)
- [استفاده](#استفاده)
- [API Endpoints](#api-endpoints)
- [WebSocket Events](#websocket-events)
- [دیتابیس](#دیتابیس)
- [امنیت](#امنیت)

## 🎯 معرفی

سیستم پیام‌رسان آنلاین یک پلتفرم چت کامل با قابلیت‌های فردی و گروهی است که از WebSocket برای ارتباط بلادرنگ استفاده می‌کند. این سیستم امکان ارسال پیام‌های متنی، تصاویر و فایل‌ها را فراهم می‌کند.

## ✨ ویژگی‌ها

### **چت‌های فردی و گروهی:**
- ایجاد چت‌های فردی بین دو کاربر
- ایجاد چت‌های گروهی با چندین عضو
- مدیریت اعضای گروه

### **پیام‌رسانی بلادرنگ:**
- ارسال و دریافت پیام‌ها در زمان واقعی
- نشانگر تایپ کردن
- وضعیت خوانده شدن پیام‌ها

### **انواع پیام:**
- پیام‌های متنی
- ارسال تصاویر
- ارسال فایل‌های مختلف

### **ویژگی‌های اضافی:**
- نمایش تعداد پیام‌های نخوانده
- آواتار کاربران
- نشانگر آنلاین بودن
- رابط کاربری مدرن و واکنش‌گرا

## 🏗️ معماری

### **Frontend:**
- HTML5 + CSS3 + JavaScript
- Bootstrap برای UI
- Socket.IO Client
- طراحی واکنش‌گرا

### **Backend:**
- Node.js + Express
- Socket.IO برای WebSocket
- SQLite برای دیتابیس
- JWT برای احراز هویت

### **ارتباط:**
- WebSocket برای پیام‌های بلادرنگ
- REST API برای عملیات CRUD
- احراز هویت JWT

## 🚀 نصب و راه‌اندازی

### 1. نصب Dependencies
```bash
npm install socket.io
```

### 2. راه‌اندازی دیتابیس
جداول زیر به صورت خودکار ایجاد می‌شوند:

```sql
-- جدول چت‌ها
CREATE TABLE conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    type TEXT DEFAULT 'individual',
    createdBy INTEGER,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- جدول شرکت‌کنندگان
CREATE TABLE conversation_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversationId INTEGER,
    userId INTEGER,
    joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    isAdmin INTEGER DEFAULT 0
);

-- جدول پیام‌ها
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversationId INTEGER,
    senderId INTEGER,
    content TEXT NOT NULL,
    messageType TEXT DEFAULT 'text',
    fileUrl TEXT,
    isRead INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- جدول خوانده شدن پیام‌ها
CREATE TABLE message_reads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    messageId INTEGER,
    userId INTEGER,
    readAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 3. راه‌اندازی سرور
```bash
npm start
```

## 📱 استفاده

### 1. دسترسی به پیام‌رسان
```
http://localhost:3000/messenger.html
```

### 2. ایجاد چت جدید
1. کلیک روی دکمه "چت جدید"
2. انتخاب نوع چت (فردی یا گروهی)
3. انتخاب کاربران
4. برای گروه‌ها: وارد کردن نام گروه
5. کلیک روی "ایجاد چت"

### 3. ارسال پیام
1. انتخاب چت از لیست
2. نوشتن پیام در فیلد ورودی
3. کلیک روی دکمه ارسال یا فشردن Enter

### 4. ارسال فایل
1. کلیک روی آیکون گیره کاغذ
2. انتخاب فایل
3. فایل به صورت خودکار آپلود و ارسال می‌شود

## 🔌 API Endpoints

### GET /api/conversations
دریافت لیست چت‌های کاربر

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
    "success": true,
    "conversations": [
        {
            "id": 1,
            "name": "چت گروهی",
            "type": "group",
            "unreadCount": 3,
            "lastMessage": "سلام همه",
            "lastMessageTime": "2024-01-01T12:00:00Z"
        }
    ]
}
```

### POST /api/conversations
ایجاد چت جدید

**Request:**
```json
{
    "type": "group",
    "name": "چت گروهی جدید",
    "participants": [1, 2, 3]
}
```

**Response:**
```json
{
    "success": true,
    "conversationId": 1
}
```

### GET /api/conversations/:id/messages
دریافت پیام‌های چت

**Query Parameters:**
- `page`: شماره صفحه (پیش‌فرض: 1)
- `limit`: تعداد پیام در هر صفحه (پیش‌فرض: 50)

**Response:**
```json
{
    "success": true,
    "messages": [
        {
            "id": 1,
            "content": "سلام",
            "senderId": 1,
            "senderName": "علی",
            "senderAvatar": "avatar.jpg",
            "messageType": "text",
            "createdAt": "2024-01-01T12:00:00Z"
        }
    ]
}
```

### POST /api/conversations/:id/participants
اضافه کردن عضو به گروه

**Request:**
```json
{
    "userIds": [4, 5]
}
```

### DELETE /api/conversations/:id/participants/:userId
حذف عضو از گروه

## 🔄 WebSocket Events

### Client to Server

#### authenticate
احراز هویت کاربر
```javascript
socket.emit('authenticate', { token: 'jwt_token' });
```

#### join_conversation
پیوستن به چت
```javascript
socket.emit('join_conversation', conversationId);
```

#### leave_conversation
ترک چت
```javascript
socket.emit('leave_conversation', conversationId);
```

#### send_message
ارسال پیام
```javascript
socket.emit('send_message', {
    conversationId: 1,
    content: 'سلام',
    messageType: 'text'
});
```

#### typing
نشان دادن تایپ کردن
```javascript
socket.emit('typing', { conversationId: 1 });
```

#### stop_typing
توقف نشانگر تایپ
```javascript
socket.emit('stop_typing', { conversationId: 1 });
```

#### mark_read
علامت‌گذاری پیام‌ها به عنوان خوانده شده
```javascript
socket.emit('mark_read', { conversationId: 1 });
```

### Server to Client

#### conversations
دریافت لیست چت‌ها
```javascript
socket.on('conversations', (conversations) => {
    // به‌روزرسانی لیست چت‌ها
});
```

#### new_message
پیام جدید
```javascript
socket.on('new_message', (message) => {
    // نمایش پیام جدید
});
```

#### user_typing
کاربر در حال تایپ
```javascript
socket.on('user_typing', (data) => {
    // نمایش نشانگر تایپ
});
```

#### user_stop_typing
توقف تایپ کاربر
```javascript
socket.on('user_stop_typing', (data) => {
    // مخفی کردن نشانگر تایپ
});
```

#### messages_read
پیام‌ها خوانده شده
```javascript
socket.on('messages_read', (data) => {
    // به‌روزرسانی وضعیت پیام‌ها
});
```

#### notification
اعلان جدید
```javascript
socket.on('notification', (data) => {
    // نمایش اعلان
});
```

## 🗄️ دیتابیس

### جداول اصلی

#### conversations
| ستون | نوع | توضیح |
|------|-----|-------|
| id | INTEGER | شناسه یکتا |
| name | TEXT | نام چت (برای گروه‌ها) |
| type | TEXT | نوع چت (individual/group) |
| createdBy | INTEGER | شناسه سازنده |
| createdAt | DATETIME | تاریخ ایجاد |

#### conversation_participants
| ستون | نوع | توضیح |
|------|-----|-------|
| id | INTEGER | شناسه یکتا |
| conversationId | INTEGER | شناسه چت |
| userId | INTEGER | شناسه کاربر |
| joinedAt | DATETIME | تاریخ پیوستن |
| isAdmin | INTEGER | آیا ادمین است |

#### messages
| ستون | نوع | توضیح |
|------|-----|-------|
| id | INTEGER | شناسه یکتا |
| conversationId | INTEGER | شناسه چت |
| senderId | INTEGER | شناسه فرستنده |
| content | TEXT | محتوای پیام |
| messageType | TEXT | نوع پیام (text/image/file) |
| fileUrl | TEXT | آدرس فایل |
| isRead | INTEGER | آیا خوانده شده |
| createdAt | DATETIME | تاریخ ارسال |

## 🔒 امنیت

### احراز هویت
- استفاده از JWT برای احراز هویت
- بررسی توکن در تمام درخواست‌ها
- احراز هویت WebSocket

### مجوزها
- فقط اعضای چت می‌توانند پیام ارسال کنند
- فقط ادمین‌ها می‌توانند اعضا را مدیریت کنند
- بررسی دسترسی قبل از هر عملیات

### محافظت از داده‌ها
- پاک‌سازی ورودی کاربران
- محدودیت اندازه فایل‌ها
- بررسی نوع فایل‌های مجاز

## 🎨 رابط کاربری

### ویژگی‌های UI
- طراحی مدرن و زیبا
- انیمیشن‌های نرم
- واکنش‌گرا برای موبایل
- حالت تاریک
- اسکرول بار سفارشی

### کامپوننت‌ها
- لیست چت‌ها
- پنجره چت
- فرم ارسال پیام
- مودال‌های مدیریت
- نشانگرهای وضعیت

## 📊 عملکرد

### بهینه‌سازی‌ها
- پیام‌های صفحه‌بندی شده
- لود تنبل تصاویر
- کش کردن داده‌ها
- بهینه‌سازی کوئری‌ها

### محدودیت‌ها
- حداکثر 50 پیام در هر صفحه
- حداکثر 10MB برای فایل‌ها
- حداکثر 100 عضو در گروه

## 🛠️ عیب‌یابی

### مشکلات رایج

#### اتصال WebSocket
```
خطا: Connection failed
راه‌حل: بررسی تنظیمات سرور و فایروال
```

#### عدم دریافت پیام‌ها
```
مشکل: پیام‌ها دریافت نمی‌شوند
راه‌حل: بررسی احراز هویت و عضویت در چت
```

#### مشکل آپلود فایل
```
خطا: File upload failed
راه‌حل: بررسی مجوزهای پوشه uploads
```

### لاگ‌های مفید
```javascript
// لاگ اتصال کاربر
console.log('🔌 User connected:', socket.id);

// لاگ ارسال پیام
console.log('💬 Message sent:', messageId);

// لاگ خطاها
console.error('❌ Socket error:', error);
```

## 🔄 به‌روزرسانی‌های آینده

### ویژگی‌های پیشنهادی
- **پیام‌های صوتی**: ارسال و پخش پیام‌های صوتی
- **تماس تصویری**: تماس ویدیویی بین کاربران
- **واکنش‌ها**: لایک و واکنش به پیام‌ها
- **پیام‌های موقت**: پیام‌هایی که خودکار حذف می‌شوند
- **جستجو**: جستجو در پیام‌ها و چت‌ها

### بهبودهای فنی
- **Redis**: کش کردن برای عملکرد بهتر
- **فشرده‌سازی**: فشرده‌سازی پیام‌ها
- **رمزنگاری**: رمزنگاری end-to-end
- **Push Notifications**: اعلان‌های push
- **Backup**: پشتیبان‌گیری خودکار

---

**نکته**: این سیستم برای محیط‌های production نیاز به تنظیمات اضافی امنیتی و بهینه‌سازی دارد. 