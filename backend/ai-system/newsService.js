import fetch from 'node-fetch';
import logger from '../utils/logger.js';
import { exponentialBackoff } from './utils.js';
import { aiEngine } from './aiEngine.js';

const ALPHA_VANTAGE_URL = process.env.ALPHA_VANTAGE_BASE_URL || 'https://www.alphavantage.co/query';
const FINNHUB_URL = process.env.FINNHUB_BASE_URL || 'https://finnhub.io/api/v1/company-news';

const {
  ALPHA_VANTAGE_API_KEY,
  FINNHUB_API_KEY
} = process.env;

const DEFAULT_NEWS_LIMIT = 6;

const toDateString = (date) => {
  return date.toISOString().slice(0, 10);
};

const normalizeAlphaNews = (payload = {}, symbol) => {
  const rawItems = payload.feed || [];
  return rawItems
    .filter((item) => !!item.title)
    .slice(0, DEFAULT_NEWS_LIMIT)
    .map((item) => ({
      source: item.source || item.authors?.[0] || 'Unknown',
      headline: item.title,
      summary: item.summary || item.summary_short || '',
      url: item.url,
      publishedAt: item.time_published
        ? new Date(
            item.time_published.slice(0, 4),
            Number(item.time_published.slice(4, 6)) - 1,
            item.time_published.slice(6, 8),
            item.time_published.slice(9, 11) || 0,
            item.time_published.slice(11, 13) || 0
          ).toISOString()
        : new Date().toISOString(),
      sentiment: Number(item.overall_sentiment_score) || 0,
      symbol
    }));
};

const normalizeFinnhubNews = (payload = [], symbol) => {
  return payload
    .filter((item) => !!item.headline)
    .slice(0, DEFAULT_NEWS_LIMIT)
    .map((item) => ({
      source: item.source || 'Finnhub',
      headline: item.headline,
      summary: item.summary || '',
      url: item.url,
      publishedAt: item.datetime ? new Date(item.datetime * 1000).toISOString() : new Date().toISOString(),
      sentiment: typeof item.sentiment === 'number' ? item.sentiment : 0,
      symbol
    }));
};

export async function fetchSymbolNews(symbol, options = {}) {
  const { limit = DEFAULT_NEWS_LIMIT, lookbackDays = 5 } = options;
  const upperSymbol = (symbol || '').toUpperCase();

  if (!upperSymbol) {
    return [];
  }

  const logContext = { symbol: upperSymbol, limit, lookbackDays };

  // Try Alpha Vantage first (NEWS_SENTIMENT endpoint)
  if (ALPHA_VANTAGE_API_KEY) {
    try {
      const params = new URLSearchParams({
        function: 'NEWS_SENTIMENT',
        tickers: upperSymbol,
        sort: 'LATEST',
        topics: 'technology,earnings,financial_markets',
        apikey: ALPHA_VANTAGE_API_KEY
      });

      const payload = await exponentialBackoff(async () => {
        const res = await fetch(`${ALPHA_VANTAGE_URL}?${params.toString()}`);
        if (!res.ok) {
          const err = new Error(`Alpha Vantage news error ${res.status}`);
          err.status = res.status;
          throw err;
        }
        return res.json();
      }, 2, 750);

      const normalized = normalizeAlphaNews(payload, upperSymbol).slice(0, limit);
      if (normalized.length) {
        logger.debug('Fetched news from Alpha Vantage', { ...logContext, provider: 'alpha_vantage' });
        return normalized;
      }
    } catch (error) {
      logger.warn('Alpha Vantage news fetch failed, falling back to Finnhub', {
        ...logContext,
        error: error.message
      });
    }
  }

  // Fallback to Finnhub if configured
  if (FINNHUB_API_KEY) {
    try {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - lookbackDays);

      const params = new URLSearchParams({
        symbol: upperSymbol,
        from: toDateString(from),
        to: toDateString(to),
        token: FINNHUB_API_KEY
      });

      const payload = await exponentialBackoff(async () => {
        const res = await fetch(`${FINNHUB_URL}?${params.toString()}`);
        if (!res.ok) {
          const err = new Error(`Finnhub news error ${res.status}`);
          err.status = res.status;
          throw err;
        }
        return res.json();
      }, 2, 750);

      const normalized = normalizeFinnhubNews(payload, upperSymbol).slice(0, limit);
      if (normalized.length) {
        logger.debug('Fetched news from Finnhub', { ...logContext, provider: 'finnhub' });
        return normalized;
      }
    } catch (error) {
      logger.warn('Finnhub news fetch failed', {
        ...logContext,
        error: error.message
      });
    }
  }

  logger.info('No news providers succeeded, returning empty list', logContext);
  return [];
}

export async function summarizeHeadlines(headlines, context = {}) {
  if (!Array.isArray(headlines) || headlines.length === 0) {
    return {
      summary: 'No recent news headlines were available for this asset.',
      sentiment: 0
    };
  }

  const joinedHeadlines = headlines.slice(0, DEFAULT_NEWS_LIMIT)
    .map((item) => `• ${item.headline} (${item.source})`)
    .join('\n');

  const prompt = `
You are an investment education assistant. Summarize the following headlines for a student investor in 2 sentences or fewer. 
Emphasize why the news matters for their learning journey and note overall sentiment (positive, neutral, negative).

User profile: ${JSON.stringify(context.profile || {}, null, 2)}

Headlines:
${joinedHeadlines}

Respond in JSON with keys: summary (string), sentimentLabel (positive|neutral|negative), sentimentScore (between -1 and 1).
  `.trim();

  try {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OpenRouter key missing');
    }

    const result = await aiEngine.generateResponse(
      [
        { role: 'system', content: 'You are a helpful investment educator for teenage students.' },
        { role: 'user', content: prompt }
      ],
      { temperature: 0.4, maxTokens: 220 }
    );

    const parsed = JSON.parse(result);
    return {
      summary: parsed.summary || result,
      sentimentLabel: parsed.sentimentLabel || 'neutral',
      sentiment: typeof parsed.sentimentScore === 'number' ? parsed.sentimentScore : 0
    };
  } catch (error) {
    logger.warn('AI news summarization failed, using deterministic fallback', {
      error: error.message
    });

    const positiveCount = headlines.filter((item) => item.sentiment > 0).length;
    const negativeCount = headlines.filter((item) => item.sentiment < 0).length;
    const sentimentScore = headlines.reduce((sum, item) => sum + (item.sentiment || 0), 0) / headlines.length || 0;

    const sentimentLabel = sentimentScore > 0.1
      ? 'positive'
      : sentimentScore < -0.1
      ? 'negative'
      : 'neutral';

    const fallbackSummary = `Recent headlines for ${context?.symbol || 'this asset'} are mostly ${sentimentLabel}. ` +
      `Positive highlights: ${positiveCount}. Watch-outs: ${negativeCount}. Continue practicing critical reading of sources.`;

    return {
      summary: fallbackSummary,
      sentimentLabel,
      sentiment: Number(sentimentScore.toFixed(2))
    };
  }
}

