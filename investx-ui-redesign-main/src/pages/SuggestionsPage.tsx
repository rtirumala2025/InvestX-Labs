import { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Lightbulb,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ChevronRight,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

interface Suggestion {
  id: string;
  type: "buy" | "sell" | "hold";
  symbol: string;
  company: string;
  confidence: number;
  reason: string;
  targetPrice?: number;
  currentPrice: number;
  upside?: number;
  timestamp: string;
}

const mockSuggestions: Suggestion[] = [
  {
    id: "1",
    type: "buy",
    symbol: "NVDA",
    company: "NVIDIA Corporation",
    confidence: 92,
    reason: "Strong AI chip demand continues. Recent earnings beat expectations with 122% YoY revenue growth.",
    targetPrice: 580,
    currentPrice: 495.22,
    upside: 17.1,
    timestamp: "2 hours ago",
  },
  {
    id: "2",
    type: "buy",
    symbol: "MSFT",
    company: "Microsoft Corporation",
    confidence: 88,
    reason: "Azure cloud growth accelerating. AI integration across products driving enterprise adoption.",
    targetPrice: 420,
    currentPrice: 378.91,
    upside: 10.8,
    timestamp: "3 hours ago",
  },
  {
    id: "3",
    type: "hold",
    symbol: "AAPL",
    company: "Apple Inc.",
    confidence: 75,
    reason: "iPhone sales stable but growth limited. Services segment provides reliable revenue stream.",
    currentPrice: 178.52,
    timestamp: "5 hours ago",
  },
  {
    id: "4",
    type: "sell",
    symbol: "TSLA",
    company: "Tesla, Inc.",
    confidence: 68,
    reason: "Increasing competition in EV market. Price cuts impacting margins. Consider taking profits.",
    currentPrice: 248.50,
    timestamp: "1 day ago",
  },
];

const getTypeColor = (type: string) => {
  switch (type) {
    case "buy":
      return "text-positive bg-positive/10 border-positive/30";
    case "sell":
      return "text-negative bg-negative/10 border-negative/30";
    default:
      return "text-warning bg-warning/10 border-warning/30";
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case "buy":
      return <TrendingUp className="h-4 w-4" />;
    case "sell":
      return <TrendingDown className="h-4 w-4" />;
    default:
      return <AlertTriangle className="h-4 w-4" />;
  }
};

export default function SuggestionsPage() {
  const [activeTab, setActiveTab] = useState("current");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  return (
    <div className="min-h-screen">
      <TopBar
        title="AI Suggestions"
        subtitle="Smart investment recommendations powered by AI"
      />

      <div className="p-6 space-y-6">
        {/* Header Card */}
        <GlassCard variant="glow" className="animate-slide-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  AI Market Analysis
                </h2>
                <p className="text-sm text-muted-foreground">
                  Personalized suggestions based on your portfolio and market trends
                </p>
              </div>
            </div>
            <GlassButton
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={cn("h-4 w-4", isRefreshing && "animate-spin")}
              />
              {isRefreshing ? "Analyzing..." : "Refresh Analysis"}
            </GlassButton>
          </div>
        </GlassCard>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50">
            <TabsTrigger value="current">Current Suggestions</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="mt-6 space-y-4">
            {mockSuggestions.map((suggestion, index) => (
              <GlassCard
                key={suggestion.id}
                variant="interactive"
                className={cn("animate-slide-up", `stagger-${index + 1}`)}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Type Badge & Symbol */}
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium uppercase",
                        getTypeColor(suggestion.type)
                      )}
                    >
                      {getTypeIcon(suggestion.type)}
                      {suggestion.type}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">
                        {suggestion.symbol}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {suggestion.company}
                      </p>
                    </div>
                  </div>

                  {/* Confidence */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm text-muted-foreground">
                        Confidence
                      </span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-xs">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            suggestion.confidence >= 80
                              ? "bg-positive"
                              : suggestion.confidence >= 60
                              ? "bg-warning"
                              : "bg-negative"
                          )}
                          style={{ width: `${suggestion.confidence}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {suggestion.confidence}%
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {suggestion.reason}
                    </p>
                  </div>

                  {/* Price Info */}
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Current</p>
                      <p className="text-lg font-bold mono-number">
                        ${suggestion.currentPrice.toFixed(2)}
                      </p>
                    </div>
                    {suggestion.targetPrice && (
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Target</p>
                        <p className="text-lg font-bold text-positive mono-number">
                          ${suggestion.targetPrice.toFixed(2)}
                        </p>
                        <p className="text-xs text-positive">
                          +{suggestion.upside?.toFixed(1)}% upside
                        </p>
                      </div>
                    )}
                    <GlassButton variant="ghost" size="icon">
                      <ChevronRight className="h-5 w-5" />
                    </GlassButton>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {suggestion.timestamp}
                </div>
              </GlassCard>
            ))}
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <GlassCard>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Lightbulb className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Suggestion History
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Your past AI suggestions and their outcomes will appear here.
                  Track how well the AI predictions performed over time.
                </p>
              </div>
            </GlassCard>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
