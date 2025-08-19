import { useState, useEffect } from "react";

export function Header() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <header className="border-b bg-card px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rover Dashboard</h1>
          <p className="text-sm text-muted-foreground">Real-time monitoring and control</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Local Time</div>
          <div className="text-sm font-mono font-semibold">
            {currentTime.toLocaleTimeString()}
          </div>
        </div>
      </div>
    </header>
  );
}