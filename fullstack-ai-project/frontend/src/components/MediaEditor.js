import React, { useState, useRef, useCallback } from 'react';
import { 
  Video, 
  Image, 
  Type, 
  Upload, 
  Download, 
  Settings, 
  RotateCw, 
  RotateCcw,
  Crop,
  Filter,
  Palette,
  Volume2,
  Scissors,
  Layers,
  Eye,
  EyeOff,
  Save,
  Undo,
  Redo,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  VolumeX,
  Maximize,
  Minimize,
  X,
  Check,
  AlertCircle,
  Shield,
  Lock,
  Unlock
} from 'lucide-react';
import ReactPlayer from 'react-player';
import toast from 'react-hot-toast';
import downloadService from '../services/downloadService';

const MediaEditor = () => {
  const [activeTab, setActiveTab] = useState('image');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [editedFile, setEditedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({
    isVisible: false,
    progress: 0,
    filename: '',
    fileSize: 0,
    status: 'downloading'
  });
  const [editHistory, setEditHistory] = useState([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [securityLevel, setSecurityLevel] = useState('standard'); // standard, enhanced, enterprise

  // Image editing states
  const [imageSettings, setImageSettings] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0,
    blur: 0,
    sharpen: 0,
    gamma: 1,
    exposure: 0,
    temperature: 0,
    tint: 0,
    highlights: 0,
    shadows: 0,
    whites: 0,
    blacks: 0,
    clarity: 0,
    vibrance: 0,
    saturation: 100
  });

  // Video editing states
  const [videoSettings, setVideoSettings] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0,
    blur: 0,
    sharpen: 0,
    gamma: 1,
    exposure: 0,
    temperature: 0,
    tint: 0,
    highlights: 0,
    shadows: 0,
    whites: 0,
    blacks: 0,
    clarity: 0,
    vibrance: 0,
    saturation: 100,
    fps: 30,
    resolution: '1080p',
    codec: 'h264',
    bitrate: 'medium'
  });

  // Text editing states
  const [textSettings, setTextSettings] = useState({
    content: '',
    fontSize: 16,
    fontFamily: 'Arial',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'left',
    color: '#000000',
    backgroundColor: 'transparent',
    opacity: 1,
    lineHeight: 1.5,
    letterSpacing: 0,
    textShadow: 'none',
    border: 'none',
    borderRadius: 0,
    padding: 0,
    margin: 0
  });

  const fileInputRef = useRef(null);
  const playerRef = useRef(null);
  const canvasRef = useRef(null);

  // File upload handling
  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileType = file.type.split('/')[0];
    const allowedTypes = {
      image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'],
      video: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm'],
      text: ['text/plain', 'text/html', 'text/css', 'text/javascript', 'application/json']
    };

    if (!allowedTypes[activeTab].includes(file.type)) {
      toast.error('فرمت فایل پشتیبانی نمی‌شود');
      return;
    }

    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      toast.error('حجم فایل نباید بیشتر از ۱۰۰ مگابایت باشد');
      return;
    }

    setUploadedFile(file);
    setEditedFile(null);
    setEditHistory([]);
    setCurrentStep(-1);
    toast.success('فایل با موفقیت آپلود شد');
  }, [activeTab]);

  // Image editing functions
  const applyImageEdit = async (settings) => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('settings', JSON.stringify(settings));
      formData.append('securityLevel', securityLevel);

      const response = await fetch('/api/media/edit-image', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('خطا در پردازش تصویر');
      }

      const result = await response.json();
      setEditedFile(result.editedFileUrl);
      addToHistory('image', settings);
      toast.success('تصویر با موفقیت ویرایش شد');
    } catch (error) {
      console.error('Image editing error:', error);
      toast.error(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Video editing functions
  const applyVideoEdit = async (settings) => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('settings', JSON.stringify(settings));
      formData.append('securityLevel', securityLevel);

      const response = await fetch('/api/media/edit-video', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('خطا در پردازش ویدیو');
      }

      const result = await response.json();
      setEditedFile(result.editedFileUrl);
      addToHistory('video', settings);
      toast.success('ویدیو با موفقیت ویرایش شد');
    } catch (error) {
      console.error('Video editing error:', error);
      toast.error(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Text editing functions
  const applyTextEdit = async (settings) => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('settings', JSON.stringify(settings));
      formData.append('securityLevel', securityLevel);

      const response = await fetch('/api/media/edit-text', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('خطا در پردازش متن');
      }

      const result = await response.json();
      setEditedFile(result.editedFileUrl);
      addToHistory('text', settings);
      toast.success('متن با موفقیت ویرایش شد');
    } catch (error) {
      console.error('Text editing error:', error);
      toast.error(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // History management
  const addToHistory = (type, settings) => {
    const newStep = {
      id: Date.now(),
      type,
      settings: { ...settings },
      timestamp: new Date().toISOString()
    };

    setEditHistory(prev => {
      const newHistory = prev.slice(0, currentStep + 1);
      return [...newHistory, newStep];
    });
    setCurrentStep(prev => prev + 1);
  };

  const undo = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      const previousSettings = editHistory[currentStep - 1];
      if (previousSettings) {
        switch (previousSettings.type) {
          case 'image':
            setImageSettings(previousSettings.settings);
            break;
          case 'video':
            setVideoSettings(previousSettings.settings);
            break;
          case 'text':
            setTextSettings(previousSettings.settings);
            break;
        }
      }
    }
  };

  const redo = () => {
    if (currentStep < editHistory.length - 1) {
      setCurrentStep(prev => prev + 1);
      const nextSettings = editHistory[currentStep + 1];
      if (nextSettings) {
        switch (nextSettings.type) {
          case 'image':
            setImageSettings(nextSettings.settings);
            break;
          case 'video':
            setVideoSettings(nextSettings.settings);
            break;
          case 'text':
            setTextSettings(nextSettings.settings);
            break;
        }
      }
    }
  };

  // Download functionality
  const downloadEditedFile = async () => {
    if (!editedFile) return;

    try {
      setDownloadProgress({
        isVisible: true,
        progress: 0,
        filename: `edited-${uploadedFile.name}`,
        fileSize: 0,
        status: 'downloading'
      });

      const fileSize = await downloadService.getFileSize(editedFile);
      setDownloadProgress(prev => ({ ...prev, fileSize }));

      await downloadService.downloadWithProgress(editedFile, `edited-${uploadedFile.name}`, (progress, loaded, total) => {
        setDownloadProgress(prev => ({
          ...prev,
          progress,
          fileSize: total
        }));
      });

      setDownloadProgress(prev => ({ ...prev, status: 'completed', progress: 100 }));
      toast.success('فایل با موفقیت دانلود شد');

      setTimeout(() => {
        setDownloadProgress(prev => ({ ...prev, isVisible: false }));
      }, 3000);

    } catch (error) {
      console.error('Download failed:', error);
      setDownloadProgress(prev => ({ ...prev, status: 'error' }));
      toast.error(error.message || 'خطا در دانلود فایل');
    }
  };

  // Video player controls
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value) => {
    setCurrentTime(value);
    if (playerRef.current) {
      playerRef.current.seekTo(value / duration);
    }
  };

  const handleVolumeChange = (value) => {
    setVolume(value);
    setMuted(value === 0);
  };

  const handleMute = () => {
    setMuted(!muted);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Security level indicators
  const getSecurityIcon = () => {
    switch (securityLevel) {
      case 'enhanced':
        return <Shield className="h-4 w-4 text-yellow-500" />;
      case 'enterprise':
        return <Lock className="h-4 w-4 text-green-500" />;
      default:
        return <Unlock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSecurityText = () => {
    switch (securityLevel) {
      case 'enhanced':
        return 'امنیت پیشرفته';
      case 'enterprise':
        return 'امنیت سازمانی';
      default:
        return 'امنیت استاندارد';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">ابزار ویرایش چندرسانه‌ای</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {getSecurityIcon()}
              <span className="text-sm text-gray-600">{getSecurityText()}</span>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Settings className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Security Settings */}
        {showSettings && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">تنظیمات امنیتی</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="standard"
                  name="security"
                  value="standard"
                  checked={securityLevel === 'standard'}
                  onChange={(e) => setSecurityLevel(e.target.value)}
                />
                <label htmlFor="standard" className="text-sm">
                  <Unlock className="h-4 w-4 text-blue-500 inline mr-1" />
                  استاندارد
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="enhanced"
                  name="security"
                  value="enhanced"
                  checked={securityLevel === 'enhanced'}
                  onChange={(e) => setSecurityLevel(e.target.value)}
                />
                <label htmlFor="enhanced" className="text-sm">
                  <Shield className="h-4 w-4 text-yellow-500 inline mr-1" />
                  پیشرفته
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="enterprise"
                  name="security"
                  value="enterprise"
                  checked={securityLevel === 'enterprise'}
                  onChange={(e) => setSecurityLevel(e.target.value)}
                />
                <label htmlFor="enterprise" className="text-sm">
                  <Lock className="h-4 w-4 text-green-500 inline mr-1" />
                  سازمانی
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('image')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'image'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Image className="h-4 w-4" />
            <span>ویرایش تصویر</span>
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'video'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Video className="h-4 w-4" />
            <span>ویرایش ویدیو</span>
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'text'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Type className="h-4 w-4" />
            <span>ویرایش متن</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* File Upload */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">آپلود فایل</h2>
            
            {/* Upload Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">برای آپلود فایل کلیک کنید</p>
              <p className="text-sm text-gray-500">
                {activeTab === 'image' && 'فرمت‌های پشتیبانی شده: JPG, PNG, GIF, WebP, BMP'}
                {activeTab === 'video' && 'فرمت‌های پشتیبانی شده: MP4, AVI, MOV, WMV, FLV, WebM'}
                {activeTab === 'text' && 'فرمت‌های پشتیبانی شده: TXT, HTML, CSS, JS, JSON'}
              </p>
              <p className="text-xs text-gray-400 mt-2">حداکثر حجم: ۱۰۰ مگابایت</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept={
                activeTab === 'image' ? 'image/*' :
                activeTab === 'video' ? 'video/*' :
                'text/*,.json,.html,.css,.js'
              }
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* File Info */}
            {uploadedFile && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">اطلاعات فایل</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>نام:</strong> {uploadedFile.name}</p>
                  <p><strong>حجم:</strong> {(uploadedFile.size / 1024 / 1024).toFixed(2)} مگابایت</p>
                  <p><strong>نوع:</strong> {uploadedFile.type}</p>
                  <p><strong>آخرین تغییر:</strong> {new Date(uploadedFile.lastModified).toLocaleDateString('fa-IR')}</p>
                </div>
              </div>
            )}

            {/* History Controls */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex space-x-2">
                <button
                  onClick={undo}
                  disabled={currentStep <= 0}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="بازگشت"
                >
                  <Undo className="h-4 w-4" />
                </button>
                <button
                  onClick={redo}
                  disabled={currentStep >= editHistory.length - 1}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="تکرار"
                >
                  <Redo className="h-4 w-4" />
                </button>
              </div>
              <span className="text-sm text-gray-500">
                {currentStep + 1} / {editHistory.length}
              </span>
            </div>
          </div>
        </div>

        {/* Editing Tools */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">ابزارهای ویرایش</h2>
            
            {activeTab === 'image' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">روشنایی</label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={imageSettings.brightness}
                    onChange={(e) => setImageSettings(prev => ({ ...prev, brightness: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-500">{imageSettings.brightness}%</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">کنتراست</label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={imageSettings.contrast}
                    onChange={(e) => setImageSettings(prev => ({ ...prev, contrast: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-500">{imageSettings.contrast}%</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">اشباع رنگ</label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={imageSettings.saturation}
                    onChange={(e) => setImageSettings(prev => ({ ...prev, saturation: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-500">{imageSettings.saturation}%</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">تیرگی</label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={imageSettings.blur}
                    onChange={(e) => setImageSettings(prev => ({ ...prev, blur: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-500">{imageSettings.blur}px</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">تیز کردن</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={imageSettings.sharpen}
                    onChange={(e) => setImageSettings(prev => ({ ...prev, sharpen: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-500">{imageSettings.sharpen}%</span>
                </div>

                <button
                  onClick={() => applyImageEdit(imageSettings)}
                  disabled={!uploadedFile || isProcessing}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>در حال پردازش...</span>
                    </>
                  ) : (
                    <>
                      <Crop className="h-4 w-4" />
                      <span>اعمال تغییرات</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {activeTab === 'video' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">روشنایی</label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={videoSettings.brightness}
                    onChange={(e) => setVideoSettings(prev => ({ ...prev, brightness: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-500">{videoSettings.brightness}%</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">کنتراست</label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={videoSettings.contrast}
                    onChange={(e) => setVideoSettings(prev => ({ ...prev, contrast: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-500">{videoSettings.contrast}%</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">فریم در ثانیه</label>
                  <select
                    value={videoSettings.fps}
                    onChange={(e) => setVideoSettings(prev => ({ ...prev, fps: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={24}>24 FPS</option>
                    <option value={30}>30 FPS</option>
                    <option value={60}>60 FPS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">کیفیت</label>
                  <select
                    value={videoSettings.resolution}
                    onChange={(e) => setVideoSettings(prev => ({ ...prev, resolution: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="720p">720p</option>
                    <option value="1080p">1080p</option>
                    <option value="4k">4K</option>
                  </select>
                </div>

                <button
                  onClick={() => applyVideoEdit(videoSettings)}
                  disabled={!uploadedFile || isProcessing}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>در حال پردازش...</span>
                    </>
                  ) : (
                    <>
                      <Scissors className="h-4 w-4" />
                      <span>اعمال تغییرات</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {activeTab === 'text' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">متن</label>
                  <textarea
                    value={textSettings.content}
                    onChange={(e) => setTextSettings(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="متن خود را وارد کنید..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">اندازه فونت</label>
                  <input
                    type="range"
                    min="8"
                    max="72"
                    value={textSettings.fontSize}
                    onChange={(e) => setTextSettings(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-500">{textSettings.fontSize}px</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">رنگ متن</label>
                  <input
                    type="color"
                    value={textSettings.color}
                    onChange={(e) => setTextSettings(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full h-10 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">فونت</label>
                  <select
                    value={textSettings.fontFamily}
                    onChange={(e) => setTextSettings(prev => ({ ...prev, fontFamily: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                  </select>
                </div>

                <button
                  onClick={() => applyTextEdit(textSettings)}
                  disabled={!uploadedFile || isProcessing}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>در حال پردازش...</span>
                    </>
                  ) : (
                    <>
                      <Type className="h-4 w-4" />
                      <span>اعمال تغییرات</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">پیش‌نمایش</h2>
            
            {!uploadedFile ? (
              <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">فایلی برای نمایش وجود ندارد</p>
                </div>
              </div>
            ) : activeTab === 'image' ? (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={editedFile || URL.createObjectURL(uploadedFile)}
                    alt="Preview"
                    className="w-full h-64 object-contain bg-gray-50 rounded-lg"
                  />
                  {editedFile && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                      ویرایش شده
                    </div>
                  )}
                </div>
              </div>
            ) : activeTab === 'video' ? (
              <div className="space-y-4">
                <div className="relative">
                  <ReactPlayer
                    ref={playerRef}
                    url={editedFile || URL.createObjectURL(uploadedFile)}
                    playing={isPlaying}
                    controls={false}
                    width="100%"
                    height="200px"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onProgress={({ playedSeconds }) => setCurrentTime(playedSeconds)}
                    onDuration={setDuration}
                    volume={muted ? 0 : volume}
                  />
                  
                  {/* Custom Video Controls */}
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={handlePlayPause}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </button>
                      <span className="text-sm text-gray-600">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>
                    
                    <input
                      type="range"
                      min="0"
                      max={duration || 0}
                      value={currentTime}
                      onChange={(e) => handleSeek(parseFloat(e.target.value))}
                      className="w-full"
                    />
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleMute}
                        className="p-1 rounded hover:bg-gray-100 transition-colors"
                      >
                        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  
                  {editedFile && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                      ویرایش شده
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg min-h-32">
                  <div
                    style={{
                      fontSize: `${textSettings.fontSize}px`,
                      fontFamily: textSettings.fontFamily,
                      color: textSettings.color,
                      textAlign: textSettings.textAlign,
                      lineHeight: textSettings.lineHeight,
                      letterSpacing: `${textSettings.letterSpacing}px`,
                      opacity: textSettings.opacity
                    }}
                  >
                    {textSettings.content || 'پیش‌نمایش متن'}
                  </div>
                </div>
              </div>
            )}

            {/* Download Button */}
            {editedFile && (
              <button
                onClick={downloadEditedFile}
                className="w-full mt-4 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>دانلود فایل ویرایش شده</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Download Progress */}
      {downloadProgress.isVisible && (
        <div className="fixed bottom-4 right-4 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Download className="h-5 w-5 text-blue-500" />
              <div>
                <h4 className="font-medium text-gray-900 text-sm truncate">
                  {downloadProgress.filename}
                </h4>
                <p className="text-xs text-gray-500">
                  {downloadProgress.status === 'completed' ? 'دانلود تکمیل شد' : 'در حال دانلود...'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setDownloadProgress(prev => ({ ...prev, isVisible: false }))}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="mb-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-blue-500 transition-all duration-300"
                style={{ width: `${downloadProgress.progress}%` }}
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>{downloadProgress.progress}%</span>
            {downloadProgress.fileSize && (
              <span>
                {((downloadProgress.progress / 100) * downloadProgress.fileSize / 1024 / 1024).toFixed(1)} / {(downloadProgress.fileSize / 1024 / 1024).toFixed(1)} MB
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaEditor; 