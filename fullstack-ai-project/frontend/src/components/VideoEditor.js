import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import ReactPlayer from 'react-player';
import axios from 'axios';
import { 
  Upload, 
  Video, 
  Wand2, 
  Download, 
  Settings,
  Loader2,
  Play,
  Pause,
  RotateCcw,
  Shield,
  CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import downloadService from '../services/downloadService';
import DownloadProgress from './DownloadProgress';

const VideoEditor = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [generatedVideo, setGeneratedVideo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('stability-ai/stable-video-diffusion');
  const [duration, setDuration] = useState(4);
  const [fps, setFps] = useState(6);
  const [strength, setStrength] = useState(0.8);
  const [mode, setMode] = useState('generate'); // generate, edit, process
  const [isPlaying, setIsPlaying] = useState(false);
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
      setGeneratedVideo(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm']
    },
    maxFiles: 1
  });

  const generateVideo = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('/api/generate-video', {
        prompt,
        model,
        duration,
        fps
      });

      setGeneratedVideo(response.data.videoUrl);
      toast.success('Video generated successfully!');
    } catch (error) {
      console.error('Error generating video:', error);
      toast.error(error.response?.data?.error || 'Failed to generate video');
    } finally {
      setIsLoading(false);
    }
  };

  const editVideo = async () => {
    if (!selectedFile || !prompt.trim()) {
      toast.error('Please select a video and enter a prompt');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('video', selectedFile);
      formData.append('prompt', prompt);
      formData.append('model', model);
      formData.append('strength', strength);

      const response = await axios.post('/api/edit-video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setGeneratedVideo(response.data.videoUrl);
      toast.success('Video edited successfully!');
    } catch (error) {
      console.error('Error editing video:', error);
      toast.error(error.response?.data?.error || 'Failed to edit video');
    } finally {
      setIsLoading(false);
    }
  };

  const processVideo = async () => {
    if (!selectedFile) {
      toast.error('Please select a video');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('video', selectedFile);
      formData.append('format', 'mp4');
      formData.append('quality', 'medium');
      formData.append('fps', '30');

      const response = await axios.post('/api/process-video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setGeneratedVideo(response.data.processedVideoPath);
      toast.success('Video processed successfully!');
    } catch (error) {
      console.error('Error processing video:', error);
      toast.error(error.response?.data?.error || 'Failed to process video');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = () => {
    switch (mode) {
      case 'generate':
        generateVideo();
        break;
      case 'edit':
        editVideo();
        break;
      case 'process':
        processVideo();
        break;
      default:
        break;
    }
  };

  const downloadVideo = async (url, filename = 'generated-video.mp4') => {
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
      toast.success('Video downloaded successfully!');
      
      // Hide progress after 3 seconds
      setTimeout(() => {
        setDownloadProgress(prev => ({ ...prev, isVisible: false }));
      }, 3000);

    } catch (error) {
      console.error('Download failed:', error);
      setDownloadProgress(prev => ({ ...prev, status: 'error' }));
      toast.error(error.message || 'Failed to download video');
    }
  };

  const clearAll = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setGeneratedVideo(null);
    setPrompt('');
    setIsPlaying(false);
  };

  const formatDuration = (seconds) => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Video className="h-8 w-8 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900">AI Video Editor</h2>
        </div>

        {/* Mode Selection */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setMode('generate')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === 'generate'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Wand2 className="h-4 w-4 inline mr-2" />
            Generate
          </button>
          <button
            onClick={() => setMode('edit')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === 'edit'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <RotateCcw className="h-4 w-4 inline mr-2" />
            Edit
          </button>
          <button
            onClick={() => setMode('process')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === 'process'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Settings className="h-4 w-4 inline mr-2" />
            Process
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Input */}
          <div className="space-y-6">
            {/* File Upload */}
            {(mode === 'edit' || mode === 'process') && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Upload Video</h3>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  {isDragActive ? (
                    <p className="text-purple-600">Drop the video here...</p>
                  ) : (
                    <div>
                      <p className="text-gray-600 mb-2">
                        Drag & drop a video here, or click to select
                      </p>
                      <p className="text-sm text-gray-500">
                        Supports: MP4, AVI, MOV, WMV, FLV, WebM
                      </p>
                    </div>
                  )}
                </div>
                {previewUrl && (
                  <div className="mt-4">
                    <div className="relative">
                      <ReactPlayer
                        url={previewUrl}
                        width="100%"
                        height="200px"
                        controls
                        playing={isPlaying}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Prompt Input */}
            {(mode === 'generate' || mode === 'edit') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {mode === 'generate' ? 'Describe the video you want to create' :
                   'Describe how you want to edit the video'}
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    mode === 'generate' ? 'A beautiful sunset over mountains with flowing clouds...' :
                    'Make it more vibrant and add dramatic lighting...'
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={4}
                />
              </div>
            )}

            {/* Settings */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Settings className="h-4 w-4 text-gray-600" />
                <h4 className="font-medium text-gray-900">Settings</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model
                  </label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="stability-ai/stable-video-diffusion">Stable Video Diffusion</option>
                    <option value="runwayml/stable-video-diffusion">RunwayML Video Diffusion</option>
                    <option value="zeroscope-xl">Zeroscope XL</option>
                  </select>
                </div>
                
                {mode === 'generate' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duration (seconds)
                      </label>
                      <input
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(parseInt(e.target.value))}
                        min="1"
                        max="10"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        FPS
                      </label>
                      <input
                        type="number"
                        value={fps}
                        onChange={(e) => setFps(parseInt(e.target.value))}
                        min="1"
                        max="30"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </>
                )}
                
                {mode === 'edit' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Strength
                    </label>
                    <input
                      type="range"
                      value={strength}
                      onChange={(e) => setStrength(parseFloat(e.target.value))}
                      min="0"
                      max="1"
                      step="0.1"
                      className="w-full"
                    />
                    <div className="text-sm text-gray-500 mt-1">{strength}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleAction}
              disabled={isLoading || (mode !== 'generate' && !selectedFile) || (mode !== 'process' && !prompt.trim())}
              className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
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
                    {mode === 'generate' ? 'Generate Video' :
                     mode === 'edit' ? 'Edit Video' :
                     'Process Video'}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Right Panel - Output */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Generated Video</h3>
            <div className="bg-gray-50 rounded-lg p-6 min-h-[400px] flex items-center justify-center">
              {generatedVideo ? (
                <div className="w-full">
                  <div className="relative">
                    <ReactPlayer
                      url={generatedVideo}
                      width="100%"
                      height="300px"
                      controls
                      playing={false}
                    />
                  </div>
                  <div className="mt-4 flex space-x-3">
                    <button
                      onClick={() => downloadVideo(generatedVideo, `ai-generated-video-${Date.now()}.mp4`)}
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
                  <Video className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p>Generated video will appear here</p>
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
          if (generatedVideo) {
            downloadVideo(generatedVideo, downloadProgress.filename);
          }
        }}
      />
    </div>
  );
};

export default VideoEditor; 