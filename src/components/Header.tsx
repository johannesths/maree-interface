import { useState, useEffect } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Battery } from "lucide-react";
import { useOperationMode } from "@/hooks/useOperationMode";

export function Header() {
  const { mode, isLoading, error } = useOperationMode();
  const [batteryVoltage, setBatteryVoltage] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPinkMode, setIsPinkMode] = useState(false);

  // Fetch battery voltage from backend
  useEffect(() => {
    const fetchBatteryVoltage = async () => {
      try {
        const backendUrl =
          (import.meta as any).env?.VITE_BACKEND_URL?.replace(/\/$/, "") ||
          "http://localhost:8000";
        const response = await fetch(`${backendUrl}/api/battery/voltage`);
        if (response.ok) {
          const data = await response.json();
          setBatteryVoltage(data.voltage);
        }
      } catch (error) {
        console.error("Failed to fetch battery voltage:", error);
      }
    };

    // Fetch immediately and then every 5 seconds
    fetchBatteryVoltage();
    const interval = setInterval(fetchBatteryVoltage, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isPinkMode) {
      document.documentElement.classList.add("pink-mode");
    } else {
      document.documentElement.classList.remove("pink-mode");
    }
  }, [isPinkMode]);

  const handleLogoClick = () => {
    setIsPinkMode(!isPinkMode);
  };

  const getBatteryColor = (voltage: number) => {
    if (voltage >= 12.0) return "text-green-500";
    if (voltage >= 11.0) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <header className="border-b bg-card px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img
            src="/assets/80f24476-8e26-46e8-8f14-102afeb3dac6.png"
            alt="WARR Logo"
            className="h-12 w-auto cursor-pointer transition-transform hover:scale-105"
            onClick={handleLogoClick}
          />
        </div>
        <div className="text-center flex-1">
          <h1 className="text-2xl font-bold text-foreground">
            MAREE Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Real-time monitoring and control
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-base md:text-lg text-muted-foreground">
              Mode:
            </span>
            <Badge
              variant={mode === "autonomous" ? "default" : "secondary"}
              className="capitalize text-base md:text-lg px-3 py-1"
            >
              {isLoading ? "Loading..." : error ? "Error" : mode}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Battery className="h-5 w-5 text-muted-foreground" />
            <span className="text-base md:text-lg text-muted-foreground">
              Battery:
            </span>
            <span
              className={`text-base md:text-lg font-mono font-semibold ${
                batteryVoltage
                  ? getBatteryColor(batteryVoltage)
                  : "text-muted-foreground"
              }`}
            >
              {batteryVoltage ? `${batteryVoltage.toFixed(1)}V` : "N/A"}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const event = new CustomEvent("toggle-messages-sidebar");
              window.dispatchEvent(event);
            }}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
