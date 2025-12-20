import { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { GlassCard, MetricCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Search,
  TrendingUp,
  TrendingDown,
  DollarSign,
  RefreshCw,
  Undo2,
  History,
  Trophy,
} from "lucide-react";

// Mock simulation data
const mockSimulationData = {
  virtualBalance: 100000,
  portfolioValue: 112450.75,
  totalReturn: 12450.75,
  totalReturnPercent: 12.45,
  holdings: [
    { symbol: "AAPL", shares: 50, avgPrice: 170.00, currentPrice: 178.52, value: 8926.00 },
    { symbol: "GOOGL", shares: 30, avgPrice: 135.00, currentPrice: 141.23, value: 4236.90 },
    { symbol: "MSFT", shares: 20, avgPrice: 360.00, currentPrice: 378.91, value: 7578.20 },
  ],
  recentTrades: [
    { id: 1, type: "buy", symbol: "AAPL", shares: 10, price: 175.50, timestamp: "2 hours ago" },
    { id: 2, type: "sell", symbol: "TSLA", shares: 5, price: 250.00, timestamp: "5 hours ago" },
    { id: 3, type: "buy", symbol: "NVDA", shares: 8, price: 490.00, timestamp: "1 day ago" },
  ],
};

export default function SimulationPage() {
  const [activeTab, setActiveTab] = useState("trade");
  const [searchQuery, setSearchQuery] = useState("");
  const [orderType, setOrderType] = useState<"buy" | "sell">("buy");
  const [shares, setShares] = useState("");

  const cashBalance = mockSimulationData.virtualBalance - 
    mockSimulationData.holdings.reduce((sum, h) => sum + h.value, 0);

  return (
    <div className="min-h-screen">
      <TopBar
        title="Trading Simulation"
        subtitle="Practice trading with virtual money — risk-free!"
      />

      <div className="p-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Portfolio Value"
            value={`$${mockSimulationData.portfolioValue.toLocaleString()}`}
            change={mockSimulationData.totalReturnPercent}
            icon={<DollarSign className="h-5 w-5" />}
            className="animate-slide-up stagger-1"
          />
          <MetricCard
            label="Cash Balance"
            value={`$${cashBalance.toLocaleString()}`}
            icon={<DollarSign className="h-5 w-5" />}
            className="animate-slide-up stagger-2"
          />
          <MetricCard
            label="Total Return"
            value={`+$${mockSimulationData.totalReturn.toLocaleString()}`}
            change={mockSimulationData.totalReturnPercent}
            icon={<TrendingUp className="h-5 w-5" />}
            className="animate-slide-up stagger-3"
          />
          <MetricCard
            label="Trades Made"
            value="47"
            icon={<History className="h-5 w-5" />}
            className="animate-slide-up stagger-4"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <GlassButton variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
            Reset Simulation
          </GlassButton>
          <GlassButton variant="outline" size="sm">
            <Undo2 className="h-4 w-4" />
            Undo Last Trade
          </GlassButton>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="trade">Trade</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Trade Tab */}
          <TabsContent value="trade" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Stock Search */}
              <GlassCard variant="elevated" className="lg:col-span-2">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Search Stocks
                </h3>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by symbol or company name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {/* Popular stocks */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Popular stocks</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {["AAPL", "GOOGL", "MSFT", "NVDA", "AMZN", "TSLA", "META", "AMD"].map(
                      (symbol) => (
                        <GlassButton
                          key={symbol}
                          variant="outline"
                          size="sm"
                          className="justify-start"
                        >
                          {symbol}
                        </GlassButton>
                      )
                    )}
                  </div>
                </div>
              </GlassCard>

              {/* Order Form */}
              <GlassCard variant="glow">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Place Order
                </h3>

                {/* Buy/Sell Toggle */}
                <div className="flex gap-2 mb-4">
                  <GlassButton
                    variant={orderType === "buy" ? "success" : "outline"}
                    className="flex-1"
                    onClick={() => setOrderType("buy")}
                  >
                    Buy
                  </GlassButton>
                  <GlassButton
                    variant={orderType === "sell" ? "destructive" : "outline"}
                    className="flex-1"
                    onClick={() => setOrderType("sell")}
                  >
                    Sell
                  </GlassButton>
                </div>

                {/* Stock info placeholder */}
                <div className="rounded-lg bg-muted/50 p-4 mb-4">
                  <p className="text-sm text-muted-foreground">
                    Select a stock to trade
                  </p>
                </div>

                {/* Shares input */}
                <div className="space-y-2 mb-4">
                  <label className="text-sm text-muted-foreground">
                    Number of Shares
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={shares}
                    onChange={(e) => setShares(e.target.value)}
                  />
                </div>

                {/* Quick amounts */}
                <div className="flex gap-2 mb-4">
                  {[10, 25, 50, 100].map((amount) => (
                    <GlassButton
                      key={amount}
                      variant="ghost"
                      size="sm"
                      onClick={() => setShares(amount.toString())}
                    >
                      {amount}
                    </GlassButton>
                  ))}
                </div>

                <GlassButton
                  variant={orderType === "buy" ? "glow" : "destructive"}
                  className="w-full"
                  disabled={!shares}
                >
                  {orderType === "buy" ? "Buy Shares" : "Sell Shares"}
                </GlassButton>
              </GlassCard>
            </div>
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio">
            <GlassCard>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Simulation Holdings
              </h3>
              <table className="data-table">
                <thead>
                  <tr className="border-b border-border/50">
                    <th>Symbol</th>
                    <th>Shares</th>
                    <th>Avg Price</th>
                    <th>Current</th>
                    <th>Value</th>
                    <th>P/L</th>
                  </tr>
                </thead>
                <tbody>
                  {mockSimulationData.holdings.map((holding) => {
                    const pl = (holding.currentPrice - holding.avgPrice) * holding.shares;
                    const plPercent = ((holding.currentPrice - holding.avgPrice) / holding.avgPrice) * 100;
                    return (
                      <tr key={holding.symbol}>
                        <td className="font-medium">{holding.symbol}</td>
                        <td className="mono-number">{holding.shares}</td>
                        <td className="mono-number">${holding.avgPrice.toFixed(2)}</td>
                        <td className="mono-number">${holding.currentPrice.toFixed(2)}</td>
                        <td className="mono-number">${holding.value.toFixed(2)}</td>
                        <td>
                          <span className={cn(
                            "mono-number",
                            pl >= 0 ? "text-positive" : "text-negative"
                          )}>
                            {pl >= 0 ? "+" : ""}${pl.toFixed(2)} ({plPercent.toFixed(2)}%)
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </GlassCard>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance">
            <GlassCard className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Performance charts coming soon...</p>
            </GlassCard>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements">
            <GlassCard>
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-5 w-5 text-warning" />
                <h3 className="text-lg font-semibold text-foreground">
                  Trading Achievements
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: "First Trade", earned: true },
                  { name: "10% Returns", earned: true },
                  { name: "Diversified", earned: false },
                  { name: "Day Trader", earned: false },
                ].map((achievement) => (
                  <div
                    key={achievement.name}
                    className={cn(
                      "rounded-lg border p-4 text-center",
                      achievement.earned
                        ? "border-warning/50 bg-warning/10"
                        : "border-border/50 bg-muted/30 opacity-50"
                    )}
                  >
                    <Trophy
                      className={cn(
                        "h-8 w-8 mx-auto mb-2",
                        achievement.earned ? "text-warning" : "text-muted-foreground"
                      )}
                    />
                    <p className="text-sm font-medium">{achievement.name}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <GlassCard>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Trade History
              </h3>
              <div className="space-y-3">
                {mockSimulationData.recentTrades.map((trade) => (
                  <div
                    key={trade.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg",
                          trade.type === "buy"
                            ? "bg-positive/10 text-positive"
                            : "bg-negative/10 text-negative"
                        )}
                      >
                        {trade.type === "buy" ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {trade.type === "buy" ? "Bought" : "Sold"} {trade.symbol}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {trade.shares} shares @ ${trade.price}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{trade.timestamp}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
