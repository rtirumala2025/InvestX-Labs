import React, { Suspense, lazy, useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePortfolio } from '../hooks/usePortfolio';
import { useAlphaVantageData } from '../hooks/useAlphaVantageData';
import { useEducation } from '../contexts/EducationContext';
import { calculatePerformanceMetrics } from '../services/portfolio/portfolioCalculations';
import { logVerificationComplete } from '../utils/verificationLogger';
import { MarketProvider } from '../contexts/MarketContext';
import { useApp } from '../contexts/AppContext';
import { useLeaderboard } from '../contexts/LeaderboardContext';

import { ThemeProvider } from '../lovable/hooks/useTheme';
import { AppLayout } from '../lovable/components/layout/AppLayout';
import { TopBar } from '../lovable/components/layout/TopBar';
import { MarketTicker } from '../lovable/components/dashboard/MarketTicker';
import { QuickStats } from '../lovable/components/dashboard/QuickStats';
import { PortfolioChart } from '../lovable/components/dashboard/PortfolioChart';
import { QuickActions } from '../lovable/components/dashboard/QuickActions';
import { RecentActivity as LovableRecentActivity } from '../lovable/components/dashboard/RecentActivity';
import { LeaderboardWidget as LovableLeaderboardWidget } from '../lovable/components/dashboard/LeaderboardWidget';
import { LearningProgress as LovableLearningProgress } from '../lovable/components/dashboard/LearningProgress';

export default function DashboardPage() {
  return (
    <MarketProvider>
      <ThemeProvider>
        <DashboardPageContent />
      </ThemeProvider>
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
  const { progress: educationProgress, lessons } = useEducation();
  const { leaderboard } = useLeaderboard();

  const [selectedChartTimeframe, setSelectedChartTimeframe] = useState('1M');

  // Log dashboard data on load
  useEffect(() => {
    console.log('🏠 [DashboardPage] Dashboard loaded');
    console.log('🏠 [DashboardPage] Current user:', currentUser?.id || 'Not logged in');
    console.log('🏠 [DashboardPage] User profile:', userProfile ? 'Loaded' : 'Not loaded');
    console.log('🏠 [DashboardPage] Portfolio:', portfolio ? `Found (${portfolio.id})` : 'Not found');
    console.log('🏠 [DashboardPage] Holdings count:', holdings?.length || 0);
    console.log('🏠 [DashboardPage] Loading state:', loading);
    console.log('🏠 [DashboardPage] Error:', error || 'None');
  }, [currentUser, userProfile, portfolio, holdings, loading, error]);

  // Use live market data if available, fallback to static calculations
  const portfolioMetrics = useMemo(() => {
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
    // Ensure dayChange fields are present (will be 0 without market data)
    const staticResult = {
      ...result,
      dayChange: 0,
      dayChangePercentage: 0
    };
    console.log('🏠 [DashboardPage] 📊 Static metrics result:', {
      totalValue: staticResult.totalValue,
      totalGainLoss: staticResult.totalGainLoss,
      dayChange: staticResult.dayChange
    });
    return staticResult;
  }, [liveMetrics, holdings]);

  // Calculate learning progress from education context
  const learningProgress = useMemo(() => {
    if (!educationProgress || !lessons) return 0;
    
    // Count total lessons across all modules
    const totalLessons = Object.values(lessons).reduce((total, moduleLessons) => {
      return total + (Array.isArray(moduleLessons) ? moduleLessons.length : 0);
    }, 0);
    
    if (totalLessons === 0) return 0;
    
    // Count completed lessons
    const completedLessons = Object.values(educationProgress).filter(
      status => status === 'completed'
    ).length;
    
    // Calculate percentage
    const percentage = Math.round((completedLessons / totalLessons) * 100);
    return Math.min(100, Math.max(0, percentage));
  }, [educationProgress, lessons]);
  
  const { queueToast } = useApp();

  useEffect(() => {
    if (error) {
      queueToast(typeof error === 'string' ? error : error.message, 'error');
    }
  }, [error, queueToast]);

  useEffect(() => {
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
  const recentActivity = useMemo(() => {
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

  const hasNoData = !loading && !error && (!portfolio || !holdings || holdings.length === 0);

  const quickStatsData = {
    totalValue: portfolioMetrics.totalValue || 0,
    dayChange: portfolioMetrics.dayChange || 0,
    dayChangePercent: portfolioMetrics.dayChangePercentage || 0,
    totalGain: portfolioMetrics.totalGainLoss || 0,
    totalGainPercent: portfolioMetrics.totalGainLossPercentage || 0,
    holdingsCount: holdings?.length || 0,
  };

  const tickerItems = useMemo(() => {
    if (!marketData) return [];
    return Object.entries(marketData).map(([symbol, data]) => ({
      symbol,
      price: Number(data.price) || 0,
      change: Number(data.change) || 0,
      changePercent: Number(data.changePercent) || 0,
    }));
  }, [marketData]);

  const chartData = useMemo(() => {
    const total = portfolioMetrics.totalValue || 0;
    const gainPct = portfolioMetrics.totalGainLossPercentage || 0;
    if (!total) return [];
    const startValue = total / (1 + (gainPct / 100 || 0));
    const steps = 30;
    return Array.from({ length: steps }, (_, i) => ({
      date: `${i + 1}`,
      value: startValue + ((total - startValue) * i) / (steps - 1),
    }));
  }, [portfolioMetrics]);

  const lovableRecentActivityItems = recentActivity.map((activity, index) => ({
    id: String(index),
    type:
      activity.type === 'learning'
        ? 'lesson'
        : activity.type === 'welcome'
        ? 'achievement'
        : activity.positive
        ? 'buy'
        : 'sell',
    title: activity.title,
    description: activity.amount,
    timestamp: activity.time,
    value: activity.amount,
  }));

  const leaderboardEntries = useMemo(() => {
    if (!leaderboard || !leaderboard.entries) return [];
    return leaderboard.entries.map((entry, index) => ({
      rank: index + 1,
      name: entry.display_name || entry.username || 'Investor',
      returns: entry.return_percentage || 0,
      isCurrentUser: entry.isCurrentUser,
    }));
  }, [leaderboard]);

  const learningProgressProps = {
    completedLessons:
      userProfile?.completedLessons?.length || 0,
    totalLessons:
      Object.values(lessons || {}).reduce(
        (total, moduleLessons) =>
          total + (Array.isArray(moduleLessons) ? moduleLessons.length : 0),
        0
      ) || 0,
    currentCourse: undefined,
    currentLesson: undefined,
    percentComplete: learningProgress,
  };

  const titleName =
    userProfile?.full_name?.split(' ')[0] ||
    currentUser?.user_metadata?.full_name?.split(' ')[0] ||
    currentUser?.email?.split('@')[0] ||
    'Investor';

  if (loading) {
    console.log('🏠 [DashboardPage] ⏳ Showing loading state');
  }

  if (error) {
    console.log('🏠 [DashboardPage] ❌ Error state:', error);
  }

  return (
    <AppLayout>
      <MarketTicker items={tickerItems} />
      <TopBar
        title="Dashboard"
        subtitle={`Welcome back, ${titleName}`}
      />

      <div className="p-8 space-y-8">
        {/* Welcome Banner */}
        <div className="glass-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 opacity-0 animate-in">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-teal-400 shadow-lg shadow-primary/25">
              {/* Icon slot intentionally left as in Lovable design */}
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Your portfolio is performing well</h2>
              <p className="text-muted-foreground">
                Up <span className="font-semibold text-positive tabular-nums">+14.4%</span> all-time. Keep up the great work!
              </p>
            </div>
          </div>
          <button className="btn-primary">
            View Insights
          </button>
        </div>

        {/* Quick Stats */}
        <QuickStats stats={quickStatsData} />

        {/* Chart and Actions Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Portfolio Chart - Takes 2 columns */}
          <div className="lg:col-span-2">
            <PortfolioChart
              data={chartData}
              timeframe={selectedChartTimeframe}
              onTimeframeChange={setSelectedChartTimeframe}
            />
          </div>

          {/* Quick Actions */}
          <QuickActions />
        </div>

        {/* Activity, Leaderboard, Learning Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <LovableRecentActivity items={lovableRecentActivityItems} />
          <LovableLeaderboardWidget entries={leaderboardEntries} />
          <LovableLearningProgress progress={learningProgressProps} />
        </div>
      </div>
    </AppLayout>
  );
}