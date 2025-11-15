import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchAnalyticsSummary } from '../services/analytics/analyticsService';
import offlineAnalyticsSummary from '../data/offlineAnalytics';
import { useApp } from '../contexts/AppContext';

export const useAnalytics = () => {
  const { queueToast, registerContext } = useApp();
  const [summary, setSummary] = useState(offlineAnalyticsSummary);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offline, setOffline] = useState(false);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = await fetchAnalyticsSummary();
      setSummary(payload);
      setOffline(Boolean(payload?.metadata?.offline));
      if (payload?.metadata?.offline) {
        queueToast('Analytics are in offline mode. Showing cached insights.', 'warning', {
          id: 'analytics-offline'
        });
      }
    } catch (loadError) {
      console.warn('📈 [useAnalytics] Failed to load analytics summary', loadError);
      setError(loadError.message || 'Unable to load analytics summary.');
      setSummary(offlineAnalyticsSummary);
      setOffline(true);
      queueToast(loadError.message || 'Analytics are offline. Showing cached insights.', 'warning', {
        id: 'analytics-offline-error'
      });
    } finally {
      setLoading(false);
    }
  }, [queueToast]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  useEffect(() => {
    let unregister;
    if (registerContext) {
      unregister = registerContext('analytics', {
        offline,
        loading,
        summary
      });
    }
    return () => unregister?.();
  }, [loading, offline, registerContext, summary]);

  const eventBreakdown = useMemo(() => summary?.byEvent || [], [summary]);

  return {
    summary,
    eventBreakdown,
    loading,
    error,
    offline,
    refreshAnalytics: loadAnalytics
  };
};

export default useAnalytics;

