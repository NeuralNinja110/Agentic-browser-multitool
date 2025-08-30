@echo off
setlocal enabledelayedexpansion

REM LLM Agent POC - Start Script for Windows

echo 🤖 Starting LLM Agent POC...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    echo    Visit: https://nodejs.org/
    pause
    exit /b 1
)

REM Check Node.js version
for /f "tokens=1 delims=." %%i in ('node -v') do set NODE_MAJOR=%%i
set NODE_MAJOR=%NODE_MAJOR:~1%
if %NODE_MAJOR% lss 18 (
    echo ❌ Node.js version 18+ is required. Current version: 
    node --version
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

REM Create .env file if it doesn't exist
if not exist .env (
    echo 📝 Creating .env file...
    (
        echo # LLM Provider API Keys
        echo OPENAI_API_KEY=your_openai_api_key_here
        echo ANTHROPIC_API_KEY=your_anthropic_api_key_here
        echo GOOGLE_AI_API_KEY=your_google_ai_api_key_here
        echo COHERE_API_KEY=your_cohere_api_key_here
        echo.
        echo # Google Search API ^(optional^)
        echo GOOGLE_SEARCH_API_KEY=your_google_search_api_key_here
        echo GOOGLE_SEARCH_ENGINE_ID=your_custom_search_engine_id_here
        echo.
        echo # AI Pipe API ^(optional^)
        echo AI_PIPE_API_KEY=your_ai_pipe_api_key_here
        echo AI_PIPE_BASE_URL=https://api.aipipe.ai
        echo.
        echo # Server Configuration
        echo PORT=5000
        echo NODE_ENV=development
    ) > .env
    echo ⚠️  Please edit .env file with your actual API keys before proceeding.
    echo    You can continue for now, but some features may not work without proper API keys.
    pause
)

REM Install dependencies if node_modules doesn't exist
if not exist node_modules (
    echo 📦 Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies.
        pause
        exit /b 1
    )
)

REM Check if build exists, if not create it
if not exist dist (
    echo 🔨 Building application...
    npm run build
    if %errorlevel% neq 0 (
        echo ❌ Build failed.
        pause
        exit /b 1
    )
)

REM Start the application
echo 🚀 Starting LLM Agent POC on http://localhost:5000
echo.
echo 📋 Available features:
echo    • Multi-LLM support ^(OpenAI, Anthropic, Google, Cohere^)
echo    • Google Search integration
echo    • AI Pipe API workflows
echo    • Secure JavaScript execution
echo    • Real-time streaming conversations
echo.
echo ⚡ Quick start:
echo    1. Open http://localhost:5000 in your browser
echo    2. Configure your LLM provider and API key in the sidebar
echo    3. Start chatting with the agent!
echo.
echo 🛑 To stop the server, press Ctrl+C
echo.

REM Start in development mode by default
if "%NODE_ENV%"=="production" (
    npm start
) else (
    npm run dev
)

pause
