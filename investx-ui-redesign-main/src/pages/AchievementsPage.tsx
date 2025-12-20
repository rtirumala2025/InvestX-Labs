import { TopBar } from "@/components/layout/TopBar";
import { GlassCard } from "@/components/ui/glass-card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Trophy,
  Target,
  Flame,
  TrendingUp,
  BookOpen,
  Users,
  Zap,
  Star,
  Lock,
} from "lucide-react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  earned: boolean;
  progress?: number;
  maxProgress?: number;
  rarity: "common" | "rare" | "epic" | "legendary";
  earnedDate?: string;
}

const achievements: Achievement[] = [
  {
    id: "1",
    name: "First Trade",
    description: "Complete your first simulated trade",
    icon: <Zap className="h-6 w-6" />,
    earned: true,
    rarity: "common",
    earnedDate: "Jan 15, 2024",
  },
  {
    id: "2",
    name: "Quick Learner",
    description: "Complete 5 lessons",
    icon: <BookOpen className="h-6 w-6" />,
    earned: true,
    rarity: "common",
    earnedDate: "Jan 20, 2024",
  },
  {
    id: "3",
    name: "On Fire",
    description: "Maintain a 7-day learning streak",
    icon: <Flame className="h-6 w-6" />,
    earned: true,
    rarity: "rare",
    earnedDate: "Feb 1, 2024",
  },
  {
    id: "4",
    name: "Profit Master",
    description: "Achieve 10% portfolio returns",
    icon: <TrendingUp className="h-6 w-6" />,
    earned: true,
    rarity: "rare",
    earnedDate: "Feb 15, 2024",
  },
  {
    id: "5",
    name: "Diversifier",
    description: "Hold 10 different stocks",
    icon: <Target className="h-6 w-6" />,
    earned: false,
    progress: 6,
    maxProgress: 10,
    rarity: "rare",
  },
  {
    id: "6",
    name: "Community Star",
    description: "Join 3 investment clubs",
    icon: <Users className="h-6 w-6" />,
    earned: false,
    progress: 1,
    maxProgress: 3,
    rarity: "epic",
  },
  {
    id: "7",
    name: "Market Oracle",
    description: "Make 10 consecutive profitable trades",
    icon: <Star className="h-6 w-6" />,
    earned: false,
    progress: 4,
    maxProgress: 10,
    rarity: "epic",
  },
  {
    id: "8",
    name: "Investment Legend",
    description: "Achieve 100% portfolio returns",
    icon: <Trophy className="h-6 w-6" />,
    earned: false,
    progress: 14,
    maxProgress: 100,
    rarity: "legendary",
  },
];

const rarityStyles = {
  common: {
    border: "border-muted-foreground/30",
    bg: "bg-muted/50",
    text: "text-muted-foreground",
    glow: "",
  },
  rare: {
    border: "border-info/50",
    bg: "bg-info/10",
    text: "text-info",
    glow: "shadow-[0_0_15px_hsl(var(--info)/0.2)]",
  },
  epic: {
    border: "border-chart-5/50",
    bg: "bg-chart-5/10",
    text: "text-chart-5",
    glow: "shadow-[0_0_20px_hsl(280_65%_60%/0.2)]",
  },
  legendary: {
    border: "border-warning/50",
    bg: "bg-warning/10",
    text: "text-warning",
    glow: "shadow-[0_0_25px_hsl(var(--warning)/0.3)]",
  },
};

export default function AchievementsPage() {
  const earnedCount = achievements.filter((a) => a.earned).length;
  const totalCount = achievements.length;

  return (
    <div className="min-h-screen">
      <TopBar
        title="Achievements"
        subtitle="Track your investing milestones and badges"
      />

      <div className="p-6 space-y-6">
        {/* Overview */}
        <GlassCard variant="glow" className="animate-slide-up">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-warning/20 to-warning/5 shadow-lg">
              <Trophy className="h-10 w-10 text-warning" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {earnedCount} of {totalCount} Achievements Unlocked
              </h2>
              <Progress
                value={(earnedCount / totalCount) * 100}
                className="h-3 max-w-md"
              />
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-warning">
                {Math.round((earnedCount / totalCount) * 100)}%
              </p>
              <p className="text-sm text-muted-foreground">Complete</p>
            </div>
          </div>
        </GlassCard>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {achievements.map((achievement, index) => {
            const styles = rarityStyles[achievement.rarity];
            
            return (
              <GlassCard
                key={achievement.id}
                className={cn(
                  "relative animate-slide-up border-2",
                  styles.border,
                  achievement.earned ? styles.glow : "opacity-70"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Rarity Badge */}
                <div
                  className={cn(
                    "absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                    styles.bg,
                    styles.text
                  )}
                >
                  {achievement.rarity}
                </div>

                {/* Icon */}
                <div
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-xl mb-4",
                    achievement.earned ? styles.bg : "bg-muted",
                    achievement.earned ? styles.text : "text-muted-foreground"
                  )}
                >
                  {achievement.earned ? (
                    achievement.icon
                  ) : (
                    <Lock className="h-6 w-6" />
                  )}
                </div>

                {/* Info */}
                <h3
                  className={cn(
                    "font-bold mb-1",
                    achievement.earned ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {achievement.name}
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  {achievement.description}
                </p>

                {/* Progress or Date */}
                {achievement.earned ? (
                  <p className="text-xs text-positive">
                    ✓ Earned {achievement.earnedDate}
                  </p>
                ) : achievement.progress !== undefined ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="text-foreground">
                        {achievement.progress}/{achievement.maxProgress}
                      </span>
                    </div>
                    <Progress
                      value={(achievement.progress / (achievement.maxProgress || 1)) * 100}
                      className="h-1.5"
                    />
                  </div>
                ) : null}
              </GlassCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}
