export const offlineAnalyticsSummary = {
  timeframe: '7d',
  totals: {
    events: 128,
    uniqueUsers: 42,
    sessions: 67
  },
  byEvent: [
    { event_type: 'portfolio_updated', count: 24 },
    { event_type: 'lesson_completed', count: 31 },
    { event_type: 'diagnostic_run', count: 14 },
    { event_type: 'ai_suggestion_viewed', count: 59 }
  ],
  metadata: {
    offline: true,
    notes: 'Analytics data is cached for offline review.'
  }
};

export default offlineAnalyticsSummary;

