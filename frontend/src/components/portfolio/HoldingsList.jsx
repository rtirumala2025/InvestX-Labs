import React from 'react';
import { calculateTotalValue } from '../../services/portfolio/portfolioCalculations';

const HoldingsList = React.memo(({ portfolio, liveMetrics, marketData }) => {
  console.log('📋 [HoldingsList] Component rendered with props:');
  console.log('📋 [HoldingsList]   Portfolio:', !!portfolio);
  console.log('📋 [HoldingsList]   Live metrics:', !!liveMetrics);
  console.log('📋 [HoldingsList]   Market data keys:', Object.keys(marketData || {}));
  
  // Use live metrics if available, otherwise fallback to portfolio holdings
  const holdings = liveMetrics?.holdings || portfolio?.holdings || [];
  
  console.log('📋 [HoldingsList] Holdings to display:', holdings.length);
  if (holdings.length > 0) {
    console.log('📋 [HoldingsList] Holdings symbols:', holdings.map(h => h.symbol));
  }
  
  // Calculate total portfolio value for allocation percentages
  const totalPortfolioValue = liveMetrics?.totalValue || calculateTotalValue(holdings);
  console.log('📋 [HoldingsList] Total portfolio value:', totalPortfolioValue);
  
  // Helper function to get stock logo/emoji
  const getStockLogo = (symbol, sector) => {
    const logoMap = {
      'AAPL': '🍎',
      'MSFT': '🖥️',
      'GOOGL': '🔍',
      'GOOG': '🔍',
      'TSLA': '🚗',
      'NVDA': '🎮',
      'AMZN': '📦',
      'META': '👥',
      'NFLX': '🎬',
      'SPY': '📊',
      'QQQ': '📈',
      'VTI': '🏛️',
      'BRK.B': '💎'
    };
    
    if (logoMap[symbol]) return logoMap[symbol];
    
    // Fallback based on sector
    const sectorLogos = {
      'Technology': '💻',
      'Healthcare': '🏥',
      'Financial': '🏦',
      'Consumer': '🛒',
      'Energy': '⚡',
      'Industrial': '🏭',
      'Materials': '🔧',
      'Utilities': '💡',
      'Real Estate': '🏠',
      'ETF': '📊',
      'Automotive': '🚗'
    };
    
    return sectorLogos[sector] || '📈';
  };
  
  // Calculate derived values for each holding
  const enrichedHoldings = holdings.map(holding => {
    // If we have live metrics, the calculations are already done
    if (liveMetrics?.holdings && holding.currentPrice !== undefined) {
      return {
        ...holding,
        logo: getStockLogo(holding.symbol, holding.sector)
      };
    }
    
    // Fallback to manual calculations
    const currentPrice = holding.currentPrice || holding.purchasePrice;
    const value = holding.shares * currentPrice;
    const costBasis = holding.shares * holding.purchasePrice;
    const gainLoss = value - costBasis;
    const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;
    
    return {
      ...holding,
      currentPrice,
      value,
      gainLoss,
      gainLossPercent,
      logo: getStockLogo(holding.symbol, holding.sector)
    };
  });

  return (
    <div className="space-y-4">
      {enrichedHoldings.length > 0 ? (
        <div className="space-y-3">
          {enrichedHoldings.map((holding, index) => (
            <div key={holding.id || index} className="group">
              <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-xl border border-white/20 p-6 backdrop-blur-lg hover:from-white/15 hover:to-white/10 transition-all duration-300">
                <div className="flex items-center justify-between">
                  {/* Left side - Company info */}
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center text-2xl border border-white/10">
                      {holding.logo}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-white">{holding.symbol}</h3>
                        {holding.sector && (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                            {holding.sector}
                          </span>
                        )}
                      </div>
                      <p className="text-white/70 text-sm">{holding.companyName || holding.name || `${holding.symbol} Holdings`}</p>
                      <p className="text-white/50 text-xs">{holding.shares} shares</p>
                    </div>
                  </div>

                  {/* Right side - Performance data */}
                  <div className="text-right">
                    <div className="text-xl font-bold text-white mb-1">
                      ${holding.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-white/70 mb-2">
                      ${holding.currentPrice.toFixed(2)} per share
                    </div>
                    <div className={`flex items-center justify-end space-x-2 ${
                      holding.gainLoss >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      <span className="text-sm font-medium">
                        {holding.gainLoss >= 0 ? '+' : ''}${Math.abs(holding.gainLoss).toFixed(2)}
                      </span>
                      <span className="text-xs">
                        ({holding.gainLoss >= 0 ? '+' : ''}{holding.gainLossPercent.toFixed(1)}%)
                      </span>
                      <span className="text-lg">
                        {holding.gainLoss >= 0 ? '📈' : '📉'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress bar showing allocation */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-white/60 mb-1">
                    <span>Portfolio Allocation</span>
                    <span>{totalPortfolioValue > 0 ? ((holding.value / totalPortfolioValue) * 100).toFixed(1) : 0}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-1">
                    <div 
                      className={`h-1 rounded-full transition-all duration-1000 ${
                        holding.gainLoss >= 0 
                          ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
                          : 'bg-gradient-to-r from-red-400 to-red-500'
                      }`}
                      style={{ width: `${totalPortfolioValue > 0 ? (holding.value / totalPortfolioValue) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl border border-white/20 p-8 backdrop-blur-lg">
            <div className="text-6xl mb-4">📈</div>
            <h3 className="text-xl font-semibold text-white mb-2">Start Your Investment Journey</h3>
            <p className="text-white/70 mb-6">No holdings found. Add your first investment to get started and watch your portfolio grow!</p>
            <div className="flex items-center justify-center space-x-4 text-sm text-white/60">
              <div className="flex items-center">
                <span className="mr-2">💡</span>
                <span>Diversify across sectors</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">📊</span>
                <span>Track performance</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">🎯</span>
                <span>Set investment goals</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default HoldingsList;
