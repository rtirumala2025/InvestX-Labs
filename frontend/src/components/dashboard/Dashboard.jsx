import React, { useEffect, useCallback, useState, useMemo, useRef } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useErrorBoundary } from 'react-error-boundary';
import PropTypes from 'prop-types';

// Components
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorBoundary from '../common/ErrorBoundary';
import ErrorMessage from '../common/ErrorMessage';
import QuickStats from './QuickStats';
import PortfolioPerformance from './PortfolioPerformance';
import RecentActivity from './RecentActivity';
import AISuggestions from './AISuggestions';
import QuickActions from './QuickActions';
import AISuggestions from './AISuggestions';
import PortfolioPerformance from './PortfolioPerformance';
import RecentActivity from './RecentActivity';
import QuickActions from './QuickActions';

// Constants
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Dashboard Component
 * 
 * Main dashboard that displays portfolio overview, market data, and AI recommendations.
 * Fetches and manages data through the AppContext and handles all data flow to child components.
 */
const Dashboard = () => {
  // Error boundary utility
  const { showBoundary } = useErrorBoundary();
  
  // Local state
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshIntervalRef = useRef(null);

  // Fetch data and actions from AppContext
  const {
    // State
    portfolio: { 
      data: portfolioData, 
      loading: portfolioLoading, 
      error: portfolioError 
    },
    market: { 
      data: marketData, 
      loading: marketLoading, 
      error: marketError 
    },
    ai: { 
      recommendations: aiRecommendations, 
      loading: aiLoading, 
      error: aiError 
    },
    mcp: { 
      context: mcpContext, 
      loading: mcpLoading, 
      error: mcpError 
    },
    
    // Actions
    actions: {
      fetchPortfolio,
      fetchMarketData,
      fetchAIRecommendations,
      fetchMCPContext,
      refreshAllData
    }
  } = useAppContext();

  // Memoized derived state
  const { isLoading, hasError, errorMessage } = useMemo(() => ({
    isLoading: portfolioLoading || marketLoading || aiLoading || mcpLoading,
    hasError: portfolioError || marketError || aiError || mcpError,
    errorMessage: (portfolioError || marketError || aiError || mcpError)?.message || 'An unknown error occurred'
  }), [
    portfolioLoading, marketLoading, aiLoading, mcpLoading,
    portfolioError, marketError, aiError, mcpError
  ]);

  // Memoize the refresh function to prevent unnecessary re-renders
  const refreshData = useCallback(async () => {
    if (isRefreshing) return;
    
    try {
      setIsRefreshing(true);
      await Promise.all([
        fetchPortfolio(),
        fetchMarketData(),
        fetchAIRecommendations(),
        fetchMCPContext()
      ]);
      setLastRefreshed(new Date());
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
      showBoundary(error);
    } finally {
      setIsRefreshing(false);
    }
  }, [
    isRefreshing,
    fetchPortfolio,
    fetchMarketData,
    fetchAIRecommendations,
    fetchMCPContext,
    showBoundary
  ]);

  /**
   * Handle manual refresh of all data
   */
  const handleRefresh = useCallback(() => {
    refreshData();
  }, [refreshData]);

  // Set up auto-refresh and visibility change detection
  useEffect(() => {
    let isMounted = true;

    // Initial data fetch
    const initializeData = async () => {
      try {
        await refreshData();
      } catch (error) {
        console.error('Error initializing dashboard data:', error);
        if (isMounted) showBoundary(error);
      }
    };

    initializeData();

    // Set up auto-refresh interval
    const setupRefreshInterval = () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      
      refreshIntervalRef.current = setInterval(() => {
        if (document.visibilityState === 'visible') {
          refreshData().catch(console.error);
        }
      }, AUTO_REFRESH_INTERVAL);
    };

    setupRefreshInterval();

    // Handle visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Refresh immediately when tab becomes visible
        refreshData().catch(console.error);
        // Reset the interval
        setupRefreshInterval();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      isMounted = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshData, showBoundary]);

  // Loading state for initial load
  if (isLoading && !lastRefreshed) {
    return (
      <div 
        className="flex flex-col items-center justify-center min-h-screen p-4"
        role="status"
        aria-live="polite"
        aria-busy={true}
      >
        <LoadingSpinner size="xl" />
        <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        <span className="sr-only">Loading dashboard data</span>
      </div>
    );
  }

  // Error state
  if (hasError) {
    return (
      <div className="p-4 max-w-7xl mx-auto">
        <ErrorMessage
          title="Error loading dashboard"
          message={errorMessage}
          onRetry={handleRefresh}
          isRetrying={isRefreshing}
        />
      </div>
    );
  }

  // Memoize the render function to prevent unnecessary re-renders
  const renderContent = useMemo(() => (
    <div 
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" 
      role="main"
      aria-labelledby="dashboard-title"
    >
      {/* Header with title and refresh button */}
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 
              id="dashboard-title"
              className="text-2xl md:text-3xl font-bold text-gray-900"
            >
              Investment Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Welcome back! Here's your investment overview.
              {lastRefreshed && (
                <span 
                  className="text-sm text-gray-500 block sm:inline sm:ml-2" 
                  aria-live="polite"
                  aria-atomic="true"
                >
                  Last updated: {lastRefreshed.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label={isRefreshing ? 'Refreshing data...' : 'Refresh data'}
            aria-busy={isRefreshing}
          >
            <svg
              className={`${isRefreshing ? 'animate-spin' : ''} -ml-1 mr-2 h-4 w-4`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </header>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - 2/3 width on large screens */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Stats Section */}
          <section 
            aria-labelledby="quick-stats-heading"
            className="bg-white rounded-lg shadow p-6"
          >
            <h2 id="quick-stats-heading" className="sr-only">Quick Stats</h2>
            <QuickStats
              portfolio={portfolioData}
              marketData={marketData}
              loading={isRefreshing || isLoading}
            />
          </section>

          {/* Portfolio Performance Section */}
          <section 
            aria-labelledby="portfolio-performance-heading"
            className="bg-white rounded-lg shadow p-6"
          >
            <h2 
              id="portfolio-performance-heading" 
              className="text-lg font-semibold text-gray-900 mb-4"
            >
              Portfolio Performance
            </h2>
            <PortfolioPerformance
              historicalData={marketData?.historicalData}
              portfolio={portfolioData}
              loading={isRefreshing || marketLoading}
              error={marketError}
            />
          </section>

          {/* Recent Activity Section */}
          <section 
            aria-labelledby="recent-activity-heading"
            className="bg-white rounded-lg shadow p-6"
          >
            <h2 
              id="recent-activity-heading" 
              className="text-lg font-semibold text-gray-900 mb-4"
            >
              Recent Activity
            </h2>
            <RecentActivity
              activities={portfolioData?.recentActivities}
              loading={isRefreshing || portfolioLoading}
              error={portfolioError}
            />
          </section>
        </div>

        {/* Right column - 1/3 width on large screens */}
        <div className="space-y-6">
          {/* AI Suggestions Section */}
          <section 
            aria-labelledby="ai-suggestions-heading"
            className="bg-white rounded-lg shadow p-6"
          >
            <h2 
              id="ai-suggestions-heading" 
              className="text-lg font-semibold text-gray-900 mb-4"
            >
              AI Recommendations
            </h2>
            <AISuggestions
              recommendations={aiRecommendations}
              context={mcpContext}
              loading={isRefreshing || aiLoading || mcpLoading}
              error={aiError || mcpError}
              onAction={(action, data) => {
                console.log(`AI Action: ${action}`, data);
              }}
            />
          </section>

          {/* Quick Actions Section */}
          <section 
            aria-labelledby="quick-actions-heading"
            className="bg-white rounded-lg shadow p-6"
          >
            <h2 
              id="quick-actions-heading" 
              className="text-lg font-semibold text-gray-900 mb-4"
            >
              Quick Actions
            </h2>
            <QuickActions
              portfolio={portfolioData}
              loading={isRefreshing || portfolioLoading}
              onAction={(action) => {
                console.log('Quick action:', action);
              }}
            />
          </section>
        </div>
      </div>

      {/* Footer with last updated info */}
      <footer 
        className="mt-8 text-sm text-gray-500 text-center"
        aria-live="polite"
        aria-atomic="true"
      >
        <p>
          Data is automatically refreshed every 5 minutes. Last updated: {lastRefreshed?.toLocaleString() || 'Never'}
        </p>
        {hasError && (
          <p className="text-red-500 mt-1">
            Some data may not be up to date. Try refreshing the page.
          </p>
        )}
      </footer>
    </div>
  ), [
    portfolioData,
    marketData,
    aiRecommendations,
    mcpContext,
    portfolioLoading,
    marketLoading,
    aiLoading,
    mcpLoading,
    portfolioError,
    marketError,
    aiError,
    mcpError,
    isLoading,
    lastRefreshed,
    handleRefresh
  ]);

  // Main render with ErrorBoundary
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div 
          className="p-4 max-w-7xl mx-auto"
          role="alert"
          aria-live="assertive"
        >
          <ErrorMessage
            title="Something went wrong"
            message={error.message}
            onRetry={resetErrorBoundary}
          />
        </div>
      )}
    >
      {renderContent}
    </ErrorBoundary>
  );
};

// Prop types for better development experience
// Prop types for better development experience and type checking
Dashboard.propTypes = {
  // All data and handlers come from context
};

// Memoize the component to prevent unnecessary re-renders
export default React.memo(Dashboard);
