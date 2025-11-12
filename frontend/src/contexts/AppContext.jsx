import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import { AuthProvider } from './AuthContext';
import { LeaderboardProvider } from './LeaderboardContext';
import { AchievementsProvider } from './AchievementsContext';
import { EducationProvider } from './EducationContext';
import { PortfolioProvider } from './PortfolioContext';
import { ChatProvider } from './ChatContext';
import { SimulationProvider } from './SimulationContext';
import { ClubsProvider } from './ClubsContext';

const AppContext = createContext(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppContextProvider');
  }
  return context;
};

const MAX_TOAST_HISTORY = 25;

const isBrowser = typeof window !== 'undefined';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const AppContextProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(() => (isBrowser ? navigator.onLine : true));
  const [theme, setTheme] = useState(() => {
    if (!isBrowser) return 'dark';
    return localStorage.getItem('investx-theme') || 'dark';
  });
  const [globalError, setGlobalError] = useState(null);
  const [toastQueue, setToastQueue] = useState([]);
  const [registeredContexts, setRegisteredContexts] = useState({});

  const isInitialOnlineCheck = useRef(true);

  const queueToast = useCallback((message, type = 'info', options = {}) => {
    if (!message) return;

    const id = options.id ?? generateId();
    const duration = options.duration ?? 4000;

    setToastQueue((prev) => {
      const filtered = prev.filter((toast) => toast.id !== id);
      const next = [
        ...filtered,
        { id, message, type, createdAt: Date.now(), duration },
      ];
      if (next.length > MAX_TOAST_HISTORY) {
        next.shift();
      }
      return next;
    });
  }, []);

  const dismissToast = useCallback((id) => {
    setToastQueue((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToastQueue([]);
  }, []);

  const handleGlobalError = useCallback(
    (error, options = {}) => {
      if (!error) return;

      const normalized =
        typeof error === 'string'
          ? { message: error }
          : {
              message: error.message || 'Unexpected error occurred',
              stack: error.stack,
              ...options,
            };

      console.debug?.('AppContext captured global error', normalized);
      setGlobalError(normalized);
      queueToast(normalized.message, 'error');
    },
    [queueToast]
  );

  const clearGlobalError = useCallback(() => setGlobalError(null), []);

  const registerContext = useCallback((name, api) => {
    if (!name) return () => {};

    setRegisteredContexts((prev) => ({
      ...prev,
      [name]: api,
    }));

    return () =>
      setRegisteredContexts((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
  }, []);
  
  useEffect(() => {
    if (!isBrowser) return undefined;

    const handleOnline = () => {
      setIsOnline(true);
      if (!isInitialOnlineCheck.current) {
        queueToast('Back online. Your data is syncing again.', 'success', { id: 'network-status' });
      }
      isInitialOnlineCheck.current = false;
    };

    const handleOffline = () => {
      setIsOnline(false);
      queueToast('You are offline. Some actions will be unavailable.', 'error', { id: 'network-status' });
      isInitialOnlineCheck.current = false;
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Prime the state
    if (!navigator.onLine) {
      handleOffline();
    } else {
      handleOnline();
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [queueToast]);

  useEffect(() => {
    if (!isBrowser) return;
    localStorage.setItem('investx-theme', theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const contextValue = useMemo(() => {
    const {
      auth: authContext = null,
      leaderboard: leaderboardContext = null,
      achievements: achievementsContext = null,
      education: educationContext = null,
      portfolio: portfolioContext = null,
      clubs: clubsContext = null,
      analytics: analyticsContext = null,
      simulation: simulationContext = null,
      chat: chatContext = null,
    } = registeredContexts;

    return {
      isOnline,
      theme,
      setTheme,
      globalError,
      handleGlobalError,
      clearGlobalError,
      queueToast,
      dismissToast,
      clearToasts,
      toastQueue,
      registerContext,
      registeredContexts,
      auth: authContext,
      leaderboard: leaderboardContext,
      achievements: achievementsContext,
      education: educationContext,
      portfolio: portfolioContext,
      clubs: clubsContext,
      analytics: analyticsContext,
      simulation: simulationContext,
      chat: chatContext,
    };
  }, [clearGlobalError, clearToasts, dismissToast, globalError, isOnline, queueToast, registerContext, registeredContexts, theme, toastQueue]);
  
  return (
    <AppContext.Provider value={contextValue}>
      <AuthProvider>
        <LeaderboardProvider>
          <AchievementsProvider>
            <EducationProvider>
              <PortfolioProvider>
                <ClubsProvider>
                  <ChatProvider>
                    <SimulationProvider>{children}</SimulationProvider>
                  </ChatProvider>
                </ClubsProvider>
              </PortfolioProvider>
            </EducationProvider>
          </AchievementsProvider>
        </LeaderboardProvider>
      </AuthProvider>
    </AppContext.Provider>
  );
};

AppContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAppContext = useApp;

export default AppContext;

