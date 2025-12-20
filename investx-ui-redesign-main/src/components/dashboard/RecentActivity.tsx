import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, BookOpen, Award, Clock } from "lucide-react";

interface ActivityItem {
  id: string;
  type: "buy" | "sell" | "lesson" | "achievement";
  title: string;
  description: string;
  timestamp: string;
  value?: string;
}

const mockActivity: ActivityItem[] = [
  {
    id: "1",
    type: "buy",
    title: "Bought NVDA",
    description: "10 shares @ $495.22",
    timestamp: "2 hours ago",
    value: "+$4,952.20",
  },
  {
    id: "2",
    type: "lesson",
    title: "Completed Lesson",
    description: "Portfolio Diversification Basics",
    timestamp: "5 hours ago",
  },
  {
    id: "3",
    type: "sell",
    title: "Sold TSLA",
    description: "5 shares @ $248.50",
    timestamp: "Yesterday",
    value: "-$1,242.50",
  },
  {
    id: "4",
    type: "achievement",
    title: "Achievement Unlocked",
    description: "First Profitable Trade",
    timestamp: "2 days ago",
  },
];

const activityIcons = {
  buy: <ArrowUpRight className="h-4 w-4" />,
  sell: <ArrowDownRight className="h-4 w-4" />,
  lesson: <BookOpen className="h-4 w-4" />,
  achievement: <Award className="h-4 w-4" />,
};

const activityColors = {
  buy: "bg-positive/10 text-positive",
  sell: "bg-negative/10 text-negative",
  lesson: "bg-info/10 text-info",
  achievement: "bg-warning/10 text-warning",
};

export function RecentActivity() {
  return (
    <div className="premium-card p-6 opacity-0 animate-in animate-in-delay-4">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
        <button className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
          View all
        </button>
      </div>

      <div className="space-y-4">
        {mockActivity.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-4 group"
          >
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110",
                activityColors[item.type]
              )}
            >
              {activityIcons[item.type]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground truncate">
                {item.description}
              </p>
            </div>
            <div className="text-right shrink-0">
              {item.value && (
                <p
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    item.type === "buy" ? "text-positive" : "text-negative"
                  )}
                >
                  {item.value}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 justify-end">
                <Clock className="h-3 w-3" />
                {item.timestamp}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
