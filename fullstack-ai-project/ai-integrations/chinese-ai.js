const axios = require('axios');
const crypto = require('crypto');

class ChineseAI {
  constructor() {
    this.providers = {
      zhipu: {
        name: '智谱AI (Zhipu AI)',
        baseURL: 'https://open.bigmodel.cn/api/paas/v4',
        models: ['glm-4', 'glm-3-turbo', 'cogview-3', 'glm-4v'],
        features: ['chat', 'image-generation', 'multimodal', 'function-calling']
      },
      baichuan: {
        name: '百川智能 (Baichuan)',
        baseURL: 'https://api.baichuan-ai.com/v1',
        models: ['Baichuan2-Turbo', 'Baichuan2-Turbo-192k', 'Baichuan2-13B-Chat', 'Baichuan2-7B-Chat'],
        features: ['chat', 'text-generation', 'code-generation']
      },
      qwen: {
        name: '通义千问 (Qwen)',
        baseURL: 'https://dashscope.aliyuncs.com/api/v1',
        models: ['qwen-turbo', 'qwen-plus', 'qwen-max', 'qwen-vl-plus', 'qwen-vl-max'],
        features: ['chat', 'vision', 'multimodal', 'code-generation']
      },
      sparkdesk: {
        name: '讯飞星火 (SparkDesk)',
        baseURL: 'https://spark-api.xf-yun.com/v3.1',
        models: ['spark-v3.0', 'spark-v2.0', 'spark-v1.5'],
        features: ['chat', 'multimodal', 'speech-synthesis', 'speech-recognition']
      },
      ernie: {
        name: '文心一言 (ERNIE)',
        baseURL: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop',
        models: ['ernie-bot-4', 'ernie-bot-turbo', 'ernie-bot', 'ernie-vilg-v2'],
        features: ['chat', 'image-generation', 'multimodal']
      },
      minimax: {
        name: 'MiniMax',
        baseURL: 'https://api.minimax.chat/v1',
        models: ['abab5.5-chat', 'abab5.5s-chat', 'abab6-chat'],
        features: ['chat', 'text-generation', 'embeddings']
      },
      moonshot: {
        name: 'Moonshot AI',
        baseURL: 'https://api.moonshot.cn/v1',
        models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
        features: ['chat', 'text-generation', 'code-generation']
      },
      zeroone: {
        name: '零一万物 (01.AI)',
        baseURL: 'https://api.lingyiwanwu.com/v1',
        models: ['yi-34b-chat', 'yi-6b-chat', 'yi-vl-34b'],
        features: ['chat', 'vision', 'multimodal']
      }
    };
  }

  // Zhipu AI Integration
  async zhipuChat(message, model = 'glm-4', settings = {}) {
    try {
      const apiKey = process.env.ZHIPU_API_KEY;
      if (!apiKey) {
        throw new Error('Zhipu API key not configured');
      }

      const response = await axios.post(
        `${this.providers.zhipu.baseURL}/chat/completions`,
        {
          model: model,
          messages: [
            { role: 'user', content: message }
          ],
          temperature: settings.temperature || 0.7,
          max_tokens: settings.maxTokens || 1000,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        content: response.data.choices[0].message.content,
        model: model,
        provider: 'zhipu',
        usage: response.data.usage,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Zhipu API error: ${error.message}`);
    }
  }

  // Baichuan AI Integration
  async baichuanChat(message, model = 'Baichuan2-Turbo', settings = {}) {
    try {
      const apiKey = process.env.BAICHUAN_API_KEY;
      if (!apiKey) {
        throw new Error('Baichuan API key not configured');
      }

      const response = await axios.post(
        `${this.providers.baichuan.baseURL}/chat/completions`,
        {
          model: model,
          messages: [
            { role: 'user', content: message }
          ],
          temperature: settings.temperature || 0.7,
          max_tokens: settings.maxTokens || 1000,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        content: response.data.choices[0].message.content,
        model: model,
        provider: 'baichuan',
        usage: response.data.usage,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Baichuan API error: ${error.message}`);
    }
  }

  // Qwen (Alibaba) Integration
  async qwenChat(message, model = 'qwen-turbo', settings = {}) {
    try {
      const apiKey = process.env.QWEN_API_KEY;
      if (!apiKey) {
        throw new Error('Qwen API key not configured');
      }

      const response = await axios.post(
        `${this.providers.qwen.baseURL}/services/aigc/text2text/generation`,
        {
          model: model,
          input: {
            messages: [
              { role: 'user', content: message }
            ]
          },
          parameters: {
            temperature: settings.temperature || 0.7,
            max_tokens: settings.maxTokens || 1000,
            top_p: settings.topP || 0.8
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        content: response.data.output.text,
        model: model,
        provider: 'qwen',
        usage: response.data.usage,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Qwen API error: ${error.message}`);
    }
  }

  // SparkDesk (iFlytek) Integration
  async sparkdeskChat(message, model = 'spark-v3.0', settings = {}) {
    try {
      const appId = process.env.SPARKDESK_APP_ID;
      const apiKey = process.env.SPARKDESK_API_KEY;
      const apiSecret = process.env.SPARKDESK_API_SECRET;

      if (!appId || !apiKey || !apiSecret) {
        throw new Error('SparkDesk credentials not configured');
      }

      // Generate authentication headers
      const host = 'spark-api.xf-yun.com';
      const date = new Date().toUTCString();
      const algorithm = 'hmac-sha256';
      const headers = 'host date request-line';
      const signatureOrigin = `host: ${host}\ndate: ${date}\nPOST /v3.1/chat HTTP/1.1`;
      const signatureSha = crypto.createHmac('sha256', apiSecret).update(signatureOrigin).digest('base64');
      const authorizationOrigin = `api_key="${apiKey}", algorithm="${algorithm}", headers="${headers}", signature="${signatureSha}"`;
      const authorization = Buffer.from(authorizationOrigin).toString('base64');

      const response = await axios.post(
        `${this.providers.sparkdesk.baseURL}/chat`,
        {
          header: {
            app_id: appId
          },
          parameter: {
            chat: {
              domain: model,
              temperature: settings.temperature || 0.7,
              max_tokens: settings.maxTokens || 1000
            }
          },
          payload: {
            message: {
              text: [
                { role: 'user', content: message }
              ]
            }
          }
        },
        {
          headers: {
            'Authorization': authorization,
            'Content-Type': 'application/json',
            'Host': host,
            'Date': date
          }
        }
      );

      return {
        content: response.data.payload.choices.text[0].content,
        model: model,
        provider: 'sparkdesk',
        usage: response.data.header,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`SparkDesk API error: ${error.message}`);
    }
  }

  // ERNIE (Baidu) Integration
  async ernieChat(message, model = 'ernie-bot-turbo', settings = {}) {
    try {
      const accessToken = process.env.ERNIE_ACCESS_TOKEN;
      if (!accessToken) {
        throw new Error('ERNIE access token not configured');
      }

      const response = await axios.post(
        `${this.providers.ernie.baseURL}/chat/${model}`,
        {
          messages: [
            { role: 'user', content: message }
          ],
          temperature: settings.temperature || 0.7,
          top_p: settings.topP || 0.8,
          stream: false
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          params: {
            access_token: accessToken
          }
        }
      );

      return {
        content: response.data.result,
        model: model,
        provider: 'ernie',
        usage: response.data.usage,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`ERNIE API error: ${error.message}`);
    }
  }

  // MiniMax Integration
  async minimaxChat(message, model = 'abab5.5-chat', settings = {}) {
    try {
      const apiKey = process.env.MINIMAX_API_KEY;
      if (!apiKey) {
        throw new Error('MiniMax API key not configured');
      }

      const response = await axios.post(
        `${this.providers.minimax.baseURL}/text/chatcompletion_v2`,
        {
          model: model,
          messages: [
            { role: 'user', content: message }
          ],
          temperature: settings.temperature || 0.7,
          top_p: settings.topP || 0.8,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        content: response.data.reply,
        model: model,
        provider: 'minimax',
        usage: response.data.usage,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`MiniMax API error: ${error.message}`);
    }
  }

  // Moonshot AI Integration
  async moonshotChat(message, model = 'moonshot-v1-8k', settings = {}) {
    try {
      const apiKey = process.env.MOONSHOT_API_KEY;
      if (!apiKey) {
        throw new Error('Moonshot API key not configured');
      }

      const response = await axios.post(
        `${this.providers.moonshot.baseURL}/chat/completions`,
        {
          model: model,
          messages: [
            { role: 'user', content: message }
          ],
          temperature: settings.temperature || 0.7,
          max_tokens: settings.maxTokens || 1000,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        content: response.data.choices[0].message.content,
        model: model,
        provider: 'moonshot',
        usage: response.data.usage,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Moonshot API error: ${error.message}`);
    }
  }

  // 01.AI Integration
  async zerooneChat(message, model = 'yi-34b-chat', settings = {}) {
    try {
      const apiKey = process.env.ZEROONE_API_KEY;
      if (!apiKey) {
        throw new Error('01.AI API key not configured');
      }

      const response = await axios.post(
        `${this.providers.zeroone.baseURL}/chat/completions`,
        {
          model: model,
          messages: [
            { role: 'user', content: message }
          ],
          temperature: settings.temperature || 0.7,
          max_tokens: settings.maxTokens || 1000,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        content: response.data.choices[0].message.content,
        model: model,
        provider: 'zeroone',
        usage: response.data.usage,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`01.AI API error: ${error.message}`);
    }
  }

  // Get all Chinese AI providers
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

  // Get Chinese AI pricing
  getPricing() {
    return {
      'zhipu': {
        'glm-4': { input: 0.1, output: 0.1 },
        'glm-3-turbo': { input: 0.005, output: 0.005 }
      },
      'qwen': {
        'qwen-turbo': { input: 0.0002, output: 0.0008 },
        'qwen-plus': { input: 0.0004, output: 0.0012 },
        'qwen-max': { input: 0.0012, output: 0.004 }
      },
      'sparkdesk': {
        'spark-v3.0': { input: 0.0002, output: 0.0008 },
        'spark-v2.0': { input: 0.0001, output: 0.0004 }
      },
      'ernie': {
        'ernie-bot-turbo': { input: 0.0002, output: 0.0008 },
        'ernie-bot-4': { input: 0.0012, output: 0.004 }
      }
    };
  }

  // Get recommended Chinese AI for use case
  getRecommendations(useCase) {
    const recommendations = {
      'general-chat': ['qwen', 'sparkdesk', 'zhipu'],
      'code-generation': ['qwen', 'zhipu', 'moonshot'],
      'multimodal': ['qwen', 'sparkdesk', 'zhipu'],
      'cost-effective': ['sparkdesk', 'qwen', 'minimax'],
      'enterprise': ['zhipu', 'qwen', 'ernie']
    };
    
    return recommendations[useCase] || recommendations['general-chat'];
  }
}

module.exports = new ChineseAI(); 