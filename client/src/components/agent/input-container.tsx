import { useState, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Square, BarChart3, Search, Code } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface InputContainerProps {
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
  hasApiKey: boolean;
  provider?: string;
}

export function InputContainer({ onSendMessage, isProcessing, hasApiKey, provider = 'openai' }: InputContainerProps) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    // For AI Pipe, API key is optional
    if (!hasApiKey && provider !== 'aipipe') return;

    onSendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const insertPrompt = (prompt: string) => {
    setInput(prompt);
  };

  const quickActions = [
    {
      icon: <BarChart3 className="h-3 w-3" />,
      label: "Analyze Data",
      prompt: "Help me analyze this data: ",
    },
    {
      icon: <Search className="h-3 w-3" />,
      label: "Research Topic",
      prompt: "Search for recent information about ",
    },
    {
      icon: <Code className="h-3 w-3" />,
      label: "Code Solution",
      prompt: "Write and execute code to ",
    },
  ];

  return (
    <div className="space-y-3">
      {!hasApiKey && provider !== 'aipipe' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please configure your API key in the sidebar before sending messages.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-3">
        <div className="flex-1">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            rows={3}
            className="resize-none"
            disabled={isProcessing || (!hasApiKey && provider !== 'aipipe')}
            data-testid="textarea-user-input"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing || (!hasApiKey && provider !== 'aipipe')}
            size="sm"
            data-testid="button-send-message"
          >
            <Send className="h-4 w-4" />
          </Button>
          {isProcessing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {/* TODO: Implement stop functionality */}}
              data-testid="button-stop-processing"
            >
              <Square className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-muted-foreground">Quick actions:</span>
        {quickActions.map((action, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => insertPrompt(action.prompt)}
            disabled={isProcessing}
            data-testid={`button-quick-action-${index}`}
          >
            {action.icon}
            <span className="ml-1">{action.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
