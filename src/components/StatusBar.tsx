import { StatusIndicator } from "./StatusIndicator";

export function StatusBar() {
  return (
    <div className="border-b bg-muted/30 px-6 py-3">
      <div className="flex items-center gap-4">
        <StatusIndicator status="online" label="ROVER ONLINE" />
        <StatusIndicator status="online" label="TELEMETRY ACTIVE" />
      </div>
    </div>
  );
}