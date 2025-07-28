const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class GlobalAI {
  constructor() {
    this.providers = {
      // OpenAI Family
      openai: {
        name: 'OpenAI',
        baseURL: 'https://api.openai.com/v1',
        models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-4o', 'gpt-4o-mini'],
        features: ['chat', 'image-generation', 'code-generation', 'function-calling']
      },
      
      // Anthropic Family
      claude: {
        name: 'Anthropic Claude',
        baseURL: 'https://api.anthropic.com',
        models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku', 'claude-3.5-sonnet'],
        features: ['chat', 'analysis', 'writing', 'vision']
      },
      
      // Google Family
      gemini: {
        name: 'Google Gemini',
        baseURL: 'https://generativelanguage.googleapis.com',
        models: ['gemini-pro', 'gemini-pro-vision', 'gemini-1.5-pro', 'gemini-1.5-flash'],
        features: ['chat', 'multimodal', 'reasoning', 'code-generation']
      },
      
      // Microsoft Family
      azure: {
        name: 'Microsoft Azure OpenAI',
        baseURL: 'https://your-resource.openai.azure.com',
        models: ['gpt-4', 'gpt-35-turbo', 'gpt-4o'],
        features: ['chat', 'image-generation', 'code-generation']
      },
      
      // Meta Family
      meta: {
        name: 'Meta AI',
        baseURL: 'https://api.meta.ai',
        models: ['llama-3-8b', 'llama-3-70b', 'llama-3-405b', 'code-llama'],
        features: ['chat', 'code-generation', 'reasoning']
      },
      
      // Amazon Family
      bedrock: {
        name: 'Amazon Bedrock',
        baseURL: 'https://bedrock-runtime.us-east-1.amazonaws.com',
        models: ['anthropic.claude-3-sonnet', 'anthropic.claude-3-haiku', 'meta.llama-3-8b', 'amazon.titan-text'],
        features: ['chat', 'text-generation', 'embeddings']
      },
      
      // Cohere Family
      cohere: {
        name: 'Cohere',
        baseURL: 'https://api.cohere.ai',
        models: ['command', 'command-light', 'command-nightly', 'command-r'],
        features: ['chat', 'text-generation', 'embeddings', 'rerank']
      },
      
      // AI21 Family
      ai21: {
        name: 'AI21 Labs',
        baseURL: 'https://api.ai21.com',
        models: ['j2-ultra', 'j2-mid', 'j2-light', 'jamba-instruct'],
        features: ['chat', 'text-generation', 'summarization']
      },
      
      // Perplexity Family
      perplexity: {
        name: 'Perplexity AI',
        baseURL: 'https://api.perplexity.ai',
        models: ['llama-3.1-8b-instruct', 'llama-3.1-70b-instruct', 'mixtral-8x7b-instruct', 'codellama-70b-instruct'],
        features: ['chat', 'web-search', 'code-generation']
      },
      
      // Mistral Family
      mistral: {
        name: 'Mistral AI',
        baseURL: 'https://api.mistral.ai',
        models: ['mistral-large', 'mistral-medium', 'mistral-small', 'mistral-7b-instruct'],
        features: ['chat', 'text-generation', 'code-generation']
      },
      
      // Together AI Family
      together: {
        name: 'Together AI',
        baseURL: 'https://api.together.xyz',
        models: ['meta-llama/Llama-3.1-8B-Instruct', 'meta-llama/Llama-3.1-70B-Instruct', 'microsoft/DialoGPT-medium'],
        features: ['chat', 'text-generation', 'custom-models']
      },
      
      // Replicate Family
      replicate: {
        name: 'Replicate',
        baseURL: 'https://api.replicate.com',
        models: ['meta/llama-3.1-8b-instruct', 'meta/llama-3.1-70b-instruct', 'stability-ai/stable-diffusion'],
        features: ['chat', 'image-generation', 'video-generation', 'custom-models']
      },
      
      // HuggingFace Family
      huggingface: {
        name: 'Hugging Face',
        baseURL: 'https://api-inference.huggingface.co',
        models: ['meta-llama/Llama-2-70b-chat-hf', 'microsoft/DialoGPT-medium', 'gpt2'],
        features: ['chat', 'text-generation', 'custom-models', 'embeddings']
      },
      
      // DeepSeek Family
      deepseek: {
        name: 'DeepSeek',
        baseURL: 'https://api.deepseek.com',
        models: ['deepseek-chat', 'deepseek-coder', 'deepseek-llm-7b-chat'],
        features: ['chat', 'code-generation', 'reasoning']
      },
      
      // Zhipu Family (China)
      zhipu: {
        name: 'Zhipu AI (智谱AI)',
        baseURL: 'https://open.bigmodel.cn',
        models: ['glm-4', 'glm-3-turbo', 'cogview-3'],
        features: ['chat', 'image-generation', 'multimodal']
      },
      
      // Baichuan Family (China)
      baichuan: {
        name: 'Baichuan (百川)',
        baseURL: 'https://api.baichuan-ai.com',
        models: ['Baichuan2-Turbo', 'Baichuan2-Turbo-192k', 'Baichuan2-13B-Chat'],
        features: ['chat', 'text-generation', 'code-generation']
      },
      
      // Qwen Family (China)
      qwen: {
        name: 'Qwen (通义千问)',
        baseURL: 'https://dashscope.aliyuncs.com',
        models: ['qwen-turbo', 'qwen-plus', 'qwen-max', 'qwen-vl-plus'],
        features: ['chat', 'vision', 'multimodal', 'code-generation']
      },
      
      // SparkDesk Family (China)
      sparkdesk: {
        name: 'SparkDesk (讯飞星火)',
        baseURL: 'https://spark-api.xf-yun.com',
        models: ['spark-v3.0', 'spark-v2.0', 'spark-v1.5'],
        features: ['chat', 'multimodal', 'speech-synthesis']
      },
      
      // ERNIE Family (China)
      ernie: {
        name: 'ERNIE (文心一言)',
        baseURL: 'https://aip.baidubce.com',
        models: ['ernie-bot-4', 'ernie-bot-turbo', 'ernie-bot'],
        features: ['chat', 'image-generation', 'multimodal']
      },
      
      // MiniMax Family (China)
      minimax: {
        name: 'MiniMax',
        baseURL: 'https://api.minimax.chat',
        models: ['abab5.5-chat', 'abab5.5s-chat', 'abab6-chat'],
        features: ['chat', 'text-generation', 'embeddings']
      },
      
      // Moonshot Family (China)
      moonshot: {
        name: 'Moonshot AI',
        baseURL: 'https://api.moonshot.cn',
        models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
        features: ['chat', 'text-generation', 'code-generation']
      },
      
      // 01.AI Family (China)
      zeroone: {
        name: '01.AI (零一万物)',
        baseURL: 'https://api.lingyiwanwu.com',
        models: ['yi-34b-chat', 'yi-6b-chat', 'yi-vl-34b'],
        features: ['chat', 'vision', 'multimodal']
      },
      
      // Anthropic Claude (Japan)
      claude_jp: {
        name: 'Claude (Japan)',
        baseURL: 'https://api.anthropic.com',
        models: ['claude-3-sonnet', 'claude-3-haiku'],
        features: ['chat', 'analysis', 'writing']
      },
      
      // LINE Family (Japan)
      line: {
        name: 'LINE AI',
        baseURL: 'https://api.line.ai',
        models: ['line-ai-chat', 'line-ai-assistant'],
        features: ['chat', 'multimodal']
      },
      
      // Naver Family (Korea)
      naver: {
        name: 'Naver CLOVA',
        baseURL: 'https://api.clova.ai',
        models: ['clova-x', 'clova-code', 'clova-ix'],
        features: ['chat', 'code-generation', 'multimodal']
      },
      
      // Kakao Family (Korea)
      kakao: {
        name: 'Kakao KoGPT',
        baseURL: 'https://api.kakao.com',
        models: ['kogpt-2.0', 'kogpt-1.0'],
        features: ['chat', 'text-generation']
      },
      
      // Yandex Family (Russia)
      yandex: {
        name: 'Yandex GPT',
        baseURL: 'https://api.yandex.com',
        models: ['yandex-gpt', 'yandex-gpt-lite'],
        features: ['chat', 'text-generation']
      },
      
      // Sber Family (Russia)
      sber: {
        name: 'Sber AI',
        baseURL: 'https://api.sber.ai',
        models: ['giga-chat', 'giga-chat-pro'],
        features: ['chat', 'text-generation']
      },
      
      // DeepMind Family
      deepmind: {
        name: 'Google DeepMind',
        baseURL: 'https://api.deepmind.com',
        models: ['gemini-2.0', 'gemini-2.0-flash'],
        features: ['chat', 'reasoning', 'multimodal']
      },
      
      // xAI Family
      xai: {
        name: 'xAI Grok',
        baseURL: 'https://api.x.ai',
        models: ['grok-beta', 'grok-2'],
        features: ['chat', 'real-time-info', 'humor']
      },
      
      // Anthropic Claude (Europe)
      claude_eu: {
        name: 'Claude (Europe)',
        baseURL: 'https://api.anthropic.com',
        models: ['claude-3-sonnet', 'claude-3-haiku'],
        features: ['chat', 'analysis', 'writing']
      },
      
      // Aleph Alpha Family (Europe)
      alephalpha: {
        name: 'Aleph Alpha',
        baseURL: 'https://api.aleph-alpha.com',
        models: ['luminous-base', 'luminous-extended', 'luminous-supreme'],
        features: ['chat', 'text-generation', 'embeddings']
      },
      
      // Mistral AI (Europe)
      mistral_eu: {
        name: 'Mistral AI (Europe)',
        baseURL: 'https://api.mistral.ai',
        models: ['mistral-large', 'mistral-medium', 'mistral-small'],
        features: ['chat', 'text-generation', 'code-generation']
      },
      
      // Cohere (Europe)
      cohere_eu: {
        name: 'Cohere (Europe)',
        baseURL: 'https://api.cohere.ai',
        models: ['command', 'command-light', 'command-nightly'],
        features: ['chat', 'text-generation', 'embeddings']
      }
    };
  }

  // Get all available providers
  getProviders() {
    return this.providers;
  }

  // Get provider info
  getProvider(providerId) {
    return this.providers[providerId];
  }

  // Get all models for a provider
  getModels(providerId) {
    const provider = this.providers[providerId];
    return provider ? provider.models : [];
  }

  // Get provider features
  getFeatures(providerId) {
    const provider = this.providers[providerId];
    return provider ? provider.features : [];
  }

  // Check if provider supports feature
  supportsFeature(providerId, feature) {
    const features = this.getFeatures(providerId);
    return features.includes(feature);
  }

  // Get provider by region
  getProvidersByRegion(region) {
    const regionalProviders = {
      'global': ['openai', 'claude', 'gemini', 'azure', 'meta', 'bedrock', 'cohere', 'ai21', 'perplexity', 'mistral', 'together', 'replicate', 'huggingface', 'deepseek'],
      'china': ['zhipu', 'baichuan', 'qwen', 'sparkdesk', 'ernie', 'minimax', 'moonshot', 'zeroone'],
      'japan': ['claude_jp', 'line'],
      'korea': ['naver', 'kakao'],
      'russia': ['yandex', 'sber'],
      'europe': ['claude_eu', 'alephalpha', 'mistral_eu', 'cohere_eu'],
      'north-america': ['openai', 'claude', 'gemini', 'azure', 'meta', 'bedrock', 'cohere', 'ai21', 'perplexity', 'mistral', 'together', 'replicate', 'huggingface', 'deepseek', 'xai']
    };
    
    return regionalProviders[region] || regionalProviders['global'];
  }

  // Get providers by feature
  getProvidersByFeature(feature) {
    return Object.keys(this.providers).filter(providerId => 
      this.supportsFeature(providerId, feature)
    );
  }

  // Get recommended providers for use case
  getRecommendedProviders(useCase) {
    const recommendations = {
      'general-chat': ['openai', 'claude', 'gemini', 'qwen', 'sparkdesk'],
      'code-generation': ['openai', 'claude', 'gemini', 'deepseek', 'replicate'],
      'image-generation': ['openai', 'replicate', 'zhipu', 'ernie'],
      'multimodal': ['gemini', 'claude', 'qwen', 'sparkdesk', 'naver'],
      'reasoning': ['claude', 'gemini', 'deepmind', 'perplexity'],
      'creative-writing': ['openai', 'claude', 'gemini', 'mistral'],
      'analysis': ['claude', 'gemini', 'openai', 'perplexity'],
      'cost-effective': ['huggingface', 'together', 'mistral', 'baichuan'],
      'enterprise': ['openai', 'claude', 'azure', 'bedrock'],
      'research': ['openai', 'claude', 'gemini', 'deepmind', 'huggingface']
    };
    
    return recommendations[useCase] || recommendations['general-chat'];
  }

  // Get provider pricing info
  getPricing(providerId) {
    const pricing = {
      'openai': {
        'gpt-4': { input: 0.03, output: 0.06 },
        'gpt-4-turbo': { input: 0.01, output: 0.03 },
        'gpt-3.5-turbo': { input: 0.0015, output: 0.002 }
      },
      'claude': {
        'claude-3-opus': { input: 0.015, output: 0.075 },
        'claude-3-sonnet': { input: 0.003, output: 0.015 },
        'claude-3-haiku': { input: 0.00025, output: 0.00125 }
      },
      'gemini': {
        'gemini-pro': { input: 0.0005, output: 0.0015 },
        'gemini-1.5-pro': { input: 0.0035, output: 0.0105 },
        'gemini-1.5-flash': { input: 0.000075, output: 0.0003 }
      },
      'qwen': {
        'qwen-turbo': { input: 0.0002, output: 0.0008 },
        'qwen-plus': { input: 0.0004, output: 0.0012 },
        'qwen-max': { input: 0.0012, output: 0.004 }
      },
      'sparkdesk': {
        'spark-v3.0': { input: 0.0002, output: 0.0008 },
        'spark-v2.0': { input: 0.0001, output: 0.0004 }
      }
    };
    
    return pricing[providerId] || {};
  }

  // Get provider capabilities summary
  getCapabilitiesSummary() {
    const summary = {};
    
    Object.keys(this.providers).forEach(providerId => {
      const provider = this.providers[providerId];
      summary[providerId] = {
        name: provider.name,
        modelCount: provider.models.length,
        features: provider.features,
        region: this.getProviderRegion(providerId)
      };
    });
    
    return summary;
  }

  // Get provider region
  getProviderRegion(providerId) {
    const regions = {
      'global': ['openai', 'claude', 'gemini', 'azure', 'meta', 'bedrock', 'cohere', 'ai21', 'perplexity', 'mistral', 'together', 'replicate', 'huggingface', 'deepseek', 'xai'],
      'china': ['zhipu', 'baichuan', 'qwen', 'sparkdesk', 'ernie', 'minimax', 'moonshot', 'zeroone'],
      'japan': ['claude_jp', 'line'],
      'korea': ['naver', 'kakao'],
      'russia': ['yandex', 'sber'],
      'europe': ['claude_eu', 'alephalpha', 'mistral_eu', 'cohere_eu']
    };
    
    for (const [region, providers] of Object.entries(regions)) {
      if (providers.includes(providerId)) {
        return region;
      }
    }
    
    return 'global';
  }

  // Get provider status (mock implementation)
  async getProviderStatus(providerId) {
    // In a real implementation, this would check actual API status
    const statuses = {
      'openai': 'operational',
      'claude': 'operational',
      'gemini': 'operational',
      'qwen': 'operational',
      'sparkdesk': 'operational',
      'huggingface': 'operational'
    };
    
    return {
      provider: providerId,
      status: statuses[providerId] || 'unknown',
      timestamp: new Date().toISOString(),
      responseTime: Math.random() * 1000 + 100 // Mock response time
    };
  }

  // Get all provider statuses
  async getAllProviderStatuses() {
    const statuses = {};
    
    for (const providerId of Object.keys(this.providers)) {
      statuses[providerId] = await this.getProviderStatus(providerId);
    }
    
    return statuses;
  }

  // Get provider comparison
  getProviderComparison(providers = ['openai', 'claude', 'gemini', 'qwen']) {
    const comparison = {};
    
    providers.forEach(providerId => {
      const provider = this.providers[providerId];
      if (provider) {
        comparison[providerId] = {
          name: provider.name,
          models: provider.models.length,
          features: provider.features,
          pricing: this.getPricing(providerId),
          region: this.getProviderRegion(providerId)
        };
      }
    });
    
    return comparison;
  }

  // Get trending providers
  getTrendingProviders() {
    return [
      'openai',
      'claude', 
      'gemini',
      'qwen',
      'sparkdesk',
      'mistral',
      'perplexity',
      'deepseek'
    ];
  }

  // Get new providers
  getNewProviders() {
    return [
      'xai',
      'deepmind',
      'zeroone',
      'moonshot'
    ];
  }

  // Get provider recommendations based on user preferences
  getPersonalizedRecommendations(preferences) {
    const { region, useCase, budget, features } = preferences;
    
    let recommendations = this.getRecommendedProviders(useCase);
    
    // Filter by region if specified
    if (region && region !== 'global') {
      const regionalProviders = this.getProvidersByRegion(region);
      recommendations = recommendations.filter(p => regionalProviders.includes(p));
    }
    
    // Filter by budget
    if (budget === 'low') {
      const lowCostProviders = ['huggingface', 'together', 'mistral', 'baichuan'];
      recommendations = recommendations.filter(p => lowCostProviders.includes(p));
    }
    
    // Filter by features
    if (features && features.length > 0) {
      recommendations = recommendations.filter(p => 
        features.every(f => this.supportsFeature(p, f))
      );
    }
    
    return recommendations.slice(0, 5); // Return top 5
  }
}

module.exports = new GlobalAI(); 