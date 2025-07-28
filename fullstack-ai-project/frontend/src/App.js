import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Bot, User, Settings, Loader2, Palette, MessageSquare, Sparkles, Edit3 } from 'lucide-react';
import MediaHub from './components/MediaHub';
import AdvancedChat from './components/AdvancedChat';
import MediaEditor from './components/MediaEditor';

function App() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [availableModels, setAvailableModels] = useState([]);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [currentView, setCurrentView] = useState('advanced-chat'); // 'chat', 'advanced-chat', 'media', or 'media-editor'
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchAvailableModels();
  }, []);

  const fetchAvailableModels = async () => {
    try {
      const response = await axios.get('/api/models');
      setAvailableModels(response.data.models);
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };

  const getModelEndpoint = (modelId) => {
    if (modelId.startsWith('gpt')) {
      return '/api/chat';
    } else if (modelId.startsWith('claude')) {
      return '/api/claude';
    } else if (modelId.startsWith('gemini')) {
      return '/api/gemini';
    } else {
      return '/api/huggingface';
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const endpoint = getModelEndpoint(selectedModel);
      const response = await axios.post(endpoint, {
        message: inputMessage,
        model: selectedModel
      });

      const aiMessage = {
        id: Date.now() + 1,
        text: response.data.response,
        sender: 'ai',
        model: response.data.model,
        timestamp: new Date().toISOString(),
        usage: response.data.usage
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        text: error.response?.data?.error || 'Failed to get response from AI',
        sender: 'error',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const getModelDisplayName = (modelId) => {
    const model = availableModels.find(m => m.id === modelId);
    return model ? model.name : modelId;
  };

  const getModelProvider = (modelId) => {
    const model = availableModels.find(m => m.id === modelId);
    return model ? model.provider : 'Unknown';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bot className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">AI Chat Assistant</h1>
              <p className="text-sm text-gray-500">Multi-model AI conversation</p>
            </div>
          </div>
          
                                       <div className="flex items-center space-x-4">
                   <button
                     onClick={() => setCurrentView('advanced-chat')}
                     className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                       currentView === 'advanced-chat' 
                         ? 'bg-blue-600 text-white' 
                         : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                     }`}
                   >
                     <Sparkles className="h-4 w-4" />
                     <span>چت پیشرفته</span>
                   </button>
                   <button
                     onClick={() => setCurrentView('chat')}
                     className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                       currentView === 'chat' 
                         ? 'bg-blue-600 text-white' 
                         : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                     }`}
                   >
                     <MessageSquare className="h-4 w-4" />
                     <span>چت ساده</span>
                   </button>
                                      <button
                     onClick={() => setCurrentView('media')}
                     className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                       currentView === 'media'
                         ? 'bg-purple-600 text-white'
                         : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                     }`}
                   >
                     <Palette className="h-4 w-4" />
                     <span>Media Hub</span>
                   </button>
                   <button
                     onClick={() => setCurrentView('media-editor')}
                     className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                       currentView === 'media-editor'
                         ? 'bg-green-600 text-white'
                         : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                     }`}
                   >
                     <Edit3 className="h-4 w-4" />
                     <span>ویرایشگر چندرسانه‌ای</span>
                   </button>
              
              <div className="relative">
                <button
                  onClick={() => setShowModelSelector(!showModelSelector)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  <span>{getModelDisplayName(selectedModel)}</span>
                </button>
              
              {showModelSelector && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-3">Select AI Model</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {availableModels.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => {
                            setSelectedModel(model.id);
                            setShowModelSelector(false);
                          }}
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            selectedModel === model.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          } ${!model.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                          disabled={!model.available}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">{model.name}</div>
                              <div className="text-sm text-gray-500">{model.provider}</div>
                              <div className="text-xs text-gray-400">{model.description}</div>
                            </div>
                            {!model.available && (
                              <span className="text-xs text-red-500">Not configured</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={clearChat}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Clear Chat
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {currentView === 'advanced-chat' ? (
        <AdvancedChat />
      ) : currentView === 'chat' ? (
        <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[600px] flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-20">
                <Bot className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Start a conversation with {getModelDisplayName(selectedModel)}</p>
                <p className="text-sm">Ask anything and get AI-powered responses</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : message.sender === 'error'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.sender === 'user' ? (
                        <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="whitespace-pre-wrap">{message.text}</p>
                        {message.model && (
                          <p className="text-xs opacity-70 mt-1">
                            {getModelProvider(message.model)} • {message.model}
                          </p>
                        )}
                        {message.usage && (
                          <p className="text-xs opacity-70">
                            Tokens: {message.usage.prompt_tokens || message.usage.input_tokens || 0} → {message.usage.response_tokens || message.usage.output_tokens || 0}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-gray-600">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex space-x-3">
              <div className="flex-1">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Message ${getModelDisplayName(selectedModel)}...`}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="1"
                  disabled={isLoading}
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>Send</span>
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Press Enter to send, Shift+Enter for new line
            </div>
          </div>
        </div>
      </div>
                   ) : currentView === 'media-editor' ? (
               <MediaEditor />
             ) : (
               <MediaHub />
             )}
    </div>
  );
}

export default App; 