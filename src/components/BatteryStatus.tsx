import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusIndicator } from "./StatusIndicator";
import { Battery } from "lucide-react";
import { cn } from "@/lib/utils";

interface BatteryStatusProps {
  percentage: number;
  voltage: number;
  current: number;
  temperature: number;
}

export function BatteryStatus({ percentage, voltage, current, temperature }: BatteryStatusProps) {
  const getStatus = () => {
    if (percentage > 50) return "online";
    if (percentage > 20) return "warning";
    return "error";
  };

  const getBatteryFillColor = () => {
    if (percentage > 50) return "bg-success";
    if (percentage > 20) return "bg-warning";
    return "bg-destructive";
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Battery className="h-5 w-5" />
            Battery Status
          </CardTitle>
          <StatusIndicator 
            status={getStatus()}
            label={`${percentage}%`}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Battery Visual */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-16 h-8 border-2 border-foreground rounded-sm">
              <div 
                className={cn(
                  "h-full rounded-sm transition-all duration-300",
                  getBatteryFillColor()
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-4 bg-foreground rounded-r" />
          </div>
          <span className="text-2xl font-mono font-bold">
            {percentage}%
          </span>
        </div>

        {/* Technical Data */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Voltage</div>
            <div className="font-mono font-semibold">{voltage.toFixed(2)}V</div>
          </div>
          <div>
            <div className="text-muted-foreground">Current</div>
            <div className="font-mono font-semibold">{current.toFixed(2)}A</div>
          </div>
          <div>
            <div className="text-muted-foreground">Temperature</div>
            <div className="font-mono font-semibold">{temperature}°C</div>
          </div>
          <div>
            <div className="text-muted-foreground">Status</div>
            <div className="font-semibold capitalize">{getStatus()}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}