import React, { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSimulation } from '../../contexts/SimulationContext';
import { getQuote } from '../../services/market/marketService';
import { debounce } from '../../utils/debounce';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';

const TradingInterface = ({ virtualBalance, holdings }) => {
  const { buyStock, sellStock, loading } = useSimulation();
  
  const [symbol, setSymbol] = useState('');
  const [shares, setShares] = useState('');
  const [tradeType, setTradeType] = useState('buy');
  const [currentPrice, setCurrentPrice] = useState(null);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState(null);
  const [aiCoaching, setAiCoaching] = useState(null);

  /**
   * Search for stock (debounced)
   */
  const handleSearchInternal = useCallback(async (searchSymbol) => {
    if (!searchSymbol) return;

    setSearching(true);
    setMessage(null);
    setCurrentPrice(null);

    try {
      const quote = await getQuote(searchSymbol.toUpperCase());
      
      if (quote && quote.price) {
        setCurrentPrice(quote.price);
        generateAICoaching(searchSymbol.toUpperCase(), quote.price);
      } else {
        setMessage({ type: 'error', text: 'Stock not found. Please check the symbol and try again.' });
      }
    } catch (error) {
      console.error('Error fetching quote:', error);
      setMessage({ type: 'error', text: 'Failed to fetch stock data. Please try again.' });
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounce search to avoid excessive API calls
  const debouncedSearch = useRef(
    debounce((searchSymbol) => {
      handleSearchInternal(searchSymbol);
    }, 500)
  ).current;

  const handleSearch = useCallback(() => {
    if (symbol) {
      debouncedSearch(symbol);
    }
  }, [symbol, debouncedSearch]);

  /**
   * Generate AI coaching
   */
  const generateAICoaching = (stockSymbol, price) => {
    // Educational coaching based on context
    const holding = holdings.find(h => h.symbol === stockSymbol);
    
    if (tradeType === 'buy') {
      if (holding) {
        setAiCoaching({
          type: 'info',
          text: `📚 You already own ${holding.shares} shares of ${stockSymbol}. Consider: Is this adding to your diversification or over-concentrating your portfolio?`
        });
      } else {
        setAiCoaching({
          type: 'success',
          text: `💡 This would be a new position. Remember to research the company's fundamentals, industry trends, and consider how it fits your overall portfolio strategy.`
        });
      }
    } else {
      if (holding) {
        const gainLoss = (price - holding.purchase_price) * shares;
        const gainLossPercent = ((price - holding.purchase_price) / holding.purchase_price) * 100;
        
        if (gainLoss > 0) {
          setAiCoaching({
            type: 'success',
            text: `📈 This trade would result in a ${gainLossPercent.toFixed(2)}% gain! Remember: realizing profits is part of good portfolio management, but also consider tax implications and long-term goals.`
          });
        } else {
          setAiCoaching({
            type: 'warning',
            text: `📉 This trade would result in a ${Math.abs(gainLossPercent).toFixed(2)}% loss. Consider: Is this a strategic decision to cut losses, or could holding longer align with your investment thesis?`
          });
        }
      }
    }
  };

  /**
   * Execute trade
   */
  const handleTrade = async () => {
    if (!symbol || !shares || !currentPrice) {
      setMessage({ type: 'error', text: 'Please fill in all fields and search for a stock first.' });
      return;
    }

    const numShares = parseFloat(shares);
    if (isNaN(numShares) || numShares <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid number of shares.' });
      return;
    }

    setMessage(null);

    try {
      let result;
      if (tradeType === 'buy') {
        result = await buyStock(symbol.toUpperCase(), numShares, currentPrice);
      } else {
        result = await sellStock(symbol.toUpperCase(), numShares, currentPrice);
      }

      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: `✅ Successfully ${tradeType === 'buy' ? 'bought' : 'sold'} ${numShares} shares of ${symbol.toUpperCase()}!` 
        });
        
        // Reset form
        setSymbol('');
        setShares('');
        setCurrentPrice(null);
        setAiCoaching(null);
      } else {
        setMessage({ type: 'error', text: result.error || 'Trade failed. Please try again.' });
      }
    } catch (error) {
      console.error('Trade error:', error);
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    }
  };

  // Calculate trade cost
  const totalCost = currentPrice && shares ? (parseFloat(shares) * currentPrice * (tradeType === 'buy' ? 1.001 : 0.999)).toFixed(2) : 0;
  const canAfford = tradeType === 'buy' ? parseFloat(totalCost) <= virtualBalance : true;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Trading Form */}
      <GlassCard variant="floating" padding="large">
        <h3 className="text-2xl font-semibold text-white mb-6">
          {tradeType === 'buy' ? '📈 Buy Stock' : '📉 Sell Stock'}
        </h3>

        {/* Trade Type Toggle */}
        <div className="flex space-x-2 mb-6 bg-white/5 rounded-lg p-1">
          <button
            onClick={() => {
              setTradeType('buy');
              setAiCoaching(null);
            }}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
              tradeType === 'buy'
                ? 'bg-green-500/30 text-green-300'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Buy
          </button>
          <button
            onClick={() => {
              setTradeType('sell');
              setAiCoaching(null);
            }}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
              tradeType === 'sell'
                ? 'bg-red-500/30 text-red-300'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Sell
          </button>
        </div>

        {/* Stock Symbol */}
        <div className="mb-4">
          <label className="block text-white/70 text-sm mb-2">Stock Symbol</label>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="e.g., AAPL"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/40"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <GlassButton
              variant="primary"
              size="medium"
              onClick={handleSearch}
              disabled={searching || !symbol}
            >
              {searching ? '...' : 'Search'}
            </GlassButton>
          </div>
        </div>

        {/* Current Price Display */}
        {currentPrice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 bg-blue-500/20 border border-blue-400/30 rounded-lg p-4"
          >
            <p className="text-white/70 text-sm mb-1">Current Price</p>
            <p className="text-white text-3xl font-bold">${currentPrice.toFixed(2)}</p>
          </motion.div>
        )}

        {/* Number of Shares */}
        <div className="mb-4">
          <label className="block text-white/70 text-sm mb-2">Number of Shares</label>
          <input
            type="number"
            placeholder="e.g., 10"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            min="0.01"
            step="0.01"
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/40"
          />
        </div>

        {/* Trade Summary */}
        {currentPrice && shares && (
          <div className="mb-6 bg-white/5 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-white/70">
              <span>Shares:</span>
              <span>{shares}</span>
            </div>
            <div className="flex justify-between text-white/70">
              <span>Price per share:</span>
              <span>${currentPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-white/70">
              <span>Trading fee (0.1%):</span>
              <span>${(parseFloat(shares) * currentPrice * 0.001).toFixed(2)}</span>
            </div>
            <div className="border-t border-white/20 pt-2 flex justify-between text-white font-semibold text-lg">
              <span>Total:</span>
              <span className={tradeType === 'buy' ? 'text-red-400' : 'text-green-400'}>
                {tradeType === 'buy' ? '-' : '+'}${totalCost}
              </span>
            </div>
            {tradeType === 'buy' && !canAfford && (
              <p className="text-red-400 text-sm mt-2">
                ⚠️ Insufficient funds. You need ${(parseFloat(totalCost) - virtualBalance).toFixed(2)} more.
              </p>
            )}
          </div>
        )}

        {/* Trade Button */}
        <GlassButton
          variant={tradeType === 'buy' ? 'primary' : 'danger'}
          size="large"
          onClick={handleTrade}
          disabled={loading || !currentPrice || !shares || !canAfford}
          className="w-full"
        >
          {loading ? 'Processing...' : tradeType === 'buy' ? 'Buy Now' : 'Sell Now'}
        </GlassButton>

        {/* Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-500/20 border border-green-400/30' 
                : 'bg-red-500/20 border border-red-400/30'
            }`}
          >
            <p className="text-white text-sm">{message.text}</p>
          </motion.div>
        )}
      </GlassCard>

      {/* AI Coaching & Info */}
      <div className="space-y-6">
        {/* AI Coaching */}
        {aiCoaching && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <GlassCard variant="floating" padding="large" className={
              aiCoaching.type === 'success' ? 'bg-green-500/10 border-green-400/20' :
              aiCoaching.type === 'warning' ? 'bg-yellow-500/10 border-yellow-400/20' :
              'bg-blue-500/10 border-blue-400/20'
            }>
              <div className="flex items-start space-x-3">
                <span className="text-3xl">🤖</span>
                <div>
                  <h4 className="text-white font-semibold mb-2">AI Trading Coach</h4>
                  <p className="text-white/80 text-sm">{aiCoaching.text}</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Educational Tips */}
        <GlassCard variant="floating" padding="large">
          <h4 className="text-white font-semibold mb-4 flex items-center">
            <span className="text-2xl mr-2">💡</span>
            Trading Tips
          </h4>
          <div className="space-y-3 text-white/70 text-sm">
            <div className="flex items-start space-x-2">
              <span className="text-green-400">•</span>
              <p>Always research a company before buying its stock</p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-green-400">•</span>
              <p>Diversify across different sectors to reduce risk</p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-green-400">•</span>
              <p>Consider long-term trends rather than short-term fluctuations</p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-green-400">•</span>
              <p>Don't invest more than you can afford to lose</p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-green-400">•</span>
              <p>Keep emotions in check - stick to your strategy</p>
            </div>
          </div>
        </GlassCard>

        {/* Popular Stocks */}
        <GlassCard variant="floating" padding="large">
          <h4 className="text-white font-semibold mb-4">Popular Stocks</h4>
          <div className="grid grid-cols-2 gap-2">
            {['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META'].map((stock) => (
              <button
                key={stock}
                onClick={() => {
                  setSymbol(stock);
                  handleSearch();
                }}
                className="bg-white/10 hover:bg-white/20 rounded-lg px-4 py-2 text-white transition-colors"
              >
                {stock}
              </button>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default TradingInterface;

