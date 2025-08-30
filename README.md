# LLM Agent POC - Browser-Based Multi-Tool Reasoning

A modern browser-based LLM agent with multi-tool reasoning capabilities, featuring Google Search, AI Pipe API integration, and secure JavaScript execution.

## Features

- **Multi-LLM Support**: OpenAI, Anthropic, Google, and Cohere
- **Tool Integration**: Google Search API, AI Pipe API, JavaScript execution
- **Real-time Streaming**: Live conversation updates and tool execution
- **Secure Execution**: Sandboxed JavaScript execution using Web Workers
- **Responsive UI**: Bootstrap-inspired design with shadcn/ui components
- **Export/Import**: Save conversations as JSON files

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- API keys for desired LLM providers
- Google Search API credentials (optional)
- AI Pipe API credentials (optional)

### Environment Variables

Create a `.env` file in the root directory:

```env
# LLM Provider API Keys
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GOOGLE_AI_API_KEY=your_google_api_key
COHERE_API_KEY=your_cohere_api_key

# Google Search API (optional)
GOOGLE_SEARCH_API_KEY=your_google_search_api_key
GOOGLE_SEARCH_ENGINE_ID=your_custom_search_engine_id

# AI Pipe API (optional)
AI_PIPE_API_KEY=your_ai_pipe_api_key
AI_PIPE_BASE_URL=https://api.aipipe.ai

# Server Configuration
PORT=5000
NODE_ENV=development
