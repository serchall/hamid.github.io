# سیستم پشتیبانی آنلاین

## 📋 معرفی

سیستم پشتیبانی آنلاین یک راه‌حل کامل برای ارتباط بین کاربران و تیم پشتیبانی است. این سیستم شامل تیکت‌های پشتیبانی و چت زنده می‌باشد.

## ✨ ویژگی‌های سیستم

### **🎫 تیکت‌های پشتیبانی:**
- ✅ **ایجاد تیکت**: کاربران می‌توانند تیکت جدید ایجاد کنند
- ✅ **اولویت‌بندی**: تیکت‌ها بر اساس اولویت دسته‌بندی می‌شوند
- ✅ **دسته‌بندی**: تیکت‌ها در دسته‌های مختلف قرار می‌گیرند
- ✅ **پاسخ‌دهی**: امکان پاسخ‌دهی دوطرفه بین کاربر و ادمین
- ✅ **وضعیت‌ها**: پیگیری وضعیت تیکت‌ها

### **💬 چت زنده:**
- ✅ **شروع چت**: کاربران می‌توانند چت زنده شروع کنند
- ✅ **پذیرش چت**: ادمین‌ها چت‌ها را پذیرش می‌کنند
- ✅ **پیام‌رسانی**: ارتباط real-time بین کاربر و ادمین
- ✅ **تاریخچه**: ذخیره و نمایش تاریخچه چت‌ها

### **🔔 اعلان‌های زنده:**
- ✅ **Socket.IO**: ارتباط real-time با WebSocket
- ✅ **اعلان‌های فوری**: اطلاع‌رسانی لحظه‌ای
- ✅ **وضعیت اتصال**: نمایش وضعیت اتصال

## 🚀 نحوه استفاده

### **1. دسترسی:**
```
http://localhost:3000/support.html
```

### **2. ایجاد تیکت:**
1. کلیک روی تب "تیکت جدید"
2. پر کردن فرم (موضوع، توضیحات، اولویت، دسته‌بندی)
3. ارسال تیکت

### **3. مشاهده تیکت‌ها:**
1. کلیک روی تب "تیکت‌های پشتیبانی"
2. مشاهده لیست تیکت‌ها
3. کلیک روی تیکت برای مشاهده جزئیات

### **4. چت زنده:**
1. کلیک روی تب "چت زنده"
2. کلیک روی "شروع چت"
3. منتظر پذیرش توسط ادمین
4. شروع گفتگو

## 🏗️ معماری سیستم

### **Backend (Node.js/Express):**
```
server.js
├── Support APIs
├── Live Chat APIs
├── Socket.IO Events
└── Database Operations
```

### **Frontend (JavaScript):**
```
support.js
├── SupportSystem Class
├── Ticket Management
├── Live Chat
└── Real-time Communication
```

### **Pages:**
```
support.html    # صفحه اصلی پشتیبانی
```

## 📊 جداول دیتابیس

### **جدول تیکت‌ها:**
```sql
CREATE TABLE support_tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    status TEXT DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
    category TEXT, -- 'technical', 'billing', 'general', 'bug_report'
    assignedTo INTEGER, -- admin ID
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolvedAt DATETIME,
    FOREIGN KEY (userId) REFERENCES users (id),
    FOREIGN KEY (assignedTo) REFERENCES users (id)
);
```

### **جدول پاسخ‌های تیکت:**
```sql
CREATE TABLE ticket_replies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticketId INTEGER,
    userId INTEGER, -- user or admin who replied
    message TEXT NOT NULL,
    isAdminReply INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticketId) REFERENCES support_tickets (id),
    FOREIGN KEY (userId) REFERENCES users (id)
);
```

### **جدول چت‌های زنده:**
```sql
CREATE TABLE live_chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    adminId INTEGER,
    status TEXT DEFAULT 'active', -- 'active', 'waiting', 'closed'
    startedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    endedAt DATETIME,
    FOREIGN KEY (userId) REFERENCES users (id),
    FOREIGN KEY (adminId) REFERENCES users (id)
);
```

### **جدول پیام‌های چت زنده:**
```sql
CREATE TABLE live_chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chatId INTEGER,
    senderId INTEGER,
    message TEXT NOT NULL,
    messageType TEXT DEFAULT 'text', -- 'text', 'file', 'image'
    fileUrl TEXT,
    isRead INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chatId) REFERENCES live_chats (id),
    FOREIGN KEY (senderId) REFERENCES users (id)
);
```

## 🔌 API Endpoints

### **تیکت‌ها:**
```javascript
GET /api/support/tickets              # دریافت تیکت‌های کاربر
GET /api/support/admin/tickets        # دریافت تمام تیکت‌ها (ادمین)
POST /api/support/tickets             # ایجاد تیکت جدید
GET /api/support/tickets/:id/replies  # دریافت پاسخ‌های تیکت
POST /api/support/tickets/:id/replies # ارسال پاسخ به تیکت
PUT /api/support/tickets/:id/status   # به‌روزرسانی وضعیت تیکت (ادمین)
```

### **چت زنده:**
```javascript
POST /api/support/live-chat/start     # شروع چت زنده
GET /api/support/live-chat            # دریافت چت‌های کاربر
GET /api/support/admin/live-chat      # دریافت چت‌های ادمین
POST /api/support/admin/live-chat/:id/accept  # پذیرش چت (ادمین)
POST /api/support/live-chat/:id/messages      # ارسال پیام
GET /api/support/live-chat/:id/messages       # دریافت پیام‌ها
POST /api/support/live-chat/:id/close         # بستن چت
```

## 🎨 رابط کاربری

### **صفحه پشتیبانی:**
- تب‌های مختلف برای تیکت‌ها، تیکت جدید و چت زنده
- فرم ایجاد تیکت با فیلدهای مختلف
- نمایش تیکت‌ها با اولویت و وضعیت
- چت زنده با رابط کاربری زیبا

### **ویژگی‌های رابط:**
- طراحی واکنش‌گرا
- انیمیشن‌های جذاب
- رنگ‌بندی بر اساس اولویت و وضعیت
- پیام‌های real-time

## 🔄 جریان کار

### **تیکت‌ها:**
```
کاربر → ایجاد تیکت → ادمین بررسی → پاسخ ادمین → پاسخ کاربر → حل مشکل
```

### **چت زنده:**
```
کاربر → شروع چت → ادمین پذیرش → گفتگو → بستن چت
```

## 🛡️ امنیت

### **احراز هویت:**
- بررسی توکن JWT در تمام درخواست‌ها
- دسترسی محدود بر اساس نقش کاربر

### **اعتبارسنجی:**
- بررسی دسترسی کاربر به تیکت‌ها
- اعتبارسنجی ورودی‌ها
- محافظت در برابر حملات

## 💳 اولویت‌های تیکت

### **فوری (Urgent):**
- مشکلات بحرانی
- خطاهای سیستم
- مشکلات پرداخت

### **زیاد (High):**
- مشکلات مهم
- درخواست‌های فوری

### **متوسط (Medium):**
- سوالات عمومی
- درخواست‌های عادی

### **کم (Low):**
- پیشنهادات
- درخواست‌های غیرضروری

## 📋 دسته‌بندی تیکت‌ها

### **فنی (Technical):**
- مشکلات فنی
- خطاهای سیستم
- مشکلات عملکرد

### **پرداخت (Billing):**
- مشکلات پرداخت
- سوالات مالی
- بازپرداخت

### **عمومی (General):**
- سوالات عمومی
- راهنمایی
- اطلاعات

### **گزارش خطا (Bug Report):**
- گزارش باگ‌ها
- مشکلات نرم‌افزاری
- پیشنهادات بهبود

## 🎯 قابلیت‌های پیشرفته

### **✅ پیاده‌سازی شده:**
- سیستم تیکت کامل
- چت زنده real-time
- اعلان‌های زنده
- رابط کاربری زیبا
- مدیریت اولویت‌ها

### **🔄 در حال توسعه:**
- [ ] آپلود فایل در تیکت‌ها
- [ ] ارسال ایمیل اعلان
- [ ] گزارش‌های آماری
- [ ] سیستم امتیازدهی

### **📋 برنامه آینده:**
- [ ] چت گروهی
- [ ] ربات پشتیبانی
- [ ] دانش‌نامه خودکار
- [ ] سیستم FAQ

## 📊 عملکرد

### **بهینه‌سازی‌ها:**
- اتصال WebSocket برای real-time
- بارگذاری lazy برای پیام‌ها
- کش کردن داده‌ها
- بهینه‌سازی کوئری‌ها

### **محدودیت‌ها:**
- حداکثر 10 چت همزمان
- محدودیت اندازه پیام‌ها
- محدودیت تعداد تیکت‌های باز

## 🛠️ عیب‌یابی

### **مشکلات رایج:**

#### عدم اتصال به چت
```
مشکل: WebSocket متصل نمی‌شود
راه‌حل: بررسی اتصال اینترنت و سرور
```

#### عدم بارگذاری تیکت‌ها
```
مشکل: خطای احراز هویت
راه‌حل: بررسی توکن JWT
```

#### عدم ارسال پیام
```
مشکل: چت غیرفعال است
راه‌حل: بررسی وضعیت چت
```

### **لاگ‌های مفید:**
```javascript
// بررسی اتصال WebSocket
console.log('Socket connected:', supportSystem.isConnected);

// بررسی چت فعلی
console.log('Current chat ID:', supportSystem.currentChatId);

// بررسی تیکت فعلی
console.log('Current ticket ID:', supportSystem.currentTicketId);
```

## 🔄 به‌روزرسانی‌ها

### **نسخه 1.0 (فعلی):**
- ✅ سیستم تیکت پایه
- ✅ چت زنده real-time
- ✅ اعلان‌های زنده
- ✅ رابط کاربری زیبا

### **نسخه 1.1 (آینده):**
- [ ] آپلود فایل
- [ ] ارسال ایمیل
- [ ] گزارش‌های آماری

### **نسخه 1.2 (آینده):**
- [ ] ربات پشتیبانی
- [ ] دانش‌نامه خودکار
- [ ] سیستم FAQ

## 📞 پشتیبانی

### **مستندات:**
- بررسی API endpoints
- تست WebSocket connection
- بررسی جداول دیتابیس

### **کمک:**
- بررسی لاگ‌های سرور
- تست اتصال WebSocket
- بررسی احراز هویت

---

**نکته**: این سیستم برای ارتباط مستقیم بین کاربران و تیم پشتیبانی طراحی شده است. 