import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { 
  Send, 
  Bot, 
  User, 
  Settings, 
  Loader2, 
  MessageSquare,
  Clock,
  Trash2,
  Archive,
  Edit3,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  Brain,
  Globe,
  World
} from 'lucide-react';
import toast from 'react-hot-toast';
import GlobalAIProvider from './GlobalAIProvider';

const AdvancedChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('openai');
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [providers, setProviders] = useState({});
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showGlobalProvider, setShowGlobalProvider] = useState(false);
  const [settings, setSettings] = useState({
    temperature: 0.7,
    maxTokens: 1000,
    systemPrompt: ''
  });
  const [sessionId, setSessionId] = useState(localStorage.getItem('chatSessionId') || null);
  const [userId, setUserId] = useState(localStorage.getItem('userId') || `user-${Date.now()}`);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize session
  useEffect(() => {
    if (!sessionId) {
      const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);
      localStorage.setItem('chatSessionId', newSessionId);
    }
    localStorage.setItem('userId', userId);
  }, [sessionId, userId]);

  // Fetch AI providers
  useEffect(() => {
    fetchProviders();
    fetchChatHistory();
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await axios.get('/api/chat/providers');
      setProviders(response.data.providers);
      setSelectedProvider(response.data.defaultProvider);
      setSelectedModel(response.data.defaultModel);
    } catch (error) {
      console.error('Error fetching providers:', error);
      toast.error('Failed to load AI providers');
    }
  };

  const fetchChatHistory = async () => {
    try {
      const response = await axios.get('/api/chat/history', {
        headers: {
          'x-session-id': sessionId,
          'x-user-id': userId
        }
      });
      setChatHistory(response.data.chats);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
      provider: selectedProvider,
      model: selectedModel
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post('/api/chat/send', {
        message: inputMessage,
        provider: selectedProvider,
        model: selectedModel,
        settings,
        chatId: currentChatId
      }, {
        headers: {
          'x-session-id': sessionId,
          'x-user-id': userId
        }
      });

      if (response.data.success) {
        setCurrentChatId(response.data.chatId);
        
        // Poll for job completion
        await pollJobStatus(response.data.jobId, selectedProvider);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      
      // Add error message
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        error: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const pollJobStatus = async (jobId, provider) => {
    const maxAttempts = 30;
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await axios.get(`/api/chat/job/${jobId}?provider=${provider}`, {
          headers: {
            'x-session-id': sessionId,
            'x-user-id': userId
          }
        });

        if (response.data.success) {
          const { state, result, failedReason } = response.data.job;

          if (state === 'completed' && result) {
            // Add AI response
            setMessages(prev => [...prev, {
              id: Date.now(),
              role: 'assistant',
              content: result.content || result,
              timestamp: new Date(),
              provider: selectedProvider,
              model: selectedModel,
              tokens: result.tokens,
              cost: result.cost
            }]);
            return;
          } else if (state === 'failed') {
            throw new Error(failedReason || 'Job failed');
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        } else {
          throw new Error('Request timeout');
        }
      } catch (error) {
        console.error('Error polling job status:', error);
        toast.error('Failed to get response');
        setMessages(prev => [...prev, {
          id: Date.now(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
          error: true
        }]);
      }
    };

    poll();
  };

  const loadChat = async (chatId) => {
    try {
      const response = await axios.get(`/api/chat/chat/${chatId}`, {
        headers: {
          'x-session-id': sessionId,
          'x-user-id': userId
        }
      });

      if (response.data.success) {
        setCurrentChatId(chatId);
        setMessages(response.data.messages);
        setSelectedProvider(response.data.chat.aiProvider);
        setSelectedModel(response.data.chat.model);
        setSettings(response.data.chat.settings);
        setShowHistory(false);
      }
    } catch (error) {
      console.error('Error loading chat:', error);
      toast.error('Failed to load chat');
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    setShowHistory(false);
  };

  const updateChatTitle = async (chatId, title) => {
    try {
      await axios.put(`/api/chat/chat/${chatId}/title`, { title }, {
        headers: {
          'x-session-id': sessionId,
          'x-user-id': userId
        }
      });
      fetchChatHistory();
    } catch (error) {
      console.error('Error updating chat title:', error);
    }
  };

  const archiveChat = async (chatId) => {
    try {
      await axios.put(`/api/chat/chat/${chatId}/archive`, {}, {
        headers: {
          'x-session-id': sessionId,
          'x-user-id': userId
        }
      });
      fetchChatHistory();
      if (currentChatId === chatId) {
        startNewChat();
      }
    } catch (error) {
      console.error('Error archiving chat:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getProviderIcon = (provider) => {
    switch (provider) {
      case 'openai': return <Sparkles className="h-4 w-4" />;
      case 'claude': return <Brain className="h-4 w-4" />;
      case 'gemini': return <Globe className="h-4 w-4" />;
      case 'huggingface': return <Zap className="h-4 w-4" />;
      default: return <Bot className="h-4 w-4" />;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">چت هوش مصنوعی</h2>
            <button
              onClick={startNewChat}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="چت جدید"
            >
              <MessageSquare className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center justify-between w-full p-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span>تاریخچه چت</span>
              {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            
            {showHistory && (
              <div className="mt-2 space-y-1">
                {chatHistory.map((chat) => (
                  <div
                    key={chat.id}
                    className={`p-2 rounded-lg cursor-pointer transition-colors ${
                      currentChatId === chat.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => loadChat(chat.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getProviderIcon(chat.aiProvider)}
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {chat.title}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const newTitle = prompt('عنوان جدید:', chat.title);
                            if (newTitle) updateChatTitle(chat.id, newTitle);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="ویرایش عنوان"
                        >
                          <Edit3 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            archiveChat(chat.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="آرشیو"
                        >
                          <Archive className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">
                        {formatDate(chat.updatedAt)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {chat.messageCount} پیام
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Settings */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center space-x-2 w-full p-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span>تنظیمات</span>
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {getProviderIcon(selectedProvider)}
                <span className="font-medium text-gray-900">
                  {providers[selectedProvider]?.name || selectedProvider}
                </span>
              </div>
              <span className="text-sm text-gray-500">
                {providers[selectedProvider]?.models?.find(m => m.id === selectedModel)?.name || selectedModel}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowGlobalProvider(!showGlobalProvider)}
                className="flex items-center space-x-2 px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <World className="h-4 w-4" />
                <span>انتخاب جهانی</span>
              </button>
              
              <select
                value={selectedProvider}
                onChange={(e) => {
                  setSelectedProvider(e.target.value);
                  const providerModels = providers[e.target.value]?.models || [];
                  if (providerModels.length > 0) {
                    setSelectedModel(providerModels[0].id);
                  }
                }}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(providers).map(([key, provider]) => (
                  <option key={key} value={key}>
                    {provider.name}
                  </option>
                ))}
              </select>
              
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {providers[selectedProvider]?.models?.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  شروع چت با هوش مصنوعی
                </h3>
                <p className="text-gray-500">
                  پیام خود را بنویسید و با یکی از مدل‌های هوش مصنوعی چت کنید
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-3xl px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : message.error
                      ? 'bg-red-100 text-red-800'
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0 mt-1">
                        {getProviderIcon(message.provider || selectedProvider)}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                        <span>{formatDate(message.timestamp)}</span>
                        {message.tokens && (
                          <span>{message.tokens} توکن</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                  <span className="text-gray-500">در حال پردازش...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex items-end space-x-4">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="پیام خود را بنویسید..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={1}
                disabled={isLoading}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>ارسال</span>
            </button>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="w-80 bg-white border-l border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">تنظیمات</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                دما (Temperature)
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={settings.temperature}
                onChange={(e) => setSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                className="w-full"
              />
              <span className="text-sm text-gray-500">{settings.temperature}</span>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                حداکثر توکن
              </label>
              <input
                type="number"
                min="1"
                max="4000"
                value={settings.maxTokens}
                onChange={(e) => setSettings(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                پیام سیستمی
              </label>
              <textarea
                value={settings.systemPrompt}
                onChange={(e) => setSettings(prev => ({ ...prev, systemPrompt: e.target.value }))}
                placeholder="دستورالعمل‌های خاص برای مدل..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
          </div>
        </div>
      )}

      {/* Global AI Provider Selector */}
      {showGlobalProvider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <GlobalAIProvider
                onProviderSelect={(providerId, model) => {
                  setSelectedProvider(providerId);
                  setSelectedModel(model);
                  setShowGlobalProvider(false);
                }}
                selectedProvider={selectedProvider}
                selectedModel={selectedModel}
              />
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowGlobalProvider(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedChat; 