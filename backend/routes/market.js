import express from 'express';
import { dataInsights } from '../ai-services/dataInsights.js';
import { createApiResponse } from '../ai-services/utils.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * @swagger
 * /api/market/quote/{symbol}:
 *   get:
 *     summary: Get current quote for a stock symbol
 *     description: Retrieves the latest price and trading information for a given stock symbol
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *         description: Stock symbol (e.g., AAPL, MSFT)
 *     responses:
 *       200:
 *         description: Successful response with stock quote
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 statusCode:
 *                   type: number
 *                 data:
 *                   type: object
 *                   properties:
 *                     symbol:
 *                       type: string
 *                     price:
 *                       type: number
 *                     change:
 *                       type: number
 *                     changePercent:
 *                       type: number
 *                     timestamp:
 *                       type: string
 *       400:
 *         description: Invalid symbol
 *       404:
 *         description: Symbol not found
 *       500:
 *         description: Server error
 */
router.get('/quote/:symbol', async (req, res) => {
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

    // Get stock quote from Alpha Vantage
    const quote = await dataInsights.getStockQuote(symbol);
    
    if (!quote || !quote['05. price']) {
      return res.status(404).json(createApiResponse(
        null,
        `No data found for symbol: ${symbol}`,
        false,
        404
      ));
    }

    // Format the response
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

    res.json(response);
  } catch (error) {
    logger.error('Error fetching stock quote:', error);
    res.status(500).json(createApiResponse(
      null,
      'Failed to fetch stock quote',
      false,
      500
    ));
  }
});

/**
 * @swagger
 * /api/market/company/{symbol}:
 *   get:
 *     summary: Get company overview and fundamentals
 *     description: Retrieves detailed company information and financial metrics
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *         description: Stock symbol (e.g., AAPL, MSFT)
 *     responses:
 *       200:
 *         description: Successful response with company data
 *       400:
 *         description: Invalid symbol
 *       404:
 *         description: Company not found
 *       500:
 *         description: Server error
 */
router.get('/company/:symbol', async (req, res) => {
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

    // Get company overview from Alpha Vantage
    const overview = await dataInsights.getCompanyOverview(symbol);
    
    if (!overview || !overview.Symbol) {
      return res.status(404).json(createApiResponse(
        null,
        `No company data found for symbol: ${symbol}`,
        false,
        404
      ));
    }

    // Format the response
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
        payoutRatio: parseFloat(overview.PayoutRatio) || 0,
      },
      lastUpdated: new Date().toISOString()
    }, 'Company data retrieved successfully');

    res.json(response);
  } catch (error) {
    logger.error('Error fetching company data:', error);
    res.status(500).json(createApiResponse(
      null,
      'Failed to fetch company data',
      false,
      500
    ));
  }
});

/**
 * @swagger
 * /api/market/search:
 *   get:
 *     summary: Search for stocks and other securities
 *     description: Search for stocks, ETFs, and other securities by keyword
 *     parameters:
 *       - in: query
 *         name: keywords
 *         required: true
 *         schema:
 *           type: string
 *         description: Search keywords (e.g., 'Apple' or 'AAPL')
 *     responses:
 *       200:
 *         description: Successful response with search results
 *       400:
 *         description: Missing or invalid search keywords
 *       500:
 *         description: Server error
 */
router.get('/search', async (req, res) => {
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

    // In a real implementation, this would use Alpha Vantage's search endpoint
    // For now, we'll return a mock response
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

    // Filter results based on keywords (case-insensitive)
    const searchTerm = keywords.toLowerCase();
    const results = mockResults.filter(item => 
      item.symbol.toLowerCase().includes(searchTerm) ||
      item.name.toLowerCase().includes(searchTerm)
    );

    const response = createApiResponse({
      query: keywords,
      count: results.length,
      results,
      timestamp: new Date().toISOString()
    }, 'Search completed successfully');

    res.json(response);
  } catch (error) {
    logger.error('Error performing search:', error);
    res.status(500).json(createApiResponse(
      null,
      'Failed to perform search',
      false,
      500
    ));
  }
});

/**
 * @swagger
 * /api/market/historical/{symbol}:
 *   get:
 *     summary: Get historical price data
 *     description: Retrieves historical price data for a given stock symbol
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *         description: Stock symbol (e.g., AAPL, MSFT)
 *       - in: query
 *         name: interval
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *           default: daily
 *         description: Time interval between data points
 *       - in: query
 *         name: outputsize
 *         schema:
 *           type: string
 *           enum: [compact, full]
 *           default: compact
 *         description: 'compact returns the latest 100 data points; full returns up to 20 years of data'
 *     responses:
 *       200:
 *         description: Successful response with historical data
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Server error
 */
router.get('/historical/:symbol', async (req, res) => {
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

    // Get historical data from Alpha Vantage
    const timeSeries = await dataInsights.getTimeSeries(symbol, interval, outputsize === 'full');
    
    if (!timeSeries) {
      return res.status(404).json(createApiResponse(
        null,
        `No historical data found for symbol: ${symbol}`,
        false,
        404
      ));
    }

    // Format the response
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

    res.json(response);
  } catch (error) {
    logger.error('Error fetching historical data:', error);
    res.status(500).json(createApiResponse(
      null,
      'Failed to fetch historical data',
      false,
      500
    ));
  }
});

export default router;
