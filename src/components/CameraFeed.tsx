import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusIndicator } from "./StatusIndicator";
import { PositionalData } from "./PositionalData";
import { Play, Pause, Settings, Maximize2 } from "lucide-react";

interface CameraFeedProps {
  cameraId: string;
  title: string;
  initialActive?: boolean;
}

export function CameraFeed({ cameraId, title, initialActive = false }: CameraFeedProps) {
  const [isActive, setIsActive] = useState(initialActive);
  const [isConnected, setIsConnected] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);

  const backendUrl = useMemo(() => {
    // Prefer vite env (define VITE_BACKEND_URL), fallback to localhost:8000
    const fromEnv = (import.meta as any).env?.VITE_BACKEND_URL as string | undefined;
    return fromEnv?.replace(/\/$/, "") || "http://localhost:8000";
  }, []);

  const toggleStream = () => {
    setIsActive(!isActive);
  };

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  if (isMaximized) {
    return (
      <div className="fixed inset-0 top-[73px] z-50 bg-background">
        <div className="relative w-full h-full bg-secondary/20">
          {isActive ? (
            <>
              <img
                src={`${backendUrl}/camera/${cameraId}/mjpeg`}
                alt={`${title} stream`}
                className="w-full h-full object-cover"
                onLoad={() => setIsConnected(true)}
                onError={() => setIsConnected(false)}
              />
              <div className="absolute inset-0 pointer-events-none" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-muted-foreground text-lg">
                Camera Standby - {title}
              </div>
            </div>
          )}
          
          {/* Control Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/80 to-transparent p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="secondary"
                  size="default"
                  onClick={toggleStream}
                  className="flex items-center gap-2"
                >
                  {isActive ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  {isActive ? "Stop" : "Start"}
                </Button>
                <StatusIndicator 
                  status={isConnected ? (isActive ? "online" : "warning") : "offline"}
                  label={isActive ? "LIVE" : "STANDBY"}
                />
              </div>
              
              <div className="flex gap-2">
                <Button variant="ghost" size="default">
                  <Settings className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="default" onClick={toggleMaximize}>
                  <Maximize2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Positional Data Overlay */}
          <div className="absolute bottom-0 right-0 m-6 mb-20">
            <PositionalData />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <StatusIndicator 
            status={isConnected ? (isActive ? "online" : "warning") : "offline"}
            label={isActive ? "LIVE" : "STANDBY"}
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative aspect-video bg-secondary/20 border-t border-border">
          {isActive ? (
            <img
              src={`${backendUrl}/camera/${cameraId}/mjpeg`}
              alt={`${title} stream`}
              className="w-full h-full object-cover"
              onLoad={() => setIsConnected(true)}
              onError={() => setIsConnected(false)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-muted-foreground text-sm">
                Camera Standby
              </div>
            </div>
          )}
          
          {/* Control Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/80 to-transparent p-3">
            <div className="flex items-center justify-between">
              <Button
                variant="secondary"
                size="sm"
                onClick={toggleStream}
                className="flex items-center gap-2"
              >
                {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isActive ? "Stop" : "Start"}
              </Button>
              
              <div className="flex gap-1">
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={toggleMaximize}>
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        <PositionalData />
      </CardContent>
    </Card>
  );
}