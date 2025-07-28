import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { 
  Upload, 
  Image, 
  Wand2, 
  Download, 
  RotateCcw, 
  Settings,
  Loader2,
  Sparkles,
  Shield,
  CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import downloadService from '../services/downloadService';
import DownloadProgress from './DownloadProgress';

const ImageEditor = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('dall-e-3');
  const [size, setSize] = useState('1024x1024');
  const [quality, setQuality] = useState('standard');
  const [mode, setMode] = useState('generate'); // generate, edit, variation
  const [downloadProgress, setDownloadProgress] = useState({
    isVisible: false,
    progress: 0,
    filename: '',
    fileSize: 0,
    status: 'downloading'
  });

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setGeneratedImage(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif']
    },
    maxFiles: 1
  });

  const generateImage = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('/api/generate-image', {
        prompt,
        model,
        size,
        quality
      });

      setGeneratedImage(response.data.imageUrl);
      toast.success('Image generated successfully!');
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error(error.response?.data?.error || 'Failed to generate image');
    } finally {
      setIsLoading(false);
    }
  };

  const editImage = async () => {
    if (!selectedFile || !prompt.trim()) {
      toast.error('Please select an image and enter a prompt');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('prompt', prompt);
      formData.append('size', size);

      const response = await axios.post('/api/edit-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setGeneratedImage(response.data.imageUrl);
      toast.success('Image edited successfully!');
    } catch (error) {
      console.error('Error editing image:', error);
      toast.error(error.response?.data?.error || 'Failed to edit image');
    } finally {
      setIsLoading(false);
    }
  };

  const createVariation = async () => {
    if (!selectedFile) {
      toast.error('Please select an image');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('size', size);

      const response = await axios.post('/api/variation-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setGeneratedImage(response.data.imageUrl);
      toast.success('Image variation created successfully!');
    } catch (error) {
      console.error('Error creating variation:', error);
      toast.error(error.response?.data?.error || 'Failed to create variation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = () => {
    switch (mode) {
      case 'generate':
        generateImage();
        break;
      case 'edit':
        editImage();
        break;
      case 'variation':
        createVariation();
        break;
      default:
        break;
    }
  };

  const downloadImage = async (url, filename = 'generated-image.png') => {
    try {
      setDownloadProgress({
        isVisible: true,
        progress: 0,
        filename,
        fileSize: 0,
        status: 'downloading'
      });

      // Get file size first
      const fileSize = await downloadService.getFileSize(url);
      setDownloadProgress(prev => ({ ...prev, fileSize }));

      await downloadService.downloadWithProgress(url, filename, (progress, loaded, total) => {
        setDownloadProgress(prev => ({
          ...prev,
          progress,
          fileSize: total
        }));
      });

      setDownloadProgress(prev => ({ ...prev, status: 'completed', progress: 100 }));
      toast.success('Image downloaded successfully!');
      
      // Hide progress after 3 seconds
      setTimeout(() => {
        setDownloadProgress(prev => ({ ...prev, isVisible: false }));
      }, 3000);

    } catch (error) {
      console.error('Download failed:', error);
      setDownloadProgress(prev => ({ ...prev, status: 'error' }));
      toast.error(error.message || 'Failed to download image');
    }
  };

  const clearAll = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setGeneratedImage(null);
    setPrompt('');
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Image className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">AI Image Editor</h2>
        </div>

        {/* Mode Selection */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setMode('generate')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === 'generate'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Sparkles className="h-4 w-4 inline mr-2" />
            Generate
          </button>
          <button
            onClick={() => setMode('edit')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === 'edit'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Wand2 className="h-4 w-4 inline mr-2" />
            Edit
          </button>
          <button
            onClick={() => setMode('variation')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === 'variation'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <RotateCcw className="h-4 w-4 inline mr-2" />
            Variation
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Input */}
          <div className="space-y-6">
            {/* File Upload */}
            {(mode === 'edit' || mode === 'variation') && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Upload Image</h3>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  {isDragActive ? (
                    <p className="text-blue-600">Drop the image here...</p>
                  ) : (
                    <div>
                      <p className="text-gray-600 mb-2">
                        Drag & drop an image here, or click to select
                      </p>
                      <p className="text-sm text-gray-500">
                        Supports: JPG, PNG, WebP, GIF
                      </p>
                    </div>
                  )}
                </div>
                {previewUrl && (
                  <div className="mt-4">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-w-full h-48 object-cover rounded-lg border"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Prompt Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {mode === 'generate' ? 'Describe the image you want to create' :
                 mode === 'edit' ? 'Describe how you want to edit the image' :
                 'The image will be used to create variations'}
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  mode === 'generate' ? 'A beautiful sunset over mountains...' :
                  mode === 'edit' ? 'Make it more vibrant and add clouds...' :
                  'Upload an image to create variations'
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                disabled={mode === 'variation'}
              />
            </div>

            {/* Settings */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Settings className="h-4 w-4 text-gray-600" />
                <h4 className="font-medium text-gray-900">Settings</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model
                  </label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="dall-e-3">DALL-E 3</option>
                    <option value="dall-e-2">DALL-E 2</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Size
                  </label>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1024x1024">1024x1024</option>
                    <option value="1792x1024">1792x1024</option>
                    <option value="1024x1792">1024x1792</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quality
                  </label>
                  <select
                    value={quality}
                    onChange={(e) => setQuality(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="standard">Standard</option>
                    <option value="hd">HD</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleAction}
              disabled={isLoading || (mode !== 'generate' && !selectedFile) || (mode !== 'variation' && !prompt.trim())}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Wand2 className="h-5 w-5" />
                  <span>
                    {mode === 'generate' ? 'Generate Image' :
                     mode === 'edit' ? 'Edit Image' :
                     'Create Variation'}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Right Panel - Output */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Generated Image</h3>
            <div className="bg-gray-50 rounded-lg p-6 min-h-[400px] flex items-center justify-center">
              {generatedImage ? (
                <div className="w-full">
                  <img
                    src={generatedImage}
                    alt="Generated"
                    className="max-w-full h-auto rounded-lg shadow-lg"
                  />
                  <div className="mt-4 flex space-x-3">
                    <button
                      onClick={() => downloadImage(generatedImage, `ai-generated-${Date.now()}.png`)}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={clearAll}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  
                  {/* Security Badge */}
                  <div className="mt-3 flex items-center justify-center space-x-2 text-xs text-gray-500">
                    <Shield className="h-3 w-3" />
                    <span>Secure download with authentication</span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <Image className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p>Generated image will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Download Progress */}
      <DownloadProgress
        isVisible={downloadProgress.isVisible}
        progress={downloadProgress.progress}
        filename={downloadProgress.filename}
        fileSize={downloadProgress.fileSize}
        status={downloadProgress.status}
        onCancel={() => setDownloadProgress(prev => ({ ...prev, isVisible: false }))}
        onRetry={() => {
          if (generatedImage) {
            downloadImage(generatedImage, downloadProgress.filename);
          }
        }}
      />
    </div>
  );
};

export default ImageEditor; 