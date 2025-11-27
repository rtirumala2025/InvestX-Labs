import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAchievements } from '../contexts/AchievementsContext';
import { useApp } from '../contexts/AppContext';

const ACHIEVEMENT_ICONS = {
  onboarding_complete: '🚀',
  first_trade: '💱',
  diversification_master: '🧺',
  risk_assessment: '🛡️',
  lesson_complete: '📚',
  simulation_champion: '🎮',
  default: '⭐️',
};

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const formatDate = (timestamp) => {
  if (!timestamp) return 'Pending';
  const date = new Date(timestamp);
  return date.toLocaleString();
};

const normalizeAchievement = (achievement) => {
  const details = achievement.details || {};
  const type = achievement.type || 'achievement';
  const xp = details.xpReward ?? details.xp_reward ?? 150;
  const icon = details.icon || ACHIEVEMENT_ICONS[type] || ACHIEVEMENT_ICONS.default;
  const title =
    details.title ||
    type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  const description =
    details.description ||
    details.summary ||
    'Keep progressing to unlock more context around this achievement.';

  return {
    ...achievement,
    icon,
    xp,
    title,
    description,
  };
};

const AchievementsPage = () => {
  const {
    achievements,
    loading,
    error,
    refreshAchievements,
  } = useAchievements();
  const { queueToast } = useApp();

  // Task 27: Filters, search, sharing, progress indicators
  const [filters, setFilters] = useState({
    type: 'all',
    date: 'all',
    category: 'all'
  });
  const [searchQuery, setSearchQuery] = useState('');

  const normalizedAchievements = useMemo(
    () => (achievements || []).map(normalizeAchievement),
    [achievements]
  );

  // Task 27: Filtered and searched achievements
  const filteredAchievements = useMemo(() => {
    let filtered = normalizedAchievements;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a.badge_name?.toLowerCase().includes(query) ||
        a.title?.toLowerCase().includes(query) ||
        a.description?.toLowerCase().includes(query) ||
        a.type?.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(a => a.type === filters.type);
    }

    // Date filter (would need date field in achievements)
    // Category filter (would need category field)

    return filtered;
  }, [normalizedAchievements, searchQuery, filters]);

  // Task 27: Calculate progress for achievements
  const calculateProgress = (achievement) => {
    if (!achievement.details) return null;
    const current = achievement.details.progress || achievement.details.current || 0;
    const target = achievement.details.target || achievement.details.threshold || 100;
    return target > 0 ? Math.min((current / target) * 100, 100) : 0;
  };

  // Task 27: Share achievement
  const handleShare = async (achievement) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `I earned ${achievement.title || achievement.badge_name}!`,
          text: achievement.description || achievement.details?.description,
          url: window.location.href
        });
        queueToast('Achievement shared successfully!', 'success');
      } catch (err) {
        if (err.name !== 'AbortError') {
          queueToast('Failed to share achievement', 'error');
        }
      }
    } else {
      // Fallback: copy to clipboard
      const text = `I earned ${achievement.title || achievement.badge_name}! ${achievement.description || ''}`;
      navigator.clipboard.writeText(text);
      queueToast('Achievement link copied to clipboard!', 'success');
    }
  };

  const totalXP = useMemo(
    () => normalizedAchievements.reduce((sum, item) => sum + (item.xp || 0), 0),
    [normalizedAchievements]
  );

  const recentAchievements = useMemo(
    () => normalizedAchievements.slice(0, 3),
    [normalizedAchievements]
  );

  const handleRefresh = async () => {
    await refreshAchievements();
    queueToast('Achievements synced successfully.', 'success');
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white overflow-hidden">
      <motion.div
        className="absolute -top-24 -left-24 w-80 h-80 bg-gradient-to-r from-purple-500/30 to-blue-500/15 rounded-full blur-3xl"
        animate={{ y: [0, 20, 0], x: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 16, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-32 -right-24 w-[22rem] h-[22rem] bg-gradient-to-r from-emerald-400/30 to-teal-400/15 rounded-full blur-3xl"
        animate={{ y: [0, -18, 0], x: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 18, ease: 'easeInOut', delay: 4 }}
      />
      <motion.div
        className="absolute top-1/2 left-1/4 w-64 h-64 bg-gradient-to-r from-amber-400/20 to-pink-400/10 rounded-full blur-3xl"
        animate={{ y: [0, 14, 0], x: [0, 18, 0] }}
        transition={{ repeat: Infinity, duration: 20, ease: 'easeInOut', delay: 6 }}
      />

      <main className="relative z-10 w-full max-w-[1600px] mx-auto px-3 lg:px-6 py-4 lg:py-8">
        <motion.div variants={fadeIn} initial="hidden" animate="visible" className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/60 mb-2">
                Achievement Hub
              </p>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-blue-200 to-purple-200">
                🏅 Your Achievements
              </h1>
              <p className="text-sm md:text-base text-white/65 mt-2 max-w-xl">
                Track every milestone you unlock across investing, education, and simulation. Earn XP,
                grow your profile, and watch your progress update in real time.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <GlassButton variant="glass" onClick={handleRefresh} disabled={loading}>
                🔄 Sync Achievements
              </GlassButton>
            </div>
          </div>
        </motion.div>

        {/* Task 27: Search and Filters */}
        <motion.div variants={fadeIn} initial="hidden" animate="visible" className="mb-6">
          <GlassCard variant="default" padding="large">
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search achievements..."
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="onboarding_complete">Onboarding</option>
                  <option value="first_trade">Trading</option>
                  <option value="lesson_complete">Learning</option>
                  <option value="simulation_champion">Simulation</option>
                </select>
                <select
                  value={filters.date}
                  onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={fadeIn} initial="hidden" animate="visible" className="mb-6">
          <div>
            <p className="text-white/60 text-sm">
              Showing {filteredAchievements.length} of {normalizedAchievements.length} achievements
            </p>
          </div>
        </motion.div>

        {loading && !achievements.length ? (
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
                    Unable to load your achievements.
                  </h3>
                  <p className="text-sm text-red-200/80">{error.message || error}</p>
                </div>
                <GlassButton variant="primary" onClick={refreshAchievements} disabled={loading}>
                  Try Again
                </GlassButton>
              </div>
            </GlassCard>
          </motion.div>
        ) : null}

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6"
        >
          <motion.div variants={fadeIn} className="xl:col-span-2 space-y-4">
            <GlassCard variant="hero" padding="large" shadow="xl">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-white">Unlocked Achievements</h2>
                  <p className="text-white/60 text-sm">
                    Celebrate every badge you’ve earned across InvestX Labs.
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/45">Total XP</p>
                  <p className="text-2xl font-semibold text-white">{totalXP.toLocaleString()} XP</p>
                </div>
              </div>

              {filteredAchievements.length === 0 ? (
                <div className="py-10 text-center text-white/60">
                  <p>
                    {normalizedAchievements.length === 0
                      ? 'No achievements yet. Start exploring lessons, trading, and simulations to earn your first badge.'
                      : 'No achievements match your search criteria.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredAchievements.map((achievement) => {
                    const progress = calculateProgress(achievement);
                    return (
                    <motion.div
                      key={achievement.id}
                      variants={fadeIn}
                      className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-lg transition-colors hover:border-white/25"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-2xl">
                          {achievement.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-lg font-semibold text-white">{achievement.title}</h3>
                              <p className="text-xs uppercase tracking-[0.3em] text-white/40 mt-1">
                                {achievement.type.replace(/_/g, ' ')}
                              </p>
                            </div>
                            <span className="text-xs font-semibold text-amber-200 bg-amber-500/20 px-2 py-1 rounded-full border border-amber-300/30">
                              +{achievement.xp} XP
                            </span>
                          </div>
                          <p className="mt-3 text-sm text-white/70 leading-relaxed">
                            {achievement.description}
                          </p>
                          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-white/45">
                            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1">
                              <span>🕒</span>
                              {formatDate(achievement.earned_at)}
                            </span>
                            {progress !== null && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1">
                                <span>📊</span>
                                Progress: {progress.toFixed(0)}%
                              </span>
                            )}
                            <button
                              onClick={() => handleShare(achievement)}
                              className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 hover:bg-white/20 transition-colors"
                            >
                              <span>📤</span>
                              Share
                            </button>
                          </div>
                          {/* Task 27: Progress Indicator */}
                          {progress !== null && progress < 100 && (
                            <div className="mt-3">
                              <div className="w-full bg-white/20 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full transition-all"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                    );
                  })}
                </div>
              )}
            </GlassCard>
          </motion.div>

          <motion.div variants={fadeIn} className="space-y-4">
            <GlassCard variant="floating" padding="large">
              <h3 className="text-xl font-semibold text-white mb-4">Recent Highlights</h3>
              {recentAchievements.length ? (
                <div className="space-y-3">
                  {recentAchievements.map((achievement) => (
                    <div key={achievement.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{achievement.icon}</span>
                          <div>
                            <p className="text-sm font-semibold text-white">{achievement.title}</p>
                            <p className="text-xs text-white/50">{formatDate(achievement.earned_at)}</p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-amber-200">
                          +{achievement.xp} XP
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/60">Earn an achievement to see it spotlighted here.</p>
              )}
            </GlassCard>

            <GlassCard variant="default" padding="large">
              <h3 className="text-xl font-semibold text-white mb-4">How to Earn More</h3>
              <ul className="space-y-3 text-sm text-white/75">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-300 mt-1">✓</span>
                  <span>Complete diagnostic and onboarding flows for quick starter badges.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-300 mt-1">✓</span>
                  <span>Finish learning modules and quizzes to unlock knowledge achievements.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-300 mt-1">✓</span>
                  <span>Participate in simulation trades to earn streak and mastery rewards.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-300 mt-1">✓</span>
                  <span>Engage with AI suggestions and provide feedback for bonus XP.</span>
                </li>
              </ul>
            </GlassCard>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default AchievementsPage;

