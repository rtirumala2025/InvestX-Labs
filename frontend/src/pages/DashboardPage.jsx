import React, { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePortfolio } from '../hooks/usePortfolio';
import { useAlphaVantageData } from '../hooks/useAlphaVantageData';
import { calculatePerformanceMetrics } from '../services/portfolio/portfolioCalculations';
import { logVerificationComplete } from '../utils/verificationLogger';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { SkeletonCard, SkeletonGrid } from '../components/common/SkeletonLoader';
import { MarketProvider } from '../contexts/MarketContext';
import { useApp } from '../contexts/AppContext';

// Lazy load heavy components
const MarketTicker = lazy(() => import('../components/market/MarketTicker'));
const PortfolioChart = lazy(() => import('../components/portfolio/PortfolioChart'));

// Main DashboardPage component wrapped with MarketProvider
export default function DashboardPage() {
  return (
    <MarketProvider>
      <DashboardPageContent />
    </MarketProvider>
  );
}

function DashboardPageContent() {
  const { currentUser } = useAuth();
  const userProfile = currentUser?.profile;
  const { portfolio, holdings, transactions, loading, error } = usePortfolio();
  const { 
    portfolioMetrics: liveMetrics, 
    marketData, 
    loading: marketLoading, 
    error: marketError 
  } = useAlphaVantageData(holdings || []);

  const [selectedChartTimeframe, setSelectedChartTimeframe] = React.useState('1M');

  // Log dashboard data on load
  React.useEffect(() => {
    console.log('🏠 [DashboardPage] Dashboard loaded');
    console.log('🏠 [DashboardPage] Current user:', currentUser?.id || 'Not logged in');
    console.log('🏠 [DashboardPage] User profile:', userProfile ? 'Loaded' : 'Not loaded');
    console.log('🏠 [DashboardPage] Portfolio:', portfolio ? `Found (${portfolio.id})` : 'Not found');
    console.log('🏠 [DashboardPage] Holdings count:', holdings?.length || 0);
    console.log('🏠 [DashboardPage] Loading state:', loading);
    console.log('🏠 [DashboardPage] Error:', error || 'None');
  }, [currentUser, userProfile, portfolio, holdings, loading, error]);
  
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
    console.log('🏠 [DashboardPage] Calculating portfolio metrics...');
    console.log('🏠 [DashboardPage] Live metrics available:', !!liveMetrics);
    console.log('🏠 [DashboardPage] Holdings count:', holdings?.length || 0);
    
    if (liveMetrics && liveMetrics.holdings) {
      // Use live market data calculations
      console.log('🏠 [DashboardPage] ✅ Using live market data for calculations');
      const staticMetrics = calculatePerformanceMetrics(liveMetrics.holdings);
      const result = {
        ...liveMetrics,
        diversificationScore: staticMetrics.diversificationScore || 0
      };
      console.log('🏠 [DashboardPage] 📊 Live metrics result:', {
        totalValue: result.totalValue,
        dayChange: result.dayChange,
        totalGainLoss: result.totalGainLoss
      });
      return result;
    }
    
    // Fallback to static calculations
    if (!holdings || holdings.length === 0) {
      console.log('🏠 [DashboardPage] ⚠️ Empty portfolio - showing zero values');
      return {
        totalValue: 0,
        totalGainLoss: 0,
        totalGainLossPercentage: 0,
        dayChange: 0,
        dayChangePercentage: 0,
        diversificationScore: 0
      };
    }
    
    console.log('🏠 [DashboardPage] 🔄 Using static calculations as fallback');
    const result = calculatePerformanceMetrics(holdings);
    console.log('🏠 [DashboardPage] 📊 Static metrics result:', {
      totalValue: result.totalValue,
      totalGainLoss: result.totalGainLoss
    });
    return result;
  }, [liveMetrics, holdings]);

  const learningProgress = userProfile?.learningProgress || 0;
  
  const { queueToast } = useApp();

  React.useEffect(() => {
    if (error) {
      queueToast(typeof error === 'string' ? error : error.message, 'error');
    }
  }, [error, queueToast]);

  React.useEffect(() => {
    if (marketError) {
      queueToast(`Market data unavailable: ${marketError}`, 'error');
    }
  }, [marketError, queueToast]);

  const quickStats = [
    { 
      label: 'Portfolio Value', 
      value: `$${portfolioMetrics.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
      change: `${portfolioMetrics.totalGainLoss >= 0 ? '+' : ''}$${Math.abs(portfolioMetrics.totalGainLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
      positive: portfolioMetrics.totalGainLoss >= 0 
    },
    { 
      label: 'Today\'s Change', 
      value: `${(portfolioMetrics.dayChange || 0) >= 0 ? '+' : ''}$${Math.abs(portfolioMetrics.dayChange || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
      change: `${(portfolioMetrics.dayChangePercentage || 0) >= 0 ? '+' : ''}${(portfolioMetrics.dayChangePercentage || 0).toFixed(2)}%`, 
      positive: (portfolioMetrics.dayChange || 0) >= 0 
    },
    { 
      label: 'Learning Progress', 
      value: `${learningProgress}%`, 
      change: learningProgress > 0 ? 'In Progress' : 'Get Started', 
      positive: learningProgress > 0 
    },
    { 
      label: 'Holdings', 
      value: holdings?.length || 0, 
      change: holdings?.length > 0 ? 'Diversified' : 'Add Holdings', 
      positive: (holdings?.length || 0) > 0 
    }
  ];
  
  // Log final dashboard values being displayed
  React.useEffect(() => {
    console.log('🏠 [DashboardPage] 📊 Final values being displayed:');
    quickStats.forEach(stat => {
      console.log(`🏠 [DashboardPage]   ${stat.label}: ${stat.value} (${stat.change})`);
    });
    
    // Log verification complete when data is fully loaded
    if (!loading && !error && portfolioMetrics) {
      setTimeout(() => {
        logVerificationComplete();
      }, 1000); // Delay to ensure all components have rendered
    }
  }, [portfolioMetrics, learningProgress, holdings?.length, loading, error]);

  // Generate recent activity from actual portfolio data
  const recentActivity = React.useMemo(() => {
    if (transactions && transactions.length > 0) {
      return transactions
        .sort((a, b) => new Date(b.transaction_date || b.created_at) - new Date(a.transaction_date || a.created_at))
        .slice(0, 5)
        .map((transaction) => {
          const isBuy = transaction.transaction_type === 'buy';
          const shares = Number(transaction.shares) || 0;
          const price = Number(transaction.price) || 0;
          const totalAmount = Math.abs(Number(transaction.total_amount) || shares * price);
          return {
            type: 'investment',
            title: `${isBuy ? 'Bought' : 'Sold'} ${shares.toFixed(2)} ${transaction.symbol}`,
            time: formatTimeAgo(transaction.transaction_date || transaction.created_at),
            amount: `${isBuy ? '-' : '+'}$${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            positive: !isBuy,
          };
        });
    }

    if (userProfile?.completedLessons && userProfile.completedLessons.length > 0) {
      return userProfile.completedLessons
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
        .slice(0, 3)
        .map((lesson) => ({
          type: 'learning',
          title: `Completed "${lesson.title}" lesson`,
          time: formatTimeAgo(lesson.completedAt),
          amount: '+50 XP',
          positive: true,
        }));
    }

    return [
      {
        type: 'welcome',
        title: 'Welcome to InvestX Labs!',
        time: 'Just now',
        amount: 'Get Started',
        positive: true,
      },
    ];
  }, [transactions, userProfile]);

  // Helper function to format time ago
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  };

  const quickActions = [
    { title: 'Add Investment', description: 'Buy stocks or ETFs', icon: '📈', link: '/portfolio', color: 'from-green-500 to-emerald-600' },
    { title: 'Learn More', description: 'Continue your education', icon: '📚', link: '/education', color: 'from-primary-500 to-primary-600' },
    { title: 'AI Insights', description: 'Get personalized suggestions', icon: '🤖', link: '/suggestions', color: 'from-accent-500 to-accent-600' },
    { title: 'Chat Support', description: 'Ask questions anytime', icon: '💬', link: '/chat', color: 'from-primary-500 to-primary-600' }
  ];

  // Task 19: Skeleton loaders instead of spinner
  if (loading) {
    console.log('🏠 [DashboardPage] ⏳ Showing loading state');
    return (
      <div className="relative min-h-screen overflow-hidden" style={{ 
        background: 'var(--bg-base, #0a0f1a)',
        backgroundImage: 'var(--bg-gradient-primary), var(--bg-pattern-grid), var(--bg-pattern-noise)',
        backgroundSize: '100% 100%, 60px 60px, 400px 400px',
        backgroundAttachment: 'fixed'
      }}>
        <main className="relative z-10 w-full max-w-[1920px] mx-auto px-3 lg:px-4 xl:px-6 py-4 lg:py-6">
          <div className="mb-6">
            <div className="h-10 bg-white/20 rounded w-64 mb-4 animate-pulse"></div>
            <div className="h-4 bg-white/10 rounded w-96 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SkeletonCard className="h-64" />
            </div>
            <div>
              <SkeletonCard className="h-64" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    console.log('🏠 [DashboardPage] ❌ Showing error state:', error);
    const errorMessage = typeof error === 'string' ? error : error.message || 'An error occurred while loading your dashboard';
    const isNetworkError = errorMessage.includes('Network') || errorMessage.includes('fetch') || errorMessage.includes('connection');
    
    return (
      <div className="relative min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white overflow-hidden flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Unable to Load Dashboard</h2>
          <p className="text-gray-300 mb-4">{errorMessage}</p>
          {isNetworkError && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4 text-left">
              <p className="text-sm text-yellow-300 mb-2 font-semibold">Troubleshooting:</p>
              <ul className="text-xs text-yellow-200/80 space-y-1 list-disc list-inside">
                <li>Check your internet connection</li>
                <li>Verify Supabase environment variables are set correctly</li>
                <li>Check browser console for detailed error messages</li>
                <li>Try refreshing the page</li>
              </ul>
            </div>
          )}
          <div className="flex gap-3 justify-center">
            <GlassButton onClick={() => window.location.reload()} variant="primary">
              Try Again
            </GlassButton>
            <GlassButton onClick={() => window.location.href = '/'} variant="glass">
              Go Home
            </GlassButton>
          </div>
        </div>
      </div>
    );
  }

  // Empty state when no portfolio data
  const hasNoData = !loading && !error && (!portfolio || !holdings || holdings.length === 0);

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ 
      background: 'var(--bg-base, #0a0f1a)',
      backgroundImage: 'var(--bg-gradient-primary), var(--bg-pattern-grid), var(--bg-pattern-noise)',
      backgroundSize: '100% 100%, 60px 60px, 400px 400px',
      backgroundAttachment: 'fixed'
    }}>
      {/* Enhanced Background Orbs - Growth themed */}
      <motion.div
        className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-r from-primary-500/30 to-primary-600/20 rounded-full blur-3xl"
        animate={{ y: [0, 20, 0], x: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 15, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-40 -right-32 w-[28rem] h-[28rem] bg-gradient-to-r from-accent-500/25 to-accent-600/15 rounded-full blur-3xl"
        animate={{ y: [0, -25, 0], x: [0, -15, 0] }}
        transition={{ repeat: Infinity, duration: 20, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-primary-400/20 to-accent-400/15 rounded-full blur-3xl"
        animate={{ y: [0, 15, 0], x: [0, 20, 0] }}
        transition={{ repeat: Infinity, duration: 18, ease: 'easeInOut', delay: 5 }}
      />

      <main className="relative z-10 w-full max-w-[1920px] mx-auto px-3 lg:px-4 xl:px-6 py-4 lg:py-6">
        {/* Header */}
        <motion.div 
          variants={fadeIn} 
          initial="hidden" 
          animate="visible" 
          className="mb-4 lg:mb-6"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-normal tracking-tight text-gradient-hero mb-2">
                Welcome back, {userProfile?.full_name?.split(' ')[0] || currentUser?.user_metadata?.full_name?.split(' ')[0] || currentUser?.email?.split('@')[0] || 'Investor'}! 👋
              </h1>
              <p className="text-neutral-300 text-base lg:text-lg font-sans">Here's your investment journey overview</p>
            </div>
            <div className="mt-4 md:mt-0">
              <GlassButton as={Link} to="/profile" variant="glass" size="default">
                Edit Profile
              </GlassButton>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats Grid */}
        <motion.div 
          variants={staggerChildren}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-4 lg:mb-6"
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
                <p className={`text-sm font-mono ${stat.positive ? 'text-primary-400' : 'text-red-400'}`}>
                  {stat.change}
                </p>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
        
        {/* Market Ticker - Lazy loaded */}
        <motion.div 
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="mb-6"
        >
          <Suspense fallback={<div className="h-16 bg-white/5 rounded-lg animate-pulse" />}>
            <MarketTicker />
          </Suspense>
        </motion.div>
        
        {/* Empty State for No Portfolio */}
        {hasNoData && (
          <motion.div variants={fadeIn} initial="hidden" animate="visible" className="flex justify-center py-20">
            <GlassCard variant="default" padding="large" className="max-w-md text-center">
              <div className="text-6xl mb-4">📊</div>
              <h2 className="text-2xl font-display font-normal text-white mb-3">Start Building Your Portfolio</h2>
              <p className="text-white/70 mb-6 font-sans">
                You haven't added any investments yet. Add your first holding to track your portfolio performance and see insights.
              </p>
              <GlassButton as={Link} to="/portfolio" variant="primary" size="default">
                Add Your First Investment
              </GlassButton>
            </GlassCard>
          </motion.div>
        )}

        {!hasNoData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-4 lg:space-y-6">
              {/* Portfolio Performance Chart */}
              <motion.div variants={fadeIn} initial="hidden" animate="visible">
                <GlassCard variant="hero" padding="large" shadow="xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                    <h2 className="text-2xl font-display font-normal text-white">Portfolio Performance</h2>
                    <div className="flex flex-wrap gap-2">
                      {['1D', '1W', '1M', '3M', '1Y', 'ALL'].map((period) => (
                        <button 
                          key={period}
                          onClick={() => setSelectedChartTimeframe(period)}
                          className={`px-3 py-1 text-sm rounded-lg transition-all ${
                            period === selectedChartTimeframe 
                              ? 'bg-primary-500/30 text-white border border-primary-500/50' 
                              : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/20 border border-transparent'
                          }`}
                        >
                          {period}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Suspense fallback={
                    <div className="h-80 flex items-center justify-center">
                      <LoadingSpinner size="large" />
                    </div>
                  }>
                    <PortfolioChart
                      portfolio={portfolio}
                      holdings={holdings}
                      transactions={transactions}
                      marketData={marketData}
                      timeframe={selectedChartTimeframe}
                      loading={loading || marketLoading}
                      error={error || marketError}
                    />
                  </Suspense>
              </GlassCard>
            </motion.div>

            {/* Recent Activity */}
            <motion.div variants={fadeIn} initial="hidden" animate="visible">
              <GlassCard variant="default" padding="large" shadow="large">
                <h2 className="text-2xl font-display font-normal text-white mb-6">Recent Activity</h2>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          activity.type === 'investment' ? 'bg-primary-500/20 text-primary-400' :
                          activity.type === 'learning' ? 'bg-primary-500/20 text-primary-400' :
                          activity.type === 'suggestion' ? 'bg-accent-500/20 text-accent-400' :
                          'bg-accent-500/20 text-accent-400'
                        }`}>
                          {activity.type === 'investment' ? '💰' :
                           activity.type === 'learning' ? '📚' :
                           activity.type === 'suggestion' ? '🤖' : '🏆'}
                        </div>
                        <div className="ml-4">
                          <p className="text-white font-medium">{activity.title}</p>
                          <p className="text-white/60 text-sm">{activity.time}</p>
                        </div>
                      </div>
                      <span className={`font-medium ${
                        activity.positive === true ? 'text-primary-400' :
                        activity.positive === false ? 'text-red-400' : 'text-accent-400'
                      }`}>
                        {activity.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Learning Progress */}
            <motion.div variants={fadeIn} initial="hidden" animate="visible">
              <GlassCard variant="accent" padding="large" glow={true}>
                <h3 className="text-xl font-semibold text-white mb-4">Learning Progress</h3>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/90">Overall Progress</span>
                    <span className="text-white">{learningProgress}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-primary-400 to-accent-500 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${learningProgress}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  {userProfile?.completedLessons && userProfile.completedLessons.length > 0 ? (
                    userProfile.completedLessons.slice(0, 3).map((lesson, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-white/80">{lesson.title}</span>
                        <span className="text-green-400 text-sm">✓ Complete</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-white/60 text-sm mb-2">No lessons completed yet</p>
                      <p className="text-white/40 text-xs">Start learning to track your progress</p>
                    </div>
                  )}
                </div>
                <GlassButton as={Link} to="/education" variant="glass" className="w-full mt-4">
                  Continue Learning
                </GlassButton>
              </GlassCard>
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={fadeIn} initial="hidden" animate="visible">
              <GlassCard variant="default" padding="large">
                <h3 className="text-xl font-semibold text-white mb-6">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-4">
                  {quickActions.map((action, index) => (
                    <GlassButton
                      key={index}
                      as={Link}
                      to={action.link}
                      variant="glass"
                      className="p-4 h-auto flex-col items-center text-center group"
                    >
                      <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">
                        {action.icon}
                      </div>
                      <div className="text-sm font-medium text-white mb-1">{action.title}</div>
                      <div className="text-xs text-white/60">{action.description}</div>
                    </GlassButton>
                  ))}
                </div>
              </GlassCard>
            </motion.div>

            {/* AI Suggestions Preview */}
            <motion.div variants={fadeIn} initial="hidden" animate="visible">
              <GlassCard variant="floating" padding="large" interactive={true}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">AI Insights</h3>
                  <span className="px-2 py-1 bg-purple-500/30 text-purple-300 text-xs rounded-full">
                    {holdings && holdings.length > 0 ? 'Active' : 'Pending'}
                  </span>
                </div>
                <div className="space-y-3">
                  {holdings && holdings.length > 0 ? (
                    <>
                      {portfolioMetrics.diversificationScore < 50 && (
                        <div className="p-3 bg-gradient-to-r from-accent-500/10 to-primary-500/10 rounded-lg border border-accent-500/20">
                          <h4 className="text-sm font-medium text-white mb-1">Diversification Opportunity</h4>
                          <p className="text-xs text-white/70">Consider adding more sectors to reduce risk</p>
                        </div>
                      )}
                      {portfolioMetrics.sectorAllocation && Object.values(portfolioMetrics.sectorAllocation).some(allocation => allocation > 60) && (
                        <div className="p-3 bg-gradient-to-r from-primary-500/10 to-primary-600/10 rounded-lg border border-primary-500/20">
                          <h4 className="text-sm font-medium text-white mb-1">Concentration Risk</h4>
                          <p className="text-xs text-white/70">One sector represents over 60% of your portfolio</p>
                        </div>
                      )}
                      {portfolioMetrics.totalGainLossPercentage > 10 && (
                        <div className="p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
                          <h4 className="text-sm font-medium text-white mb-1">Great Performance!</h4>
                          <p className="text-xs text-white/70">Your portfolio is outperforming expectations</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-3 bg-gradient-to-r from-primary-500/10 to-accent-500/10 rounded-lg border border-primary-500/20">
                      <h4 className="text-sm font-medium text-white mb-1">Get Started</h4>
                      <p className="text-xs text-white/70">Add your first investment to receive personalized insights</p>
                    </div>
                  )}
                </div>
                <GlassButton as={Link} to="/suggestions" variant="accent" className="w-full mt-4">
                  View All Insights
                </GlassButton>
              </GlassCard>
            </motion.div>
          </div>
        </div>
        )}
      </main>
    </div>
  );
}