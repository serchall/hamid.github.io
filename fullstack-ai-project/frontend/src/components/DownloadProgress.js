import React, { useState, useEffect } from 'react';
import { Download, CheckCircle, XCircle, Pause, Play, Shield, AlertCircle } from 'lucide-react';

const DownloadProgress = ({ 
  isVisible, 
  progress, 
  filename, 
  fileSize, 
  status = 'downloading', // 'downloading', 'completed', 'error', 'paused'
  onCancel,
  onRetry,
  onPause,
  onResume,
  language = 'en' // 'en' or 'fa'
}) => {
  const [isPaused, setIsPaused] = useState(false);

  const translations = {
    en: {
      downloading: 'Downloading...',
      completed: 'Download completed',
      failed: 'Download failed',
      paused: 'Download paused',
      secure: 'Secure download with authentication',
      retry: 'Retry',
      pause: 'Pause',
      resume: 'Resume',
      close: 'Close',
      speed: 'Downloading at high speed...',
      unauthorized: 'Unauthorized access. Please log in.',
      sessionExpired: 'Session expired. Please log in again.'
    },
    fa: {
      downloading: 'در حال دانلود...',
      completed: 'دانلود تکمیل شد',
      failed: 'دانلود ناموفق بود',
      paused: 'دانلود متوقف شد',
      secure: 'دانلود امن با احراز هویت',
      retry: 'تلاش مجدد',
      pause: 'توقف',
      resume: 'ادامه',
      close: 'بستن',
      speed: 'دانلود با سرعت بالا...',
      unauthorized: 'دسترسی غیرمجاز. لطفاً وارد شوید.',
      sessionExpired: 'جلسه منقضی شد. لطفاً دوباره وارد شوید.'
    }
  };

  const t = translations[language] || translations.en;

  const handlePauseResume = () => {
    if (isPaused) {
      setIsPaused(false);
      onResume?.();
    } else {
      setIsPaused(true);
      onPause?.();
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'paused':
        return <Pause className="h-5 w-5 text-yellow-500" />;
      default:
        return <Download className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'completed':
        return t.completed;
      case 'error':
        return t.failed;
      case 'paused':
        return t.paused;
      default:
        return t.downloading;
    }
  };

  const getProgressColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'paused':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-4 ${language === 'fa' ? 'left-4' : 'right-4'} w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50`}>
      {/* Security Header */}
      <div className="flex items-center space-x-2 mb-3 p-2 bg-green-50 rounded-lg border border-green-200">
        <Shield className="h-4 w-4 text-green-600" />
        <span className="text-xs text-green-700 font-medium">{t.secure}</span>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <div>
            <h4 className="font-medium text-gray-900 text-sm truncate">
              {filename}
            </h4>
            <p className="text-xs text-gray-500">{getStatusText()}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          {status === 'downloading' && (
            <button
              onClick={handlePauseResume}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title={isPaused ? t.resume : t.pause}
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </button>
          )}
          
          {status === 'error' && onRetry && (
            <button
              onClick={onRetry}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title={t.retry}
            >
              <Download className="h-4 w-4" />
            </button>
          )}
          
          <button
            onClick={onCancel}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            title={t.close}
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-2">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Progress Details */}
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>{progress}%</span>
        {fileSize && (
          <span>
            {formatFileSize((progress / 100) * fileSize)} / {formatFileSize(fileSize)}
          </span>
        )}
      </div>

      {/* Speed indicator */}
      {status === 'downloading' && (
        <div className="mt-2 text-xs text-gray-400 flex items-center space-x-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span>{t.speed}</span>
        </div>
      )}

      {/* Error details */}
      {status === 'error' && (
        <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-xs text-red-700">
              {language === 'fa' ? t.unauthorized : 'Authentication required'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export default DownloadProgress; 