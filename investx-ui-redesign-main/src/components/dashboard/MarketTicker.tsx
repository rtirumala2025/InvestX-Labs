import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface TickerItem {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

const mockTickerData: TickerItem[] = [
  { symbol: "AAPL", price: 178.52, change: 2.34, changePercent: 1.33 },
  { symbol: "GOOGL", price: 141.23, change: -0.87, changePercent: -0.61 },
  { symbol: "MSFT", price: 378.91, change: 4.12, changePercent: 1.10 },
  { symbol: "AMZN", price: 178.25, change: 1.56, changePercent: 0.88 },
  { symbol: "TSLA", price: 248.50, change: -3.24, changePercent: -1.29 },
  { symbol: "NVDA", price: 495.22, change: 12.34, changePercent: 2.56 },
  { symbol: "META", price: 505.75, change: 8.91, changePercent: 1.79 },
  { symbol: "BRK.B", price: 362.45, change: 0.23, changePercent: 0.06 },
];

export function MarketTicker() {
  const items = [...mockTickerData, ...mockTickerData];

  return (
    <div className="relative overflow-hidden bg-card border-b border-border/50">
      <div className="flex animate-ticker">
        {items.map((item, index) => {
          const isPositive = item.change >= 0;
          return (
            <div
              key={`${item.symbol}-${index}`}
              className="flex items-center gap-4 px-8 py-3 shrink-0"
            >
              <span className="font-semibold text-foreground">{item.symbol}</span>
              <span className="tabular-nums text-sm text-muted-foreground">
                ${item.price.toFixed(2)}
              </span>
              <div
                className={cn(
                  "flex items-center gap-1 text-xs font-semibold tabular-nums",
                  isPositive ? "text-positive" : "text-negative"
                )}
              >
                {isPositive ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                <span>
                  {isPositive ? "+" : ""}
                  {item.changePercent.toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
