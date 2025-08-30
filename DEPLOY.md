# Deploy to Render - Step by Step Guide

## Prerequisites
1. Create a Render account at https://render.com
2. Get your API key from https://dashboard.render.com/account

## Option 1: Using the Deployment Script (Recommended)

1. Run the deployment script with your Render API key:
   ```bash
   ./deploy-render.sh YOUR_RENDER_API_KEY
   ```

2. After deployment, set environment variables in Render Dashboard:
   - Go to https://dashboard.render.com
   - Select your service
   - Go to Environment tab
   - Add the following variables:
     - `AI_PIPE_API_KEY`: Your AI Pipe API key
     - `OPENAI_API_KEY`: Your OpenAI API key (fallback)
     - `GOOGLE_SEARCH_API_KEY`: Your Google Search API key
     - `GOOGLE_SEARCH_ENGINE_ID`: Your Google Custom Search Engine ID

## Option 2: Manual Deployment via Render Dashboard

1. Go to https://dashboard.render.com
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository: https://github.com/NeuralNinja110/Agentic-browser-multitool
4. Configure the service:
   - **Name**: agentic-browser-multitool
   - **Environment**: Node
   - **Region**: Oregon (US West)
   - **Branch**: main
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or your preferred plan)

5. Set Environment Variables (in the Environment tab):
   - `NODE_ENV`: production
   - `AI_PIPE_API_KEY`: Your AI Pipe API key
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `GOOGLE_SEARCH_API_KEY`: Your Google Search API key
   - `GOOGLE_SEARCH_ENGINE_ID`: Your Google Custom Search Engine ID

6. Set Health Check Path: `/api/health`

7. Click "Create Web Service"

## Option 3: Using Render CLI (if you have API token set up)

If you want to use the existing render-cli package, you'll need to:
1. Set up your API token as an environment variable
2. Use the available commands to manage services

## Post-Deployment

1. Your app will be available at: `https://YOUR-SERVICE-NAME.onrender.com`
2. The health check endpoint will be: `https://YOUR-SERVICE-NAME.onrender.com/api/health`
3. Monitor deployment logs in the Render dashboard

## Important Notes

- The app includes:
  - AI agent with Google search capabilities
  - Browser scraping tools (newly added)
  - AI Pipe and OpenAI integration
  - React frontend with modern UI components

- Make sure all environment variables are set correctly for the AI features to work
- The free tier on Render may have cold starts, which can cause initial delays
