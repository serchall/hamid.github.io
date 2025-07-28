const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
const Course = require('./models/Course');
const Message = require('./models/Message');
const Video = require('./models/Video');
const Notification = require('./models/Notification');

// Import middleware
const { authenticateToken, generateToken } = require('./middleware/auth');
const { uploadImage, uploadVideo } = require('./middleware/upload');
const xss = require('xss');
const csurf = require('csurf');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Security and optimization middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
            connectSrc: ["'self'", "wss:", "ws:"]
        }
    }
}));
app.use(compression());
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://your-app-name.herokuapp.com', 'https://your-vercel-app.vercel.app']
        : true,
    credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use(express.static(__dirname));
app.use('/uploads', express.static('uploads'));

// CSRF protection for sensitive forms and APIs
app.use(csurf({ cookie: false }));

// CSRF error handler
app.use(function (err, req, res, next) {
    if (err.code !== 'EBADCSRFTOKEN') return next(err);
    res.status(403).json({ success: false, message: 'درخواست نامعتبر (CSRF)' });
});

// Database connection (SQLite for simplicity)
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

// Initialize database tables
db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT,
        profilePic TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Messages table
    db.run(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER,
        text TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users (id)
    )`);

    // Videos table
    db.run(`CREATE TABLE IF NOT EXISTS videos (
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
    )`);

    // Products table
    db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        image TEXT,
        category TEXT,
        stock INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Orders table
    db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        total REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // Notifications table
    db.run(`CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info',
        read BOOLEAN DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`);
});

console.log('✅ Database initialized with SQLite');

// Create uploads directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// CSRF token endpoint
app.get('/api/csrf-token', (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

// Payment page
app.get('/payment', (req, res) => {
    res.sendFile(path.join(__dirname, 'payment.html'));
});

// Auth page
app.get('/auth', (req, res) => {
    res.sendFile(path.join(__dirname, 'auth.html'));
});

// Profile page
app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'profile.html'));
});

// Courses page
app.get('/courses', (req, res) => {
    res.sendFile(path.join(__dirname, 'courses.html'));
});

// Chat page
app.get('/chat', (req, res) => {
    res.sendFile(path.join(__dirname, 'chat.html'));
});

// Videos page
app.get('/videos', (req, res) => {
    res.sendFile(path.join(__dirname, 'videos.html'));
});

// Admin page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// API Routes

// User registration
app.post('/api/register', async (req, res) => {
    try {
        const cleanEmail = xss(req.body.email);
        const cleanName = xss(req.body.name);
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        
        db.run(
            'INSERT INTO users (email, name, password) VALUES (?, ?, ?)',
            [cleanEmail, cleanName, hashedPassword],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ success: false, message: 'این ایمیل قبلاً ثبت شده است' });
                    }
                    return res.status(500).json({ success: false, message: 'خطا در ثبت‌نام' });
                }
                
                const token = generateToken(this.lastID, cleanEmail);
                res.json({ 
                    success: true, 
                    token, 
                    user: { id: this.lastID, email: cleanEmail, name: cleanName } 
                });
            }
        );
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطا در ثبت‌نام' });
    }
});

// User login
app.post('/api/login', async (req, res) => {
    try {
        db.get(
            'SELECT * FROM users WHERE email = ?',
            [req.body.email],
            async (err, user) => {
                if (err) {
                    return res.status(500).json({ success: false, message: 'خطا در ورود' });
                }
                
                if (!user) {
                    return res.status(401).json({ success: false, message: 'ایمیل یا رمز عبور اشتباه است' });
                }
                
                const validPassword = await bcrypt.compare(req.body.password, user.password);
                if (!validPassword) {
                    return res.status(401).json({ success: false, message: 'ایمیل یا رمز عبور اشتباه است' });
                }
                
                const token = generateToken(user.id, user.email);
                res.json({ 
                    success: true, 
                    token, 
                    user: { id: user.id, email: user.email, name: user.name } 
                });
            }
        );
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطا در ورود' });
    }
});
        
        const token = generateToken(user._id, user.email);
        
        // Create login notification
        await createNotification(user._id, 'ورود موفق', 'شما با موفقیت وارد شدید', 'success');
        
        res.json({ 
            success: true, 
            message: 'ورود موفقیت‌آمیز بود',
            token, 
            user: { id: user._id, email: user.email, name: user.name } 
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطا در ورود' });
    }
});

// Get user profile
app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطا در دریافت پروفایل' });
    }
});

// Update user profile
app.put('/api/profile/update', authenticateToken, async (req, res) => {
    try {
        const cleanName = xss(req.body.name);
        const user = await User.findById(req.user.userId);
        user.name = cleanName;
        if (req.body.newPassword) {
            user.password = await bcrypt.hash(req.body.newPassword, 10);
        }
        await user.save();
        res.json({ success: true, user: { id: user._id, email: user.email, name: user.name } });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطا در بروزرسانی پروفایل' });
    }
});

// Products API
app.post('/api/products', async (req, res) => {
    try {
        const cleanName = xss(req.body.name);
        const cleanDescription = xss(req.body.description);
        const product = new Product({ ...req.body, name: cleanName, description: cleanDescription });
        await product.save();
        res.json({ success: true, product });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطا در ثبت محصول' });
    }
});

app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json({ success: true, products });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطا در دریافت محصولات' });
    }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        res.json({ success: true, product });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطا در دریافت محصول' });
    }
});

// Orders API
app.post('/api/orders', async (req, res) => {
    try {
        const cleanCustomerName = xss(req.body.customer_name);
        const cleanCustomerEmail = xss(req.body.customer_email);
        const order = new Order({
            customer: req.body.customer_id,
            products: req.body.cartItems,
            totalAmount: req.body.totalAmount,
            customer_name: cleanCustomerName,
            customer_email: cleanCustomerEmail
        });
        await order.save();
        res.json({ success: true, message: 'سفارش با موفقیت ثبت شد', order });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطا در ثبت سفارش' });
    }
});

app.get('/api/orders', async (req, res) => {
    try {
        const orders = await Order.find().populate('customer');
        res.json({ success: true, orders });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطا در دریافت سفارشات' });
    }
});

// Courses API
app.post('/api/courses', async (req, res) => {
    try {
        const cleanTitle = xss(req.body.title);
        const cleanDesc = xss(req.body.desc);
        const course = new Course({ ...req.body, title: cleanTitle, desc: cleanDesc });
        await course.save();
        res.json({ success: true, course });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطا در ثبت دوره' });
    }
});

app.get('/api/courses', async (req, res) => {
    try {
        const courses = await Course.find();
        res.json({ success: true, courses });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطا در دریافت دوره‌ها' });
    }
});

app.post('/api/courses/:id/enroll', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        course.students.push(req.body.userId);
        await course.save();
        res.json({ success: true, course });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطا در ثبت‌نام دوره' });
    }
});

// Messages API
app.post('/api/messages', async (req, res) => {
    try {
        const cleanText = xss(req.body.text);
        const message = new Message({ ...req.body, text: cleanText });
        await message.save();
        res.json({ success: true, message });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطا در ثبت پیام' });
    }
});

app.get('/api/messages', async (req, res) => {
    try {
        const messages = await Message.find().populate('sender');
        res.json({ success: true, messages });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطا در دریافت پیام‌ها' });
    }
});

// Videos API
app.post('/api/videos', async (req, res) => {
    try {
        const cleanTitle = xss(req.body.title);
        const video = new Video({ ...req.body, title: cleanTitle });
        await video.save();
        res.json({ success: true, video });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطا در ثبت ویدئو' });
    }
});

app.get('/api/videos', async (req, res) => {
    try {
        const videos = await Video.find();
        res.json({ success: true, videos });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطا در دریافت ویدئوها' });
    }
});

app.post('/api/videos/:id/like', async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        video.likes.push(req.body.userId);
        await video.save();
        res.json({ success: true, video });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطا در لایک ویدئو' });
    }
});

app.post('/api/videos/:id/comment', async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        const cleanText = xss(req.body.text);
        video.comments.push({ user: req.body.userId, text: cleanText });
        await video.save();
        res.json({ success: true, video });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطا در ثبت کامنت' });
    }
});

// File upload APIs
app.post('/api/upload/profile-image', authenticateToken, uploadImage, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        user.profilePic = `/uploads/${req.file.filename}`;
        await user.save();
        res.json({ success: true, profilePic: user.profilePic });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطا در آپلود تصویر' });
    }
});

app.post('/api/upload/product-image', uploadImage, async (req, res) => {
    try {
        res.json({ success: true, filename: req.file.filename });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطا در آپلود تصویر' });
    }
});

app.post('/api/upload/video', uploadVideo, async (req, res) => {
    try {
        res.json({ success: true, filename: req.file.filename });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطا در آپلود ویدئو' });
    }
});

// Admin APIs
app.get('/api/admin/stats', async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const productCount = await Product.countDocuments();
        const orderCount = await Order.countDocuments();
        const totalRevenue = await Order.aggregate([
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        
        res.json({
            success: true,
            stats: {
                userCount,
                productCount,
                orderCount,
                totalRevenue: totalRevenue[0]?.total || 0
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطا در دریافت آمار' });
    }
});

app.get('/api/admin/users', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json({ success: true, users });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطا در دریافت کاربران' });
    }
});

app.delete('/api/admin/users/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'کاربر حذف شد' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطا در حذف کاربر' });
    }
});

app.delete('/api/admin/products/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'محصول حذف شد' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطا در حذف محصول' });
    }
});

app.delete('/api/admin/courses/:id', async (req, res) => {
    try {
        await Course.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'دوره حذف شد' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطا در حذف دوره' });
    }
});

app.delete('/api/admin/videos/:id', async (req, res) => {
    try {
        await Video.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'ویدئو حذف شد' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطا در حذف ویدئو' });
    }
});

// Notifications API
app.get('/api/notifications', authenticateToken, async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user.userId }).sort({ createdAt: -1 });
        res.json({ success: true, notifications });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطا در دریافت اعلان‌ها' });
    }
});

app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { read: true });
        res.json({ success: true, message: 'اعلان خوانده شد' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطا در بروزرسانی اعلان' });
    }
});

app.delete('/api/notifications/:id', authenticateToken, async (req, res) => {
    try {
        await Notification.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'اعلان حذف شد' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطا در حذف اعلان' });
    }
});

// Chat API endpoints
app.get('/api/chat/messages', authenticateToken, async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { sender: req.user.userId },
                { sender: { $exists: false } }
            ]
        }).sort({ createdAt: 1 }).limit(50);
        
        res.json({ success: true, messages });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطا در دریافت پیام‌ها' });
    }
});

app.post('/api/chat/messages', authenticateToken, async (req, res) => {
    try {
        const message = new Message({
            sender: req.user.userId,
            text: req.body.text
        });
        await message.save();
        
        res.json({ success: true, message: 'پیام ارسال شد' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطا در ارسال پیام' });
    }
});

// Helper function to create notifications
async function createNotification(userId, title, message, type = 'info') {
    try {
        const notification = new Notification({
            user: userId,
            title,
            message,
            type
        });
        await notification.save();
    } catch (err) {
        console.error('Error creating notification:', err);
    }
}

// Socket.io for real-time chat
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    // Store user info
    socket.userId = socket.id;
    socket.username = `کاربر ${socket.id.slice(-4)}`;
    socket.authenticated = false;
    socket.user = null;
    
    // Handle authentication
    socket.on('user info', async (data) => {
        try {
            // Verify token and get user info
            const token = socket.handshake.auth.token;
            if (token) {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
                const user = await User.findById(decoded.userId);
                if (user) {
                    socket.authenticated = true;
                    socket.user = user;
                    socket.username = user.name || user.email;
                    console.log(`User authenticated: ${socket.username}`);
                }
            }
        } catch (err) {
            console.log('Authentication failed:', err.message);
            socket.emit('authentication required');
        }
    });
    
    // Load messages from database
    socket.on('load messages', async (data) => {
        try {
            if (socket.authenticated && socket.user) {
                // Load user's messages
                const messages = await Message.find({
                    $or: [
                        { sender: socket.user._id },
                        { sender: { $exists: false } } // System messages
                    ]
                }).sort({ createdAt: 1 }).limit(50);
                
                socket.emit('messages loaded', messages.map(msg => ({
                    text: msg.text,
                    sender: msg.sender ? 'user' : 'bot',
                    createdAt: msg.createdAt
                })));
            } else {
                // Load public messages for anonymous users
                const messages = await Message.find({
                    sender: { $exists: false }
                }).sort({ createdAt: 1 }).limit(20);
                
                socket.emit('messages loaded', messages.map(msg => ({
                    text: msg.text,
                    sender: 'bot',
                    createdAt: msg.createdAt
                })));
            }
        } catch (err) {
            console.error('Error loading messages:', err);
        }
    });
    
    socket.on('chat message', async (data) => {
        try {
            let message;
            
            // Save message to database
            if (socket.authenticated && socket.user) {
                message = new Message({
                    sender: socket.user._id,
                    text: data.message
                });
                await message.save();
            } else {
                // Save as anonymous message
                message = new Message({
                    text: data.message
                });
                await message.save();
            }
            
            // Broadcast message to all clients
            io.emit('chat message', {
                message: data.message,
                sender: socket.authenticated ? 'user' : 'bot',
                username: socket.username,
                timestamp: data.timestamp || new Date().toISOString()
            });
            
            console.log(`Chat message from ${socket.username}:`, data.message);
            
            // Send auto-response for certain keywords
            setTimeout(() => {
                const autoResponse = getAutoResponse(data.message);
                if (autoResponse) {
                    const botMessage = new Message({
                        text: autoResponse
                    });
                    botMessage.save();
                    
                    io.emit('chat message', {
                        message: autoResponse,
                        sender: 'bot',
                        username: 'پشتیبانی',
                        timestamp: new Date().toISOString()
                    });
                }
            }, 1000 + Math.random() * 2000);
            
        } catch (err) {
            console.error('Error saving chat message:', err);
        }
    });
    
    socket.on('typing', () => {
        socket.broadcast.emit('typing');
    });
    
    socket.on('stop typing', () => {
        socket.broadcast.emit('stop typing');
    });
    
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        if (socket.username) {
            socket.broadcast.emit('user left', { username: socket.username });
        }
    });
});

// Auto-response function
function getAutoResponse(message) {
    const lowerMessage = message.toLowerCase();
    const responses = {
        'سلام': 'سلام! چطور می‌تونم کمکتون کنم؟',
        'خداحافظ': 'خداحافظ! امیدوارم بتونم کمکتون کرده باشم.',
        'قیمت': 'برای اطلاع از قیمت‌ها، لطفاً با شماره ۰۲۱-۱۲۳۴۵۶۷۸ تماس بگیرید.',
        'ساعت کاری': 'ساعت کاری ما: شنبه تا چهارشنبه ۹ صبح تا ۶ عصر',
        'ارسال': 'ارسال رایگان برای خریدهای بالای ۵۰۰ هزار تومان',
        'بازگشت': 'مهلت بازگشت کالا: ۷ روز پس از تحویل',
        'پشتیبانی': 'تیم پشتیبانی ما ۲۴/۷ آماده خدمت‌رسانی است.',
        'کمک': 'چطور می‌تونم کمکتون کنم؟'
    };
    
    for (const [keyword, response] of Object.entries(responses)) {
        if (lowerMessage.includes(keyword.toLowerCase())) {
            return response;
        }
    }
    
    return null;
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'خطای داخلی سرور' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'صفحه یافت نشد' });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 URL: http://localhost:${PORT}`);
}); 