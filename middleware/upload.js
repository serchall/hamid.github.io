const multer = require('multer');
const path = require('path');

// تنظیمات ذخیره فایل
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// فیلتر فایل‌ها
const fileFilter = (req, file, cb) => {
    // مجاز کردن تصاویر
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    // مجاز کردن ویدئوها
    else if (file.mimetype.startsWith('video/')) {
        cb(null, true);
    }
    else {
        cb(new Error('نوع فایل پشتیبانی نمی‌شود!'), false);
    }
};

// تنظیمات آپلود
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // حداکثر 10 مگابایت
    }
});

// آپلود تصویر
const uploadImage = upload.single('image');

// آپلود ویدئو
const uploadVideo = upload.single('video');

// آپلود چندین فایل
const uploadMultiple = upload.array('files', 5); // حداکثر 5 فایل

module.exports = {
    uploadImage,
    uploadVideo,
    uploadMultiple
}; 