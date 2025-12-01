import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../ui/GlassCard';
import { TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';

const HoldingsList = ({ holdings, marketData, onSellClick }) => {
  const enrichedHoldings = useMemo(() => {
    if (!holdings || holdings.length === 0) return [];

    return holdings.map(holding => {
      const currentPrice = marketData?.[holding.symbol]?.price || holding.current_price || holding.purchase_price || 0;
      const previousClose = marketData?.[holding.symbol]?.previousClose || holding.purchase_price || 0;
      const shares = parseFloat(holding.shares || 0);
      const purchasePrice = parseFloat(holding.purchase_price || 0);

      const marketValue = shares * currentPrice;
      const costBasis = shares * purchasePrice;
      const unrealizedPL = marketValue - costBasis;
      const unrealizedPLPercent = costBasis > 0 ? (unrealizedPL / costBasis) * 100 : 0;
      const dailyChange = shares * (currentPrice - previousClose);
      const dailyChangePercent = previousClose > 0 ? ((currentPrice - previousClose) / previousClose) * 100 : 0;

      return {
        ...holding,
        currentPrice,
        marketValue,
        costBasis,
        unrealizedPL,
        unrealizedPLPercent,
        dailyChange,
        dailyChangePercent
      };
    });
  }, [holdings, marketData]);

  const totalValue = useMemo(() => {
    return enrichedHoldings.reduce((sum, h) => sum + h.marketValue, 0);
  }, [enrichedHoldings]);

  if (enrichedHoldings.length === 0) {
    return (
      <GlassCard variant="floating" padding="large">
        <h3 className="text-xl font-semibold text-white mb-4">Your Holdings</h3>
        <div className="text-center py-12">
          <p className="text-white/60 text-lg mb-2">No holdings yet</p>
          <p className="text-white/40 text-sm">
            Start trading to build your simulated portfolio
          </p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard variant="floating" padding="large">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Your Holdings</h3>
        <p className="text-white/60 text-sm">
          Total Value: <span className="text-white font-semibold">${totalValue.toFixed(2)}</span>
        </p>
      </div>

      <div className="space-y-3">
        {enrichedHoldings.map((holding, index) => (
          <motion.div
            key={holding.id || holding.symbol}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white/10 rounded-lg p-4 hover:bg-white/15 transition-colors"
          >
            <div className="flex items-center justify-between">
              {/* Left: Symbol and Details */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div>
                    <p className="text-white font-bold text-lg">{holding.symbol}</p>
                    {holding.company_name && (
                      <p className="text-white/60 text-sm">{holding.company_name}</p>
                    )}
                  </div>
                  {holding.sector && (
                    <span className="px-2 py-1 bg-white/10 rounded text-white/60 text-xs">
                      {holding.sector}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-white/60 text-sm">
                  <span>{holding.shares.toFixed(4)} shares</span>
                  <span>@ ${holding.purchase_price.toFixed(2)} avg</span>
                  <span>•</span>
                  <span>Now: ${holding.currentPrice.toFixed(2)}</span>
                </div>
              </div>

              {/* Right: Value and Performance */}
              <div className="text-right">
                <p className="text-white font-semibold text-lg mb-1">
                  ${holding.marketValue.toFixed(2)}
                </p>
                <div className="flex items-center justify-end gap-1 mb-2">
                  {holding.unrealizedPL >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  )}
                  <p className={`text-sm font-semibold ${
                    holding.unrealizedPL >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {holding.unrealizedPL >= 0 ? '+' : ''}${holding.unrealizedPL.toFixed(2)} 
                    ({holding.unrealizedPLPercent >= 0 ? '+' : ''}{holding.unrealizedPLPercent.toFixed(2)}%)
                  </p>
                </div>
                {holding.dailyChange !== 0 && (
                  <p className={`text-xs ${
                    holding.dailyChange >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    Today: {holding.dailyChange >= 0 ? '+' : ''}${holding.dailyChange.toFixed(2)} 
                    ({holding.dailyChangePercent >= 0 ? '+' : ''}{holding.dailyChangePercent.toFixed(2)}%)
                  </p>
                )}
                {onSellClick && (
                  <button
                    onClick={() => onSellClick(holding)}
                    className="mt-2 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded text-sm transition-colors"
                  >
                    Sell
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-3 gap-4">
        <div>
          <p className="text-white/60 text-sm mb-1">Total Cost Basis</p>
          <p className="text-white font-semibold">
            ${enrichedHoldings.reduce((sum, h) => sum + h.costBasis, 0).toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-white/60 text-sm mb-1">Total Gain/Loss</p>
          <p className={`font-semibold ${
            enrichedHoldings.reduce((sum, h) => sum + h.unrealizedPL, 0) >= 0 
              ? 'text-green-400' 
              : 'text-red-400'
          }`}>
            {enrichedHoldings.reduce((sum, h) => sum + h.unrealizedPL, 0) >= 0 ? '+' : ''}
            ${enrichedHoldings.reduce((sum, h) => sum + h.unrealizedPL, 0).toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-white/60 text-sm mb-1">Positions</p>
          <p className="text-white font-semibold">{enrichedHoldings.length}</p>
        </div>
      </div>
    </GlassCard>
  );
};

export default HoldingsList;
