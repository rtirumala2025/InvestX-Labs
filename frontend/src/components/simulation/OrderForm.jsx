import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSimulation } from '../../contexts/SimulationContext';
import { calculatePositionSize, calculateDollarAmount, calculateFees } from '../../services/simulation/portfolioEngine';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import { DollarSign, Percent, TrendingUp, TrendingDown } from 'lucide-react';

const OrderForm = ({ stock, onTradeComplete }) => {
  const { buyStock, sellStock, holdings, virtualBalance, loading } = useSimulation();
  const [orderType, setOrderType] = useState('buy');
  const [inputMode, setInputMode] = useState('shares'); // 'shares' or 'dollars'
  const [shares, setShares] = useState('');
  const [dollarAmount, setDollarAmount] = useState('');
  const [error, setError] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const currentPrice = stock?.price || 0;
  const existingHolding = holdings?.find(h => h.symbol === stock?.symbol);

  // Calculate values based on input mode
  const calculatedValues = useMemo(() => {
    if (!currentPrice || currentPrice <= 0) {
      return {
        shares: 0,
        dollarAmount: 0,
        fees: 0,
        total: 0
      };
    }

    let calculatedShares = 0;
    let calculatedDollarAmount = 0;

    if (inputMode === 'shares') {
      calculatedShares = parseFloat(shares) || 0;
      calculatedDollarAmount = calculateDollarAmount(calculatedShares, currentPrice);
    } else {
      calculatedDollarAmount = parseFloat(dollarAmount) || 0;
      calculatedShares = calculatePositionSize(calculatedDollarAmount, currentPrice);
    }

    const fees = calculateFees(calculatedDollarAmount);
    const total = orderType === 'buy' 
      ? calculatedDollarAmount + fees 
      : calculatedDollarAmount - fees;

    return {
      shares: calculatedShares,
      dollarAmount: calculatedDollarAmount,
      fees,
      total
    };
  }, [shares, dollarAmount, inputMode, currentPrice, orderType]);

  // Sync inputs when mode changes
  useEffect(() => {
    if (inputMode === 'shares' && shares) {
      const amount = calculateDollarAmount(parseFloat(shares), currentPrice);
      setDollarAmount(amount.toFixed(2));
    } else if (inputMode === 'dollars' && dollarAmount) {
      const calculatedShares = calculatePositionSize(parseFloat(dollarAmount), currentPrice);
      setShares(calculatedShares.toFixed(4));
    }
  }, [inputMode, currentPrice]);

  // Validation
  const validation = useMemo(() => {
    const { shares: calcShares, total } = calculatedValues;
    const errors = [];

    if (orderType === 'buy') {
      if (total > virtualBalance) {
        errors.push(`Insufficient funds. You need $${(total - virtualBalance).toFixed(2)} more.`);
      }
      if (calcShares <= 0) {
        errors.push('Please enter a valid number of shares or dollar amount.');
      }
    } else {
      // sell
      if (!existingHolding) {
        errors.push('You don\'t own this stock.');
      } else if (calcShares > parseFloat(existingHolding.shares)) {
        errors.push(`You only own ${existingHolding.shares} shares.`);
      }
      if (calcShares <= 0) {
        errors.push('Please enter a valid number of shares or dollar amount.');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, [calculatedValues, orderType, virtualBalance, existingHolding]);

  // Quick amount buttons
  const quickAmounts = useMemo(() => {
    if (orderType === 'buy') {
      return [
        { label: '25%', value: virtualBalance * 0.25 },
        { label: '50%', value: virtualBalance * 0.5 },
        { label: '75%', value: virtualBalance * 0.75 },
        { label: '100%', value: virtualBalance }
      ];
    } else {
      // For sell, use percentage of holding
      if (existingHolding && currentPrice > 0) {
        const holdingValue = parseFloat(existingHolding.shares) * currentPrice;
        return [
          { label: '25%', value: holdingValue * 0.25 },
          { label: '50%', value: holdingValue * 0.5 },
          { label: '75%', value: holdingValue * 0.75 },
          { label: '100%', value: holdingValue }
        ];
      }
      return [];
    }
  }, [orderType, virtualBalance, existingHolding, currentPrice]);

  const handleQuickAmount = (amount) => {
    setInputMode('dollars');
    setDollarAmount(amount.toFixed(2));
  };

  const handleSubmit = async () => {
    setError(null);

    if (!validation.isValid) {
      setError(validation.errors[0]);
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    setError(null);
    setShowConfirmation(false);

    try {
      const result = orderType === 'buy'
        ? await buyStock(stock.symbol, calculatedValues.shares, currentPrice)
        : await sellStock(stock.symbol, calculatedValues.shares, currentPrice);

      if (result.success) {
        // Reset form
        setShares('');
        setDollarAmount('');
        onTradeComplete?.(result);
      } else {
        setError(result.error || 'Trade failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    }
  };

  if (!stock || !currentPrice) {
    return (
      <GlassCard variant="floating" padding="large">
        <p className="text-white/60 text-center py-8">
          Select a stock to place an order
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard variant="floating" padding="large">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-2xl font-semibold text-white mb-2">
            {orderType === 'buy' ? '📈 Buy Order' : '📉 Sell Order'}
          </h3>
          <p className="text-white/60 text-sm">
            {stock.symbol} - ${currentPrice.toFixed(2)} per share
          </p>
        </div>

        {/* Order Type Toggle */}
        <div className="flex space-x-2 bg-white/5 rounded-lg p-1">
          <button
            onClick={() => {
              setOrderType('buy');
              setError(null);
            }}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
              orderType === 'buy'
                ? 'bg-green-500/30 text-green-300'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Buy
          </button>
          <button
            onClick={() => {
              setOrderType('sell');
              setError(null);
            }}
            disabled={!existingHolding}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
              orderType === 'sell'
                ? 'bg-red-500/30 text-red-300'
                : 'text-white/60 hover:text-white'
            } ${!existingHolding ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Sell {existingHolding && `(${existingHolding.shares} owned)`}
          </button>
        </div>

        {/* Input Mode Toggle */}
        <div className="flex space-x-2 bg-white/5 rounded-lg p-1">
          <button
            onClick={() => setInputMode('shares')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
              inputMode === 'shares'
                ? 'bg-white/20 text-white'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Shares
          </button>
          <button
            onClick={() => setInputMode('dollars')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
              inputMode === 'dollars'
                ? 'bg-white/20 text-white'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Dollar Amount
          </button>
        </div>

        {/* Input Field */}
        <div>
          <label className="block text-white/70 text-sm mb-2">
            {inputMode === 'shares' ? 'Number of Shares' : 'Dollar Amount'}
          </label>
          <div className="relative">
            {inputMode === 'dollars' && (
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
            )}
            <input
              type="number"
              value={inputMode === 'shares' ? shares : dollarAmount}
              onChange={(e) => {
                const value = e.target.value;
                if (inputMode === 'shares') {
                  setShares(value);
                } else {
                  setDollarAmount(value);
                }
              }}
              placeholder={inputMode === 'shares' ? '0.00' : '0.00'}
              min="0"
              step={inputMode === 'shares' ? '0.01' : '0.01'}
              className={`w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/40 ${
                inputMode === 'dollars' ? 'pl-12' : ''
              }`}
            />
          </div>
        </div>

        {/* Quick Amount Buttons */}
        {quickAmounts.length > 0 && (
          <div>
            <p className="text-white/60 text-sm mb-2">Quick Amounts</p>
            <div className="flex gap-2">
              {quickAmounts.map((amount) => (
                <button
                  key={amount.label}
                  onClick={() => handleQuickAmount(amount.value)}
                  className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors"
                >
                  {amount.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Order Summary */}
        {(shares || dollarAmount) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 rounded-lg p-4 space-y-2"
          >
            <div className="flex justify-between text-white/70 text-sm">
              <span>Shares:</span>
              <span className="text-white font-semibold">
                {calculatedValues.shares.toFixed(4)}
              </span>
            </div>
            <div className="flex justify-between text-white/70 text-sm">
              <span>Price per share:</span>
              <span className="text-white">${currentPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-white/70 text-sm">
              <span>Subtotal:</span>
              <span className="text-white">${calculatedValues.dollarAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-white/70 text-sm">
              <span>Trading fee (0.1%):</span>
              <span className="text-white">${calculatedValues.fees.toFixed(2)}</span>
            </div>
            <div className="border-t border-white/20 pt-2 flex justify-between text-white font-semibold text-lg">
              <span>Total {orderType === 'buy' ? 'Cost' : 'Proceeds'}:</span>
              <span className={orderType === 'buy' ? 'text-red-400' : 'text-green-400'}>
                {orderType === 'buy' ? '-' : '+'}${calculatedValues.total.toFixed(2)}
              </span>
            </div>
            {orderType === 'buy' && (
              <div className="flex justify-between text-white/60 text-xs pt-1">
                <span>Available Cash:</span>
                <span>${virtualBalance.toFixed(2)}</span>
              </div>
            )}
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/20 border border-red-400/30 rounded-lg p-3"
          >
            <p className="text-red-300 text-sm">{error}</p>
          </motion.div>
        )}

        {/* Submit Button */}
        <GlassButton
          variant={orderType === 'buy' ? 'primary' : 'danger'}
          size="large"
          onClick={handleSubmit}
          disabled={loading || !validation.isValid || !shares && !dollarAmount}
          className="w-full"
        >
          {loading ? 'Processing...' : `${orderType === 'buy' ? 'Buy' : 'Sell'} ${stock.symbol}`}
        </GlassButton>

        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md w-full mx-4"
            >
              <GlassCard variant="floating" padding="large">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Confirm {orderType === 'buy' ? 'Buy' : 'Sell'} Order
                </h3>
                <div className="space-y-2 mb-6 text-white/80">
                  <p><span className="text-white/60">Symbol:</span> {stock.symbol}</p>
                  <p><span className="text-white/60">Shares:</span> {calculatedValues.shares.toFixed(4)}</p>
                  <p><span className="text-white/60">Price:</span> ${currentPrice.toFixed(2)}</p>
                  <p><span className="text-white/60">Total:</span> ${calculatedValues.total.toFixed(2)}</p>
                </div>
                <div className="flex space-x-3">
                  <GlassButton
                    variant="secondary"
                    size="medium"
                    onClick={() => setShowConfirmation(false)}
                    className="flex-1"
                  >
                    Cancel
                  </GlassButton>
                  <GlassButton
                    variant={orderType === 'buy' ? 'primary' : 'danger'}
                    size="medium"
                    onClick={handleConfirm}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? 'Processing...' : 'Confirm'}
                  </GlassButton>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </div>
    </GlassCard>
  );
};

export default OrderForm;
