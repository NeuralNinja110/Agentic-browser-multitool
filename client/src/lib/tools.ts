import type { GoogleSearchParams, AiPipeParams, JsExecutionParams } from "@shared/schema";

export const toolDefinitions = [
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

export function getToolByName(name: string) {
  return toolDefinitions.find(tool => tool.function.name === name);
}

export function validateToolParameters(toolName: string, parameters: any): boolean {
  const tool = getToolByName(toolName);
  if (!tool) return false;

  const { required = [], properties = {} } = tool.function.parameters;
  
  // Check required parameters
  for (const requiredParam of required) {
    if (!(requiredParam in parameters)) {
      return false;
    }
  }

  // Basic type checking
  for (const [param, value] of Object.entries(parameters)) {
    const paramSchema = (properties as any)[param];
    if (paramSchema && paramSchema.type) {
      if (paramSchema.type === 'string' && typeof value !== 'string') {
        return false;
      }
      if (paramSchema.type === 'integer' && !Number.isInteger(value)) {
        return false;
      }
      if (paramSchema.type === 'object' && typeof value !== 'object') {
        return false;
      }
    }
  }

  return true;
}
