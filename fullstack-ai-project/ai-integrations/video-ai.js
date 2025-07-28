const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs-extra');

class VideoAIIntegration {
  constructor() {
    this.replicateApiKey = process.env.REPLICATE_API_KEY;
    this.runwaymlApiKey = process.env.RUNWAYML_API_KEY;
  }

  async generateVideo(prompt, options = {}) {
    try {
      const {
        model = 'stability-ai/stable-video-diffusion',
        duration = 4,
        fps = 6
      } = options;

      if (!this.replicateApiKey) {
        throw new Error('Replicate API key not configured');
      }

      const response = await axios.post(
        'https://api.replicate.com/v1/predictions',
        {
          version: '3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438',
          input: {
            prompt: prompt,
            video_length: duration,
            fps: fps,
            motion_bucket_id: 127,
            cond_aug: 0.02,
            decoding_t: 7,
            seed: Math.floor(Math.random() * 1000000)
          }
        },
        {
          headers: {
            'Authorization': `Token ${this.replicateApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const predictionId = response.data.id;
      
      // Poll for completion
      const result = await this.pollPrediction(predictionId);
      
      return {
        success: true,
        videoUrl: result.output,
        model: model,
        duration: duration,
        fps: fps
      };
    } catch (error) {
      console.error('Video Generation Error:', error);
      throw error;
    }
  }

  async editVideo(videoPath, prompt, options = {}) {
    try {
      const {
        model = 'runwayml/stable-video-diffusion',
        strength = 0.8
      } = options;

      // Upload video to temporary storage
      const videoUrl = await this.uploadVideo(videoPath);

      if (model.includes('runwayml') && this.runwaymlApiKey) {
        return await this.runwaymlEdit(videoUrl, prompt, options);
      } else if (this.replicateApiKey) {
        return await this.replicateEdit(videoUrl, prompt, options);
      } else {
        throw new Error('No video AI service configured');
      }
    } catch (error) {
      console.error('Video Edit Error:', error);
      throw error;
    }
  }

  async replicateEdit(videoUrl, prompt, options = {}) {
    const {
      strength = 0.8,
      guidance_scale = 7.5
    } = options;

    const response = await axios.post(
      'https://api.replicate.com/v1/predictions',
      {
        version: '3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438',
        input: {
          video: videoUrl,
          prompt: prompt,
          strength: strength,
          guidance_scale: guidance_scale
        }
      },
      {
        headers: {
          'Authorization': `Token ${this.replicateApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const predictionId = response.data.id;
    const result = await this.pollPrediction(predictionId);

    return {
      success: true,
      videoUrl: result.output,
      model: 'replicate-video-edit',
      strength: strength
    };
  }

  async runwaymlEdit(videoUrl, prompt, options = {}) {
    // RunwayML API implementation would go here
    // This is a placeholder for the actual RunwayML integration
    throw new Error('RunwayML integration not yet implemented');
  }

  async pollPrediction(predictionId) {
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;

    while (attempts < maxAttempts) {
      const response = await axios.get(
        `https://api.replicate.com/v1/predictions/${predictionId}`,
        {
          headers: {
            'Authorization': `Token ${this.replicateApiKey}`
          }
        }
      );

      const status = response.data.status;

      if (status === 'succeeded') {
        return response.data;
      } else if (status === 'failed') {
        throw new Error(`Prediction failed: ${response.data.error}`);
      }

      // Wait 5 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
    }

    throw new Error('Prediction timed out');
  }

  async uploadVideo(videoPath) {
    // For now, we'll use a simple file upload to a temporary service
    // In production, you'd want to use a proper cloud storage service
    const formData = new FormData();
    formData.append('file', fs.createReadStream(videoPath));

    const response = await axios.post(
      'https://api.replicate.com/v1/uploads',
      formData,
      {
        headers: {
          'Authorization': `Token ${this.replicateApiKey}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    return response.data.serving_url;
  }

  async processVideo(videoPath, options = {}) {
    try {
      const {
        resize = null,
        format = 'mp4',
        quality = 'medium',
        fps = 30
      } = options;

      const outputPath = videoPath.replace(/\.[^/.]+$/, `_processed.${format}`);
      
      return new Promise((resolve, reject) => {
        let command = ffmpeg(videoPath);

        if (resize) {
          command = command.size(resize);
        }

        command
          .fps(fps)
          .videoCodec('libx264')
          .audioCodec('aac')
          .on('end', () => {
            resolve(outputPath);
          })
          .on('error', (err) => {
            reject(err);
          })
          .save(outputPath);
      });
    } catch (error) {
      console.error('Video processing error:', error);
      throw error;
    }
  }

  async extractFrames(videoPath, fps = 1) {
    try {
      const outputDir = path.dirname(videoPath);
      const baseName = path.basename(videoPath, path.extname(videoPath));
      const framesDir = path.join(outputDir, `${baseName}_frames`);
      
      await fs.ensureDir(framesDir);

      return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
          .fps(fps)
          .on('end', () => {
            resolve(framesDir);
          })
          .on('error', (err) => {
            reject(err);
          })
          .screenshots({
            count: 10,
            folder: framesDir,
            filename: 'frame-%i.png'
          });
      });
    } catch (error) {
      console.error('Frame extraction error:', error);
      throw error;
    }
  }

  getAvailableModels() {
    return [
      {
        id: 'stability-ai/stable-video-diffusion',
        name: 'Stable Video Diffusion',
        provider: 'Stability AI',
        description: 'Generate videos from text prompts',
        capabilities: ['generate'],
        maxDuration: 4
      },
      {
        id: 'runwayml/stable-video-diffusion',
        name: 'RunwayML Video Diffusion',
        provider: 'RunwayML',
        description: 'Edit existing videos with AI',
        capabilities: ['edit'],
        requiresApiKey: true
      },
      {
        id: 'zeroscope-xl',
        name: 'Zeroscope XL',
        provider: 'Replicate',
        description: 'High-quality video generation',
        capabilities: ['generate'],
        maxDuration: 3
      }
    ];
  }
}

module.exports = VideoAIIntegration; 