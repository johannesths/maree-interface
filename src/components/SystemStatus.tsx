import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusIndicator } from "./StatusIndicator";
import { Wifi, Satellite, Cpu, Thermometer } from "lucide-react";

interface SystemStatusProps {
  connectionStatus: "online" | "offline" | "warning";
  signalStrength: number;
  cpuUsage: number;
  systemTemp: number;
}

export function SystemStatus({ 
  connectionStatus, 
  signalStrength, 
  cpuUsage, 
  systemTemp 
}: SystemStatusProps) {
  const getSignalStatus = () => {
    if (signalStrength > 70) return "online";
    if (signalStrength > 30) return "warning";
    return "error";
  };

  const getCpuStatus = () => {
    if (cpuUsage < 70) return "online";
    if (cpuUsage < 90) return "warning";
    return "error";
  };

  const getTempStatus = () => {
    if (systemTemp < 60) return "online";
    if (systemTemp < 80) return "warning";
    return "error";
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Satellite className="h-5 w-5" />
          System Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              <span className="text-sm">Connection</span>
            </div>
            <StatusIndicator 
              status={connectionStatus}
              label={connectionStatus.toUpperCase()}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Satellite className="h-4 w-4" />
              <span className="text-sm">Signal</span>
            </div>
            <StatusIndicator 
              status={getSignalStatus()}
              label={`${signalStrength}%`}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              <span className="text-sm">CPU Usage</span>
            </div>
            <StatusIndicator 
              status={getCpuStatus()}
              label={`${cpuUsage}%`}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4" />
              <span className="text-sm">System Temp</span>
            </div>
            <StatusIndicator 
              status={getTempStatus()}
              label={`${systemTemp}°C`}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}