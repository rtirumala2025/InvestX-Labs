import { useState, useEffect } from 'react';

/**
 * Custom hook for localStorage operations
 * @param {string} key - localStorage key
 * @param {*} initialValue - Initial value if key doesn't exist
 * @returns {Array} [value, setValue, removeValue]
 */
export const useLocalStorage = (key, initialValue) => {
  // Get value from localStorage or use initial value
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Update localStorage when value changes
  const setValue = (value) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Remove value from localStorage
  const removeValue = () => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  };

  // Listen for changes to localStorage from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error(`Error parsing localStorage value for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue, removeValue];
};

/**
 * Custom hook for managing user preferences
 * @returns {Object} User preferences and operations
 */
export const useUserPreferences = () => {
  const [preferences, setPreferences] = useLocalStorage('userPreferences', {
    theme: 'light',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    notifications: {
      email: true,
      push: true,
      priceAlerts: true,
      marketUpdates: true
    },
    dashboard: {
      showQuickStats: true,
      showRecentActivity: true,
      showAIInsights: true,
      showMarketNews: true
    },
    portfolio: {
      defaultView: 'overview',
      showUnrealizedGains: true,
      showDividends: true,
      showFees: true
    }
  });

  const updatePreference = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateNestedPreference = (path, value) => {
    setPreferences(prev => {
      const newPrefs = { ...prev };
      const keys = path.split('.');
      let current = newPrefs;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newPrefs;
    });
  };

  const resetPreferences = () => {
    setPreferences({
      theme: 'light',
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      notifications: {
        email: true,
        push: true,
        priceAlerts: true,
        marketUpdates: true
      },
      dashboard: {
        showQuickStats: true,
        showRecentActivity: true,
        showAIInsights: true,
        showMarketNews: true
      },
      portfolio: {
        defaultView: 'overview',
        showUnrealizedGains: true,
        showDividends: true,
        showFees: true
      }
    });
  };

  return {
    preferences,
    updatePreference,
    updateNestedPreference,
    resetPreferences
  };
};

/**
 * Custom hook for managing watchlist
 * @returns {Object} Watchlist data and operations
 */
export const useWatchlist = () => {
  const [watchlist, setWatchlist] = useLocalStorage('watchlist', []);

  const addToWatchlist = (symbol, companyName) => {
    const newItem = {
      symbol,
      companyName,
      addedAt: new Date().toISOString()
    };
    
    setWatchlist(prev => {
      // Check if already exists
      if (prev.some(item => item.symbol === symbol)) {
        return prev;
      }
      return [...prev, newItem];
    });
  };

  const removeFromWatchlist = (symbol) => {
    setWatchlist(prev => prev.filter(item => item.symbol !== symbol));
  };

  const isInWatchlist = (symbol) => {
    return watchlist.some(item => item.symbol === symbol);
  };

  const clearWatchlist = () => {
    setWatchlist([]);
  };

  return {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    clearWatchlist
  };
};

/**
 * Custom hook for managing price alerts
 * @returns {Object} Price alerts data and operations
 */
export const usePriceAlerts = () => {
  const [alerts, setAlerts] = useLocalStorage('priceAlerts', []);

  const addPriceAlert = (symbol, targetPrice, condition, companyName) => {
    const newAlert = {
      id: `alert_${Date.now()}`,
      symbol,
      companyName,
      targetPrice,
      condition,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    
    setAlerts(prev => [...prev, newAlert]);
  };

  const removePriceAlert = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const updatePriceAlert = (alertId, updates) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, ...updates, updatedAt: new Date().toISOString() }
        : alert
    ));
  };

  const getActiveAlerts = () => {
    return alerts.filter(alert => alert.status === 'active');
  };

  const getAlertsBySymbol = (symbol) => {
    return alerts.filter(alert => alert.symbol === symbol);
  };

  const clearAllAlerts = () => {
    setAlerts([]);
  };

  return {
    alerts,
    addPriceAlert,
    removePriceAlert,
    updatePriceAlert,
    getActiveAlerts,
    getAlertsBySymbol,
    clearAllAlerts
  };
};
