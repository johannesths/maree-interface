import { useMemo, useState, useEffect } from "react";

export type OperationMode = "autonomous" | "joystick";

export function useOperationMode() {
  const [mode, setMode] = useState<OperationMode>("joystick");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const backendUrl = useMemo(() => {
    const fromEnv = (import.meta as any).env?.VITE_BACKEND_URL as
      | string
      | undefined;
    return fromEnv?.replace(/\/$/, "") || "http://localhost:8000";
  }, []);

  useEffect(() => {
    const fetchOperationMode = async () => {
      try {
        // Replace with your actual HTTP endpoint
        const response = await fetch(`${backendUrl}/api/operation-mode`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setMode(data.mode);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch operation mode"
        );
        console.error("Error fetching operation mode:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOperationMode();

    // Poll every 5 seconds for mode changes
    const interval = setInterval(fetchOperationMode, 5000);

    return () => clearInterval(interval);
  }, [backendUrl]);

  return { mode, isLoading, error };
}
