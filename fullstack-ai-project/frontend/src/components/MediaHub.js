import React, { useState } from 'react';
import { Image, Video, Palette, Film, Settings, Home } from 'lucide-react';
import ImageEditor from './ImageEditor';
import VideoEditor from './VideoEditor';
import { Toaster } from 'react-hot-toast';

const MediaHub = () => {
  const [activeTab, setActiveTab] = useState('image');

  const tabs = [
    {
      id: 'image',
      name: 'Image Editor',
      icon: Image,
      description: 'Generate, edit, and create variations of images with AI'
    },
    {
      id: 'video',
      name: 'Video Editor',
      icon: Video,
      description: 'Generate, edit, and process videos with AI'
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'image':
        return <ImageEditor />;
      case 'video':
        return <VideoEditor />;
      default:
        return <ImageEditor />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Palette className="h-8 w-8 text-gradient-to-r from-blue-600 to-purple-600" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AI Media Hub
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <a
                href="/"
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <Home className="h-4 w-4" />
                <span>Back to Chat</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="h-5 w-5" />
                    <span>{tab.name}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Description */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <p className="text-gray-600 text-sm">
            {tabs.find(tab => tab.id === activeTab)?.description}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="py-6">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center text-gray-500 text-sm">
            <p>Powered by OpenAI DALL-E, Stable Video Diffusion, and other AI models</p>
            <p className="mt-1">Upload and process your media securely with AI assistance</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MediaHub; 