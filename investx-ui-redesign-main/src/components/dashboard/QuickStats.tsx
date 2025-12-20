import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, DollarSign, PieChart, Percent, BarChart3 } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
  delay?: number;
}

function StatCard({ label, value, change, icon, delay = 0 }: StatCardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div 
      className="stat-card opacity-0 animate-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        {change !== undefined && (
          <div
            className={cn(
              "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
              isPositive 
                ? "bg-positive/10 text-positive" 
                : "bg-negative/10 text-negative"
            )}
          >
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span className="tabular-nums">
              {isPositive ? "+" : ""}
              {change.toFixed(2)}%
            </span>
          </div>
        )}
      </div>
      <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
    </div>
  );
}

interface QuickStatsProps {
  stats?: {
    totalValue: number;
    dayChange: number;
    dayChangePercent: number;
    totalGain: number;
    totalGainPercent: number;
    holdingsCount: number;
  };
}

const defaultStats = {
  totalValue: 125847.32,
  dayChange: 1234.56,
  dayChangePercent: 0.99,
  totalGain: 15847.32,
  totalGainPercent: 14.4,
  holdingsCount: 12,
};

export function QuickStats({ stats = defaultStats }: QuickStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <StatCard
        label="Total Portfolio Value"
        value={`$${stats.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
        change={stats.dayChangePercent}
        icon={<DollarSign className="h-6 w-6" />}
        delay={0}
      />
      <StatCard
        label="Today's P&L"
        value={`${stats.dayChange >= 0 ? "+" : "-"}$${Math.abs(stats.dayChange).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
        change={stats.dayChangePercent}
        icon={<BarChart3 className="h-6 w-6" />}
        delay={50}
      />
      <StatCard
        label="Total Returns"
        value={`${stats.totalGain >= 0 ? "+" : "-"}$${Math.abs(stats.totalGain).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
        change={stats.totalGainPercent}
        icon={<Percent className="h-6 w-6" />}
        delay={100}
      />
      <StatCard
        label="Active Holdings"
        value={stats.holdingsCount.toString()}
        icon={<PieChart className="h-6 w-6" />}
        delay={150}
      />
    </div>
  );
}
