import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Code, Zap, ExternalLink, Eye } from "lucide-react";

interface ToolCallProps {
  toolCall: {
    id: string;
    type: string;
    function: {
      name: string;
      arguments: string;
    };
  };
}

export function ToolCall({ toolCall }: ToolCallProps) {
  const getToolIcon = (toolName: string) => {
    switch (toolName) {
      case 'google_search':
        return <Search className="h-3 w-3" />;
      case 'execute_javascript':
        return <Code className="h-3 w-3" />;
      case 'ai_pipe':
        return <Zap className="h-3 w-3" />;
      default:
        return <ExternalLink className="h-3 w-3" />;
    }
  };

  const getToolDisplayName = (toolName: string) => {
    switch (toolName) {
      case 'google_search':
        return 'Google Search';
      case 'execute_javascript':
        return 'JavaScript';
      case 'ai_pipe':
        return 'AI Pipe';
      default:
        return toolName;
    }
  };

  const formatArguments = (args: string) => {
    try {
      return JSON.stringify(JSON.parse(args), null, 2);
    } catch {
      return args;
    }
  };

  return (
    <Card className="border-l-4 border-l-blue-500" data-testid={`tool-call-${toolCall.id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Badge variant="secondary" className="flex items-center gap-1">
              {getToolIcon(toolCall.function.name)}
              {getToolDisplayName(toolCall.function.name)}
            </Badge>
          </CardTitle>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" data-testid={`button-view-details-${toolCall.id}`}>
                <Eye className="h-3 w-3 mr-1" />
                Details
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {getToolIcon(toolCall.function.name)}
                  Tool Execution Details
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Function Name</h4>
                  <code className="text-sm bg-muted p-2 rounded block">
                    {toolCall.function.name}
                  </code>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Parameters</h4>
                  <ScrollArea className="h-40 w-full border rounded">
                    <pre className="text-xs p-3 whitespace-pre-wrap">
                      {formatArguments(toolCall.function.arguments)}
                    </pre>
                  </ScrollArea>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Tool Call ID</h4>
                  <code className="text-xs bg-muted p-2 rounded block break-all">
                    {toolCall.id}
                  </code>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-xs text-muted-foreground">
          <div className="mb-1">
            <strong>Executing:</strong> {toolCall.function.name}
          </div>
          <div className="font-mono bg-muted/50 p-2 rounded text-xs max-h-20 overflow-y-auto">
            {(() => {
              try {
                const args = JSON.parse(toolCall.function.arguments);
                return Object.entries(args).map(([key, value]) => (
                  <div key={key}>
                    <span className="text-blue-600">{key}:</span> {String(value)}
                  </div>
                ));
              } catch {
                return toolCall.function.arguments;
              }
            })()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
