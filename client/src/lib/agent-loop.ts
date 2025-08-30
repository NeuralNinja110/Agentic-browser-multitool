import type { Message, AgentConfig } from "@shared/schema";

interface AgentUpdate {
  type: 'message' | 'tool_call' | 'error' | 'complete';
  message?: Omit<Message, 'id' | 'timestamp'>;
  error?: string;
  tokens?: number;
}

export async function* agentLoop(
  messages: Message[], 
  config: AgentConfig
): AsyncGenerator<AgentUpdate> {
  const enabledTools = ['google_search', 'ai_pipe', 'execute_javascript'];
  
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        config,
        tools: enabledTools,
      }),
    });

    if (!response.ok) {
      throw new Error(`Chat API error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let currentMessage = '';
    let currentToolCalls: any[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            if (currentMessage || currentToolCalls.length > 0) {
              yield {
                type: 'message',
                message: {
                  role: 'assistant',
                  content: currentMessage,
                  toolCalls: currentToolCalls.length > 0 ? currentToolCalls : undefined,
                },
              };
            }
            yield { type: 'complete' };
            return;
          }

          try {
            const chunk = JSON.parse(data);
            
            if (chunk.type === 'content') {
              currentMessage = chunk.accumulated || currentMessage + chunk.content;
            } else if (chunk.type === 'tool_calls') {
              currentToolCalls = chunk.tool_calls || [];
              yield { type: 'tool_call' };
            } else if (chunk.type === 'tool_calls_complete') {
              // Execute tool calls
              for (const toolCall of chunk.tool_calls) {
                try {
                  const toolResult = await executeToolCall(toolCall, config);
                  
                  // Add tool result as a message
                  yield {
                    type: 'message',
                    message: {
                      role: 'tool',
                      content: JSON.stringify(toolResult),
                      toolCallId: toolCall.id,
                    },
                  };
                } catch (toolError) {
                  yield {
                    type: 'message',
                    message: {
                      role: 'tool',
                      content: JSON.stringify({
                        error: toolError instanceof Error ? toolError.message : 'Tool execution failed'
                      }),
                      toolCallId: toolCall.id,
                    },
                  };
                }
              }
              
              // Continue the conversation with tool results
              // This would require recursively calling the agent loop
              // For now, we'll yield the current message
              if (currentMessage) {
                yield {
                  type: 'message',
                  message: {
                    role: 'assistant',
                    content: currentMessage,
                    toolCalls: currentToolCalls,
                  },
                };
              }
            } else if (chunk.type === 'error') {
              yield { type: 'error', error: chunk.error };
              return;
            }
          } catch (parseError) {
            console.error('Failed to parse chunk:', data, parseError);
          }
        }
      }
    }
  } catch (error) {
    console.error('Agent loop error:', error);
    yield { 
      type: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

async function executeToolCall(toolCall: any, config: AgentConfig) {
  const { function: func } = toolCall;
  const parameters = JSON.parse(func.arguments);

  const response = await fetch(`/api/tools/${func.name.replace('_', '-')}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      toolName: func.name,
      parameters,
      config,
    }),
  });

  if (!response.ok) {
    throw new Error(`Tool execution failed: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}
