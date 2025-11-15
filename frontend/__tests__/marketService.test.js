/**
 * Market Service Unit Tests
 * 
 * Tests the marketService.js implementation with mocked Supabase client
 * Run: npm run test:market
 */

import { jest } from '@jest/globals';

// Mock Supabase client before importing marketService
const mockRpc = jest.fn();
const mockSingle = jest.fn();
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();

jest.unstable_mockModule('../src/lib/supabaseClient.js', () => ({
  supabase: {
    rpc: mockRpc,
    from: mockFrom,
  },
}));

// Import after mocking
const { 
  getMarketData,
  getBatchMarketData,
  getMarketDataStats,
  isSymbolAllowed,
  getAllowedSymbols,
  testConnection,
  marketServiceUtils,
} = await import('../src/services/marketService.js');

describe('Market Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    mockRpc.mockReturnValue({ single: mockSingle });
    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ eq: mockEq, order: mockOrder });
    mockOrder.mockReturnValue({ eq: mockEq });
    
    // Clear cache
    marketServiceUtils.clearCache();
  });
  
  describe('getMarketData', () => {
    it('should fetch quote from Supabase', async () => {
      const mockQuote = {
        symbol: 'AAPL',
        price: 150.25,
        change: 2.50,
        percent_change: 1.69,
        volume: 50000000,
        last_updated: '2025-01-25T10:00:00Z',
        source: 'alpha_vantage',
      };
      
      mockSingle.mockResolvedValue({ data: mockQuote, error: null });
      
      const result = await getMarketData('AAPL', { useCache: false });
      
      expect(mockRpc).toHaveBeenCalledWith('get_real_quote', { p_symbol: 'AAPL' });
      expect(result).toEqual(mockQuote);
    });
    
    it('should normalize symbol to uppercase', async () => {
      const mockQuote = { symbol: 'AAPL', price: 150.25 };
      mockSingle.mockResolvedValue({ data: mockQuote, error: null });
      
      await getMarketData('aapl', { useCache: false });
      
      expect(mockRpc).toHaveBeenCalledWith('get_real_quote', { p_symbol: 'AAPL' });
    });
    
    it('should use cached data on second call', async () => {
      const mockQuote = { symbol: 'AAPL', price: 150.25 };
      mockSingle.mockResolvedValue({ data: mockQuote, error: null });
      
      // First call
      await getMarketData('AAPL', { useCache: true });
      expect(mockRpc).toHaveBeenCalledTimes(1);
      
      // Second call - should use cache
      await getMarketData('AAPL', { useCache: true });
      expect(mockRpc).toHaveBeenCalledTimes(1); // Still 1, not 2
    });
    
    it('should bypass cache when forceRefresh is true', async () => {
      const mockQuote = { symbol: 'AAPL', price: 150.25 };
      mockSingle.mockResolvedValue({ data: mockQuote, error: null });
      
      // First call
      await getMarketData('AAPL', { useCache: true });
      expect(mockRpc).toHaveBeenCalledTimes(1);
      
      // Second call with forceRefresh
      await getMarketData('AAPL', { useCache: true, forceRefresh: true });
      expect(mockRpc).toHaveBeenCalledTimes(2);
    });
    
    it('should return mock data on error in development', async () => {
      mockSingle.mockResolvedValue({ 
        data: null, 
        error: new Error('RPC not found') 
      });
      
      // Set NODE_ENV to development
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const result = await getMarketData('AAPL', { useCache: false });
      
      expect(result).toBeDefined();
      expect(result.symbol).toBe('AAPL');
      expect(result.source).toBe('mock');
      
      // Restore NODE_ENV
      process.env.NODE_ENV = originalEnv;
    });
    
    it('should throw error in production mode', async () => {
      mockSingle.mockResolvedValue({ 
        data: null, 
        error: new Error('RPC not found') 
      });
      
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      await expect(getMarketData('AAPL', { useCache: false }))
        .rejects.toThrow();
      
      process.env.NODE_ENV = originalEnv;
    });
  });
  
  describe('getBatchMarketData', () => {
    it('should fetch batch quotes from Supabase', async () => {
      const mockBatch = {
        quotes: [
          { symbol: 'AAPL', price: 150.25 },
          { symbol: 'MSFT', price: 380.50 },
          { symbol: 'GOOGL', price: 140.75 },
        ],
        count: 3,
        fetched_at: '2025-01-25T10:00:00Z',
      };
      
      mockSingle.mockResolvedValue({ data: mockBatch, error: null });
      
      const result = await getBatchMarketData(['AAPL', 'MSFT', 'GOOGL'], { useCache: false });
      
      expect(mockRpc).toHaveBeenCalledWith('get_batch_market_data', { 
        p_symbols: ['AAPL', 'MSFT', 'GOOGL'] 
      });
      expect(result).toEqual(mockBatch);
      expect(result.count).toBe(3);
    });
    
    it('should normalize symbols to uppercase', async () => {
      const mockBatch = { quotes: [], count: 0 };
      mockSingle.mockResolvedValue({ data: mockBatch, error: null });
      
      await getBatchMarketData(['aapl', 'msft'], { useCache: false });
      
      expect(mockRpc).toHaveBeenCalledWith('get_batch_market_data', { 
        p_symbols: ['AAPL', 'MSFT'] 
      });
    });
    
    it('should cache individual quotes from batch', async () => {
      const mockBatch = {
        quotes: [
          { symbol: 'AAPL', price: 150.25 },
          { symbol: 'MSFT', price: 380.50 },
        ],
        count: 2,
      };
      
      mockSingle.mockResolvedValue({ data: mockBatch, error: null });
      
      // Fetch batch
      await getBatchMarketData(['AAPL', 'MSFT'], { useCache: true });
      
      // Now fetch individual - should use cache
      mockSingle.mockClear();
      await getMarketData('AAPL', { useCache: true });
      
      // Should not call RPC again
      expect(mockRpc).not.toHaveBeenCalled();
    });
    
    it('should use cached batch data', async () => {
      const mockBatch = { quotes: [], count: 0 };
      mockSingle.mockResolvedValue({ data: mockBatch, error: null });
      
      // First call
      await getBatchMarketData(['AAPL', 'MSFT'], { useCache: true });
      expect(mockRpc).toHaveBeenCalledTimes(1);
      
      // Second call - should use cache
      await getBatchMarketData(['AAPL', 'MSFT'], { useCache: true });
      expect(mockRpc).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('getMarketDataStats', () => {
    it('should fetch cache statistics', async () => {
      const mockStats = {
        total_cached: 10,
        expired: 2,
        active: 8,
        oldest_cache: '2025-01-25T09:00:00Z',
        newest_cache: '2025-01-25T10:00:00Z',
      };
      
      mockSingle.mockResolvedValue({ data: mockStats, error: null });
      
      const result = await getMarketDataStats();
      
      expect(mockRpc).toHaveBeenCalledWith('get_market_data_stats');
      expect(result).toEqual(mockStats);
    });
  });
  
  describe('isSymbolAllowed', () => {
    it('should check if symbol is allowed', async () => {
      mockSingle.mockResolvedValue({ data: true, error: null });
      
      const result = await isSymbolAllowed('AAPL');
      
      expect(mockRpc).toHaveBeenCalledWith('is_symbol_allowed', { p_symbol: 'AAPL' });
      expect(result).toBe(true);
    });
    
    it('should return false on error', async () => {
      mockSingle.mockResolvedValue({ data: null, error: new Error('RPC error') });
      
      const result = await isSymbolAllowed('INVALID');
      
      expect(result).toBe(false);
    });
  });
  
  describe('getAllowedSymbols', () => {
    it('should fetch allowed symbols', async () => {
      const mockSymbols = [
        { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' },
        { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ' },
      ];
      
      mockOrder.mockResolvedValue({ data: mockSymbols, error: null });
      
      const result = await getAllowedSymbols();
      
      expect(mockFrom).toHaveBeenCalledWith('allowed_symbols');
      expect(result).toEqual(mockSymbols);
    });
    
    it('should return fallback symbols on error', async () => {
      mockOrder.mockResolvedValue({ data: null, error: new Error('DB error') });
      
      const result = await getAllowedSymbols();
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });
  
  describe('testConnection', () => {
    it('should return success when connection works', async () => {
      const mockQuote = { symbol: 'AAPL', price: 150.25 };
      mockSingle.mockResolvedValue({ data: mockQuote, error: null });
      
      const result = await testConnection();
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('successful');
    });
    
    it('should return failure when connection fails', async () => {
      mockSingle.mockResolvedValue({ 
        data: null, 
        error: new Error('Connection failed') 
      });
      
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const result = await testConnection();
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('failed');
      
      process.env.NODE_ENV = originalEnv;
    });
  });
  
  describe('Cache Management', () => {
    it('should clear cache', () => {
      const mockQuote = { symbol: 'AAPL', price: 150.25 };
      mockSingle.mockResolvedValue({ data: mockQuote, error: null });
      
      // Fetch and cache
      getMarketData('AAPL', { useCache: true });
      
      // Clear cache
      marketServiceUtils.clearCache();
      
      // Next fetch should call RPC again
      mockSingle.mockClear();
      getMarketData('AAPL', { useCache: true });
      
      // Should be called again after cache clear
      expect(mockRpc).toHaveBeenCalled();
    });
  });
  
  describe('Error Handling', () => {
    it('should handle Supabase errors gracefully', async () => {
      mockSingle.mockResolvedValue({ 
        data: null, 
        error: new Error('Database error') 
      });
      
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      await expect(getMarketData('AAPL', { useCache: false }))
        .rejects.toThrow();
      
      process.env.NODE_ENV = originalEnv;
    });
    
    it('should log errors appropriately', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockSingle.mockResolvedValue({ 
        data: null, 
        error: new Error('Test error') 
      });
      
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      try {
        await getMarketData('AAPL', { useCache: false });
      } catch (e) {
        // Expected
      }
      
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });
  });
});
