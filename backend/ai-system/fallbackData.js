export const fallbackStrategies = [
  {
    strategy_id: 'demo_growth_etf',
    title: 'Beginner ETF Growth Path',
    summary: 'Learn how broad market ETFs can introduce diversified growth with minimal upkeep.',
    tags: ['etf', 'diversification', 'long-term'],
    ticker: 'VOO',
    similarity: 0.72,
    metadata: {
      education_focus: 'Understand how index funds provide diversified exposure to the U.S. market.',
      why_it_matters: 'You mentioned wanting steady growth while building confidence as a new investor.'
    }
  },
  {
    strategy_id: 'demo_savings_goal',
    title: 'Goal-Based Savings Ladder',
    summary: 'Explore how setting tiered goals makes saving for short-term needs feel manageable.',
    tags: ['budgeting', 'habits', 'cash-management'],
    ticker: 'CASH',
    similarity: 0.64,
    metadata: {
      education_focus: 'Practice creating achievable savings checkpoints using a ladder strategy.',
      why_it_matters: 'You listed saving for a big purchase and building financial habits as priorities.'
    }
  },
  {
    strategy_id: 'demo_learning_loop',
    title: 'Monthly Learning Sprint',
    summary: 'Build a monthly routine that pairs small investments with specific learning topics.',
    tags: ['education', 'habits'],
    ticker: 'EDU',
    similarity: 0.69,
    metadata: {
      education_focus: 'Combine hands-on portfolio practice with reflection to reinforce learning.',
      why_it_matters: 'You shared that staying motivated and curious helps you learn best.'
    }
  }
];

export const fallbackSuggestionLogs = [{
  id: 'fallback_log_1',
  created_at: new Date().toISOString(),
  user_id: 'fallback_user',
  metadata: {
    note: 'Offline fallback log entry'
  }
}];

export const fallbackNewsSummary = {
  summary: 'Live market data is temporarily unavailable. We will refresh this insight as soon as services reconnect.',
  sentiment: 0,
  sentimentLabel: 'neutral'
};

