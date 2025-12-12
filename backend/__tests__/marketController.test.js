/**
 * Market Controller Tests
 * 
 * Tests for market data endpoints:
 * - Stock quotes
 * - Company overviews
 * - Symbol search
 * - Historical data
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { getQuote, getCompanyOverview, searchSymbols, getHistoricalData } from '../controllers/marketController.js';
import * as dataInsights from '../ai-system/dataInsights.js';

// Mock dependencies
jest.mock('../ai-system/dataInsights.js');
jest.mock('../ai-system/index.js', () => ({
  createApiResponse: (data, message) => ({
    success: true,
    data,
    message: message || 'Success',
    timestamp: new Date().toISOString()
  }),
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

describe('Market Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {},
      query: {},
      ip: '127.0.0.1'
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getQuote', () => {
    it('should return stock quote for valid symbol', async () => {
      req.params.symbol = 'AAPL';
      const mockQuote = {
        '05. price': '150.00',
        '09. change': '2.50',
        '10. change percent': '1.69%',
        '02. open': '148.00',
        '03. high': '151.00',
        '04. low': '147.50',
        '06. volume': '50000000',
        '07. latest trading day': '2024-01-15',
        '08. previous close': '147.50'
      };

      dataInsights.getStockQuote = jest.fn().mockResolvedValue(mockQuote);

      await getQuote(req, res);

      expect(res.json).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid symbol', async () => {
      req.params.symbol = '';

      await getQuote(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
    });

    it('should return 404 for non-existent symbol', async () => {
      req.params.symbol = 'INVALID';
      dataInsights.getStockQuote = jest.fn().mockResolvedValue(null);

      await getQuote(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle API errors gracefully', async () => {
      req.params.symbol = 'AAPL';
      dataInsights.getStockQuote = jest.fn().mockRejectedValue(new Error('API Error'));

      await getQuote(req, res);

      expect(res.status).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('getCompanyOverview', () => {
    it('should return company overview for valid symbol', async () => {
      req.params.symbol = 'AAPL';
      const mockOverview = {
        Symbol: 'AAPL',
        Name: 'Apple Inc.',
        Description: 'Technology company',
        Sector: 'Technology',
        Industry: 'Consumer Electronics',
        MarketCapitalization: '3000000000000',
        PERatio: '30.5'
      };

      dataInsights.getCompanyOverview = jest.fn().mockResolvedValue(mockOverview);

      await getCompanyOverview(req, res);

      expect(res.json).toHaveBeenCalled();
    });

    it('should return 400 for invalid symbol', async () => {
      req.params.symbol = '';

      await getCompanyOverview(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('searchSymbols', () => {
    it('should return search results for valid keywords', async () => {
      req.query.keywords = 'Apple';

      await searchSymbols(req, res);

      expect(res.json).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 400 when keywords are missing', async () => {
      req.query.keywords = undefined;

      await searchSymbols(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getHistoricalData', () => {
    it('should return historical data for valid symbol', async () => {
      req.params.symbol = 'AAPL';
      req.query.interval = 'daily';
      const mockTimeSeries = {
        '2024-01-15': {
          '1. open': '150.00',
          '2. high': '151.00',
          '3. low': '149.00',
          '4. close': '150.50',
          '5. volume': '50000000'
        }
      };

      dataInsights.getTimeSeries = jest.fn().mockResolvedValue(mockTimeSeries);

      await getHistoricalData(req, res);

      expect(res.json).toHaveBeenCalled();
    });

    it('should return 400 for invalid interval', async () => {
      req.params.symbol = 'AAPL';
      req.query.interval = 'invalid';

      await getHistoricalData(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
