const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const QueueManager = require('../services/QueueManager');
const { v4: uuidv4 } = require('uuid');

// Middleware to generate or validate session
const sessionMiddleware = (req, res, next) => {
  let sessionId = req.headers['x-session-id'] || req.query.sessionId;
  
  if (!sessionId) {
    sessionId = uuidv4();
    res.setHeader('X-Session-ID', sessionId);
  }
  
  req.sessionId = sessionId;
  req.userId = req.headers['x-user-id'] || 'anonymous';
  next();
};

// Get available AI providers and models
router.get('/providers', async (req, res) => {
  try {
    const providers = {
      openai: {
        name: 'OpenAI',
        description: 'Advanced language models by OpenAI',
        models: [
          { id: 'gpt-4', name: 'GPT-4', description: 'Most capable model', maxTokens: 8192 },
          { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Faster and more efficient', maxTokens: 128000 },
          { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and cost-effective', maxTokens: 4096 }
        ],
        features: ['chat', 'image-generation', 'code-generation'],
        pricing: { input: 0.03, output: 0.06 }
      },
      claude: {
        name: 'Claude',
        description: 'AI assistant by Anthropic',
        models: [
          { id: 'claude-3-opus', name: 'Claude 3 Opus', description: 'Most powerful model', maxTokens: 200000 },
          { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', description: 'Balanced performance', maxTokens: 200000 },
          { id: 'claude-3-haiku', name: 'Claude 3 Haiku', description: 'Fast and efficient', maxTokens: 200000 }
        ],
        features: ['chat', 'analysis', 'writing'],
        pricing: { input: 0.015, output: 0.075 }
      },
      gemini: {
        name: 'Google Gemini',
        description: 'Multimodal AI by Google',
        models: [
          { id: 'gemini-pro', name: 'Gemini Pro', description: 'Advanced reasoning', maxTokens: 32768 },
          { id: 'gemini-pro-vision', name: 'Gemini Pro Vision', description: 'Image and text understanding', maxTokens: 32768 }
        ],
        features: ['chat', 'multimodal', 'reasoning'],
        pricing: { input: 0.0005, output: 0.0015 }
      },
      huggingface: {
        name: 'Hugging Face',
        description: 'Open-source AI models',
        models: [
          { id: 'meta-llama/Llama-2-70b-chat-hf', name: 'Llama 2 70B', description: 'Open source large model', maxTokens: 4096 },
          { id: 'microsoft/DialoGPT-medium', name: 'DialoGPT', description: 'Conversational AI', maxTokens: 1024 },
          { id: 'gpt2', name: 'GPT-2', description: 'Text generation model', maxTokens: 1024 }
        ],
        features: ['chat', 'text-generation', 'custom-models'],
        pricing: { input: 0.0, output: 0.0 }
      }
    };

    res.json({
      success: true,
      providers,
      defaultProvider: 'openai',
      defaultModel: 'gpt-4'
    });
  } catch (error) {
    console.error('Error fetching providers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch AI providers'
    });
  }
});

// Send message to AI provider
router.post('/send', sessionMiddleware, async (req, res) => {
  try {
    const { message, provider = 'openai', model, settings = {}, chatId } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Create or get chat session
    let chat;
    if (chatId) {
      chat = await Chat.findById(chatId);
      if (!chat || chat.userId !== req.userId) {
        return res.status(404).json({
          success: false,
          error: 'Chat not found'
        });
      }
    } else {
      // Create new chat
      chat = new Chat({
        userId: req.userId,
        sessionId: req.sessionId,
        aiProvider: provider,
        model: model || 'gpt-4',
        title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        settings: {
          temperature: settings.temperature || 0.7,
          maxTokens: settings.maxTokens || 1000,
          systemPrompt: settings.systemPrompt || ''
        }
      });
      await chat.save();
    }

    // Add user message to chat
    await chat.addMessage({
      role: 'user',
      content: message,
      model: chat.model,
      timestamp: new Date()
    });

    // Add job to queue
    const jobData = {
      type: 'chat',
      message,
      model: chat.model,
      settings: chat.settings,
      chatId: chat._id,
      userId: req.userId,
      sessionId: req.sessionId
    };

    const job = await QueueManager.addJob(provider, jobData, 'normal');

    res.json({
      success: true,
      chatId: chat._id,
      jobId: job.id,
      message: 'Message queued for processing',
      status: 'queued'
    });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    });
  }
});

// Get chat history
router.get('/history', sessionMiddleware, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    
    const chats = await Chat.findByUser(req.userId, parseInt(limit));
    
    res.json({
      success: true,
      chats: chats.map(chat => ({
        id: chat._id,
        title: chat.title,
        aiProvider: chat.aiProvider,
        model: chat.model,
        messageCount: chat.messages.length,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        totalTokens: chat.totalTokens,
        totalCost: chat.totalCost
      })),
      total: chats.length
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chat history'
    });
  }
});

// Get specific chat with messages
router.get('/chat/:chatId', sessionMiddleware, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { limit = 50 } = req.query;
    
    const chat = await Chat.findById(chatId);
    
    if (!chat || chat.userId !== req.userId) {
      return res.status(404).json({
        success: false,
        error: 'Chat not found'
      });
    }

    // Get recent messages
    const messages = chat.messages.slice(-parseInt(limit));
    
    res.json({
      success: true,
      chat: {
        id: chat._id,
        title: chat.title,
        aiProvider: chat.aiProvider,
        model: chat.model,
        settings: chat.settings,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        totalTokens: chat.totalTokens,
        totalCost: chat.totalCost
      },
      messages,
      totalMessages: chat.messages.length
    });
  } catch (error) {
    console.error('Error fetching chat:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chat'
    });
  }
});

// Update chat title
router.put('/chat/:chatId/title', sessionMiddleware, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { title } = req.body;
    
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Title is required'
      });
    }

    const chat = await Chat.findOneAndUpdate(
      { _id: chatId, userId: req.userId },
      { title: title.trim() },
      { new: true }
    );

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Chat not found'
      });
    }

    res.json({
      success: true,
      chat: {
        id: chat._id,
        title: chat.title
      }
    });
  } catch (error) {
    console.error('Error updating chat title:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update chat title'
    });
  }
});

// Archive chat
router.put('/chat/:chatId/archive', sessionMiddleware, async (req, res) => {
  try {
    const { chatId } = req.params;
    
    const chat = await Chat.archiveChat(chatId, req.userId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Chat not found'
      });
    }

    res.json({
      success: true,
      message: 'Chat archived successfully'
    });
  } catch (error) {
    console.error('Error archiving chat:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to archive chat'
    });
  }
});

// Get job status
router.get('/job/:jobId', sessionMiddleware, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { provider } = req.query;
    
    if (!provider) {
      return res.status(400).json({
        success: false,
        error: 'Provider is required'
      });
    }

    const queue = QueueManager.queues[provider];
    if (!queue) {
      return res.status(400).json({
        success: false,
        error: 'Invalid provider'
      });
    }

    const job = await queue.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    const state = await job.getState();
    const progress = await job.progress();
    const result = job.returnvalue;
    const failedReason = job.failedReason;

    res.json({
      success: true,
      job: {
        id: job.id,
        state,
        progress,
        result,
        failedReason,
        data: job.data,
        timestamp: job.timestamp
      }
    });
  } catch (error) {
    console.error('Error fetching job status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job status'
    });
  }
});

// Get queue statistics
router.get('/queue/stats', async (req, res) => {
  try {
    const stats = await QueueManager.getQueueStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching queue stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch queue statistics'
    });
  }
});

// Clear chat history
router.delete('/history', sessionMiddleware, async (req, res) => {
  try {
    const result = await Chat.updateMany(
      { userId: req.userId },
      { status: 'deleted' }
    );

    res.json({
      success: true,
      message: `Deleted ${result.modifiedCount} chats`
    });
  } catch (error) {
    console.error('Error clearing chat history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear chat history'
    });
  }
});

module.exports = router; 