import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getQuote } from '../../services/market/marketService';
import { debounce } from '../../utils/debounce';
import GlassCard from '../ui/GlassCard';
import { Search, TrendingUp, TrendingDown, X } from 'lucide-react';

// Popular stocks for quick access
const POPULAR_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'TSLA', name: 'Tesla, Inc.' },
  { symbol: 'META', name: 'Meta Platforms Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
  { symbol: 'V', name: 'Visa Inc.' },
  { symbol: 'JNJ', name: 'Johnson & Johnson' }
];

const StockSearch = ({ onStockSelect, selectedSymbol, className = '' }) => {
  const [searchTerm, setSearchTerm] = useState(selectedSymbol || '');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [error, setError] = useState(null);

  // Debounced search function
  const performSearch = useCallback(async (term) => {
    if (!term || term.length < 1) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      // For now, we'll search by symbol only
      // In production, you'd integrate with a stock search API
      const upperTerm = term.toUpperCase().trim();
      
      // Check if it matches a popular stock
      const matches = POPULAR_STOCKS.filter(stock => 
        stock.symbol.includes(upperTerm) || 
        stock.name.toUpperCase().includes(upperTerm)
      );

      if (matches.length > 0) {
        setSearchResults(matches);
      } else if (upperTerm.length >= 1 && upperTerm.length <= 5) {
        // Try to fetch quote for the symbol directly
        const quote = await getQuote(upperTerm);
        if (quote && quote.price) {
          setSearchResults([{
            symbol: upperTerm,
            name: `${upperTerm} Stock`
          }]);
        } else {
          setSearchResults([]);
          setError('Stock not found. Please check the symbol.');
        }
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const debouncedSearch = useCallback(
    debounce(performSearch, 500),
    [performSearch]
  );

  // Handle search term change
  useEffect(() => {
    if (searchTerm) {
      debouncedSearch(searchTerm);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, debouncedSearch]);

  // Handle stock selection
  const handleStockSelect = async (stock) => {
    setSearchTerm(stock.symbol);
    setSearchResults([]);
    
    try {
      // Fetch current quote
      const quote = await getQuote(stock.symbol);
      if (quote) {
        const stockData = {
          symbol: stock.symbol,
          name: stock.name,
          price: quote.price,
          change: quote.change,
          changePercent: quote.changePercent,
          volume: quote.volume,
          high: quote.high,
          low: quote.low,
          previousClose: quote.previousClose
        };
        setSelectedStock(stockData);
        onStockSelect?.(stockData);
      }
    } catch (err) {
      console.error('Error fetching quote:', err);
      setError('Failed to fetch stock data. Please try again.');
    }
  };

  // Clear selection
  const handleClear = () => {
    setSearchTerm('');
    setSelectedStock(null);
    setSearchResults([]);
    setError(null);
    onStockSelect?.(null);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-4 text-white/40 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by symbol (e.g., AAPL) or company name"
            className="w-full bg-white/10 border border-white/20 rounded-lg pl-12 pr-10 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-blue-500/30 transition-all"
          />
          {searchTerm && (
            <button
              onClick={handleClear}
              className="absolute right-3 text-white/40 hover:text-white/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Loading Indicator */}
        {isSearching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-red-400 text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-gray-800/95 backdrop-blur-xl border border-white/20 rounded-lg shadow-2xl max-h-64 overflow-y-auto"
          >
            {searchResults.map((stock, index) => (
              <button
                key={`${stock.symbol}-${index}`}
                onClick={() => handleStockSelect(stock)}
                className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors border-b border-white/5 last:border-b-0"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold">{stock.symbol}</p>
                    <p className="text-white/60 text-sm">{stock.name}</p>
                  </div>
                  <Search className="w-4 h-4 text-white/40" />
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Stock Display */}
      {selectedStock && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4"
        >
          <GlassCard variant="floating" padding="medium" className="bg-blue-500/10 border-blue-400/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm mb-1">Selected Stock</p>
                <p className="text-white font-bold text-xl">{selectedStock.symbol}</p>
                {selectedStock.name && (
                  <p className="text-white/60 text-sm">{selectedStock.name}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-white font-bold text-2xl">${selectedStock.price.toFixed(2)}</p>
                <div className={`flex items-center gap-1 mt-1 ${selectedStock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {selectedStock.change >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span className="text-sm font-semibold">
                    {selectedStock.change >= 0 ? '+' : ''}{selectedStock.change.toFixed(2)} 
                    ({selectedStock.changePercent >= 0 ? '+' : ''}{selectedStock.changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>
            {selectedStock.volume && (
              <div className="mt-3 pt-3 border-t border-white/10 flex justify-between text-white/60 text-xs">
                <span>Volume: {selectedStock.volume.toLocaleString()}</span>
                <span>High: ${selectedStock.high?.toFixed(2)}</span>
                <span>Low: ${selectedStock.low?.toFixed(2)}</span>
              </div>
            )}
          </GlassCard>
        </motion.div>
      )}

      {/* Popular Stocks Quick Access */}
      {!selectedStock && searchResults.length === 0 && !searchTerm && (
        <div className="mt-4">
          <p className="text-white/60 text-sm mb-2">Popular Stocks</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_STOCKS.slice(0, 6).map((stock) => (
              <button
                key={stock.symbol}
                onClick={() => handleStockSelect(stock)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors"
              >
                {stock.symbol}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StockSearch;
