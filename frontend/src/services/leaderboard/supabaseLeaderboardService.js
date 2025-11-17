import { supabase } from '../supabase/config';
import offlineLeaderboard from '../../data/offlineLeaderboard';

const LEADERBOARD_TABLE = 'leaderboard_scores';
const LEGACY_LEADERBOARD_TABLE = 'leaderboard_scores';
const USER_PROFILES_TABLE = 'user_profiles';

const STORAGE_KEYS = {
  leaderboard: 'investx.leaderboard.snapshot',
  rank: 'investx.leaderboard.rank',
  pendingStats: 'investx.leaderboard.pendingStats'
};

const isBrowser = typeof window !== 'undefined';

const getStorage = () => {
  if (!isBrowser) return null;
  try {
    return window.localStorage;
  } catch (error) {
    console.warn('🏆 [LeaderboardService] Local storage unavailable:', error);
    return null;
  }
};

const cacheEntries = (entries) => {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEYS.leaderboard, JSON.stringify(entries));
  } catch (error) {
    console.warn('🏆 [LeaderboardService] Failed to cache leaderboard snapshot:', error);
  }
};

const loadCachedEntries = () => {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORAGE_KEYS.leaderboard);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn('🏆 [LeaderboardService] Failed to read cached leaderboard snapshot:', error);
    return null;
  }
};

const cacheRank = (userId, payload) => {
  const storage = getStorage();
  if (!storage || !userId) return;
  try {
    const raw = storage.getItem(STORAGE_KEYS.rank);
    const snapshot = raw ? JSON.parse(raw) : {};
    snapshot[userId] = payload;
    storage.setItem(STORAGE_KEYS.rank, JSON.stringify(snapshot));
  } catch (error) {
    console.warn('🏆 [LeaderboardService] Failed to cache user rank:', error);
  }
};

const loadCachedRank = (userId) => {
  const storage = getStorage();
  if (!storage || !userId) return null;
  try {
    const raw = storage.getItem(STORAGE_KEYS.rank);
    if (!raw) return null;
    const snapshot = JSON.parse(raw);
    return snapshot[userId] || null;
  } catch (error) {
    console.warn('🏆 [LeaderboardService] Failed to read cached user rank:', error);
    return null;
  }
};

const queueStatUpdate = (userId, payload) => {
  const storage = getStorage();
  if (!storage) return;
  try {
    const raw = storage.getItem(STORAGE_KEYS.pendingStats);
    const queue = raw ? JSON.parse(raw) : [];
    queue.push({ userId, payload, queuedAt: new Date().toISOString() });
    storage.setItem(STORAGE_KEYS.pendingStats, JSON.stringify(queue));
  } catch (error) {
    console.warn('🏆 [LeaderboardService] Failed to queue stats update:', error);
  }
};

export const getPendingStatUpdates = () => {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(STORAGE_KEYS.pendingStats);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.warn('🏆 [LeaderboardService] Failed to read queued stats:', error);
    return [];
  }
};

export const clearPendingStatUpdates = () => {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEYS.pendingStats);
  } catch (error) {
    console.warn('🏆 [LeaderboardService] Failed to clear pending stats queue:', error);
  }
};

export const getLeaderboard = async (limit = 50) => {
  const fallbackResponse = (reason) => {
    const cached = loadCachedEntries();
    if (cached?.length) {
      return { data: cached, offline: true, reason };
    }
    return { data: offlineLeaderboard.entries, offline: true, reason };
  };

  if (!supabase?.from) {
    return fallbackResponse('Supabase client unavailable');
  }

  try {
    const { data, error } = await supabase
      .from(LEADERBOARD_TABLE)
      .select(
        `
          user_id,
          username,
          score,
          rank,
          portfolio_return,
          achievements_count,
          trades_count,
          lessons_completed,
          updated_at
        `
      )
      .order('rank', { ascending: true })
      .limit(limit);

    if (error) throw error;

    const entries = data || [];
    const userIds = entries.map((entry) => entry.user_id).filter(Boolean);

    let profilesMap = new Map();
    if (userIds.length) {
      const { data: profiles, error: profilesError } = await supabase
        .from(USER_PROFILES_TABLE)
        .select('id, username, full_name, avatar_url, xp, net_worth')
        .in('id', userIds);

      if (profilesError) {
        throw profilesError;
      }

      profilesMap = new Map((profiles || []).map((profile) => [profile.id, profile]));
    }

    const normalized = entries.map((entry, index) => {
      const profile = profilesMap.get(entry.user_id) || {};
      return {
        user_id: entry.user_id,
        rank: entry.rank ?? index + 1,
        score: entry.score ?? 0,
        xp: profile.xp ?? entry.score ?? 0,
        net_worth: Number(profile.net_worth ?? 0),
        portfolio_return: entry.portfolio_return ?? 0,
        achievements_count: entry.achievements_count ?? 0,
        trades_count: entry.trades_count ?? 0,
        lessons_completed: entry.lessons_completed ?? 0,
        updated_at: entry.updated_at,
        username: entry.username ?? profile.username ?? null,
        user: Object.keys(profile).length
          ? {
              username: profile.username,
              full_name: profile.full_name,
              avatar_url: profile.avatar_url
            }
          : null
      };
    });

    cacheEntries(normalized);
    return { data: normalized, offline: false, error: null };
  } catch (error) {
    console.error('🏆 [LeaderboardService] load leaderboard error:', error);
    return fallbackResponse(error.message);
  }
};

export const getUserRank = async (userId) => {
  if (!userId) {
    return { data: null, offline: false, error: null };
  }

  const fallbackResponse = (reason) => {
    const cached = loadCachedRank(userId);
    if (cached) {
      return { data: cached, offline: true, reason };
    }
    return { data: offlineLeaderboard.userRank, offline: true, reason };
  };

  if (!supabase?.from) {
    return fallbackResponse('Supabase client unavailable');
  }

  try {
    const { data: rankRow, error: rankError } = await supabase
      .from(LEADERBOARD_TABLE)
      .select(
        'user_id, rank, score, portfolio_return, achievements_count, trades_count, lessons_completed, updated_at'
      )
      .eq('user_id', userId)
      .maybeSingle();

    if (rankError) throw rankError;

    if (!rankRow) {
      return { data: null, offline: false, error: null };
    }

    const { data: profile, error: profileError } = await supabase
      .from(USER_PROFILES_TABLE)
      .select('xp, net_worth, username, full_name, avatar_url')
      .eq('id', userId)
      .maybeSingle();

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }

    const payload = {
      rank: rankRow.rank ?? null,
      xp: profile?.xp ?? rankRow.score ?? 0,
      net_worth: Number(profile?.net_worth ?? 0),
      portfolio_return: rankRow.portfolio_return ?? 0,
      achievements_count: rankRow.achievements_count ?? 0,
      trades_count: rankRow.trades_count ?? 0,
      lessons_completed: rankRow.lessons_completed ?? 0,
      updated_at: rankRow.updated_at,
      user: profile
        ? {
            username: profile.username,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url
          }
        : null
    };

    cacheRank(userId, payload);
    return { data: payload, offline: false, error: null };
  } catch (error) {
    console.error('🏆 [LeaderboardService] load user rank error:', error);
    return fallbackResponse(error.message);
  }
};

export const subscribeLeaderboardUpdates = (callback) => {
  if (!supabase?.channel) {
    console.warn('🏆 [LeaderboardService] Supabase channel unavailable for realtime subscriptions');
    return {
      unsubscribe: () => {}
    };
  }

  const channel = supabase
    .channel('realtime-leaderboard', {
      config: {
        broadcast: { self: false },
        presence: { key: 'leaderboard' }
      }
    })
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: LEADERBOARD_TABLE,
        filter: '*' // Listen to all changes
      },
      (payload) => {
        try {
          console.debug('🏆 [LeaderboardService] Realtime update received', {
            event: payload.eventType,
            table: payload.table,
            new: payload.new ? { user_id: payload.new.user_id, rank: payload.new.rank } : null,
            old: payload.old ? { user_id: payload.old.user_id, rank: payload.old.rank } : null
          });
          callback?.(payload);
        } catch (callbackError) {
          console.error('🏆 [LeaderboardService] Callback error:', callbackError);
        }
      }
    )
    .subscribe((status) => {
      console.debug('🏆 [LeaderboardService] Realtime subscription status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('🏆 [LeaderboardService] Successfully subscribed to leaderboard updates');
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn('🏆 [LeaderboardService] Realtime channel error:', status);
      }
    });

  return {
    unsubscribe: () => {
      try {
        supabase.removeChannel?.(channel);
        console.debug('🏆 [LeaderboardService] Unsubscribed from leaderboard updates');
      } catch (error) {
        console.warn('🏆 [LeaderboardService] Error unsubscribing:', error);
      }
    }
  };
};

export const updateUserStats = async (userId, deltaXP = 0, deltaNetWorth = 0) => {
  if (!userId) {
    const error = new Error('User ID is required for leaderboard updates.');
    return { data: null, offline: true, queued: true, error };
  }

  if (!supabase?.from) {
    queueStatUpdate(userId, { deltaXP, deltaNetWorth });
    return { data: null, offline: true, queued: true, error: new Error('Supabase unavailable') };
  }

  try {
    const { data: existingRow, error: fetchError } = await supabase
      .from(LEGACY_LEADERBOARD_TABLE)
      .select('id, xp, net_worth')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    const currentXp = existingRow?.xp || 0;
    const currentNetWorth = Number(existingRow?.net_worth) || 0;

    const newXp = Math.max(0, currentXp + (deltaXP || 0));
    const newNetWorth = currentNetWorth + (deltaNetWorth || 0);
    const updatedAt = new Date().toISOString();

    const upsertPayload = {
      user_id: userId,
      xp: newXp,
      net_worth: newNetWorth,
      updated_at: updatedAt
    };

    if (existingRow?.id) {
      upsertPayload.id = existingRow.id;
    }

    const { data: updatedLeaderboard, error: upsertError } = await supabase
      .from(LEGACY_LEADERBOARD_TABLE)
      .upsert(upsertPayload, { onConflict: 'user_id' })
      .select()
      .single();

    if (upsertError) throw upsertError;

    const { error: profileError } = await supabase
      .from(USER_PROFILES_TABLE)
      .update({
        xp: newXp,
        net_worth: newNetWorth,
        updated_at: updatedAt
      })
      .eq('id', userId);

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }

    return { data: updatedLeaderboard, offline: false, queued: false, error: null };
  } catch (error) {
    console.error('🏆 [LeaderboardService] update user stats error:', error);
    queueStatUpdate(userId, { deltaXP, deltaNetWorth });
    return { data: null, offline: true, queued: true, error };
  }
};

const leaderboardService = {
  getLeaderboard,
  getUserRank,
  subscribeLeaderboardUpdates,
  updateUserStats,
  getPendingStatUpdates,
  clearPendingStatUpdates
};

export default leaderboardService;

