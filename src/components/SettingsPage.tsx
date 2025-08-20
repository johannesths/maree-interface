import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type TopicsConfig = {
  cam1_topic: string;
  cam2_topic: string;
  odom_topic: string;
};

export function SettingsPage() {
  const backendUrl = useMemo(() => {
    const fromEnv = (import.meta as any).env?.VITE_BACKEND_URL as
      | string
      | undefined;
    return fromEnv?.replace(/\/$/, "") || "http://localhost:8000";
  }, []);

  const [cfg, setCfg] = useState<TopicsConfig>({
    cam1_topic: "",
    cam2_topic: "",
    odom_topic: "",
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetch(`${backendUrl}/config/topics`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (isMounted) setCfg(data);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Failed to load topics config", e);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [backendUrl]);

  const onSave = async () => {
    setLoading(true);
    setSaved(false);
    try {
      const res = await fetch(`${backendUrl}/config/topics`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSaved(true);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Failed to save topics config", e);
    } finally {
      setLoading(false);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <Card className="border-border bg-card max-w-2xl">
      <CardHeader>
        <CardTitle>Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">
            Camera 1 Topic
          </label>
          <Input
            value={cfg.cam1_topic}
            onChange={(e) =>
              setCfg((c) => ({ ...c, cam1_topic: e.target.value }))
            }
            placeholder="/camera/left/image_raw/compressed"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">
            Camera 2 Topic
          </label>
          <Input
            value={cfg.cam2_topic}
            onChange={(e) =>
              setCfg((c) => ({ ...c, cam2_topic: e.target.value }))
            }
            placeholder="/camera/right/image_raw/compressed"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">
            Odometry Topic
          </label>
          <Input
            value={cfg.odom_topic}
            onChange={(e) =>
              setCfg((c) => ({ ...c, odom_topic: e.target.value }))
            }
            placeholder="/odom"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={onSave} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
          {saved && <span className="text-sm text-green-600">Saved</span>}
        </div>
      </CardContent>
    </Card>
  );
}
