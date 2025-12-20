import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const glassCardVariants = cva(
  "relative overflow-hidden rounded-xl border backdrop-blur-md transition-all duration-300",
  {
    variants: {
      variant: {
        default:
          "bg-card/60 border-border/30 shadow-md hover:border-border/50",
        elevated:
          "bg-card/80 border-border/40 shadow-lg hover:shadow-xl hover:border-primary/30",
        glow:
          "bg-card/60 border-primary/20 shadow-glow hover:border-primary/40",
        metric:
          "bg-gradient-to-br from-card/80 to-card/40 border-border/30 shadow-md",
        interactive:
          "bg-card/60 border-border/30 shadow-md hover:bg-card/80 hover:border-primary/30 hover:shadow-lg cursor-pointer",
      },
      size: {
        sm: "p-3",
        default: "p-4 md:p-6",
        lg: "p-6 md:p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {
  shimmer?: boolean;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant, size, shimmer, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(glassCardVariants({ variant, size }), className)}
        {...props}
      >
        {/* Shimmer overlay */}
        {shimmer && (
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-foreground/5 to-transparent" />
        )}
        {/* Subtle gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-foreground/[0.02] to-transparent" />
        {/* Content */}
        <div className="relative z-10">{children}</div>
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";

// Specialized card for metrics/stats
const MetricCard = React.forwardRef<
  HTMLDivElement,
  GlassCardProps & {
    label: string;
    value: string | number;
    change?: number;
    icon?: React.ReactNode;
  }
>(({ className, label, value, change, icon, ...props }, ref) => {
  const isPositive = change !== undefined && change >= 0;

  return (
    <GlassCard
      ref={ref}
      variant="metric"
      size="default"
      className={cn("group", className)}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          {change !== undefined && (
            <div
              className={cn(
                "inline-flex items-center gap-1 text-sm font-medium",
                isPositive ? "text-positive" : "text-negative"
              )}
            >
              <span>{isPositive ? "↑" : "↓"}</span>
              <span>{Math.abs(change).toFixed(2)}%</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="rounded-lg bg-primary/10 p-2.5 text-primary transition-colors group-hover:bg-primary/20">
            {icon}
          </div>
        )}
      </div>
    </GlassCard>
  );
});

MetricCard.displayName = "MetricCard";

export { GlassCard, MetricCard, glassCardVariants };
