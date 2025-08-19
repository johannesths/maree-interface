import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Zap } from "lucide-react";

interface NavigationProps {
  activeTab: string;
  onTabChange: (value: string) => void;
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <div className="border-b bg-card px-6 py-2">
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="cameras" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Cameras
          </TabsTrigger>
          <TabsTrigger value="telemetry" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Telemetry
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}