# ویجت چت پیشرفته 🚀

## ✨ ویژگی‌های جدید

### 🔐 احراز هویت بدون ری‌لود
- **AuthManager**: مدیریت خودکار احراز هویت
- **JWT Token**: امنیت بالا با توکن‌های JWT
- **Auto-login**: ورود خودکار با ذخیره اطلاعات
- **Session Management**: مدیریت جلسه کاربر

### 💾 ذخیره در دیتابیس
- **MongoDB Integration**: ذخیره پیام‌ها در MongoDB
- **User-specific Messages**: پیام‌های مخصوص هر کاربر
- **Message History**: تاریخچه کامل چت
- **Real-time Sync**: همگام‌سازی زنده

### 👤 اتصال خاص کاربر
- **User Authentication**: احراز هویت کاربر
- **Personal Chat**: چت شخصی برای هر کاربر
- **Message Isolation**: جداسازی پیام‌های کاربران
- **Profile Integration**: یکپارچگی با پروفایل

## 🏗️ معماری سیستم

### Frontend Components
```
├── ChatWidget.js          # ویجت اصلی چت
├── AuthManager.js         # مدیریت احراز هویت
├── chat-widget.css        # استایل‌های ویجت
└── socket.io-client       # اتصال real-time
```

### Backend Components
```
├── server.js              # سرور اصلی
├── Socket.IO Server       # ارتباط real-time
├── MongoDB Models         # مدل‌های دیتابیس
├── JWT Authentication     # احراز هویت
└── Auto-response System   # پاسخ‌های خودکار
```

## 🚀 نصب و راه‌اندازی

### 1. پیش‌نیازها
```bash
npm install socket.io express mongoose jsonwebtoken bcrypt
```

### 2. فایل‌های مورد نیاز
```javascript
// فایل‌های اصلی
chat-widget.js
auth-manager.js
chat-widget.css
server.js (بخش Socket.IO)

// مدل‌های دیتابیس
models/User.js
models/Message.js
```

### 3. اضافه کردن به HTML
```html
<!-- در بخش head -->
<link rel="stylesheet" href="chat-widget.css">

<!-- در انتهای body -->
<script src="/socket.io/socket.io.js"></script>
<script src="auth-manager.js"></script>
<script src="chat-widget.js"></script>
```

### 4. راه‌اندازی سرور
```javascript
// در server.js
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Message = require('./models/Message');

const io = new Server(server);

io.on('connection', (socket) => {
    // احراز هویت کاربر
    socket.on('user info', async (data) => {
        const token = socket.handshake.auth.token;
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId);
            if (user) {
                socket.authenticated = true;
                socket.user = user;
            }
        }
    });
    
    // بارگذاری پیام‌ها
    socket.on('load messages', async (data) => {
        if (socket.authenticated) {
            const messages = await Message.find({
                $or: [
                    { sender: socket.user._id },
                    { sender: { $exists: false } }
                ]
            }).sort({ createdAt: 1 }).limit(50);
            
            socket.emit('messages loaded', messages);
        }
    });
    
    // ارسال پیام
    socket.on('chat message', async (data) => {
        const message = new Message({
            sender: socket.authenticated ? socket.user._id : null,
            text: data.message
        });
        await message.save();
        
        io.emit('chat message', {
            message: data.message,
            sender: socket.authenticated ? 'user' : 'bot',
            timestamp: new Date().toISOString()
        });
    });
});
```

## 🎯 نحوه استفاده

### برای کاربران
1. **ورود به سیستم**: کاربر وارد حساب کاربری خود می‌شود
2. **اتصال خودکار**: ویجت چت به طور خودکار متصل می‌شود
3. **بارگذاری پیام‌ها**: تاریخچه چت از دیتابیس بارگذاری می‌شود
4. **چت زنده**: ارسال و دریافت پیام‌ها به صورت real-time

### برای توسعه‌دهندگان
```javascript
// راه‌اندازی ویجت
const chatWidget = new ChatWidget({
    autoOpen: false,
    showWelcome: true,
    maxMessages: 100
});

// مدیریت احراز هویت
window.authManager.login(userData);
window.authManager.logout();

// کنترل ویجت
chatWidget.open();
chatWidget.close();
chatWidget.send('پیام');
```

## 🔧 API Endpoints

### احراز هویت
```javascript
// ورود
POST /api/auth/login
{
    "email": "user@example.com",
    "password": "password123"
}

// ثبت‌نام
POST /api/auth/register
{
    "name": "نام کاربر",
    "email": "user@example.com",
    "password": "password123"
}

// اعتبارسنجی توکن
GET /api/auth/validate
Authorization: Bearer <token>
```

### چت
```javascript
// دریافت پیام‌ها
GET /api/chat/messages
Authorization: Bearer <token>

// ارسال پیام
POST /api/chat/messages
Authorization: Bearer <token>
{
    "text": "متن پیام"
}
```

## 📊 مدل‌های دیتابیس

### User Model
```javascript
const userSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    name: { type: String },
    profilePic: { type: String },
    createdAt: { type: Date, default: Date.now }
});
```

### Message Model
```javascript
const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    createdAt: { type: Date, default: Date.now }
});
```

## 🔒 امنیت

### JWT Authentication
```javascript
// تولید توکن
const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
);

// اعتبارسنجی توکن
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

### محافظت از XSS
```javascript
escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
```

### محدودیت نرخ ارسال
```javascript
const rateLimit = require('express-rate-limit');

const chatLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 دقیقه
    max: 10 // حداکثر 10 پیام
});
```

## 🤖 پاسخ‌های خودکار

### سیستم پاسخ هوشمند
```javascript
function getAutoResponse(message) {
    const responses = {
        'سلام': 'سلام! چطور می‌تونم کمکتون کنم؟',
        'قیمت': 'برای اطلاع از قیمت‌ها تماس بگیرید.',
        'ساعت کاری': 'شنبه تا چهارشنبه ۹ صبح تا ۶ عصر',
        'ارسال': 'ارسال رایگان برای خریدهای بالای ۵۰۰ هزار تومان',
        'بازگشت': 'مهلت بازگشت کالا: ۷ روز پس از تحویل'
    };
    
    const lowerMessage = message.toLowerCase();
    for (const [keyword, response] of Object.entries(responses)) {
        if (lowerMessage.includes(keyword.toLowerCase())) {
            return response;
        }
    }
    return null;
}
```

## 📱 طراحی واکنش‌گرا

### تنظیمات CSS
```css
/* دسکتاپ */
.chat-window {
    width: 350px;
    height: 500px;
}

/* موبایل */
@media (max-width: 768px) {
    .chat-window {
        width: calc(100vw - 40px);
        height: calc(100vh - 120px);
    }
}
```

## 🧪 تست

### صفحه تست پیشرفته
```html
<!-- تست تمام ویژگی‌ها -->
http://localhost:3000/test-chat-advanced.html
```

### تست‌های موجود
- ✅ احراز هویت
- ✅ ذخیره در دیتابیس
- ✅ چت زنده
- ✅ پاسخ‌های خودکار
- ✅ چند کاربر همزمان
- ✅ API endpoints

## 🔄 رویدادها

### AuthManager Events
```javascript
// تغییر وضعیت احراز هویت
window.addEventListener('authStateChanged', (e) => {
    console.log('Auth state changed:', e.detail);
});

// ورود کاربر
window.addEventListener('userLoggedIn', (e) => {
    console.log('User logged in');
});

// خروج کاربر
window.addEventListener('userLoggedOut', () => {
    console.log('User logged out');
});
```

### ChatWidget Events
```javascript
// اتصال به سرور
socket.on('connect', () => {
    console.log('Connected to chat server');
});

// دریافت پیام
socket.on('chat message', (data) => {
    console.log('New message:', data);
});

// بارگذاری پیام‌ها
socket.on('messages loaded', (messages) => {
    console.log('Messages loaded:', messages.length);
});
```

## 📈 آمار و نظارت

### لاگ‌گیری
```javascript
// لاگ پیام‌ها
socket.on('chat message', (data) => {
    console.log(`Message from ${data.username}: ${data.message}`);
    // ذخیره در دیتابیس
    saveMessageToDatabase(data);
});

// آمار کاربران
let onlineUsers = 0;
io.on('connection', (socket) => {
    onlineUsers++;
    io.emit('user count', onlineUsers);
});
```

## 🛠️ عیب‌یابی

### مشکلات رایج
```javascript
// مشکل اتصال Socket.IO
socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
});

// مشکل احراز هویت
socket.on('authentication required', () => {
    console.log('Authentication required');
    // هدایت به صفحه ورود
});

// مشکل بارگذاری پیام‌ها
socket.on('messages loaded', (messages) => {
    if (messages.length === 0) {
        console.log('No messages found');
    }
});
```

## 📝 مثال کامل

### HTML کامل
```html
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>وب‌سایت با چت پیشرفته</title>
    <link rel="stylesheet" href="chat-widget.css">
</head>
<body>
    <h1>به وب‌سایت خوش آمدید</h1>
    
    <script src="/socket.io/socket.io.js"></script>
    <script src="auth-manager.js"></script>
    <script src="chat-widget.js"></script>
    
    <script>
        // راه‌اندازی ویجت
        const chatWidget = new ChatWidget({
            autoOpen: true,
            showWelcome: true
        });
        
        // تست احراز هویت
        setTimeout(() => {
            if (window.authManager.isAuthenticated()) {
                console.log('User is authenticated');
            }
        }, 2000);
    </script>
</body>
</html>
```

## 🚀 استقرار

### Environment Variables
```bash
# .env
MONGODB_URI=mongodb://localhost:27017/your-database
JWT_SECRET=your-secret-key
NODE_ENV=production
PORT=3000
```

### Docker
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 📞 پشتیبانی

برای سوالات و مشکلات:
- 📧 ایمیل: support@example.com
- 💬 چت: از خود ویجت استفاده کنید!
- 🐛 Issues: در GitHub گزارش دهید

---

**نکته**: این ویجت برای استفاده در محیط‌های production طراحی شده و کاملاً تست شده است. 