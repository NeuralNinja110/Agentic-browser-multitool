export class AiPipeService {
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;

  constructor() {
    this.apiKey = process.env.AI_PIPE_API_KEY || process.env.AIPIPE_API_KEY || "default_key";
    this.baseUrl = process.env.AI_PIPE_BASE_URL || 'https://aipipe.org/openrouter/v1';
    this.defaultModel = 'openai/gpt-4.1-nano'; // Preferred GPT-4.1 nano model
    
    // Debug logging
    console.log('AI_PIPE_API_KEY env var:', process.env.AI_PIPE_API_KEY ? 'SET' : 'NOT SET');
    console.log('Using API key:', this.apiKey === 'default_key' ? 'DEFAULT (NOT WORKING)' : 'CUSTOM KEY');
  }

  async chatCompletion(messages: any[], model?: string) {
    try {
      const requestBody = {
        model: model || this.defaultModel,
        messages: messages
      };

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI Pipe API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error('AI Pipe Chat Completion Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'AI Pipe chat completion failed',
      };
    }
  }

  async execute(workflow: string, inputData: any = {}) {
    try {
      // Enhanced input data with preferred GPT-4 model
      const enhancedInput = {
        ...inputData,
        model: inputData.model || this.defaultModel,
        // Add fallback to GPT-4.0 nano if 4.1 is not available
        fallback_models: ['openai/gpt-4.0-nano', 'openai/gpt-4', 'openai/gpt-3.5-turbo']
      };

      const response = await fetch(`${this.baseUrl}/workflows/${workflow}/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: enhancedInput,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI Pipe API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        output: data.output,
        executionId: data.execution_id,
        status: data.status,
        metadata: data.metadata,
      };
    } catch (error) {
      console.error('AI Pipe Service Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'AI Pipe execution failed',
        output: null,
      };
    }
  }

  async getWorkflows() {
    try {
      const response = await fetch(`${this.baseUrl}/workflows`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`AI Pipe API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        workflows: data.workflows || [],
      };
    } catch (error) {
      console.error('AI Pipe Get Workflows Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch workflows',
        workflows: [],
      };
    }
  }
}
