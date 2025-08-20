import { BatteryStatus } from "./BatteryStatus";
import { SystemStatus } from "./SystemStatus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useMemo, useState } from "react";
import { Navigation, Gauge } from "lucide-react";

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
  const backendUrl = useMemo(() => {
    const fromEnv = (import.meta as any).env?.VITE_BACKEND_URL as
      | string
      | undefined;
    return fromEnv?.replace(/\/$/, "") || "http://localhost:8000";
  }, []);

  type PosData = {
    x: number;
    y: number;
    yaw_deg: number;
    twist_linear_x: number;
    twist_linear_y: number;
    twist_angular_z: number;
  };

  const [pos, setPos] = useState<PosData>({
    x: 0,
    y: 0,
    yaw_deg: 0,
    twist_linear_x: 0,
    twist_linear_y: 0,
    twist_angular_z: 0,
  });
  const [posConnected, setPosConnected] = useState(false);
  const [batteryVoltage, setBatteryVoltage] = useState<number | null>(null);
  const [batteryUpdatedAt, setBatteryUpdatedAt] = useState<number | null>(null);

  useEffect(() => {
    const wsProtocol = backendUrl.startsWith("https") ? "wss" : "ws";
    const ws = new WebSocket(
      `${wsProtocol}://${backendUrl.replace(/^https?:\/\//, "")}/ws/position`
    );

    ws.onopen = () => setPosConnected(true);
    ws.onclose = () => setPosConnected(false);
    ws.onerror = () => setPosConnected(false);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as Partial<PosData>;
        setPos((prev) => ({
          x: data.x ?? prev.x,
          y: data.y ?? prev.y,
          yaw_deg: data.yaw_deg ?? prev.yaw_deg,
          twist_linear_x: data.twist_linear_x ?? prev.twist_linear_x,
          twist_linear_y: data.twist_linear_y ?? prev.twist_linear_y,
          twist_angular_z: data.twist_angular_z ?? prev.twist_angular_z,
        }));
      } catch {
        // ignore malformed
      }
    };

    return () => ws.close();
  }, [backendUrl]);

  // Poll battery voltage periodically via HTTP
  useEffect(() => {
    let isMounted = true;
    const fetchVoltage = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/battery/voltage`);
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted) return;
        setBatteryVoltage(
          typeof data.voltage === "number" ? data.voltage : null
        );
        setBatteryUpdatedAt(
          typeof data.updated_at === "number" ? data.updated_at : null
        );
      } catch {
        // ignore
      }
    };
    fetchVoltage();
    const id = setInterval(fetchVoltage, 2000);
    return () => {
      isMounted = false;
      clearInterval(id);
    };
  }, [backendUrl]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <BatteryStatus
        percentage={telemetry.battery.percentage}
        voltage={batteryVoltage ?? telemetry.battery.voltage}
        current={telemetry.battery.current}
        temperature={telemetry.battery.temperature}
      />
      <SystemStatus {...telemetry.system} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Environmental Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Ambient Temp</div>
              <div className="font-mono font-semibold">18°C</div>
            </div>
            <div>
              <div className="text-muted-foreground">Pressure</div>
              <div className="font-mono font-semibold">0.6 kPa</div>
            </div>
            <div>
              <div className="text-muted-foreground">Wind Speed</div>
              <div className="font-mono font-semibold">8 m/s</div>
            </div>
            <div>
              <div className="text-muted-foreground">Rain</div>
              <div className="font-mono font-semibold">25%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Position Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">WebSocket</span>
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                posConnected ? "bg-green-500" : "bg-red-500"
              }`}
              aria-label={posConnected ? "online" : "offline"}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">x</div>
              <div className="font-mono font-semibold">{pos.x.toFixed(3)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">y</div>
              <div className="font-mono font-semibold">{pos.y.toFixed(3)}</div>
            </div>
            <div className="flex items-center gap-1">
              <Navigation className="w-3 h-3 text-muted-foreground" />
              <div className="text-muted-foreground">yaw</div>
              <div className="font-mono font-semibold ml-auto">
                {pos.yaw_deg.toFixed(1)}°
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Gauge className="w-3 h-3 text-muted-foreground" />
              <div className="text-muted-foreground">twist.lin.x</div>
              <div className="font-mono font-semibold ml-auto">
                {pos.twist_linear_x.toFixed(2)} m/s
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Gauge className="w-3 h-3 text-muted-foreground" />
              <div className="text-muted-foreground">twist.lin.y</div>
              <div className="font-mono font-semibold ml-auto">
                {pos.twist_linear_y.toFixed(2)} m/s
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Gauge className="w-3 h-3 text-muted-foreground" />
              <div className="text-muted-foreground">twist.ang.z</div>
              <div className="font-mono font-semibold ml-auto">
                {pos.twist_angular_z.toFixed(2)} rad/s
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
