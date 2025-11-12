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

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_KEY || process.env.ALPHAVANTAGE_API_KEY;

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
      ALPHA_VANTAGE_KEY: Boolean(ALPHA_VANTAGE_KEY)
    }
  });
};

export const generateSuggestions = async (req, res) => {
  try {
    const { userId, profile = {}, options = {} } = req.body || {};

    if (!userId) {
      return res.status(400).json(createApiResponse(null, {
        success: false,
        statusCode: 400,
        message: 'userId is required to generate AI suggestions'
      }));
    }

    const { suggestions } = await generateSuggestionsService({
      userId,
      profile,
      requestedCount: options?.count
    });

    return res.status(200).json(createApiResponse(
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
    ));
  } catch (error) {
    logger.error('Failed to generate AI suggestions', {
      error: error.message,
      stack: error.stack
    });

    return res.status(503).json(buildEducationalFallback(
      'Live AI suggestions are temporarily unavailable. Showing an educational set instead.'
    ));
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
  const { message, userProfile } = req.body || {};

  if (!message || typeof message !== 'string') {
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

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
- Interests: ${userProfile?.interests?.join(', ') || 'General investing'}

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
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`AI API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content ||
      'Sorry, I could not generate a response right now. Please try again later.';

    return res.status(200).json({
      reply,
      structuredData: {
        model: data?.model,
        tokens: data?.usage
      }
    });
  } catch (error) {
    logger.error('AI chat failure', {
      error: error.message,
      stack: error.stack
    });

    return res.status(200).json(fallbackChatResponse(
      'Try exploring a concept like compound interest or diversification. Write down what you discover and teach it to a friend or parent—it is a great way to test your understanding!'
    ));
  }
};

