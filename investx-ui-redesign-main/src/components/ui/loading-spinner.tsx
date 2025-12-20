import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "default" | "lg";
  className?: string;
  label?: string;
}

export function LoadingSpinner({
  size = "default",
  className,
  label,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className="relative">
        {/* Outer ring */}
        <div
          className={cn(
            "rounded-full border-2 border-muted",
            sizeClasses[size]
          )}
        />
        {/* Spinning arc */}
        <div
          className={cn(
            "absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin",
            sizeClasses[size]
          )}
        />
        {/* Inner glow */}
        <div
          className={cn(
            "absolute inset-1 rounded-full bg-primary/10 animate-pulse",
            size === "sm" && "inset-0.5"
          )}
        />
      </div>
      {label && (
        <p className="text-sm text-muted-foreground animate-pulse">{label}</p>
      )}
    </div>
  );
}

export function FullPageLoader({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          {/* Logo pulse */}
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-glow animate-pulse" />
          {/* Orbiting dots */}
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: "2s" }}>
            <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-primary" />
          </div>
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: "3s" }}>
            <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-accent" />
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground">InvestX Labs</h3>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}
