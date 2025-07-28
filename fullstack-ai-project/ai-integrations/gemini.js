const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiIntegration {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async chat(message, model = 'gemini-pro') {
    try {
      const geminiModel = this.genAI.getGenerativeModel({ model: model });
      
      const result = await geminiModel.generateContent(message);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        response: text,
        model: model,
        usage: {
          prompt_tokens: result.response.usageMetadata?.promptTokenCount || 0,
          response_tokens: result.response.usageMetadata?.candidatesTokenCount || 0
        }
      };
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw error;
    }
  }

  getAvailableModels() {
    return [
      {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        provider: 'Google',
        description: 'Most capable Gemini model for text generation'
      },
      {
        id: 'gemini-pro-vision',
        name: 'Gemini Pro Vision',
        provider: 'Google',
        description: 'Multimodal model for text and image understanding'
      },
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        provider: 'Google',
        description: 'Latest Gemini model with improved capabilities'
      }
    ];
  }
}

module.exports = GeminiIntegration; 