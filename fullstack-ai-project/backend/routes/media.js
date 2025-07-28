const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting for media processing
const mediaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 media processing requests per windowMs
  message: {
    error: 'Too many media processing requests. Please try again later.'
  }
});

// Security middleware
const securityMiddleware = (req, res, next) => {
  const securityLevel = req.body.securityLevel || 'standard';
  
  // Set security headers based on level
  switch (securityLevel) {
    case 'enhanced':
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      break;
    case 'enterprise':
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      res.setHeader('Content-Security-Policy', "default-src 'self'");
      break;
    default:
      res.setHeader('X-Content-Type-Options', 'nosniff');
      break;
  }
  
  next();
};

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.env.UPLOAD_DIR || './uploads', 'temp');
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
  const allowedVideoTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm'];
  const allowedTextTypes = ['text/plain', 'text/html', 'text/css', 'text/javascript', 'application/json'];
  
  const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes, ...allowedTextTypes];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('فرمت فایل پشتیبانی نمی‌شود'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

// Image editing endpoint
router.post('/edit-image', mediaLimiter, securityMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'فایل تصویر مورد نیاز است' });
    }

    const settings = JSON.parse(req.body.settings || '{}');
    const securityLevel = req.body.securityLevel || 'standard';
    
    // Validate file type
    if (!req.file.mimetype.startsWith('image/')) {
      await fs.remove(req.file.path);
      return res.status(400).json({ error: 'فایل باید تصویر باشد' });
    }

    // Create output directory
    const outputDir = path.join(process.env.UPLOAD_DIR || './uploads', 'edited', 'images');
    await fs.ensureDir(outputDir);

    // Generate output filename
    const outputFilename = `edited-${uuidv4()}-${Date.now()}.jpg`;
    const outputPath = path.join(outputDir, outputFilename);

    // Process image with Sharp
    let imageProcessor = sharp(req.file.path);

    // Apply brightness and contrast
    if (settings.brightness !== 100 || settings.contrast !== 100) {
      const brightness = (settings.brightness - 100) / 100;
      const contrast = settings.contrast / 100;
      imageProcessor = imageProcessor.modulate({
        brightness: 1 + brightness,
        contrast: contrast
      });
    }

    // Apply saturation
    if (settings.saturation !== 100) {
      const saturation = settings.saturation / 100;
      imageProcessor = imageProcessor.modulate({
        saturation: saturation
      });
    }

    // Apply blur
    if (settings.blur > 0) {
      imageProcessor = imageProcessor.blur(settings.blur);
    }

    // Apply sharpen
    if (settings.sharpen > 0) {
      imageProcessor = imageProcessor.sharpen({
        sigma: settings.sharpen / 20,
        flat: 1,
        jagged: 2
      });
    }

    // Apply gamma correction
    if (settings.gamma !== 1) {
      imageProcessor = imageProcessor.gamma(settings.gamma);
    }

    // Apply color adjustments
    if (settings.temperature !== 0 || settings.tint !== 0) {
      imageProcessor = imageProcessor.modulate({
        hue: settings.tint,
        saturation: 1 + (settings.temperature / 100)
      });
    }

    // Apply exposure
    if (settings.exposure !== 0) {
      imageProcessor = imageProcessor.modulate({
        brightness: 1 + (settings.exposure / 100)
      });
    }

    // Apply highlights and shadows
    if (settings.highlights !== 0 || settings.shadows !== 0) {
      imageProcessor = imageProcessor.modulate({
        brightness: 1 + (settings.shadows / 100),
        contrast: 1 + (settings.highlights / 100)
      });
    }

    // Apply clarity and vibrance
    if (settings.clarity !== 0) {
      imageProcessor = imageProcessor.sharpen({
        sigma: Math.abs(settings.clarity) / 20,
        flat: 1,
        jagged: 2
      });
    }

    if (settings.vibrance !== 0) {
      imageProcessor = imageProcessor.modulate({
        saturation: 1 + (settings.vibrance / 100)
      });
    }

    // Save processed image
    await imageProcessor
      .jpeg({ quality: 90, progressive: true })
      .toFile(outputPath);

    // Clean up original file
    await fs.remove(req.file.path);

    // Generate secure download URL
    const downloadUrl = `/api/media/download/${path.basename(outputPath)}?type=image&security=${securityLevel}`;

    res.json({
      success: true,
      message: 'تصویر با موفقیت ویرایش شد',
      editedFileUrl: downloadUrl,
      filename: outputFilename,
      fileSize: await fs.stat(outputPath).then(stats => stats.size),
      securityLevel: securityLevel
    });

  } catch (error) {
    console.error('Image editing error:', error);
    
    // Clean up files on error
    if (req.file) {
      await fs.remove(req.file.path).catch(() => {});
    }
    
    res.status(500).json({
      error: 'خطا در پردازش تصویر',
      details: error.message
    });
  }
});

// Video editing endpoint
router.post('/edit-video', mediaLimiter, securityMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'فایل ویدیو مورد نیاز است' });
    }

    const settings = JSON.parse(req.body.settings || '{}');
    const securityLevel = req.body.securityLevel || 'standard';
    
    // Validate file type
    if (!req.file.mimetype.startsWith('video/')) {
      await fs.remove(req.file.path);
      return res.status(400).json({ error: 'فایل باید ویدیو باشد' });
    }

    // Create output directory
    const outputDir = path.join(process.env.UPLOAD_DIR || './uploads', 'edited', 'videos');
    await fs.ensureDir(outputDir);

    // Generate output filename
    const outputFilename = `edited-${uuidv4()}-${Date.now()}.mp4`;
    const outputPath = path.join(outputDir, outputFilename);

    // Get video information
    const videoInfo = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(req.file.path, (err, metadata) => {
        if (err) reject(err);
        else resolve(metadata);
      });
    });

    // Build FFmpeg command
    let command = ffmpeg(req.file.path);

    // Apply video filters
    const filters = [];

    // Brightness and contrast
    if (settings.brightness !== 100 || settings.contrast !== 100) {
      const brightness = (settings.brightness - 100) / 100;
      const contrast = settings.contrast / 100;
      filters.push(`eq=brightness=${brightness}:contrast=${contrast}`);
    }

    // Saturation
    if (settings.saturation !== 100) {
      const saturation = settings.saturation / 100;
      filters.push(`eq=saturation=${saturation}`);
    }

    // Hue
    if (settings.hue !== 0) {
      filters.push(`hue=h=${settings.hue}`);
    }

    // Blur
    if (settings.blur > 0) {
      filters.push(`boxblur=${settings.blur}:${settings.blur}`);
    }

    // Sharpen
    if (settings.sharpen > 0) {
      filters.push(`unsharp=${settings.sharpen}:5:1:3:3`);
    }

    // Gamma
    if (settings.gamma !== 1) {
      filters.push(`eq=gamma=${settings.gamma}`);
    }

    // Temperature and tint
    if (settings.temperature !== 0 || settings.tint !== 0) {
      filters.push(`eq=gamma_r=${1 + settings.temperature/100}:gamma_g=${1 + settings.tint/100}`);
    }

    // Apply filters if any
    if (filters.length > 0) {
      command = command.videoFilters(filters);
    }

    // Set output options
    command = command
      .outputOptions([
        `-c:v libx264`,
        `-preset ${settings.bitrate === 'high' ? 'slow' : settings.bitrate === 'low' ? 'ultrafast' : 'medium'}`,
        `-crf ${settings.bitrate === 'high' ? '18' : settings.bitrate === 'low' ? '28' : '23'}`,
        `-r ${settings.fps || 30}`,
        `-c:a aac`,
        `-b:a 128k`
      ]);

    // Set resolution
    if (settings.resolution) {
      const resolutions = {
        '720p': '1280:720',
        '1080p': '1920:1080',
        '4k': '3840:2160'
      };
      if (resolutions[settings.resolution]) {
        command = command.size(resolutions[settings.resolution]);
      }
    }

    // Process video
    await new Promise((resolve, reject) => {
      command
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .on('progress', (progress) => {
          console.log(`Video processing: ${progress.percent}% done`);
        })
        .run();
    });

    // Clean up original file
    await fs.remove(req.file.path);

    // Generate secure download URL
    const downloadUrl = `/api/media/download/${path.basename(outputPath)}?type=video&security=${securityLevel}`;

    res.json({
      success: true,
      message: 'ویدیو با موفقیت ویرایش شد',
      editedFileUrl: downloadUrl,
      filename: outputFilename,
      fileSize: await fs.stat(outputPath).then(stats => stats.size),
      duration: videoInfo.format.duration,
      securityLevel: securityLevel
    });

  } catch (error) {
    console.error('Video editing error:', error);
    
    // Clean up files on error
    if (req.file) {
      await fs.remove(req.file.path).catch(() => {});
    }
    
    res.status(500).json({
      error: 'خطا در پردازش ویدیو',
      details: error.message
    });
  }
});

// Text editing endpoint
router.post('/edit-text', mediaLimiter, securityMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'فایل متن مورد نیاز است' });
    }

    const settings = JSON.parse(req.body.settings || '{}');
    const securityLevel = req.body.securityLevel || 'standard';
    
    // Validate file type
    if (!req.file.mimetype.startsWith('text/') && req.file.mimetype !== 'application/json') {
      await fs.remove(req.file.path);
      return res.status(400).json({ error: 'فایل باید متن باشد' });
    }

    // Read original file
    const originalContent = await fs.readFile(req.file.path, 'utf8');

    // Create output directory
    const outputDir = path.join(process.env.UPLOAD_DIR || './uploads', 'edited', 'texts');
    await fs.ensureDir(outputDir);

    // Generate output filename
    const outputFilename = `edited-${uuidv4()}-${Date.now()}.txt`;
    const outputPath = path.join(outputDir, outputFilename);

    // Process text content
    let processedContent = settings.content || originalContent;

    // Apply text formatting
    if (settings.fontSize || settings.fontFamily || settings.color) {
      // Create HTML version with styling
      const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>متن ویرایش شده</title>
    <style>
        body {
            font-family: ${settings.fontFamily || 'Arial'};
            font-size: ${settings.fontSize || 16}px;
            color: ${settings.color || '#000000'};
            text-align: ${settings.textAlign || 'right'};
            line-height: ${settings.lineHeight || 1.5};
            letter-spacing: ${settings.letterSpacing || 0}px;
            opacity: ${settings.opacity || 1};
            background-color: ${settings.backgroundColor || 'transparent'};
            padding: ${settings.padding || 0}px;
            margin: ${settings.margin || 0}px;
            border: ${settings.border || 'none'};
            border-radius: ${settings.borderRadius || 0}px;
            text-shadow: ${settings.textShadow || 'none'};
        }
    </style>
</head>
<body>
    ${processedContent.replace(/\n/g, '<br>')}
</body>
</html>`;
      
      await fs.writeFile(outputPath, htmlContent, 'utf8');
    } else {
      // Save as plain text
      await fs.writeFile(outputPath, processedContent, 'utf8');
    }

    // Clean up original file
    await fs.remove(req.file.path);

    // Generate secure download URL
    const downloadUrl = `/api/media/download/${path.basename(outputPath)}?type=text&security=${securityLevel}`;

    res.json({
      success: true,
      message: 'متن با موفقیت ویرایش شد',
      editedFileUrl: downloadUrl,
      filename: outputFilename,
      fileSize: await fs.stat(outputPath).then(stats => stats.size),
      securityLevel: securityLevel
    });

  } catch (error) {
    console.error('Text editing error:', error);
    
    // Clean up files on error
    if (req.file) {
      await fs.remove(req.file.path).catch(() => {});
    }
    
    res.status(500).json({
      error: 'خطا در پردازش متن',
      details: error.message
    });
  }
});

// Secure download endpoint
router.get('/download/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const { type, security } = req.query;
    
    // Validate filename
    if (!filename || filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({ error: 'نام فایل نامعتبر است' });
    }

    // Determine file path based on type
    let filePath;
    switch (type) {
      case 'image':
        filePath = path.join(process.env.UPLOAD_DIR || './uploads', 'edited', 'images', filename);
        break;
      case 'video':
        filePath = path.join(process.env.UPLOAD_DIR || './uploads', 'edited', 'videos', filename);
        break;
      case 'text':
        filePath = path.join(process.env.UPLOAD_DIR || './uploads', 'edited', 'texts', filename);
        break;
      default:
        return res.status(400).json({ error: 'نوع فایل نامعتبر است' });
    }

    // Check if file exists
    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ error: 'فایل یافت نشد' });
    }

    // Get file stats
    const stats = await fs.stat(filePath);
    const fileSize = stats.size;

    // Set security headers based on level
    switch (security) {
      case 'enhanced':
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        break;
      case 'enterprise':
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        res.setHeader('Content-Security-Policy', "default-src 'self'");
        break;
      default:
        res.setHeader('X-Content-Type-Options', 'nosniff');
        break;
    }

    // Set response headers
    const ext = path.extname(filename).toLowerCase();
    const contentTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      '.txt': 'text/plain',
      '.html': 'text/html',
      '.json': 'application/json'
    };

    res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
    res.setHeader('Content-Length', fileSize);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Handle range requests for resumable downloads
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;

      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Length', chunksize);

      const stream = fs.createReadStream(filePath, { start, end });
      stream.pipe(res);
    } else {
      // Full file download with streaming
      const stream = fs.createReadStream(filePath);
      
      // Add progress tracking
      let downloadedBytes = 0;
      stream.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        // Log progress for monitoring (optional)
        if (downloadedBytes % (1024 * 1024) === 0) { // Every MB
          console.log(`Download progress for ${filename}: ${(downloadedBytes / fileSize * 100).toFixed(1)}%`);
        }
      });

      stream.pipe(res);
    }

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      error: 'خطا در دانلود فایل',
      details: error.message
    });
  }
});

// Get media processing statistics
router.get('/stats', async (req, res) => {
  try {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const editedDir = path.join(uploadDir, 'edited');
    
    let totalFiles = 0;
    let totalSize = 0;
    
    if (await fs.pathExists(editedDir)) {
      const types = ['images', 'videos', 'texts'];
      
      for (const type of types) {
        const typeDir = path.join(editedDir, type);
        if (await fs.pathExists(typeDir)) {
          const files = await fs.readdir(typeDir);
          totalFiles += files.length;
          
          for (const file of files) {
            const filePath = path.join(typeDir, file);
            const stats = await fs.stat(filePath);
            totalSize += stats.size;
          }
        }
      }
    }

    res.json({
      success: true,
      stats: {
        totalFiles,
        totalSize: totalSize / (1024 * 1024), // Convert to MB
        totalSizeFormatted: `${(totalSize / (1024 * 1024)).toFixed(2)} MB`
      }
    });

  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      error: 'خطا در دریافت آمار',
      details: error.message
    });
  }
});

// Clean up old files (maintenance endpoint)
router.post('/cleanup', async (req, res) => {
  try {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const tempDir = path.join(uploadDir, 'temp');
    const editedDir = path.join(uploadDir, 'edited');
    
    let cleanedFiles = 0;
    let cleanedSize = 0;
    
    // Clean temp directory (files older than 24 hours)
    if (await fs.pathExists(tempDir)) {
      const files = await fs.readdir(tempDir);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          const fileSize = stats.size;
          await fs.remove(filePath);
          cleanedFiles++;
          cleanedSize += fileSize;
        }
      }
    }
    
    // Clean edited directory (files older than 7 days)
    if (await fs.pathExists(editedDir)) {
      const types = ['images', 'videos', 'texts'];
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      
      for (const type of types) {
        const typeDir = path.join(editedDir, type);
        if (await fs.pathExists(typeDir)) {
          const files = await fs.readdir(typeDir);
          
          for (const file of files) {
            const filePath = path.join(typeDir, file);
            const stats = await fs.stat(filePath);
            
            if (now - stats.mtime.getTime() > maxAge) {
              const fileSize = stats.size;
              await fs.remove(filePath);
              cleanedFiles++;
              cleanedSize += fileSize;
            }
          }
        }
      }
    }

    res.json({
      success: true,
      message: 'پاکسازی با موفقیت انجام شد',
      cleanedFiles,
      cleanedSize: cleanedSize / (1024 * 1024), // Convert to MB
      cleanedSizeFormatted: `${(cleanedSize / (1024 * 1024)).toFixed(2)} MB`
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      error: 'خطا در پاکسازی فایل‌ها',
      details: error.message
    });
  }
});

module.exports = router; 