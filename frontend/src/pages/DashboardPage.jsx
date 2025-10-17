import React from 'react';
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

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const userProfile = currentUser?.profile;
  const { portfolio, holdings, loading, error } = usePortfolio();
  const { 
    portfolioMetrics: liveMetrics, 
    marketData, 
    loading: marketLoading, 
    error: marketError 
  } = useAlphaVantageData(holdings || []);
  
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
    const activities = [];
    
    // Add recent holdings as activities
    if (holdings && holdings.length > 0) {
      const recentHoldings = holdings
        .filter(holding => holding.createdAt || holding.addedAt)
        .sort((a, b) => new Date(b.createdAt || b.addedAt) - new Date(a.createdAt || a.addedAt))
        .slice(0, 3);
      
      recentHoldings.forEach(holding => {
        const value = holding.shares * holding.currentPrice;
        activities.push({
          type: 'investment',
          title: `Added ${holding.symbol} to portfolio`,
          time: formatTimeAgo(holding.createdAt || holding.addedAt),
          amount: `+$${value.toLocaleString()}`,
          positive: true
        });
      });
    }
    
    // Add learning activities if available
    if (userProfile?.completedLessons && userProfile.completedLessons.length > 0) {
      const recentLessons = userProfile.completedLessons
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
        .slice(0, 2);
      
      recentLessons.forEach(lesson => {
        activities.push({
          type: 'learning',
          title: `Completed "${lesson.title}" lesson`,
          time: formatTimeAgo(lesson.completedAt),
          amount: '+50 XP',
          positive: true
        });
      });
    }
    
    // If no activities, show empty state message
    if (activities.length === 0) {
      activities.push({
        type: 'welcome',
        title: 'Welcome to InvestX Labs!',
        time: 'Just now',
        amount: 'Get Started',
        positive: true
      });
    }
    
    return activities.slice(0, 4); // Limit to 4 items
  }, [holdings, userProfile]);

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
    { title: 'Learn More', description: 'Continue your education', icon: '📚', link: '/education', color: 'from-blue-500 to-cyan-600' },
    { title: 'AI Insights', description: 'Get personalized suggestions', icon: '🤖', link: '/suggestions', color: 'from-purple-500 to-violet-600' },
    { title: 'Chat Support', description: 'Ask questions anytime', icon: '💬', link: '/chat', color: 'from-orange-500 to-red-500' }
  ];

  if (loading) {
    console.log('🏠 [DashboardPage] ⏳ Showing loading state');
    return (
      <div className="relative min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-300">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.log('🏠 [DashboardPage] ❌ Showing error state:', error);
    return (
      <div className="relative min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Unable to Load Dashboard</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <GlassButton onClick={() => window.location.reload()} variant="primary">
            Try Again
          </GlassButton>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white overflow-hidden">
      {/* Enhanced Background Orbs */}
      <motion.div
        className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-r from-blue-500/30 to-purple-500/20 rounded-full blur-3xl"
        animate={{ y: [0, 20, 0], x: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 15, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-40 -right-32 w-[28rem] h-[28rem] bg-gradient-to-r from-orange-400/25 to-pink-400/15 rounded-full blur-3xl"
        animate={{ y: [0, -25, 0], x: [0, -15, 0] }}
        transition={{ repeat: Infinity, duration: 20, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-green-400/20 to-blue-400/15 rounded-full blur-3xl"
        animate={{ y: [0, 15, 0], x: [0, 20, 0] }}
        transition={{ repeat: Infinity, duration: 18, ease: 'easeInOut', delay: 5 }}
      />

      <main className="relative z-10 max-w-[1400px] mx-auto px-6 py-8">
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
                Welcome back, {currentUser?.displayName?.split(' ')[0] || userProfile?.firstName || 'Investor'}! 👋
              </h1>
              <p className="text-gray-300 text-lg">Here's your investment journey overview</p>
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
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Portfolio Performance Chart */}
            <motion.div variants={fadeIn} initial="hidden" animate="visible">
              <GlassCard variant="hero" padding="large" shadow="xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-white">Portfolio Performance</h2>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 text-sm bg-white/10 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-all">1D</button>
                    <button className="px-3 py-1 text-sm bg-blue-500/30 rounded-lg text-white">1W</button>
                    <button className="px-3 py-1 text-sm bg-white/10 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-all">1M</button>
                    <button className="px-3 py-1 text-sm bg-white/10 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-all">1Y</button>
                  </div>
                </div>
                <div className="h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl border border-white/10 flex items-center justify-center backdrop-blur-sm">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📈</div>
                    <p className="text-white/70">Interactive chart will be displayed here</p>
                    <p className="text-white/50 text-sm mt-1">Connect your portfolio to see real data</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {/* Recent Activity */}
            <motion.div variants={fadeIn} initial="hidden" animate="visible">
              <GlassCard variant="default" padding="large" shadow="large">
                <h2 className="text-2xl font-semibold text-white mb-6">Recent Activity</h2>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          activity.type === 'investment' ? 'bg-green-500/20 text-green-400' :
                          activity.type === 'learning' ? 'bg-blue-500/20 text-blue-400' :
                          activity.type === 'suggestion' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-orange-500/20 text-orange-400'
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
                        activity.positive === true ? 'text-green-400' :
                        activity.positive === false ? 'text-red-400' : 'text-blue-400'
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
                      className="bg-gradient-to-r from-blue-400 to-purple-500 h-3 rounded-full transition-all duration-1000"
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
                        <div className="p-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-500/20">
                          <h4 className="text-sm font-medium text-white mb-1">Diversification Opportunity</h4>
                          <p className="text-xs text-white/70">Consider adding more sectors to reduce risk</p>
                        </div>
                      )}
                      {portfolioMetrics.sectorAllocation && Object.values(portfolioMetrics.sectorAllocation).some(allocation => allocation > 60) && (
                        <div className="p-3 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-lg border border-orange-500/20">
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
                    <div className="p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
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
      </main>
    </div>
  );
}