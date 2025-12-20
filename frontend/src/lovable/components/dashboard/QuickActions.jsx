import React from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  LineChart,
  MessageSquare,
  GraduationCap,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import { cn } from "../../lib/utils";

const quickActions = [
  {
    label: "Add Holding",
    description: "Track new investment",
    icon: <Plus className="h-5 w-5" />,
    path: "/portfolio",
    color: "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground",
  },
  {
    label: "Simulate Trade",
    description: "Practice risk-free",
    icon: <LineChart className="h-5 w-5" />,
    path: "/simulation",
    color: "bg-positive/10 text-positive group-hover:bg-positive group-hover:text-white",
  },
  {
    label: "AI Insights",
    description: "Get recommendations",
    icon: <Lightbulb className="h-5 w-5" />,
    path: "/suggestions",
    color: "bg-warning/10 text-warning group-hover:bg-warning group-hover:text-white",
  },
  {
    label: "Chat with AI",
    description: "Ask anything",
    icon: <MessageSquare className="h-5 w-5" />,
    path: "/chat",
    color: "bg-info/10 text-info group-hover:bg-info group-hover:text-white",
  },
  {
    label: "Continue Learning",
    description: "Investment basics",
    icon: <GraduationCap className="h-5 w-5" />,
    path: "/education",
    color: "bg-chart-5/10 text-chart-5 group-hover:bg-chart-5 group-hover:text-white",
  },
];

export function QuickActions() {
  return (
    <div className="premium-card p-6 opacity-0 animate-in animate-in-delay-3">
      <h3 className="text-lg font-semibold text-foreground mb-5">Quick Actions</h3>

      <div className="space-y-2">
        {quickActions.map((action) => (
          <Link key={action.path} to={action.path}>
            <div className="group flex items-center gap-4 rounded-xl p-3 transition-all duration-200 hover:bg-muted/50">
              <div
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200",
                  action.color
                )}
              >
                {action.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {action.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {action.description}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}


