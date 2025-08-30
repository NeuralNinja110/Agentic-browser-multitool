import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { agentLoop } from "@/lib/agent-loop";
import type { Message, AgentConfig } from "@shared/schema";

export function useAgent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    messages: 0,
    toolCalls: 0,
    tokens: 0,
    avgResponseTime: 2.3,
  });
  
  const [config, setConfig] = useState<AgentConfig>({
    provider: 'aipipe',
    model: 'openai/gpt-4.1-nano',
    apiKey: '',
    temperature: 0.7,
    maxTokens: 1000,
  });

  const { toast } = useToast();

  const updateConfig = useCallback((updates: Partial<AgentConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, newMessage]);
    setStats(prev => ({ ...prev, messages: prev.messages + 1 }));
    
    return newMessage;
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    // For AI Pipe, API key is optional (can use environment variable)
    if (!config.apiKey && config.provider !== 'aipipe') {
      setError('Please configure your API key before sending messages.');
      return;
    }

    const userMessage = addMessage({
      role: 'user',
      content,
    });

    setIsProcessing(true);
    setError(null);

    try {
      const startTime = Date.now();
      
      // Start the agent loop
      const conversationMessages = [...messages, userMessage];
      
      for await (const update of agentLoop(conversationMessages, config)) {
        if (update.type === 'message' && update.message) {
          addMessage(update.message);
        } else if (update.type === 'tool_call') {
          setStats(prev => ({ ...prev, toolCalls: prev.toolCalls + 1 }));
        } else if (update.type === 'error') {
          setError(update.error || 'Unknown error occurred');
          break;
        } else if (update.type === 'complete') {
          const endTime = Date.now();
          const responseTime = (endTime - startTime) / 1000;
          setStats(prev => ({
            ...prev,
            avgResponseTime: (prev.avgResponseTime + responseTime) / 2,
            tokens: prev.tokens + (update.tokens || 0),
          }));
          break;
        }
      }
    } catch (err) {
      console.error('Agent loop error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsProcessing(false);
    }
  }, [config, messages, addMessage]);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setStats({
      messages: 0,
      toolCalls: 0,
      tokens: 0,
      avgResponseTime: 2.3,
    });
    setError(null);
    
    toast({
      title: "Conversation Cleared",
      description: "Ready for new tasks.",
    });
  }, [toast]);

  const testConnection = useCallback(async () => {
    if (!config.apiKey) {
      setError('Please enter an API key first.');
      return;
    }

    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      
      if (data.status === 'ok') {
        toast({
          title: "Connection Successful",
          description: "Ready to start conversations.",
        });
        setError(null);
      } else {
        throw new Error('Health check failed');
      }
    } catch (err) {
      setError('Connection test failed. Please check your configuration.');
    }
  }, [config.apiKey, toast]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    messages,
    isProcessing,
    config,
    updateConfig,
    sendMessage,
    clearConversation,
    testConnection,
    error,
    clearError,
    stats,
  };
}
