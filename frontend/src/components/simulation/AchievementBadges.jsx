import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../ui/GlassCard';
import { Trophy, Award, Star, Target } from 'lucide-react';

// Achievement badge definitions
const ACHIEVEMENT_DEFINITIONS = {
  'simulation_first_trade': {
    name: 'First Trade',
    description: 'Made your first simulation trade',
    icon: '🎯',
    color: 'blue'
  },
  'simulation_first_portfolio': {
    name: 'Portfolio Starter',
    description: 'Created your first simulation portfolio',
    icon: '💼',
    color: 'green'
  },
  'simulation_diversified_portfolio': {
    name: 'Diversified',
    description: 'Own 5+ different assets',
    icon: '🌐',
    color: 'purple'
  },
  'simulation_active_trader': {
    name: 'Active Trader',
    description: 'Completed 10 simulation trades',
    icon: '📈',
    color: 'orange'
  },
  'simulation_trading_expert': {
    name: 'Trading Expert',
    description: 'Completed 50 simulation trades',
    icon: '🏆',
    color: 'gold'
  },
  'simulation_profit_maker': {
    name: 'Profit Maker',
    description: 'Logged a profitable trade',
    icon: '💰',
    color: 'green'
  },
  'simulation_diamond_hands': {
    name: 'Diamond Hands',
    description: 'Held a position for 30 days',
    icon: '💎',
    color: 'blue'
  },
  'simulation_green_week': {
    name: 'Green Week',
    description: 'Portfolio up 5 days in a row',
    icon: '📊',
    color: 'green'
  },
  'simulation_comeback_kid': {
    name: 'Comeback Kid',
    description: 'Recovered from -10% drawdown',
    icon: '🔄',
    color: 'orange'
  },
  'simulation_etf_expert': {
    name: 'ETF Expert',
    description: 'Own 3+ ETFs',
    icon: '📦',
    color: 'purple'
  },
  'simulation_tech_titan': {
    name: 'Tech Titan',
    description: 'Tech stocks over 50% of portfolio',
    icon: '💻',
    color: 'blue'
  }
};

const AchievementBadges = ({ achievements, className = '' }) => {
  if (!achievements || achievements.length === 0) {
    return (
      <GlassCard variant="floating" padding="large" className={className}>
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Achievements
        </h3>
        <div className="text-center py-8">
          <p className="text-white/60 mb-2">No achievements yet</p>
          <p className="text-white/40 text-sm">
            Complete trades and reach milestones to unlock badges!
          </p>
        </div>
      </GlassCard>
    );
  }

  // Filter simulation-related achievements
  const simulationAchievements = achievements.filter(achievement => {
    const type = achievement.type || achievement.badge_id || '';
    return type.startsWith('simulation_') || ACHIEVEMENT_DEFINITIONS[type];
  });

  if (simulationAchievements.length === 0) {
    return (
      <GlassCard variant="floating" padding="large" className={className}>
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Achievements
        </h3>
        <div className="text-center py-8">
          <p className="text-white/60 mb-2">No simulation achievements yet</p>
          <p className="text-white/40 text-sm">
            Start trading to unlock your first badge!
          </p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard variant="floating" padding="large" className={className}>
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
        <Trophy className="w-5 h-5" />
        Achievements ({simulationAchievements.length})
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {simulationAchievements.map((achievement, index) => {
          const type = achievement.type || achievement.badge_id || '';
          const definition = ACHIEVEMENT_DEFINITIONS[type] || {
            name: achievement.badge_name || achievement.type || 'Achievement',
            description: achievement.badge_description || achievement.details?.description || 'Great job!',
            icon: '🏅',
            color: 'blue'
          };

          const earnedDate = new Date(achievement.earned_at || achievement.created_at || Date.now());

          return (
            <motion.div
              key={achievement.id || index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white/10 rounded-lg p-4 hover:bg-white/15 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="text-4xl">{definition.icon}</div>
                <div className="flex-1">
                  <p className="text-white font-semibold mb-1">{definition.name}</p>
                  <p className="text-white/60 text-sm mb-2">{definition.description}</p>
                  <p className="text-white/40 text-xs">
                    Earned {earnedDate.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Progress indicator */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <p className="text-white/60 text-sm mb-2">
          Progress: {simulationAchievements.length} of {Object.keys(ACHIEVEMENT_DEFINITIONS).length} badges unlocked
        </p>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
            style={{
              width: `${(simulationAchievements.length / Object.keys(ACHIEVEMENT_DEFINITIONS).length) * 100}%`
            }}
          />
        </div>
      </div>
    </GlassCard>
  );
};

export default AchievementBadges;
