import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusIndicator } from "./StatusIndicator";
import { Play, Pause, Settings, Maximize2 } from "lucide-react";

interface CameraFeedProps {
  cameraId: string;
  title: string;
  initialActive?: boolean;
}

export function CameraFeed({ cameraId, title, initialActive = false }: CameraFeedProps) {
  const [isActive, setIsActive] = useState(initialActive);
  const [isConnected, setIsConnected] = useState(true);

  const toggleStream = () => {
    setIsActive(!isActive);
  };

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
            <div className="w-full h-full flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
              <div className="text-muted-foreground text-sm">
                Camera Feed Active
              </div>
            </div>
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
                <Button variant="ghost" size="sm">
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}