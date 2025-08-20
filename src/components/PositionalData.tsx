import { useState, useEffect, useMemo } from "react";
import { Navigation, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";

interface PositionalDataType {
  x: number;
  y: number;
  yaw_deg: number;
  twist_linear_x: number;
  twist_linear_y: number;
  twist_angular_z: number;
}

interface PositionalDataProps {
  variant?: "default" | "overlay";
}

export function PositionalData({ variant = "default" }: PositionalDataProps) {
  const [position, setPosition] = useState<PositionalDataType>({
    x: 0,
    y: 0,
    yaw_deg: 0,
    twist_linear_x: 0,
    twist_linear_y: 0,
    twist_angular_z: 0,
  });
  const [isConnected, setIsConnected] = useState(false);

  const backendUrl = useMemo(() => {
    const fromEnv = (import.meta as any).env?.VITE_BACKEND_URL as
      | string
      | undefined;
    return fromEnv?.replace(/\/$/, "") || "http://localhost:8000";
  }, []);

  useEffect(() => {
    const wsProtocol = backendUrl.startsWith("https") ? "wss" : "ws";
    const ws = new WebSocket(
      `${wsProtocol}://${backendUrl.replace(/^https?:\/\//, "")}/ws/position`
    );

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setPosition(data);
      } catch (error) {
        console.error("Failed to parse positional data:", error);
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
  }, []);

  const isOverlay = variant === "overlay";
  const labelClass = isOverlay ? "text-white/80" : "text-muted-foreground";
  const iconClass = isOverlay ? "text-white/70" : "text-muted-foreground";

  return (
    <div
      className={cn(
        "border rounded-lg p-3 mt-2",
        isOverlay ? "bg-transparent text-white border-white/30" : "bg-card"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <h4
          className={cn(
            "text-sm font-medium",
            isOverlay ? "text-white" : "text-foreground"
          )}
        >
          Position Data
        </h4>
        <div
          className={`w-2 h-2 rounded-full ${
            isConnected ? "bg-success" : "bg-destructive"
          }`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center gap-1">
          <span className={labelClass}>x:</span>
          <span className="font-mono">{position.x.toFixed(3)}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className={labelClass}>y:</span>
          <span className="font-mono">{position.y.toFixed(3)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Navigation className={cn("w-3 h-3", iconClass)} />
          <span className={labelClass}>yaw:</span>
          <span className="font-mono">{position.yaw_deg.toFixed(1)}°</span>
        </div>
        <div className="flex items-center gap-1">
          <Gauge className={cn("w-3 h-3", iconClass)} />
          <span className={labelClass}>twist.lin.x:</span>
          <span className="font-mono">
            {position.twist_linear_x.toFixed(2)} m/s
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Gauge className={cn("w-3 h-3", iconClass)} />
          <span className={labelClass}>twist.lin.y:</span>
          <span className="font-mono">
            {position.twist_linear_y.toFixed(2)} m/s
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Gauge className={cn("w-3 h-3", iconClass)} />
          <span className={labelClass}>twist.ang.z:</span>
          <span className="font-mono">
            {position.twist_angular_z.toFixed(2)} rad/s
          </span>
        </div>
      </div>
    </div>
  );
}
