const axios = require('axios');
const { getRateLimiter } = require('../utils/alphaVantageRateLimiter');

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const ALPHA_VANTAGE_BASE_URL = process.env.ALPHA_VANTAGE_BASE_URL || 'https://www.alphavantage.co/query';

if (!ALPHA_VANTAGE_API_KEY) {
  console.warn('[MarketService] ALPHA_VANTAGE_API_KEY not configured. Market data features will be limited.');
}

// Initialize rate limiter
const rateLimiter = getRateLimiter({
  maxCallsPerMinute: 5,
  maxCallsPerDay: 500,
  initialDelay: 1000,
  maxDelay: 60000,
  maxRetries: 3
});

// Cache for storing market data
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get stock quote data from Alpha Vantage API
 * @param {string} symbol - Stock symbol (e.g., 'AAPL')
 * @returns {Promise<Object>} Stock quote data
 */
async function getStockQuote(symbol) {
  const cacheKey = `quote_${symbol}`;
  const cached = cache.get(cacheKey);
  
  // Return cached data if it's still valid
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return cached.data;
  }

  if (!ALPHA_VANTAGE_API_KEY) {
    throw new Error('Alpha Vantage API key not configured');
  }

  try {
    // Use rate limiter to queue the request
    const response = await rateLimiter.request(async () => {
      return await axios.get(ALPHA_VANTAGE_BASE_URL, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: symbol,
          apikey: ALPHA_VANTAGE_API_KEY
        }
      });
    });

    if (response.data['Global Quote']) {
      const quote = response.data['Global Quote'];
      const result = {
        symbol: symbol,
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        high: parseFloat(quote['03. high']),
        low: parseFloat(quote['04. low']),
        volume: parseInt(quote['06. volume']),
        latestTradingDay: quote['07. latest trading day'],
        previousClose: parseFloat(quote['08. previous close']),
        timestamp: new Date().toISOString()
      };

      // Update cache
      cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    }

    throw new Error('No quote data available');
  } catch (error) {
    console.error(`Error fetching stock quote for ${symbol}:`, error.message);
    throw new Error(`Failed to fetch stock data for ${symbol}`);
  }
}

/**
 * Get market news
 * @returns {Promise<Array>} Array of news articles
 */
async function getMarketNews() {
  const cacheKey = 'market_news';
  const cached = cache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return cached.data;
  }

  if (!ALPHA_VANTAGE_API_KEY) {
    console.warn('[MarketService] Alpha Vantage API key not configured, returning mock news');
    return getMockNews();
  }

  try {
    // Use rate limiter to queue the request
    const response = await rateLimiter.request(async () => {
      return await axios.get(ALPHA_VANTAGE_BASE_URL, {
        params: {
          function: 'NEWS_SENTIMENT',
          topics: 'technology,finance',
          apikey: ALPHA_VANTAGE_API_KEY,
          limit: 10 // Limit to 10 news items
        }
      });
    });

    if (response.data.feed) {
      const news = response.data.feed.map(article => ({
        title: article.title,
        url: article.url,
        source: article.source,
        summary: article.summary,
        bannerImage: article.banner_image,
        timePublished: article.time_published,
        authors: article.authors,
        overallSentiment: article.overall_sentiment_label,
        tickerSentiment: article.ticker_sentiment?.map(t => ({
          ticker: t.ticker,
          relevanceScore: parseFloat(t.relevance_score),
          sentimentScore: parseFloat(t.ticker_sentiment_score),
          sentimentLabel: t.ticker_sentiment_label
        }))
      }));

      // Update cache
      cache.set(cacheKey, {
        data: news,
        timestamp: Date.now()
      });

      return news;
    }

    throw new Error('No news data available');
  } catch (error) {
    console.error('Error fetching market news:', error.message);
    // Return mock data if API fails
    return getMockNews();
  }
}

/**
 * Get mock news data (fallback)
 */
function getMockNews() {
  return [
    {
      title: 'Market Update: Tech Stocks Rally',
      summary: 'Technology stocks showed strong performance today with major gains across the sector.',
      source: 'Financial Times',
      timePublished: new Date().toISOString(),
      url: '#'
    },
    {
      title: 'Federal Reserve Holds Interest Rates Steady',
      summary: 'The Federal Reserve announced it will keep interest rates unchanged in its latest policy meeting.',
      source: 'Wall Street Journal',
      timePublished: new Date().toISOString(),
      url: '#'
    }
  ];
}

module.exports = {
  getStockQuote,
  getMarketNews,
  getRateLimiterStatus: () => rateLimiter.getStatus()
};
