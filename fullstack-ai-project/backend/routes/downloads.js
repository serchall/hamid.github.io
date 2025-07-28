const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting for downloads
const downloadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 downloads per windowMs
  message: {
    error: 'Too many download requests. Please try again later.'
  }
});

// Simple session management (in production, use proper authentication)
const activeSessions = new Map();

// Middleware to check if user is authorized
const requireAuth = (req, res, next) => {
  const sessionId = req.headers['x-session-id'] || req.query.sessionId;
  
  if (!sessionId || !activeSessions.has(sessionId)) {
    return res.status(401).json({
      error: 'Unauthorized access. Please log in to download files.',
      code: 'UNAUTHORIZED'
    });
  }
  
  const session = activeSessions.get(sessionId);
  
  // Check if session is expired (24 hours)
  if (Date.now() - session.createdAt > 24 * 60 * 60 * 1000) {
    activeSessions.delete(sessionId);
    return res.status(401).json({
      error: 'Session expired. Please log in again.',
      code: 'SESSION_EXPIRED'
    });
  }
  
  req.user = session.user;
  next();
};

// Generate session ID for authorized users
const generateSession = (userId) => {
  const sessionId = uuidv4();
  activeSessions.set(sessionId, {
    userId,
    createdAt: Date.now(),
    user: { id: userId }
  });
  return sessionId;
};

// Clean up expired sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of activeSessions.entries()) {
    if (now - session.createdAt > 24 * 60 * 60 * 1000) {
      activeSessions.delete(sessionId);
    }
  }
}, 60 * 60 * 1000); // Clean up every hour

// Download file with proper headers and streaming
const downloadFile = async (req, res, filePath, filename) => {
  try {
    // Check if file exists
    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({
        error: 'File not found',
        code: 'FILE_NOT_FOUND'
      });
    }

    const stats = await fs.stat(filePath);
    const fileSize = stats.size;

    // Set proper headers
    res.setHeader('Content-Type', getContentType(filename));
    res.setHeader('Content-Length', fileSize);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');

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
      error: 'Failed to download file',
      code: 'DOWNLOAD_ERROR'
    });
  }
};

// Get content type based on file extension
const getContentType = (filename) => {
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
    '.wmv': 'video/x-ms-wmv',
    '.flv': 'video/x-flv',
    '.webm': 'video/webm',
    '.pdf': 'application/pdf',
    '.zip': 'application/zip',
    '.txt': 'text/plain'
  };
  return contentTypes[ext] || 'application/octet-stream';
};

// Download generated image
router.get('/image/:filename', downloadLimiter, requireAuth, async (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(process.env.UPLOAD_DIR || './uploads', 'images', filename);
  
  await downloadFile(req, res, filePath, filename);
});

// Download generated video
router.get('/video/:filename', downloadLimiter, requireAuth, async (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(process.env.UPLOAD_DIR || './uploads', 'videos', filename);
  
  await downloadFile(req, res, filePath, filename);
});

// Download AI-generated content (from URLs)
router.get('/ai-content/:type/:id', downloadLimiter, requireAuth, async (req, res) => {
  const { type, id } = req.params;
  
  try {
    // In a real application, you would store the file URLs in a database
    // For now, we'll simulate this with a simple mapping
    const fileUrl = req.query.url;
    
    if (!fileUrl) {
      return res.status(400).json({
        error: 'File URL is required',
        code: 'MISSING_URL'
      });
    }

    // Set headers for external file download
    res.setHeader('Content-Type', getContentType(fileUrl));
    res.setHeader('Content-Disposition', `attachment; filename="${type}-${id}.${getFileExtension(fileUrl)}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // For external URLs, redirect to the file (with proper headers)
    res.redirect(fileUrl);

  } catch (error) {
    console.error('AI content download error:', error);
    res.status(500).json({
      error: 'Failed to download AI-generated content',
      code: 'AI_DOWNLOAD_ERROR'
    });
  }
});

// Get file extension from URL
const getFileExtension = (url) => {
  const ext = path.extname(url).toLowerCase();
  return ext || '.jpg'; // Default to jpg if no extension
};

// Get download session (for frontend)
router.post('/session', (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({
      error: 'User ID is required',
      code: 'MISSING_USER_ID'
    });
  }

  const sessionId = generateSession(userId);
  
  res.json({
    success: true,
    sessionId,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  });
});

// Validate session
router.get('/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  if (!activeSessions.has(sessionId)) {
    return res.status(401).json({
      error: 'Invalid session',
      code: 'INVALID_SESSION'
    });
  }

  const session = activeSessions.get(sessionId);
  
  res.json({
    success: true,
    valid: true,
    userId: session.userId,
    expiresAt: new Date(session.createdAt + 24 * 60 * 60 * 1000).toISOString()
  });
});

// Get download statistics (for monitoring)
router.get('/stats', requireAuth, (req, res) => {
  res.json({
    activeSessions: activeSessions.size,
    totalDownloads: 0, // In production, track this in a database
    bandwidthUsed: 0   // In production, track this in a database
  });
});

module.exports = {
  router,
  generateSession,
  requireAuth
}; 