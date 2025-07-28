import axios from 'axios';

class DownloadService {
  constructor() {
    this.sessionId = localStorage.getItem('downloadSessionId');
    this.userId = localStorage.getItem('userId') || 'anonymous';
  }

  // Initialize download session
  async initializeSession() {
    try {
      const response = await axios.post('/api/downloads/session', {
        userId: this.userId
      });

      this.sessionId = response.data.sessionId;
      localStorage.setItem('downloadSessionId', this.sessionId);
      
      return this.sessionId;
    } catch (error) {
      console.error('Failed to initialize download session:', error);
      throw error;
    }
  }

  // Validate session
  async validateSession() {
    if (!this.sessionId) {
      return false;
    }

    try {
      const response = await axios.get(`/api/downloads/session/${this.sessionId}`);
      return response.data.valid;
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  }

  // Download file with progress tracking
  async downloadFile(url, filename, onProgress = null) {
    try {
      // Ensure we have a valid session
      const isValid = await this.validateSession();
      if (!isValid) {
        await this.initializeSession();
      }

      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'blob',
        headers: {
          'x-session-id': this.sessionId
        },
        onDownloadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted, progressEvent.loaded, progressEvent.total);
          }
        }
      });

      // Create download link
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(downloadUrl);

      return true;
    } catch (error) {
      console.error('Download failed:', error);
      
      if (error.response?.status === 401) {
        // Session expired, try to reinitialize
        try {
          await this.initializeSession();
          // Retry download
          return await this.downloadFile(url, filename, onProgress);
        } catch (retryError) {
          throw new Error('Authentication failed. Please log in again.');
        }
      }
      
      throw error;
    }
  }

  // Download AI-generated image
  async downloadImage(imageUrl, filename = 'generated-image.png') {
    return await this.downloadFile(imageUrl, filename);
  }

  // Download AI-generated video
  async downloadVideo(videoUrl, filename = 'generated-video.mp4') {
    return await this.downloadFile(videoUrl, filename);
  }

  // Download with custom progress tracking
  async downloadWithProgress(url, filename, onProgress) {
    return await this.downloadFile(url, filename, onProgress);
  }

  // Get file size before download
  async getFileSize(url) {
    try {
      const response = await axios.head(url, {
        headers: {
          'x-session-id': this.sessionId
        }
      });
      
      return parseInt(response.headers['content-length'], 10) || 0;
    } catch (error) {
      console.error('Failed to get file size:', error);
      return 0;
    }
  }

  // Format file size for display
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Clear session
  clearSession() {
    this.sessionId = null;
    localStorage.removeItem('downloadSessionId');
  }
}

export default new DownloadService(); 