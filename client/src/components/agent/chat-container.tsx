import { useEffect, useRef } from "react";
import { Message } from "@/components/agent/message";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Bot } from "lucide-react";
import type { Message as MessageType } from "@shared/schema";

interface ChatContainerProps {
  messages: MessageType[];
  isProcessing: boolean;
}

export function ChatContainer({ messages, isProcessing }: ChatContainerProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing]);

  return (
    <Card className="h-full flex flex-col">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef} data-testid="scroll-chat-messages">
        <div className="space-y-4">
          {/* Welcome Message */}
          {messages.length === 0 && (
            <div className="flex items-center justify-center p-8 text-center">
              <div className="space-y-3">
                <div className="flex justify-center">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Bot className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="font-medium">Agent Initialized</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ready to assist with multi-tool reasoning tasks
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((message) => (
            <Message key={message.id} message={message} data-testid={`message-${message.id}`} />
          ))}

          {/* Typing Indicator */}
          {isProcessing && (
            <div className="flex items-center gap-3 text-muted-foreground p-4" data-testid="indicator-typing">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="italic">Agent is thinking...</span>
            </div>
          )}

          <div ref={endRef} />
        </div>
      </ScrollArea>
    </Card>
  );
}
