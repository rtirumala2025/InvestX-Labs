import { TopBar } from "@/components/layout/TopBar";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { Trophy, Medal, TrendingUp, Crown, Flame } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  name: string;
  returns: number;
  trades: number;
  streak: number;
  isCurrentUser?: boolean;
}

const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, name: "WallStreetPro", returns: 145.8, trades: 234, streak: 12 },
  { rank: 2, name: "InvestMaster", returns: 128.4, trades: 189, streak: 8 },
  { rank: 3, name: "TechTrader", returns: 112.2, trades: 312, streak: 5 },
  { rank: 4, name: "AlphaHunter", returns: 98.6, trades: 145, streak: 15 },
  { rank: 5, name: "ValueSeeker", returns: 87.3, trades: 98, streak: 3 },
  { rank: 6, name: "You", returns: 78.5, trades: 67, streak: 7, isCurrentUser: true },
  { rank: 7, name: "DividendKing", returns: 72.1, trades: 56, streak: 2 },
  { rank: 8, name: "SwingTrader", returns: 68.9, trades: 423, streak: 4 },
  { rank: 9, name: "PatientInvestor", returns: 65.4, trades: 34, streak: 1 },
  { rank: 10, name: "GrowthFan", returns: 62.8, trades: 78, streak: 6 },
];

const getRankDisplay = (rank: number) => {
  switch (rank) {
    case 1:
      return (
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 shadow-lg">
          <Crown className="h-5 w-5 text-yellow-900" />
        </div>
      );
    case 2:
      return (
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 shadow-lg">
          <Medal className="h-5 w-5 text-gray-800" />
        </div>
      );
    case 3:
      return (
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 shadow-lg">
          <Medal className="h-5 w-5 text-amber-200" />
        </div>
      );
    default:
      return (
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted text-muted-foreground font-bold">
          {rank}
        </div>
      );
  }
};

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen">
      <TopBar
        title="Leaderboard"
        subtitle="Compete with other investors and climb the ranks"
      />

      <div className="p-6 space-y-6">
        {/* Top 3 Podium */}
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
          {/* 2nd Place */}
          <div className="flex flex-col items-center pt-8">
            <GlassCard variant="elevated" className="text-center p-4 w-full">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 mx-auto mb-3 shadow-lg">
                <Medal className="h-6 w-6 text-gray-800" />
              </div>
              <p className="font-bold text-foreground">{mockLeaderboard[1].name}</p>
              <p className="text-lg font-bold text-positive">+{mockLeaderboard[1].returns}%</p>
            </GlassCard>
          </div>

          {/* 1st Place */}
          <div className="flex flex-col items-center">
            <GlassCard variant="glow" className="text-center p-6 w-full transform scale-110 z-10">
              <div className="flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 mx-auto mb-3 shadow-lg">
                <Crown className="h-7 w-7 text-yellow-900" />
              </div>
              <p className="font-bold text-foreground text-lg">{mockLeaderboard[0].name}</p>
              <p className="text-2xl font-bold text-positive">+{mockLeaderboard[0].returns}%</p>
              <div className="flex items-center justify-center gap-1 mt-2 text-warning">
                <Flame className="h-4 w-4" />
                <span className="text-xs font-medium">{mockLeaderboard[0].streak} day streak</span>
              </div>
            </GlassCard>
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center pt-8">
            <GlassCard variant="elevated" className="text-center p-4 w-full">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 mx-auto mb-3 shadow-lg">
                <Medal className="h-6 w-6 text-amber-200" />
              </div>
              <p className="font-bold text-foreground">{mockLeaderboard[2].name}</p>
              <p className="text-lg font-bold text-positive">+{mockLeaderboard[2].returns}%</p>
            </GlassCard>
          </div>
        </div>

        {/* Full Leaderboard */}
        <GlassCard variant="default">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-5 w-5 text-warning" />
            <h2 className="text-lg font-semibold text-foreground">Full Rankings</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr className="border-b border-border/50">
                  <th>Rank</th>
                  <th>Investor</th>
                  <th>Returns</th>
                  <th>Trades</th>
                  <th>Streak</th>
                </tr>
              </thead>
              <tbody>
                {mockLeaderboard.map((entry) => (
                  <tr
                    key={entry.rank}
                    className={cn(
                      entry.isCurrentUser && "bg-primary/10 border-primary/20"
                    )}
                  >
                    <td>
                      <div className="flex items-center justify-center">
                        {getRankDisplay(entry.rank)}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center font-bold text-foreground">
                          {entry.name.charAt(0)}
                        </div>
                        <span
                          className={cn(
                            "font-medium",
                            entry.isCurrentUser ? "text-primary" : "text-foreground"
                          )}
                        >
                          {entry.name}
                          {entry.isCurrentUser && (
                            <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                              You
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 text-positive font-medium">
                        <TrendingUp className="h-4 w-4" />
                        <span className="mono-number">+{entry.returns}%</span>
                      </div>
                    </td>
                    <td className="mono-number text-muted-foreground">
                      {entry.trades}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Flame
                          className={cn(
                            "h-4 w-4",
                            entry.streak >= 7 ? "text-warning" : "text-muted-foreground"
                          )}
                        />
                        <span className="mono-number">{entry.streak} days</span>
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
