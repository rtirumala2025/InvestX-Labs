import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "../../lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

const timeframes = ["1D", "1W", "1M", "3M", "1Y", "ALL"];

const generateMockData = (timeframe) => {
  const points =
    timeframe === "1D" ? 24 : timeframe === "1W" ? 7 : timeframe === "1M" ? 30 : 90;
  const baseValue = 125000;
  const volatility = timeframe === "1D" ? 0.005 : 0.02;

  return Array.from({ length: points }, (_, i) => {
    const trend = (i / points) * 0.08;
    const noise = (Math.random() - 0.5) * volatility;
    const value = baseValue * (1 + trend + noise);

    let date;
    if (timeframe === "1D") {
      date = `${i}:00`;
    } else if (timeframe === "1W") {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      date = days[i % 7];
    } else {
      date = `${i + 1}`;
    }

    return { date, value };
  });
};

export function PortfolioChart({ data, timeframe: externalTimeframe, onTimeframeChange }) {
  const [internalTimeframe, setInternalTimeframe] = useState("1M");
  const timeframe = externalTimeframe ?? internalTimeframe;

  const chartData = data && data.length ? data : generateMockData(timeframe);
  const startValue = chartData[0]?.value ?? 0;
  const endValue = chartData[chartData.length - 1]?.value ?? 0;
  const change = endValue - startValue;
  const changePercent = startValue > 0 ? (change / startValue) * 100 : 0;
  const isPositive = change >= 0;

  const handleTimeframeChange = (tf) => {
    if (onTimeframeChange) {
      onTimeframeChange(tf);
    } else {
      setInternalTimeframe(tf);
    }
  };

  return (
    <div className="premium-card p-6 opacity-0 animate-in animate-in-delay-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">Portfolio Value</p>
          <div className="flex items-baseline gap-4">
            <span className="text-4xl font-bold text-foreground tabular-nums">
              ${endValue.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold",
                isPositive
                  ? "bg-positive/10 text-positive"
                  : "bg-negative/10 text-negative"
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span className="tabular-nums">
                {isPositive ? "+" : ""}
                {changePercent.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/50">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => handleTimeframeChange(tf)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                timeframe === tf
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-[320px] -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={isPositive ? "hsl(160, 84%, 39%)" : "hsl(0, 72%, 51%)"}
                  stopOpacity={0.2}
                />
                <stop
                  offset="100%"
                  stopColor={isPositive ? "hsl(160, 84%, 39%)" : "hsl(0, 72%, 51%)"}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(220, 13%, 91%)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(220, 10%, 50%)", fontSize: 12 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(220, 10%, 50%)", fontSize: 12 }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              dx={-10}
              domain={["auto", "auto"]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(0, 0%, 100%)",
                border: "1px solid hsl(220, 13%, 91%)",
                borderRadius: "12px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                padding: "12px 16px",
              }}
              labelStyle={{
                color: "hsl(220, 10%, 50%)",
                marginBottom: "4px",
                fontSize: "12px",
              }}
              formatter={(value) => [
                <span className="font-semibold tabular-nums">
                  ${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>,
                "Value",
              ]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={isPositive ? "hsl(160, 84%, 39%)" : "hsl(0, 72%, 51%)"}
              strokeWidth={2.5}
              fill="url(#portfolioGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


