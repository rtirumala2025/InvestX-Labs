/**
 * Leaderboard Service
 * Centralized service for updating leaderboard scores across the application
 */

import { supabase } from './supabase/config';

/**
 * Calculate leaderboard score based on various metrics
 * @param {Object} params - Score calculation parameters
 * @param {number} params.portfolioReturn - Portfolio return percentage
 * @param {number} params.achievementsCount - Number of achievements earned
 * @param {number} params.tradesCount - Number of trades completed
 * @param {number} params.lessonsCompleted - Number of lessons completed (optional)
 * @returns {number} Calculated score
 */
export function calculateLeaderboardScore({ 
  portfolioReturn = 0, 
  achievementsCount = 0, 
  tradesCount = 0,
  lessonsCompleted = 0 
}) {
  return Math.round(
    (portfolioReturn * 10) + // Portfolio return weighted (10 points per %)
    (achievementsCount * 100) + // 100 points per achievement
    (tradesCount * 10) + // 10 points per trade
    (lessonsCompleted * 5) // 5 points per lesson completed
  );
}

/**
 * Update leaderboard entry for a user
 * @param {string} userId - User ID
 * @param {Object} metrics - User metrics
 * @param {number} metrics.portfolioReturn - Portfolio return percentage
 * @param {number} metrics.achievementsCount - Number of achievements
 * @param {number} metrics.tradesCount - Number of trades
 * @param {number} metrics.lessonsCompleted - Number of lessons completed
 * @param {string} metrics.username - Username (optional, will use email if not provided)
 * @param {Object} context - Additional context (optional)
 * @returns {Promise<Object>} Updated leaderboard entry
 */
export async function updateLeaderboard(userId, metrics = {}, context = {}) {
  if (!userId) {
    console.warn('[LeaderboardService] No userId provided, skipping update');
    return null;
  }

  try {
    // Get user profile for username if not provided
    let username = metrics.username;
    if (!username) {
      console.log('[LeaderboardService] Fetching username for user:', userId);
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('username, full_name')
        .eq('id', userId)
        .single();

      if (!profileError && profile) {
        username = profile.full_name || profile.username || 'Anonymous';
        console.log('[LeaderboardService] Found username:', username);
      } else {
        console.warn('[LeaderboardService] Profile not found, using Anonymous');
        username = 'Anonymous';
      }
    }

    // Get achievements count if not provided
    let achievementsCount = metrics.achievementsCount;
    if (achievementsCount === undefined) {
      const { data: achievements, error: achievementsError } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', userId);

      if (!achievementsError) {
        achievementsCount = achievements?.length || 0;
      } else {
        console.warn('[LeaderboardService] Error fetching achievements:', achievementsError);
        achievementsCount = 0;
      }
    }

    // Calculate score
    const score = calculateLeaderboardScore({
      portfolioReturn: metrics.portfolioReturn || 0,
      achievementsCount,
      tradesCount: metrics.tradesCount || 0,
      lessonsCompleted: metrics.lessonsCompleted || 0
    });

    // Update leaderboard
    const { data, error } = await supabase
      .from('leaderboard_scores')
      .upsert({
        user_id: userId,
        username,
        score,
        portfolio_return: metrics.portfolioReturn || 0,
        achievements_count: achievementsCount,
        trades_count: metrics.tradesCount || 0,
        lessons_completed: metrics.lessonsCompleted || 0,
        updated_at: new Date().toISOString(),
        ...context // Allow additional context fields
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('[LeaderboardService] Error updating leaderboard:', error);
      throw error;
    }

    console.log('[LeaderboardService] Leaderboard updated successfully for user:', userId, 'Score:', score);
    return data;

  } catch (error) {
    console.error('[LeaderboardService] Failed to update leaderboard:', error);
    throw error;
  }
}

/**
 * Update leaderboard from portfolio metrics
 * @param {string} userId - User ID
 * @param {string} portfolioId - Portfolio ID (optional, for simulation portfolios)
 * @param {Object} portfolio - Portfolio object with metrics
 * @returns {Promise<Object>} Updated leaderboard entry
 */
export async function updateLeaderboardFromPortfolio(userId, portfolioId = null, portfolio = {}) {
  try {
    // Calculate portfolio return
    let portfolioReturn = 0;
    
    if (portfolioId) {
      // Use RPC function if available
      try {
        const { data: metrics, error: metricsError } = await supabase.rpc('calculate_portfolio_metrics', {
          p_user_id: userId,
          p_portfolio_id: portfolioId
        });

        if (!metricsError && metrics) {
          const initialValue = portfolio.is_simulation ? 10000 : (portfolio.totalCostBasis || 0);
          const currentValue = metrics.total_value || portfolio.totalValue || 0;
          portfolioReturn = initialValue > 0 ? ((currentValue - initialValue) / initialValue) * 100 : 0;
        }
      } catch (rpcError) {
        console.warn('[LeaderboardService] RPC calculate_portfolio_metrics not available, using portfolio data');
        // Fallback to portfolio data
        const initialValue = portfolio.is_simulation ? 10000 : (portfolio.totalCostBasis || 0);
        const currentValue = portfolio.totalValue || 0;
        portfolioReturn = initialValue > 0 ? ((currentValue - initialValue) / initialValue) * 100 : 0;
      }
    } else {
      // Calculate from portfolio object
      const initialValue = portfolio.totalCostBasis || 0;
      const currentValue = portfolio.totalValue || 0;
      portfolioReturn = initialValue > 0 ? ((currentValue - initialValue) / initialValue) * 100 : 0;
    }

    // Get trades count from transactions
    let tradesCount = 0;
    if (portfolioId) {
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('id')
        .eq('portfolio_id', portfolioId);

      if (!transactionsError) {
        tradesCount = transactions?.length || 0;
      }
    }

    return await updateLeaderboard(userId, {
      portfolioReturn,
      tradesCount
    }, {
      portfolio_id: portfolioId,
      source: 'portfolio'
    });

  } catch (error) {
    console.error('[LeaderboardService] Error updating leaderboard from portfolio:', error);
    throw error;
  }
}

/**
 * Update leaderboard from achievement
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated leaderboard entry
 */
export async function updateLeaderboardFromAchievement(userId) {
  try {
    // Fetch current metrics
    const { data: currentScore, error: fetchError } = await supabase
      .from('leaderboard_scores')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.warn('[LeaderboardService] Error fetching current score:', fetchError);
    }

    // Get achievements count
    const { data: achievements, error: achievementsError } = await supabase
      .from('user_achievements')
      .select('id')
      .eq('user_id', userId);

    if (achievementsError) {
      throw achievementsError;
    }

    const achievementsCount = achievements?.length || 0;

    // Update with existing metrics plus new achievements
    return await updateLeaderboard(userId, {
      portfolioReturn: currentScore?.portfolio_return || 0,
      achievementsCount,
      tradesCount: currentScore?.trades_count || 0,
      lessonsCompleted: currentScore?.lessons_completed || 0
    }, {
      source: 'achievement'
    });

  } catch (error) {
    console.error('[LeaderboardService] Error updating leaderboard from achievement:', error);
    throw error;
  }
}

/**
 * Update leaderboard from lesson completion
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated leaderboard entry
 */
export async function updateLeaderboardFromLessonCompletion(userId) {
  try {
    // This would typically query a lessons_completed table
    // For now, we'll fetch current score and increment lessons_completed
    const { data: currentScore, error: fetchError } = await supabase
      .from('leaderboard_scores')
      .select('*')
      .eq('user_id', userId)
      .single();

    let lessonsCompleted = 0;
    if (!fetchError && currentScore) {
      lessonsCompleted = (currentScore.lessons_completed || 0) + 1;
    } else {
      lessonsCompleted = 1;
    }

    return await updateLeaderboard(userId, {
      portfolioReturn: currentScore?.portfolio_return || 0,
      achievementsCount: currentScore?.achievements_count || 0,
      tradesCount: currentScore?.trades_count || 0,
      lessonsCompleted
    }, {
      source: 'education'
    });

  } catch (error) {
    console.error('[LeaderboardService] Error updating leaderboard from lesson completion:', error);
    throw error;
  }
}

export default {
  updateLeaderboard,
  updateLeaderboardFromPortfolio,
  updateLeaderboardFromAchievement,
  updateLeaderboardFromLessonCompletion,
  calculateLeaderboardScore
};

