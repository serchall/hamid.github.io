const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = [
    process.env.UPLOAD_DIR || './uploads',
    `${process.env.UPLOAD_DIR || './uploads'}/images`,
    `${process.env.UPLOAD_DIR || './uploads'}/videos`,
    `${process.env.UPLOAD_DIR || './uploads'}/temp`
  ];
  
  dirs.forEach(dir => {
    fs.ensureDirSync(dir);
  });
};

createUploadDirs();

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = process.env.UPLOAD_DIR || './uploads';
    
    if (file.fieldname === 'image') {
      uploadPath = path.join(uploadPath, 'images');
    } else if (file.fieldname === 'video') {
      uploadPath = path.join(uploadPath, 'videos');
    } else {
      uploadPath = path.join(uploadPath, 'temp');
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = (process.env.ALLOWED_IMAGE_TYPES || 'jpg,jpeg,png,webp,gif').split(',');
  const allowedVideoTypes = (process.env.ALLOWED_VIDEO_TYPES || 'mp4,avi,mov,wmv,flv,webm').split(',');
  
  const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
  
  if (file.fieldname === 'image') {
    if (allowedImageTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid image type. Allowed types: ${allowedImageTypes.join(', ')}`), false);
    }
  } else if (file.fieldname === 'video') {
    if (allowedVideoTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid video type. Allowed types: ${allowedVideoTypes.join(', ')}`), false);
    }
  } else {
    cb(new Error('Invalid field name'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600'), // 100MB default
    files: 1
  }
});

// Specific upload middlewares
const uploadImage = upload.single('image');
const uploadVideo = upload.single('video');

// Error handling middleware
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        maxSize: process.env.MAX_FILE_SIZE || '100MB'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files'
      });
    }
  }
  
  if (err.message.includes('Invalid')) {
    return res.status(400).json({
      error: err.message
    });
  }
  
  next(err);
};

module.exports = {
  uploadImage,
  uploadVideo,
  handleUploadError
}; 