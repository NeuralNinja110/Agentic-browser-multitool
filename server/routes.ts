import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { LLMService } from "./services/llm-service";
import { GoogleSearchService } from "./services/google-search";
import { AiPipeService } from "./services/ai-pipe";
import { JsExecutorService } from "./services/js-executor";
import { agentConfigSchema, messageSchema } from "@shared/schema";

const chatRequestSchema = z.object({
  messages: z.array(messageSchema),
  config: agentConfigSchema,
  tools: z.array(z.string()).optional(),
});

const toolExecuteSchema = z.object({
  toolName: z.string(),
  parameters: z.record(z.any()),
  config: agentConfigSchema,
});

export async function registerRoutes(app: Express): Promise<Server> {
  const llmService = new LLMService();
  const googleSearch = new GoogleSearchService();
  const aiPipe = new AiPipeService();
  const jsExecutor = new JsExecutorService();

  // Chat endpoint with streaming support
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, config, tools = [] } = chatRequestSchema.parse(req.body);
      
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      });

      const stream = llmService.streamChat(messages, config, tools);
      
      for await (const chunk of stream) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
      
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      console.error('Chat error:', error);
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Tool execution endpoints
  app.post("/api/tools/google-search", async (req, res) => {
    try {
      const { parameters } = toolExecuteSchema.parse(req.body);
      const result = await googleSearch.search(parameters.query, parameters.limit);
      res.json(result);
    } catch (error) {
      console.error('Google Search error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Search failed' 
      });
    }
  });

  app.post("/api/tools/ai-pipe", async (req, res) => {
    try {
      const { parameters } = toolExecuteSchema.parse(req.body);
      const result = await aiPipe.execute(parameters.workflow, parameters.inputData);
      res.json(result);
    } catch (error) {
      console.error('AI Pipe error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'AI Pipe execution failed' 
      });
    }
  });

  app.post("/api/tools/execute-javascript", async (req, res) => {
    try {
      const { parameters } = toolExecuteSchema.parse(req.body);
      const result = await jsExecutor.execute(parameters.code, parameters.timeout);
      res.json(result);
    } catch (error) {
      console.error('JavaScript execution error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Code execution failed' 
      });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      tools: {
        googleSearch: true, // Now always available with fallback search
        aiPipe: !!process.env.AI_PIPE_API_KEY && process.env.AI_PIPE_API_KEY !== "default_key",
        jsExecution: true
      }
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
