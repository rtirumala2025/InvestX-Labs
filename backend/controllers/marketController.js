import {
  dataInsights,
  createApiResponse,
  logger
} from '../ai-system/index.js';

// Standardized environment variable name
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

// In-memory cache for API responses (60 seconds TTL)
const responseCache = new Map();
const CACHE_TTL = 60 * 1000; // 60 seconds

const getCacheKey = (endpoint, params) => {
  return `${endpoint}:${JSON.stringify(params)}`;
};

const getCachedResponse = (cacheKey) => {
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  responseCache.delete(cacheKey);
  return null;
};

const setCachedResponse = (cacheKey, data) => {
  responseCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
};

// Clean up expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of responseCache.entries()) {
    if (now - value.timestamp >= CACHE_TTL) {
      responseCache.delete(key);
    }
  }
}, 60000); // Run cleanup every minute

const ensureAlphaVantage = () => {
  if (!ALPHA_VANTAGE_API_KEY) {
    const error = new Error('Alpha Vantage API key is not configured.');
    error.code = 'ALPHA_VANTAGE_MISSING';
    throw error;
  }
};

export const getQuote = async (req, res) => {
  const startTime = Date.now();
  const { symbol } = req.params;
  const cacheKey = getCacheKey('quote', { symbol });

  try {
    // Input validation
    if (!symbol || typeof symbol !== 'string' || symbol.trim().length === 0) {
      logger.warn('Invalid symbol provided', { symbol, ip: req.ip });
      return res.status(400).json(createApiResponse(
        null,
        {
          success: false,
          statusCode: 400,
          message: 'Stock symbol is required and must be a valid string',
          error: 'INVALID_SYMBOL'
        }
      ));
    }

    const normalizedSymbol = symbol.trim().toUpperCase();

    // Check cache first
    const cachedResponse = getCachedResponse(cacheKey);
    if (cachedResponse) {
      logger.debug('Serving cached quote', { symbol: normalizedSymbol, cacheKey });
      return res.json(cachedResponse);
    }

    // Validate API key
    if (!ALPHA_VANTAGE_API_KEY) {
      logger.error('Alpha Vantage API key missing', { symbol: normalizedSymbol });
      return res.status(503).json(createApiResponse(
        null,
        {
          success: false,
          statusCode: 503,
          message: 'Live market data is unavailable without a configured Alpha Vantage API key. Showing cached values if available.',
          error: 'ALPHA_VANTAGE_MISSING'
        }
      ));
    }

    // Fetch quote
    const quote = await dataInsights.getStockQuote(normalizedSymbol);

    if (!quote || !quote['05. price']) {
      logger.warn('No data found for symbol', { symbol: normalizedSymbol });
      return res.status(404).json(createApiResponse(
        null,
        {
          success: false,
          statusCode: 404,
          message: `No data found for symbol: ${normalizedSymbol}`,
          error: 'SYMBOL_NOT_FOUND'
        }
      ));
    }

    const response = createApiResponse({
      symbol: normalizedSymbol,
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
      open: parseFloat(quote['02. open']),
      high: parseFloat(quote['03. high']),
      low: parseFloat(quote['04. low']),
      volume: parseInt(quote['06. volume'], 10),
      latestTradingDay: quote['07. latest trading day'],
      previousClose: parseFloat(quote['08. previous close']),
      timestamp: new Date().toISOString()
    }, 'Quote retrieved successfully');

    // Cache the response
    setCachedResponse(cacheKey, response);

    const duration = Date.now() - startTime;
    logger.info('Quote fetched successfully', { symbol: normalizedSymbol, duration });

    return res.json(response);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error fetching stock quote', {
      error: error.message,
      stack: error.stack,
      symbol,
      duration,
      code: error.code,
      ip: req.ip
    });

    const statusCode = error.code === 'ALPHA_VANTAGE_MISSING' ? 503 : 
                      error.message?.includes('rate limit') ? 429 : 500;

    return res.status(statusCode).json(createApiResponse(
      null,
      {
        success: false,
        statusCode,
        message: error.code === 'ALPHA_VANTAGE_MISSING'
          ? 'Live market data is unavailable without a configured Alpha Vantage API key.'
          : error.message?.includes('rate limit')
          ? 'API rate limit exceeded. Please try again later.'
          : 'Failed to fetch stock quote. Please try again later.',
        error: error.code || 'INTERNAL_ERROR'
      }
    ));
  }
};

export const getCompanyOverview = async (req, res) => {
  const startTime = Date.now();
  const { symbol } = req.params;
  const cacheKey = getCacheKey('company', { symbol });

  try {
    // Input validation
    if (!symbol || typeof symbol !== 'string' || symbol.trim().length === 0) {
      logger.warn('Invalid symbol provided for company overview', { symbol, ip: req.ip });
      return res.status(400).json(createApiResponse(
        null,
        {
          success: false,
          statusCode: 400,
          message: 'Stock symbol is required and must be a valid string',
          error: 'INVALID_SYMBOL'
        }
      ));
    }

    const normalizedSymbol = symbol.trim().toUpperCase();

    // Check cache first
    const cachedResponse = getCachedResponse(cacheKey);
    if (cachedResponse) {
      logger.debug('Serving cached company overview', { symbol: normalizedSymbol });
      return res.json(cachedResponse);
    }

    // Validate API key
    if (!ALPHA_VANTAGE_API_KEY) {
      logger.error('Alpha Vantage API key missing for company overview', { symbol: normalizedSymbol });
      return res.status(503).json(createApiResponse(
        null,
        {
          success: false,
          statusCode: 503,
          message: 'Company fundamentals are unavailable because the Alpha Vantage API key is missing.',
          error: 'ALPHA_VANTAGE_MISSING'
        }
      ));
    }

    // Fetch overview
    const overview = await dataInsights.getCompanyOverview(normalizedSymbol);

    if (!overview || !overview.Symbol) {
      logger.warn('No company data found', { symbol: normalizedSymbol });
      return res.status(404).json(createApiResponse(
        null,
        {
          success: false,
          statusCode: 404,
          message: `No company data found for symbol: ${normalizedSymbol}`,
          error: 'COMPANY_NOT_FOUND'
        }
      ));
    }

    const response = createApiResponse({
      symbol: overview.Symbol,
      name: overview.Name,
      description: overview.Description,
      sector: overview.Sector,
      industry: overview.Industry,
      address: overview.Address,
      marketCap: parseFloat(overview.MarketCapitalization) || 0,
      peRatio: parseFloat(overview.PERatio) || 0,
      pegRatio: parseFloat(overview.PEGRatio) || 0,
      dividendYield: parseFloat(overview.DividendYield) || 0,
      beta: parseFloat(overview.Beta) || 0,
      fiftyTwoWeekHigh: parseFloat(overview['52WeekHigh']) || 0,
      fiftyTwoWeekLow: parseFloat(overview['52WeekLow']) || 0,
      financials: {
        revenue: parseFloat(overview.RevenueTTM) || 0,
        profitMargin: parseFloat(overview.ProfitMargin) || 0,
        ebitda: parseFloat(overview.EBITDA) || 0,
        eps: parseFloat(overview.EPS) || 0,
        peRatio: parseFloat(overview.PERatio) || 0,
        pegRatio: parseFloat(overview.PEGRatio) || 0,
        priceToBook: parseFloat(overview.PriceToBookRatio) || 0,
        dividendPerShare: parseFloat(overview.DividendPerShare) || 0,
        dividendYield: parseFloat(overview.DividendYield) || 0,
        payoutRatio: parseFloat(overview.PayoutRatio) || 0
      },
      lastUpdated: new Date().toISOString()
    }, 'Company data retrieved successfully');

    // Cache the response
    setCachedResponse(cacheKey, response);

    const duration = Date.now() - startTime;
    logger.info('Company overview fetched successfully', { symbol: normalizedSymbol, duration });

    return res.json(response);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error fetching company data', {
      error: error.message,
      stack: error.stack,
      symbol,
      duration,
      code: error.code,
      ip: req.ip
    });

    const statusCode = error.code === 'ALPHA_VANTAGE_MISSING' ? 503 : 
                      error.message?.includes('rate limit') ? 429 : 500;

    return res.status(statusCode).json(createApiResponse(
      null,
      {
        success: false,
        statusCode,
        message: error.code === 'ALPHA_VANTAGE_MISSING'
          ? 'Company fundamentals are unavailable because the Alpha Vantage API key is missing.'
          : error.message?.includes('rate limit')
          ? 'API rate limit exceeded. Please try again later.'
          : 'Failed to fetch company data. Please try again later.',
        error: error.code || 'INTERNAL_ERROR'
      }
    ));
  }
};

export const searchSymbols = async (req, res) => {
  try {
    const { keywords } = req.query;

    if (!keywords) {
      return res.status(400).json(createApiResponse(
        null,
        'Search keywords are required',
        false,
        400
      ));
    }

    const mockResults = [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        type: 'Equity',
        region: 'United States',
        currency: 'USD'
      },
      {
        symbol: 'APLE',
        name: 'Apple Hospitality REIT, Inc.',
        type: 'REIT',
        region: 'United States',
        currency: 'USD'
      }
    ];

    const searchTerm = keywords.toLowerCase();
    const results = mockResults.filter(item =>
      item.symbol.toLowerCase().includes(searchTerm) ||
      item.name.toLowerCase().includes(searchTerm)
    );

    const response = createApiResponse({
      query: keywords,
      count: results.length,
      results,
      timestamp: new Date().toISOString(),
      source: ALPHA_VANTAGE_API_KEY ? 'alpha-vantage' : 'offline-mock'
    }, 'Search completed successfully');

    return res.json(response);
  } catch (error) {
    logger.error('Error performing search:', error);
    return res.status(500).json(createApiResponse(
      null,
      'Failed to perform search',
      false,
      500
    ));
  }
};

export const getHistoricalData = async (req, res) => {
  const startTime = Date.now();
  const { symbol } = req.params;
  const { interval = 'daily', outputsize = 'compact' } = req.query;
  const cacheKey = getCacheKey('historical', { symbol, interval, outputsize });

  try {
    // Input validation
    if (!symbol || typeof symbol !== 'string' || symbol.trim().length === 0) {
      logger.warn('Invalid symbol provided for historical data', { symbol, ip: req.ip });
      return res.status(400).json(createApiResponse(
        null,
        {
          success: false,
          statusCode: 400,
          message: 'Stock symbol is required and must be a valid string',
          error: 'INVALID_SYMBOL'
        }
      ));
    }

    const normalizedSymbol = symbol.trim().toUpperCase();
    const validIntervals = ['daily', 'weekly', 'monthly', 'intraday'];
    const normalizedInterval = interval.toLowerCase();
    
    if (!validIntervals.includes(normalizedInterval)) {
      logger.warn('Invalid interval provided', { interval, ip: req.ip });
      return res.status(400).json(createApiResponse(
        null,
        {
          success: false,
          statusCode: 400,
          message: `Invalid interval. Must be one of: ${validIntervals.join(', ')}`,
          error: 'INVALID_INTERVAL'
        }
      ));
    }

    // Check cache first
    const cachedResponse = getCachedResponse(cacheKey);
    if (cachedResponse) {
      logger.debug('Serving cached historical data', { symbol: normalizedSymbol, interval: normalizedInterval });
      return res.json(cachedResponse);
    }

    // Validate API key
    if (!ALPHA_VANTAGE_API_KEY) {
      logger.error('Alpha Vantage API key missing for historical data', { symbol: normalizedSymbol });
      return res.status(503).json(createApiResponse(
        null,
        {
          success: false,
          statusCode: 503,
          message: 'Historical prices are unavailable because the Alpha Vantage API key is missing.',
          error: 'ALPHA_VANTAGE_MISSING'
        }
      ));
    }

    // Fetch historical data
    const timeSeries = await dataInsights.getTimeSeries(normalizedSymbol, normalizedInterval, outputsize === 'full');

    if (!timeSeries || Object.keys(timeSeries).length === 0) {
      logger.warn('No historical data found', { symbol: normalizedSymbol, interval: normalizedInterval });
      return res.status(404).json(createApiResponse(
        null,
        {
          success: false,
          statusCode: 404,
          message: `No historical data found for symbol: ${normalizedSymbol}`,
          error: 'HISTORICAL_DATA_NOT_FOUND'
        }
      ));
    }

    const response = createApiResponse({
      symbol: normalizedSymbol,
      interval: normalizedInterval,
      outputsize,
      dataPoints: Object.entries(timeSeries).map(([date, data]) => ({
        date,
        open: parseFloat(data['1. open']),
        high: parseFloat(data['2. high']),
        low: parseFloat(data['3. low']),
        close: parseFloat(data['4. close']),
        volume: parseInt(data['5. volume'], 10)
      })),
      lastUpdated: new Date().toISOString()
    }, 'Historical data retrieved successfully');

    // Cache the response
    setCachedResponse(cacheKey, response);

    const duration = Date.now() - startTime;
    logger.info('Historical data fetched successfully', { 
      symbol: normalizedSymbol, 
      interval: normalizedInterval,
      dataPoints: Object.keys(timeSeries).length,
      duration 
    });

    return res.json(response);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error fetching historical data', {
      error: error.message,
      stack: error.stack,
      symbol,
      interval,
      duration,
      code: error.code,
      ip: req.ip
    });

    const statusCode = error.code === 'ALPHA_VANTAGE_MISSING' ? 503 : 
                      error.message?.includes('rate limit') ? 429 : 500;

    return res.status(statusCode).json(createApiResponse(
      null,
      {
        success: false,
        statusCode,
        message: error.code === 'ALPHA_VANTAGE_MISSING'
          ? 'Historical prices are unavailable because the Alpha Vantage API key is missing.'
          : error.message?.includes('rate limit')
          ? 'API rate limit exceeded. Please try again later.'
          : 'Failed to fetch historical data. Please try again later.',
        error: error.code || 'INTERNAL_ERROR'
      }
    ));
  }
};

