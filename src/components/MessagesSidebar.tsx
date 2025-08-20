import { useState, useEffect, useMemo } from "react";
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
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastReceivedAt, setLastReceivedAt] = useState<Date | null>(null);
  const [nowTs, setNowTs] = useState<number>(Date.now());

  const backendUrl = useMemo(() => {
    const fromEnv = (import.meta as any).env?.VITE_BACKEND_URL as
      | string
      | undefined;
    return fromEnv?.replace(/\/$/, "") || "http://localhost:8000";
  }, []);

  useEffect(() => {
    const handleToggle = () => {
      setIsOpen((prev) => !prev);
    };

    window.addEventListener("toggle-messages-sidebar", handleToggle);

    return () => {
      window.removeEventListener("toggle-messages-sidebar", handleToggle);
    };
  }, []);

  useEffect(() => {
    const wsProtocol = backendUrl.startsWith("https") ? "wss" : "ws";
    const ws = new WebSocket(
      `${wsProtocol}://${backendUrl.replace(/^https?:\/\//, "")}/ws/messages`
    );

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const newMessage: Message = {
          id: Date.now().toString(),
          text: JSON.stringify(data),
          timestamp: new Date(),
        };

        setMessages((prev) => [newMessage, ...prev].slice(0, 100)); // Keep last 100 messages
        setLastReceivedAt(newMessage.timestamp);
      } catch (error) {
        // If not JSON, treat as plain text
        const newMessage: Message = {
          id: Date.now().toString(),
          text: event.data,
          timestamp: new Date(),
        };
        setMessages((prev) => [newMessage, ...prev].slice(0, 100));
        setLastReceivedAt(newMessage.timestamp);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [backendUrl]);

  // Tick every second so the "time since last" UI updates
  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const clearMessages = () => {
    setMessages([]);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const secondsSinceLast = (): number | null => {
    if (!lastReceivedAt) return null;
    return Math.max(0, Math.floor((nowTs - lastReceivedAt.getTime()) / 1000));
  };

  const timeSinceLastLabel = (): string => {
    const sec = secondsSinceLast();
    if (sec === null) return "No messages";
    if (sec < 60) return `${sec}s ago`;
    const minutes = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${minutes}m ${rem}s ago`;
  };

  const timeSinceBgClass = (): string => {
    const sec = secondsSinceLast();
    if (sec === null) return "bg-muted";
    if (sec <= 5) return "bg-green-500/20 text-green-700 dark:text-green-300";
    if (sec <= 15)
      return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300";
    return "bg-red-500/20 text-red-700 dark:text-red-300";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 right-0 h-full w-80 bg-background border-l border-border z-50">
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <span className="font-semibold">Messages</span>
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            />
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-3">
        <div
          className={`inline-block rounded px-2 py-1 text-[11px] ${timeSinceBgClass()} mb-2`}
        >
          Last message: {timeSinceLastLabel()}
        </div>
        <ScrollArea className="h-[calc(100vh-150px)]">
          <div className="space-y-2">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground text-xs py-6">
                No messages yet
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className="p-2 bg-card border border-border rounded-md space-y-1"
                >
                  <div className="text-[10px] text-muted-foreground">
                    {formatTime(message.timestamp)}
                  </div>
                  <div className="text-xs break-words font-mono leading-snug">
                    {message.text}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={clearMessages}
            disabled={messages.length === 0}
            className="w-full"
          >
            Clear Messages
          </Button>
        </div>
      </div>
    </div>
  );
}
