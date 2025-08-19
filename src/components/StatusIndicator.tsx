import { cn } from "@/lib/utils";

interface StatusIndicatorProps {
  status: "online" | "offline" | "warning" | "error";
  label: string;
  className?: string;
}

const statusConfig = {
  online: {
    color: "bg-success",
    glow: "shadow-[0_0_10px_hsl(var(--success))]",
    text: "text-success"
  },
  warning: {
    color: "bg-warning",
    glow: "shadow-[0_0_10px_hsl(var(--warning))]",
    text: "text-warning"
  },
  error: {
    color: "bg-destructive",
    glow: "shadow-[0_0_10px_hsl(var(--destructive))]",
    text: "text-destructive"
  },
  offline: {
    color: "bg-muted-foreground",
    glow: "",
    text: "text-muted-foreground"
  }
};

export function StatusIndicator({ status, label, className }: StatusIndicatorProps) {
  const config = statusConfig[status];
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div 
        className={cn(
          "w-3 h-3 rounded-full transition-all duration-300",
          config.color,
          config.glow
        )}
      />
      <span className={cn("text-sm font-medium", config.text)}>
        {label}
      </span>
    </div>
  );
}