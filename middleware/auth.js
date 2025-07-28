const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware برای احراز هویت
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ success: false, message: 'توکن احراز هویت یافت نشد' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'توکن نامعتبر است' });
        }
        req.user = user;
        next();
    });
}

// تابع برای تولید توکن
function generateToken(user) {
    return jwt.sign(
        { userId: user._id, email: user.email },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
}

module.exports = {
    authenticateToken,
    generateToken,
    JWT_SECRET
}; 