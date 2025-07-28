# ویجت چت درون‌برنامه‌ای 🚀

یک سیستم چت مدرن و زیبا با قابلیت چت زنده که به راحتی به هر وب‌سایتی اضافه می‌شود.

## ✨ ویژگی‌ها

- 🎨 **طراحی مدرن**: رابط کاربری زیبا با انیمیشن‌های نرم
- ⚡ **چت زنده**: ارتباط real-time با Socket.IO
- 📱 **واکنش‌گرا**: سازگار با تمام دستگاه‌ها
- 🔔 **اعلان‌ها**: نمایش تعداد پیام‌های جدید
- 💬 **نشانگر تایپ**: نمایش وضعیت تایپ کردن
- 🤖 **پاسخ خودکار**: پاسخ‌های هوشمند برای سوالات رایج
- 💾 **ذخیره پیام‌ها**: نگهداری تاریخچه چت
- 🌙 **حالت تاریک**: پشتیبانی از تم تاریک
- 🔒 **امنیت**: محافظت در برابر XSS

## 🚀 نصب و راه‌اندازی

### 1. پیش‌نیازها

```bash
npm install socket.io express
```

### 2. اضافه کردن فایل‌ها

فایل‌های زیر را به پروژه خود اضافه کنید:

- `chat-widget.css` - استایل‌های ویجت
- `chat-widget.js` - منطق ویجت
- `server.js` - سرور Socket.IO (قسمت مربوطه)

### 3. اضافه کردن به HTML

```html
<!-- در بخش head -->
<link rel="stylesheet" href="chat-widget.css">

<!-- در انتهای body -->
<script src="/socket.io/socket.io.js"></script>
<script src="chat-widget.js"></script>
```

### 4. راه‌اندازی سرور

```javascript
// در server.js
const { Server } = require('socket.io');
const io = new Server(server);

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    socket.on('chat message', async (data) => {
        // پردازش پیام
        io.emit('chat message', {
            message: data.message,
            username: data.username,
            timestamp: data.timestamp
        });
    });
    
    socket.on('typing', () => {
        socket.broadcast.emit('typing');
    });
    
    socket.on('stop typing', () => {
        socket.broadcast.emit('stop typing');
    });
});
```

## 🎯 نحوه استفاده

### برای کاربران

1. روی دکمه چت (گوشه سمت راست پایین) کلیک کنید
2. پیام خود را بنویسید
3. Enter یا دکمه ارسال را بزنید
4. پاسخ‌های خودکار دریافت کنید

### برای توسعه‌دهندگان

```javascript
// باز کردن چت
window.chatWidget.open();

// بستن چت
window.chatWidget.close();

// ارسال پیام
window.chatWidget.send('سلام');

// بررسی وضعیت
console.log(window.chatWidget.isOpen);
```

## 🎨 شخصی‌سازی

### تغییر رنگ‌ها

در فایل `chat-widget.css`:

```css
.chat-toggle {
    background: linear-gradient(135deg, #YOUR_COLOR1 0%, #YOUR_COLOR2 100%);
}

.chat-header {
    background: linear-gradient(135deg, #YOUR_COLOR1 0%, #YOUR_COLOR2 100%);
}
```

### تغییر متن‌ها

در فایل `chat-widget.js`:

```javascript
createWidget() {
    const widgetHTML = `
        <div class="chat-widget">
            <button class="chat-toggle" id="chatToggle">
                <i class="fas fa-comments"></i>
            </button>
            
            <div class="chat-window" id="chatWindow">
                <div class="chat-header">
                    <div>
                        <h3>عنوان سفارشی</h3>
                        <div class="status" id="connectionStatus">وضعیت اتصال</div>
                    </div>
                </div>
                <!-- ... -->
            </div>
        </div>
    `;
}
```

### اضافه کردن پاسخ‌های خودکار

```javascript
setupAutoResponses() {
    const responses = {
        'سلام': 'سلام! چطور می‌تونم کمکتون کنم؟',
        'قیمت': 'برای اطلاع از قیمت‌ها با ما تماس بگیرید.',
        'ساعت کاری': 'شنبه تا چهارشنبه ۹ صبح تا ۶ عصر',
        // پاسخ‌های بیشتر...
    };
}
```

## 📱 طراحی واکنش‌گرا

ویجت به طور خودکار با اندازه صفحه سازگار می‌شود:

- **دسکتاپ**: 350px عرض
- **موبایل**: عرض کامل صفحه
- **تبلت**: اندازه متوسط

## 🔧 تنظیمات پیشرفته

### تغییر موقعیت ویجت

```css
.chat-widget {
    position: fixed;
    bottom: 20px;  /* فاصله از پایین */
    right: 20px;   /* فاصله از راست */
    z-index: 1000; /* لایه نمایش */
}
```

### تغییر اندازه

```css
.chat-window {
    width: 400px;   /* عرض */
    height: 600px;  /* ارتفاع */
}
```

### اضافه کردن انیمیشن‌های سفارشی

```css
@keyframes customAnimation {
    from { transform: scale(0); }
    to { transform: scale(1); }
}

.chat-window.active {
    animation: customAnimation 0.3s ease;
}
```

## 🛠️ عیب‌یابی

### مشکل اتصال Socket.IO

```javascript
// بررسی اتصال
socket.on('connect', () => {
    console.log('Connected to server');
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
});
```

### مشکل نمایش ویجت

```javascript
// بررسی وجود ویجت
if (window.chatWidget) {
    console.log('Chat widget loaded');
} else {
    console.log('Chat widget not found');
}
```

### مشکل ذخیره پیام‌ها

```javascript
// پاک کردن پیام‌های ذخیره شده
localStorage.removeItem('chat_messages');
```

## 📊 آمار و نظارت

### لاگ‌گیری

```javascript
// در server.js
socket.on('chat message', (data) => {
    console.log(`Message from ${data.username}: ${data.message}`);
    // ذخیره در دیتابیس
    saveMessageToDatabase(data);
});
```

### آمار کاربران

```javascript
// شمارش کاربران آنلاین
let onlineUsers = 0;

io.on('connection', (socket) => {
    onlineUsers++;
    io.emit('user count', onlineUsers);
    
    socket.on('disconnect', () => {
        onlineUsers--;
        io.emit('user count', onlineUsers);
    });
});
```

## 🔒 امنیت

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
// در server.js
const rateLimit = require('express-rate-limit');

const chatLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 دقیقه
    max: 10 // حداکثر 10 پیام در دقیقه
});

app.use('/api/chat', chatLimiter);
```

## 📝 مثال کامل

```html
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>وب‌سایت من</title>
    <link rel="stylesheet" href="chat-widget.css">
</head>
<body>
    <h1>به وب‌سایت من خوش آمدید</h1>
    <p>محتوای سایت شما اینجا قرار می‌گیرد...</p>
    
    <script src="/socket.io/socket.io.js"></script>
    <script src="chat-widget.js"></script>
    
    <script>
        // تست ویجت
        setTimeout(() => {
            window.chatWidget.open();
        }, 2000);
    </script>
</body>
</html>
```

## 🤝 مشارکت

برای بهبود این پروژه:

1. Fork کنید
2. Branch جدید بسازید
3. تغییرات را commit کنید
4. Pull Request ارسال کنید

## 📄 لایسنس

این پروژه تحت لایسنس MIT منتشر شده است.

## 📞 پشتیبانی

برای سوالات و مشکلات:

- 📧 ایمیل: support@example.com
- 💬 چت: از خود ویجت استفاده کنید!
- 🐛 Issues: در GitHub گزارش دهید

---

**نکته**: این ویجت برای استفاده در محیط‌های production طراحی شده و کاملاً تست شده است. 