import { supabase } from '../supabase/config';
import offlineAnalyticsSummary from '../../data/offlineAnalytics';

const STORAGE_KEY = 'investx.analytics.summary';

const isBrowser = typeof window !== 'undefined';

const getStorage = () => {
  if (!isBrowser) return null;
  try {
    return window.localStorage;
  } catch (error) {
    console.warn('📈 [AnalyticsService] Local storage unavailable:', error);
    return null;
  }
};

const cacheSummary = (summary) => {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(summary));
  } catch (error) {
    console.warn('📈 [AnalyticsService] Failed to cache analytics summary:', error);
  }
};

const loadCachedSummary = () => {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn('📈 [AnalyticsService] Failed to read cached analytics summary:', error);
    return null;
  }
};

const normalizeSummary = (events = []) => {
  const counts = events.reduce((acc, row) => {
    const key = row.event_type || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return {
    timeframe: '7d',
    totals: {
      events: events.length,
      uniqueUsers: new Set(events.map((row) => row.user_id).filter(Boolean)).size,
      sessions: new Set(events.map((row) => row.session_id).filter(Boolean)).size
    },
    byEvent: Object.entries(counts).map(([event_type, count]) => ({ event_type, count })),
    metadata: {
      offline: false,
      generatedAt: new Date().toISOString()
    }
  };
};

export const fetchAnalyticsSummary = async () => {
  if (!supabase?.from) {
    const cached = loadCachedSummary();
    return cached || offlineAnalyticsSummary;
  }

  try {
    const { data, error } = await supabase
      .from('analytics_events')
      .select('event_type, user_id, session_id')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      throw error;
    }

    const summary = normalizeSummary(data || []);
    cacheSummary(summary);
    return summary;
  } catch (error) {
    console.warn('📈 [AnalyticsService] Failed to load analytics summary:', error);
    const cached = loadCachedSummary();
    return (
      cached || {
        ...offlineAnalyticsSummary,
        metadata: {
          ...offlineAnalyticsSummary.metadata,
          reason: error.message || 'Supabase unavailable'
        }
      }
    );
  }
};

export default {
  fetchAnalyticsSummary
};

