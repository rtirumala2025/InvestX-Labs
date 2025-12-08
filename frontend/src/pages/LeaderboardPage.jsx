import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import LeaderboardWidget from '../components/leaderboard/LeaderboardWidget';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useLeaderboard } from '../contexts/LeaderboardContext';
import { useApp } from '../contexts/AppContext';

export default function LeaderboardPage() {
  const {
    leaderboard,
    userRank,
    loading,
    error,
    offline,
    refreshLeaderboard,
  } = useLeaderboard();
  const { queueToast } = useApp();

  // Task 26: Filters, pagination, friend comparisons, history
  const [filters, setFilters] = useState({
    timePeriod: 'all', // 'daily', 'weekly', 'monthly', 'all'
    category: 'all' // 'portfolio', 'xp', 'achievements'
  });
  const [page, setPage] = useState(1);
  const [showHistory, setShowHistory] = useState(false);
  const [friends, setFriends] = useState([]);
  const pageSize = 50;

  const fadeIn = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  const staggerChildren = {
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const currentUserPosition = useMemo(() => {
    if (!userRank) return null;
    return {
      rank: userRank.rank,
      xp: userRank.xp || 0,
      netWorth: Number(userRank.net_worth || 0),
      achievements: userRank.achievements_count ?? 0,
      totalTrades: userRank.trades_count ?? 0,
      portfolioReturn: userRank.portfolio_return ?? 0,
      updatedAt: userRank.updated_at ? new Date(userRank.updated_at) : null,
    };
  }, [userRank]);

  const leaderboardHighlights = useMemo(() => {
    if (!leaderboard?.length) {
      return {
        topScore: null,
        totalPlayers: 0,
        totalAchievements: 0,
        averageReturn: 0,
      };
    }

    const totalPlayers = leaderboard.length;
    const topScore = leaderboard[0];
    const totalAchievements = leaderboard.reduce(
      (sum, entry) => sum + (entry.achievements_count ?? 0),
      0
    );
    const averageReturn =
      leaderboard.reduce(
        (sum, entry) => sum + (entry.portfolio_return ?? 0),
        0
      ) / totalPlayers;

    return {
      topScore,
      totalPlayers,
      totalAchievements,
      averageReturn,
    };
  }, [leaderboard]);

  const handleRefresh = async () => {
    await refreshLeaderboard();
    queueToast('Leaderboard refreshed with the latest stats.', 'success');
  };

  // Task 26: Filtered and paginated leaderboard
  const filteredLeaderboard = useMemo(() => {
    let filtered = leaderboard || [];
    
    if (filters.category !== 'all') {
      // Filter by category (would need backend support for this)
      // For now, just return all
    }
    
    return filtered;
  }, [leaderboard, filters]);

  const paginatedScores = useMemo(() => {
    return filteredLeaderboard.slice((page - 1) * pageSize, page * pageSize);
  }, [filteredLeaderboard, page, pageSize]);

  const totalPages = Math.ceil((filteredLeaderboard.length || 0) / pageSize);

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ 
      background: 'var(--bg-base, #0a0f1a)',
      backgroundImage: 'var(--bg-gradient-primary), var(--bg-pattern-grid), var(--bg-pattern-noise)',
      backgroundSize: '100% 100%, 60px 60px, 400px 400px',
      backgroundAttachment: 'fixed'
    }}>
      <motion.div
        className="absolute -top-32 -left-28 w-80 h-80 bg-gradient-to-r from-accent-500/40 to-accent-600/30 rounded-full blur-3xl"
        animate={{ y: [0, 16, 0] }}
        transition={{ repeat: Infinity, duration: 14, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-36 -right-24 w-[24rem] h-[24rem] bg-gradient-to-r from-accent-500/30 to-accent-600/20 rounded-full blur-3xl"
        animate={{ y: [0, -22, 0] }}
        transition={{ repeat: Infinity, duration: 18, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/2 left-1/4 w-64 h-64 bg-gradient-to-r from-primary-400/20 to-primary-500/15 rounded-full blur-3xl"
        animate={{ y: [0, 15, 0], x: [0, 20, 0] }}
        transition={{ repeat: Infinity, duration: 20, ease: 'easeInOut', delay: 5 }}
      />

      <main className="relative z-10 w-full max-w-[1920px] mx-auto px-3 lg:px-4 xl:px-6 py-4 lg:py-6">
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="mb-4 lg:mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/60 mb-2">Global Rankings</p>
              <h1 className="text-3xl md:text-4xl font-display font-normal tracking-tight text-gradient-hero mb-2">
                🏆 Leaderboard
              </h1>
              <p className="text-neutral-300 text-base lg:text-lg font-sans">
                Compete with other investors, unlock achievements, and climb the ranks in real time.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <GlassButton variant="glass" onClick={handleRefresh} disabled={loading}>
                🔄 Refresh Rankings
              </GlassButton>
              <GlassButton variant="glass" onClick={() => setShowHistory(!showHistory)}>
                {showHistory ? 'Hide' : 'Show'} History
              </GlassButton>
              {offline ? (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 border border-amber-400/40 text-amber-200/90">
                  Offline mode
                </span>
              ) : null}
            </div>
          </div>
        </motion.div>

        {loading && !leaderboard.length ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="large" />
          </div>
        ) : null}

        {error ? (
          <motion.div variants={fadeIn} initial="hidden" animate="visible" className="mb-6">
            <GlassCard variant="default" padding="large">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-red-300 mb-1">
                    We ran into an issue loading the leaderboard.
                  </h3>
                  <p className="text-sm text-red-200/80">{error}</p>
                </div>
                <GlassButton variant="primary" onClick={refreshLeaderboard} disabled={loading}>
                  Try Again
                </GlassButton>
              </div>
            </GlassCard>
          </motion.div>
        ) : null}

        <motion.div
          variants={staggerChildren}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          <motion.div variants={fadeIn}>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <GlassCard variant="accent" padding="large" glow>
                <p className="text-sm uppercase tracking-[0.35em] text-white/50 mb-2">Top Player</p>
                <h3 className="text-2xl font-semibold text-white">
                  {leaderboardHighlights.topScore
                    ? leaderboardHighlights.topScore.user?.full_name ||
                      leaderboardHighlights.topScore.user?.username ||
                      leaderboardHighlights.topScore.username ||
                      'Investor'
                    : '—'}
                </h3>
                <p className="text-sm text-white/60 mt-1">
                  Score {leaderboardHighlights.topScore?.score?.toLocaleString?.() ?? '—'}
                </p>
              </GlassCard>
              <GlassCard variant="floating" padding="large">
                <p className="text-sm uppercase tracking-[0.35em] text-white/50 mb-2">Participants</p>
                <h3 className="text-2xl font-semibold text-white">
                  {leaderboardHighlights.totalPlayers}
                </h3>
                <p className="text-sm text-white/60 mt-1">Investors competing worldwide</p>
              </GlassCard>
              <GlassCard variant="floating" padding="large">
                <p className="text-sm uppercase tracking-[0.35em] text-white/50 mb-2">Achievements</p>
                <h3 className="text-2xl font-semibold text-white">
                  {leaderboardHighlights.totalAchievements}
                </h3>
                <p className="text-sm text-white/60 mt-1">Badges unlocked across the league</p>
              </GlassCard>
              <GlassCard variant="floating" padding="large">
                <p className="text-sm uppercase tracking-[0.35em] text-white/50 mb-2">Avg. Return</p>
                <h3 className="text-2xl font-semibold text-white">
                  {leaderboardHighlights.totalPlayers
                    ? `${leaderboardHighlights.averageReturn > 0 ? '+' : ''}${leaderboardHighlights.averageReturn.toFixed(2)}%`
                    : '—'}
                </h3>
                <p className="text-sm text-white/60 mt-1">Portfolio performance this week</p>
              </GlassCard>
            </div>
          </motion.div>

          <motion.div variants={fadeIn} className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            <motion.div variants={fadeIn} className="lg:col-span-2">
              <GlassCard variant="hero" padding="large" shadow="xl">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-semibold text-white mb-2">Top Investors</h2>
                      <p className="text-white/60 text-sm">
                        Rankings update in real-time from Supabase as achievements, trades, and XP roll in.
                      </p>
                    </div>
                  </div>
                  
                  {/* Task 26: Filters */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <select
                      value={filters.timePeriod}
                      onChange={(e) => setFilters(prev => ({ ...prev, timePeriod: e.target.value }))}
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                    >
                      <option value="all">All Time</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                    <select
                      value={filters.category}
                      onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                    >
                      <option value="all">All Categories</option>
                      <option value="portfolio">Portfolio</option>
                      <option value="xp">XP</option>
                      <option value="achievements">Achievements</option>
                    </select>
                  </div>
                </div>
                <LeaderboardWidget limit={pageSize} />
                
                {/* Task 26: Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                    <button
                      onClick={() => setPage(prev => Math.max(1, prev - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-white/70 text-sm">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </GlassCard>
            </motion.div>

            <motion.div variants={fadeIn} className="space-y-6">
              <GlassCard variant="floating" padding="large">
                <h3 className="text-xl font-semibold text-white mb-4">Your Standing</h3>
                {currentUserPosition ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white/70 text-sm">Current Rank</span>
                      <span className="text-2xl font-bold text-white">#{currentUserPosition.rank}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-white/10 border border-white/10">
                        <p className="text-xs text-white/60 uppercase">XP</p>
                        <p className="text-lg font-semibold text-white">
                          {currentUserPosition.xp.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-white/10 border border-white/10">
                        <p className="text-xs text-white/60 uppercase">Net Worth</p>
                        <p className="text-lg font-semibold text-white">
                          {currentUserPosition.netWorth.toLocaleString(undefined, {
                            style: 'currency',
                            currency: 'USD',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-white/10 border border-white/10">
                        <p className="text-xs text-white/60 uppercase">Achievements</p>
                        <p className="text-lg font-semibold text-white">
                          {currentUserPosition.achievements}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-white/10 border border-white/10">
                        <p className="text-xs text-white/60 uppercase">Total Trades</p>
                        <p className="text-lg font-semibold text-white">
                          {currentUserPosition.totalTrades}
                        </p>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-white/10 border border-white/10">
                      <p className="text-xs text-white/60 uppercase">Portfolio Return</p>
                      <p
                        className={`text-lg font-semibold ${
                          currentUserPosition.portfolioReturn > 0
                            ? 'text-green-300'
                            : currentUserPosition.portfolioReturn < 0
                            ? 'text-amber-300'
                            : 'text-white'
                        }`}
                      >
                        {currentUserPosition.portfolioReturn > 0 ? '+' : ''}
                        {currentUserPosition.portfolioReturn.toFixed(2)}%
                      </p>
                    </div>
                    {currentUserPosition.updatedAt ? (
                      <p className="text-xs text-white/40">
                        Updated {currentUserPosition.updatedAt.toLocaleString()}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <div className="text-white/60 text-sm">
                    Sign in and start trading or learning to appear on the leaderboard.
                  </div>
                )}
              </GlassCard>

              <GlassCard variant="default" padding="large">
                <h3 className="text-xl font-semibold text-white mb-4">How Rankings Work</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">📈</span>
                      <div>
                        <h4 className="text-white font-medium mb-1">Portfolio Performance</h4>
                        <p className="text-white/60 text-sm">
                          Live returns and XP from Supabase drive your placement.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🎯</span>
                      <div>
                        <h4 className="text-white font-medium mb-1">Achievements</h4>
                        <p className="text-white/60 text-sm">
                          Unlock badges for milestones, lessons, and trading streaks.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">📚</span>
                      <div>
                        <h4 className="text-white font-medium mb-1">Learning Progress</h4>
                        <p className="text-white/60 text-sm">
                          Complete lessons and simulations to earn bonus XP and move up.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>

              <GlassCard variant="accent" padding="large" glow>
                <h3 className="text-xl font-semibold text-white mb-4">💡 Pro Tips</h3>
                <ul className="space-y-3 text-white/80 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>Diversify your portfolio for steadier returns.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>Complete educational modules for bonus XP.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>Log trades consistently to stay ahead.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>Share achievements and challenge friends.</span>
                  </li>
                </ul>
              </GlassCard>

              {/* Task 26: Friend Comparisons */}
              {friends.length > 0 && (
                <GlassCard variant="default" padding="large">
                  <h3 className="text-xl font-semibold text-white mb-4">Friend Comparisons</h3>
                  <div className="space-y-3">
                    {friends.map((friend, index) => (
                      <div key={friend.id || index} className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center justify-between">
                          <span className="text-white">{friend.name || 'Friend'}</span>
                          <span className="text-white/70 text-sm">Rank #{friend.rank || '—'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}

              {/* Task 26: History */}
              {showHistory && (
                <GlassCard variant="default" padding="large">
                  <h3 className="text-xl font-semibold text-white mb-4">Leaderboard History</h3>
                  <p className="text-white/60 text-sm">
                    Historical leaderboard data will be displayed here once available.
                  </p>
                </GlassCard>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
