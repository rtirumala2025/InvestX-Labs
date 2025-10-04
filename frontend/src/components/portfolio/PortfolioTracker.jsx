import React, { useState } from 'react';
import { motion } from 'framer-motion';
import PortfolioChart from './PortfolioChart';
import HoldingsList from './HoldingsList';
import PerformanceMetrics from './PerformanceMetrics';
import AddHolding from './AddHolding';
import { usePortfolio } from '../../hooks/usePortfolio';
import { useAlphaVantageData } from '../../hooks/useAlphaVantageData';
import { calculatePerformanceMetrics } from '../../services/portfolio/portfolioCalculations';
import LoadingSpinner from '../common/LoadingSpinner';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import Modal from '../ui/Modal';

const PortfolioTracker = () => {
  const { portfolio, holdings, loading: portfolioLoading, error: portfolioError } = usePortfolio();
  const { 
    portfolioMetrics: liveMetrics, 
    marketData, 
    loading: marketLoading, 
    error: marketError,
    lastUpdated,
    refreshData,
    isDataStale 
  } = useAlphaVantageData(holdings || []);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1W');

  const fadeIn = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
  };

  const staggerChildren = {
    visible: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  // Use live market data if available, fallback to static calculations
  const portfolioMetrics = React.useMemo(() => {
    console.log('📊 [PortfolioTracker] Calculating portfolio metrics...');
    console.log('📊 [PortfolioTracker] Live metrics available:', !!liveMetrics);
    console.log('📊 [PortfolioTracker] Holdings count:', holdings?.length || 0);
    
    if (liveMetrics && liveMetrics.holdings) {
      // Use live market data calculations
      console.log('📊 [PortfolioTracker] ✅ Using live market data for calculations');
      const staticMetrics = calculatePerformanceMetrics(liveMetrics.holdings);
      const result = {
        ...liveMetrics,
        sectorAllocation: staticMetrics.sectorAllocation,
        assetTypeAllocation: staticMetrics.assetTypeAllocation,
        diversificationScore: staticMetrics.diversificationScore
      };
      console.log('📊 [PortfolioTracker] 📈 Live portfolio metrics:', {
        totalValue: result.totalValue,
        dayChange: result.dayChange,
        totalGainLoss: result.totalGainLoss,
        holdingsCount: result.holdings?.length
      });
      return result;
    }
    
    // Fallback to static calculations
    if (!holdings || holdings.length === 0) {
      console.log('📊 [PortfolioTracker] ⚠️ Empty portfolio - showing zero values');
      return {
        totalValue: 0,
        totalCostBasis: 0,
        totalGainLoss: 0,
        totalGainLossPercentage: 0,
        dayChange: 0,
        dayChangePercentage: 0,
        sectorAllocation: {},
        assetTypeAllocation: {},
        diversificationScore: 0,
        holdings: []
      };
    }
    
    console.log('📊 [PortfolioTracker] 🔄 Using static calculations as fallback');
    const result = calculatePerformanceMetrics(holdings);
    console.log('📊 [PortfolioTracker] 📈 Static portfolio metrics:', {
      totalValue: result.totalValue,
      totalGainLoss: result.totalGainLoss
    });
    return result;
  }, [liveMetrics, holdings]);

  const quickStats = [
    { 
      label: 'Total Value', 
      value: `$${portfolioMetrics.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
      change: `${portfolioMetrics.totalGainLossPercentage >= 0 ? '+' : ''}${portfolioMetrics.totalGainLossPercentage.toFixed(2)}%`,
      changeAmount: `${portfolioMetrics.totalGainLoss >= 0 ? '+' : ''}$${Math.abs(portfolioMetrics.totalGainLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      positive: portfolioMetrics.totalGainLoss >= 0 
    },
    { 
      label: 'Today\'s Change', 
      value: `${portfolioMetrics.dayChange >= 0 ? '+' : ''}$${Math.abs(portfolioMetrics.dayChange || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
      change: `${portfolioMetrics.dayChangePercentage >= 0 ? '+' : ''}${(portfolioMetrics.dayChangePercentage || 0).toFixed(2)}%`,
      changeAmount: 'Since yesterday',
      positive: (portfolioMetrics.dayChange || 0) >= 0 
    },
    { 
      label: 'Total Return', 
      value: `${portfolioMetrics.totalGainLoss >= 0 ? '+' : ''}$${Math.abs(portfolioMetrics.totalGainLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
      change: `${portfolioMetrics.totalGainLossPercentage >= 0 ? '+' : ''}${portfolioMetrics.totalGainLossPercentage.toFixed(2)}%`,
      changeAmount: 'All time',
      positive: portfolioMetrics.totalGainLoss >= 0 
    },
    { 
      label: 'Holdings', 
      value: holdings?.length || 0, 
      change: holdings?.length > 0 ? 'Diversified' : 'Add Holdings',
      changeAmount: holdings?.length > 0 ? `${Object.keys(portfolioMetrics.sectorAllocation || {}).length} sectors` : 'Get started',
      positive: (holdings?.length || 0) > 0 
    }
  ];

  const timeframes = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

  const loading = portfolioLoading || marketLoading;
  const error = portfolioError || marketError;

  if (portfolioLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-300">Loading your portfolio...</p>
        </div>
      </div>
    );
  }

  if (portfolioError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2 text-white">Unable to Load Portfolio</h2>
          <p className="text-gray-300 mb-4">{portfolioError}</p>
          <GlassButton onClick={() => window.location.reload()} variant="primary">
            Try Again
          </GlassButton>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      {/* Header */}
      <motion.div 
        variants={fadeIn} 
        initial="hidden" 
        animate="visible" 
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-purple-300 to-orange-300 mb-2">
              Portfolio Tracker 📈
            </h1>
            <div className="flex items-center space-x-4">
              <p className="text-gray-300 text-lg">Monitor your investments and track performance in real-time</p>
              {marketLoading && (
                <div className="flex items-center space-x-2 text-blue-400 text-sm">
                  <LoadingSpinner size="small" />
                  <span>Updating prices...</span>
                </div>
              )}
              {lastUpdated && !marketLoading && (
                <span className="text-gray-500 text-sm">
                  Last updated: {new Date(lastUpdated).toLocaleTimeString()}
                  {isDataStale() && <span className="text-yellow-400 ml-1">(Stale)</span>}
                </span>
              )}
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-3">
            {holdings && holdings.length > 0 && (
              <GlassButton 
                onClick={refreshData}
                variant="glass" 
                size="default"
                disabled={marketLoading}
              >
                {marketLoading ? 'Refreshing...' : 'Refresh Prices'}
              </GlassButton>
            )}
            <GlassButton 
              onClick={() => setIsAddOpen(true)}
              variant="primary" 
              size="default"
              className="shadow-lg"
            >
              + Add Investment
            </GlassButton>
          </div>
        </div>
        {marketError && (
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-yellow-300 text-sm">
              ⚠️ Market data unavailable: {marketError}. Showing last known prices.
            </p>
          </div>
        )}
      </motion.div>

      {/* Quick Stats Grid */}
      <motion.div 
        variants={staggerChildren}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        {quickStats.map((stat, index) => (
          <motion.div key={index} variants={fadeIn}>
            <GlassCard 
              variant="default" 
              padding="large" 
              interactive={true}
              className="text-center group"
            >
              <h3 className="text-sm font-medium text-white/70 mb-2">{stat.label}</h3>
              <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
              <p className={`text-sm ${stat.positive ? 'text-green-400' : 'text-red-400'}`}>
                {stat.change}
              </p>
              <p className="text-xs text-white/50 mt-1">{stat.changeAmount}</p>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-8">
          {/* Portfolio Performance Chart */}
          <motion.div variants={fadeIn} initial="hidden" animate="visible">
            <GlassCard variant="hero" padding="large" shadow="xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <h2 className="text-2xl font-semibold text-white mb-4 sm:mb-0">Portfolio Performance</h2>
                <div className="flex flex-wrap gap-2">
                  {timeframes.map((timeframe) => (
                    <button
                      key={timeframe}
                      onClick={() => setSelectedTimeframe(timeframe)}
                      className={`px-3 py-1 text-sm rounded-lg transition-all ${
                        selectedTimeframe === timeframe
                          ? 'bg-blue-500/30 text-white border border-blue-400/30'
                          : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/20'
                      }`}
                    >
                      {timeframe}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-80 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl border border-white/10 backdrop-blur-sm">
                <PortfolioChart portfolio={portfolio} />
              </div>
            </GlassCard>
          </motion.div>

          {/* Performance Metrics */}
          <motion.div variants={fadeIn} initial="hidden" animate="visible">
            <GlassCard variant="default" padding="large" shadow="large">
              <h2 className="text-2xl font-semibold text-white mb-6">Performance Metrics</h2>
              <PerformanceMetrics 
                portfolio={portfolio} 
                liveMetrics={liveMetrics}
                marketData={marketData}
              />
            </GlassCard>
          </motion.div>

          {/* Holdings List */}
          <motion.div variants={fadeIn} initial="hidden" animate="visible">
            <GlassCard variant="default" padding="large" shadow="large">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-white">Your Holdings</h2>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 text-sm bg-white/10 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-all">
                    Value
                  </button>
                  <button className="px-3 py-1 text-sm bg-blue-500/30 rounded-lg text-white">
                    Performance
                  </button>
                  <button className="px-3 py-1 text-sm bg-white/10 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-all">
                    Allocation
                  </button>
                </div>
              </div>
              <HoldingsList 
                portfolio={portfolio} 
                liveMetrics={liveMetrics}
                marketData={marketData}
              />
            </GlassCard>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Portfolio Allocation */}
          <motion.div variants={fadeIn} initial="hidden" animate="visible">
            <GlassCard variant="accent" padding="large" glow={true}>
              <h3 className="text-xl font-semibold text-white mb-4">Asset Allocation</h3>
              <div className="space-y-4">
                {Object.keys(portfolioMetrics.assetTypeAllocation).length > 0 ? (
                  Object.entries(portfolioMetrics.assetTypeAllocation).map(([assetType, percentage], index) => {
                    const colors = [
                      'from-blue-400 to-blue-500',
                      'from-green-400 to-green-500', 
                      'from-purple-400 to-purple-500',
                      'from-orange-400 to-orange-500',
                      'from-pink-400 to-pink-500'
                    ];
                    const colorClass = colors[index % colors.length];
                    
                    return (
                      <div key={assetType}>
                        <div className="flex justify-between items-center">
                          <span className="text-white/90">{assetType}</span>
                          <span className="text-white font-medium">{percentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-2">
                          <div className={`bg-gradient-to-r ${colorClass} h-2 rounded-full`} style={{ width: `${percentage}%` }}></div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">📊</div>
                    <p className="text-white/60 text-sm mb-2">No allocations yet</p>
                    <p className="text-white/40 text-xs">Add holdings to see asset allocation</p>
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={fadeIn} initial="hidden" animate="visible">
            <GlassCard variant="default" padding="large">
              <h3 className="text-xl font-semibold text-white mb-6">Quick Actions</h3>
              <div className="space-y-3">
                <GlassButton
                  onClick={() => setIsAddOpen(true)}
                  variant="glass"
                  className="w-full justify-start"
                >
                  <span className="mr-3">📈</span>
                  Add New Position
                </GlassButton>
                
                <GlassButton
                  variant="glass"
                  className="w-full justify-start"
                >
                  <span className="mr-3">⚖️</span>
                  Rebalance Portfolio
                </GlassButton>
                
                <GlassButton
                  variant="glass"
                  className="w-full justify-start"
                >
                  <span className="mr-3">📊</span>
                  Generate Report
                </GlassButton>
                
                <GlassButton
                  variant="glass"
                  className="w-full justify-start"
                >
                  <span className="mr-3">🎯</span>
                  Set Price Alerts
                </GlassButton>
              </div>
            </GlassCard>
          </motion.div>

          {/* Market News */}
          <motion.div variants={fadeIn} initial="hidden" animate="visible">
            <GlassCard variant="floating" padding="large" interactive={true}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Market News</h3>
                <span className="px-2 py-1 bg-green-500/30 text-green-300 text-xs rounded-full">Live</span>
              </div>
              <div className="space-y-3">
                {holdings && holdings.length > 0 ? (
                  <>
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <h4 className="text-sm font-medium text-white mb-1">Portfolio Update</h4>
                      <p className="text-xs text-white/70">Your portfolio has {holdings.length} holdings across {Object.keys(portfolioMetrics.sectorAllocation).length} sectors</p>
                      <span className="text-xs text-white/50">Updated now</span>
                    </div>
                    {portfolioMetrics.totalGainLossPercentage !== 0 && (
                      <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <h4 className="text-sm font-medium text-white mb-1">Performance Alert</h4>
                        <p className="text-xs text-white/70">
                          Your portfolio is {portfolioMetrics.totalGainLossPercentage > 0 ? 'up' : 'down'} {Math.abs(portfolioMetrics.totalGainLossPercentage).toFixed(2)}% overall
                        </p>
                        <span className="text-xs text-white/50">Live data</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">📰</div>
                    <p className="text-white/60 text-sm mb-2">No market updates</p>
                    <p className="text-white/40 text-xs">Add holdings to see relevant news</p>
                  </div>
                )}
              </div>
              <GlassButton variant="ghost" className="w-full mt-4 text-sm">
                View All News
              </GlassButton>
            </GlassCard>
          </motion.div>
        </div>
      </div>

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add New Investment" size="large">
        <AddHolding />
      </Modal>
    </div>
  );
};

export default PortfolioTracker;
