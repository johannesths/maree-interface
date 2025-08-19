import { useState, useEffect } from "react";
import { MessageSquare, X } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  text: string;
  timestamp: Date;
}

export function MessagesSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Replace with your actual websocket endpoint
    const ws = new WebSocket('ws://localhost:8000/ws/messages');
    
    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const newMessage: Message = {
          id: Date.now().toString(),
          text: data.text || data.message || event.data,
          timestamp: new Date()
        };
        
        setMessages(prev => [newMessage, ...prev].slice(0, 100)); // Keep last 100 messages
      } catch (error) {
        // If not JSON, treat as plain text
        const newMessage: Message = {
          id: Date.now().toString(),
          text: event.data,
          timestamp: new Date()
        };
        setMessages(prev => [newMessage, ...prev].slice(0, 100));
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  const clearMessages = () => {
    setMessages([]);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <Sidebar
      className={collapsed ? "w-14" : "w-80"}
      collapsible="icon"
      side="right"
    >
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                <span className="font-semibold">Messages</span>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-destructive'}`} />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearMessages}
                disabled={messages.length === 0}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel>
              Recent Messages ({messages.length})
            </SidebarGroupLabel>
          )}
          
          <SidebarGroupContent>
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-2 p-2">
                {messages.length === 0 ? (
                  !collapsed && (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      No messages yet
                    </div>
                  )
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className="p-3 bg-card border border-border rounded-lg space-y-1"
                    >
                      {!collapsed && (
                        <>
                          <div className="text-xs text-muted-foreground">
                            {formatTime(message.timestamp)}
                          </div>
                          <div className="text-sm break-words">
                            {message.text}
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}