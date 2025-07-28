# AI Chat Full-Stack Application

A comprehensive full-stack application that allows users to chat with multiple AI models including OpenAI GPT-4, Claude, Gemini, and open-source models via HuggingFace.

## 🏗️ Project Structure

```
fullstack-ai-project/
├── backend/                 # Node.js Express API server
│   ├── server.js           # Main server file with API routes
│   ├── package.json        # Backend dependencies
│   └── env.example         # Environment variables template
├── frontend/               # React frontend application
│   ├── public/             # Static files
│   ├── src/                # React source code
│   │   ├── App.js          # Main React component
│   │   ├── index.js        # React entry point
│   │   └── index.css       # Global styles
│   ├── package.json        # Frontend dependencies
│   ├── tailwind.config.js  # Tailwind CSS configuration
│   └── postcss.config.js   # PostCSS configuration
├── ai-integrations/        # AI model integration modules
│   ├── claude.js          # Anthropic Claude integration
│   ├── gemini.js          # Google Gemini integration
│   └── huggingface.js     # HuggingFace open-source models
└── README.md              # This file
```

## 🚀 Features

### Backend (Node.js + Express)
- **Multi-Model AI Integration**: Support for OpenAI GPT-4, Claude, Gemini, and HuggingFace models
- **RESTful API**: Clean API endpoints for each AI provider
- **Security**: Rate limiting, CORS, and input validation
- **Error Handling**: Comprehensive error handling and logging
- **Environment Configuration**: Flexible configuration via environment variables

### Frontend (React)
- **Modern UI**: Clean, responsive interface built with React and Tailwind CSS
- **Model Selection**: Dropdown to choose between different AI models
- **Real-time Chat**: Live chat interface with message history
- **Loading States**: Visual feedback during AI processing
- **Error Handling**: User-friendly error messages
- **Responsive Design**: Works on desktop and mobile devices

### 🌍 Global AI Integrations

#### 🌐 Global AI Providers
- **OpenAI**: GPT-4, GPT-4 Turbo, GPT-3.5 Turbo, GPT-4o, GPT-4o-mini
- **Anthropic Claude**: Claude 3 Opus, Claude 3 Sonnet, Claude 3 Haiku, Claude 3.5 Sonnet
- **Google Gemini**: Gemini Pro, Gemini Pro Vision, Gemini 1.5 Pro, Gemini 1.5 Flash
- **Microsoft Azure**: Azure OpenAI with GPT models
- **Meta AI**: Llama 3 models, Code Llama
- **Amazon Bedrock**: Claude, Llama, and Titan models
- **Cohere**: Command, Command Light, Command R
- **AI21 Labs**: J2 Ultra, J2 Mid, J2 Light, Jamba
- **Perplexity AI**: Llama 3.1 models with web search
- **Mistral AI**: Mistral Large, Medium, Small
- **Together AI**: Open-source model hosting
- **Replicate**: Custom model deployment
- **HuggingFace**: 100,000+ open-source models
- **DeepSeek**: Advanced reasoning models
- **xAI Grok**: Real-time information and humor

#### 🇨🇳 Chinese AI Providers
- **智谱AI (Zhipu)**: GLM-4, GLM-3 Turbo, CogView-3
- **百川智能 (Baichuan)**: Baichuan2 Turbo, Baichuan2-13B
- **通义千问 (Qwen)**: Qwen Turbo, Plus, Max, VL models
- **讯飞星火 (SparkDesk)**: Spark V3.0, V2.0, V1.5
- **文心一言 (ERNIE)**: ERNIE Bot 4, Turbo, Bot
- **MiniMax**: ABAB 5.5, 5.5s, 6 Chat
- **Moonshot AI**: Moonshot V1 models
- **零一万物 (01.AI)**: Yi-34B, Yi-6B, Yi-VL

#### 🏢 Enterprise AI Providers
- **IBM Watson**: Enterprise AI with compliance
- **Palantir AI**: Data analysis and integration
- **Databricks AI**: ML pipeline integration
- **Snowflake AI**: Data warehouse AI
- **Salesforce Einstein**: CRM AI integration
- **Oracle AI**: Database AI integration
- **SAP AI**: ERP AI integration

#### 🌏 Regional AI Providers
- **Japan**: LINE AI, Claude Japan
- **Korea**: Naver CLOVA, Kakao KoGPT
- **Russia**: Yandex GPT, Sber AI
- **Europe**: Aleph Alpha, Mistral EU, Cohere EU

### Media AI Services
- **DALL-E**: Image generation, editing, and variations
- **Stable Video Diffusion**: Video generation and editing
- **RunwayML**: Advanced video editing capabilities
- **Video Processing**: Format conversion, resizing, and optimization

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- API keys for the AI services you want to use

### 1. Clone and Setup
```bash
git clone <repository-url>
cd fullstack-ai-project
```

### 2. Backend Setup
```bash
cd backend
npm install
cp env.example .env
```

Edit the `.env` file and add your API keys:
```env
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Anthropic (Claude) API Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Google (Gemini) API Configuration
GOOGLE_API_KEY=your_google_api_key_here

# HuggingFace API Configuration
HUGGINGFACE_API_KEY=your_huggingface_api_key_here

# Media Processing Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=100MB
ALLOWED_IMAGE_TYPES=jpg,jpeg,png,webp,gif
ALLOWED_VIDEO_TYPES=mp4,avi,mov,wmv,flv,webm

# DALL-E Configuration
DALLE_MODEL=dall-e-3
DALLE_QUALITY=standard
DALLE_SIZE=1024x1024

# RunwayML Configuration
RUNWAYML_API_KEY=your_runwayml_api_key_here

# Replicate Configuration (for video AI)
REPLICATE_API_KEY=your_replicate_api_key_here

# Server Configuration
PORT=5000
NODE_ENV=development
```

Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm start
```

The frontend will automatically proxy requests to the backend on port 5000.

## 🔑 API Keys Setup

### OpenAI
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create an account and get your API key
3. Add to `.env`: `OPENAI_API_KEY=sk-...`

### Anthropic (Claude)
1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Create an account and get your API key
3. Add to `.env`: `ANTHROPIC_API_KEY=sk-ant-...`

### Google (Gemini)
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Add to `.env`: `GOOGLE_API_KEY=...`

### HuggingFace
1. Visit [HuggingFace](https://huggingface.co/settings/tokens)
2. Create an account and get your API token
3. Add to `.env`: `HUGGINGFACE_API_KEY=hf_...`

### Replicate (Video AI)
1. Visit [Replicate](https://replicate.com/)
2. Create an account and get your API token
3. Add to `.env`: `REPLICATE_API_KEY=r8_...`

### RunwayML (Video Editing)
1. Visit [RunwayML](https://runwayml.com/)
2. Create an account and get your API key
3. Add to `.env`: `RUNWAYML_API_KEY=...`

## 📡 API Endpoints

### Health Check
- `GET /api/health` - Check if the API is running

### Chat Endpoints
- `POST /api/chat` - Chat with OpenAI models (GPT-4, GPT-3.5)
- `POST /api/claude` - Chat with Claude models
- `POST /api/gemini` - Chat with Gemini models
- `POST /api/huggingface` - Chat with HuggingFace models

### Advanced Chat Endpoints
- `GET /api/chat/providers` - Get available AI providers and models
- `POST /api/chat/send` - Send message with queue management
- `GET /api/chat/history` - Get user's chat history
- `GET /api/chat/chat/:chatId` - Get specific chat with messages
- `PUT /api/chat/chat/:chatId/title` - Update chat title
- `PUT /api/chat/chat/:chatId/archive` - Archive chat
- `GET /api/chat/job/:jobId` - Get job status
- `GET /api/chat/queue/stats` - Get queue statistics
- `DELETE /api/chat/history` - Clear chat history

### Media Endpoints
- `POST /api/generate-image` - Generate images with DALL-E
- `POST /api/edit-image` - Edit images with DALL-E
- `POST /api/variation-image` - Create image variations
- `POST /api/generate-video` - Generate videos with AI
- `POST /api/edit-video` - Edit videos with AI
- `POST /api/process-video` - Process and optimize videos
- `GET /api/media-models` - Get available media models

### Download Endpoints
- `GET /api/downloads/image/:filename` - Download generated images
- `GET /api/downloads/video/:filename` - Download generated videos
- `GET /api/downloads/ai-content/:type/:id` - Download AI-generated content
- `POST /api/downloads/session` - Create download session
- `GET /api/downloads/session/:sessionId` - Validate download session
- `GET /api/downloads/stats` - Get download statistics

### Model Information
- `GET /api/models` - Get list of available models

### Request Format
```json
{
  "message": "Your message here",
  "model": "gpt-4" // Optional, defaults to gpt-4
}
```

### Response Format
```json
{
  "success": true,
  "response": "AI response here",
  "model": "gpt-4",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "usage": {
    "prompt_tokens": 10,
    "response_tokens": 50
  }
}
```

## 🎨 Frontend Features

### Model Selection
- Dropdown menu to select different AI models
- Visual indicators for available/unavailable models
- Model descriptions and provider information

### Chat Interface
- Real-time message display
- User and AI message differentiation
- Loading indicators during AI processing
- Token usage information
- Error message handling

### User Experience
- Responsive design for all screen sizes
- Keyboard shortcuts (Enter to send, Shift+Enter for new line)
- Auto-scroll to latest messages
- Clear chat functionality
- Smooth animations and transitions

### Advanced Chat Features
- **Multi-Provider Support**: Switch between OpenAI, Claude, Gemini, and HuggingFace
- **Chat History**: Persistent chat sessions with MongoDB storage
- **Queue Management**: Bull queue system for handling concurrent requests
- **Real-time Status**: Job status tracking and progress monitoring
- **Session Management**: Secure user sessions with Redis
- **Rate Limiting**: Per-provider rate limiting to prevent API abuse
- **Model Selection**: Dynamic model selection with provider-specific options
- **Settings Panel**: Customizable temperature, max tokens, and system prompts
- **Chat Management**: Archive, rename, and organize chat sessions
- **Persian Interface**: Full Persian language support with RTL layout

### Download Features
- **Secure Downloads**: Authentication required for all downloads
- **Progress Tracking**: Real-time download progress with visual indicators
- **Resumable Downloads**: Support for range requests and download resumption
- **Bandwidth Optimization**: Efficient streaming and compression
- **Multi-language Support**: Persian and English interface
- **Session Management**: Secure session-based access control
- **Rate Limiting**: Prevents abuse with configurable limits

## 🔧 Development

### Backend Development
```bash
cd backend
npm run dev  # Start with nodemon for auto-reload
```

### Frontend Development
```bash
cd frontend
npm start    # Start React development server
```

### Building for Production
```bash
# Backend
cd backend
npm start

# Frontend
cd frontend
npm run build
```

## 🚀 Deployment

### Backend Deployment
1. Set environment variables on your hosting platform
2. Install dependencies: `npm install --production`
3. Start the server: `npm start`

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy the `build` folder to your hosting platform
3. Configure the backend URL in the frontend

## 🔒 Security Features

- **Rate Limiting**: Prevents abuse with configurable limits
- **Input Validation**: Validates all incoming requests
- **CORS**: Configured for secure cross-origin requests
- **Helmet**: Security headers for Express
- **Environment Variables**: Secure API key management

## 📊 Monitoring

The application includes:
- Request/response logging
- Error tracking and reporting
- API usage statistics
- Model performance metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues:
1. Check the console for error messages
2. Verify your API keys are correctly configured
3. Ensure all dependencies are installed
4. Check the network tab for API request failures

## 🔮 Future Enhancements

- [ ] Conversation history persistence
- [ ] User authentication and profiles
- [ ] File upload support for multimodal models
- [ ] Advanced model configuration options
- [ ] WebSocket support for real-time streaming
- [ ] Model performance comparison tools
- [ ] Export chat history functionality
- [ ] Custom system prompts
- [ ] Model fine-tuning capabilities 