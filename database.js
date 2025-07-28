const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// ایجاد اتصال به پایگاه داده
const dbPath = path.join(__dirname, 'orders.db');
const db = new sqlite3.Database(dbPath);

// ایجاد جدول سفارش‌ها
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name TEXT NOT NULL,
            customer_email TEXT NOT NULL,
            products TEXT NOT NULL,
            total_amount INTEGER NOT NULL,
            order_date DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
});

// ایجاد جدول کاربران
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
});

// تابع برای ذخیره سفارش جدید
function saveOrder(customerName, customerEmail, products, totalAmount) {
    return new Promise((resolve, reject) => {
        const productsJson = JSON.stringify(products);
        const stmt = db.prepare(`
            INSERT INTO orders (customer_name, customer_email, products, total_amount)
            VALUES (?, ?, ?, ?)
        `);
        
        stmt.run([customerName, customerEmail, productsJson, totalAmount], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.lastID);
            }
        });
        
        stmt.finalize();
    });
}

function registerUser(email, password) {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare(`INSERT INTO users (email, password) VALUES (?, ?)`);
        stmt.run([email, password], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.lastID);
            }
        });
        stmt.finalize();
    });
}

function findUserByEmail(email) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

// تابع برای دریافت تمام سفارش‌ها
function getAllOrders() {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM orders ORDER BY order_date DESC', (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// تابع برای دریافت سفارش بر اساس ایمیل
function getOrdersByEmail(email) {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM orders WHERE customer_email = ? ORDER BY order_date DESC', [email], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// بستن اتصال پایگاه داده
function closeDatabase() {
    db.close();
}

module.exports = {
    saveOrder,
    getAllOrders,
    getOrdersByEmail,
    closeDatabase,
    registerUser,
    findUserByEmail
}; 