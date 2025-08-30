import OpenAI from "openai";
import { Message, AgentConfig } from "@shared/schema";
import { AiPipeService } from "./ai-pipe.js";

export class LLMService {
  private aiPipeService: AiPipeService;

  constructor() {
    this.aiPipeService = new AiPipeService();
  }
  private getOpenAIClient(config: AgentConfig): OpenAI {
    return new OpenAI({ 
      apiKey: config.apiKey || process.env.OPENAI_API_KEY || "default_key"
    });
  }

  private getToolDefinitions() {
    return [
      {
        type: "function" as const,
        function: {
          name: "google_search",
          description: "Search Google for current information and return snippet results",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "The search query string"
              },
              limit: {
                type: "integer",
                description: "Maximum number of results to return (1-10)",
                default: 5
              }
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "ai_pipe",
          description: "Execute an AI workflow through the AI Pipe proxy API",
          parameters: {
            type: "object",
            properties: {
              workflow: {
                type: "string",
                description: "The AI workflow to execute"
              },
              inputData: {
                type: "object",
                description: "Input data for the workflow"
              }
            },
            required: ["workflow"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "execute_javascript",
          description: "Execute JavaScript code in a sandboxed environment and return results",
          parameters: {
            type: "object",
            properties: {
              code: {
                type: "string",
                description: "The JavaScript code to execute"
              },
              timeout: {
                type: "integer",
                description: "Execution timeout in milliseconds",
                default: 5000
              }
            },
            required: ["code"]
          }
        }
      }
    ];
  }

  async *streamChat(messages: Message[], config: AgentConfig, enabledTools: string[] = []) {
    let currentConfig = { ...config };
    
    // Handle AI Pipe provider separately
    if (currentConfig.provider === 'aipipe') {
      yield* this.handleAIPipeChat(messages, currentConfig, enabledTools);
      return;
    }
    
    let client = this.getOpenAIClient(config);
    
    // Convert our message format to OpenAI format
    const openaiMessages = messages.map(msg => ({
      role: msg.role as "user" | "assistant" | "system",
      content: msg.content,
      tool_calls: msg.toolCalls,
      tool_call_id: msg.toolCallId,
    }));

    const tools = this.getToolDefinitions().filter(tool => 
      enabledTools.length === 0 || enabledTools.includes(tool.function.name)
    );

    try {
      // Use the configured model, with fallbacks
      const modelToUse = this.getModelToUse(currentConfig);
        
      const stream = await client.chat.completions.create({
        model: modelToUse,
        messages: openaiMessages,
        tools: tools.length > 0 ? tools : undefined,
        tool_choice: tools.length > 0 ? "auto" : undefined,
        temperature: currentConfig.temperature,
        max_tokens: currentConfig.maxTokens,
        stream: true,
      });

      let currentContent = '';
      let currentToolCalls: any[] = [];

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        
        if (delta?.content) {
          currentContent += delta.content;
          yield {
            type: 'content',
            content: delta.content,
            accumulated: currentContent
          };
        }

        if (delta?.tool_calls) {
          // Handle tool calls
          for (const toolCall of delta.tool_calls) {
            if (toolCall.index !== undefined) {
              if (!currentToolCalls[toolCall.index]) {
                currentToolCalls[toolCall.index] = {
                  id: toolCall.id,
                  type: 'function',
                  function: { name: '', arguments: '' }
                };
              }
              
              if (toolCall.function?.name) {
                currentToolCalls[toolCall.index].function.name += toolCall.function.name;
              }
              
              if (toolCall.function?.arguments) {
                currentToolCalls[toolCall.index].function.arguments += toolCall.function.arguments;
              }
            }
          }
          
          yield {
            type: 'tool_calls',
            tool_calls: [...currentToolCalls]
          };
        }

        if (chunk.choices[0]?.finish_reason === 'tool_calls') {
          yield {
            type: 'tool_calls_complete',
            tool_calls: currentToolCalls
          };
        }

        if (chunk.choices[0]?.finish_reason === 'stop') {
          yield {
            type: 'complete',
            content: currentContent,
            tool_calls: currentToolCalls.length > 0 ? currentToolCalls : undefined
          };
        }
      }
    } catch (error) {
      console.error('LLM Service Error:', error);
      
      // If AI Pipe fails, fallback to OpenAI
      if (currentConfig.provider === 'aipipe') {
        console.log('AI Pipe failed, falling back to OpenAI...');
        try {
          currentConfig.provider = 'openai';
          client = this.getOpenAIClient(currentConfig);
          const modelToUse = this.getModelToUse(currentConfig);
          
          const stream = await client.chat.completions.create({
            model: modelToUse,
            messages: openaiMessages,
            tools: tools.length > 0 ? tools : undefined,
            tool_choice: tools.length > 0 ? "auto" : undefined,
            temperature: currentConfig.temperature,
            max_tokens: currentConfig.maxTokens,
            stream: true,
          });

          let currentContent = '';
          let currentToolCalls: any[] = [];

          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta;
            
            if (delta?.content) {
              currentContent += delta.content;
              yield {
                type: 'content',
                content: delta.content,
                accumulated: currentContent
              };
            }

            if (delta?.tool_calls) {
              // Handle tool calls
              for (const toolCall of delta.tool_calls) {
                if (toolCall.index !== undefined) {
                  if (!currentToolCalls[toolCall.index]) {
                    currentToolCalls[toolCall.index] = {
                      id: toolCall.id,
                      type: 'function',
                      function: { name: '', arguments: '' }
                    };
                  }
                  
                  if (toolCall.function?.name) {
                    currentToolCalls[toolCall.index].function.name += toolCall.function.name;
                  }
                  
                  if (toolCall.function?.arguments) {
                    currentToolCalls[toolCall.index].function.arguments += toolCall.function.arguments;
                  }
                }
              }
              
              yield {
                type: 'tool_calls',
                tool_calls: [...currentToolCalls]
              };
            }

            if (chunk.choices[0]?.finish_reason === 'tool_calls') {
              yield {
                type: 'tool_calls_complete',
                tool_calls: currentToolCalls
              };
            }

            if (chunk.choices[0]?.finish_reason === 'stop') {
              yield {
                type: 'complete',
                content: currentContent,
                tool_calls: currentToolCalls.length > 0 ? currentToolCalls : undefined
              };
            }
          }
        } catch (fallbackError) {
          console.error('OpenAI fallback also failed:', fallbackError);
          yield {
            type: 'error',
            error: 'Both AI Pipe and OpenAI failed. Please check your API keys and try again.'
          };
        }
      } else {
        yield {
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown LLM error'
        };
      }
    }
  }

  private async *handleAIPipeChat(messages: Message[], config: AgentConfig, enabledTools: string[] = []) {
    try {
      // Convert our message format to OpenAI format
      const openaiMessages = messages.map(msg => ({
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
        tool_calls: msg.toolCalls,
        tool_call_id: msg.toolCallId,
      }));

      const result = await this.aiPipeService.chatCompletion(openaiMessages, config.model);
      
      if (result.success && result.data) {
        const choice = result.data.choices?.[0];
        if (choice?.message?.content) {
          yield {
            type: 'content',
            content: choice.message.content,
            accumulated: choice.message.content
          };
          yield {
            type: 'complete',
            content: choice.message.content
          };
        }
        if (choice?.message?.tool_calls) {
          yield {
            type: 'tool_calls_complete',
            tool_calls: choice.message.tool_calls
          };
        }
      } else {
        throw new Error(result.error || 'AI Pipe request failed');
      }
    } catch (error) {
      console.error('AI Pipe Error:', error);
      
      // Fallback to OpenAI
      console.log('AI Pipe failed, falling back to OpenAI...');
      try {
        const fallbackConfig = { ...config, provider: 'openai' as const };
        const client = this.getOpenAIClient(fallbackConfig);
        
        const openaiMessages = messages.map(msg => ({
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content,
          tool_calls: msg.toolCalls,
          tool_call_id: msg.toolCallId,
        }));

        const tools = this.getToolDefinitions().filter(tool => 
          enabledTools.length === 0 || enabledTools.includes(tool.function.name)
        );
        
        const modelToUse = this.getModelToUse(fallbackConfig);
        
        const stream = await client.chat.completions.create({
          model: modelToUse,
          messages: openaiMessages,
          tools: tools.length > 0 ? tools : undefined,
          tool_choice: tools.length > 0 ? "auto" : undefined,
          temperature: fallbackConfig.temperature,
          max_tokens: fallbackConfig.maxTokens,
          stream: true,
        });

        let currentContent = '';
        let currentToolCalls: any[] = [];

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta;
          
          if (delta?.content) {
            currentContent += delta.content;
            yield {
              type: 'content',
              content: delta.content,
              accumulated: currentContent
            };
          }

          if (delta?.tool_calls) {
            for (const toolCall of delta.tool_calls) {
              if (toolCall.index !== undefined) {
                if (!currentToolCalls[toolCall.index]) {
                  currentToolCalls[toolCall.index] = {
                    id: toolCall.id,
                    type: 'function',
                    function: { name: '', arguments: '' }
                  };
                }
                
                if (toolCall.function?.name) {
                  currentToolCalls[toolCall.index].function.name += toolCall.function.name;
                }
                
                if (toolCall.function?.arguments) {
                  currentToolCalls[toolCall.index].function.arguments += toolCall.function.arguments;
                }
              }
            }
            
            yield {
              type: 'tool_calls',
              tool_calls: [...currentToolCalls]
            };
          }

          if (chunk.choices[0]?.finish_reason === 'tool_calls') {
            yield {
              type: 'tool_calls_complete',
              tool_calls: currentToolCalls
            };
          }

          if (chunk.choices[0]?.finish_reason === 'stop') {
            yield {
              type: 'complete',
              content: currentContent,
              tool_calls: currentToolCalls.length > 0 ? currentToolCalls : undefined
            };
          }
        }
      } catch (fallbackError) {
        console.error('OpenAI fallback also failed:', fallbackError);
        yield {
          type: 'error',
          error: 'Both AI Pipe and OpenAI failed. Please check your API keys and try again.'
        };
      }
    }
  }

  private getModelToUse(config: AgentConfig): string {
    if (config.provider === 'aipipe') {
      return config.model || "openai/gpt-4.1-nano";
    } else if (config.provider === 'openai') {
      return config.model || "gpt-4o";
    }
    // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
    return config.model || "gpt-5";
  }

  async testConnection(config: AgentConfig): Promise<boolean> {
    try {
      if (config.provider === 'aipipe') {
        const result = await this.aiPipeService.chatCompletion([{ role: "user", content: "Test" }], config.model);
        return result.success;
      } else {
        const client = this.getOpenAIClient(config);
        const modelToUse = this.getModelToUse(config);
          
        await client.chat.completions.create({
          model: modelToUse,
          messages: [{ role: "user", content: "Test" }],
          max_tokens: 1,
        });
        return true;
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      
      // If AI Pipe fails, try OpenAI fallback
      if (config.provider === 'aipipe') {
        try {
          const fallbackConfig = { ...config, provider: 'openai' as const };
          const fallbackClient = this.getOpenAIClient(fallbackConfig);
          const fallbackModel = this.getModelToUse(fallbackConfig);
          
          await fallbackClient.chat.completions.create({
            model: fallbackModel,
            messages: [{ role: "user", content: "Test" }],
            max_tokens: 1,
          });
          return true;
        } catch (fallbackError) {
          console.error('OpenAI fallback test also failed:', fallbackError);
          return false;
        }
      }
      
      return false;
    }
  }
}
