import { useState, useEffect } from "react";

export function Header() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [missionTime, setMissionTime] = useState(0);

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
    <header className="border-b bg-card px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rover Dashboard</h1>
          <p className="text-sm text-muted-foreground">Real-time monitoring and control</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Mission Time</div>
            <div className="text-sm font-mono font-semibold text-primary">
              {formatMissionTime(missionTime)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Local Time</div>
            <div className="text-sm font-mono font-semibold">
              {currentTime.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}