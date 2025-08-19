import { BatteryStatus } from "./BatteryStatus";
import { SystemStatus } from "./SystemStatus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TelemetryData {
  battery: {
    percentage: number;
    voltage: number;
    current: number;
    temperature: number;
  };
  system: {
    connectionStatus: "online" | "offline" | "warning";
    signalStrength: number;
    cpuUsage: number;
    systemTemp: number;
  };
}

interface TelemetryGridProps {
  telemetry: TelemetryData;
}

export function TelemetryGrid({ telemetry }: TelemetryGridProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <BatteryStatus {...telemetry.battery} />
      <SystemStatus {...telemetry.system} />
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Environmental Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Ambient Temp</div>
              <div className="font-mono font-semibold">-47°C</div>
            </div>
            <div>
              <div className="text-muted-foreground">Pressure</div>
              <div className="font-mono font-semibold">0.6 kPa</div>
            </div>
            <div>
              <div className="text-muted-foreground">Wind Speed</div>
              <div className="font-mono font-semibold">12 m/s</div>
            </div>
            <div>
              <div className="text-muted-foreground">Solar Irradiance</div>
              <div className="font-mono font-semibold">432 W/m²</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Position Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-muted-foreground">Coordinates</div>
              <div className="font-mono font-semibold">18.38°S 77.58°E</div>
            </div>
            <div>
              <div className="text-muted-foreground">Heading</div>
              <div className="font-mono font-semibold">127° SE</div>
            </div>
            <div>
              <div className="text-muted-foreground">Distance Traveled</div>
              <div className="font-mono font-semibold">24.7 km</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}