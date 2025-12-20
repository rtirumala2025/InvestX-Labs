import { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { GlassCard, MetricCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { PortfolioChart } from "@/components/dashboard/PortfolioChart";
import { cn } from "@/lib/utils";
import {
  Plus,
  Upload,
  Download,
  Filter,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
} from "lucide-react";

interface Holding {
  symbol: string;
  name: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  value: number;
  gain: number;
  gainPercent: number;
  allocation: number;
}

const mockHoldings: Holding[] = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    shares: 50,
    avgCost: 145.00,
    currentPrice: 178.52,
    value: 8926.00,
    gain: 1676.00,
    gainPercent: 23.10,
    allocation: 18.5,
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    shares: 20,
    avgCost: 380.00,
    currentPrice: 495.22,
    value: 9904.40,
    gain: 2304.40,
    gainPercent: 30.32,
    allocation: 20.5,
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    shares: 25,
    avgCost: 320.00,
    currentPrice: 378.91,
    value: 9472.75,
    gain: 1472.75,
    gainPercent: 18.41,
    allocation: 19.6,
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    shares: 40,
    avgCost: 125.00,
    currentPrice: 141.23,
    value: 5649.20,
    gain: 649.20,
    gainPercent: 12.98,
    allocation: 11.7,
  },
  {
    symbol: "AMZN",
    name: "Amazon.com Inc.",
    shares: 30,
    avgCost: 150.00,
    currentPrice: 178.25,
    value: 5347.50,
    gain: 847.50,
    gainPercent: 18.83,
    allocation: 11.1,
  },
  {
    symbol: "TSLA",
    name: "Tesla, Inc.",
    shares: 15,
    avgCost: 275.00,
    currentPrice: 248.50,
    value: 3727.50,
    gain: -397.50,
    gainPercent: -9.64,
    allocation: 7.7,
  },
];

export default function PortfolioPage() {
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [activeTab, setActiveTab] = useState<"holdings" | "transactions">("holdings");

  const totalValue = mockHoldings.reduce((sum, h) => sum + h.value, 0);
  const totalGain = mockHoldings.reduce((sum, h) => sum + h.gain, 0);
  const totalGainPercent = (totalGain / (totalValue - totalGain)) * 100;

  return (
    <div className="min-h-screen">
      <TopBar
        title="Portfolio"
        subtitle="Track and manage your investments"
      />

      <div className="p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total Value"
            value={`$${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
            icon={<DollarSign className="h-5 w-5" />}
            className="animate-slide-up stagger-1"
          />
          <MetricCard
            label="Total Gain/Loss"
            value={`${totalGain >= 0 ? "+" : ""}$${Math.abs(totalGain).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
            change={totalGainPercent}
            icon={<TrendingUp className="h-5 w-5" />}
            className="animate-slide-up stagger-2"
          />
          <MetricCard
            label="Holdings"
            value={mockHoldings.length.toString()}
            icon={<PieChart className="h-5 w-5" />}
            className="animate-slide-up stagger-3"
          />
          <MetricCard
            label="Best Performer"
            value="NVDA +30.3%"
            icon={<TrendingUp className="h-5 w-5" />}
            className="animate-slide-up stagger-4"
          />
        </div>

        {/* Chart */}
        <PortfolioChart />

        {/* Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GlassButton
              variant={activeTab === "holdings" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("holdings")}
            >
              Holdings
            </GlassButton>
            <GlassButton
              variant={activeTab === "transactions" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("transactions")}
            >
              Transactions
            </GlassButton>
          </div>

          <div className="flex items-center gap-2">
            <GlassButton variant="outline" size="sm">
              <Filter className="h-4 w-4" />
              Filter
            </GlassButton>
            <GlassButton
              variant="outline"
              size="sm"
              onClick={() => setShowUploadSection(!showUploadSection)}
            >
              <Upload className="h-4 w-4" />
              Import CSV
            </GlassButton>
            <GlassButton variant="outline" size="sm">
              <Download className="h-4 w-4" />
              Export
            </GlassButton>
            <GlassButton variant="glow" size="sm">
              <Plus className="h-4 w-4" />
              Add Holding
            </GlassButton>
          </div>
        </div>

        {/* Holdings Table */}
        <GlassCard variant="default">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr className="border-b border-border/50">
                  <th>Symbol</th>
                  <th>Shares</th>
                  <th>Avg Cost</th>
                  <th>Current Price</th>
                  <th>Market Value</th>
                  <th>Gain/Loss</th>
                  <th>Allocation</th>
                </tr>
              </thead>
              <tbody>
                {mockHoldings.map((holding) => (
                  <tr key={holding.symbol}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">
                          {holding.symbol.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {holding.symbol}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {holding.name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="mono-number">{holding.shares}</td>
                    <td className="mono-number">${holding.avgCost.toFixed(2)}</td>
                    <td className="mono-number">${holding.currentPrice.toFixed(2)}</td>
                    <td className="mono-number font-medium">
                      ${holding.value.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <div
                        className={cn(
                          "flex items-center gap-1",
                          holding.gain >= 0 ? "text-positive" : "text-negative"
                        )}
                      >
                        {holding.gain >= 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        <span className="mono-number">
                          {holding.gain >= 0 ? "+" : ""}
                          ${Math.abs(holding.gain).toFixed(2)} (
                          {holding.gainPercent >= 0 ? "+" : ""}
                          {holding.gainPercent.toFixed(2)}%)
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${holding.allocation}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {holding.allocation.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
