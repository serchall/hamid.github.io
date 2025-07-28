const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  model: {
    type: String,
    required: true
  },
  tokens: {
    type: Number,
    default: 0
  },
  cost: {
    type: Number,
    default: 0
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

const chatSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    default: 'New Chat'
  },
  messages: [messageSchema],
  aiProvider: {
    type: String,
    enum: ['openai', 'claude', 'gemini', 'huggingface', 'custom'],
    required: true
  },
  model: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active'
  },
  totalTokens: {
    type: Number,
    default: 0
  },
  totalCost: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  settings: {
    temperature: {
      type: Number,
      default: 0.7,
      min: 0,
      max: 2
    },
    maxTokens: {
      type: Number,
      default: 1000,
      min: 1,
      max: 4000
    },
    systemPrompt: {
      type: String,
      default: ''
    }
  }
});

// Indexes for better performance
chatSchema.index({ userId: 1, createdAt: -1 });
chatSchema.index({ sessionId: 1, updatedAt: -1 });
chatSchema.index({ aiProvider: 1, model: 1 });

// Pre-save middleware to update timestamp
chatSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for message count
chatSchema.virtual('messageCount').get(function() {
  return this.messages.length;
});

// Method to add message
chatSchema.methods.addMessage = function(message) {
  this.messages.push(message);
  this.totalTokens += message.tokens || 0;
  this.totalCost += message.cost || 0;
  return this.save();
};

// Method to get recent messages
chatSchema.methods.getRecentMessages = function(limit = 10) {
  return this.messages.slice(-limit);
};

// Static method to find chats by user
chatSchema.statics.findByUser = function(userId, limit = 20) {
  return this.find({ userId, status: 'active' })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .select('title aiProvider model createdAt updatedAt messageCount');
};

// Static method to archive chat
chatSchema.statics.archiveChat = function(chatId, userId) {
  return this.findOneAndUpdate(
    { _id: chatId, userId },
    { status: 'archived' },
    { new: true }
  );
};

module.exports = mongoose.model('Chat', chatSchema); 