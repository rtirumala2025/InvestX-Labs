import { cn } from "@/lib/utils";
import { Trophy, TrendingUp, Crown, Medal } from "lucide-react";
import { Link } from "react-router-dom";

interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar?: string;
  returns: number;
  isCurrentUser?: boolean;
}

const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, name: "WallStreetPro", returns: 145.8 },
  { rank: 2, name: "InvestMaster", returns: 128.4 },
  { rank: 3, name: "TechTrader", returns: 112.2 },
  { rank: 4, name: "You", returns: 98.6, isCurrentUser: true },
  { rank: 5, name: "ValueHunter", returns: 87.3 },
];

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="h-4 w-4 text-warning" />;
    case 2:
      return <Medal className="h-4 w-4 text-muted-foreground" />;
    case 3:
      return <Medal className="h-4 w-4 text-amber-600" />;
    default:
      return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
  }
};

export function LeaderboardWidget() {
  return (
    <div className="premium-card p-6 opacity-0 animate-in animate-in-delay-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-warning" />
          <h3 className="text-lg font-semibold text-foreground">Leaderboard</h3>
        </div>
        <Link
          to="/leaderboard"
          className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          View all
        </Link>
      </div>

      <div className="space-y-3">
        {mockLeaderboard.map((entry) => (
          <div
            key={entry.rank}
            className={cn(
              "flex items-center gap-4 rounded-xl p-3 transition-all duration-200 -mx-1",
              entry.isCurrentUser
                ? "bg-primary/5 border border-primary/20"
                : "hover:bg-muted/50"
            )}
          >
            <div className="flex h-8 w-8 items-center justify-center">
              {getRankIcon(entry.rank)}
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-sm font-semibold text-foreground">
              {entry.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-sm font-semibold truncate",
                  entry.isCurrentUser ? "text-primary" : "text-foreground"
                )}
              >
                {entry.name}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-positive">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-semibold tabular-nums">
                +{entry.returns.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
