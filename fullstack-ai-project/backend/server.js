const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-chat', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// AI Integrations
const OpenAI = require('openai');
const ClaudeIntegration = require('../ai-integrations/claude');
const GeminiIntegration = require('../ai-integrations/gemini');
const HuggingFaceIntegration = require('../ai-integrations/huggingface');
const DalleIntegration = require('../ai-integrations/dalle');
const VideoAIIntegration = require('../ai-integrations/video-ai');

// Upload middleware
const { uploadImage, uploadVideo, handleUploadError } = require('./middleware/upload');

// Download routes
const { router: downloadRouter } = require('./routes/downloads');

// Chat routes
const chatRouter = require('./routes/chat');

// Media routes
const mediaRouter = require('./routes/media');

// Initialize AI clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const claude = process.env.ANTHROPIC_API_KEY ? new ClaudeIntegration(process.env.ANTHROPIC_API_KEY) : null;
const gemini = process.env.GOOGLE_API_KEY ? new GeminiIntegration(process.env.GOOGLE_API_KEY) : null;
const huggingface = process.env.HUGGINGFACE_API_KEY ? new HuggingFaceIntegration(process.env.HUGGINGFACE_API_KEY) : null;
const dalle = process.env.OPENAI_API_KEY ? new DalleIntegration(process.env.OPENAI_API_KEY) : null;
const videoAI = new VideoAIIntegration();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'AI Chat API is running'
  });
});

// Main chat endpoint with OpenAI GPT-4
app.post('/api/chat', async (req, res) => {
  try {
    const { message, model = 'gpt-4' } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Message is required and must be a string'
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: 'OpenAI API key not configured'
      });
    }

    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant. Provide clear, accurate, and helpful responses."
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0].message.content;

    res.json({
      success: true,
      response: aiResponse,
      model: model,
      timestamp: new Date().toISOString(),
      usage: completion.usage
    });

  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    if (error.response?.status === 401) {
      return res.status(401).json({
        error: 'Invalid OpenAI API key'
      });
    }
    
    if (error.response?.status === 429) {
      return res.status(429).json({
        error: 'Rate limit exceeded for OpenAI API'
      });
    }

    res.status(500).json({
      error: 'Failed to get response from AI',
      details: error.message
    });
  }
});

// Claude chat endpoint
app.post('/api/claude', async (req, res) => {
  try {
    const { message, model = 'claude-3-opus-20240229' } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Message is required and must be a string'
      });
    }

    if (!claude) {
      return res.status(500).json({
        error: 'Claude API key not configured'
      });
    }

    const result = await claude.chat(message, model);

    res.json({
      success: true,
      response: result.response,
      model: result.model,
      timestamp: new Date().toISOString(),
      usage: result.usage
    });

  } catch (error) {
    console.error('Claude API Error:', error);
    res.status(500).json({
      error: 'Failed to get response from Claude',
      details: error.message
    });
  }
});

// Gemini chat endpoint
app.post('/api/gemini', async (req, res) => {
  try {
    const { message, model = 'gemini-pro' } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Message is required and must be a string'
      });
    }

    if (!gemini) {
      return res.status(500).json({
        error: 'Google API key not configured'
      });
    }

    const result = await gemini.chat(message, model);

    res.json({
      success: true,
      response: result.response,
      model: result.model,
      timestamp: new Date().toISOString(),
      usage: result.usage
    });

  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({
      error: 'Failed to get response from Gemini',
      details: error.message
    });
  }
});

// HuggingFace chat endpoint
app.post('/api/huggingface', async (req, res) => {
  try {
    const { message, model = 'microsoft/DialoGPT-medium' } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Message is required and must be a string'
      });
    }

    if (!huggingface) {
      return res.status(500).json({
        error: 'HuggingFace API key not configured'
      });
    }

    const result = await huggingface.chat(message, model);

    res.json({
      success: true,
      response: result.response,
      model: result.model,
      timestamp: new Date().toISOString(),
      usage: result.usage
    });

  } catch (error) {
    console.error('HuggingFace API Error:', error);
    res.status(500).json({
      error: 'Failed to get response from HuggingFace model',
      details: error.message
    });
  }
});

// ===== MEDIA ENDPOINTS =====

// DALL-E Image Generation
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, model = 'dall-e-3', size = '1024x1024', quality = 'standard' } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        error: 'Prompt is required and must be a string'
      });
    }

    if (!dalle) {
      return res.status(500).json({
        error: 'DALL-E API key not configured'
      });
    }

    const result = await dalle.generateImage(prompt, { model, size, quality });

    res.json({
      success: true,
      imageUrl: result.imageUrl,
      revisedPrompt: result.revisedPrompt,
      model: result.model,
      size: result.size,
      quality: result.quality,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('DALL-E Generation Error:', error);
    res.status(500).json({
      error: 'Failed to generate image',
      details: error.message
    });
  }
});

// DALL-E Image Edit
app.post('/api/edit-image', uploadImage, handleUploadError, async (req, res) => {
  try {
    const { prompt, size = '1024x1024' } = req.body;

    if (!req.file) {
      return res.status(400).json({
        error: 'Image file is required'
      });
    }

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        error: 'Prompt is required and must be a string'
      });
    }

    if (!dalle) {
      return res.status(500).json({
        error: 'DALL-E API key not configured'
      });
    }

    const result = await dalle.editImage(req.file.path, prompt, null, { size });

    res.json({
      success: true,
      imageUrl: result.imageUrl,
      model: result.model,
      size: result.size,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('DALL-E Edit Error:', error);
    res.status(500).json({
      error: 'Failed to edit image',
      details: error.message
    });
  }
});

// DALL-E Image Variation
app.post('/api/variation-image', uploadImage, handleUploadError, async (req, res) => {
  try {
    const { size = '1024x1024' } = req.body;

    if (!req.file) {
      return res.status(400).json({
        error: 'Image file is required'
      });
    }

    if (!dalle) {
      return res.status(500).json({
        error: 'DALL-E API key not configured'
      });
    }

    const result = await dalle.createVariation(req.file.path, { size });

    res.json({
      success: true,
      imageUrl: result.imageUrl,
      model: result.model,
      size: result.size,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('DALL-E Variation Error:', error);
    res.status(500).json({
      error: 'Failed to create image variation',
      details: error.message
    });
  }
});

// Video Generation
app.post('/api/generate-video', async (req, res) => {
  try {
    const { prompt, model = 'stability-ai/stable-video-diffusion', duration = 4, fps = 6 } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        error: 'Prompt is required and must be a string'
      });
    }

    const result = await videoAI.generateVideo(prompt, { model, duration, fps });

    res.json({
      success: true,
      videoUrl: result.videoUrl,
      model: result.model,
      duration: result.duration,
      fps: result.fps,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Video Generation Error:', error);
    res.status(500).json({
      error: 'Failed to generate video',
      details: error.message
    });
  }
});

// Video Edit
app.post('/api/edit-video', uploadVideo, handleUploadError, async (req, res) => {
  try {
    const { prompt, model = 'runwayml/stable-video-diffusion', strength = 0.8 } = req.body;

    if (!req.file) {
      return res.status(400).json({
        error: 'Video file is required'
      });
    }

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        error: 'Prompt is required and must be a string'
      });
    }

    const result = await videoAI.editVideo(req.file.path, prompt, { model, strength });

    res.json({
      success: true,
      videoUrl: result.videoUrl,
      model: result.model,
      strength: result.strength,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Video Edit Error:', error);
    res.status(500).json({
      error: 'Failed to edit video',
      details: error.message
    });
  }
});

// Video Processing
app.post('/api/process-video', uploadVideo, handleUploadError, async (req, res) => {
  try {
    const { resize, format = 'mp4', quality = 'medium', fps = 30 } = req.body;

    if (!req.file) {
      return res.status(400).json({
        error: 'Video file is required'
      });
    }

    const result = await videoAI.processVideo(req.file.path, { resize, format, quality, fps });

    res.json({
      success: true,
      processedVideoPath: result,
      format: format,
      quality: quality,
      fps: fps,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Video Processing Error:', error);
    res.status(500).json({
      error: 'Failed to process video',
      details: error.message
    });
  }
});

// Get available media models
app.get('/api/media-models', (req, res) => {
  const dalleModels = dalle ? dalle.getAvailableModels() : [];
  const videoModels = videoAI.getAvailableModels();

  res.json({
    imageModels: dalleModels,
    videoModels: videoModels
  });
});

// Download routes
app.use('/api/downloads', downloadRouter);

// Chat routes
app.use('/api/chat', chatRouter);

// Media routes
app.use('/api/media', mediaRouter);

// Get available models
app.get('/api/models', (req, res) => {
  const openaiModels = [
    {
      id: 'gpt-4',
      name: 'GPT-4',
      provider: 'OpenAI',
      description: 'Most capable GPT model for complex tasks',
      available: !!process.env.OPENAI_API_KEY
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      provider: 'OpenAI',
      description: 'Fast and efficient model for most tasks',
      available: !!process.env.OPENAI_API_KEY
    }
  ];

  const claudeModels = claude ? claude.getAvailableModels().map(model => ({
    ...model,
    available: true
  })) : [];

  const geminiModels = gemini ? gemini.getAvailableModels().map(model => ({
    ...model,
    available: true
  })) : [];

  const huggingfaceModels = huggingface ? huggingface.getAvailableModels().map(model => ({
    ...model,
    available: true
  })) : [];

  res.json({
    models: [
      ...openaiModels,
      ...claudeModels,
      ...geminiModels,
      ...huggingfaceModels
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    availableRoutes: [
      'GET /api/health',
      'POST /api/chat',
      'GET /api/models'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`🚀 AI Chat API server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
}); 