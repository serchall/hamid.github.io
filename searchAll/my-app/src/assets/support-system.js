// سیستم پشتیبانی آنلاین
const sqlite3 = require('sqlite3').verbose();

// اتصال به دیتابیس
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('خطا در اتصال به دیتابیس:', err);
        return;
    }
    console.log('✅ متصل به دیتابیس SQLite');
    
    // ایجاد جداول پشتیبانی
    createSupportTables();
});

function createSupportTables() {
    // جدول تیکت‌ها
    db.run(`CREATE TABLE IF NOT EXISTS support_tickets (
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
    )`);

    // جدول پاسخ‌های تیکت
    db.run(`CREATE TABLE IF NOT EXISTS ticket_replies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticketId INTEGER,
        userId INTEGER, -- user or admin who replied
        message TEXT NOT NULL,
        isAdminReply INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticketId) REFERENCES support_tickets (id),
        FOREIGN KEY (userId) REFERENCES users (id)
    )`);

    // جدول چت‌های زنده
    db.run(`CREATE TABLE IF NOT EXISTS live_chats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        adminId INTEGER,
        status TEXT DEFAULT 'active', -- 'active', 'waiting', 'closed'
        startedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        endedAt DATETIME,
        FOREIGN KEY (userId) REFERENCES users (id),
        FOREIGN KEY (adminId) REFERENCES users (id)
    )`);

    // جدول پیام‌های چت زنده
    db.run(`CREATE TABLE IF NOT EXISTS live_chat_messages (
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
    )`);

    console.log('✅ جداول پشتیبانی ایجاد شدند');
    
    // اضافه کردن داده‌های تستی
    addTestData();
}

function addTestData() {
    // اضافه کردن تیکت‌های تستی
    const testTickets = [
        {
            userId: 1,
            subject: 'مشکل در ورود به سیستم',
            description: 'هنگام ورود به سیستم با خطای "نام کاربری یا رمز عبور اشتباه" مواجه می‌شوم.',
            priority: 'high',
            category: 'technical',
            status: 'open'
        },
        {
            userId: 1,
            subject: 'سوال در مورد دوره‌ها',
            description: 'آیا امکان دانلود ویدیوهای دوره‌ها وجود دارد؟',
            priority: 'medium',
            category: 'general',
            status: 'open'
        },
        {
            userId: 1,
            subject: 'مشکل در پرداخت',
            description: 'هنگام پرداخت با کارت بانکی خطا دریافت می‌کنم.',
            priority: 'urgent',
            category: 'billing',
            status: 'in_progress'
        }
    ];

    testTickets.forEach((ticket, index) => {
        db.run(`
            INSERT INTO support_tickets (userId, subject, description, priority, category, status)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            ticket.userId,
            ticket.subject,
            ticket.description,
            ticket.priority,
            ticket.category,
            ticket.status
        ], function(err) {
            if (err) {
                console.error(`❌ خطا در اضافه کردن تیکت ${index + 1}:`, err);
            } else {
                console.log(`✅ تیکت ${index + 1} اضافه شد: ${ticket.subject}`);
            }
        });
    });

    console.log('✅ داده‌های تستی اضافه شدند');
    console.log('\n🌐 برای تست سیستم پشتیبانی به آدرس زیر بروید:');
    console.log('http://localhost:3000/support.html');
    
    db.close();
} 