const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const xss = require('xss-clean');
const hpp = require('hpp');
const crypto = require('crypto');
const HackerProtection = require('./hacker-protection');
const nodemailer = require('nodemailer');
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_your_stripe_secret_key');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

// راه‌اندازی سیستم محافظت از هکرها
const hackerProtection = new HackerProtection();

// امنیت - IP Blacklist
const blacklistedIPs = new Set();
const suspiciousIPs = new Map(); // IP -> { count: number, firstSeen: Date }

// امنیت - Brute Force Detection
function detectBruteForce(ip) {
    const now = new Date();
    const suspicious = suspiciousIPs.get(ip);
    
    if (!suspicious) {
        suspiciousIPs.set(ip, { count: 1, firstSeen: now });
        return false;
    }
    
    suspicious.count++;
    
    // اگر در 5 دقیقه بیش از 10 تلاش ناموفق داشت
    if (suspicious.count > 10 && (now - suspicious.firstSeen) < 5 * 60 * 1000) {
        blacklistedIPs.add(ip);
        console.log(`🚨 IP ${ip} blacklisted due to brute force attempts`);
        return true;
    }
    
    // ریست کردن بعد از 15 دقیقه
    if ((now - suspicious.firstSeen) > 15 * 60 * 1000) {
        suspiciousIPs.delete(ip);
    }
    
    return false;
}

// امنیت - IP Blacklist Middleware
app.use((req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (blacklistedIPs.has(clientIP) || hackerProtection.isIPBlocked(clientIP)) {
        return res.status(403).json({ 
            success: false, 
            message: 'دسترسی شما مسدود شده است' 
        });
    }
    
    next();
});

// امنیت - Advanced Security Check Middleware
app.use((req, res, next) => {
    const securityCheck = hackerProtection.performSecurityCheck(req);
    
    if (!securityCheck.allowed) {
        const clientIP = req.ip || req.connection.remoteAddress;
        hackerProtection.recordFailedAttempt(clientIP);
        
        return res.status(403).json({ 
            success: false, 
            message: 'دسترسی مسدود شده است' 
        });
    }
    
    next();
});

// امنیت - Advanced Rate Limiting
const advancedLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'تعداد درخواست‌ها بیش از حد مجاز است',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        const clientIP = req.ip || req.connection.remoteAddress;
        if (detectBruteForce(clientIP)) {
            return res.status(403).json({ 
                success: false, 
                message: 'دسترسی شما مسدود شده است' 
            });
        }
        res.status(429).json({ 
            success: false, 
            message: 'تعداد درخواست‌ها بیش از حد مجاز است' 
        });
    }
});

app.use('/api/', advancedLimiter);

// امنیت - Login Protection
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'تعداد تلاش‌های ورود بیش از حد مجاز است',
    handler: (req, res) => {
        const clientIP = req.ip || req.connection.remoteAddress;
        detectBruteForce(clientIP);
        res.status(429).json({ 
            success: false, 
            message: 'تعداد تلاش‌های ورود بیش از حد مجاز است' 
        });
    }
});
app.use('/api/login', loginLimiter);

// امنیت - Advanced Headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "ws:", "wss:"],
            fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            upgradeInsecureRequests: []
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: "deny" },
    hidePoweredBy: true,
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    ieNoOpen: true,
    noSniff: true,
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true
}));

// امنیت - CORS با تنظیمات سختگیرانه
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://yourdomain.com'] 
        : ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    exposedHeaders: ['X-Total-Count'],
    maxAge: 86400 // 24 ساعت
}));

// امنیت - XSS Protection پیشرفته
app.use(xss());

// امنیت - Parameter Pollution Protection
app.use(hpp());

// امنیت - Body Parser با محدودیت‌های سختگیرانه
app.use(express.json({ 
    limit: '10kb',
    verify: (req, res, buf) => {
        try {
            JSON.parse(buf);
        } catch (e) {
            res.status(400).json({ success: false, message: 'JSON نامعتبر' });
            throw new Error('Invalid JSON');
        }
    }
}));
app.use(express.urlencoded({ 
    extended: true, 
    limit: '10kb',
    parameterLimit: 10 // حداکثر 10 پارامتر
}));

// امنیت - SQL Injection Protection
function sanitizeSQL(input) {
    if (typeof input !== 'string') return input;
    return input
        .replace(/['";\\]/g, '') // حذف کاراکترهای خطرناک SQL
        .replace(/--/g, '') // حذف کامنت SQL
        .replace(/\/\*/g, '') // حذف کامنت SQL
        .replace(/\*\//g, '') // حذف کامنت SQL
        .replace(/union/gi, '') // حذف UNION
        .replace(/select/gi, '') // حذف SELECT
        .replace(/insert/gi, '') // حذف INSERT
        .replace(/update/gi, '') // حذف UPDATE
        .replace(/delete/gi, '') // حذف DELETE
        .replace(/drop/gi, '') // حذف DROP
        .replace(/create/gi, '') // حذف CREATE
        .replace(/alter/gi, '') // حذف ALTER
        .trim();
}

// امنیت - Advanced Input Sanitization
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input
        .replace(/[<>]/g, '') // حذف تگ‌های HTML
        .replace(/javascript:/gi, '') // حذف javascript:
        .replace(/on\w+=/gi, '') // حذف event handlers
        .replace(/data:/gi, '') // حذف data URLs
        .replace(/vbscript:/gi, '') // حذف VBScript
        .replace(/expression\(/gi, '') // حذف CSS expressions
        .replace(/eval\(/gi, '') // حذف eval
        .replace(/document\./gi, '') // حذف document access
        .replace(/window\./gi, '') // حذف window access
        .replace(/localStorage/gi, '') // حذف localStorage
        .replace(/sessionStorage/gi, '') // حذف sessionStorage
        .replace(/cookie/gi, '') // حذف cookie access
        .trim();
}

// امنیت - Advanced Middleware
app.use((req, res, next) => {
    // پاک‌سازی body
    if (req.body) {
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                req.body[key] = sanitizeInput(sanitizeSQL(req.body[key]));
            }
        });
    }
    
    // پاک‌سازی query
    if (req.query) {
        Object.keys(req.query).forEach(key => {
            if (typeof req.query[key] === 'string') {
                req.query[key] = sanitizeInput(sanitizeSQL(req.query[key]));
            }
        });
    }
    
    // پاک‌سازی params
    if (req.params) {
        Object.keys(req.params).forEach(key => {
            if (typeof req.params[key] === 'string') {
                req.params[key] = sanitizeInput(sanitizeSQL(req.params[key]));
            }
        });
    }
    
    next();
});

// امنیت - Request Size Limiting
app.use((req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    if (contentLength > 10 * 1024) { // 10KB limit
        return res.status(413).json({ 
            success: false, 
            message: 'حجم درخواست بیش از حد مجاز است' 
        });
    }
    next();
});

// امنیت - User Agent Validation
app.use((req, res, next) => {
    const userAgent = req.headers['user-agent'] || '';
    const suspiciousPatterns = [
        /sqlmap/i,
        /nikto/i,
        /nmap/i,
        /scanner/i,
        /bot/i,
        /crawler/i,
        /spider/i
    ];
    
    if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
        const clientIP = req.ip || req.connection.remoteAddress;
        blacklistedIPs.add(clientIP);
        return res.status(403).json({ 
            success: false, 
            message: 'دسترسی مسدود شده است' 
        });
    }
    
    next();
});

// امنیت - Advanced JWT Authentication
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ success: false, message: 'توکن احراز هویت لازم است' });
    }
    
    // بررسی فرمت توکن
    if (!/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/.test(token)) {
        return res.status(403).json({ success: false, message: 'فرمت توکن نامعتبر است' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET || 'mysecretkey', (err, user) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ success: false, message: 'توکن منقضی شده است' });
            }
            return res.status(403).json({ success: false, message: 'توکن نامعتبر است' });
        }
        
        // بررسی اضافی
        if (!user.userId || !user.email) {
            return res.status(403).json({ success: false, message: 'توکن نامعتبر است' });
        }
        
        req.user = user;
        next();
    });
}

// امنیت - Admin Check
function requireAdmin(req, res, next) {
    db.get('SELECT isAdmin FROM users WHERE id = ?', [req.user.userId], (err, user) => {
        if (err || !user || !user.isAdmin) {
            return res.status(403).json({ success: false, message: 'دسترسی ادمین لازم است' });
        }
        next();
    });
}

// امنیت - CSRF Protection
app.use((req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
        const token = req.headers['x-csrf-token'] || req.body._csrf;
        const sessionToken = req.session?.csrfToken;
        
        if (!token || token !== sessionToken) {
            return res.status(403).json({ success: false, message: 'CSRF token نامعتبر است' });
        }
    }
    next();
});

// امنیت - Content Security Policy پیشرفته
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "ws:", "wss:"],
        fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: [],
        requireTrustedTypesFor: ["'script'"]
    }
}));

// امنیت - No Cache برای صفحات حساس
app.use('/api/', (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

// امنیت - Advanced Logging
app.use((req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    const timestamp = new Date().toISOString();
    
    console.log(`🔒 ${timestamp} - ${req.method} ${req.path} - IP: ${clientIP} - UA: ${userAgent.substring(0, 50)}`);
    
    // لاگ کردن فعالیت‌های مشکوک
    if (req.path.includes('admin') || req.path.includes('login') || req.path.includes('register')) {
        console.log(`⚠️  Sensitive action: ${req.method} ${req.path} from ${clientIP}`);
    }
    
    next();
});

// امنیت - Error Handler پیشرفته
app.use((err, req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    console.error(`🚨 Error from ${clientIP}:`, err.stack);
    
    // لاگ کردن خطاهای امنیتی
    if (err.message.includes('SQL') || err.message.includes('injection')) {
        console.error(`🚨 Potential SQL injection attempt from ${clientIP}`);
        blacklistedIPs.add(clientIP);
    }
    
    res.status(500).json({ success: false, message: 'خطای داخلی سرور' });
});

// امنیت - 404 Handler
// ...existing code...

// امنیت - Cleanup Blacklist (هر ساعت)
setInterval(() => {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    blacklistedIPs.clear(); // ریست کردن blacklist هر ساعت
    console.log('🧹 IP blacklist cleared');
}, 60 * 60 * 1000);

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/videos', express.static(path.join(__dirname, 'videos')));

// هندلر 404 باید آخرین middleware باشد
// 404 handler should only trigger if no static file or route matched
app.use((req, res) => {
    // If request accepts HTML, serve index.html for SPA routing
    if (req.accepts('html')) {
        res.sendFile(path.join(__dirname, 'index.html'));
    } else {
        res.status(404).json({ success: false, message: 'صفحه یافت نشد' });
    }
});

// Create directories if they don't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}
if (!fs.existsSync('videos')) {
    fs.mkdirSync('videos');
}

// Database connection (SQLite)
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('✅ Connected to SQLite database');
        
        // Create tables
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            profilePic TEXT,
            isAdmin INTEGER DEFAULT 0,
            twoFactorEnabled INTEGER DEFAULT 0,
            settings TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        
        db.run(`CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER,
            message TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (userId) REFERENCES users (id)
        )`);
        
        db.run(`CREATE TABLE IF NOT EXISTS videos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER,
            title TEXT NOT NULL,
            description TEXT,
            filename TEXT NOT NULL,
            thumbnail TEXT,
            category TEXT,
            views INTEGER DEFAULT 0,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (userId) REFERENCES users (id)
        )`);
        
        db.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            price DECIMAL(10,2) NOT NULL,
            type TEXT NOT NULL, -- 'course', 'product'
            imageUrl TEXT,
            stripeProductId TEXT,
            stripePriceId TEXT,
            isActive INTEGER DEFAULT 1,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        
        db.run(`CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER,
            productId INTEGER,
            quantity INTEGER,
            totalPrice REAL,
            status TEXT DEFAULT 'pending',
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (userId) REFERENCES users (id),
            FOREIGN KEY (productId) REFERENCES products (id)
        )`);
        
        db.run(`CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT DEFAULT 'info',
            isRead INTEGER DEFAULT 0,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (userId) REFERENCES users (id)
        )`);
        
        db.run(`CREATE TABLE IF NOT EXISTS likes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER,
            videoId INTEGER,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (userId) REFERENCES users (id),
            FOREIGN KEY (videoId) REFERENCES videos (id),
            UNIQUE(userId, videoId)
        )`);
        
        db.run(`CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER,
            videoId INTEGER,
            comment TEXT NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (userId) REFERENCES users (id),
            FOREIGN KEY (videoId) REFERENCES videos (id)
        )`);
        
        db.run(`CREATE TABLE IF NOT EXISTS courses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            image TEXT,
            instructor TEXT,
            duration TEXT,
            level TEXT,
            price REAL DEFAULT 0,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        
        db.run(`CREATE TABLE IF NOT EXISTS course_content (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            courseId INTEGER,
            title TEXT NOT NULL,
            type TEXT NOT NULL,
            content TEXT,
            filePath TEXT,
            orderIndex INTEGER,
            FOREIGN KEY (courseId) REFERENCES courses (id)
        )`);
        
        db.run(`CREATE TABLE IF NOT EXISTS user_course_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER,
            courseId INTEGER,
            completedContent TEXT,
            progress REAL DEFAULT 0,
            lastAccessed DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (userId) REFERENCES users (id),
            FOREIGN KEY (courseId) REFERENCES courses (id),
            UNIQUE(userId, courseId)
        )`);
        
        db.run(`CREATE TABLE IF NOT EXISTS course_quizzes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            courseId INTEGER,
            title TEXT NOT NULL,
            description TEXT,
            questions TEXT NOT NULL,
            timeLimit INTEGER,
            passingScore INTEGER DEFAULT 70,
            FOREIGN KEY (courseId) REFERENCES courses (id)
        )`);
        
        db.run(`CREATE TABLE IF NOT EXISTS user_quiz_answers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER,
            quizId INTEGER,
            answers TEXT NOT NULL,
            score REAL,
            completedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (userId) REFERENCES users (id),
            FOREIGN KEY (quizId) REFERENCES course_quizzes (id)
        )`);
        
        db.run(`CREATE TABLE IF NOT EXISTS certificates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER,
            courseId INTEGER,
            certificateNumber TEXT UNIQUE,
            issuedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (userId) REFERENCES users (id),
            FOREIGN KEY (courseId) REFERENCES courses (id)
        )`);
        
        // جداول پیام‌رسان
        db.run(`CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            type TEXT DEFAULT 'individual', -- 'individual' یا 'group'
            createdBy INTEGER,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (createdBy) REFERENCES users (id)
        )`);
        
        db.run(`CREATE TABLE IF NOT EXISTS conversation_participants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversationId INTEGER,
            userId INTEGER,
            joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            isAdmin INTEGER DEFAULT 0,
            FOREIGN KEY (conversationId) REFERENCES conversations (id),
            FOREIGN KEY (userId) REFERENCES users (id),
            UNIQUE(conversationId, userId)
        )`);
        
        db.run(`CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversationId INTEGER,
            senderId INTEGER,
            content TEXT NOT NULL,
            messageType TEXT DEFAULT 'text', -- 'text', 'image', 'file'
            fileUrl TEXT,
            isRead INTEGER DEFAULT 0,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (conversationId) REFERENCES conversations (id),
            FOREIGN KEY (senderId) REFERENCES users (id)
        )`);
        
        db.run(`CREATE TABLE IF NOT EXISTS message_reads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            messageId INTEGER,
            userId INTEGER,
            readAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (messageId) REFERENCES messages (id),
            FOREIGN KEY (userId) REFERENCES users (id),
            UNIQUE(messageId, userId)
        )`);
        
        // جدول اعلان‌های زنده
        db.run(`CREATE TABLE IF NOT EXISTS live_notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER,
            type TEXT NOT NULL, -- 'message', 'friend_request', 'purchase', 'system'
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            data TEXT, -- JSON data for additional info
            isRead INTEGER DEFAULT 0,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (userId) REFERENCES users (id)
        )`);
        
        // جدول درخواست‌های دوستی
        db.run(`CREATE TABLE IF NOT EXISTS friend_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fromUserId INTEGER,
            toUserId INTEGER,
            status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (fromUserId) REFERENCES users (id),
            FOREIGN KEY (toUserId) REFERENCES users (id),
            UNIQUE(fromUserId, toUserId)
        )`);
        
        // جدول محصولات
        db.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            price DECIMAL(10,2) NOT NULL,
            type TEXT NOT NULL, -- 'course', 'product'
            imageUrl TEXT,
            stripeProductId TEXT,
            stripePriceId TEXT,
            isActive INTEGER DEFAULT 1,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        
        // جدول تراکنش‌های پرداخت
        db.run(`CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER,
            productId INTEGER,
            stripePaymentIntentId TEXT,
            stripeSessionId TEXT,
            amount DECIMAL(10,2) NOT NULL,
            currency TEXT DEFAULT 'usd',
            status TEXT NOT NULL, -- 'pending', 'succeeded', 'failed', 'canceled'
            paymentMethod TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (userId) REFERENCES users (id),
            FOREIGN KEY (productId) REFERENCES products (id)
        )`);
        
        // جدول خریدهای کاربران
        db.run(`CREATE TABLE IF NOT EXISTS user_purchases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER,
            productId INTEGER,
            transactionId INTEGER,
            purchaseDate DATETIME DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'active', -- 'active', 'expired', 'refunded'
            FOREIGN KEY (userId) REFERENCES users (id),
            FOREIGN KEY (productId) REFERENCES products (id),
            FOREIGN KEY (transactionId) REFERENCES transactions (id)
        )`);
        
        // Insert sample data
db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
    if (row && row.count === 0) {
        db.run(`INSERT INTO products (name, description, price, type, imageUrl, isActive) VALUES 
            ('لپ‌تاپ گیمینگ', 'لپ‌تاپ قدرتمند برای بازی', 25000000, 'product', 'laptop.jpg', 1),
            ('هندزفری بی‌سیم', 'هندزفری با کیفیت بالا', 1200000, 'product', 'headphone.jpg', 1),
            ('کتاب برنامه‌نویسی', 'آموزش جامع JavaScript', 450000, 'product', 'book.jpg', 1)
        `);
    }
});
        
        db.get('SELECT COUNT(*) as count FROM courses', (err, row) => {
    if (row && row.count === 0) {
        db.run(`INSERT INTO courses (title, description, image, instructor, duration, level, price) VALUES 
            ('آموزش JavaScript', 'آموزش کامل JavaScript از مبتدی تا پیشرفته', 'js-course.jpg', 'علی احمدی', '20 ساعت', 'مبتدی', 0),
            ('آموزش React', 'ساخت اپلیکیشن‌های مدرن با React', 'react-course.jpg', 'مریم محمدی', '25 ساعت', 'متوسط', 1500000),
            ('آموزش Node.js', 'برنامه‌نویسی سمت سرور با Node.js', 'node-course.jpg', 'حسن رضایی', '30 ساعت', 'پیشرفته', 2000000)
        `);
    }
});
        
        db.get('SELECT COUNT(*) as count FROM course_quizzes', (err, row) => {
    if (row && row.count === 0) {
        db.run(`INSERT INTO course_quizzes (courseId, title, description, questions, timeLimit, passingScore) VALUES 
            (1, 'آزمون JavaScript مقدماتی', 'آزمون جامع مفاهیم پایه JavaScript', 
             '{"questions":[{"question":"JavaScript چیست؟","options":["زبان برنامه‌نویسی","زبان نشانه‌گذاری","زبان استایل"],"correct_answer":0},{"question":"کدام متغیر برای اعلان ثابت استفاده می‌شود؟","options":["var","let","const"],"correct_answer":2}]}', 
             30, 70)
        `);
    }
});
        
        console.log('✅ Database initialized successfully');
    }
});

// File upload configuration
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
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    },
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

// تنظیمات آپلود تصویر پروفایل
const profilePicStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'uploads'));
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, 'profile_' + req.user.userId + '_' + Date.now() + ext);
    }
});
const uploadProfilePic = multer({ storage: profilePicStorage });

// JWT Token generation
function generateToken(userId, email) {
    return jwt.sign(
        { userId, email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
    );
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/videos', (req, res) => {
    res.sendFile(path.join(__dirname, 'videos.html'));
});

app.get('/auth', (req, res) => {
    res.sendFile(path.join(__dirname, 'auth.html'));
});

// API Routes

// User registration
app.post('/api/register', async (req, res) => {
    const { name, email, password, passwordConfirm } = req.body;
    if (!email || !password || !passwordConfirm) return res.status(400).json({ success: false, message: 'همه فیلدها الزامی است' });
    if (password !== passwordConfirm) return res.status(400).json({ success: false, message: 'رمز و تکرار رمز یکسان نیستند' });
    
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (user) return res.status(400).json({ success: false, message: 'ایمیل قبلاً ثبت شده است' });
        const hash = await bcrypt.hash(password, 10);
        db.run('INSERT INTO users (name, email, password, twoFactorEnabled) VALUES (?, ?, ?, ?)', [name, email, hash, false], function(err) {
            if (err) return res.status(500).json({ success: false, message: 'خطا در ثبت‌نام' });
            const token = jwt.sign({ userId: this.lastID, email }, process.env.JWT_SECRET || 'mysecretkey', { expiresIn: '7d' });
            res.json({ success: true, token, requires2FA: false });
        });
    });
});

// User login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (!user) return res.status(400).json({ success: false, message: 'ایمیل یا رمز اشتباه است' });
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ success: false, message: 'ایمیل یا رمز اشتباه است' });
        
        // بررسی فعال بودن 2FA
        if (user.twoFactorEnabled) {
            // تولید و ارسال کد 2FA
            const code = generate2FACode();
            const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 دقیقه
            twoFactorCodes.set(user.id, { code, expires });
            
            const emailSent = await send2FACode(email, code);
            if (!emailSent) {
                return res.status(500).json({ success: false, message: 'خطا در ارسال کد احراز هویت' });
            }
            
            return res.json({ 
                success: true, 
                requires2FA: true, 
                message: 'کد احراز هویت به ایمیل شما ارسال شد',
                tempToken: jwt.sign({ userId: user.id, email: user.email, temp: true }, process.env.JWT_SECRET || 'mysecretkey', { expiresIn: '5m' })
            });
        } else {
            // ورود بدون 2FA
            const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET || 'mysecretkey', { expiresIn: '7d' });
            res.json({ success: true, token, requires2FA: false });
        }
    });
});

// تایید کد 2FA
app.post('/api/verify-2fa', (req, res) => {
    const { code, tempToken } = req.body;
    
    if (!code || !tempToken) {
        return res.status(400).json({ success: false, message: 'کد و توکن موقت الزامی است' });
    }
    
    try {
        const decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'mysecretkey');
        
        if (decoded.temp !== true) {
            return res.status(400).json({ success: false, message: 'توکن نامعتبر است' });
        }
        
        if (verify2FACode(decoded.userId, code)) {
            // تولید توکن اصلی
            const token = jwt.sign({ userId: decoded.userId, email: decoded.email }, process.env.JWT_SECRET || 'mysecretkey', { expiresIn: '7d' });
            res.json({ success: true, token, message: 'احراز هویت موفقیت‌آمیز بود' });
        } else {
            res.status(400).json({ success: false, message: 'کد نامعتبر یا منقضی شده است' });
        }
    } catch (error) {
        res.status(400).json({ success: false, message: 'توکن نامعتبر است' });
    }
});

// ارسال مجدد کد 2FA
app.post('/api/resend-2fa', (req, res) => {
    const { tempToken } = req.body;
    
    try {
        const decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'mysecretkey');
        
        if (decoded.temp !== true) {
            return res.status(400).json({ success: false, message: 'توکن نامعتبر است' });
        }
        
        // تولید کد جدید
        const code = generate2FACode();
        const expires = new Date(Date.now() + 5 * 60 * 1000);
        twoFactorCodes.set(decoded.userId, { code, expires });
        
        // ارسال کد جدید
        send2FACode(decoded.email, code).then(sent => {
            if (sent) {
                res.json({ success: true, message: 'کد جدید ارسال شد' });
            } else {
                res.status(500).json({ success: false, message: 'خطا در ارسال کد' });
            }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: 'توکن نامعتبر است' });
    }
});

// فعال/غیرفعال کردن 2FA
app.post('/api/profile/toggle-2fa', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { enable, password } = req.body;
    
    if (enable === undefined || !password) {
        return res.status(400).json({ success: false, message: 'پارامترهای الزامی ارسال نشده' });
    }
    
    // بررسی رمز عبور
    db.get('SELECT password FROM users WHERE id = ?', [userId], async (err, user) => {
        if (err || !user) {
            return res.status(404).json({ success: false, message: 'کاربر یافت نشد' });
        }
        
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).json({ success: false, message: 'رمز عبور اشتباه است' });
        }
        
        // به‌روزرسانی وضعیت 2FA
        db.run('UPDATE users SET twoFactorEnabled = ? WHERE id = ?', [enable ? 1 : 0, userId], function(err) {
            if (err) {
                return res.status(500).json({ success: false, message: 'خطا در به‌روزرسانی' });
            }
        
        res.json({ 
            success: true, 
                message: enable ? 'احراز هویت دو مرحله‌ای فعال شد' : 'احراز هویت دو مرحله‌ای غیرفعال شد',
                twoFactorEnabled: enable
        });
        });
    });
});

// Get user profile
app.get('/api/profile', authenticateToken, (req, res) => {
    db.get(
        'SELECT id, email, name, profilePic, createdAt FROM users WHERE id = ?',
        [req.user.userId],
        (err, user) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'خطا در دریافت پروفایل' });
            }
            if (!user) {
                return res.status(404).json({ success: false, message: 'کاربر یافت نشد' });
            }
        res.json({ success: true, user });
        }
    );
});

// ویرایش اطلاعات کاربر
app.post('/api/profile/edit', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const { name, email } = req.body;
    db.run('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, userId], function(err) {
        if (err) return res.status(500).json({ success: false, message: 'خطا در ویرایش اطلاعات' });
        res.json({ success: true });
    });
});

// تغییر رمز عبور
app.post('/api/profile/change-password', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { oldPassword, newPassword } = req.body;
    db.get('SELECT password FROM users WHERE id = ?', [userId], async (err, user) => {
        if (err || !user) return res.status(400).json({ success: false, message: 'کاربر یافت نشد' });
        const match = await bcrypt.compare(oldPassword, user.password);
        if (!match) return res.status(400).json({ success: false, message: 'رمز فعلی اشتباه است' });
        const hash = await bcrypt.hash(newPassword, 10);
        db.run('UPDATE users SET password = ? WHERE id = ?', [hash, userId], function(err) {
            if (err) return res.status(500).json({ success: false, message: 'خطا در تغییر رمز' });
            res.json({ success: true });
        });
    });
});

// آپلود تصویر پروفایل
app.post('/api/profile/upload-pic', authenticateToken, uploadProfilePic.single('profilePic'), (req, res) => {
    const userId = req.user.userId;
    if (!req.file) return res.status(400).json({ success: false, message: 'فایل ارسال نشد' });
    db.run('UPDATE users SET profilePic = ? WHERE id = ?', [req.file.filename, userId], function(err) {
        if (err) return res.status(500).json({ success: false, message: 'خطا در ذخیره تصویر' });
        res.json({ success: true, filename: req.file.filename });
    });
});

// Videos API
// دریافت لیست ویدئوهای آپلود شده توسط کاربر
app.get('/api/my-videos', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    db.all('SELECT * FROM videos WHERE user_id = ? ORDER BY createdAt DESC', [userId], (err, videos) => {
        if (err) return res.status(500).json({ success: false, message: 'خطا در دریافت ویدئوها' });
        res.json({ success: true, videos });
    });
});

// محدودیت آپلود روزانه (۵ ویدئو در روز)
function canUploadToday(userId, cb) {
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    db.get('SELECT COUNT(*) as count FROM videos WHERE user_id = ? AND createdAt >= ? AND createdAt < ?', [userId, today.toISOString(), tomorrow.toISOString()], (err, row) => {
        if (err) return cb(false);
        cb(row.count < 5);
    });
}

// ویرایش route آپلود ویدئو برای محدودیت
app.post('/api/videos', authenticateToken, upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
]), (req, res) => {
    const userId = req.user.userId;
    canUploadToday(userId, (allowed) => {
        if (!allowed) return res.status(429).json({ success: false, message: 'محدودیت آپلود روزانه (۵ ویدئو) را رد کرده‌اید.' });
        try {
            const { title: videoTitle, description: videoDescription, type } = req.body;
            const videoFile = req.files['video'] ? req.files['video'][0] : null;
            const thumbnailFile = req.files['thumbnail'] ? req.files['thumbnail'][0] : null;
            if (!videoFile) {
                return res.status(400).json({ success: false, message: 'فایل ویدئو الزامی است' });
            }
            db.run(
                'INSERT INTO videos (title, description, filename, thumbnail, user_id, type) VALUES (?, ?, ?, ?, ?, ?)',
                [videoTitle, videoDescription, videoFile.filename, thumbnailFile ? thumbnailFile.filename : null, userId, type || 'normal'],
                function(err) {
                    if (err) {
                        return res.status(500).json({ success: false, message: 'خطا در آپلود ویدئو' });
                    }
                    res.json({ 
                        success: true, 
                        message: 'ویدئو با موفقیت آپلود شد',
                        video: {
                            id: this.lastID,
                            title: videoTitle,
                            description: videoDescription,
                            filename: videoFile.filename,
                            thumbnail: thumbnailFile ? thumbnailFile.filename : null,
                            type: type || 'normal'
                        }
                    });
                }
            );
    } catch (err) {
            res.status(500).json({ success: false, message: 'خطا در آپلود ویدئو' });
        }
    });
});

app.get('/api/videos', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    db.all(
        `SELECT v.*, u.name as user_name, u.profilePic as user_profilePic 
         FROM videos v 
         LEFT JOIN users u ON v.user_id = u.id 
         ORDER BY v.createdAt DESC 
         LIMIT ? OFFSET ?`,
        [limit, offset],
        (err, videos) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'خطا در دریافت ویدئوها' });
            }
            
            // Get total count
            db.get('SELECT COUNT(*) as total FROM videos', (err, result) => {
                if (err) {
                    return res.status(500).json({ success: false, message: 'خطا در دریافت تعداد ویدئوها' });
                }
        
        res.json({
            success: true,
                    videos,
                    pagination: {
                        page,
                        limit,
                        total: result.total,
                        pages: Math.ceil(result.total / limit)
                    }
                });
            });
        }
    );
});

app.get('/api/videos/:id', (req, res) => {
    db.get(
        `SELECT v.*, u.name as user_name, u.profilePic as user_profilePic 
         FROM videos v 
         LEFT JOIN users u ON v.user_id = u.id 
         WHERE v.id = ?`,
        [req.params.id],
        (err, video) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'خطا در دریافت ویدئو' });
            }
            if (!video) {
                return res.status(404).json({ success: false, message: 'ویدئو یافت نشد' });
            }
            
            // Increment views
            db.run('UPDATE videos SET views = views + 1 WHERE id = ?', [req.params.id]);
            
            res.json({ success: true, video });
        }
    );
});

// لایک یا آن‌لایک ویدئو
app.post('/api/videos/:id/like', authenticateToken, (req, res) => {
    const videoId = req.params.id;
    const userId = req.user.userId;
    db.get('SELECT * FROM likes WHERE user_id = ? AND video_id = ?', [userId, videoId], (err, like) => {
        if (err) return res.status(500).json({ success: false, message: 'خطا در بررسی لایک' });
        if (like) {
            // اگر قبلاً لایک کرده، آن‌لایک کن
            db.run('DELETE FROM likes WHERE user_id = ? AND video_id = ?', [userId, videoId], function(err) {
                if (err) return res.status(500).json({ success: false, message: 'خطا در حذف لایک' });
                res.json({ success: true, liked: false });
            });
        } else {
            // اگر لایک نکرده، لایک کن
            db.run('INSERT INTO likes (user_id, video_id) VALUES (?, ?)', [userId, videoId], function(err) {
                if (err) return res.status(500).json({ success: false, message: 'خطا در ثبت لایک' });
                res.json({ success: true, liked: true });
            });
        }
    });
});

// دریافت تعداد لایک و وضعیت لایک کاربر
app.get('/api/videos/:id/likes', authenticateToken, (req, res) => {
    const videoId = req.params.id;
    const userId = req.user.userId;
    db.get('SELECT COUNT(*) as count FROM likes WHERE video_id = ?', [videoId], (err, row) => {
        if (err) return res.status(500).json({ success: false });
        const totalLikes = row.count;
        db.get('SELECT 1 FROM likes WHERE video_id = ? AND user_id = ?', [videoId, userId], (err, likedRow) => {
            if (err) return res.status(500).json({ success: false });
            res.json({ success: true, totalLikes, liked: !!likedRow });
        });
    });
});

// ثبت کامنت برای ویدئو
app.post('/api/videos/:id/comments', authenticateToken, (req, res) => {
    const videoId = req.params.id;
    const userId = req.user.userId;
    const text = req.body.text;
    if (!text || !text.trim()) return res.status(400).json({ success: false, message: 'متن کامنت الزامی است' });
    db.run('INSERT INTO comments (video_id, user_id, text) VALUES (?, ?, ?)', [videoId, userId, text], function(err) {
        if (err) return res.status(500).json({ success: false, message: 'خطا در ثبت کامنت' });
        res.json({ success: true, comment: { id: this.lastID, video_id: videoId, user_id: userId, text, createdAt: new Date().toISOString() } });
    });
});
// دریافت کامنت‌های یک ویدئو
app.get('/api/videos/:id/comments', (req, res) => {
    const videoId = req.params.id;
    db.all('SELECT c.*, u.name as user_name FROM comments c LEFT JOIN users u ON c.user_id = u.id WHERE c.video_id = ? ORDER BY c.createdAt DESC LIMIT 100', [videoId], (err, comments) => {
        if (err) return res.status(500).json({ success: false, message: 'خطا در دریافت کامنت‌ها' });
        res.json({ success: true, comments });
    });
});

// Products API
// API دریافت لیست محصولات
app.get('/api/products', (req, res) => {
    db.all('SELECT * FROM products ORDER BY createdAt DESC', (err, products) => {
        if (err) return res.status(500).json({ success: false, message: 'خطا در دریافت محصولات' });
        res.json({ success: true, products });
    });
});

// الگوریتم پیشنهاد ویدئو
app.get('/api/videos/recommend', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    // محبوب‌ترین ویدئوها (بر اساس تعداد لایک)
    db.all(`SELECT v.*, COUNT(l.id) as likeCount FROM videos v LEFT JOIN likes l ON v.id = l.video_id GROUP BY v.id ORDER BY likeCount DESC, v.views DESC LIMIT 5`, [], (err, trending) => {
        if (err) return res.status(500).json({ success: false, message: 'خطا در دریافت ویدئوهای محبوب' });
        // جدیدترین ویدئوها
        db.all(`SELECT * FROM videos ORDER BY createdAt DESC LIMIT 5`, [], (err, newest) => {
            if (err) return res.status(500).json({ success: false, message: 'خطا در دریافت ویدئوهای جدید' });
            // علاقه‌مندی کاربر (بر اساس لایک‌های کاربر)
            db.all(`SELECT v.* FROM videos v INNER JOIN likes l ON v.id = l.video_id WHERE l.user_id = ? ORDER BY l.createdAt DESC LIMIT 5`, [userId], (err, liked) => {
                if (err) return res.status(500).json({ success: false, message: 'خطا در دریافت علاقه‌مندی‌ها' });
                res.json({ success: true, trending, newest, liked });
            });
        });
    });
});

// Courses API
app.get('/api/courses', (req, res) => {
    db.all('SELECT * FROM courses ORDER BY createdAt DESC', (err, courses) => {
        if (err) return res.status(500).json({ success: false, message: 'خطا در دریافت دوره‌ها' });
        res.json({ success: true, courses });
    });
});

app.get('/api/courses/:id', (req, res) => {
    const courseId = req.params.id;
    db.get('SELECT * FROM courses WHERE id = ?', [courseId], (err, course) => {
        if (err) return res.status(500).json({ success: false, message: 'خطا در دریافت دوره' });
        if (!course) return res.status(404).json({ success: false, message: 'دوره یافت نشد' });
        
        // دریافت محتوای دوره
        db.all('SELECT * FROM course_content WHERE course_id = ? ORDER BY order_num ASC', [courseId], (err, content) => {
            if (err) return res.status(500).json({ success: false, message: 'خطا در دریافت محتوای دوره' });
            res.json({ success: true, course, content });
        });
    });
});

// ثبت یا به‌روزرسانی پیشرفت کاربر در دوره
app.post('/api/courses/:id/progress', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const courseId = req.params.id;
    const { completedContentIds, progressPercent } = req.body;
    const now = new Date().toISOString();
    db.get('SELECT * FROM user_course_progress WHERE user_id = ? AND course_id = ?', [userId, courseId], (err, row) => {
        if (row) {
            db.run('UPDATE user_course_progress SET completed_content_ids = ?, progress_percent = ?, last_access = ? WHERE id = ?',
                [JSON.stringify(completedContentIds), progressPercent, now, row.id],
                function(err) {
                    if (err) return res.status(500).json({ success: false });
                    res.json({ success: true });
                });
        } else {
            db.run('INSERT INTO user_course_progress (user_id, course_id, completed_content_ids, progress_percent, last_access) VALUES (?, ?, ?, ?, ?)',
                [userId, courseId, JSON.stringify(completedContentIds), progressPercent, now],
                function(err) {
                    if (err) return res.status(500).json({ success: false });
                    res.json({ success: true });
                });
        }
    });
});
// دریافت پیشرفت کاربر در دوره
app.get('/api/courses/:id/progress', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const courseId = req.params.id;
    db.get('SELECT * FROM user_course_progress WHERE user_id = ? AND course_id = ?', [userId, courseId], (err, row) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true, progress: row });
    });
});

// دریافت آزمون‌های دوره
app.get('/api/courses/:id/quizzes', authenticateToken, (req, res) => {
    const courseId = req.params.id;
    db.all('SELECT * FROM course_quizzes WHERE course_id = ? ORDER BY id', [courseId], (err, quizzes) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true, quizzes });
    });
});

// دریافت آزمون خاص
app.get('/api/quizzes/:id', authenticateToken, (req, res) => {
    const quizId = req.params.id;
    db.get('SELECT * FROM course_quizzes WHERE id = ?', [quizId], (err, quiz) => {
        if (err) return res.status(500).json({ success: false });
        if (!quiz) return res.status(404).json({ success: false });
        res.json({ success: true, quiz });
    });
});

// ثبت پاسخ آزمون
app.post('/api/quizzes/:id/submit', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const quizId = req.params.id;
    const { answers } = req.body;
    
    db.get('SELECT * FROM course_quizzes WHERE id = ?', [quizId], (err, quiz) => {
        if (err || !quiz) return res.status(404).json({ success: false });
        
        const questions = JSON.parse(quiz.questions);
        let correctAnswers = 0;
        const userAnswers = JSON.parse(answers);
        
        questions.forEach((question, index) => {
            if (userAnswers[index] === question.correct_answer) {
                correctAnswers++;
            }
        });
        
        const score = Math.round((correctAnswers / questions.length) * 100);
        const passed = score >= quiz.passing_score;
        
        db.run('INSERT INTO user_quiz_answers (user_id, quiz_id, answers, score, passed) VALUES (?, ?, ?, ?, ?)',
            [userId, quizId, answers, score, passed],
            function(err) {
                if (err) return res.status(500).json({ success: false });
                res.json({ success: true, score, passed, totalQuestions: questions.length });
            });
    });
});

// دریافت نتیجه آزمون کاربر
app.get('/api/quizzes/:id/result', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const quizId = req.params.id;
    db.get('SELECT * FROM user_quiz_answers WHERE user_id = ? AND quiz_id = ? ORDER BY completed_at DESC LIMIT 1', 
        [userId, quizId], (err, result) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true, result });
    });
});

// بررسی صلاحیت دریافت گواهی
app.get('/api/courses/:id/certificate/eligibility', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const courseId = req.params.id;
    
    // بررسی پیشرفت دوره
    db.get('SELECT * FROM user_course_progress WHERE user_id = ? AND course_id = ?', [userId, courseId], (err, progress) => {
        if (err) return res.status(500).json({ success: false });
        
        // بررسی قبولی در آزمون
        db.get('SELECT COUNT(*) as quiz_count FROM course_quizzes WHERE course_id = ?', [courseId], (err, quizCount) => {
            if (err) return res.status(500).json({ success: false });
            
            if (quizCount.quiz_count > 0) {
                db.get('SELECT COUNT(*) as passed_count FROM user_quiz_answers uqa JOIN course_quizzes cq ON uqa.quiz_id = cq.id WHERE uqa.user_id = ? AND cq.course_id = ? AND uqa.passed = 1', 
                    [userId, courseId], (err, passedCount) => {
                    if (err) return res.status(500).json({ success: false });
                    
                    const eligible = progress && progress.progress_percent >= 80 && passedCount.passed_count > 0;
                    res.json({ 
                        success: true, 
                        eligible,
                        progress: progress ? progress.progress_percent : 0,
                        quizPassed: passedCount.passed_count > 0
                    });
                });
            } else {
                const eligible = progress && progress.progress_percent >= 80;
                res.json({ 
                    success: true, 
                    eligible,
                    progress: progress ? progress.progress_percent : 0,
                    quizPassed: true
                });
            }
        });
    });
});

// صدور گواهی
app.post('/api/courses/:id/certificate', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const courseId = req.params.id;
    
    // بررسی صلاحیت
    db.get('SELECT * FROM user_course_progress WHERE user_id = ? AND course_id = ?', [userId, courseId], (err, progress) => {
        if (err || !progress || progress.progress_percent < 80) {
            return res.status(400).json({ success: false, message: 'شما صلاحیت دریافت گواهی را ندارید' });
        }
        
        // بررسی وجود گواهی قبلی
        db.get('SELECT * FROM certificates WHERE user_id = ? AND course_id = ?', [userId, courseId], (err, existingCert) => {
            if (err) return res.status(500).json({ success: false });
            
            if (existingCert) {
                return res.json({ success: true, certificate: existingCert });
            }
            
            // ایجاد شماره گواهی
            const certificateNumber = `CERT-${courseId}-${userId}-${Date.now()}`;
            
            // بررسی قبولی در آزمون
            db.get('SELECT COUNT(*) as passed_count FROM user_quiz_answers uqa JOIN course_quizzes cq ON uqa.quiz_id = cq.id WHERE uqa.user_id = ? AND cq.course_id = ? AND uqa.passed = 1', 
                [userId, courseId], (err, passedCount) => {
                if (err) return res.status(500).json({ success: false });
                
                db.run('INSERT INTO certificates (user_id, course_id, certificate_number, progress_percent, quiz_passed) VALUES (?, ?, ?, ?, ?)',
                    [userId, courseId, certificateNumber, progress.progress_percent, passedCount.passed_count > 0],
                    function(err) {
                        if (err) return res.status(500).json({ success: false });
                        
                        db.get('SELECT * FROM certificates WHERE id = ?', [this.lastID], (err, certificate) => {
                            if (err) return res.status(500).json({ success: false });
                            res.json({ success: true, certificate });
                        });
                    });
            });
        });
    });
});

// دریافت گواهی کاربر
app.get('/api/courses/:id/certificate', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const courseId = req.params.id;
    
    db.get('SELECT * FROM certificates WHERE user_id = ? AND course_id = ?', [userId, courseId], (err, certificate) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true, certificate });
    });
});

// دانلود گواهی PDF
app.get('/api/certificates/:id/download', authenticateToken, (req, res) => {
    const certificateId = req.params.id;
    const userId = req.user.userId;
    
    db.get('SELECT c.*, u.username, co.title as course_title FROM certificates c JOIN users u ON c.user_id = u.id JOIN courses co ON c.course_id = co.id WHERE c.id = ? AND c.user_id = ?', 
        [certificateId, userId], (err, certificate) => {
        if (err || !certificate) {
            return res.status(404).json({ success: false, message: 'گواهی یافت نشد' });
        }
        
        // ایجاد محتوای HTML گواهی
        const htmlContent = `
            <!DOCTYPE html>
            <html dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>گواهی پایان دوره</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 40px; background: #f5f5f5; }
                    .certificate { background: white; padding: 60px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); text-align: center; }
                    .header { color: #2c3e50; margin-bottom: 40px; }
                    .title { font-size: 36px; color: #3498db; margin-bottom: 20px; }
                    .content { font-size: 18px; line-height: 1.6; margin: 30px 0; }
                    .footer { margin-top: 40px; color: #7f8c8d; }
                    .certificate-number { background: #ecf0f1; padding: 10px; border-radius: 5px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="certificate">
                    <div class="header">
                        <h1>🎓 گواهی پایان دوره</h1>
                    </div>
                    <div class="title">${certificate.course_title}</div>
                    <div class="content">
                        این گواهی به <strong>${certificate.username}</strong> اعطا می‌شود
                        <br>برای تکمیل موفقیت‌آمیز دوره آموزشی
                        <br>با درصد پیشرفت ${certificate.progress_percent}%
                    </div>
                    <div class="certificate-number">
                        شماره گواهی: ${certificate.certificate_number}
                    </div>
                    <div class="footer">
                        تاریخ صدور: ${new Date(certificate.issued_date).toLocaleDateString('fa-IR')}
                    </div>
                </div>
            </body>
            </html>
        `;
        
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `attachment; filename="certificate-${certificate.certificate_number}.html"`);
        res.send(htmlContent);
    });
});

// دریافت تنظیمات کاربری
app.get('/api/settings', authenticateToken, (req, res) => {
    db.get('SELECT settings FROM users WHERE id = ?', [req.user.userId], (err, row) => {
        if (err) return res.status(500).json({ success: false });
        let settings = {};
        try { settings = row && row.settings ? JSON.parse(row.settings) : {}; } catch { settings = {}; }
        res.json({ success: true, settings });
    });
});
// ذخیره تنظیمات کاربری
app.post('/api/settings', authenticateToken, (req, res) => {
    const settings = JSON.stringify(req.body.settings || {});
    db.run('UPDATE users SET settings = ? WHERE id = ?', [settings, req.user.userId], function(err) {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true });
    });
});

// دریافت اعلان‌های کاربر
app.get('/api/notifications', authenticateToken, (req, res) => {
    db.all('SELECT * FROM notifications WHERE user_id = ? ORDER BY createdAt DESC LIMIT 100', [req.user.userId], (err, rows) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true, notifications: rows });
    });
});
// علامت‌گذاری اعلان به عنوان خوانده‌شده
app.post('/api/notifications/:id/read', authenticateToken, (req, res) => {
    db.run('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.userId], function(err) {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true });
    });
});
// حذف اعلان
app.delete('/api/notifications/:id', authenticateToken, (req, res) => {
    db.run('DELETE FROM notifications WHERE id = ? AND user_id = ?', [req.params.id, req.user.userId], function(err) {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true });
    });
});

// WebSocket connection handling
io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id);
    
    // احراز هویت کاربر
    socket.on('authenticate', async (data) => {
        try {
            const decoded = jwt.verify(data.token, process.env.JWT_SECRET || 'mysecretkey');
            socket.userId = decoded.userId;
            socket.email = decoded.email;
            
            // اضافه کردن کاربر به اتاق شخصی
            socket.join(`user_${decoded.userId}`);
            
            // ارسال لیست چت‌های کاربر
            const conversations = await getUserConversations(decoded.userId);
            socket.emit('conversations', conversations);
            
            console.log(`✅ User ${decoded.email} authenticated`);
        } catch (error) {
            socket.emit('error', 'Authentication failed');
        }
    });
    
    // پیوستن به چت
    socket.on('join_conversation', (conversationId) => {
        socket.join(`conversation_${conversationId}`);
        console.log(`👥 User ${socket.userId} joined conversation ${conversationId}`);
    });
    
    // ترک چت
    socket.on('leave_conversation', (conversationId) => {
        socket.leave(`conversation_${conversationId}`);
        console.log(`👋 User ${socket.userId} left conversation ${conversationId}`);
    });
    
    // ارسال پیام
    socket.on('send_message', async (data) => {
        try {
            const { conversationId, content, messageType = 'text', fileUrl } = data;
            
            // ذخیره پیام در دیتابیس
            const messageId = await saveMessage(socket.userId, conversationId, content, messageType, fileUrl);
            
            // دریافت اطلاعات کامل پیام
            const message = await getMessageById(messageId);
            
            // ارسال پیام به تمام اعضای چت
            io.to(`conversation_${conversationId}`).emit('new_message', message);
            
            // ارسال اعلان به کاربران آفلاین
            await sendOfflineNotifications(conversationId, message);
            
            console.log(`💬 Message sent in conversation ${conversationId}`);
        } catch (error) {
            socket.emit('error', 'Failed to send message');
            console.error('Error sending message:', error);
        }
    });
    
    // تایپ کردن
    socket.on('typing', (data) => {
        socket.to(`conversation_${data.conversationId}`).emit('user_typing', {
            userId: socket.userId,
            conversationId: data.conversationId
        });
    });
    
    // توقف تایپ کردن
    socket.on('stop_typing', (data) => {
        socket.to(`conversation_${data.conversationId}`).emit('user_stop_typing', {
            userId: socket.userId,
            conversationId: data.conversationId
        });
    });
    
    // خواندن پیام‌ها
    socket.on('mark_read', async (data) => {
        try {
            await markMessagesAsRead(data.conversationId, socket.userId);
            socket.to(`conversation_${data.conversationId}`).emit('messages_read', {
                userId: socket.userId,
                conversationId: data.conversationId
            });
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    });
    
    // قطع اتصال
    socket.on('disconnect', () => {
        console.log('🔌 User disconnected:', socket.id);
    });
});

// توابع کمکی برای پیام‌رسان
async function getUserConversations(userId) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT c.*, 
                   cp.isAdmin,
                   (SELECT COUNT(*) FROM messages m WHERE m.conversationId = c.id AND m.senderId != ? AND m.isRead = 0) as unreadCount,
                   (SELECT m.content FROM messages m WHERE m.conversationId = c.id ORDER BY m.createdAt DESC LIMIT 1) as lastMessage,
                   (SELECT m.createdAt FROM messages m WHERE m.conversationId = c.id ORDER BY m.createdAt DESC LIMIT 1) as lastMessageTime
            FROM conversations c
            INNER JOIN conversation_participants cp ON c.id = cp.conversationId
            WHERE cp.userId = ?
            ORDER BY lastMessageTime DESC
        `;
        
        db.all(query, [userId, userId], (err, conversations) => {
            if (err) reject(err);
            else resolve(conversations || []);
        });
    });
}

async function saveMessage(senderId, conversationId, content, messageType, fileUrl) {
    return new Promise((resolve, reject) => {
        const query = `
            INSERT INTO messages (senderId, conversationId, content, messageType, fileUrl)
            VALUES (?, ?, ?, ?, ?)
        `;
        
        db.run(query, [senderId, conversationId, content, messageType, fileUrl], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
        });
    });
}

async function getMessageById(messageId) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT m.*, u.name as senderName, u.profilePic as senderAvatar
            FROM messages m
            INNER JOIN users u ON m.senderId = u.id
            WHERE m.id = ?
        `;
        
        db.get(query, [messageId], (err, message) => {
            if (err) reject(err);
            else resolve(message);
        });
    });
}

async function markMessagesAsRead(conversationId, userId) {
    return new Promise((resolve, reject) => {
        const query = `
            UPDATE messages 
            SET isRead = 1 
            WHERE conversationId = ? AND senderId != ?
        `;
        
        db.run(query, [conversationId, userId], (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

async function sendOfflineNotifications(conversationId, message) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT cp.userId 
            FROM conversation_participants cp
            WHERE cp.conversationId = ? AND cp.userId != ?
        `;
        
        db.all(query, [conversationId, message.senderId], (err, participants) => {
            if (err) reject(err);
            else {
                participants.forEach(participant => {
                    // ارسال اعلان به کاربران آفلاین
                    io.to(`user_${participant.userId}`).emit('notification', {
                        type: 'new_message',
                        conversationId,
                        message: message.content,
                        sender: message.senderName
                    });
                });
                resolve();
            }
        });
    });
}

// API endpoints برای پیام‌رسان
app.get('/api/conversations', authenticateToken, async (req, res) => {
    try {
        const conversations = await getUserConversations(req.user.userId);
        res.json({ success: true, conversations });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطا در دریافت چت‌ها' });
    }
});

app.post('/api/conversations', authenticateToken, async (req, res) => {
    const { type, name, participants } = req.body;
    
    if (!type || !participants || participants.length === 0) {
        return res.status(400).json({ success: false, message: 'پارامترهای الزامی ارسال نشده' });
    }
    
    try {
        // ایجاد چت جدید
        const conversationId = await createConversation(req.user.userId, type, name);
        
        // اضافه کردن شرکت‌کنندگان
        await addParticipants(conversationId, participants, req.user.userId);
        
        res.json({ success: true, conversationId });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطا در ایجاد چت' });
    }
});

app.get('/api/conversations/:id/messages', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    try {
        const messages = await getConversationMessages(id, req.user.userId, page, limit);
        res.json({ success: true, messages });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطا در دریافت پیام‌ها' });
    }
});

app.post('/api/conversations/:id/participants', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { userIds } = req.body;
    
    try {
        await addParticipants(id, userIds, req.user.userId);
        res.json({ success: true, message: 'کاربران اضافه شدند' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطا در اضافه کردن کاربران' });
    }
});

app.delete('/api/conversations/:id/participants/:userId', authenticateToken, async (req, res) => {
    const { id, userId } = req.params;
    
    try {
        await removeParticipant(id, userId, req.user.userId);
        res.json({ success: true, message: 'کاربر حذف شد' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطا در حذف کاربر' });
    }
});

// توابع کمکی برای API
async function createConversation(createdBy, type, name) {
    return new Promise((resolve, reject) => {
        const query = `
            INSERT INTO conversations (name, type, createdBy)
            VALUES (?, ?, ?)
        `;
        
        db.run(query, [name, type, createdBy], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
        });
    });
}

async function addParticipants(conversationId, userIds, addedBy) {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare(`
            INSERT OR IGNORE INTO conversation_participants (conversationId, userId, isAdmin)
            VALUES (?, ?, ?)
        `);
        
        userIds.forEach(userId => {
            const isAdmin = userId === addedBy ? 1 : 0;
            stmt.run(conversationId, userId, isAdmin);
        });
        
        stmt.finalize((err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

async function getConversationMessages(conversationId, userId, page, limit) {
    return new Promise((resolve, reject) => {
        const offset = (page - 1) * limit;
        const query = `
            SELECT m.*, u.name as senderName, u.profilePic as senderAvatar
            FROM messages m
            INNER JOIN users u ON m.senderId = u.id
            WHERE m.conversationId = ?
            ORDER BY m.createdAt DESC
            LIMIT ? OFFSET ?
        `;
        
        db.all(query, [conversationId, limit, offset], (err, messages) => {
            if (err) reject(err);
            else resolve(messages || []);
        });
    });
}

async function removeParticipant(conversationId, userId, adminId) {
    return new Promise((resolve, reject) => {
        // بررسی ادمین بودن
        const checkQuery = `
            SELECT isAdmin FROM conversation_participants 
            WHERE conversationId = ? AND userId = ?
        `;
        
        db.get(checkQuery, [conversationId, adminId], (err, admin) => {
            if (err || !admin || !admin.isAdmin) {
                reject(new Error('دسترسی ادمین لازم است'));
                return;
            }
            
            const deleteQuery = `
                DELETE FROM conversation_participants 
                WHERE conversationId = ? AND userId = ?
            `;
            
            db.run(deleteQuery, [conversationId, userId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    });
}

// Start server
const PORT = process.env.PORT || 3000;

// امنیت - HTTPS در production
if (process.env.NODE_ENV === 'production') {
    const https = require('https');
    const fs = require('fs');
    
    const options = {
        key: fs.readFileSync(process.env.SSL_KEY_PATH || '/path/to/private.key'),
        cert: fs.readFileSync(process.env.SSL_CERT_PATH || '/path/to/certificate.crt')
    };
    
    https.createServer(options, app).listen(PORT, () => {
        console.log(`🚀 Secure server running on port ${PORT}`);
        console.log(`📱 Environment: ${process.env.NODE_ENV}`);
        console.log(`🔗 URL: https://localhost:${PORT}`);
    });
} else {
    server.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 URL: http://localhost:${PORT}`);
    });
} 

// API endpoints برای مانیتورینگ امنیتی (ادمین)
app.get('/api/admin/security-data', authenticateToken, requireAdmin, (req, res) => {
    const securityData = {
        blockedIPs: Array.from(hackerProtection.blockedIPs),
        suspiciousActivities: Array.from(hackerProtection.failedAttempts.entries()).map(([ip, data]) => ({
            ip,
            count: data.count,
            lastAttempt: data.lastAttempt,
            blocked: data.blocked
        })),
        securityLogs: [], // در اینجا می‌توانید لاگ‌های ذخیره شده را اضافه کنید
        loginAttempts: suspiciousIPs.size
    };
    
    res.json(securityData);
});

app.post('/api/admin/unblock-ip', authenticateToken, requireAdmin, (req, res) => {
    const { ip } = req.body;
    
    if (!ip) {
        return res.status(400).json({ success: false, message: 'IP الزامی است' });
    }
    
    // آزاد کردن IP از تمام سیستم‌های مسدودیت
    hackerProtection.blockedIPs.delete(ip);
    blacklistedIPs.delete(ip);
    suspiciousIPs.delete(ip);
    hackerProtection.failedAttempts.delete(ip);
    
    console.log(`🔓 IP ${ip} unblocked by admin`);
    
    res.json({ success: true, message: 'IP آزاد شد' });
});

app.post('/api/admin/clear-logs', authenticateToken, requireAdmin, (req, res) => {
    // پاک کردن لاگ‌های امنیتی
    hackerProtection.failedAttempts.clear();
    suspiciousIPs.clear();
    
    console.log('🧹 Security logs cleared by admin');
    
    res.json({ success: true, message: 'لاگ‌ها پاک شدند' });
});

app.post('/api/admin/block-ip', authenticateToken, requireAdmin, (req, res) => {
    const { ip, reason } = req.body;
    
    if (!ip) {
        return res.status(400).json({ success: false, message: 'IP الزامی است' });
    }
    
    // مسدود کردن IP
    hackerProtection.blockedIPs.add(ip);
    blacklistedIPs.add(ip);
    
    console.log(`🚨 IP ${ip} manually blocked by admin. Reason: ${reason || 'Manual block'}`);
    
    res.json({ success: true, message: 'IP مسدود شد' });
});

// API برای دریافت آمار امنیتی
app.get('/api/admin/security-stats', authenticateToken, requireAdmin, (req, res) => {
    const stats = {
        totalBlockedIPs: hackerProtection.blockedIPs.size,
        totalSuspiciousIPs: hackerProtection.failedAttempts.size,
        totalFailedAttempts: Array.from(hackerProtection.failedAttempts.values())
            .reduce((sum, data) => sum + data.count, 0),
        systemUptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        activeConnections: io.engine.clientsCount
    };
    
    res.json(stats);
});

// تنظیمات ایمیل برای 2FA
const emailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
});

// ذخیره کدهای 2FA موقت
const twoFactorCodes = new Map(); // userId -> { code: string, expires: Date }

// تولید کد 2FA
function generate2FACode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// ارسال کد 2FA به ایمیل
async function send2FACode(email, code) {
    const mailOptions = {
        from: process.env.EMAIL_USER || 'your-email@gmail.com',
        to: email,
        subject: 'کد احراز هویت دو مرحله‌ای',
        html: `
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">کد احراز هویت دو مرحله‌ای</h2>
                <p>کد زیر را در صفحه ورود وارد کنید:</p>
                <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
                    <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${code}</h1>
                </div>
                <p style="color: #666; font-size: 14px;">این کد تا 5 دقیقه معتبر است.</p>
                <p style="color: #666; font-size: 14px;">اگر شما این درخواست را نکرده‌اید، این ایمیل را نادیده بگیرید.</p>
            </div>
        `
    };
    
    try {
        await emailTransporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('خطا در ارسال ایمیل 2FA:', error);
        return false;
    }
}

// بررسی کد 2FA
function verify2FACode(userId, code) {
    const userCode = twoFactorCodes.get(userId);
    if (!userCode) return false;
    
    const now = new Date();
    if (now > userCode.expires) {
        twoFactorCodes.delete(userId);
        return false;
    }
    
    if (userCode.code === code) {
        twoFactorCodes.delete(userId);
        return true;
    }
    
    return false;
}

// توابع کمکی برای اعلان‌های زنده
async function createLiveNotification(userId, type, title, message, data = null) {
    return new Promise((resolve, reject) => {
        const query = `
            INSERT INTO live_notifications (userId, type, title, message, data)
            VALUES (?, ?, ?, ?, ?)
        `;
        
        const dataJson = data ? JSON.stringify(data) : null;
        
        db.run(query, [userId, type, title, message, dataJson], function(err) {
            if (err) reject(err);
            else {
                const notificationId = this.lastID;
                
                // ارسال اعلان زنده به کاربر
                io.to(`user_${userId}`).emit('live_notification', {
                    id: notificationId,
                    type,
                    title,
                    message,
                    data,
                    createdAt: new Date().toISOString()
                });
                
                resolve(notificationId);
            }
        });
    });
}

async function sendFriendRequest(fromUserId, toUserId) {
    return new Promise((resolve, reject) => {
        // بررسی وجود درخواست قبلی
        db.get('SELECT * FROM friend_requests WHERE fromUserId = ? AND toUserId = ?', 
            [fromUserId, toUserId], (err, existing) => {
                if (err) reject(err);
                else if (existing) {
                    reject(new Error('درخواست دوستی قبلاً ارسال شده است'));
                } else {
                    // ایجاد درخواست جدید
                    db.run('INSERT INTO friend_requests (fromUserId, toUserId) VALUES (?, ?)', 
                        [fromUserId, toUserId], function(err) {
                            if (err) reject(err);
                            else {
                                // دریافت اطلاعات کاربر فرستنده
                                db.get('SELECT name, email FROM users WHERE id = ?', [fromUserId], (err, user) => {
                                    if (!err && user) {
                                        // ارسال اعلان به کاربر گیرنده
                                        createLiveNotification(
                                            toUserId,
                                            'friend_request',
                                            'درخواست دوستی جدید',
                                            `${user.name} درخواست دوستی برای شما ارسال کرده است`,
                                            {
                                                fromUserId,
                                                fromUserName: user.name,
                                                requestId: this.lastID
                                            }
                                        );
                                    }
                                    resolve(this.lastID);
                                });
                            }
                        });
                }
            });
    });
}

async function handlePurchaseNotification(userId, orderData) {
    try {
        await createLiveNotification(
            userId,
            'purchase',
            'خرید موفق',
            `سفارش شما با شماره ${orderData.orderNumber} با موفقیت ثبت شد`,
            {
                orderId: orderData.id,
                orderNumber: orderData.orderNumber,
                total: orderData.total
            }
        );
    } catch (error) {
        console.error('Error creating purchase notification:', error);
    }
}

// API endpoints برای اعلان‌های زنده
app.get('/api/notifications/live', authenticateToken, async (req, res) => {
    try {
        const query = `
            SELECT * FROM live_notifications 
            WHERE userId = ? 
            ORDER BY createdAt DESC 
            LIMIT 50
        `;
        
        db.all(query, [req.user.userId], (err, notifications) => {
            if (err) {
                res.status(500).json({ success: false, message: 'خطا در دریافت اعلان‌ها' });
            } else {
                res.json({ success: true, notifications: notifications || [] });
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطا در دریافت اعلان‌ها' });
    }
});

app.post('/api/notifications/live/:id/read', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        db.run('UPDATE live_notifications SET isRead = 1 WHERE id = ? AND userId = ?', 
            [id, req.user.userId], function(err) {
                if (err) {
                    res.status(500).json({ success: false, message: 'خطا در به‌روزرسانی اعلان' });
                } else {
                    res.json({ success: true, message: 'اعلان به عنوان خوانده شده علامت‌گذاری شد' });
                }
            });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطا در به‌روزرسانی اعلان' });
    }
});

app.delete('/api/notifications/live/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        db.run('DELETE FROM live_notifications WHERE id = ? AND userId = ?', 
            [id, req.user.userId], function(err) {
                if (err) {
                    res.status(500).json({ success: false, message: 'خطا در حذف اعلان' });
                } else {
        res.json({ success: true, message: 'اعلان حذف شد' });
                }
            });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطا در حذف اعلان' });
    }
});

// API endpoints برای درخواست‌های دوستی
app.post('/api/friend-request', authenticateToken, async (req, res) => {
    try {
        const { toUserId } = req.body;
        
        if (!toUserId) {
            return res.status(400).json({ success: false, message: 'شناسه کاربر مورد نیاز است' });
        }
        
        if (req.user.userId === toUserId) {
            return res.status(400).json({ success: false, message: 'نمی‌توانید برای خودتان درخواست دوستی ارسال کنید' });
        }
        
        const requestId = await sendFriendRequest(req.user.userId, toUserId);
        res.json({ success: true, message: 'درخواست دوستی ارسال شد', requestId });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/friend-requests', authenticateToken, async (req, res) => {
    try {
        const query = `
            SELECT fr.*, u.name as fromUserName, u.email as fromUserEmail
            FROM friend_requests fr
            INNER JOIN users u ON fr.fromUserId = u.id
            WHERE fr.toUserId = ? AND fr.status = 'pending'
            ORDER BY fr.createdAt DESC
        `;
        
        db.all(query, [req.user.userId], (err, requests) => {
            if (err) {
                res.status(500).json({ success: false, message: 'خطا در دریافت درخواست‌ها' });
            } else {
                res.json({ success: true, requests: requests || [] });
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطا در دریافت درخواست‌ها' });
    }
});

app.post('/api/friend-request/:id/respond', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body; // 'accept' or 'reject'
        
        if (!['accept', 'reject'].includes(action)) {
            return res.status(400).json({ success: false, message: 'عملیات نامعتبر است' });
        }
        
        const status = action === 'accept' ? 'accepted' : 'rejected';
        
        db.run('UPDATE friend_requests SET status = ? WHERE id = ? AND toUserId = ?', 
            [status, id, req.user.userId], function(err) {
                if (err) {
                    res.status(500).json({ success: false, message: 'خطا در به‌روزرسانی درخواست' });
                } else {
                    // ارسال اعلان به کاربر فرستنده
                    db.get('SELECT fromUserId FROM friend_requests WHERE id = ?', [id], (err, request) => {
                        if (!err && request) {
                            const message = action === 'accept' ? 
                                'درخواست دوستی شما پذیرفته شد' : 
                                'درخواست دوستی شما رد شد';
                            
                            createLiveNotification(
                                request.fromUserId,
                                'friend_request',
                                'پاسخ درخواست دوستی',
                                message,
                                { requestId: id, action }
                            );
                        }
                    });
                    
                    res.json({ success: true, message: `درخواست ${action === 'accept' ? 'پذیرفته' : 'رد'} شد` });
                }
            });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطا در پاسخ به درخواست' });
    }
});

// به‌روزرسانی endpoint خرید برای ارسال اعلان
app.post('/api/orders', authenticateToken, upload.none(), (req, res) => {
    const { items, total } = req.body;
    
    if (!items || !total) {
        return res.status(400).json({ success: false, message: 'اطلاعات سفارش ناقص است' });
    }
    
    const orderNumber = 'ORD-' + Date.now();
    
    db.run('INSERT INTO orders (userId, items, total, orderNumber) VALUES (?, ?, ?, ?)', 
        [req.user.userId, items, total, orderNumber], function(err) {
            if (err) {
                return res.status(500).json({ success: false, message: 'خطا در ثبت سفارش' });
            }
            
            const orderData = {
                id: this.lastID,
                orderNumber,
                total
            };
            
            // ارسال اعلان خرید موفق
            handlePurchaseNotification(req.user.userId, orderData);
            
            res.json({ 
                success: true, 
                message: 'سفارش با موفقیت ثبت شد',
                orderId: this.lastID,
                orderNumber
            });
        });
});

// تابع کمکی برای دریافت شرکت‌کنندگان چت
async function getConversationParticipants(conversationId) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT cp.userId, u.name
            FROM conversation_participants cp
            INNER JOIN users u ON cp.userId = u.id
            WHERE cp.conversationId = ?
        `;
        
        db.all(query, [conversationId], (err, participants) => {
            if (err) reject(err);
            else resolve(participants || []);
        });
    });
}

// توابع کمکی برای Stripe
async function createStripeProduct(productData) {
    try {
        const product = await stripe.products.create({
            name: productData.name,
            description: productData.description,
            images: productData.imageUrl ? [productData.imageUrl] : undefined
        });
        
        const price = await stripe.prices.create({
            product: product.id,
            unit_amount: Math.round(productData.price * 100), // Stripe uses cents
            currency: 'usd'
        });
        
        return { productId: product.id, priceId: price.id };
    } catch (error) {
        console.error('Error creating Stripe product:', error);
        throw error;
    }
}

async function createPaymentIntent(amount, currency = 'usd') {
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: currency,
            automatic_payment_methods: {
                enabled: true,
            }
        });
        
        return paymentIntent;
    } catch (error) {
        console.error('Error creating payment intent:', error);
        throw error;
    }
}

async function createCheckoutSession(productId, userId, successUrl, cancelUrl) {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'Product',
                    },
                    unit_amount: 2000, // $20.00
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                userId: userId,
                productId: productId
            }
        });
        
        return session;
    } catch (error) {
        console.error('Error creating checkout session:', error);
        throw error;
    }
}

// API endpoints برای محصولات
app.get('/api/products', async (req, res) => {
    try {
        const query = `
            SELECT * FROM products 
            WHERE isActive = 1 
            ORDER BY createdAt DESC
        `;
        
        db.all(query, [], (err, products) => {
            if (err) {
                res.status(500).json({ success: false, message: 'خطا در دریافت محصولات' });
            } else {
                res.json({ success: true, products: products || [] });
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطا در دریافت محصولات' });
    }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        db.get('SELECT * FROM products WHERE id = ? AND isActive = 1', [id], (err, product) => {
            if (err) {
                res.status(500).json({ success: false, message: 'خطا در دریافت محصول' });
            } else if (!product) {
                res.status(404).json({ success: false, message: 'محصول یافت نشد' });
            } else {
                res.json({ success: true, product });
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطا در دریافت محصول' });
    }
});

// API endpoints برای پرداخت
app.post('/api/payment/create-payment-intent', authenticateToken, async (req, res) => {
    try {
        const { productId } = req.body;
        
        if (!productId) {
            return res.status(400).json({ success: false, message: 'شناسه محصول مورد نیاز است' });
        }
        
        // دریافت اطلاعات محصول
        const product = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM products WHERE id = ? AND isActive = 1', [productId], (err, product) => {
                if (err) reject(err);
                else resolve(product);
            });
        });
        
        if (!product) {
            return res.status(404).json({ success: false, message: 'محصول یافت نشد' });
        }
        
        // ایجاد Payment Intent
        const paymentIntent = await createPaymentIntent(product.price);
        
        // ثبت تراکنش در دیتابیس
        db.run(`
            INSERT INTO transactions (userId, productId, stripePaymentIntentId, amount, status)
            VALUES (?, ?, ?, ?, 'pending')
        `, [req.user.userId, productId, paymentIntent.id, product.price], function(err) {
            if (err) {
                console.error('Error saving transaction:', err);
            }
        });
        
        res.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });
    } catch (error) {
        console.error('Payment intent error:', error);
        res.status(500).json({ success: false, message: 'خطا در ایجاد پرداخت' });
    }
});

app.post('/api/payment/create-checkout-session', authenticateToken, async (req, res) => {
    try {
        const { productId } = req.body;
        
        if (!productId) {
            return res.status(400).json({ success: false, message: 'شناسه محصول مورد نیاز است' });
        }
        
        // دریافت اطلاعات محصول
        const product = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM products WHERE id = ? AND isActive = 1', [productId], (err, product) => {
                if (err) reject(err);
                else resolve(product);
            });
        });
        
        if (!product) {
            return res.status(404).json({ success: false, message: 'محصول یافت نشد' });
        }
        
        const successUrl = `${req.protocol}://${req.get('host')}/payment-success.html?session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${req.protocol}://${req.get('host')}/payment-cancel.html`;
        
        // ایجاد Checkout Session
        const session = await createCheckoutSession(productId, req.user.userId, successUrl, cancelUrl);
        
        // ثبت تراکنش در دیتابیس
        db.run(`
            INSERT INTO transactions (userId, productId, stripeSessionId, amount, status)
            VALUES (?, ?, ?, ?, 'pending')
        `, [req.user.userId, productId, session.id, product.price], function(err) {
            if (err) {
                console.error('Error saving transaction:', err);
            }
        });
        
        res.json({
            success: true,
            sessionId: session.id,
            url: session.url
        });
    } catch (error) {
        console.error('Checkout session error:', error);
        res.status(500).json({ success: false, message: 'خطا در ایجاد جلسه پرداخت' });
    }
});

// Webhook برای Stripe
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_your_webhook_secret';
    
    let event;
    
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    try {
        switch (event.type) {
            case 'payment_intent.succeeded':
                await handlePaymentSuccess(event.data.object);
                break;
            case 'checkout.session.completed':
                await handleCheckoutSuccess(event.data.object);
                break;
            case 'payment_intent.payment_failed':
                await handlePaymentFailure(event.data.object);
                break;
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
        
        res.json({ received: true });
    } catch (error) {
        console.error('Webhook handler error:', error);
        res.status(500).json({ error: 'Webhook handler failed' });
    }
});

// توابع پردازش Webhook
async function handlePaymentSuccess(paymentIntent) {
    try {
        // به‌روزرسانی وضعیت تراکنش
        db.run(`
            UPDATE transactions 
            SET status = 'succeeded', updatedAt = CURRENT_TIMESTAMP
            WHERE stripePaymentIntentId = ?
        `, [paymentIntent.id], function(err) {
            if (err) {
                console.error('Error updating transaction:', err);
                return;
            }
            
            // دریافت اطلاعات تراکنش
            db.get('SELECT * FROM transactions WHERE stripePaymentIntentId = ?', [paymentIntent.id], (err, transaction) => {
                if (err || !transaction) {
                    console.error('Error getting transaction:', err);
                    return;
                }
                
                // اضافه کردن خرید به پروفایل کاربر
                addPurchaseToUser(transaction.userId, transaction.productId, transaction.id);
                
                // ارسال اعلان خرید موفق
                handlePurchaseNotification(transaction.userId, {
                    id: transaction.id,
                    orderNumber: `TXN-${transaction.id}`,
                    total: transaction.amount
                });
            });
        });
    } catch (error) {
        console.error('Error handling payment success:', error);
    }
}

async function handleCheckoutSuccess(session) {
    try {
        // به‌روزرسانی وضعیت تراکنش
        db.run(`
            UPDATE transactions 
            SET status = 'succeeded', updatedAt = CURRENT_TIMESTAMP
            WHERE stripeSessionId = ?
        `, [session.id], function(err) {
            if (err) {
                console.error('Error updating transaction:', err);
                return;
            }
            
            // دریافت اطلاعات تراکنش
            db.get('SELECT * FROM transactions WHERE stripeSessionId = ?', [session.id], (err, transaction) => {
                if (err || !transaction) {
                    console.error('Error getting transaction:', err);
                    return;
                }
                
                // اضافه کردن خرید به پروفایل کاربر
                addPurchaseToUser(transaction.userId, transaction.productId, transaction.id);
                
                // ارسال اعلان خرید موفق
                handlePurchaseNotification(transaction.userId, {
                    id: transaction.id,
                    orderNumber: `TXN-${transaction.id}`,
                    total: transaction.amount
                });
            });
        });
    } catch (error) {
        console.error('Error handling checkout success:', error);
    }
}

async function handlePaymentFailure(paymentIntent) {
    try {
        // به‌روزرسانی وضعیت تراکنش
        db.run(`
            UPDATE transactions 
            SET status = 'failed', updatedAt = CURRENT_TIMESTAMP
            WHERE stripePaymentIntentId = ?
        `, [paymentIntent.id]);
    } catch (error) {
        console.error('Error handling payment failure:', error);
    }
}

// تابع اضافه کردن خرید به پروفایل کاربر
function addPurchaseToUser(userId, productId, transactionId) {
    db.run(`
        INSERT INTO user_purchases (userId, productId, transactionId)
        VALUES (?, ?, ?)
    `, [userId, productId, transactionId], function(err) {
        if (err) {
            console.error('Error adding purchase to user:', err);
        } else {
            console.log(`Purchase added for user ${userId}, product ${productId}`);
        }
    });
}

// API endpoint برای دریافت تراکنش‌های کاربر
app.get('/api/transactions', authenticateToken, async (req, res) => {
    try {
        const query = `
            SELECT t.*, p.name as productName, p.type as productType
            FROM transactions t
            INNER JOIN products p ON t.productId = p.id
            WHERE t.userId = ?
            ORDER BY t.createdAt DESC
        `;
        
        db.all(query, [req.user.userId], (err, transactions) => {
            if (err) {
                res.status(500).json({ success: false, message: 'خطا در دریافت تراکنش‌ها' });
            } else {
                res.json({ success: true, transactions: transactions || [] });
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطا در دریافت تراکنش‌ها' });
    }
});

// API endpoint برای دریافت خریدهای کاربر
app.get('/api/purchases', authenticateToken, async (req, res) => {
    try {
        const query = `
            SELECT up.*, p.name as productName, p.description, p.type as productType, p.imageUrl,
                   t.amount, t.status as transactionStatus
            FROM user_purchases up
            INNER JOIN products p ON up.productId = p.id
            INNER JOIN transactions t ON up.transactionId = t.id
            WHERE up.userId = ?
            ORDER BY up.purchaseDate DESC
        `;
        
        db.all(query, [req.user.userId], (err, purchases) => {
            if (err) {
                res.status(500).json({ success: false, message: 'خطا در دریافت خریدها' });
            } else {
                res.json({ success: true, purchases: purchases || [] });
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطا در دریافت خریدها' });
    }
});

// API endpoint برای دریافت کلید عمومی Stripe
app.get('/api/payment/stripe-key', (req, res) => {
    res.json({
        success: true,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_your_stripe_publishable_key'
    });
});

// سیستم پرداخت تستی داخلی
class TestPaymentSystem {
    constructor() {
        this.testCards = {
            '4242424242424242': { valid: true, balance: 1000 },
            '4000000000000002': { valid: true, balance: 500 },
            '4000000000009995': { valid: false, reason: 'insufficient_funds' },
            '4000000000009987': { valid: false, reason: 'card_declined' },
            '4000000000009979': { valid: false, reason: 'expired_card' }
        };
    }

    // اعتبارسنجی کارت تستی
    validateTestCard(cardNumber, expiryMonth, expiryYear, cvc) {
        // بررسی فرمت کارت
        if (!/^\d{16}$/.test(cardNumber)) {
            return { valid: false, error: 'شماره کارت نامعتبر است' };
        }

        if (!/^\d{2}$/.test(expiryMonth) || parseInt(expiryMonth) < 1 || parseInt(expiryMonth) > 12) {
            return { valid: false, error: 'ماه انقضا نامعتبر است' };
        }

        if (!/^\d{4}$/.test(expiryYear)) {
            return { valid: false, error: 'سال انقضا نامعتبر است' };
        }

        if (!/^\d{3,4}$/.test(cvc)) {
            return { valid: false, error: 'کد امنیتی نامعتبر است' };
        }

        // بررسی تاریخ انقضا
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;

        if (parseInt(expiryYear) < currentYear || 
            (parseInt(expiryYear) === currentYear && parseInt(expiryMonth) < currentMonth)) {
            return { valid: false, error: 'کارت منقضی شده است' };
        }

        // بررسی کارت در لیست کارت‌های تستی
        const cardInfo = this.testCards[cardNumber];
        if (!cardInfo) {
            return { valid: false, error: 'کارت در سیستم ثبت نشده است' };
        }

        if (!cardInfo.valid) {
            return { valid: false, error: this.getErrorMessage(cardInfo.reason) };
        }

        return { valid: true, balance: cardInfo.balance };
    }

    // دریافت پیام خطا
    getErrorMessage(reason) {
        const messages = {
            'insufficient_funds': 'موجودی کافی نیست',
            'card_declined': 'کارت رد شده است',
            'expired_card': 'کارت منقضی شده است'
        };
        return messages[reason] || 'خطا در پردازش کارت';
    }

    // پردازش پرداخت تستی
    async processTestPayment(cardNumber, amount, description) {
        const cardInfo = this.testCards[cardNumber];
        
        if (!cardInfo || !cardInfo.valid) {
            throw new Error('کارت نامعتبر است');
        }

        if (cardInfo.balance < amount) {
            throw new Error('موجودی کافی نیست');
        }

        // شبیه‌سازی تاخیر پردازش
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

        // تولید شماره تراکنش
        const transactionId = 'TXN' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();

        return {
            success: true,
            transactionId: transactionId,
            amount: amount,
            status: 'succeeded',
            timestamp: new Date().toISOString()
        };
    }

    // تولید کارت تستی جدید
    generateTestCard() {
        const prefixes = ['4242', '4000', '5555'];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const cardNumber = prefix + Math.random().toString().substr(2, 12);
        
        const currentYear = new Date().getFullYear();
        const expiryYear = currentYear + Math.floor(Math.random() * 5) + 1;
        const expiryMonth = Math.floor(Math.random() * 12) + 1;
        const cvc = Math.floor(Math.random() * 900) + 100;

        return {
            cardNumber: cardNumber,
            expiryMonth: expiryMonth.toString().padStart(2, '0'),
            expiryYear: expiryYear.toString(),
            cvc: cvc.toString(),
            balance: Math.floor(Math.random() * 1000) + 100
        };
    }
}

const testPayment = new TestPaymentSystem();

// API endpoints برای پرداخت تستی
app.post('/api/payment/process', authenticateToken, async (req, res) => {
    try {
        const { productId, cardNumber, expiryMonth, expiryYear, cvc, cardholderName } = req.body;
        
        if (!productId || !cardNumber || !expiryMonth || !expiryYear || !cvc || !cardholderName) {
            return res.status(400).json({ 
                success: false, 
                message: 'تمام فیلدها الزامی هستند' 
            });
        }
        
        // دریافت اطلاعات محصول
        const product = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM products WHERE id = ? AND isActive = 1', [productId], (err, product) => {
                if (err) reject(err);
                else resolve(product);
            });
        });
        
        if (!product) {
            return res.status(404).json({ success: false, message: 'محصول یافت نشد' });
        }
        
        // اعتبارسنجی کارت
        const cardValidation = testPayment.validateTestCard(cardNumber, expiryMonth, expiryYear, cvc);
        if (!cardValidation.valid) {
            return res.status(400).json({ 
                success: false, 
                message: cardValidation.error 
            });
        }
        
        // پردازش پرداخت
        const paymentResult = await testPayment.processTestPayment(
            cardNumber, 
            product.price, 
            product.name
        );
        
        // ثبت تراکنش در دیتابیس
        db.run(`
            INSERT INTO transactions (userId, productId, stripePaymentIntentId, amount, status, paymentMethod)
            VALUES (?, ?, ?, ?, 'succeeded', 'test_card')
        `, [req.user.userId, productId, paymentResult.transactionId, product.price], function(err) {
            if (err) {
                console.error('Error saving transaction:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'خطا در ثبت تراکنش' 
                });
            }
            
            const transactionId = this.lastID;
            
            // اضافه کردن خرید به پروفایل کاربر
            addPurchaseToUser(req.user.userId, productId, transactionId);
            
            // ارسال اعلان خرید موفق
            handlePurchaseNotification(req.user.userId, {
                id: transactionId,
                orderNumber: paymentResult.transactionId,
                total: product.price
            });
            
            res.json({
                success: true,
                transactionId: paymentResult.transactionId,
                amount: product.price,
                message: 'پرداخت با موفقیت انجام شد'
            });
        });
        
    } catch (error) {
        console.error('Payment processing error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطا در پردازش پرداخت: ' + error.message 
        });
    }
});

// API endpoint برای دریافت کارت‌های تستی
app.get('/api/payment/test-cards', (req, res) => {
    const testCards = [
        {
            cardNumber: '4242424242424242',
            expiryMonth: '12',
            expiryYear: '2025',
            cvc: '123',
            description: 'کارت موفق - موجودی: $1000'
        },
        {
            cardNumber: '4000000000000002',
            expiryMonth: '12',
            expiryYear: '2025',
            cvc: '123',
            description: 'کارت موفق - موجودی: $500'
        },
        {
            cardNumber: '4000000000009995',
            expiryMonth: '12',
            expiryYear: '2025',
            cvc: '123',
            description: 'کارت ناموفق - موجودی ناکافی'
        },
        {
            cardNumber: '4000000000009987',
            expiryMonth: '12',
            expiryYear: '2025',
            cvc: '123',
            description: 'کارت ناموفق - کارت رد شده'
        },
        {
            cardNumber: '4000000000009979',
            expiryMonth: '12',
            expiryYear: '2020',
            cvc: '123',
            description: 'کارت ناموفق - کارت منقضی شده'
        }
    ];
    
    res.json({
        success: true,
        testCards: testCards
    });
});

// API endpoint برای تولید کارت تستی جدید
app.post('/api/payment/generate-test-card', (req, res) => {
    try {
        const newCard = testPayment.generateTestCard();
        res.json({
            success: true,
            card: newCard
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'خطا در تولید کارت تستی'
        });
    }
});

// API endpoint برای اعتبارسنجی کارت
app.post('/api/payment/validate-card', (req, res) => {
    try {
        const { cardNumber, expiryMonth, expiryYear, cvc } = req.body;
        
        if (!cardNumber || !expiryMonth || !expiryYear || !cvc) {
            return res.status(400).json({
                success: false,
                message: 'تمام فیلدها الزامی هستند'
            });
        }
        
        const validation = testPayment.validateTestCard(cardNumber, expiryMonth, expiryYear, cvc);
        
        res.json({
            success: validation.valid,
            message: validation.valid ? 'کارت معتبر است' : validation.error,
            balance: validation.balance
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'خطا در اعتبارسنجی کارت'
        });
    }
});

// API endpoint برای دریافت کلید عمومی (برای سازگاری)
app.get('/api/payment/stripe-key', (req, res) => {
    res.json({
        success: true,
        publishableKey: 'pk_test_internal_payment_system',
        isTestMode: true
    });
});

// ==================== API های پشتیبانی آنلاین ====================

// دریافت تیکت‌های کاربر
app.get('/api/support/tickets', authenticateToken, (req, res) => {
    const userId = req.user.id;
    
    db.all(`
        SELECT t.*, u.name as userName, a.name as adminName
        FROM support_tickets t
        LEFT JOIN users u ON t.userId = u.id
        LEFT JOIN users a ON t.assignedTo = a.id
        WHERE t.userId = ?
        ORDER BY t.updatedAt DESC
    `, [userId], (err, tickets) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'خطا در دریافت تیکت‌ها'
            });
        }
        
        res.json({
            success: true,
            tickets: tickets
        });
    });
});

// دریافت تیکت‌های ادمین (تمام تیکت‌ها)
app.get('/api/support/admin/tickets', authenticateToken, requireAdmin, (req, res) => {
    db.all(`
        SELECT t.*, u.name as userName, u.email as userEmail, a.name as adminName
        FROM support_tickets t
        LEFT JOIN users u ON t.userId = u.id
        LEFT JOIN users a ON t.assignedTo = a.id
        ORDER BY 
            CASE t.priority 
                WHEN 'urgent' THEN 1 
                WHEN 'high' THEN 2 
                WHEN 'medium' THEN 3 
                WHEN 'low' THEN 4 
            END,
            t.updatedAt DESC
    `, (err, tickets) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'خطا در دریافت تیکت‌ها'
            });
        }
        
        res.json({
            success: true,
            tickets: tickets
        });
    });
});

// ایجاد تیکت جدید
app.post('/api/support/tickets', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const { subject, description, priority, category } = req.body;
    
    if (!subject || !description) {
        return res.status(400).json({
            success: false,
            message: 'موضوع و توضیحات الزامی هستند'
        });
    }
    
    db.run(`
        INSERT INTO support_tickets (userId, subject, description, priority, category)
        VALUES (?, ?, ?, ?, ?)
    `, [userId, subject, description, priority || 'medium', category || 'general'], function(err) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'خطا در ایجاد تیکت'
            });
        }
        
        const ticketId = this.lastID;
        
        // ارسال اعلان به ادمین‌ها
        io.emit('new_support_ticket', {
            ticketId: ticketId,
            subject: subject,
            priority: priority || 'medium',
            userId: userId
        });
        
        res.json({
            success: true,
            ticketId: ticketId,
            message: 'تیکت با موفقیت ایجاد شد'
        });
    });
});

// دریافت پاسخ‌های تیکت
app.get('/api/support/tickets/:ticketId/replies', authenticateToken, (req, res) => {
    const ticketId = req.params.ticketId;
    const userId = req.user.id;
    
    // بررسی دسترسی کاربر به تیکت
    db.get('SELECT userId FROM support_tickets WHERE id = ?', [ticketId], (err, ticket) => {
        if (err || !ticket) {
            return res.status(404).json({
                success: false,
                message: 'تیکت یافت نشد'
            });
        }
        
        // فقط صاحب تیکت یا ادمین می‌تواند پاسخ‌ها را ببیند
        if (ticket.userId !== userId && !req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'دسترسی غیرمجاز'
            });
        }
        
        db.all(`
            SELECT r.*, u.name as userName, u.profilePic
            FROM ticket_replies r
            LEFT JOIN users u ON r.userId = u.id
            WHERE r.ticketId = ?
            ORDER BY r.createdAt ASC
        `, [ticketId], (err, replies) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'خطا در دریافت پاسخ‌ها'
                });
            }
            
            res.json({
                success: true,
                replies: replies
            });
        });
    });
});

// اضافه کردن پاسخ به تیکت
app.post('/api/support/tickets/:ticketId/replies', authenticateToken, (req, res) => {
    const ticketId = req.params.ticketId;
    const userId = req.user.id;
    const { message } = req.body;
    
    if (!message) {
        return res.status(400).json({
            success: false,
            message: 'پیام الزامی است'
        });
    }
    
    // بررسی دسترسی کاربر به تیکت
    db.get('SELECT userId, status FROM support_tickets WHERE id = ?', [ticketId], (err, ticket) => {
        if (err || !ticket) {
            return res.status(404).json({
                success: false,
                message: 'تیکت یافت نشد'
            });
        }
        
        // فقط صاحب تیکت یا ادمین می‌تواند پاسخ دهد
        if (ticket.userId !== userId && !req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'دسترسی غیرمجاز'
            });
        }
        
        // اگر تیکت بسته است، فقط ادمین می‌تواند پاسخ دهد
        if (ticket.status === 'closed' && !req.user.isAdmin) {
            return res.status(400).json({
                success: false,
                message: 'تیکت بسته شده است'
            });
        }
        
        db.run(`
            INSERT INTO ticket_replies (ticketId, userId, message, isAdminReply)
            VALUES (?, ?, ?, ?)
        `, [ticketId, userId, message, req.user.isAdmin ? 1 : 0], function(err) {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'خطا در ارسال پاسخ'
                });
            }
            
            const replyId = this.lastID;
            
            // به‌روزرسانی زمان تیکت
            db.run('UPDATE support_tickets SET updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [ticketId]);
            
            // ارسال اعلان
            if (req.user.isAdmin) {
                // ادمین پاسخ داد - اعلان به کاربر
                io.to(`user_${ticket.userId}`).emit('ticket_reply', {
                    ticketId: ticketId,
                    replyId: replyId,
                    message: message,
                    isAdminReply: true
                });
            } else {
                // کاربر پاسخ داد - اعلان به ادمین‌ها
                io.emit('ticket_reply', {
                    ticketId: ticketId,
                    replyId: replyId,
                    message: message,
                    isAdminReply: false,
                    userId: userId
                });
            }
            
            res.json({
                success: true,
                replyId: replyId,
                message: 'پاسخ با موفقیت ارسال شد'
            });
        });
    });
});

// به‌روزرسانی وضعیت تیکت (ادمین)
app.put('/api/support/tickets/:ticketId/status', authenticateToken, requireAdmin, (req, res) => {
    const ticketId = req.params.ticketId;
    const { status, assignedTo } = req.body;
    
    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'وضعیت نامعتبر است'
        });
    }
    
    let query = 'UPDATE support_tickets SET status = ?, updatedAt = CURRENT_TIMESTAMP';
    let params = [status];
    
    if (assignedTo) {
        query += ', assignedTo = ?';
        params.push(assignedTo);
    }
    
    if (status === 'resolved') {
        query += ', resolvedAt = CURRENT_TIMESTAMP';
    }
    
    query += ' WHERE id = ?';
    params.push(ticketId);
    
    db.run(query, params, function(err) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'خطا در به‌روزرسانی تیکت'
            });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'تیکت یافت نشد'
            });
        }
        
        // ارسال اعلان به کاربر
        db.get('SELECT userId FROM support_tickets WHERE id = ?', [ticketId], (err, ticket) => {
            if (!err && ticket) {
                io.to(`user_${ticket.userId}`).emit('ticket_status_updated', {
                    ticketId: ticketId,
                    status: status
                });
            }
        });
        
        res.json({
            success: true,
            message: 'وضعیت تیکت به‌روزرسانی شد'
        });
    });
});

// ==================== چت زنده پشتیبانی ====================

// شروع چت زنده
app.post('/api/support/live-chat/start', authenticateToken, (req, res) => {
    const userId = req.user.id;
    
    // بررسی وجود چت فعال
    db.get('SELECT id FROM live_chats WHERE userId = ? AND status = "active"', [userId], (err, existingChat) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'خطا در بررسی چت‌های موجود'
            });
        }
        
        if (existingChat) {
            return res.json({
                success: true,
                chatId: existingChat.id,
                message: 'چت فعال موجود است'
            });
        }
        
        // ایجاد چت جدید
        db.run(`
            INSERT INTO live_chats (userId, status)
            VALUES (?, 'waiting')
        `, [userId], function(err) {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'خطا در ایجاد چت'
                });
            }
            
            const chatId = this.lastID;
            
            // ارسال اعلان به ادمین‌ها
            io.emit('new_live_chat', {
                chatId: chatId,
                userId: userId
            });
            
            res.json({
                success: true,
                chatId: chatId,
                message: 'چت ایجاد شد، منتظر پاسخ ادمین باشید'
            });
        });
    });
});

// دریافت چت‌های زنده کاربر
app.get('/api/support/live-chat', authenticateToken, (req, res) => {
    const userId = req.user.id;
    
    db.all(`
        SELECT c.*, u.name as userName, a.name as adminName
        FROM live_chats c
        LEFT JOIN users u ON c.userId = u.id
        LEFT JOIN users a ON c.adminId = a.id
        WHERE c.userId = ?
        ORDER BY c.startedAt DESC
    `, [userId], (err, chats) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'خطا در دریافت چت‌ها'
            });
        }
        
        res.json({
            success: true,
            chats: chats
        });
    });
});

// دریافت چت‌های زنده ادمین
app.get('/api/support/admin/live-chat', authenticateToken, requireAdmin, (req, res) => {
    db.all(`
        SELECT c.*, u.name as userName, u.email as userEmail, a.name as adminName
        FROM live_chats c
        LEFT JOIN users u ON c.userId = u.id
        LEFT JOIN users a ON c.adminId = a.id
        WHERE c.status IN ('waiting', 'active')
        ORDER BY c.startedAt ASC
    `, (err, chats) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'خطا در دریافت چت‌ها'
            });
        }
        
        res.json({
            success: true,
            chats: chats
        });
    });
});

// پذیرش چت توسط ادمین
app.post('/api/support/admin/live-chat/:chatId/accept', authenticateToken, requireAdmin, (req, res) => {
    const chatId = req.params.chatId;
    const adminId = req.user.id;
    
    db.run(`
        UPDATE live_chats 
        SET adminId = ?, status = 'active' 
        WHERE id = ? AND status = 'waiting'
    `, [adminId, chatId], function(err) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'خطا در پذیرش چت'
            });
        }
        
        if (this.changes === 0) {
            return res.status(400).json({
                success: false,
                message: 'چت قابل پذیرش نیست'
            });
        }
        
        // ارسال اعلان به کاربر
        db.get('SELECT userId FROM live_chats WHERE id = ?', [chatId], (err, chat) => {
            if (!err && chat) {
                io.to(`user_${chat.userId}`).emit('chat_accepted', {
                    chatId: chatId,
                    adminId: adminId
                });
            }
        });
        
        res.json({
            success: true,
            message: 'چت پذیرفته شد'
        });
    });
});

// ارسال پیام در چت زنده
app.post('/api/support/live-chat/:chatId/messages', authenticateToken, (req, res) => {
    const chatId = req.params.chatId;
    const userId = req.user.id;
    const { message, messageType = 'text' } = req.body;
    
    if (!message) {
        return res.status(400).json({
            success: false,
            message: 'پیام الزامی است'
        });
    }
    
    // بررسی دسترسی به چت
    db.get('SELECT userId, adminId, status FROM live_chats WHERE id = ?', [chatId], (err, chat) => {
        if (err || !chat) {
            return res.status(404).json({
                success: false,
                message: 'چت یافت نشد'
            });
        }
        
        // فقط شرکت‌کنندگان چت می‌توانند پیام ارسال کنند
        if (chat.userId !== userId && chat.adminId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'دسترسی غیرمجاز'
            });
        }
        
        // چت باید فعال باشد
        if (chat.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'چت فعال نیست'
            });
        }
        
        db.run(`
            INSERT INTO live_chat_messages (chatId, senderId, message, messageType)
            VALUES (?, ?, ?, ?)
        `, [chatId, userId, message, messageType], function(err) {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'خطا در ارسال پیام'
                });
            }
            
            const messageId = this.lastID;
            
            // ارسال پیام به طرف مقابل
            const recipientId = chat.userId === userId ? chat.adminId : chat.userId;
            if (recipientId) {
                io.to(`user_${recipientId}`).emit('live_chat_message', {
                    chatId: chatId,
                    messageId: messageId,
                    senderId: userId,
                    message: message,
                    messageType: messageType,
                    createdAt: new Date().toISOString()
                });
            }
            
            res.json({
                success: true,
                messageId: messageId,
                message: 'پیام ارسال شد'
            });
        });
    });
});

// دریافت پیام‌های چت زنده
app.get('/api/support/live-chat/:chatId/messages', authenticateToken, (req, res) => {
    const chatId = req.params.chatId;
    const userId = req.user.id;
    
    // بررسی دسترسی به چت
    db.get('SELECT userId, adminId FROM live_chats WHERE id = ?', [chatId], (err, chat) => {
        if (err || !chat) {
            return res.status(404).json({
                success: false,
                message: 'چت یافت نشد'
            });
        }
        
        // فقط شرکت‌کنندگان چت می‌توانند پیام‌ها را ببینند
        if (chat.userId !== userId && chat.adminId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'دسترسی غیرمجاز'
            });
        }
        
        db.all(`
            SELECT m.*, u.name as senderName, u.profilePic
            FROM live_chat_messages m
            LEFT JOIN users u ON m.senderId = u.id
            WHERE m.chatId = ?
            ORDER BY m.createdAt ASC
        `, [chatId], (err, messages) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'خطا در دریافت پیام‌ها'
                });
            }
            
            res.json({
                success: true,
                messages: messages
            });
        });
    });
});

// بستن چت زنده
app.post('/api/support/live-chat/:chatId/close', authenticateToken, (req, res) => {
    const chatId = req.params.chatId;
    const userId = req.user.id;
    
    // بررسی دسترسی به چت
    db.get('SELECT userId, adminId, status FROM live_chats WHERE id = ?', [chatId], (err, chat) => {
        if (err || !chat) {
            return res.status(404).json({
                success: false,
                message: 'چت یافت نشد'
            });
        }
        
        // فقط شرکت‌کنندگان چت می‌توانند آن را ببندند
        if (chat.userId !== userId && chat.adminId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'دسترسی غیرمجاز'
            });
        }
        
        db.run(`
            UPDATE live_chats 
            SET status = 'closed', endedAt = CURRENT_TIMESTAMP 
            WHERE id = ?
        `, [chatId], function(err) {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'خطا در بستن چت'
                });
            }
            
            // ارسال اعلان به طرف مقابل
            const recipientId = chat.userId === userId ? chat.adminId : chat.userId;
            if (recipientId) {
                io.to(`user_${recipientId}`).emit('chat_closed', {
                    chatId: chatId,
                    closedBy: userId
                });
            }
            
            res.json({
                success: true,
                message: 'چت بسته شد'
            });
        });
    });
});

// ...existing code...

// Serve static files
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Serve translation files
app.use('/locales', express.static('locales'));

// --- افزودن فیلد type به جدول videos اگر وجود ندارد (کد موقت برای مهاجرت دیتابیس) ---
const dbCheckTypeColumn = () => {
    const checkSql = "PRAGMA table_info(videos)";
    db.all(checkSql, (err, columns) => {
        if (err) return;
        const hasType = columns.some(col => col.name === 'type');
        if (!hasType) {
            db.run("ALTER TABLE videos ADD COLUMN type TEXT DEFAULT 'normal'", (err) => {
                if (!err) {
                    console.log('Migration: type column added to videos table.');
                }
            });
        }
    });
};
dbCheckTypeColumn();