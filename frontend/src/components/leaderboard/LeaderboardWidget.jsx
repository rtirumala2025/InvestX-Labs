import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { useLeaderboard } from "../../contexts/LeaderboardContext";
import GlassButton from "../ui/GlassButton";
import GlassCard from "../ui/GlassCard";
import LoadingSpinner from "../common/LoadingSpinner";

const StatPill = ({ icon, label, value, tone = "default" }) => {
  const toneClasses = {
    success: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
    warning: "bg-amber-500/15 text-amber-300 border-amber-400/30",
    accent: "bg-sky-500/15 text-sky-300 border-sky-400/30",
    default: "bg-white/10 text-white/80 border-white/10",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium ${toneClasses[tone] || toneClasses.default}`}
    >
      <span className="text-base leading-none">{icon}</span>
      <span className="tracking-wide uppercase">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </span>
  );
};

const LeaderboardWidget = ({ limit = 10 }) => {
  const { leaderboard, loading, error, refreshLeaderboard } = useLeaderboard();

  const displayedEntries = useMemo(() => {
    const entries = (leaderboard || []).slice(0, limit);
    return entries.map((entry, index) => {
      const displayName =
        entry.user?.full_name ||
        entry.user?.username ||
        entry.username ||
        "Investor";

      return {
        ...entry,
        rank: entry.rank ?? index + 1,
        displayName,
        xp: entry.xp ?? entry.score ?? 0,
        netWorth: Number(entry.net_worth ?? 0),
        achievements: entry.achievements_count ?? 0,
        totalTrades: entry.trades_count ?? 0,
        portfolioReturn: entry.portfolio_return ?? 0,
      };
    });
  }, [leaderboard, limit]);

  const formatCurrency = (value) => {
    if (Number.isNaN(value) || value === null || value === undefined)
      return "—";
    const formatter = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: value >= 100000 ? 0 : 2,
    });
    return formatter.format(value);
  };

  if (loading) {
    return (
      <GlassCard variant="floating" padding="large">
        <div className="text-center py-8">
          <LoadingSpinner size="medium" />
        </div>
      </GlassCard>
    );
  }

  if (error) {
    return (
      <GlassCard variant="floating" padding="large">
        <div className="flex flex-col items-center space-y-3">
          <p className="text-red-400 text-center">
            We couldn’t load the leaderboard.
          </p>
          <GlassButton
            variant="glass"
            size="small"
            onClick={() => refreshLeaderboard()}
          >
            Try Again
          </GlassButton>
        </div>
      </GlassCard>
    );
  }

  const rankBadge = (index, rank) => {
    if (index === 0) {
      return "🥇";
    }
    if (index === 1) {
      return "🥈";
    }
    if (index === 2) {
      return "🥉";
    }
    return `#${rank}`;
  };

  return (
    <GlassCard variant="floating" padding="large">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-2xl font-semibold text-white flex items-center gap-2">
            <span className="text-3xl">🏆</span>
            Global Leaderboard
          </h3>
          <p className="text-sm text-white/60">
            Live rankings based on XP, achievements, and trading performance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <GlassButton
            variant="glass"
            size="small"
            onClick={() => refreshLeaderboard()}
            title="Refresh Leaderboard"
          >
            🔄 Refresh
          </GlassButton>
        </div>
      </div>

      {displayedEntries.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-white/60">No rankings yet</p>
          <p className="text-white/40 text-sm mt-2">
            Start trading to appear on the leaderboard!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedEntries.map((entry, index) => {
            const isTopThree = index < 3;
            const accentClasses = isTopThree
              ? "border-yellow-300/25 bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-orange-500/10"
              : "border-white/10 bg-white/5";

            const xpValue = entry.xp ?? entry.score ?? 0;
            const xpLabel = `${typeof xpValue === "number" ? xpValue.toLocaleString() : xpValue} XP`;
            const netWorthLabel = formatCurrency(entry.netWorth);
            const returnLabel =
              entry.portfolioReturn !== undefined &&
              entry.portfolioReturn !== null
                ? `${entry.portfolioReturn > 0 ? "+" : ""}${entry.portfolioReturn.toFixed(2)}%`
                : "—";

            return (
              <motion.div
                key={`${entry.user_id}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
                className={`rounded-2xl border px-4 py-5 transition-colors backdrop-blur-md ${accentClasses}`}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full text-xl font-semibold drop-shadow ${
                        isTopThree
                          ? "bg-white text-yellow-500"
                          : "bg-white/15 text-white"
                      }`}
                    >
                      {rankBadge(index, entry.rank)}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-lg leading-tight">
                        {entry.displayName}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
                        <span>{xpLabel}</span>
                        <span className="text-white/30">•</span>
                        <span>{netWorthLabel} net worth</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <StatPill
                      icon="🏅"
                      label="Achievements"
                      value={entry.achievements}
                      tone={entry.achievements > 0 ? "accent" : "default"}
                    />
                    <StatPill
                      icon="📈"
                      label="Trades"
                      value={entry.totalTrades}
                      tone={entry.totalTrades > 0 ? "success" : "default"}
                    />
                    <StatPill
                      icon="📊"
                      label="Return"
                      value={returnLabel}
                      tone={
                        entry.portfolioReturn > 5
                          ? "success"
                          : entry.portfolioReturn < 0
                            ? "warning"
                            : "default"
                      }
                    />
                  </div>
                  <div className="flex flex-col items-end gap-2 text-sm">
                    <span className="font-semibold text-white tracking-wide">
                      Score{" "}
                      {entry.score?.toLocaleString?.() ?? entry.score ?? 0}
                    </span>
                    <span className="text-xs uppercase tracking-[0.18em] text-white/40">
                      Updated{" "}
                      {entry.updated_at
                        ? new Date(entry.updated_at).toLocaleTimeString()
                        : "recently"}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
};

export default LeaderboardWidget;
