import React, { createContext, useContext, useReducer, useCallback, useMemo, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useErrorBoundary } from 'react-error-boundary';

// Import services
import { getSession } from '../services/api/auth';
import { getMarketData, getMarketNews } from '../services/api/marketService';
import { getAIRecommendations } from '../services/api/aiService';
import { getMCPContext, getMCPRecommendations } from '../services/api/mcpService';

// Utils
import { logError, logInfo } from '../utils/logger';

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
  
  // Data loading states
  loading: {
    marketData: false,
    aiRecommendations: false,
    mcpContext: false
  },
  errors: {
    marketData: null,
    aiRecommendations: null,
    mcpContext: null
  },
  lastUpdated: null,
  
  // Market data
  marketData: {
    summary: {},
    watchlist: [],
    news: [],
    trends: {}
  },
  
  // AI Recommendations
  aiRecommendations: {
    stocks: [],
    insights: [],
    lastUpdated: null
  },
  
  // MCP (Market Context Personalization)
  mcpContext: {
    riskProfile: 'moderate',
    investmentGoals: [],
    learningModules: [],
    recommendations: [],
    lastUpdated: null
  },
  
  // UI state
  ui: {
    darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
    sidebarOpen: true,
    activeTab: 'dashboard',
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
  
  // Data loading states
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  
  // Market data
  SET_MARKET_DATA: 'SET_MARKET_DATA',
  UPDATE_WATCHLIST: 'UPDATE_WATCHLIST',
  
  // AI Recommendations
  SET_AI_RECOMMENDATIONS: 'SET_AI_RECOMMENDATIONS',
  
  // MCP Context
  SET_MCP_CONTEXT: 'SET_MCP_CONTEXT',
  
  // UI state
  SET_UI_STATE: 'SET_UI_STATE',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  CLEAR_NOTIFICATIONS: 'CLEAR_NOTIFICATIONS',
  TOGGLE_SIDEBAR: 'TOGGLE_SIDEBAR',
  SET_ACTIVE_TAB: 'SET_ACTIVE_TAB',
  TOGGLE_THEME: 'TOGGLE_THEME',
  
  // Data refresh
  REFRESH_DATA: 'REFRESH_DATA'
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
    // User actions
    case actionTypes.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload
      };
      
    case actionTypes.SET_SESSION:
      return {
        ...state,
        session: action.payload,
        isAuthenticated: !!action.payload,
        user: action.payload?.user || state.user
      };
      
    case actionTypes.SET_PREFERENCES:
      return {
        ...state,
        preferences: {
          ...state.preferences,
          ...action.payload
        }
      };
    
    // Data loading states
    case actionTypes.SET_LOADING: {
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.value
        }
      };
    }
    
    case actionTypes.SET_ERROR: {
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.key]: action.payload.error
        },
        loading: {
          ...state.loading,
          [action.payload.key]: false
        }
      };
    }
    
    case actionTypes.CLEAR_ERROR: {
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload]: null
        }
      };
    }
    
    // Market data
    case actionTypes.SET_MARKET_DATA: {
      return {
        ...state,
        marketData: {
          ...state.marketData,
          ...action.payload,
          lastUpdated: new Date().toISOString()
        },
        lastUpdated: new Date().toISOString(),
        loading: {
          ...state.loading,
          marketData: false
        },
        errors: {
          ...state.errors,
          marketData: null
        }
      };
    }
    
    case actionTypes.UPDATE_WATCHLIST: {
      return {
        ...state,
        marketData: {
          ...state.marketData,
          watchlist: action.payload
        }
      };
    }
    
    // AI Recommendations
    case actionTypes.SET_AI_RECOMMENDATIONS: {
      return {
        ...state,
        aiRecommendations: {
          ...state.aiRecommendations,
          ...action.payload,
          lastUpdated: new Date().toISOString()
        },
        lastUpdated: new Date().toISOString(),
        loading: {
          ...state.loading,
          aiRecommendations: false
        },
        errors: {
          ...state.errors,
          aiRecommendations: null
        }
      };
    }
    
    // MCP Context
    case actionTypes.SET_MCP_CONTEXT: {
      return {
        ...state,
        mcpContext: {
          ...state.mcpContext,
          ...action.payload,
          lastUpdated: new Date().toISOString()
        },
        lastUpdated: new Date().toISOString(),
        loading: {
          ...state.loading,
          mcpContext: false
        },
        errors: {
          ...state.errors,
          mcpContext: null
        }
      };
    }
    
    // UI state
    case actionTypes.SET_UI_STATE:
      return {
        ...state,
        ui: {
          ...state.ui,
          ...action.payload
        }
      };
      
    case actionTypes.ADD_NOTIFICATION:
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: [
            ...state.ui.notifications,
            {
              id: Date.now(),
              ...action.payload
            }
          ]
        }
      };
      
    case actionTypes.REMOVE_NOTIFICATION:
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: state.ui.notifications.filter(
            notification => notification.id !== action.payload
          )
        }
      };
      
    case actionTypes.CLEAR_NOTIFICATIONS:
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: []
        }
      };
      
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
      
    case actionTypes.TOGGLE_THEME: {
      const newTheme = state.ui.darkMode ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      return {
        ...state,
        ui: {
          ...state.ui,
          darkMode: !state.ui.darkMode
        }
      };
    }
    
    // Data refresh
    case actionTypes.REFRESH_DATA: {
      return {
        ...state,
        lastUpdated: new Date().toISOString()
      };
    }
    
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
  const refreshInterval = useRef(null);
  
  // Initialize session on mount
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const session = await getSession();
        if (session) {
          dispatch({ type: actionTypes.SET_SESSION, payload: session });
        }
      } catch (error) {
        logError('Error initializing session:', error);
      }
    };
    
    initializeSession();
  }, []);
  
  // Set up data refresh interval (5 minutes)
  useEffect(() => {
    const setupRefreshInterval = () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
      
      refreshInterval.current = setInterval(() => {
        refreshAllData();
      }, 5 * 60 * 1000); // 5 minutes
      
      return () => {
        if (refreshInterval.current) {
          clearInterval(refreshInterval.current);
        }
      };
    };
    
    if (state.isAuthenticated) {
      setupRefreshInterval();
    }
    
    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, [state.isAuthenticated]);
  
  // Set loading state
  const setLoading = (key, value) => {
    dispatch({ 
      type: actionTypes.SET_LOADING, 
      payload: { key, value } 
    });
  };
  
  // Set error state
  const setError = (key, error) => {
    dispatch({ 
      type: actionTypes.SET_ERROR, 
      payload: { key, error: error?.message || 'An unknown error occurred' } 
    });
    
    // Show error notification
    dispatch({
      type: actionTypes.ADD_NOTIFICATION,
      payload: {
        type: 'error',
        title: 'Error',
        message: error?.message || 'An error occurred while fetching data',
        autoDismiss: 5000
      }
    });
  };
  
  // Clear error state
  const clearError = (key) => {
    dispatch({ 
      type: actionTypes.CLEAR_ERROR, 
      payload: key 
    });
  };
  
  // Fetch market data
  const fetchMarketData = useCallback(async () => {
    if (!state.isAuthenticated) return;
    
    try {
      setLoading('marketData', true);
      clearError('marketData');
      
      // Fetch watchlist data
      const watchlistData = await Promise.all(
        state.preferences.watchlist.map(symbol =>
          getMarketData(symbol).catch(() => null)
        )
      );
      
      // Filter out failed requests
      const validWatchlist = watchlistData.filter(Boolean);
      
      // Fetch market news
      const news = await getMarketNews({ limit: 5 });
      
      dispatch({
        type: actionTypes.SET_MARKET_DATA,
        payload: {
          watchlist: validWatchlist,
          news,
          lastUpdated: new Date().toISOString()
        }
      });
      
    } catch (error) {
      setError('marketData', error);
    }
  }, [state.isAuthenticated, state.preferences.watchlist]);
  
  // Fetch AI recommendations
  const fetchAIRecommendations = useCallback(async () => {
    if (!state.isAuthenticated) return;
    
    try {
      setLoading('aiRecommendations', true);
      clearError('aiRecommendations');
      
      const recommendations = await getAIRecommendations({
        riskTolerance: state.preferences.riskTolerance,
        investmentGoal: state.preferences.investmentGoal,
        timeHorizon: state.preferences.timeHorizon
      });
      
      dispatch({
        type: actionTypes.SET_AI_RECOMMENDATIONS,
        payload: {
          stocks: recommendations.stocks || [],
          insights: recommendations.insights || []
        }
      });
      
    } catch (error) {
      setError('aiRecommendations', error);
    }
  }, [state.isAuthenticated, state.preferences]);
  
  // Fetch MCP context
  const fetchMCPContext = useCallback(async () => {
    if (!state.isAuthenticated || !state.user?.id) return;
    
    try {
      setLoading('mcpContext', true);
      clearError('mcpContext');
      
      const [context, recommendations] = await Promise.all([
        getMCPContext(state.user.id),
        getMCPRecommendations({ limit: 5 })
      ]);
      
      dispatch({
        type: actionTypes.SET_MCP_CONTEXT,
        payload: {
          ...context,
          recommendations: recommendations || []
        }
      });
      
    } catch (error) {
      setError('mcpContext', error);
    }
  }, [state.isAuthenticated, state.user?.id]);
  
  // Refresh all data
  const refreshAllData = useCallback(async () => {
    if (!state.isAuthenticated) return;
    
    try {
      logInfo('Refreshing all data...');
      
      await Promise.all([
        fetchMarketData(),
        fetchAIRecommendations(),
        fetchMCPContext()
      ]);
      
      dispatch({ type: actionTypes.REFRESH_DATA });
      
      // Show success notification
      dispatch({
        type: actionTypes.ADD_NOTIFICATION,
        payload: {
          type: 'success',
          title: 'Success',
          message: 'Data refreshed successfully',
          autoDismiss: 3000
        }
      });
      
    } catch (error) {
      logError('Error refreshing data:', error);
      
      dispatch({
        type: actionTypes.ADD_NOTIFICATION,
        payload: {
          type: 'error',
          title: 'Error',
          message: 'Failed to refresh data',
          autoDismiss: 5000
        }
      });
    }
  }, [state.isAuthenticated, fetchMarketData, fetchAIRecommendations, fetchMCPContext]);

  useEffect(() => {
    if (state.isAuthenticated) {
      refreshAllData();
    }
  }, [state.isAuthenticated, refreshAllData]);
  
  // Memoized context value
  const contextValue = useMemo(() => ({
    ...state,
    actions: {
      // User actions
      setUser: (user) => dispatch({ type: actionTypes.SET_USER, payload: user }),
      setSession: (session) => dispatch({ type: actionTypes.SET_SESSION, payload: session }),
      setPreferences: (preferences) => dispatch({ 
        type: actionTypes.SET_PREFERENCES, 
        payload: preferences 
      }),
      
      // Data actions
      refreshData: refreshAllData,
      fetchMarketData,
      fetchAIRecommendations,
      fetchMCPContext,
      
      // UI actions
      setUiState: (uiState) => dispatch({ 
        type: actionTypes.SET_UI_STATE, 
        payload: uiState 
      }),
      addNotification: (notification) => dispatch({ 
        type: actionTypes.ADD_NOTIFICATION, 
        payload: typeof notification === 'string' 
          ? { message: notification, type: 'info' } 
          : notification 
      }),
      removeNotification: (id) => dispatch({ 
        type: actionTypes.REMOVE_NOTIFICATION, 
        payload: id 
      }),
      clearNotifications: () => dispatch({ 
        type: actionTypes.CLEAR_NOTIFICATIONS 
      }),
      toggleSidebar: () => dispatch({ 
        type: actionTypes.TOGGLE_SIDEBAR 
      }),
      setActiveTab: (tab) => dispatch({ 
        type: actionTypes.SET_ACTIVE_TAB, 
        payload: tab 
      }),
      toggleTheme: () => dispatch({ 
        type: actionTypes.TOGGLE_THEME 
      })
    },
    
    // AI Service integration
    ai: {
      recommendations: state.aiRecommendations.stocks,
      insights: state.aiRecommendations.insights,
      loading: state.loading.aiRecommendations,
      error: state.errors.aiRecommendations,
      lastUpdated: state.aiRecommendations.lastUpdated,
      fetchRecommendations: fetchAIRecommendations
    },
    
    // MCP Service integration
    mcp: {
      context: state.mcpContext,
      recommendations: state.mcpContext.recommendations || [],
      loading: state.loading.mcpContext,
      error: state.errors.mcpContext,
      lastUpdated: state.mcpContext.lastUpdated,
      fetchContext: fetchMCPContext,
      updateContext: (updates) => {
        // This would be implemented to call your MCP update API
        console.log('Updating MCP context:', updates);
      },
      submitFeedback: (feedback) => {
        // This would be implemented to call your MCP feedback API
        console.log('Submitting MCP feedback:', feedback);
        return Promise.resolve({ success: true });
      }
    },
    
    // Market Service integration
    market: {
      data: state.marketData,
      watchlist: state.marketData.watchlist || [],
      news: state.marketData.news || [],
      loading: state.loading.marketData,
      error: state.errors.marketData,
      lastUpdated: state.marketData.lastUpdated,
      fetchData: fetchMarketData,
      fetchNews: () => getMarketNews({ limit: 10 }),
      refreshData: fetchMarketData,
      
      // Portfolio management
      updatePortfolio: (updates) => {
        dispatch({
          type: actionTypes.UPDATE_PORTFOLIO,
          payload: updates
        });
      },
      
      // Watchlist management
      updateWatchlist: (watchlist) => {
        dispatch({
          type: actionTypes.UPDATE_WATCHLIST,
          payload: watchlist
        });
      }
    },
    
    // Preferences management
    preferences: {
      ...state.preferences,
      update: (updates) => {
        dispatch({
          type: actionTypes.UPDATE_PREFERENCES,
          payload: updates
        });
      }
    },
    
    // Error handling
    clearError: (key) => {
      if (key) {
        dispatch({ 
          type: actionTypes.CLEAR_ERROR, 
          payload: key 
        });
      } else {
        // Clear all errors if no key provided
        Object.keys(state.errors).forEach(errorKey => {
          if (state.errors[errorKey]) {
            dispatch({ 
              type: actionTypes.CLEAR_ERROR, 
              payload: errorKey 
            });
          }
        });
      }
    }
  }), [
    state, 
    fetchMarketData, 
    fetchAIRecommendations, 
    fetchMCPContext, 
    refreshAllData
  ]);
  
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
