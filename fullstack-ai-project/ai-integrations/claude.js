const Anthropic = require('@anthropic-ai/sdk');

class ClaudeIntegration {
  constructor(apiKey) {
    this.anthropic = new Anthropic({
      apiKey: apiKey,
    });
  }

  async chat(message, model = 'claude-3-opus-20240229') {
    try {
      const response = await this.anthropic.messages.create({
        model: model,
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: message
          }
        ]
      });

      return {
        success: true,
        response: response.content[0].text,
        model: model,
        usage: {
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens
        }
      };
    } catch (error) {
      console.error('Claude API Error:', error);
      throw error;
    }
  }

  getAvailableModels() {
    return [
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        provider: 'Anthropic',
        description: 'Most capable Claude model for complex tasks'
      },
      {
        id: 'claude-3-sonnet-20240229',
        name: 'Claude 3 Sonnet',
        provider: 'Anthropic',
        description: 'Balanced performance and speed'
      },
      {
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        provider: 'Anthropic',
        description: 'Fastest and most cost-effective'
      }
    ];
  }
}

module.exports = ClaudeIntegration; 