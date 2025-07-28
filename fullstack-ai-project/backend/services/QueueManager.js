const Queue = require('bull');
const Redis = require('ioredis');

class QueueManager {
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    
    // Create queues for different AI providers
    this.queues = {
      openai: new Queue('openai-requests', {
        redis: process.env.REDIS_URL || 'redis://localhost:6379',
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000
          },
          removeOnComplete: 100,
          removeOnFail: 50
        }
      }),
      claude: new Queue('claude-requests', {
        redis: process.env.REDIS_URL || 'redis://localhost:6379',
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000
          },
          removeOnComplete: 100,
          removeOnFail: 50
        }
      }),
      gemini: new Queue('gemini-requests', {
        redis: process.env.REDIS_URL || 'redis://localhost:6379',
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000
          },
          removeOnComplete: 100,
          removeOnFail: 50
        }
      }),
      huggingface: new Queue('huggingface-requests', {
        redis: process.env.REDIS_URL || 'redis://localhost:6379',
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000
          },
          removeOnComplete: 100,
          removeOnFail: 50
        }
      })
    };

    // Rate limiting configuration
    this.rateLimits = {
      openai: { max: 60, window: 60000 }, // 60 requests per minute
      claude: { max: 50, window: 60000 }, // 50 requests per minute
      gemini: { max: 100, window: 60000 }, // 100 requests per minute
      huggingface: { max: 30, window: 60000 } // 30 requests per minute
    };

    this.setupQueueProcessors();
    this.setupMonitoring();
  }

  // Add job to queue with priority
  async addJob(provider, jobData, priority = 'normal') {
    const queue = this.queues[provider];
    if (!queue) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    const priorityMap = {
      high: 1,
      normal: 5,
      low: 10
    };

    const job = await queue.add(jobData.type || 'chat', jobData, {
      priority: priorityMap[priority] || 5,
      delay: jobData.delay || 0,
      jobId: `${provider}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    });

    console.log(`Job added to ${provider} queue:`, job.id);
    return job;
  }

  // Setup queue processors
  setupQueueProcessors() {
    Object.keys(this.queues).forEach(provider => {
      const queue = this.queues[provider];
      
      queue.process(async (job) => {
        console.log(`Processing ${provider} job:`, job.id);
        
        try {
          // Check rate limits
          await this.checkRateLimit(provider, job.data.userId);
          
          // Process the job based on type
          const result = await this.processJob(provider, job.data);
          
          // Update job progress
          await job.progress(100);
          
          return result;
        } catch (error) {
          console.error(`Error processing ${provider} job:`, error);
          throw error;
        }
      });

      // Handle failed jobs
      queue.on('failed', (job, err) => {
        console.error(`Job ${job.id} failed:`, err.message);
      });

      // Handle completed jobs
      queue.on('completed', (job, result) => {
        console.log(`Job ${job.id} completed successfully`);
      });
    });
  }

  // Process different job types
  async processJob(provider, jobData) {
    const { type, message, model, settings, chatId } = jobData;
    
    switch (type) {
      case 'chat':
        return await this.processChatRequest(provider, message, model, settings, chatId);
      case 'image':
        return await this.processImageRequest(provider, jobData);
      case 'video':
        return await this.processVideoRequest(provider, jobData);
      default:
        throw new Error(`Unknown job type: ${type}`);
    }
  }

  // Process chat request
  async processChatRequest(provider, message, model, settings, chatId) {
    const aiServices = require('../ai-integrations');
    
    let response;
    switch (provider) {
      case 'openai':
        response = await aiServices.openai.chat(message, model, settings);
        break;
      case 'claude':
        response = await aiServices.claude.chat(message, model, settings);
        break;
      case 'gemini':
        response = await aiServices.gemini.chat(message, model, settings);
        break;
      case 'huggingface':
        response = await aiServices.huggingface.chat(message, model, settings);
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    return response;
  }

  // Process image request
  async processImageRequest(provider, jobData) {
    const aiServices = require('../ai-integrations');
    
    if (provider === 'openai') {
      return await aiServices.dalle.generateImage(jobData.prompt, jobData.settings);
    }
    
    throw new Error(`Image generation not supported for provider: ${provider}`);
  }

  // Process video request
  async processVideoRequest(provider, jobData) {
    const aiServices = require('../ai-integrations');
    
    return await aiServices.videoAI.generateVideo(jobData.prompt, jobData.settings);
  }

  // Check rate limits
  async checkRateLimit(provider, userId) {
    const key = `rate_limit:${provider}:${userId}`;
    const limit = this.rateLimits[provider];
    
    const current = await this.redis.incr(key);
    if (current === 1) {
      await this.redis.expire(key, limit.window / 1000);
    }
    
    if (current > limit.max) {
      throw new Error(`Rate limit exceeded for ${provider}`);
    }
  }

  // Setup monitoring
  setupMonitoring() {
    Object.keys(this.queues).forEach(provider => {
      const queue = this.queues[provider];
      
      queue.on('waiting', (jobId) => {
        console.log(`Job ${jobId} waiting in ${provider} queue`);
      });
      
      queue.on('active', (job) => {
        console.log(`Job ${job.id} started processing in ${provider} queue`);
      });
      
      queue.on('stalled', (jobId) => {
        console.log(`Job ${jobId} stalled in ${provider} queue`);
      });
    });
  }

  // Get queue statistics
  async getQueueStats() {
    const stats = {};
    
    for (const [provider, queue] of Object.entries(this.queues)) {
      const [waiting, active, completed, failed] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed()
      ]);
      
      stats[provider] = {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length
      };
    }
    
    return stats;
  }

  // Clean up completed jobs
  async cleanupJobs(provider, olderThan = 24 * 60 * 60 * 1000) { // 24 hours
    const queue = this.queues[provider];
    if (queue) {
      await queue.clean(olderThan, 'completed');
      await queue.clean(olderThan, 'failed');
    }
  }

  // Pause queue
  async pauseQueue(provider) {
    const queue = this.queues[provider];
    if (queue) {
      await queue.pause();
      console.log(`${provider} queue paused`);
    }
  }

  // Resume queue
  async resumeQueue(provider) {
    const queue = this.queues[provider];
    if (queue) {
      await queue.resume();
      console.log(`${provider} queue resumed`);
    }
  }

  // Close all queues
  async close() {
    await Promise.all(
      Object.values(this.queues).map(queue => queue.close())
    );
    await this.redis.quit();
  }
}

module.exports = new QueueManager(); 