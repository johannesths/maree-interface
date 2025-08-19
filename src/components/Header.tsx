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
        <div className="flex items-center gap-4">
          <img 
            src="/lovable-uploads/80f24476-8e26-46e8-8f14-102afeb3dac6.png" 
            alt="WARR Logo" 
            className="h-12 w-auto"
          />
          <div>
            <h1 className="text-2xl font-bold text-foreground">MAREE Dashboard</h1>
            <p className="text-sm text-muted-foreground">Real-time monitoring and control</p>
          </div>
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