import logger from '../utils/logger.js';
import { adminSupabase, handleSupabaseError } from './supabaseClient.js';
import { dataInsights } from './dataInsights.js';
import { fetchSymbolNews, summarizeHeadlines } from './newsService.js';
import {
  fallbackStrategies,
  fallbackSuggestionLogs,
  fallbackNewsSummary
} from './fallbackData.js';

const clamp = (value, min = 0, max = 100) => Math.min(Math.max(value, min), max);

const DEFAULT_SUGGESTION_COUNT = 4;

const riskMap = {
  very_low: 0.15,
  conservative: 0.25,
  low: 0.35,
  moderate: 0.5,
  balanced: 0.55,
  medium: 0.6,
  growth: 0.7,
  aggressive: 0.8,
  very_high: 0.9
};

const experienceMap = {
  beginner: 0.2,
  novice: 0.25,
  intermediate: 0.5,
  advanced: 0.75,
  expert: 0.9
};

const goalWeights = {
  growth: 0.8,
  income: 0.3,
  diversification: 0.6,
  preservation: 0.2,
  education: 0.5
};

/**
 * Fetch comprehensive user context from Supabase
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Enhanced user context
 */
const fetchUserContext = async (userId) => {
  if (!adminSupabase || !userId) {
    return {};
  }

  try {
    // Fetch user profile
    const { data: profile, error: profileError } = await adminSupabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileError && profileError.code !== 'PGRST116') {
      logger.warn('Error fetching user profile', { userId, error: profileError.message });
    }

    // Fetch portfolio history
    const { data: portfolios, error: portfoliosError } = await adminSupabase
      .from('portfolios')
      .select('id, name, virtual_balance, metadata, created_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(5);

    if (portfoliosError) {
      logger.warn('Error fetching portfolios', { userId, error: portfoliosError.message });
    }

    // Fetch recent transactions for portfolio history
    let transactionHistory = [];
    if (portfolios?.length) {
      const portfolioIds = portfolios.map(p => p.id);
      const { data: transactions, error: transactionsError } = await adminSupabase
        .from('transactions')
        .select('transaction_type, symbol, shares, price, total_amount, transaction_date')
        .in('portfolio_id', portfolioIds)
        .order('transaction_date', { ascending: false })
        .limit(50);

      if (!transactionsError && transactions) {
        transactionHistory = transactions;
      }
    }

    // Fetch holdings for current portfolio state
    let currentHoldings = [];
    if (portfolios?.length) {
      const primaryPortfolioId = portfolios[0].id;
      const { data: holdings, error: holdingsError } = await adminSupabase
        .from('holdings')
        .select('symbol, shares, purchase_price, current_price, sector, asset_type')
        .eq('portfolio_id', primaryPortfolioId)
        .limit(20);

      if (!holdingsError && holdings) {
        currentHoldings = holdings;
      }
    }

    // Fetch learning progress from leaderboard
    const { data: leaderboardData, error: leaderboardError } = await adminSupabase
      .from('leaderboard_scores')
      .select('learning_progress, achievements_count, trades_count')
      .eq('user_id', userId)
      .maybeSingle();

    if (leaderboardError && leaderboardError.code !== 'PGRST116') {
      logger.warn('Error fetching leaderboard data', { userId, error: leaderboardError.message });
    }

    // Fetch achievements
    const { data: achievements, error: achievementsError } = await adminSupabase
      .from('user_achievements')
      .select('badge_id, badge_name, earned_at')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false })
      .limit(10);

    if (achievementsError) {
      logger.warn('Error fetching achievements', { userId, error: achievementsError.message });
    }

    // Calculate portfolio metrics
    const totalPortfolioValue = portfolios?.reduce((sum, p) => sum + Number(p.virtual_balance || 0), 0) || 0;
    const totalTrades = transactionHistory.length;
    const recentTrades = transactionHistory.slice(0, 10);
    const sectors = [...new Set(currentHoldings.map(h => h.sector).filter(Boolean))];
    const symbols = [...new Set(currentHoldings.map(h => h.symbol).filter(Boolean))];

    // Calculate portfolio performance trend
    const recentTransactions = transactionHistory.slice(0, 20);
    const buyCount = recentTransactions.filter(t => t.transaction_type === 'buy').length;
    const sellCount = recentTransactions.filter(t => t.transaction_type === 'sell').length;
    const tradingActivity = totalTrades > 0 ? clamp(totalTrades / 100, 0, 1) : 0;

    return {
      profile: profile || {},
      portfolioHistory: {
        totalPortfolios: portfolios?.length || 0,
        totalValue: totalPortfolioValue,
        recentPortfolios: portfolios?.slice(0, 3) || [],
        currentHoldings: currentHoldings,
        sectors: sectors,
        symbols: symbols,
        totalTrades: totalTrades,
        recentTrades: recentTrades,
        tradingActivity: tradingActivity,
        buySellRatio: totalTrades > 0 ? buyCount / (buyCount + sellCount || 1) : 0.5
      },
      learningProgress: {
        progress: leaderboardData?.learning_progress || 0,
        achievementsCount: leaderboardData?.achievements_count || achievements?.length || 0,
        tradesCount: leaderboardData?.trades_count || totalTrades,
        recentAchievements: achievements?.slice(0, 5) || []
      },
      interests: profile?.interests || [],
      riskTolerance: profile?.risk_tolerance || 'moderate',
      experienceLevel: profile?.experience_level || 'beginner'
    };
  } catch (error) {
    logger.error('Error fetching user context', { userId, error: error.message });
    return {};
  }
};

export const buildUserEmbedding = (profile = {}, userContext = {}) => {
  const riskTolerance = String(
    profile.risk_tolerance ||
    profile.riskTolerance ||
    profile.risk_profile ||
    userContext.riskTolerance ||
    'moderate'
  ).toLowerCase();

  const experience = String(
    profile.investment_experience ||
    profile.investmentExperience ||
    profile.experience ||
    userContext.experienceLevel ||
    'beginner'
  ).toLowerCase();

  const investmentGoals = Array.isArray(profile.investment_goals)
    ? profile.investment_goals
    : Array.isArray(profile.investmentGoals)
    ? profile.investmentGoals
    : [];

  const interests = Array.isArray(profile.interests) 
    ? profile.interests 
    : Array.isArray(userContext.interests)
    ? userContext.interests
    : [];

  // Use portfolio value from context if available
  const portfolioValue = userContext.portfolioHistory?.totalValue || 
    Number(profile.virtual_portfolio_value || profile.portfolio_value || 0);
  const normalizedValue = portfolioValue > 0 ? Math.min(Math.log10(portfolioValue + 1) / 6, 1) : 0.1;

  const riskScore = riskMap[riskTolerance] ?? 0.5;
  const experienceScore = experienceMap[experience] ?? 0.3;

  const goalScores = investmentGoals.reduce(
    (acc, goal) => acc + (goalWeights[String(goal).toLowerCase()] || 0.4),
    0
  );
  const averageGoalScore = investmentGoals.length ? goalScores / investmentGoals.length : 0.45;

  const techInterest = interests.some((interest) =>
    String(interest).toLowerCase().includes('tech') ||
    String(interest).toLowerCase().includes('technology') ||
    String(interest).toLowerCase().includes('innovation')
  )
    ? 0.8
    : 0.4;

  const sustainabilityInterest = interests.some((interest) =>
    String(interest).toLowerCase().includes('esg') ||
    String(interest).toLowerCase().includes('sustain')
  )
    ? 0.7
    : 0.3;

  const diversificationNeed = profile.diversification_gap
    ? clamp(Number(profile.diversification_gap) / 100, 0, 1)
    : userContext.portfolioHistory?.sectors?.length
    ? clamp(1 - (userContext.portfolioHistory.sectors.length / 10), 0, 1)
    : 0.5;

  const cashAvailability = profile.monthly_contribution
    ? clamp(Number(profile.monthly_contribution) / 1000, 0, 1)
    : 0.35;

  // Enhanced embedding with learning progress and trading activity
  const learningProgress = userContext.learningProgress?.progress || 0;
  const normalizedLearningProgress = clamp(learningProgress / 100, 0, 1);
  const tradingActivity = userContext.portfolioHistory?.tradingActivity || 0;

  return [
    Number(riskScore.toFixed(2)),
    Number(experienceScore.toFixed(2)),
    Number(averageGoalScore.toFixed(2)),
    Number(diversificationNeed.toFixed(2)),
    Number(normalizedValue.toFixed(2)),
    Number(techInterest.toFixed(2)),
    Number(sustainabilityInterest.toFixed(2)),
    Number(cashAvailability.toFixed(2)),
    Number(normalizedLearningProgress.toFixed(2)),
    Number(tradingActivity.toFixed(2))
  ];
};

const sanitizeProfileForLogging = (profile = {}) => {
  const {
    email,
    phone,
    address,
    ...rest
  } = profile;

  return rest;
};

const fetchKnowledgeStrategies = async (embedding, count) => {
  if (!adminSupabase) {
    logger.warn('Supabase admin client unavailable, falling back to static strategies');
    return fallbackStrategies.slice(0, count);
  }

  try {
    const { data, error } = await adminSupabase.rpc('match_strategies', {
      profile_embedding: embedding,
      match_count: count
    });

    if (error) {
      handleSupabaseError(error, { operation: 'match_strategies' });
      return fallbackStrategies.slice(0, count);
    }

    return Array.isArray(data) && data.length
      ? data
      : fallbackStrategies.slice(0, count);
  } catch (error) {
    handleSupabaseError(error, { operation: 'match_strategies' });
    return fallbackStrategies.slice(0, count);
  }
};

const fetchMarketContext = async (ticker) => {
  try {
    const quote = await dataInsights.getStockQuote(ticker);
    if (!quote) {
      return null;
    }

    const currentPrice = Number(quote['05. price'] || quote.price || 0);
    const change = Number(quote['09. change'] || 0);
    const changePercentRaw = quote['10. change percent'] || quote.changePercent || '0%';
    const changePercent = Number(String(changePercentRaw).replace('%', '')) || 0;
    const previousClose = Number(quote['08. previous close'] || 0);

    const marketSignal = clamp(55 + changePercent * 2.1, 0, 100);

    return {
      currentPrice,
      change,
      changePercent,
      previousClose,
      marketSignal,
      quote
    };
  } catch (error) {
    logger.warn('Market context fetch failed', { ticker, error: error.message });
    return null;
  }
};

const buildExplainability = ({ match, profile, marketContext, newsSummary, profileMatchScore, userContext = {} }) => {
  const metadata = match.metadata || {};
  const riskTolerance = profile.risk_tolerance || profile.riskTolerance || 'moderate';
  
  // Build personalized context messages
  const portfolioContext = userContext.portfolioHistory;
  const learningContext = userContext.learningProgress;
  
  let personalizedNote = '';
  if (portfolioContext?.sectors?.length) {
    const sectorMatch = portfolioContext.sectors.some(s => 
      match.tags?.some(tag => String(tag).toLowerCase().includes(s.toLowerCase()))
    );
    if (sectorMatch) {
      personalizedNote = `This aligns with your existing ${portfolioContext.sectors[0]} holdings. `;
    }
  }
  
  if (learningContext?.progress > 0) {
    personalizedNote += `Based on your learning progress (${learningContext.progress}% complete), `;
  }
  
  if (portfolioContext?.totalTrades > 0) {
    personalizedNote += `you've made ${portfolioContext.totalTrades} trades, showing active engagement. `;
  }

  return {
    headline: `Why "${match.title}" aligns with your profile`,
    profileAlignment: metadata.why_it_matters ||
      `${personalizedNote}This strategy lines up with your ${riskTolerance} risk comfort and current learning goals.`,
    knowledgeBaseSummary: match.summary,
    marketContext: marketContext
      ? `Recent movement: ${marketContext.changePercent >= 0 ? '▲' : '▼'} ${marketContext.changePercent.toFixed(2)}%. ` +
        `We combine this live signal with your profile to keep you market-aware.`
      : 'Live market data was temporarily unavailable. We will refresh automatically once it returns.',
    learningOpportunity: metadata.education_focus ||
      'Use this strategy to practice disciplined rebalancing and reflection on allocation choices.',
    newsInsight: newsSummary.summary,
    newsSentimentLabel: newsSummary.sentimentLabel || 'neutral',
    profileMatchScore,
    portfolioContext: portfolioContext ? {
      totalValue: portfolioContext.totalValue,
      sectors: portfolioContext.sectors,
      tradingActivity: portfolioContext.tradingActivity
    } : null,
    learningContext: learningContext ? {
      progress: learningContext.progress,
      achievementsCount: learningContext.achievementsCount
    } : null
  };
};

const computeConfidence = (profileMatch, marketSignal = 50, newsSentiment = 0) => {
  const newsScore = clamp((newsSentiment + 1) * 50, 0, 100); // convert -1..1 to 0..100
  const confidence = Math.round(
    profileMatch * 0.55 +
    clamp(marketSignal, 0, 100) * 0.3 +
    newsScore * 0.15
  );

  return {
    confidence: clamp(confidence),
    breakdown: {
      profileMatch,
      marketSignal: clamp(marketSignal, 0, 100),
      newsScore
    }
  };
};

export const generateSuggestions = async ({
  userId,
  profile = {},
  requestedCount = DEFAULT_SUGGESTION_COUNT
}) => {
  if (!userId) {
    throw new Error('User ID is required to generate suggestions');
  }

  // Fetch comprehensive user context
  const userContext = await fetchUserContext(userId);
  
  // Merge profile with fetched context
  const enhancedProfile = {
    ...profile,
    ...userContext.profile,
    interests: profile.interests || userContext.interests || [],
    risk_tolerance: profile.risk_tolerance || userContext.riskTolerance || 'moderate',
    experience_level: profile.experience_level || userContext.experienceLevel || 'beginner',
    virtual_portfolio_value: userContext.portfolioHistory?.totalValue || profile.virtual_portfolio_value || 0
  };

  // Build embedding with enhanced context
  const embedding = buildUserEmbedding(enhancedProfile, userContext);
  let strategies = await fetchKnowledgeStrategies(embedding, requestedCount);

  if (!strategies.length) {
    logger.warn('No strategies returned from knowledge base, using fallback dataset');
    strategies = fallbackStrategies.slice(0, requestedCount);
  }

  const suggestions = [];
  const suggestionLogsPayload = [];

  for (const strategy of strategies) {
    const ticker = strategy.ticker;
    const symbol = ticker?.toUpperCase();

    const [marketContext, newsItems] = await Promise.all([
      fetchMarketContext(symbol),
      fetchSymbolNews(symbol).catch((error) => {
        logger.warn('News fetch failed', { symbol, error: error.message });
        return [];
      })
    ]);

    let newsSummary = fallbackNewsSummary;

    try {
      const summaryResult = await summarizeHeadlines(newsItems, { profile, symbol });
      if (summaryResult?.summary) {
        newsSummary = {
          ...fallbackNewsSummary,
          ...summaryResult
        };
      }
    } catch (error) {
      logger.warn('News summarization failed', { symbol, error: error.message });
    }

    const profileMatchScore = clamp(Math.round((Number(strategy.similarity) || 0) * 100));
    const { confidence, breakdown } = computeConfidence(
      profileMatchScore,
      marketContext?.marketSignal ?? 50,
      newsSummary.sentiment ?? 0
    );

    const suggestionId = `sugg_${strategy.strategy_id}_${Date.now()}`;
    
    // Enhanced explanation with portfolio context
    const explanation = buildExplainability({
      match: strategy,
      profile: enhancedProfile,
      marketContext,
      newsSummary,
      profileMatchScore,
      userContext
    });

    suggestions.push({
      id: suggestionId,
      strategyId: strategy.strategy_id,
      title: strategy.title,
      type: 'buy',
      symbol,
      company: strategy.title,
      description: strategy.summary,
      tags: strategy.tags || [],
      createdAt: new Date().toISOString(),
      confidence,
      confidenceBreakdown: breakdown,
      profileMatch: profileMatchScore,
      marketContext,
      news: {
        items: newsItems,
        summary: newsSummary.summary,
        sentimentLabel: newsSummary.sentimentLabel || 'neutral',
        sentimentScore: newsSummary.sentiment ?? 0
      },
      explanation,
      metadata: {
        strategyMetadata: strategy.metadata || {},
        news: newsItems
      }
    });

    suggestionLogsPayload.push({
      user_id: userId,
      suggestion_id: suggestionId,
      strategy_id: strategy.strategy_id,
      confidence,
      profile_match: breakdown.profileMatch,
      market_signal: breakdown.marketSignal,
      news_sentiment: breakdown.newsScore,
      metadata: {
        ticker: symbol,
        explanation,
        news_summary: newsSummary,
        profile_snapshot: sanitizeProfileForLogging(profile)
      }
    });
  }

  let logs = [];

  if (adminSupabase) {
    try {
      const { data, error } = await adminSupabase
        .from('ai_suggestions_log')
        .insert(suggestionLogsPayload)
        .select('*');

      if (error) {
        handleSupabaseError(error, { operation: 'insert_ai_suggestions_log' });
      } else {
        logs = data || [];
      }
    } catch (error) {
      handleSupabaseError(error, { operation: 'insert_ai_suggestions_log' });
    }
  } else {
    logs = suggestionLogsPayload.map((payload) => ({
      id: `offline_${payload.suggestion_id}`,
      suggestion_id: payload.suggestion_id,
      user_id: payload.user_id,
      metadata: payload.metadata,
      created_at: new Date().toISOString()
    }));
  }

  const logMap = new Map(logs.map((entry) => [entry.suggestion_id, entry]));
  const suggestionsWithLog = suggestions.map((suggestion) => ({
    ...suggestion,
    logId: logMap.get(suggestion.id)?.id || null
  }));

  const sanitizedProfile = sanitizeProfileForLogging(profile);

  if (adminSupabase) {
    try {
      await adminSupabase.from('ai_request_log').insert({
        user_id: userId,
        input_profile: sanitizedProfile,
        generated_suggestions: suggestionsWithLog.map((suggestion) => ({
          suggestion_id: suggestion.id,
          strategy_id: suggestion.strategyId,
          confidence: suggestion.confidence,
          profile_match: suggestion.profileMatch,
          symbol: suggestion.symbol
        }))
      });
    } catch (error) {
      handleSupabaseError(error, { operation: 'insert_ai_request_log' });
    }
  } else {
    logger.warn('Supabase unavailable, skipping AI request logging');
  }

  return { suggestions: suggestionsWithLog, logs: logs || [] };
};

export const updateSuggestionConfidence = async ({ logId, confidence, userId }) => {
  if (!logId) {
    throw new Error('logId is required');
  }

  if (!adminSupabase) {
    logger.warn('Supabase unavailable while updating suggestion confidence');
    return {
      id: logId,
      confidence: clamp(confidence),
      metadata: {
        updated_by_user: userId,
        offline: true,
        note: 'Confidence update will sync when connection is restored.'
      }
    };
  }

  let existing = null;

  try {
    const { data, error } = await adminSupabase
      .from('ai_suggestions_log')
      .select('metadata')
      .eq('id', logId)
      .maybeSingle();

    if (error) {
      handleSupabaseError(error, { operation: 'fetch_ai_suggestions_log', logId });
    } else {
      existing = data;
    }
  } catch (error) {
    handleSupabaseError(error, { operation: 'fetch_ai_suggestions_log', logId });
  }

  const mergedMetadata = {
    ...(existing?.metadata || {}),
    updated_by_user: userId,
    user_override_at: new Date().toISOString()
  };

  try {
    const { data, error } = await adminSupabase
      .from('ai_suggestions_log')
      .update({
        confidence: clamp(confidence),
        metadata: mergedMetadata
      })
      .eq('id', logId)
      .select('*')
      .maybeSingle();

    if (error) {
      const normalized = handleSupabaseError(error, { operation: 'update_ai_suggestions_log', logId });
      const supabaseError = new Error(normalized.message);
      Object.assign(supabaseError, normalized);
      throw supabaseError;
    }

    return data;
  } catch (error) {
    const normalized = handleSupabaseError(error, { operation: 'update_ai_suggestions_log', logId });
    const supabaseError = new Error(normalized.message);
    Object.assign(supabaseError, normalized);
    throw supabaseError;
  }
};

export const recordSuggestionInteraction = async ({ logId, userId, interactionType, payload = {} }) => {
  if (!logId) {
    throw new Error('logId is required');
  }

  if (!adminSupabase) {
    logger.warn('Supabase unavailable while recording suggestion interaction');
    return {
      id: logId,
      metadata: {
        last_interaction: {
          type: interactionType,
          user_id: userId,
          payload,
          occurred_at: new Date().toISOString(),
          offline: true
        }
      }
    };
  }

  let existing = null;

  try {
    const { data, error } = await adminSupabase
      .from('ai_suggestions_log')
      .select('metadata')
      .eq('id', logId)
      .maybeSingle();

    if (error) {
      handleSupabaseError(error, { operation: 'fetch_ai_suggestions_log', logId });
    } else {
      existing = data;
    }
  } catch (error) {
    handleSupabaseError(error, { operation: 'fetch_ai_suggestions_log', logId });
  }

  const updatedMetadata = {
    ...(existing?.metadata || {}),
    last_interaction: {
      type: interactionType,
      user_id: userId,
      payload,
      occurred_at: new Date().toISOString()
    }
  };

  try {
    const { data, error } = await adminSupabase
      .from('ai_suggestions_log')
      .update({
        metadata: updatedMetadata
      })
      .eq('id', logId)
      .select('*')
      .maybeSingle();

    if (error) {
      const normalized = handleSupabaseError(error, { operation: 'update_ai_suggestions_log_metadata', logId });
      const supabaseError = new Error(normalized.message);
      Object.assign(supabaseError, normalized);
      throw supabaseError;
    }

    return data;
  } catch (error) {
    const normalized = handleSupabaseError(error, { operation: 'update_ai_suggestions_log_metadata', logId });
    const supabaseError = new Error(normalized.message);
    Object.assign(supabaseError, normalized);
    throw supabaseError;
  }
};

export const getSuggestionLogs = async ({ userId, limit = 25 }) => {
  if (!adminSupabase) {
    logger.warn('Supabase unavailable, returning fallback suggestion logs');
    return fallbackSuggestionLogs;
  }

  try {
    const { data, error } = await adminSupabase
      .from('ai_request_log')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      const normalized = handleSupabaseError(error, { operation: 'select_ai_request_log', userId });
      const supabaseError = new Error(normalized.message);
      Object.assign(supabaseError, normalized);
      throw supabaseError;
    }

    return data;
  } catch (error) {
    const normalized = handleSupabaseError(error, { operation: 'select_ai_request_log', userId });
    const supabaseError = new Error(normalized.message);
    Object.assign(supabaseError, normalized);
    throw supabaseError;
  }
};

