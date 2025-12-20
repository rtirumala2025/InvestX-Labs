import { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { MarketTicker } from "@/components/dashboard/MarketTicker";
import { QuickStats } from "@/components/dashboard/QuickStats";
import { PortfolioChart } from "@/components/dashboard/PortfolioChart";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { LeaderboardWidget } from "@/components/dashboard/LeaderboardWidget";
import { LearningProgress } from "@/components/dashboard/LearningProgress";
import { Sparkles } from "lucide-react";

export default function DashboardPage() {
  const [selectedChartTimeframe, setSelectedChartTimeframe] = useState("1M");

  return (
    <div className="min-h-screen bg-background">
      {/* Market Ticker */}
      <MarketTicker />

      {/* Top Bar */}
      <TopBar
        title="Dashboard"
        subtitle="Welcome back, Alex"
      />

      {/* Main Content */}
      <div className="p-8 space-y-8">
        {/* Welcome Banner */}
        <div className="glass-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 opacity-0 animate-in">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-teal-400 shadow-lg shadow-primary/25">
              <Sparkles className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Your portfolio is performing well</h2>
              <p className="text-muted-foreground">
                Up <span className="font-semibold text-positive tabular-nums">+14.4%</span> all-time. Keep up the great work!
              </p>
            </div>
          </div>
          <button className="btn-primary">
            View Insights
          </button>
        </div>

        {/* Quick Stats */}
        <QuickStats />

        {/* Chart and Actions Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Portfolio Chart - Takes 2 columns */}
          <div className="lg:col-span-2">
            <PortfolioChart
              timeframe={selectedChartTimeframe}
              onTimeframeChange={setSelectedChartTimeframe}
            />
          </div>

          {/* Quick Actions */}
          <QuickActions />
        </div>

        {/* Activity, Leaderboard, Learning Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <RecentActivity />
          <LeaderboardWidget />
          <LearningProgress />
        </div>
      </div>
    </div>
  );
}
