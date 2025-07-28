// محافظت پیشرفته از هکرها
const crypto = require('crypto');

class HackerProtection {
    constructor() {
        this.failedAttempts = new Map(); // IP -> { count: number, lastAttempt: Date, blocked: boolean }
        this.suspiciousPatterns = [
            // SQL Injection patterns
            /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
            /(\b(or|and)\b\s+\d+\s*=\s*\d+)/i,
            /(\b(union|select|insert|update|delete|drop|create|alter)\b\s+.*\bfrom\b)/i,
            /(--|\/\*|\*\/)/,
            /(\bxp_cmdshell\b|\bsp_executesql\b)/i,
            
            // XSS patterns
            /<script[^>]*>.*?<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /data:text\/html/gi,
            /vbscript:/gi,
            
            // Path traversal
            /\.\.\//,
            /\.\.\\/,
            /%2e%2e%2f/,
            /%2e%2e%5c/,
            
            // Command injection
            /(\b(cmd|command|exec|system|eval|function)\b)/i,
            /(\$\(.*\))/,
            /(\`.*\`)/,
            
            // File inclusion
            /(include|require|include_once|require_once)\s*\(/i,
            /(file_get_contents|file_put_contents|fopen|fwrite)\s*\(/i,
            
            // LDAP injection
            /(\b(ldap|ldapsearch|ldapmodify)\b)/i,
            /(\*\)|\(\|)/,
            
            // NoSQL injection
            /(\$where|\$ne|\$gt|\$lt|\$regex)/i,
            
            // Template injection
            /(\{\{.*\}\}|\{%.*%\})/,
            
            // Header injection
            /(\r\n|\n\r|\r|\n)/,
            
            // Directory traversal
            /(\/etc\/|\/var\/|\/tmp\/|\/home\/)/i,
            
            // Shell commands
            /(\b(cat|ls|dir|pwd|whoami|id|uname|ps|netstat)\b)/i,
            
            // Network scanning
            /(\b(nmap|ping|traceroute|telnet|ssh|ftp)\b)/i,
            
            // Malicious file extensions
            /\.(php|asp|aspx|jsp|exe|bat|cmd|sh|pl|py|rb)$/i
        ];
        
        this.blockedIPs = new Set();
        this.suspiciousIPs = new Map();
        
        // Cleanup intervals
        setInterval(() => this.cleanupFailedAttempts(), 15 * 60 * 1000); // 15 minutes
        setInterval(() => this.cleanupBlockedIPs(), 60 * 60 * 1000); // 1 hour
    }
    
    // بررسی ورودی مشکوک
    checkSuspiciousInput(input) {
        if (typeof input !== 'string') return false;
        
        return this.suspiciousPatterns.some(pattern => pattern.test(input));
    }
    
    // بررسی User Agent مشکوک
    checkSuspiciousUserAgent(userAgent) {
        if (!userAgent) return false;
        
        const suspiciousUAs = [
            /sqlmap/i,
            /nikto/i,
            /nmap/i,
            /scanner/i,
            /bot/i,
            /crawler/i,
            /spider/i,
            /wget/i,
            /curl/i,
            /python/i,
            /perl/i,
            /ruby/i,
            /java/i,
            /go-http-client/i,
            /masscan/i,
            /dirb/i,
            /gobuster/i,
            /wfuzz/i,
            /burp/i,
            /zap/i
        ];
        
        return suspiciousUAs.some(pattern => pattern.test(userAgent));
    }
    
    // ثبت تلاش ناموفق
    recordFailedAttempt(ip) {
        const now = new Date();
        const attempts = this.failedAttempts.get(ip) || { count: 0, lastAttempt: now, blocked: false };
        
        attempts.count++;
        attempts.lastAttempt = now;
        
        // مسدود کردن بعد از 10 تلاش ناموفق
        if (attempts.count >= 10) {
            attempts.blocked = true;
            this.blockedIPs.add(ip);
            console.log(`🚨 IP ${ip} blocked due to multiple failed attempts`);
        }
        
        this.failedAttempts.set(ip, attempts);
    }
    
    // بررسی IP مسدود شده
    isIPBlocked(ip) {
        return this.blockedIPs.has(ip);
    }
    
    // بررسی IP مشکوک
    isIPSuspicious(ip) {
        const attempts = this.failedAttempts.get(ip);
        return attempts && attempts.count >= 5;
    }
    
    // تولید CSRF Token
    generateCSRFToken() {
        return crypto.randomBytes(32).toString('hex');
    }
    
    // بررسی CSRF Token
    validateCSRFToken(token, sessionToken) {
        if (!token || !sessionToken) return false;
        return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(sessionToken));
    }
    
    // تولید Captcha
    generateCaptcha() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let captcha = '';
        for (let i = 0; i < 6; i++) {
            captcha += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return captcha;
    }
    
    // بررسی Captcha
    validateCaptcha(userInput, correctCaptcha) {
        return userInput && correctCaptcha && userInput.toUpperCase() === correctCaptcha.toUpperCase();
    }
    
    // لاگ کردن فعالیت مشکوک
    logSuspiciousActivity(ip, userAgent, path, method, body) {
        const log = {
            timestamp: new Date().toISOString(),
            ip: ip,
            userAgent: userAgent,
            path: path,
            method: method,
            body: body ? JSON.stringify(body).substring(0, 200) : null,
            type: 'suspicious_activity'
        };
        
        console.log(`🚨 Suspicious activity detected:`, log);
        
        // در اینجا می‌توانید لاگ را در فایل یا دیتابیس ذخیره کنید
        this.saveSecurityLog(log);
    }
    
    // ذخیره لاگ امنیتی
    saveSecurityLog(log) {
        // اینجا می‌توانید لاگ را در فایل یا دیتابیس ذخیره کنید
        // برای مثال:
        // fs.appendFileSync('security.log', JSON.stringify(log) + '\n');
    }
    
    // Cleanup functions
    cleanupFailedAttempts() {
        const now = new Date();
        for (const [ip, attempts] of this.failedAttempts.entries()) {
            if (now - attempts.lastAttempt > 15 * 60 * 1000) { // 15 minutes
                this.failedAttempts.delete(ip);
            }
        }
    }
    
    cleanupBlockedIPs() {
        this.blockedIPs.clear();
        console.log('🧹 Blocked IPs cleared');
    }
    
    // بررسی امنیتی کامل
    performSecurityCheck(req) {
        const ip = req.ip || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'] || '';
        const path = req.path;
        const method = req.method;
        const body = req.body;
        
        // بررسی IP مسدود شده
        if (this.isIPBlocked(ip)) {
            return { allowed: false, reason: 'IP_BLOCKED' };
        }
        
        // بررسی User Agent مشکوک
        if (this.checkSuspiciousUserAgent(userAgent)) {
            this.blockedIPs.add(ip);
            this.logSuspiciousActivity(ip, userAgent, path, method, body);
            return { allowed: false, reason: 'SUSPICIOUS_USER_AGENT' };
        }
        
        // بررسی ورودی مشکوک
        if (body) {
            const bodyStr = JSON.stringify(body);
            if (this.checkSuspiciousInput(bodyStr)) {
                this.recordFailedAttempt(ip);
                this.logSuspiciousActivity(ip, userAgent, path, method, body);
                return { allowed: false, reason: 'SUSPICIOUS_INPUT' };
            }
        }
        
        // بررسی query parameters
        if (req.query) {
            const queryStr = JSON.stringify(req.query);
            if (this.checkSuspiciousInput(queryStr)) {
                this.recordFailedAttempt(ip);
                this.logSuspiciousActivity(ip, userAgent, path, method, body);
                return { allowed: false, reason: 'SUSPICIOUS_QUERY' };
            }
        }
        
        return { allowed: true };
    }
}

module.exports = HackerProtection; 