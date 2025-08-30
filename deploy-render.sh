#!/bin/bash

# Render Deployment Script
# Usage: ./deploy-render.sh <RENDER_API_KEY>

if [ -z "$1" ]; then
    echo "Usage: $0 <RENDER_API_KEY>"
    echo "Get your API key from: https://dashboard.render.com/account"
    exit 1
fi

RENDER_API_KEY="$1"
REPO_URL="https://github.com/NeuralNinja110/Agentic-browser-multitool"
SERVICE_NAME="agentic-browser-multitool"

echo "🚀 Deploying to Render..."
echo "Repository: $REPO_URL"
echo "Service Name: $SERVICE_NAME"

# Create service payload
cat > service_config.json << EOF
{
  "type": "web_service",
  "name": "$SERVICE_NAME",
  "repo": "$REPO_URL",
  "branch": "main",
  "buildCommand": "npm install && npm run build",
  "startCommand": "npm start",
  "plan": "free",
  "region": "oregon",
  "environment": "node",
  "healthCheckPath": "/api/health",
  "envVars": [
    {
      "key": "NODE_ENV",
      "value": "production"
    }
  ]
}
EOF

# Deploy to Render
echo "📦 Creating service on Render..."
response=$(curl -X POST \
  "https://api.render.com/v1/services" \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d @service_config.json)

echo "Response: $response"

# Clean up
rm service_config.json

echo "✅ Deployment initiated!"
echo "📊 Check your deployment status at: https://dashboard.render.com"
echo ""
echo "🔧 Don't forget to set your environment variables in Render Dashboard:"
echo "   - AI_PIPE_API_KEY"
echo "   - OPENAI_API_KEY"
echo "   - GOOGLE_SEARCH_API_KEY"
echo "   - GOOGLE_SEARCH_ENGINE_ID"
