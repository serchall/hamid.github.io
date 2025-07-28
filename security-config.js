// تنظیمات امنیتی
module.exports = {
    // JWT
    JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    JWT_EXPIRES_IN: '7d',
    
    // Rate Limiting
    RATE_LIMIT: {
        windowMs: 15 * 60 * 1000, // 15 دقیقه
        max: 100, // حداکثر 100 درخواست
        message: 'تعداد درخواست‌ها بیش از حد مجاز است'
    },
    LOGIN_RATE_LIMIT: {
        windowMs: 15 * 60 * 1000, // 15 دقیقه
        max: 5, // حداکثر 5 تلاش ورود
        message: 'تعداد تلاش‌های ورود بیش از حد مجاز است'
    },
    
    // CORS
    CORS_OPTIONS: {
        origin: process.env.NODE_ENV === 'production' 
            ? ['https://yourdomain.com'] 
            : ['http://localhost:3000'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
    },
    
    // Content Security Policy
    CSP_DIRECTIVES: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "ws:", "wss:"],
        fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
    },
    
    // File Upload
    UPLOAD_LIMITS: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 1
    },
    
    // Password Policy
    PASSWORD_POLICY: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true
    },
    
    // Session
    SESSION: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 روز
    }
}; 