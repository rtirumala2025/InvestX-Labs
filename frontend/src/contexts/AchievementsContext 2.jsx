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
import { supabase } from '../services/supabase/config';
import { updateUserStats } from '../services/leaderboard/supabaseLeaderboardService';
import { useApp } from './AppContext';

const AchievementsContext = createContext(null);

const ACHIEVEMENT_XP_REWARD = 150;

export const AchievementsProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;
  const { queueToast, registerContext } = useApp();

  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const listenersRef = useRef(new Set());

  const generateTempId = useCallback(() => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }, []);

  const notifyListeners = useCallback(() => {
    listenersRef.current.forEach((callback) => {
      try {
        callback();
      } catch (listenerError) {
        console.debug?.('AchievementsContext listener error', listenerError);
      }
    });
  }, []);

  const fetchAchievements = useCallback(async ({ showLoader = true } = {}) => {
    if (!userId) {
      setAchievements([]);
      if (showLoader) {
        setLoading(false);
      }
      return;
    }

    if (showLoader) {
      setLoading(true);
    }
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('achievements')
        .select('id, user_id, type, details, earned_at')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (fetchError) throw fetchError;

      setAchievements(data || []);
      notifyListeners();
    } catch (fetchError) {
      console.debug?.('AchievementsContext load error', fetchError);
      queueToast(fetchError?.message || 'Unable to load achievements.', 'error');
      setAchievements([]);
      setError(fetchError);
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, [notifyListeners, queueToast, userId]);

  useEffect(() => {
    fetchAchievements({ showLoader: true });
  }, [fetchAchievements]);

  useEffect(() => {
    if (!userId) return undefined;

    const channel = supabase
      .channel(`achievements-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'achievements',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchAchievements({ showLoader: false });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAchievements, userId]);

  const addAchievement = useCallback(
    async (type, details = {}, options = {}) => {
      if (!userId) {
        queueToast('Please sign in to earn achievements.', 'error');
        return { success: false, error: new Error('Not authenticated') };
      }

      const normalizedType = type || 'achievement';
      const xpReward = options.xpReward ?? ACHIEVEMENT_XP_REWARD;
      const netWorthDelta = options.netWorthDelta ?? 0;

      const alreadyEarned = achievements.some((achievement) => achievement.type === normalizedType);
      if (alreadyEarned && !options.allowDuplicates) {
        return { success: false, error: new Error('Achievement already earned.') };
      }

      const optimisticAchievement = {
        id: generateTempId(),
        user_id: userId,
        type: normalizedType,
        details,
        earned_at: new Date().toISOString(),
      };

      setAchievements((prev) => [optimisticAchievement, ...prev]);

      try {
        // Use upsert to handle duplicates gracefully
        const { error: insertError, data: insertedData } = await supabase
          .from('achievements')
          .upsert({
            user_id: userId,
            type: normalizedType,
            details,
          }, {
            onConflict: 'user_id,type',
            ignoreDuplicates: false
          })
          .select()
          .single();

        if (insertError) throw insertError;

        await updateUserStats(userId, xpReward, netWorthDelta);

        queueToast('Achievement unlocked! 🎉', 'success');

        setAchievements((prev) => {
          const filtered = prev.filter((item) => item.id !== optimisticAchievement.id);
          return insertedData ? [insertedData, ...filtered] : filtered;
        });
        notifyListeners();

        return { success: true, data: insertedData };
      } catch (insertError) {
        console.debug?.('AchievementsContext add achievement error', insertError);
        queueToast(insertError?.message || 'Unable to add achievement.', 'error');
        setAchievements((prev) => prev.filter((item) => item.id !== optimisticAchievement.id));
        return { success: false, error: insertError };
      }
    },
    [achievements, generateTempId, notifyListeners, queueToast, userId]
  );

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
      achievements,
      loading,
      error,
      addAchievement,
      subscribeRealtime,
      refreshAchievements: fetchAchievements,
    }),
    [achievements, addAchievement, error, fetchAchievements, loading, subscribeRealtime]
  );

  useEffect(() => {
    let unregister;
    if (registerContext) {
      unregister = registerContext('achievements', {
        achievements,
        loading,
        error,
      });
    }
    return () => unregister?.();
  }, [achievements, error, loading, registerContext]);

  return (
    <AchievementsContext.Provider value={contextValue}>
      {children}
    </AchievementsContext.Provider>
  );
};

export const useAchievements = () => {
  const context = useContext(AchievementsContext);
  if (!context) {
    throw new Error('useAchievements must be used within an AchievementsProvider');
  }
  return context;
};

export default AchievementsContext;

