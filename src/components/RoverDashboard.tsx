import { useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Header } from "./Header";
import { Navigation } from "./Navigation";
import { StatusBar } from "./StatusBar";
import { CameraGrid } from "./CameraGrid";
import { TelemetryGrid } from "./TelemetryGrid";
import { SettingsPage } from "./SettingsPage";
import { MessagesSidebar } from "./MessagesSidebar";

export function RoverDashboard() {
  const [activeTab, setActiveTab] = useState("cameras");

  // Mock telemetry data
  const telemetry = {
    battery: {
      percentage: 87,
      voltage: 28.4,
      current: -2.3,
      temperature: 45,
    },
    system: {
      connectionStatus: "online" as const,
      signalStrength: 85,
      cpuUsage: 42,
      systemTemp: 58,
    },
  };

  return (
    <div className="flex min-h-screen w-full">
      <div className="flex-1 bg-background">
        <Header />
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        <StatusBar />

        <main className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="cameras">
              <CameraGrid />
            </TabsContent>

            <TabsContent value="telemetry">
              <TelemetryGrid telemetry={telemetry} />
            </TabsContent>

            <TabsContent value="settings">
              <SettingsPage />
            </TabsContent>
          </Tabs>
        </main>
      </div>
      <MessagesSidebar />
    </div>
  );
}
