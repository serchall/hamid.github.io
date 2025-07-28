const axios = require('axios');

class HuggingFaceIntegration {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api-inference.huggingface.co/models';
  }

  async chat(message, model = 'microsoft/DialoGPT-medium') {
    try {
      const response = await axios.post(
        `${this.baseURL}/${model}`,
        {
          inputs: message,
          options: {
            wait_for_model: true
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Handle different response formats from different models
      let aiResponse;
      if (Array.isArray(response.data) && response.data.length > 0) {
        aiResponse = response.data[0].generated_text || response.data[0].response || response.data[0];
      } else if (typeof response.data === 'string') {
        aiResponse = response.data;
      } else {
        aiResponse = JSON.stringify(response.data);
      }

      return {
        success: true,
        response: aiResponse,
        model: model,
        usage: {
          model_load_time: response.headers['x-model-load-time'] || 0
        }
      };
    } catch (error) {
      console.error('HuggingFace API Error:', error);
      throw error;
    }
  }

  async getModelInfo(model) {
    try {
      const response = await axios.get(
        `${this.baseURL}/${model}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching model info:', error);
      return null;
    }
  }

  getAvailableModels() {
    return [
      {
        id: 'microsoft/DialoGPT-medium',
        name: 'DialoGPT Medium',
        provider: 'Microsoft',
        description: 'Conversational AI model for chat applications'
      },
      {
        id: 'facebook/blenderbot-400M-distill',
        name: 'BlenderBot 400M',
        provider: 'Facebook',
        description: 'Open-domain conversational agent'
      },
      {
        id: 'EleutherAI/gpt-neo-125M',
        name: 'GPT-Neo 125M',
        provider: 'EleutherAI',
        description: 'Small but efficient language model'
      },
      {
        id: 'gpt2',
        name: 'GPT-2',
        provider: 'OpenAI',
        description: 'Classic language model for text generation'
      }
    ];
  }
}

module.exports = HuggingFaceIntegration; 