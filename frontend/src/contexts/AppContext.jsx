import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useErrorBoundary } from 'react-error-boundary';

// Import hooks
import useAIRecommendations from '../hooks/useAIRecommendations';
import useMCPContext from '../hooks/useMCPContext';
import { useMarketData } from '../hooks/useMarketData';

// Default user preferences
const DEFAULT_PREFERENCES = {
  riskTolerance: 'moderate', // low, moderate, high
  investmentGoal: 'growth', // income, growth, balanced
  timeHorizon: 5, // years
  theme: 'light', // light, dark, system
  notifications: {
    email: true,
    push: true,
    priceAlerts: true,
    marketUpdates: true
  },
  watchlist: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META']
};

// Initial state
const initialState = {
  // User and authentication
  user: null,
  session: null,
  isAuthenticated: false,
  
  // User preferences and settings
  preferences: DEFAULT_PREFERENCES,
  
  // Portfolio data
  portfolio: {
    balance: 0,
    assets: [],
    performance: {},
    allocation: {},
    history: []
  },
  
  // UI state
  ui: {
    darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
    sidebarOpen: true,
    activeTab: 'dashboard',
    lastUpdated: null,
    notifications: [],
    unreadNotifications: 0
  },
  
  // API and loading states
  status: {
    isInitialized: false,
    isLoading: false,
    isRefreshing: false,
    lastError: null
  }
};

// Action types
const actionTypes = {
  // Authentication
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  SET_SESSION: 'SET_SESSION',
  
  // User data
  SET_USER: 'SET_USER',
  UPDATE_PREFERENCES: 'UPDATE_PREFERENCES',
  UPDATE_WATCHLIST: 'UPDATE_WATCHLIST',
  
  // Portfolio
  UPDATE_PORTFOLIO: 'UPDATE_PORTFOLIO',
  UPDATE_BALANCE: 'UPDATE_BALANCE',
  ADD_TRANSACTION: 'ADD_TRANSACTION',
  
  // UI
  TOGGLE_THEME: 'TOGGLE_THEME',
  TOGGLE_SIDEBAR: 'TOGGLE_SIDEBAR',
  SET_ACTIVE_TAB: 'SET_ACTIVE_TAB',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  MARK_NOTIFICATION_READ: 'MARK_NOTIFICATION_READ',
  CLEAR_NOTIFICATIONS: 'CLEAR_NOTIFICATIONS',
  
  // Status
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_INITIALIZED: 'SET_INITIALIZED'
};

// Helper functions for the reducer
const updateArrayItem = (array, item, key = 'id') => {
  const index = array.findIndex(i => i[key] === item[key]);
  if (index === -1) return [...array, item];
  return [...array.slice(0, index), item, ...array.slice(index + 1)];
};

const removeArrayItem = (array, itemId, key = 'id') => {
  return array.filter(item => item[key] !== itemId);
};

// Reducer function
const appReducer = (state, action) => {
  switch (action.type) {
    // Authentication
    case actionTypes.LOGIN:
      return {
        ...state,
        user: action.payload.user,
        session: action.payload.session,
        isAuthenticated: true,
        status: {
          ...state.status,
          isInitialized: true
        }
      };
      
    case actionTypes.LOGOUT:
      return {
        ...initialState,
        ui: {
          ...initialState.ui,
          darkMode: state.ui.darkMode // Keep theme preference
        },
        status: {
          ...initialState.status,
          isInitialized: true
        }
      };
      
    case actionTypes.SET_SESSION:
      return {
        ...state,
        session: action.payload,
        isAuthenticated: !!action.payload
      };
    
    // User data
    case actionTypes.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload
      };
    
    case actionTypes.UPDATE_PREFERENCES:
      return {
        ...state,
        preferences: {
          ...state.preferences,
          ...action.payload
        },
        ui: {
          ...state.ui,
          lastUpdated: new Date().toISOString()
        }
      };
      
    case actionTypes.UPDATE_WATCHLIST:
      return {
        ...state,
        preferences: {
          ...state.preferences,
          watchlist: action.payload
        }
      };
    
    // Portfolio
    case actionTypes.UPDATE_PORTFOLIO:
      return {
        ...state,
        portfolio: {
          ...state.portfolio,
          ...action.payload,
          lastUpdated: new Date().toISOString()
        },
        ui: {
          ...state.ui,
          lastUpdated: new Date().toISOString()
        }
      };
      
    case actionTypes.UPDATE_BALANCE:
      return {
        ...state,
        portfolio: {
          ...state.portfolio,
          balance: action.payload,
          lastUpdated: new Date().toISOString()
        }
      };
      
    case actionTypes.ADD_TRANSACTION:
      return {
        ...state,
        portfolio: {
          ...state.portfolio,
          transactions: [
            ...(state.portfolio.transactions || []),
            {
              ...action.payload,
              id: Date.now().toString(),
              timestamp: new Date().toISOString()
            }
          ]
        }
      };
    
    // UI
    case actionTypes.TOGGLE_THEME: {
      const darkMode = !state.ui.darkMode;
      // Update HTML class for theme
      document.documentElement.classList.toggle('dark', darkMode);
      
      return {
        ...state,
        preferences: {
          ...state.preferences,
          theme: darkMode ? 'dark' : 'light'
        },
        ui: {
          ...state.ui,
          darkMode
        }
      };
    }
    
    case actionTypes.TOGGLE_SIDEBAR:
      return {
        ...state,
        ui: {
          ...state.ui,
          sidebarOpen: !state.ui.sidebarOpen
        }
      };
      
    case actionTypes.SET_ACTIVE_TAB:
      return {
        ...state,
        ui: {
          ...state.ui,
          activeTab: action.payload
        }
      };
      
    case actionTypes.ADD_NOTIFICATION: {
      const notification = {
        ...action.payload,
        id: Date.now().toString(),
        read: false,
        timestamp: new Date().toISOString()
      };
      
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: [notification, ...state.ui.notifications],
          unreadNotifications: state.ui.unreadNotifications + 1
        }
      };
    }
    
    case actionTypes.MARK_NOTIFICATION_READ: {
      const notifications = state.ui.notifications.map(notification =>
        notification.id === action.payload || notification.read === action.payload
          ? { ...notification, read: true }
          : notification
      );
      
      const unreadCount = notifications.filter(n => !n.read).length;
      
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications,
          unreadNotifications: unreadCount
        }
      };
    }
    
    case actionTypes.CLEAR_NOTIFICATIONS:
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: [],
          unreadNotifications: 0
        }
      };
    
    // Status
    case actionTypes.SET_LOADING:
      return {
        ...state,
        status: {
          ...state.status,
          isLoading: action.payload,
          isRefreshing: action.isRefreshing || false
        }
      };
      
    case actionTypes.SET_ERROR:
      return {
        ...state,
        status: {
          ...state.status,
          lastError: action.payload,
          isLoading: false,
          isRefreshing: false
        }
      };
      
    case actionTypes.CLEAR_ERROR:
      return {
        ...state,
        status: {
          ...state.status,
          lastError: null
        }
      };
      
    case actionTypes.SET_INITIALIZED:
      return {
        ...state,
        status: {
          ...state.status,
          isInitialized: true,
          isLoading: false
        }
      };
    
    default:
      return state;
  }
};

// Create context with default value
const AppContext = createContext({
  ...initialState,
  actions: {},
  ai: {},
  mcp: {},
  market: {}
});

// Provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { showBoundary } = useErrorBoundary();
  
  // Initialize hooks with proper error boundaries
  const initializeHooks = useCallback(() => {
    try {
      // AI Recommendations hook
      const ai = useAIRecommendations(state.preferences, false);
      
      // MCP Context hook
      const mcp = useMCPContext(false);
      
      // Market Data hook with watchlist
      const market = useMarketData(state.preferences.watchlist, {
        autoFetch: true,
        useCache: true
      });
      
      return { ai, mcp, market };
    } catch (error) {
      showBoundary(error);
      return { ai: {}, mcp: {}, market: {} };
    }
  }, [state.preferences, showBoundary]);
  
  // Initialize all hooks
  const { ai, mcp, market } = initializeHooks();
  
  // Action creators with error handling
  const safeDispatch = useCallback((action) => {
    try {
      dispatch(action);
    } catch (error) {
      console.error('Dispatch error:', error);
      showBoundary(error);
    }
  }, [showBoundary]);
  
  // Authentication actions
  const login = useCallback(async (credentials) => {
    safeDispatch({ type: actionTypes.SET_LOADING, payload: true });
    try {
      // TODO: Implement actual authentication
      const user = { id: 'user123', name: 'Demo User', email: credentials.email };
      const session = { token: 'demo-token', expiresAt: Date.now() + 3600000 };
      
      safeDispatch({
        type: actionTypes.LOGIN,
        payload: { user, session }
      });
      
      // Initialize user data
      await Promise.all([
        fetchPortfolio(),
        fetchPreferences(),
        fetchNotifications()
      ]);
      
      return { success: true };
    } catch (error) {
      safeDispatch({
        type: actionTypes.SET_ERROR,
        payload: error.message || 'Login failed'
      });
      throw error;
    } finally {
      safeDispatch({ type: actionTypes.SET_LOADING, payload: false });
    }
  }, [safeDispatch]);
  
  const logout = useCallback(() => {
    // TODO: Implement logout logic
    safeDispatch({ type: actionTypes.LOGOUT });
  }, [safeDispatch]);
  
  // Data fetching actions
  const fetchPortfolio = useCallback(async () => {
    safeDispatch({ type: actionTypes.SET_LOADING, payload: true, isRefreshing: true });
    try {
      // TODO: Implement actual portfolio fetch
      const portfolio = {
        balance: 50000,
        assets: [
          { symbol: 'AAPL', shares: 10, avgPrice: 150 },
          { symbol: 'MSFT', shares: 5, avgPrice: 300 },
          { symbol: 'GOOGL', shares: 2, avgPrice: 2500 }
        ],
        performance: {
          day: 1.5,
          week: 3.2,
          month: 5.8,
          year: 12.3
        },
        allocation: {
          stocks: 70,
          bonds: 20,
          cash: 10
        },
        history: []
      };
      
      safeDispatch({
        type: actionTypes.UPDATE_PORTFOLIO,
        payload: portfolio
      });
      
      return portfolio;
    } catch (error) {
      safeDispatch({
        type: actionTypes.SET_ERROR,
        payload: error.message || 'Failed to fetch portfolio'
      });
      throw error;
    } finally {
      safeDispatch({ type: actionTypes.SET_LOADING, payload: false });
    }
  }, [safeDispatch]);
  
  const fetchPreferences = useCallback(async () => {
    try {
      // TODO: Fetch user preferences from API
      const preferences = DEFAULT_PREFERENCES;
      safeDispatch({
        type: actionTypes.UPDATE_PREFERENCES,
        payload: preferences
      });
      return preferences;
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
      return DEFAULT_PREFERENCES;
    }
  }, [safeDispatch]);
  
  const fetchNotifications = useCallback(async () => {
    try {
      // TODO: Fetch notifications from API
      const notifications = [];
      return notifications;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      return [];
    }
  }, []);
  
  // UI actions
  const toggleTheme = useCallback(() => {
    safeDispatch({ type: actionTypes.TOGGLE_THEME });
  }, [safeDispatch]);
  
  const toggleSidebar = useCallback(() => {
    safeDispatch({ type: actionTypes.TOGGLE_SIDEBAR });
  }, [safeDispatch]);
  
  const setActiveTab = useCallback((tabId) => {
    safeDispatch({
      type: actionTypes.SET_ACTIVE_TAB,
      payload: tabId
    });
  }, [safeDispatch]);
  
  // Notification actions
  const addNotification = useCallback((notification) => {
    safeDispatch({
      type: actionTypes.ADD_NOTIFICATION,
      payload: notification
    });
  }, [safeDispatch]);
  
  const markNotificationRead = useCallback((notificationId) => {
    safeDispatch({
      type: actionTypes.MARK_NOTIFICATION_READ,
      payload: notificationId
    });
  }, [safeDispatch]);
  
  const clearNotifications = useCallback(() => {
    safeDispatch({ type: actionTypes.CLEAR_NOTIFICATIONS });
  }, [safeDispatch]);
  
  // Initialize app on mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        safeDispatch({ type: actionTypes.SET_LOADING, payload: true });
        
        // Check for existing session
        const session = null; // TODO: Get from localStorage/auth service
        if (session) {
          safeDispatch({ type: actionTypes.SET_SESSION, payload: session });
          await Promise.all([
            fetchPortfolio(),
            fetchPreferences(),
            fetchNotifications()
          ]);
        }
        
        safeDispatch({ type: actionTypes.SET_INITIALIZED });
      } catch (error) {
        safeDispatch({
          type: actionTypes.SET_ERROR,
          payload: error.message || 'Failed to initialize app'
        });
      } finally {
        safeDispatch({ type: actionTypes.SET_LOADING, payload: false });
      }
    };
    
    initializeApp();
  }, [fetchPortfolio, fetchPreferences, fetchNotifications, safeDispatch]);
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    // State
    ...state,
    
    // Hooks data
    ai: {
      recommendations: ai.recommendations || [],
      loading: ai.loading || false,
      error: ai.error,
      marketInsights: ai.marketInsights,
      explanations: ai.explanations,
      fetchRecommendations: ai.fetchRecommendations,
      fetchExplanation: ai.fetchExplanation,
      fetchMarketInsights: ai.fetchMarketInsights
    },
    
    mcp: {
      context: mcp.context,
      recommendations: mcp.recommendations || [],
      loading: mcp.loading || false,
      error: mcp.error,
      fetchMCPContext: mcp.fetchMCPContext,
      updateMCPContext: mcp.updateMCPContext,
      fetchMCPRecommendations: mcp.fetchMCPRecommendations,
      submitMCPFeedback: mcp.submitFeedback
    },
    
    market: {
      data: market.marketData || {},
      historicalData: market.historicalData || {},
      marketNews: market.marketNews || [],
      loading: market.loading || false,
      error: market.error,
      lastUpdated: market.lastUpdated,
      fetchMarketData: market.fetchMarketData,
      fetchHistoricalData: market.fetchHistoricalData,
      fetchMarketNews: market.fetchMarketNews,
      searchForStocks: market.searchForStocks,
      refreshData: market.refreshData,
      getQuote: market.getQuote,
      getQuotes: market.getQuotes,
      getMarketSummary: market.getMarketSummary,
      getTopGainers: market.getTopGainers,
      getTopLosers: market.getTopLosers,
      getLatestNews: market.getLatestNews
    },
    
    // Actions
    actions: {
      // Authentication
      login,
      logout,
      
      // Data fetching
      fetchPortfolio,
      fetchPreferences,
      fetchNotifications,
      
      // UI
      toggleTheme,
      toggleSidebar,
      setActiveTab,
      
      // Notifications
      addNotification,
      markNotificationRead,
      clearNotifications,
      
      // Portfolio management
      updatePortfolio: (updates) => {
        safeDispatch({
          type: actionTypes.UPDATE_PORTFOLIO,
          payload: updates
        });
      },
      
      // Preferences
      updatePreferences: (updates) => {
        safeDispatch({
          type: actionTypes.UPDATE_PREFERENCES,
          payload: updates
        });
      },
      
      // Watchlist
      updateWatchlist: (watchlist) => {
        safeDispatch({
          type: actionTypes.UPDATE_WATCHLIST,
          payload: watchlist
        });
      },
      
      // Error handling
      clearError: () => {
        safeDispatch({ type: actionTypes.CLEAR_ERROR });
      }
    }
  }), [state, ai, mcp, market, login, logout, fetchPortfolio, fetchPreferences, 
       fetchNotifications, toggleTheme, toggleSidebar, setActiveTab, 
       addNotification, markNotificationRead, clearNotifications, safeDispatch]);
  
  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

AppProvider.propTypes = {
  children: PropTypes.node.isRequired
};

// Custom hook to use the app context
export const useAppContext = () => {
  const context = useContext(AppContext);
  
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  
  // Add debug logging in development
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      console.log('AppContext updated:', {
        user: context.user,
        loading: context.status.isLoading,
        error: context.status.lastError
      });
    }, [context.user, context.status.isLoading, context.status.lastError]);
  }
  
  return context;
};

// Export action types and other utilities
export { actionTypes, DEFAULT_PREFERENCES };

// Export the main context and provider
export default AppContext;
