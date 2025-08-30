import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

interface ToolStatusItem {
  name: string;
  displayName: string;
  status: 'ready' | 'error' | 'unavailable';
}

interface HealthCheckResponse {
  status: string;
  timestamp: string;
  tools: {
    googleSearch: boolean;
    aiPipe: boolean;
    jsExecution: boolean;
  };
}

export function ToolStatus() {
  const { data: healthCheck } = useQuery<HealthCheckResponse>({
    queryKey: ['/api/health'],
    refetchInterval: 30000, // Check every 30 seconds
  });

  const tools: ToolStatusItem[] = [
    {
      name: 'googleSearch',
      displayName: 'Google Search',
      status: healthCheck?.tools?.googleSearch ? 'ready' : 'unavailable'
    },
    {
      name: 'aiPipe',
      displayName: 'AI Pipe API',
      status: healthCheck?.tools?.aiPipe ? 'ready' : 'unavailable'
    },
    {
      name: 'jsExecution',
      displayName: 'JS Execution',
      status: healthCheck?.tools?.jsExecution ? 'ready' : 'unavailable'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return <Badge variant="default" className="bg-green-100 text-green-800">Ready</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'unavailable':
        return <Badge variant="secondary">Unavailable</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-3">
      {tools.map((tool) => (
        <div 
          key={tool.name} 
          className="flex items-center justify-between"
          data-testid={`tool-status-${tool.name}`}
        >
          <span className="font-medium text-sm">{tool.displayName}</span>
          {getStatusBadge(tool.status)}
        </div>
      ))}
      
      <div className="text-xs text-muted-foreground mt-3">
        Last checked: {healthCheck ? new Date().toLocaleTimeString() : 'Never'}
      </div>
    </div>
  );
}
