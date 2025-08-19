import { useState, useEffect } from "react";
import { MapPin, Navigation, Gauge } from "lucide-react";

interface PositionalDataType {
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
}

export function PositionalData() {
  const [position, setPosition] = useState<PositionalDataType>({
    latitude: 0,
    longitude: 0,
    heading: 0,
    speed: 0
  });
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Replace with your actual websocket endpoint
    const ws = new WebSocket('ws://localhost:8000/ws/position');
    
    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setPosition(data);
      } catch (error) {
        console.error('Failed to parse positional data:', error);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div className="bg-card border rounded-lg p-3 mt-2">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-foreground">Position Data</h4>
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-destructive'}`} />
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center gap-1">
          <MapPin className="w-3 h-3 text-muted-foreground" />
          <span className="text-muted-foreground">Lat:</span>
          <span className="font-mono">{position.latitude.toFixed(6)}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <MapPin className="w-3 h-3 text-muted-foreground" />
          <span className="text-muted-foreground">Lng:</span>
          <span className="font-mono">{position.longitude.toFixed(6)}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Navigation className="w-3 h-3 text-muted-foreground" />
          <span className="text-muted-foreground">Heading:</span>
          <span className="font-mono">{position.heading.toFixed(1)}°</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Gauge className="w-3 h-3 text-muted-foreground" />
          <span className="text-muted-foreground">Speed:</span>
          <span className="font-mono">{position.speed.toFixed(2)} m/s</span>
        </div>
      </div>
    </div>
  );
}