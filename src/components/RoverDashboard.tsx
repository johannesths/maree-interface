import { useState, useEffect } from "react";
import { CameraFeed } from "./CameraFeed";
import { BatteryStatus } from "./BatteryStatus";
import { SystemStatus } from "./SystemStatus";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusIndicator } from "./StatusIndicator";
import { Settings, Activity, Zap } from "lucide-react";

export function RoverDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [missionTime, setMissionTime] = useState(0);

  // Mock telemetry data
  const [telemetry, setTelemetry] = useState({
    battery: {
      percentage: 87,
      voltage: 28.4,
      current: -2.3,
      temperature: 45
    },
    system: {
      connectionStatus: "online" as const,
      signalStrength: 85,
      cpuUsage: 42,
      systemTemp: 58
    }
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setMissionTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatMissionTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-primary">MARS ROVER CONTROL</h1>
            <p className="text-muted-foreground">Mission Control Interface</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Mission Time</div>
              <div className="text-lg font-mono font-bold text-primary">
                {formatMissionTime(missionTime)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Local Time</div>
              <div className="text-lg font-mono font-bold">
                {currentTime.toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <StatusIndicator status="online" label="ROVER ONLINE" />
          <StatusIndicator status="online" label="TELEMETRY ACTIVE" />
          <StatusIndicator status="warning" label="SOLAR ARRAY DEPLOYED" />
        </div>
      </div>

      <Tabs defaultValue="cameras" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cameras" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Camera Systems
          </TabsTrigger>
          <TabsTrigger value="telemetry" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Telemetry
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cameras" className="space-y-6">
          {/* Camera Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CameraFeed 
              cameraId="cam1" 
              title="Front Navigation Camera" 
              initialActive={true}
            />
            <CameraFeed 
              cameraId="cam2" 
              title="Rear Hazard Avoidance" 
              initialActive={false}
            />
            <CameraFeed 
              cameraId="cam3" 
              title="Left Mast Camera" 
              initialActive={true}
            />
            <CameraFeed 
              cameraId="cam4" 
              title="Right Mast Camera" 
              initialActive={false}
            />
          </div>
        </TabsContent>

        <TabsContent value="telemetry" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BatteryStatus {...telemetry.battery} />
            <SystemStatus {...telemetry.system} />
            
            {/* Additional Telemetry */}
            <Card className="border-border bg-card">
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

            <Card className="border-border bg-card">
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
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Backend Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">FastAPI Backend URL</label>
                <input 
                  type="text" 
                  className="w-full mt-1 px-3 py-2 bg-input border border-border rounded-md text-sm"
                  placeholder="http://localhost:8000"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Connection Timeout (ms)</label>
                <input 
                  type="number" 
                  className="w-full mt-1 px-3 py-2 bg-input border border-border rounded-md text-sm"
                  placeholder="5000"
                />
              </div>
              <Button className="w-full">
                Test Connection
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}