import { useState, useEffect } from "react";
import { ChatContainer } from "@/components/agent/chat-container";
import { ModelPicker } from "@/components/agent/model-picker";
import { ToolStatus } from "@/components/agent/tool-status";
import { InputContainer } from "@/components/agent/input-container";
import { useAgent } from "@/hooks/use-agent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Download, Trash2, Menu, Cpu, Bolt, BarChart3 } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";

export default function AgentPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();
  const {
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
  } = useAgent();

  const handleExportConversation = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      config: { ...config, apiKey: "[REDACTED]" },
      messages: messages,
      stats: stats,
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-conversation-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Conversation Exported",
      description: "Your conversation has been downloaded as a JSON file.",
    });
  };

  const SidebarContent = () => (
    <div className="h-full flex flex-col">
      <div className="p-4 space-y-4">
        {/* Model Configuration */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Cpu className="h-4 w-4" />
              LLM Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ModelPicker config={config} onConfigChange={updateConfig} />
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={testConnection}
              data-testid="button-test-connection"
            >
              Test Connection
            </Button>
          </CardContent>
        </Card>

        {/* Tool Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bolt className="h-4 w-4" />
              Available Bolt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ToolStatus />
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4" />
              Session Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-primary" data-testid="text-message-count">
                  {stats.messages}
                </div>
                <div className="text-xs text-muted-foreground">Messages</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600" data-testid="text-tool-calls">
                  {stats.toolCalls}
                </div>
                <div className="text-xs text-muted-foreground">Tool Calls</div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-600" data-testid="text-tokens">
                  {stats.tokens > 1000 ? `${(stats.tokens / 1000).toFixed(1)}k` : stats.tokens}
                </div>
                <div className="text-xs text-muted-foreground">Tokens</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden" data-testid="button-mobile-menu">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SidebarContent />
              </SheetContent>
            </Sheet>
            
            <div>
              <h1 className="text-xl font-bold">LLM Agent Console</h1>
              <p className="text-sm text-muted-foreground">Multi-tool reasoning and conversation</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearConversation}
              data-testid="button-clear-conversation"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportConversation}
              data-testid="button-export-conversation"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-80 border-r bg-muted/20">
          <SidebarContent />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="m-4 mb-0">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex justify-between items-center">
                <span data-testid="text-error-message">{error}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearError}
                  data-testid="button-clear-error"
                >
                  ×
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Chat Container */}
          <div className="flex-1 p-4 min-h-0">
            <ChatContainer 
              messages={messages} 
              isProcessing={isProcessing}
              data-testid="container-chat"
            />
          </div>

          {/* Input Container */}
          <div className="border-t bg-card">
            <div className="p-4">
              <InputContainer 
                onSendMessage={sendMessage}
                isProcessing={isProcessing}
                hasApiKey={!!config.apiKey}
                provider={config.provider}
                data-testid="container-input"
              />
            </div>
            
            {/* Status Bar */}
            <div className="border-t px-4 py-2 bg-muted/20">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span data-testid="text-connection-status">Connected</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span data-testid="text-activity-status">
                      {isProcessing ? 'Processing...' : 'Idle'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>Press Ctrl+Enter to send</span>
                  <Badge variant="secondary" data-testid="badge-response-time">
                    ~{stats.avgResponseTime}s avg
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
