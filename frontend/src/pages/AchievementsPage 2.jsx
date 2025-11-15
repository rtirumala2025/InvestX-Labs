import React, { useMemo } from 'react';
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

  const normalizedAchievements = useMemo(
    () => (achievements || []).map(normalizeAchievement),
    [achievements]
  );

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

              {normalizedAchievements.length === 0 ? (
                <div className="py-10 text-center text-white/60">
                  <p>No achievements yet. Start exploring lessons, trading, and simulations to earn your first badge.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {normalizedAchievements.map((achievement) => (
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
                            {achievement.details?.progress !== undefined ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1">
                                <span>📊</span>
                                Progress: {achievement.details.progress}%
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
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

