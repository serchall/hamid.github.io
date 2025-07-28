const OpenAI = require('openai');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs-extra');

class DalleIntegration {
  constructor(apiKey) {
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  async generateImage(prompt, options = {}) {
    try {
      const {
        model = process.env.DALLE_MODEL || 'dall-e-3',
        size = process.env.DALLE_SIZE || '1024x1024',
        quality = process.env.DALLE_QUALITY || 'standard',
        style = 'vivid'
      } = options;

      const response = await this.openai.images.generate({
        model: model,
        prompt: prompt,
        n: 1,
        size: size,
        quality: quality,
        style: style,
      });

      return {
        success: true,
        imageUrl: response.data[0].url,
        revisedPrompt: response.data[0].revised_prompt,
        model: model,
        size: size,
        quality: quality
      };
    } catch (error) {
      console.error('DALL-E API Error:', error);
      throw error;
    }
  }

  async editImage(imagePath, prompt, maskPath = null, options = {}) {
    try {
      const {
        size = process.env.DALLE_SIZE || '1024x1024',
        n = 1
      } = options;

      // Ensure image is in PNG format and correct size
      const processedImagePath = await this.preprocessImage(imagePath);
      
      let requestData = {
        image: fs.createReadStream(processedImagePath),
        prompt: prompt,
        n: n,
        size: size,
      };

      if (maskPath) {
        const processedMaskPath = await this.preprocessImage(maskPath);
        requestData.mask = fs.createReadStream(processedMaskPath);
      }

      const response = await this.openai.images.edit(requestData);

      // Clean up temporary files
      await fs.remove(processedImagePath);
      if (maskPath) {
        await fs.remove(processedMaskPath);
      }

      return {
        success: true,
        imageUrl: response.data[0].url,
        model: 'dall-e-2',
        size: size
      };
    } catch (error) {
      console.error('DALL-E Edit API Error:', error);
      throw error;
    }
  }

  async createVariation(imagePath, options = {}) {
    try {
      const {
        size = process.env.DALLE_SIZE || '1024x1024',
        n = 1
      } = options;

      // Ensure image is in PNG format and correct size
      const processedImagePath = await this.preprocessImage(imagePath);

      const response = await this.openai.images.createVariation({
        image: fs.createReadStream(processedImagePath),
        n: n,
        size: size,
      });

      // Clean up temporary file
      await fs.remove(processedImagePath);

      return {
        success: true,
        imageUrl: response.data[0].url,
        model: 'dall-e-2',
        size: size
      };
    } catch (error) {
      console.error('DALL-E Variation API Error:', error);
      throw error;
    }
  }

  async preprocessImage(imagePath) {
    try {
      const outputPath = imagePath.replace(/\.[^/.]+$/, '_processed.png');
      
      await sharp(imagePath)
        .resize(1024, 1024, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toFile(outputPath);

      return outputPath;
    } catch (error) {
      console.error('Image preprocessing error:', error);
      throw error;
    }
  }

  getAvailableModels() {
    return [
      {
        id: 'dall-e-3',
        name: 'DALL-E 3',
        description: 'Most capable DALL-E model for high-quality image generation',
        capabilities: ['generate', 'edit'],
        sizes: ['1024x1024', '1792x1024', '1024x1792']
      },
      {
        id: 'dall-e-2',
        name: 'DALL-E 2',
        description: 'Previous generation model for image editing and variations',
        capabilities: ['edit', 'variation'],
        sizes: ['256x256', '512x512', '1024x1024']
      }
    ];
  }
}

module.exports = DalleIntegration; 