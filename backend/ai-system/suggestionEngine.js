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

export const buildUserEmbedding = (profile = {}) => {
  const riskTolerance = String(
    profile.risk_tolerance ||
    profile.riskTolerance ||
    profile.risk_profile ||
    'moderate'
  ).toLowerCase();

  const experience = String(
    profile.investment_experience ||
    profile.investmentExperience ||
    profile.experience ||
    'beginner'
  ).toLowerCase();

  const investmentGoals = Array.isArray(profile.investment_goals)
    ? profile.investment_goals
    : Array.isArray(profile.investmentGoals)
    ? profile.investmentGoals
    : [];

  const interests = Array.isArray(profile.interests) ? profile.interests : [];

  const virtualValue = Number(profile.virtual_portfolio_value || profile.portfolio_value || 0);
  const normalizedValue = virtualValue > 0 ? Math.min(Math.log10(virtualValue + 1) / 6, 1) : 0.1;

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
    : 0.5;

  const cashAvailability = profile.monthly_contribution
    ? clamp(Number(profile.monthly_contribution) / 1000, 0, 1)
    : 0.35;

  return [
    Number(riskScore.toFixed(2)),
    Number(experienceScore.toFixed(2)),
    Number(averageGoalScore.toFixed(2)),
    Number(diversificationNeed.toFixed(2)),
    Number(normalizedValue.toFixed(2)),
    Number(techInterest.toFixed(2)),
    Number(sustainabilityInterest.toFixed(2)),
    Number(cashAvailability.toFixed(2))
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

const buildExplainability = ({ match, profile, marketContext, newsSummary, profileMatchScore }) => {
  const metadata = match.metadata || {};
  const riskTolerance = profile.risk_tolerance || profile.riskTolerance || 'moderate';

  return {
    headline: `Why "${match.title}" aligns with your profile`,
    profileAlignment: metadata.why_it_matters ||
      `This strategy lines up with your ${riskTolerance} risk comfort and current learning goals.`,
    knowledgeBaseSummary: match.summary,
    marketContext: marketContext
      ? `Recent movement: ${marketContext.changePercent >= 0 ? '▲' : '▼'} ${marketContext.changePercent.toFixed(2)}%. ` +
        `We combine this live signal with your profile to keep you market-aware.`
      : 'Live market data was temporarily unavailable. We will refresh automatically once it returns.',
    learningOpportunity: metadata.education_focus ||
      'Use this strategy to practice disciplined rebalancing and reflection on allocation choices.',
    newsInsight: newsSummary.summary,
    newsSentimentLabel: newsSummary.sentimentLabel || 'neutral',
    profileMatchScore
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

  const embedding = buildUserEmbedding(profile);
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
    const explanation = buildExplainability({
      match: strategy,
      profile,
      marketContext,
      newsSummary,
      profileMatchScore
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

