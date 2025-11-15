import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAuth } from './AuthContext';
import {
  getLeaderboard,
  getUserRank,
  subscribeLeaderboardUpdates,
  getPendingStatUpdates,
  clearPendingStatUpdates,
  updateUserStats,
} from '../services/leaderboard/supabaseLeaderboardService';
import { useApp } from './AppContext';

const LeaderboardContext = createContext(null);

export const LeaderboardProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;
  const { queueToast, registerContext } = useApp();

  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offline, setOffline] = useState(false);

  const listenersRef = useRef(new Set());

  const fetchLeaderboard = useCallback(
    async ({ showLoader = true } = {}) => {
      if (showLoader) {
        setLoading(true);
      }

      const { data, offline: leaderboardOffline, error: leaderboardError, reason } = await getLeaderboard();

      if (leaderboardError && !leaderboardOffline) {
        const message = leaderboardError.message || 'Unable to load leaderboard.';
        setError(message);
        setLeaderboard([]);
        queueToast(message, 'error');
      } else {
        setLeaderboard(data || []);
        setError(null);
        if (leaderboardOffline) {
          queueToast(reason || 'Leaderboard is in offline mode. Showing cached standings.', 'warning', {
            id: 'leaderboard-offline'
          });
        }
      }

      setOffline(Boolean(leaderboardOffline));

      if (userId) {
        const { data: rankData, offline: rankOffline, error: rankError, reason: rankReason } = await getUserRank(userId);
        if (!rankError || rankOffline) {
          setUserRank(rankData);
          if (rankOffline) {
            queueToast(rankReason || 'Your stats will sync once you reconnect.', 'warning', {
              id: 'leaderboard-rank-offline'
            });
          }
        } else {
          setUserRank(null);
          const message = rankError.message || 'Unable to load user rank.';
          setError(message);
          queueToast(message, 'error');
        }
      } else {
        setUserRank(null);
      }

      if (!leaderboardOffline) {
        const pending = getPendingStatUpdates();
        if (pending.length) {
          for (const item of pending) {
            try {
              await updateUserStats(item.userId, item.payload.deltaXP, item.payload.deltaNetWorth);
            } catch (syncError) {
              console.debug?.('LeaderboardContext pending stat sync error', syncError);
              break;
            }
          }
          clearPendingStatUpdates();
        }
      }

      if (showLoader) {
        setLoading(false);
      }
    },
    [queueToast, userId]
  );

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  useEffect(() => {
    const { unsubscribe } = subscribeLeaderboardUpdates(async () => {
      await fetchLeaderboard({ showLoader: false });
      listenersRef.current.forEach((callback) => {
        try {
          callback();
        } catch (listenerError) {
          console.debug?.('LeaderboardContext realtime listener error', listenerError);
        }
      });
    });

    return () => {
      unsubscribe();
    };
  }, [fetchLeaderboard]);

  const subscribeRealtime = useCallback((callback) => {
    if (typeof callback !== 'function') {
      return () => {};
    }

    listenersRef.current.add(callback);

    return () => {
      listenersRef.current.delete(callback);
    };
  }, []);

  const contextValue = useMemo(
    () => ({
      leaderboard,
      userRank,
      loading,
      error,
      offline,
      refreshLeaderboard: fetchLeaderboard,
      subscribeRealtime,
    }),
    [leaderboard, userRank, loading, error, offline, fetchLeaderboard, subscribeRealtime]
  );

  useEffect(() => {
    let unregister;
    if (registerContext) {
      unregister = registerContext('leaderboard', {
        leaderboard,
        userRank,
        loading,
        error,
        offline,
      });
    }
    return () => unregister?.();
  }, [leaderboard, userRank, loading, error, offline, registerContext]);

  return (
    <LeaderboardContext.Provider value={contextValue}>
      {children}
    </LeaderboardContext.Provider>
  );
};

export const useLeaderboard = () => {
  const context = useContext(LeaderboardContext);
  if (!context) {
    throw new Error('useLeaderboard must be used within a LeaderboardProvider');
  }
  return context;
};

export default LeaderboardContext;

