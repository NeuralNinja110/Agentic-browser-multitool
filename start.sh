#!/bin/bash

# LLM Agent POC - Start Script for Linux/macOS

echo "🤖 Starting LLM Agent POC..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# LLM Provider API Keys
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GOOGLE_AI_API_KEY=your_google_ai_api_key_here
COHERE_API_KEY=your_cohere_api_key_here

# Google Search API (optional)
GOOGLE_SEARCH_API_KEY=your_google_search_api_key_here
GOOGLE_SEARCH_ENGINE_ID=your_custom_search_engine_id_here

# AI Pipe API (optional)
AI_PIPE_API_KEY=your_ai_pipe_api_key_here
AI_PIPE_BASE_URL=https://api.aipipe.ai

# Server Configuration
PORT=5000
NODE_ENV=development
EOF
    echo "⚠️  Please edit .env file with your actual API keys before proceeding."
    echo "   You can continue for now, but some features may not work without proper API keys."
    read -p "Press Enter to continue..."
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies."
        exit 1
    fi
fi

# Check if build exists, if not create it
if [ ! -d "dist" ]; then
    echo "🔨 Building application..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ Build failed."
        exit 1
    fi
fi

# Start the application
echo "🚀 Starting LLM Agent POC on http://localhost:5000"
echo ""
echo "📋 Available features:"
echo "   • Multi-LLM support (OpenAI, Anthropic, Google, Cohere)"
echo "   • Google Search integration"
echo "   • AI Pipe API workflows"
echo "   • Secure JavaScript execution"
echo "   • Real-time streaming conversations"
echo ""
echo "⚡ Quick start:"
echo "   1. Open http://localhost:5000 in your browser"
echo "   2. Configure your LLM provider and API key in the sidebar"
echo "   3. Start chatting with the agent!"
echo ""
echo "🛑 To stop the server, press Ctrl+C"
echo ""

# Start in development mode by default
if [ "$NODE_ENV" = "production" ]; then
    npm start
else
    npm run dev
fi
