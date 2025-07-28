import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Search, 
  Filter, 
  Star, 
  TrendingUp, 
  Zap, 
  Shield, 
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const GlobalAIProvider = ({ onProviderSelect, selectedProvider, selectedModel }) => {
  const [providers, setProviders] = useState({});
  const [filteredProviders, setFilteredProviders] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedFeature, setSelectedFeature] = useState('all');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [providerStatuses, setProviderStatuses] = useState({});

  const regions = {
    'all': 'همه مناطق',
    'global': 'جهانی',
    'china': 'چین',
    'japan': 'ژاپن',
    'korea': 'کره جنوبی',
    'russia': 'روسیه',
    'europe': 'اروپا',
    'north-america': 'آمریکای شمالی'
  };

  const features = {
    'all': 'همه قابلیت‌ها',
    'chat': 'چت',
    'image-generation': 'تولید تصویر',
    'code-generation': 'تولید کد',
    'multimodal': 'چندرسانه‌ای',
    'reasoning': 'استدلال',
    'enterprise': 'سازمانی'
  };

  useEffect(() => {
    fetchProviders();
    fetchProviderStatuses();
  }, []);

  useEffect(() => {
    filterProviders();
  }, [providers, searchTerm, selectedRegion, selectedFeature]);

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/chat/providers');
      const data = await response.json();
      setProviders(data.providers);
      setFilteredProviders(data.providers);
    } catch (error) {
      console.error('Error fetching providers:', error);
    }
  };

  const fetchProviderStatuses = async () => {
    try {
      const response = await fetch('/api/chat/providers/status');
      const data = await response.json();
      setProviderStatuses(data.statuses);
    } catch (error) {
      console.error('Error fetching provider statuses:', error);
    }
  };

  const filterProviders = () => {
    let filtered = { ...providers };

    // Filter by search term
    if (searchTerm) {
      filtered = Object.fromEntries(
        Object.entries(filtered).filter(([key, provider]) =>
          provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          provider.models.some(model => model.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      );
    }

    // Filter by region
    if (selectedRegion !== 'all') {
      const regionalProviders = getRegionalProviders(selectedRegion);
      filtered = Object.fromEntries(
        Object.entries(filtered).filter(([key]) => regionalProviders.includes(key))
      );
    }

    // Filter by feature
    if (selectedFeature !== 'all') {
      filtered = Object.fromEntries(
        Object.entries(filtered).filter(([key, provider]) =>
          provider.features.includes(selectedFeature)
        )
      );
    }

    setFilteredProviders(filtered);
  };

  const getRegionalProviders = (region) => {
    const regionalMap = {
      'global': ['openai', 'claude', 'gemini', 'azure', 'meta', 'bedrock', 'cohere', 'ai21', 'perplexity', 'mistral', 'together', 'replicate', 'huggingface', 'deepseek'],
      'china': ['zhipu', 'baichuan', 'qwen', 'sparkdesk', 'ernie', 'minimax', 'moonshot', 'zeroone'],
      'japan': ['claude_jp', 'line'],
      'korea': ['naver', 'kakao'],
      'russia': ['yandex', 'sber'],
      'europe': ['claude_eu', 'alephalpha', 'mistral_eu', 'cohere_eu'],
      'north-america': ['openai', 'claude', 'gemini', 'azure', 'meta', 'bedrock', 'cohere', 'ai21', 'perplexity', 'mistral', 'together', 'replicate', 'huggingface', 'deepseek', 'xai']
    };
    return regionalMap[region] || [];
  };

  const getProviderIcon = (providerId) => {
    const icons = {
      'openai': '🤖',
      'claude': '🧠',
      'gemini': '🔍',
      'qwen': '🌟',
      'sparkdesk': '🔥',
      'zhipu': '📚',
      'baichuan': '🌊',
      'ernie': '💎',
      'azure': '☁️',
      'bedrock': '🏗️',
      'vertex': '🔧',
      'watson': '💡',
      'huggingface': '🤗',
      'mistral': '🌪️',
      'perplexity': '❓',
      'together': '🤝',
      'replicate': '🔄',
      'cohere': '🔗',
      'ai21': '🧬',
      'deepseek': '🔍'
    };
    return icons[providerId] || '🤖';
  };

  const getProviderStatus = (providerId) => {
    const status = providerStatuses[providerId];
    if (!status) return 'unknown';
    return status.status;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational': return 'text-green-500';
      case 'degraded': return 'text-yellow-500';
      case 'outage': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'operational': return <CheckCircle className="h-4 w-4" />;
      case 'degraded': return <AlertCircle className="h-4 w-4" />;
      case 'outage': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getProviderTier = (providerId) => {
    const tiers = {
      'premium': ['openai', 'claude', 'gemini', 'azure', 'bedrock'],
      'enterprise': ['watson', 'palantir', 'databricks', 'snowflake', 'salesforce', 'oracle', 'sap'],
      'emerging': ['qwen', 'sparkdesk', 'zhipu', 'baichuan', 'ernie', 'mistral', 'perplexity'],
      'open-source': ['huggingface', 'together', 'replicate']
    };

    for (const [tier, providers] of Object.entries(tiers)) {
      if (providers.includes(providerId)) {
        return tier;
      }
    }
    return 'standard';
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-blue-100 text-blue-800';
      case 'emerging': return 'bg-green-100 text-green-800';
      case 'open-source': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleProviderSelect = (providerId, model) => {
    onProviderSelect(providerId, model);
  };

  const getTrendingProviders = () => {
    return ['openai', 'claude', 'gemini', 'qwen', 'sparkdesk', 'mistral', 'perplexity'];
  };

  const getNewProviders = () => {
    return ['xai', 'deepmind', 'zeroone', 'moonshot'];
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Globe className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">انتخاب هوش مصنوعی جهانی</h2>
            <p className="text-gray-600">از بین بیش از ۳۰ ارائه‌دهنده هوش مصنوعی انتخاب کنید</p>
          </div>
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          <span>تنظیمات پیشرفته</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="جستجو در ارائه‌دهندگان و مدل‌ها..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(regions).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <select
            value={selectedFeature}
            onChange={(e) => setSelectedFeature(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(features).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">روند رو به رشد</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">جدید</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">امنیت بالا</span>
            </div>
          </div>
        )}
      </div>

      {/* Trending Providers */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-orange-500" />
          <span>روند رو به رشد</span>
        </h3>
        <div className="flex flex-wrap gap-2">
          {getTrendingProviders().map(providerId => {
            const provider = providers[providerId];
            if (!provider) return null;
            return (
              <button
                key={providerId}
                onClick={() => handleProviderSelect(providerId, provider.models[0])}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedProvider === providerId
                    ? 'bg-orange-500 text-white'
                    : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                }`}
              >
                {getProviderIcon(providerId)} {provider.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(filteredProviders).map(([providerId, provider]) => {
          const status = getProviderStatus(providerId);
          const tier = getProviderTier(providerId);
          const isTrending = getTrendingProviders().includes(providerId);
          const isNew = getNewProviders().includes(providerId);

          return (
            <div
              key={providerId}
              className={`border rounded-lg p-4 transition-all hover:shadow-md cursor-pointer ${
                selectedProvider === providerId
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleProviderSelect(providerId, provider.models[0])}
            >
              {/* Provider Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getProviderIcon(providerId)}</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">{provider.name}</h4>
                    <div className="flex items-center space-x-2">
                      <div className={`flex items-center space-x-1 ${getStatusColor(status)}`}>
                        {getStatusIcon(status)}
                        <span className="text-xs">{status}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTierColor(tier)}`}>
                        {tier}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {isTrending && <TrendingUp className="h-4 w-4 text-orange-500" />}
                  {isNew && <Star className="h-4 w-4 text-yellow-500" />}
                </div>
              </div>

              {/* Models */}
              <div className="mb-3">
                <h5 className="text-sm font-medium text-gray-700 mb-2">مدل‌های موجود:</h5>
                <div className="space-y-1">
                  {provider.models.slice(0, 3).map((model, index) => (
                    <div
                      key={index}
                      className={`text-xs px-2 py-1 rounded ${
                        selectedProvider === providerId && selectedModel === model
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {model}
                    </div>
                  ))}
                  {provider.models.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{provider.models.length - 3} مدل دیگر
                    </div>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="mb-3">
                <h5 className="text-sm font-medium text-gray-700 mb-2">قابلیت‌ها:</h5>
                <div className="flex flex-wrap gap-1">
                  {provider.features.slice(0, 3).map((feature, index) => (
                    <span
                      key={index}
                      className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded"
                    >
                      {feature}
                    </span>
                  ))}
                  {provider.features.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{provider.features.length - 3}
                    </span>
                  )}
                </div>
              </div>

              {/* Pricing Indicator */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <DollarSign className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-600">
                    {tier === 'open-source' ? 'رایگان' : 'پولی'}
                  </span>
                </div>
                <button className="text-xs text-blue-600 hover:text-blue-800">
                  انتخاب
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* No Results */}
      {Object.keys(filteredProviders).length === 0 && (
        <div className="text-center py-8">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">نتیجه‌ای یافت نشد</h3>
          <p className="text-gray-600">لطفاً فیلترهای خود را تغییر دهید</p>
        </div>
      )}

      {/* Statistics */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{Object.keys(providers).length}</div>
            <div className="text-sm text-gray-600">ارائه‌دهنده</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {Object.values(providers).reduce((total, provider) => total + provider.models.length, 0)}
            </div>
            <div className="text-sm text-gray-600">مدل</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {Object.values(providers).reduce((total, provider) => total + provider.features.length, 0)}
            </div>
            <div className="text-sm text-gray-600">قابلیت</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">۶</div>
            <div className="text-sm text-gray-600">منطقه</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalAIProvider; 