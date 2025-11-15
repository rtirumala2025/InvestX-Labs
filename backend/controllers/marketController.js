import {
  dataInsights,
  createApiResponse,
  logger
} from '../ai-system/index.js';

const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_KEY || process.env.ALPHAVANTAGE_API_KEY;

const ensureAlphaVantage = () => {
  if (!ALPHA_VANTAGE_KEY) {
    const error = new Error('Alpha Vantage API key is not configured.');
    error.code = 'ALPHA_VANTAGE_MISSING';
    throw error;
  }
};

export const getQuote = async (req, res) => {
  try {
    const { symbol } = req.params;

    if (!symbol) {
      return res.status(400).json(createApiResponse(
        null,
        'Stock symbol is required',
        false,
        400
      ));
    }

    ensureAlphaVantage();

    const quote = await dataInsights.getStockQuote(symbol);

    if (!quote || !quote['05. price']) {
      return res.status(404).json(createApiResponse(
        null,
        `No data found for symbol: ${symbol}`,
        false,
        404
      ));
    }

    const response = createApiResponse({
      symbol: symbol.toUpperCase(),
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

    return res.json(response);
  } catch (error) {
    logger.error('Error fetching stock quote:', error);
    return res.status(error.code === 'ALPHA_VANTAGE_MISSING' ? 503 : 500).json(createApiResponse(
      null,
      error.code === 'ALPHA_VANTAGE_MISSING'
        ? 'Live market data is unavailable without a configured Alpha Vantage API key. Showing cached values if available.'
        : 'Failed to fetch stock quote',
      false,
      error.code === 'ALPHA_VANTAGE_MISSING' ? 503 : 500
    ));
  }
};

export const getCompanyOverview = async (req, res) => {
  try {
    const { symbol } = req.params;

    if (!symbol) {
      return res.status(400).json(createApiResponse(
        null,
        'Stock symbol is required',
        false,
        400
      ));
    }

    ensureAlphaVantage();

    const overview = await dataInsights.getCompanyOverview(symbol);

    if (!overview || !overview.Symbol) {
      return res.status(404).json(createApiResponse(
        null,
        `No company data found for symbol: ${symbol}`,
        false,
        404
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

    return res.json(response);
  } catch (error) {
    logger.error('Error fetching company data:', error);
    return res.status(error.code === 'ALPHA_VANTAGE_MISSING' ? 503 : 500).json(createApiResponse(
      null,
      error.code === 'ALPHA_VANTAGE_MISSING'
        ? 'Company fundamentals are unavailable because the Alpha Vantage key is missing.'
        : 'Failed to fetch company data',
      false,
      error.code === 'ALPHA_VANTAGE_MISSING' ? 503 : 500
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
      source: ALPHA_VANTAGE_KEY ? 'alpha-vantage' : 'offline-mock'
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
  try {
    const { symbol } = req.params;
    const { interval = 'daily', outputsize = 'compact' } = req.query;

    if (!symbol) {
      return res.status(400).json(createApiResponse(
        null,
        'Stock symbol is required',
        false,
        400
      ));
    }

    ensureAlphaVantage();

    const timeSeries = await dataInsights.getTimeSeries(symbol, interval, outputsize === 'full');

    if (!timeSeries) {
      return res.status(404).json(createApiResponse(
        null,
        `No historical data found for symbol: ${symbol}`,
        false,
        404
      ));
    }

    const response = createApiResponse({
      symbol: symbol.toUpperCase(),
      interval,
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

    return res.json(response);
  } catch (error) {
    logger.error('Error fetching historical data:', error);
    return res.status(error.code === 'ALPHA_VANTAGE_MISSING' ? 503 : 500).json(createApiResponse(
      null,
      error.code === 'ALPHA_VANTAGE_MISSING'
        ? 'Historical prices are unavailable because the Alpha Vantage key is missing.'
        : 'Failed to fetch historical data',
      false,
      error.code === 'ALPHA_VANTAGE_MISSING' ? 503 : 500
    ));
  }
};

