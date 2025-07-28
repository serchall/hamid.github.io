const sqlite3 = require('sqlite3').verbose();

// اتصال به دیتابیس
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('خطا در اتصال به دیتابیس:', err);
        return;
    }
    console.log('✅ متصل به دیتابیس SQLite');
    
    // به‌روزرسانی جدول products
    updateProductsTable();
});

function updateProductsTable() {
    // بررسی وجود ستون‌های جدید
    db.get("PRAGMA table_info(products)", (err, rows) => {
        if (err) {
            console.error('خطا در بررسی ساختار جدول:', err);
            return;
        }
        
        db.all("PRAGMA table_info(products)", (err, columns) => {
            if (err) {
                console.error('خطا در دریافت اطلاعات ستون‌ها:', err);
                return;
            }
            
            const columnNames = columns.map(col => col.name);
            console.log('ستون‌های موجود:', columnNames);
            
            // اضافه کردن ستون‌های جدید اگر وجود ندارند
            const updates = [];
            
            if (!columnNames.includes('type')) {
                updates.push('ADD COLUMN type TEXT DEFAULT "product"');
            }
            
            if (!columnNames.includes('stripeProductId')) {
                updates.push('ADD COLUMN stripeProductId TEXT');
            }
            
            if (!columnNames.includes('stripePriceId')) {
                updates.push('ADD COLUMN stripePriceId TEXT');
            }
            
            if (!columnNames.includes('isActive')) {
                updates.push('ADD COLUMN isActive INTEGER DEFAULT 1');
            }
            
            if (updates.length > 0) {
                const alterSQL = `ALTER TABLE products ${updates.join(', ')}`;
                console.log('اجرای دستور:', alterSQL);
                
                db.run(alterSQL, (err) => {
                    if (err) {
                        console.error('خطا در به‌روزرسانی جدول:', err);
                    } else {
                        console.log('✅ جدول products با موفقیت به‌روزرسانی شد');
                        
                        // اضافه کردن محصولات تستی
                        addTestProducts();
                    }
                });
            } else {
                console.log('✅ جدول products قبلاً به‌روزرسانی شده است');
                addTestProducts();
            }
        });
    });
}

function addTestProducts() {
    const testProducts = [
        {
            name: 'دوره آموزش React.js',
            description: 'دوره کامل آموزش React.js از مبتدی تا پیشرفته',
            price: 99.99,
            type: 'course',
            imageUrl: 'https://via.placeholder.com/300x200/667eea/ffffff?text=React+Course'
        },
        {
            name: 'دوره آموزش Node.js',
            description: 'آموزش کامل Node.js و Express.js',
            price: 79.99,
            type: 'course',
            imageUrl: 'https://via.placeholder.com/300x200/28a745/ffffff?text=Node.js+Course'
        },
        {
            name: 'کتاب الکترونیکی JavaScript',
            description: 'کتاب جامع JavaScript برای توسعه‌دهندگان',
            price: 29.99,
            type: 'product',
            imageUrl: 'https://via.placeholder.com/300x200/ffc107/000000?text=JS+Book'
        },
        {
            name: 'قالب وب‌سایت فروشگاهی',
            description: 'قالب کامل و واکنش‌گرا برای فروشگاه آنلاین',
            price: 49.99,
            type: 'product',
            imageUrl: 'https://via.placeholder.com/300x200/dc3545/ffffff?text=Template'
        },
        {
            name: 'دوره آموزش MongoDB',
            description: 'آموزش کامل پایگاه داده MongoDB',
            price: 89.99,
            type: 'course',
            imageUrl: 'https://via.placeholder.com/300x200/17a2b8/ffffff?text=MongoDB+Course'
        }
    ];

    // اضافه کردن محصولات جدید
    let completed = 0;
    testProducts.forEach((product, index) => {
        db.run(`
            INSERT INTO products (name, description, price, type, imageUrl, isActive) 
            VALUES (?, ?, ?, ?, ?, 1)
        `, [
            product.name,
            product.description,
            product.price,
            product.type,
            product.imageUrl
        ], function(err) {
            if (err) {
                console.error(`❌ خطا در اضافه کردن محصول ${index + 1}:`, err);
            } else {
                console.log(`✅ محصول ${index + 1} اضافه شد: ${product.name} - $${product.price}`);
            }
            
            completed++;
            if (completed === testProducts.length) {
                console.log('\n🎉 تمام محصولات تستی با موفقیت اضافه شدند!');
                console.log('\n📋 محصولات اضافه شده:');
                
                // نمایش محصولات اضافه شده
                db.all('SELECT * FROM products ORDER BY id DESC LIMIT 5', (err, rows) => {
                    if (err) {
                        console.error('خطا در نمایش محصولات:', err);
                    } else {
                        rows.forEach((row, index) => {
                            console.log(`${index + 1}. ${row.name} - $${row.price} (${row.type})`);
                        });
                    }
                    
                    console.log('\n🌐 برای تست سیستم پرداخت به آدرس زیر بروید:');
                    console.log('http://localhost:3000/test-payment-page.html?productId=1');
                    
                    db.close();
                });
            }
        });
    });
} 