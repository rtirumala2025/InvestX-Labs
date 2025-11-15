import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSimulation } from '../contexts/SimulationContext';
import { useAlphaVantageData } from '../hooks/useAlphaVantageData';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import LoadingSpinner from '../components/common/LoadingSpinner';
import TradingInterface from '../components/simulation/TradingInterface';
import SimulationPortfolioChart from '../components/simulation/SimulationPortfolioChart';
import TransactionHistory from '../components/simulation/TransactionHistory';

const SimulationPage = () => {
  const { 
    portfolio, 
    virtualBalance, 
    holdings, 
    transactions, 
    loading, 
    error,
    resetSimulation 
  } = useSimulation();

  const { 
    portfolioMetrics, 
    marketData 
  } = useAlphaVantageData(holdings || []);

  const [activeTab, setActiveTab] = useState('trade');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const fadeIn = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
  };

  // Calculate portfolio value
  const portfolioValue = portfolioMetrics?.totalValue || 0;
  const totalInvested = portfolioValue + virtualBalance - 10000;
  const totalReturn = totalInvested - 10000;
  const totalReturnPercent = totalInvested > 0 ? (totalReturn / 10000) * 100 : 0;

  if (loading && !portfolio) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 py-4 lg:py-6">
      <div className="w-full max-w-[1920px] mx-auto px-3 lg:px-4 xl:px-6">
        {/* Header */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="mb-4 lg:mb-6"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                🎮 Simulation Mode
              </h1>
              <p className="text-white/70">
                Practice trading with $10,000 virtual money
              </p>
            </div>
            <GlassButton
              variant="secondary"
              size="small"
              onClick={() => setShowResetConfirm(true)}
            >
              Reset Simulation
            </GlassButton>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <GlassCard variant="floating" padding="medium">
              <p className="text-white/70 text-sm mb-1">Virtual Cash</p>
              <p className="text-white text-2xl font-bold">
                ${virtualBalance.toFixed(2)}
              </p>
            </GlassCard>

            <GlassCard variant="floating" padding="medium">
              <p className="text-white/70 text-sm mb-1">Portfolio Value</p>
              <p className="text-white text-2xl font-bold">
                ${portfolioValue.toFixed(2)}
              </p>
            </GlassCard>

            <GlassCard variant="floating" padding="medium">
              <p className="text-white/70 text-sm mb-1">Total Return</p>
              <p className={`text-2xl font-bold ${totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {totalReturn >= 0 ? '+' : ''}${totalReturn.toFixed(2)}
              </p>
            </GlassCard>

            <GlassCard variant="floating" padding="medium">
              <p className="text-white/70 text-sm mb-1">Return %</p>
              <p className={`text-2xl font-bold ${totalReturnPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {totalReturnPercent >= 0 ? '+' : ''}{totalReturnPercent.toFixed(2)}%
              </p>
            </GlassCard>
          </div>
        </motion.div>

        {/* Educational Notice */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="mb-6"
        >
          <GlassCard variant="solid" padding="medium" className="bg-blue-500/20 border-blue-400/30">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">💡</span>
              <div>
                <p className="text-white font-medium mb-1">Educational Simulation</p>
                <p className="text-white/80 text-sm">
                  This is a learning environment using real market data but virtual money. 
                  All trades are simulated and no real money is involved. Use this to practice 
                  strategies before investing real money.
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Tabs */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="mb-6"
        >
          <div className="flex space-x-2 bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('trade')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'trade'
                  ? 'bg-white/20 text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              📈 Trade
            </button>
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'portfolio'
                  ? 'bg-white/20 text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              💼 Portfolio
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-white/20 text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              📋 History
            </button>
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'trade' && (
            <TradingInterface 
              virtualBalance={virtualBalance}
              holdings={holdings}
            />
          )}

          {activeTab === 'portfolio' && (
            <div className="space-y-6">
              <SimulationPortfolioChart 
                holdings={holdings}
                portfolioMetrics={portfolioMetrics}
                marketData={marketData}
              />
              
              {/* Holdings List */}
              <GlassCard variant="floating" padding="large">
                <h3 className="text-xl font-semibold text-white mb-4">Your Holdings</h3>
                {holdings.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-white/60 text-lg mb-4">No holdings yet</p>
                    <p className="text-white/40 text-sm">
                      Start trading to build your simulated portfolio
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {holdings.map((holding) => {
                      const currentPrice = marketData?.[holding.symbol]?.price || holding.current_price || holding.purchase_price;
                      const totalValue = holding.shares * currentPrice;
                      const totalCost = holding.shares * holding.purchase_price;
                      const gainLoss = totalValue - totalCost;
                      const gainLossPercent = (gainLoss / totalCost) * 100;

                      return (
                        <div
                          key={holding.id}
                          className="bg-white/10 rounded-lg p-4 hover:bg-white/15 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div>
                                <p className="text-white font-bold text-lg">{holding.symbol}</p>
                                <p className="text-white/60 text-sm">
                                  {holding.shares} shares @ ${holding.purchase_price.toFixed(2)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-white font-semibold">
                                ${totalValue.toFixed(2)}
                              </p>
                              <p className={`text-sm ${gainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {gainLoss >= 0 ? '+' : ''}{gainLossPercent.toFixed(2)}%
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </GlassCard>
            </div>
          )}

          {activeTab === 'history' && (
            <TransactionHistory transactions={transactions} />
          )}
        </motion.div>

        {/* Reset Confirmation Modal */}
        {showResetConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md w-full mx-4"
            >
              <GlassCard variant="floating" padding="large">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Reset Simulation?
                </h3>
                <p className="text-white/70 mb-6">
                  This will delete all your holdings and transactions, and reset your balance to $10,000. This action cannot be undone.
                </p>
                <div className="flex space-x-3">
                  <GlassButton
                    variant="secondary"
                    size="medium"
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </GlassButton>
                  <GlassButton
                    variant="danger"
                    size="medium"
                    onClick={async () => {
                      await resetSimulation();
                      setShowResetConfirm(false);
                    }}
                    className="flex-1"
                  >
                    Reset
                  </GlassButton>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <GlassCard variant="solid" padding="medium" className="bg-red-500/20 border-red-400/30">
              <p className="text-white">⚠️ {error}</p>
            </GlassCard>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SimulationPage;

