const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs-extra');
const path = require('path');

const BASE_URL = 'http://localhost:5000';
const TEST_FILES_DIR = path.join(__dirname, 'test-files');

// Test configuration
const TESTS = {
  image: {
    name: 'Image Editing Tests',
    endpoint: '/api/media/edit-image',
    testFile: 'test-image.jpg',
    settings: {
      brightness: 120,
      contrast: 110,
      saturation: 90,
      blur: 2,
      sharpen: 10
    }
  },
  video: {
    name: 'Video Editing Tests',
    endpoint: '/api/media/edit-video',
    testFile: 'test-video.mp4',
    settings: {
      brightness: 115,
      contrast: 105,
      saturation: 95,
      fps: 30,
      resolution: '1080p'
    }
  },
  text: {
    name: 'Text Editing Tests',
    endpoint: '/api/media/edit-text',
    testFile: 'test-text.txt',
    settings: {
      content: 'این یک متن تست است که ویرایش شده است.',
      fontSize: 18,
      fontFamily: 'Arial',
      color: '#ff0000'
    }
  }
};

// Test utilities
class MediaEditorTester {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async createTestFiles() {
    this.log('Creating test files...');
    
    await fs.ensureDir(TEST_FILES_DIR);

    // Create test image
    const testImagePath = path.join(TEST_FILES_DIR, 'test-image.jpg');
    if (!await fs.pathExists(testImagePath)) {
      // Create a simple test image using Sharp
      const sharp = require('sharp');
      await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 255, g: 0, b: 0 }
        }
      })
      .jpeg()
      .toFile(testImagePath);
    }

    // Create test text file
    const testTextPath = path.join(TEST_FILES_DIR, 'test-text.txt');
    if (!await fs.pathExists(testTextPath)) {
      await fs.writeFile(testTextPath, 'این یک فایل تست است.\nThis is a test file.', 'utf8');
    }

    this.log('Test files created successfully', 'success');
  }

  async testHealthCheck() {
    this.log('Testing health check endpoint...');
    
    try {
      const response = await axios.get(`${BASE_URL}/api/health`);
      
      if (response.status === 200 && response.data.status === 'OK') {
        this.log('Health check passed', 'success');
        return true;
      } else {
        this.log('Health check failed - unexpected response', 'error');
        return false;
      }
    } catch (error) {
      this.log(`Health check failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testImageEditing() {
    this.log('Testing image editing functionality...');
    
    try {
      const testConfig = TESTS.image;
      const testFilePath = path.join(TEST_FILES_DIR, testConfig.testFile);
      
      if (!await fs.pathExists(testFilePath)) {
        this.log('Test image file not found', 'error');
        return false;
      }

      const formData = new FormData();
      formData.append('file', fs.createReadStream(testFilePath));
      formData.append('settings', JSON.stringify(testConfig.settings));
      formData.append('securityLevel', 'standard');

      const response = await axios.post(`${BASE_URL}${testConfig.endpoint}`, formData, {
        headers: {
          ...formData.getHeaders(),
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000 // 30 seconds timeout
      });

      if (response.status === 200 && response.data.success) {
        this.log('Image editing test passed', 'success');
        this.log(`Edited file URL: ${response.data.editedFileUrl}`);
        return true;
      } else {
        this.log('Image editing test failed - unexpected response', 'error');
        return false;
      }
    } catch (error) {
      this.log(`Image editing test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testVideoEditing() {
    this.log('Testing video editing functionality...');
    
    try {
      const testConfig = TESTS.video;
      const testFilePath = path.join(TEST_FILES_DIR, testConfig.testFile);
      
      // Skip video test if no test video file exists
      if (!await fs.pathExists(testFilePath)) {
        this.log('Test video file not found - skipping video test', 'info');
        return true; // Not a failure, just skip
      }

      const formData = new FormData();
      formData.append('file', fs.createReadStream(testFilePath));
      formData.append('settings', JSON.stringify(testConfig.settings));
      formData.append('securityLevel', 'enhanced');

      const response = await axios.post(`${BASE_URL}${testConfig.endpoint}`, formData, {
        headers: {
          ...formData.getHeaders(),
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000 // 60 seconds timeout for video processing
      });

      if (response.status === 200 && response.data.success) {
        this.log('Video editing test passed', 'success');
        this.log(`Edited file URL: ${response.data.editedFileUrl}`);
        return true;
      } else {
        this.log('Video editing test failed - unexpected response', 'error');
        return false;
      }
    } catch (error) {
      this.log(`Video editing test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testTextEditing() {
    this.log('Testing text editing functionality...');
    
    try {
      const testConfig = TESTS.text;
      const testFilePath = path.join(TEST_FILES_DIR, testConfig.testFile);
      
      if (!await fs.pathExists(testFilePath)) {
        this.log('Test text file not found', 'error');
        return false;
      }

      const formData = new FormData();
      formData.append('file', fs.createReadStream(testFilePath));
      formData.append('settings', JSON.stringify(testConfig.settings));
      formData.append('securityLevel', 'enterprise');

      const response = await axios.post(`${BASE_URL}${testConfig.endpoint}`, formData, {
        headers: {
          ...formData.getHeaders(),
          'Content-Type': 'multipart/form-data'
        },
        timeout: 10000 // 10 seconds timeout
      });

      if (response.status === 200 && response.data.success) {
        this.log('Text editing test passed', 'success');
        this.log(`Edited file URL: ${response.data.editedFileUrl}`);
        return true;
      } else {
        this.log('Text editing test failed - unexpected response', 'error');
        return false;
      }
    } catch (error) {
      this.log(`Text editing test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testSecurityLevels() {
    this.log('Testing security levels...');
    
    const securityLevels = ['standard', 'enhanced', 'enterprise'];
    const results = [];

    for (const level of securityLevels) {
      try {
        const testFilePath = path.join(TEST_FILES_DIR, 'test-text.txt');
        
        if (!await fs.pathExists(testFilePath)) {
          continue;
        }

        const formData = new FormData();
        formData.append('file', fs.createReadStream(testFilePath));
        formData.append('settings', JSON.stringify({ content: 'Security test' }));
        formData.append('securityLevel', level);

        const response = await axios.post(`${BASE_URL}/api/media/edit-text`, formData, {
          headers: {
            ...formData.getHeaders(),
            'Content-Type': 'multipart/form-data'
          }
        });

        if (response.status === 200) {
          this.log(`Security level '${level}' test passed`, 'success');
          results.push(true);
        } else {
          this.log(`Security level '${level}' test failed`, 'error');
          results.push(false);
        }
      } catch (error) {
        this.log(`Security level '${level}' test failed: ${error.message}`, 'error');
        results.push(false);
      }
    }

    return results.every(result => result);
  }

  async testRateLimiting() {
    this.log('Testing rate limiting...');
    
    try {
      const testFilePath = path.join(TEST_FILES_DIR, 'test-text.txt');
      
      if (!await fs.pathExists(testFilePath)) {
        this.log('Test file not found - skipping rate limit test', 'info');
        return true;
      }

      // Make multiple rapid requests to trigger rate limiting
      const promises = [];
      for (let i = 0; i < 15; i++) {
        const formData = new FormData();
        formData.append('file', fs.createReadStream(testFilePath));
        formData.append('settings', JSON.stringify({ content: `Rate limit test ${i}` }));
        formData.append('securityLevel', 'standard');

        promises.push(
          axios.post(`${BASE_URL}/api/media/edit-text`, formData, {
            headers: {
              ...formData.getHeaders(),
              'Content-Type': 'multipart/form-data'
            }
          }).catch(error => error.response)
        );
      }

      const responses = await Promise.all(promises);
      const rateLimited = responses.some(response => response?.status === 429);

      if (rateLimited) {
        this.log('Rate limiting test passed - rate limit triggered as expected', 'success');
        return true;
      } else {
        this.log('Rate limiting test failed - no rate limit triggered', 'error');
        return false;
      }
    } catch (error) {
      this.log(`Rate limiting test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testFileValidation() {
    this.log('Testing file validation...');
    
    try {
      // Test with invalid file type
      const formData = new FormData();
      formData.append('file', Buffer.from('invalid file content'), {
        filename: 'test.exe',
        contentType: 'application/x-executable'
      });
      formData.append('settings', JSON.stringify({}));
      formData.append('securityLevel', 'standard');

      const response = await axios.post(`${BASE_URL}/api/media/edit-text`, formData, {
        headers: {
          ...formData.getHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.status === 400) {
        this.log('File validation test passed - invalid file rejected', 'success');
        return true;
      } else {
        this.log('File validation test failed - invalid file accepted', 'error');
        return false;
      }
    } catch (error) {
      if (error.response?.status === 400) {
        this.log('File validation test passed - invalid file rejected', 'success');
        return true;
      } else {
        this.log(`File validation test failed: ${error.message}`, 'error');
        return false;
      }
    }
  }

  async testStatsEndpoint() {
    this.log('Testing stats endpoint...');
    
    try {
      const response = await axios.get(`${BASE_URL}/api/media/stats`);
      
      if (response.status === 200 && response.data.success) {
        this.log('Stats endpoint test passed', 'success');
        this.log(`Total files: ${response.data.stats.totalFiles}`);
        this.log(`Total size: ${response.data.stats.totalSizeFormatted}`);
        return true;
      } else {
        this.log('Stats endpoint test failed - unexpected response', 'error');
        return false;
      }
    } catch (error) {
      this.log(`Stats endpoint test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async runAllTests() {
    this.log('🚀 Starting Media Editor Tests...');
    this.log('=====================================');

    // Create test files
    await this.createTestFiles();

    // Run tests
    const tests = [
      { name: 'Health Check', test: () => this.testHealthCheck() },
      { name: 'Image Editing', test: () => this.testImageEditing() },
      { name: 'Video Editing', test: () => this.testVideoEditing() },
      { name: 'Text Editing', test: () => this.testTextEditing() },
      { name: 'Security Levels', test: () => this.testSecurityLevels() },
      { name: 'Rate Limiting', test: () => this.testRateLimiting() },
      { name: 'File Validation', test: () => this.testFileValidation() },
      { name: 'Stats Endpoint', test: () => this.testStatsEndpoint() }
    ];

    let passedTests = 0;
    let totalTests = tests.length;

    for (const test of tests) {
      this.log(`\n📋 Running ${test.name}...`);
      const result = await test.test();
      this.results.push({ name: test.name, passed: result });
      
      if (result) {
        passedTests++;
      }
    }

    // Generate report
    this.generateReport(passedTests, totalTests);
  }

  generateReport(passedTests, totalTests) {
    const duration = Date.now() - this.startTime;
    
    this.log('\n📊 Test Results Summary');
    this.log('=====================================');
    this.log(`Total Tests: ${totalTests}`);
    this.log(`Passed: ${passedTests}`);
    this.log(`Failed: ${totalTests - passedTests}`);
    this.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    this.log(`Duration: ${(duration / 1000).toFixed(2)} seconds`);
    
    this.log('\n📋 Detailed Results:');
    this.results.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      this.log(`${status} ${result.name}`);
    });

    if (passedTests === totalTests) {
      this.log('\n🎉 All tests passed! Media editor is working correctly.');
    } else {
      this.log('\n⚠️  Some tests failed. Please check the implementation.');
    }
  }
}

// Run tests
async function main() {
  const tester = new MediaEditorTester();
  
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('❌ Test runner failed:', error.message);
    process.exit(1);
  }
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/api/health`);
    return true;
  } catch (error) {
    console.error('❌ Server is not running. Please start the server first:');
    console.error('   npm run dev');
    return false;
  }
}

// Main execution
if (require.main === module) {
  checkServer().then(serverRunning => {
    if (serverRunning) {
      main();
    } else {
      process.exit(1);
    }
  });
}

module.exports = MediaEditorTester; 