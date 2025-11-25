import fetch from 'node-fetch';
import {
  aiEngine,
  createApiResponse,
  generateSuggestions as generateSuggestionsService,
  updateSuggestionConfidence as updateSuggestionConfidenceService,
  recordSuggestionInteraction as recordSuggestionInteractionService,
  getSuggestionLogs as getSuggestionLogsService,
  logger
} from '../ai-system/index.js';
import {
  fallbackStrategies
} from '../ai-system/fallbackData.js';
import { supabase } from '../ai-system/supabaseClient.js';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

// In-memory cache for AI requests (30 seconds TTL)
const aiRequestCache = new Map();
const AI_CACHE_TTL = 30 * 1000; // 30 seconds

const getAICacheKey = (endpoint, params) => {
  return `${endpoint}:${JSON.stringify(params)}`;
};

const getCachedAIResponse = (cacheKey) => {
  const cached = aiRequestCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < AI_CACHE_TTL) {
    return cached.data;
  }
  aiRequestCache.delete(cacheKey);
  return null;
};

const setCachedAIResponse = (cacheKey, data) => {
  aiRequestCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
};

// Clean up expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of aiRequestCache.entries()) {
    if (now - value.timestamp >= AI_CACHE_TTL) {
      aiRequestCache.delete(key);
    }
  }
}, 30000); // Run cleanup every 30 seconds

// Retry logic with exponential backoff
const retryWithBackoff = async (fn, maxRetries = 3, initialDelay = 1000) => {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        logger.warn(`AI request failed, retrying in ${delay}ms`, {
          attempt: attempt + 1,
          maxRetries,
          error: error.message
        });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
};

const buildEducationalFallback = (message) => createApiResponse({
  suggestions: fallbackStrategies.map((strategy, index) => ({
    id: `fallback_${index}`,
    title: strategy.title,
    description: strategy.summary,
    tags: strategy.tags,
    createdAt: new Date().toISOString(),
    confidence: {
      confidence: 60,
      breakdown: {
        profileMatch: 55,
        marketSignal: 50,
        newsScore: 45
      }
    },
    explanation: {
      headline: strategy.metadata?.education_focus || 'Educational insight',
      profileAlignment: strategy.metadata?.why_it_matters,
      knowledgeBaseSummary: strategy.summary,
      marketContext: 'Live market data will appear when the connection is restored.',
      learningOpportunity: strategy.metadata?.education_focus,
      newsInsight: 'News insights unavailable offline'
    },
    metadata: strategy.metadata || {}
  })),
  count: fallbackStrategies.length,
  offline: true
}, {
  message,
  metadata: {
    offline: true,
    educational_disclaimer: 'This educational set is provided because live AI services are currently unavailable.'
  }
});

export const healthCheck = (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'ai-service',
    timestamp: new Date().toISOString(),
    requires: {
      OPENROUTER_API_KEY: Boolean(OPENROUTER_API_KEY),
      ALPHA_VANTAGE_API_KEY: Boolean(ALPHA_VANTAGE_API_KEY)
    }
  });
};

export const generateSuggestions = async (req, res) => {
  const startTime = Date.now();
  const { userId, profile = {}, options = {} } = req.body || {};
  const cacheKey = getAICacheKey('suggestions', { userId, profile, options });

  try {
    // Input validation
    if (!userId || typeof userId !== 'string') {
      logger.warn('Invalid userId provided for suggestions', { userId, ip: req.ip });
      return res.status(400).json(createApiResponse(null, {
        success: false,
        statusCode: 400,
        message: 'userId is required and must be a valid string'
      }));
    }

    // Check cache first
    const cachedResponse = getCachedAIResponse(cacheKey);
    if (cachedResponse) {
      logger.debug('Serving cached AI suggestions', { userId });
      return res.json(cachedResponse);
    }

    // Generate suggestions with retry logic
    const { suggestions } = await retryWithBackoff(async () => {
      return await generateSuggestionsService({
        userId,
        profile,
        requestedCount: options?.count
      });
    }, 3, 1000);

    const response = createApiResponse(
      {
        suggestions,
        count: suggestions.length
      },
      {
        message: 'AI suggestions generated successfully',
        metadata: {
          educational_disclaimer: 'The InvestX Labs AI provides educational insights, not financial advice.'
        }
      }
    );

    // Cache the response
    setCachedAIResponse(cacheKey, response);

    const duration = Date.now() - startTime;
    logger.info('AI suggestions generated successfully', { userId, count: suggestions.length, duration });

    return res.status(200).json(response);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Failed to generate AI suggestions', {
      error: error.message,
      stack: error.stack,
      userId,
      duration,
      ip: req.ip
    });

    return res.status(503).json(buildEducationalFallback(
      'Live AI suggestions are temporarily unavailable. Showing an educational set instead.'
    ));
  }
};

/**
 * Fetch recommendation explanation via Supabase RPC
 */
export const getRecommendationExplanation = async (req, res) => {
  try {
    const { recommendationId } = req.params;
    const userId = req.query.userId || 'anonymous';

    if (!recommendationId) {
      return res.status(400).json(createApiResponse(null, {
        success: false,
        statusCode: 400,
        message: 'recommendationId is required'
      }));
    }

    const { data, error } = await supabase
      .rpc('get_recommendation_explanation', {
        recommendation_id: recommendationId,
        user_id: userId
      });

    if (error) {
      throw error;
    }

    const explanation = data || { explanation: 'No explanation available' };
    return res.status(200).json(createApiResponse(explanation, 'Explanation retrieved'));
  } catch (error) {
    logger.error('Failed to fetch recommendation explanation', {
      error: error.message,
      stack: error.stack
    });

    // Return graceful fallback
    return res.status(503).json(createApiResponse(
      { explanation: 'Unable to load explanation at this time. Please try again later.' },
      {
        success: false,
        statusCode: 503,
        message: 'Explanation service unavailable',
        metadata: { offline: true }
      }
    ));
  }
};

/**
 * Compute portfolio analytics server-side
 */
export const computeAnalytics = async (req, res) => {
  try {
    const { holdings = [], transactions = [], marketData = {} } = req.body || {};

    if (!Array.isArray(holdings)) {
      return res.status(400).json(createApiResponse(null, {
        success: false,
        statusCode: 400,
        message: 'holdings must be an array'
      }));
    }

    const safeNumber = (value) => {
      const n = Number(value);
      return Number.isFinite(n) ? n : 0;
    };

    const totalValue = holdings.reduce((sum, h) => {
      return sum + safeNumber(h.shares) * safeNumber(h.currentPrice || h.price || 0);
    }, 0);

    const totalCostBasis = holdings.reduce((sum, h) => {
      return sum + safeNumber(h.shares) * safeNumber(h.costBasis || h.avgCost || h.purchasePrice || 0);
    }, 0);

    const totalGainLoss = totalValue - totalCostBasis;
    const totalGainLossPercentage = totalCostBasis > 0 ? (totalGainLoss / totalCostBasis) * 100 : 0;

    // Simple ROI approximation from transactions if available
    const invested = transactions
      .filter((t) => (t.type || t.action)?.toLowerCase() === 'buy')
      .reduce((sum, t) => sum + safeNumber(t.amount || t.total || (t.shares * t.price)), 0);
    const realized = transactions
      .filter((t) => (t.type || t.action)?.toLowerCase() === 'sell')
      .reduce((sum, t) => sum + safeNumber(t.amount || t.total || (t.shares * t.price)), 0);
    const roi = invested > 0 ? ((realized + totalValue - invested) / invested) : 0;

    // Sector allocation
    const sectorAllocation = holdings.reduce((acc, h) => {
      const sector = h.sector || 'Unknown';
      const value = safeNumber(h.shares) * safeNumber(h.currentPrice || h.price || 0);
      acc[sector] = (acc[sector] || 0) + value;
      return acc;
    }, {});
    const sectorTotal = Object.values(sectorAllocation).reduce((a, b) => a + b, 0) || 1;
    const sectorPercentages = Object.fromEntries(
      Object.entries(sectorAllocation).map(([k, v]) => [k, (v / sectorTotal) * 100])
    );

    const response = {
      totalValue,
      totalCostBasis,
      totalGainLoss,
      totalGainLossPercentage,
      roi,
      sectorAllocation: sectorPercentages,
      lastUpdated: new Date().toISOString()
    };

    return res.status(200).json(createApiResponse(response, 'Analytics computed'));
  } catch (error) {
    logger.error('Failed to compute analytics', {
      error: error.message,
      stack: error.stack
    });

    return res.status(503).json(createApiResponse(null, {
      success: false,
      statusCode: 503,
      message: 'Analytics service unavailable',
      metadata: { offline: true }
    }));
  }
};

export const updateSuggestionConfidence = async (req, res) => {
  try {
    const { logId } = req.params;
    const { confidence, userId } = req.body || {};

    if (!logId) {
      return res.status(400).json(createApiResponse(null, {
        success: false,
        statusCode: 400,
        message: 'logId is required'
      }));
    }

    if (confidence === undefined) {
      return res.status(400).json(createApiResponse(null, {
        success: false,
        statusCode: 400,
        message: 'confidence is required'
      }));
    }

    const updated = await updateSuggestionConfidenceService({
      logId,
      confidence,
      userId
    });

    return res.status(200).json(createApiResponse(
      { log: updated },
      'Confidence updated successfully'
    ));
  } catch (error) {
    logger.error('Failed to update suggestion confidence', {
      error: error.message,
      stack: error.stack
    });

    return res.status(503).json(createApiResponse(null, {
      success: false,
      statusCode: 503,
      message: 'Unable to update confidence score at this time',
      metadata: { offline: true }
    }));
  }
};

export const recordSuggestionInteraction = async (req, res) => {
  try {
    const { logId } = req.params;
    const { userId, interactionType, payload } = req.body || {};

    if (!logId) {
      return res.status(400).json(createApiResponse(null, {
        success: false,
        statusCode: 400,
        message: 'logId is required'
      }));
    }

    if (!interactionType) {
      return res.status(400).json(createApiResponse(null, {
        success: false,
        statusCode: 400,
        message: 'interactionType is required'
      }));
    }

    const updated = await recordSuggestionInteractionService({
      logId,
      userId,
      interactionType,
      payload
    });

    return res.status(200).json(createApiResponse(
      { log: updated },
      'Interaction recorded'
    ));
  } catch (error) {
    logger.error('Failed to record suggestion interaction', {
      error: error.message,
      stack: error.stack
    });

    return res.status(503).json(createApiResponse(null, {
      success: false,
      statusCode: 503,
      message: 'Unable to record suggestion interaction at this time',
      metadata: { offline: true }
    }));
  }
};

export const getSuggestionLogs = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = Number(req.query.limit) || 25;

    if (!userId) {
      return res.status(400).json(createApiResponse(null, {
        success: false,
        statusCode: 400,
        message: 'userId is required'
      }));
    }

    const logs = await getSuggestionLogsService({ userId, limit });

    return res.status(200).json(createApiResponse(
      { logs, count: logs.length },
      'Suggestion logs retrieved'
    ));
  } catch (error) {
    logger.error('Failed to fetch suggestion logs', {
      error: error.message,
      stack: error.stack
    });

    return res.status(503).json(createApiResponse(
      { logs: [] },
      {
        success: false,
        statusCode: 503,
        message: 'Suggestion history is unavailable right now',
        metadata: { offline: true }
      }
    ));
  }
};

const fallbackChatResponse = (message) => ({
  reply: `Hi there! Live AI chat is temporarily offline, but here is an educational tip while you wait:\n\n${message}\n\nRemember, InvestX Labs shares knowledge for learning only—talk with a parent, guardian, or trusted adult before making financial moves.`,
  structuredData: {
    offline: true,
    model: 'fallback-teacher',
    tokens: { total: 0 }
  }
});

export const chat = async (req, res) => {
  const startTime = Date.now();
  const { message, userProfile, userId } = req.body || {};
  const cacheKey = getAICacheKey('chat', { message, userProfile, userId });

  if (!message || typeof message !== 'string') {
    logger.warn('Invalid message provided for chat', { ip: req.ip });
    return res.status(400).json(createApiResponse(null, {
      success: false,
      statusCode: 400,
      message: 'Message is required and must be a string'
    }));
  }

  if (!OPENROUTER_API_KEY) {
    return res.status(200).json(fallbackChatResponse(
      'Practice breaking your question into smaller pieces. Try writing what you know, what you are curious about, and how this knowledge helps your goals.'
    ));
  }

  // Check cache first (only for exact message matches)
  const cachedResponse = getCachedAIResponse(cacheKey);
  if (cachedResponse) {
    logger.debug('Serving cached chat response', { userId });
    return res.json(cachedResponse);
  }

  try {
    // Fetch enhanced user context if userId is provided
    let enhancedContext = '';
    if (userId) {
      try {
        const { fetchUserContext } = await import('../ai-system/suggestionEngine.js');
        const userContext = await fetchUserContext(userId);
        
        if (userContext.portfolioHistory) {
          const ph = userContext.portfolioHistory;
          enhancedContext = `\n\n**Portfolio Context:**
- Total Portfolio Value: $${ph.totalValue?.toLocaleString() || 0}
- Number of Holdings: ${ph.currentHoldings?.length || 0}
- Sectors: ${ph.sectors?.join(', ') || 'None yet'}
- Total Trades: ${ph.totalTrades || 0}
- Trading Activity Level: ${ph.tradingActivity > 0.5 ? 'Active' : ph.tradingActivity > 0.2 ? 'Moderate' : 'Beginner'}`;
        }
        
        if (userContext.learningProgress) {
          const lp = userContext.learningProgress;
          enhancedContext += `\n\n**Learning Progress:**
- Progress: ${lp.progress || 0}%
- Achievements Earned: ${lp.achievementsCount || 0}
- Recent Achievements: ${lp.recentAchievements?.map(a => a.badge_name).join(', ') || 'None yet'}`;
        }
      } catch (contextError) {
        logger.warn('Failed to fetch enhanced context for chat', { userId, error: contextError.message });
      }
    }

    // Make request with retry logic and timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await retryWithBackoff(async () => {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.APP_URL || 'http://localhost:3002',
          'X-Title': 'InvestX Labs - InvestIQ Chatbot'
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.1-70b-instruct',
          messages: [
            {
              role: 'system',
              content: `You are InvestIQ, an AI financial education assistant for teenagers (ages 13-18).

**User Profile:**
- Age: ${userProfile?.age || 16}
- Experience Level: ${userProfile?.experience_level || 'beginner'}
- Risk Tolerance: ${userProfile?.risk_tolerance || 'moderate'}
- Monthly Budget: $${userProfile?.budget || 'Not set'}
- Portfolio Value: $${userProfile?.portfolio_value || 0}
- Interests: ${userProfile?.interests?.join(', ') || 'General investing'}${enhancedContext}

**Your Role:**
- Educational guide, NOT a financial advisor
- Patient teacher who explains concepts clearly
- Encouraging mentor who builds confidence
- Safety-focused advocate for parental involvement

**Communication Style:**
- Clear, conversational tone without being condescending
- Break complex topics into digestible chunks (2-3 paragraphs max)
- Use relatable analogies (gaming, social media, streaming services)
- Minimal emoji use (1-2 per response max) for emphasis only
- Structured formatting with headers and bullet points
- Always provide educational information, never specific financial advice
- Reference the user's portfolio context when relevant to make explanations more personalized

**Important:**
- Always mention consulting parents/guardians for users under 18
- Emphasize that this is educational information, not financial advice
- Encourage learning before investing
- Provide age-appropriate examples and platform recommendations`
            },
            { role: 'user', content: message }
          ],
          temperature: 0.7,
          max_tokens: 1000
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`AI API error: ${response.status} - ${errorData}`);
      }

      return response;
    }, 3, 1000);

    clearTimeout(timeoutId);

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content ||
      'Sorry, I could not generate a response right now. Please try again later.';

    const chatResponse = {
      reply,
      structuredData: {
        model: data?.model,
        tokens: data?.usage
      }
    };

    // Cache the response
    setCachedAIResponse(cacheKey, chatResponse);

    const duration = Date.now() - startTime;
    logger.info('Chat response generated successfully', { userId, duration });

    return res.status(200).json(chatResponse);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('AI chat failure', {
      error: error.message,
      stack: error.stack,
      userId,
      duration,
      ip: req.ip,
      isTimeout: error.name === 'AbortError'
    });

    return res.status(200).json(fallbackChatResponse(
      'Try exploring a concept like compound interest or diversification. Write down what you discover and teach it to a friend or parent—it is a great way to test your understanding!'
    ));
  }
};

