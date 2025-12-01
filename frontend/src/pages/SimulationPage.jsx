import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimulation } from '../contexts/SimulationContext';
import { useAchievements } from '../contexts/AchievementsContext';
import { useAlphaVantageData } from '../hooks/useAlphaVantageData';
import { calculatePortfolioPerformance, recordPortfolioSnapshot, updatePortfolioPerformance } from '../services/simulation/portfolioEngine';
import { getTradeCoaching, getPortfolioReviewCoaching } from '../services/simulation/aiCoachingService';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StockSearch from '../components/simulation/StockSearch';
import OrderForm from '../components/simulation/OrderForm';
import HoldingsList from '../components/simulation/HoldingsList';
import PerformanceChart from '../components/simulation/PerformanceChart';
import SimulationPortfolioChart from '../components/simulation/SimulationPortfolioChart';
import AchievementBadges from '../components/simulation/AchievementBadges';
import SimulationSettings from '../components/simulation/SimulationSettings';
import TransactionHistory from '../components/simulation/TransactionHistory';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Trophy, Settings as SettingsIcon } from 'lucide-react';

const SimulationPage = () => {
  const { 
    portfolio, 
    virtualBalance, 
    holdings, 
    transactions, 
    loading, 
    error,
    resetSimulation,
    undoLastTrade,
    canUndo,
    undoStack,
    buyStock,
    sellStock
  } = useSimulation();

  const { achievements } = useAchievements();
  const { portfolioMetrics, marketData } = useAlphaVantageData(holdings || []);

  const [activeTab, setActiveTab] = useState('trade');
  const [selectedStock, setSelectedStock] = useState(null);
  const [aiCoaching, setAiCoaching] = useState(null);
  const [portfolioReview, setPortfolioReview] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Calculate enhanced performance metrics
  const performance = useMemo(() => {
    if (!portfolio || !holdings) {
      return null;
    }
    return calculatePortfolioPerformance(portfolio, holdings, marketData || {});
  }, [portfolio, holdings, marketData]);

  // Record portfolio snapshot periodically
  useEffect(() => {
    if (!portfolio?.id || !performance) return;

    const interval = setInterval(async () => {
      try {
        await recordPortfolioSnapshot(portfolio.id, performance);
        await updatePortfolioPerformance(portfolio.id, performance);
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Error recording portfolio snapshot:', error);
      }
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [portfolio?.id, performance]);

  // Get portfolio review coaching
  useEffect(() => {
    if (activeTab === 'portfolio' && performance && !portfolioReview) {
      getPortfolioReviewCoaching(performance, {}).then(setPortfolioReview);
    }
  }, [activeTab, performance, portfolioReview]);

  // Handle stock selection
  const handleStockSelect = async (stock) => {
    setSelectedStock(stock);
    if (stock) {
      // Get AI coaching for the selected stock
      const coaching = await getTradeCoaching(
        {
          action: 'buy',
          symbol: stock.symbol,
          shares: 0,
          price: stock.price,
          companyName: stock.name
        },
        {
          holdings,
          totalValue: performance?.totalValue || 0,
          virtualBalance,
          riskTolerance: 'moderate'
        },
        {}
      );
      setAiCoaching(coaching);
    }
  };

  // Handle trade completion
  const handleTradeComplete = async (result) => {
    if (result.success) {
      setSelectedStock(null);
      setAiCoaching(null);
      // Refresh portfolio review
      if (performance) {
        const newReview = await getPortfolioReviewCoaching(performance, {});
        setPortfolioReview(newReview);
      }
    }
  };

  // Handle sell from holdings list
  const handleSellFromHoldings = (holding) => {
    setSelectedStock({
      symbol: holding.symbol,
      name: holding.company_name || holding.symbol,
      price: holding.currentPrice || holding.purchase_price
    });
    setActiveTab('trade');
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
  };

  if (loading && !portfolio) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  const totalValue = performance?.totalValue || virtualBalance || 10000;
  const totalReturn = performance?.totalReturn || 0;
  const totalReturnPercent = performance?.totalReturnPercent || 0;
  const dailyChange = performance?.dailyChange || 0;
  const dailyChangePercent = performance?.dailyChangePercent || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 py-4 lg:py-6">
      <div className="w-full max-w-[1920px] mx-auto px-3 lg:px-4 xl:px-6">
        {/* Header with PRACTICE MODE badge */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="mb-4 lg:mb-6"
        >
          <div className="flex items-center justify-between mb-3 flex-wrap gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                  🎮 Simulation Mode
                </h1>
                <span className="px-3 py-1 bg-yellow-500/20 border border-yellow-400/30 rounded-lg text-yellow-300 text-sm font-semibold">
                  PRACTICE MODE
                </span>
              </div>
              <p className="text-white/70">
                Practice trading with $10,000 virtual money using real market data
              </p>
            </div>
            <div className="flex gap-3">
              {canUndo && undoStack.length > 0 && (
                <GlassButton
                  variant="glass"
                  size="small"
                  onClick={undoLastTrade}
                >
                  ↶ Undo ({Math.max(0, Math.ceil((60000 - (Date.now() - undoStack[undoStack.length - 1].timestamp)) / 1000))}s)
                </GlassButton>
              )}
              <GlassButton
                variant="secondary"
                size="small"
                onClick={() => setShowSettings(true)}
              >
                <SettingsIcon className="w-4 h-4 mr-2" />
                Settings
              </GlassButton>
            </div>
          </div>

          {/* Enhanced Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6">
            <GlassCard variant="floating" padding="medium">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-white/60" />
                <p className="text-white/70 text-sm">Cash</p>
              </div>
              <p className="text-white text-2xl font-bold">
                ${virtualBalance.toFixed(2)}
              </p>
            </GlassCard>

            <GlassCard variant="floating" padding="medium">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-white/60" />
                <p className="text-white/70 text-sm">Portfolio</p>
              </div>
              <p className="text-white text-2xl font-bold">
                ${totalValue.toFixed(2)}
              </p>
            </GlassCard>

            <GlassCard variant="floating" padding="medium">
              <div className="flex items-center gap-2 mb-1">
                {totalReturn >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                )}
                <p className="text-white/70 text-sm">Total Return</p>
              </div>
              <p className={`text-2xl font-bold ${totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {totalReturn >= 0 ? '+' : ''}${totalReturn.toFixed(2)}
              </p>
              <p className={`text-sm ${totalReturnPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {totalReturnPercent >= 0 ? '+' : ''}{totalReturnPercent.toFixed(2)}%
              </p>
            </GlassCard>

            <GlassCard variant="floating" padding="medium">
              <div className="flex items-center gap-2 mb-1">
                {dailyChange >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                )}
                <p className="text-white/70 text-sm">Today</p>
              </div>
              <p className={`text-xl font-bold ${dailyChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {dailyChange >= 0 ? '+' : ''}${dailyChange.toFixed(2)}
              </p>
              <p className={`text-xs ${dailyChangePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {dailyChangePercent >= 0 ? '+' : ''}{dailyChangePercent.toFixed(2)}%
              </p>
            </GlassCard>

            <GlassCard variant="floating" padding="medium">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-4 h-4 text-white/60" />
                <p className="text-white/70 text-sm">Achievements</p>
              </div>
              <p className="text-white text-2xl font-bold">
                {achievements?.filter(a => (a.type || a.badge_id || '').startsWith('simulation_')).length || 0}
              </p>
            </GlassCard>

            <GlassCard variant="floating" padding="medium">
              <p className="text-white/70 text-sm mb-1">Positions</p>
              <p className="text-white text-2xl font-bold">
                {holdings?.length || 0}
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
                <p className="text-white font-medium mb-1">Educational Simulation - No Real Money</p>
                <p className="text-white/80 text-sm">
                  This is a learning environment using real market data but virtual money. 
                  All trades are simulated and no real money is involved. Use this to practice 
                  strategies before investing real money. This is for educational purposes only.
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
          <div className="flex space-x-2 bg-white/5 rounded-lg p-1 overflow-x-auto">
            {[
              { id: 'trade', label: '📈 Trade', icon: '📈' },
              { id: 'portfolio', label: '💼 Portfolio', icon: '💼' },
              { id: 'performance', label: '📊 Performance', icon: '📊' },
              { id: 'achievements', label: '🏅 Achievements', icon: '🏅' },
              { id: 'history', label: '📋 History', icon: '📋' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white/20 text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'trade' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <StockSearch onStockSelect={handleStockSelect} selectedSymbol={selectedStock?.symbol} />
                  {selectedStock && (
                    <OrderForm 
                      stock={selectedStock} 
                      onTradeComplete={handleTradeComplete}
                    />
                  )}
                </div>
                <div className="space-y-6">
                  {aiCoaching && (
                    <GlassCard variant="floating" padding="large" className="bg-blue-500/10 border-blue-400/20">
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">🤖</span>
                        <div>
                          <h4 className="text-white font-semibold mb-2">AI Trading Coach</h4>
                          <p className="text-white/80 text-sm whitespace-pre-line">{aiCoaching}</p>
                        </div>
                      </div>
                    </GlassCard>
                  )}
                  <HoldingsList 
                    holdings={holdings} 
                    marketData={marketData}
                    onSellClick={handleSellFromHoldings}
                  />
                </div>
              </div>
            )}

            {activeTab === 'portfolio' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SimulationPortfolioChart 
                    holdings={holdings}
                    portfolioMetrics={performance}
                    marketData={marketData}
                  />
                  <HoldingsList 
                    holdings={holdings} 
                    marketData={marketData}
                    onSellClick={handleSellFromHoldings}
                  />
                </div>
                {portfolioReview && (
                  <GlassCard variant="floating" padding="large" className="bg-purple-500/10 border-purple-400/20">
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">🤖</span>
                      <div>
                        <h4 className="text-white font-semibold mb-2">AI Portfolio Review</h4>
                        <p className="text-white/80 text-sm whitespace-pre-line">{portfolioReview}</p>
                      </div>
                    </div>
                  </GlassCard>
                )}
              </div>
            )}

            {activeTab === 'performance' && (
              <div className="space-y-6">
                <PerformanceChart 
                  portfolioId={portfolio?.id}
                  currentValue={totalValue}
                />
                {performance && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <GlassCard variant="floating" padding="medium">
                      <p className="text-white/60 text-sm mb-1">All-Time High</p>
                      <p className="text-white text-xl font-bold">
                        ${(performance.allTimeHigh || totalValue).toFixed(2)}
                      </p>
                    </GlassCard>
                    <GlassCard variant="floating" padding="medium">
                      <p className="text-white/60 text-sm mb-1">Max Drawdown</p>
                      <p className="text-white text-xl font-bold">
                        {performance.maxDrawdown?.toFixed(2) || '0.00'}%
                      </p>
                    </GlassCard>
                    <GlassCard variant="floating" padding="medium">
                      <p className="text-white/60 text-sm mb-1">Holdings Value</p>
                      <p className="text-white text-xl font-bold">
                        ${(performance.holdingsValue || 0).toFixed(2)}
                      </p>
                    </GlassCard>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'achievements' && (
              <AchievementBadges achievements={achievements} />
            )}

            {activeTab === 'history' && (
              <TransactionHistory transactions={transactions} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl w-full"
            >
              <SimulationSettings />
              <div className="mt-4 text-center">
                <GlassButton
                  variant="secondary"
                  onClick={() => setShowSettings(false)}
                >
                  Close
                </GlassButton>
              </div>
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
