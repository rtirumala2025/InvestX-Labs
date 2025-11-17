/**
 * Mock data for development and testing
 */

export const MOCK_USER_PROFILES = [
  {
    id: "user1",
    firstName: "Alex",
    lastName: "Johnson",
    age: 16,
    email: "alex.johnson@example.com",
    monthlyAllowance: 100,
    investmentGoals: ["College Fund", "First Car"],
    riskTolerance: "moderate",
    interests: ["technology", "renewable-energy"],
    onboardingCompleted: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "user2",
    firstName: "Sarah",
    lastName: "Williams",
    age: 17,
    email: "sarah.williams@example.com",
    monthlyAllowance: 150,
    investmentGoals: ["Travel Fund", "Emergency Fund"],
    riskTolerance: "conservative",
    interests: ["healthcare", "education"],
    onboardingCompleted: true,
    createdAt: "2024-01-15T00:00:00Z",
  },
];

export const MOCK_PORTFOLIOS = [
  {
    id: "portfolio1",
    userId: "user1",
    holdings: [
      {
        id: "holding1",
        symbol: "AAPL",
        companyName: "Apple Inc.",
        shares: 2,
        purchasePrice: 150.0,
        currentPrice: 175.5,
        purchaseDate: "2024-01-01",
        sector: "Technology",
        assetType: "Stock",
      },
      {
        id: "holding2",
        symbol: "TSLA",
        companyName: "Tesla Inc.",
        shares: 1,
        purchasePrice: 200.0,
        currentPrice: 185.25,
        purchaseDate: "2024-01-15",
        sector: "Automotive",
        assetType: "Stock",
      },
    ],
    totalValue: 536.25,
    totalCostBasis: 500.0,
    totalGainLoss: 36.25,
    totalGainLossPercentage: 7.25,
    diversificationScore: 65,
    riskScore: 45,
    lastUpdated: "2024-01-20T00:00:00Z",
  },
];

export const MOCK_SUGGESTIONS = [
  {
    id: "suggestion1",
    userId: "user1",
    type: "investment",
    title: "Consider Adding Microsoft (MSFT)",
    description:
      "Microsoft is a strong technology company with consistent growth and dividend payments.",
    reasoning:
      "Based on your interest in technology and moderate risk tolerance, Microsoft offers a good balance of growth and stability.",
    confidence: 85,
    sourceStrategy: "acorns",
    status: "pending",
    createdAt: "2024-01-20T00:00:00Z",
    expiresAt: "2024-02-20T00:00:00Z",
  },
  {
    id: "suggestion2",
    userId: "user1",
    type: "diversification",
    title: "Diversify with Healthcare ETF",
    description:
      "Consider adding a healthcare ETF to diversify your portfolio beyond technology stocks.",
    reasoning:
      "Your portfolio is currently concentrated in technology. Adding healthcare exposure can reduce risk.",
    confidence: 78,
    sourceStrategy: "greenlight",
    status: "pending",
    createdAt: "2024-01-19T00:00:00Z",
    expiresAt: "2024-02-19T00:00:00Z",
  },
];

export const MOCK_MARKET_DATA = {
  AAPL: {
    symbol: "AAPL",
    companyName: "Apple Inc.",
    currentPrice: 175.5,
    change: 2.25,
    changePercent: 1.3,
    volume: 45000000,
    marketCap: 2750000000000,
    pe: 28.5,
    high52Week: 198.23,
    low52Week: 124.17,
    sector: "Technology",
    industry: "Consumer Electronics",
  },
  TSLA: {
    symbol: "TSLA",
    companyName: "Tesla Inc.",
    currentPrice: 185.25,
    change: -5.75,
    changePercent: -3.01,
    volume: 32000000,
    marketCap: 580000000000,
    pe: 45.2,
    high52Week: 299.29,
    low52Week: 101.81,
    sector: "Automotive",
    industry: "Electric Vehicles",
  },
  MSFT: {
    symbol: "MSFT",
    companyName: "Microsoft Corporation",
    currentPrice: 415.2,
    change: 8.45,
    changePercent: 2.08,
    volume: 28000000,
    marketCap: 3080000000000,
    pe: 32.1,
    high52Week: 420.82,
    low52Week: 309.45,
    sector: "Technology",
    industry: "Software",
  },
};

export const MOCK_EDUCATIONAL_PROGRESS = [
  {
    userId: "user1",
    moduleId: "investment_basics",
    progress: 75,
    completedLessons: ["what_is_investing", "types_of_investments"],
    currentLesson: "risk_vs_return",
    startedAt: "2024-01-01T00:00:00Z",
    lastAccessed: "2024-01-20T00:00:00Z",
  },
  {
    userId: "user1",
    moduleId: "portfolio_diversification",
    progress: 25,
    completedLessons: ["what_is_diversification"],
    currentLesson: "asset_allocation",
    startedAt: "2024-01-15T00:00:00Z",
    lastAccessed: "2024-01-18T00:00:00Z",
  },
];

export const MOCK_BADGES = [
  {
    id: "badge1",
    userId: "user1",
    badgeId: "first_investment",
    name: "First Investment",
    description: "Added your first holding to your portfolio",
    icon: "🎯",
    earnedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "badge2",
    userId: "user1",
    badgeId: "risk_assessor",
    name: "Risk Assessor",
    description: "Completed risk tolerance assessment",
    icon: "⚡",
    earnedAt: "2024-01-01T00:00:00Z",
  },
];

export const MOCK_TRANSACTIONS = [
  {
    id: "transaction1",
    userId: "user1",
    type: "buy",
    symbol: "AAPL",
    shares: 2,
    price: 150.0,
    total: 300.0,
    date: "2024-01-01T00:00:00Z",
    status: "completed",
  },
  {
    id: "transaction2",
    userId: "user1",
    type: "buy",
    symbol: "TSLA",
    shares: 1,
    price: 200.0,
    total: 200.0,
    date: "2024-01-15T00:00:00Z",
    status: "completed",
  },
];

export const MOCK_WATCHLIST = [
  {
    id: "watchlist1",
    userId: "user1",
    symbol: "MSFT",
    companyName: "Microsoft Corporation",
    addedAt: "2024-01-10T00:00:00Z",
    targetPrice: 400.0,
    notes: "Strong cloud business, good dividend",
  },
  {
    id: "watchlist2",
    userId: "user1",
    symbol: "GOOGL",
    companyName: "Alphabet Inc.",
    addedAt: "2024-01-12T00:00:00Z",
    targetPrice: 140.0,
    notes: "AI and search dominance",
  },
];

export const MOCK_PRICE_ALERTS = [
  {
    id: "alert1",
    userId: "user1",
    symbol: "AAPL",
    targetPrice: 180.0,
    condition: "above",
    status: "active",
    createdAt: "2024-01-05T00:00:00Z",
  },
  {
    id: "alert2",
    userId: "user1",
    symbol: "TSLA",
    targetPrice: 160.0,
    condition: "below",
    status: "active",
    createdAt: "2024-01-10T00:00:00Z",
  },
];

export const MOCK_MARKET_NEWS = [
  {
    id: "news1",
    title: "Tech Stocks Rally on Strong Earnings",
    summary:
      "Major technology companies report better-than-expected quarterly earnings.",
    source: "Financial Times",
    publishedAt: "2024-01-20T10:00:00Z",
    sentiment: "positive",
    impact: "high",
    tags: ["technology", "earnings", "stocks"],
  },
  {
    id: "news2",
    title: "Federal Reserve Hints at Rate Cuts",
    summary:
      "Fed officials suggest potential interest rate reductions in upcoming meetings.",
    source: "Reuters",
    publishedAt: "2024-01-19T15:30:00Z",
    sentiment: "positive",
    impact: "medium",
    tags: ["federal-reserve", "interest-rates", "economy"],
  },
];

export const MOCK_SECTOR_PERFORMANCE = [
  {
    sector: "Technology",
    change: 2.5,
    changePercent: 1.8,
    topPerformers: ["AAPL", "MSFT", "GOOGL"],
  },
  {
    sector: "Healthcare",
    change: 1.2,
    changePercent: 0.9,
    topPerformers: ["JNJ", "PFE", "UNH"],
  },
  {
    sector: "Financial",
    change: -0.8,
    changePercent: -0.6,
    topPerformers: ["JPM", "BAC", "WFC"],
  },
];

export const MOCK_ECONOMIC_INDICATORS = {
  gdp: {
    value: 2.1,
    change: 0.2,
    period: "Q3 2024",
    trend: "up",
  },
  inflation: {
    value: 3.2,
    change: -0.1,
    period: "October 2024",
    trend: "down",
  },
  unemployment: {
    value: 3.8,
    change: 0.1,
    period: "October 2024",
    trend: "up",
  },
  interestRate: {
    value: 5.25,
    change: 0.0,
    period: "Current",
    trend: "stable",
  },
};

export const MOCK_HISTORICAL_DATA = {
  AAPL: [
    { date: "2024-01-01", price: 150.0, volume: 45000000 },
    { date: "2024-01-02", price: 152.5, volume: 42000000 },
    { date: "2024-01-03", price: 148.75, volume: 48000000 },
    { date: "2024-01-04", price: 155.2, volume: 41000000 },
    { date: "2024-01-05", price: 158.9, volume: 39000000 },
  ],
  TSLA: [
    { date: "2024-01-01", price: 200.0, volume: 32000000 },
    { date: "2024-01-02", price: 195.5, volume: 35000000 },
    { date: "2024-01-03", price: 198.25, volume: 31000000 },
    { date: "2024-01-04", price: 192.75, volume: 38000000 },
    { date: "2024-01-05", price: 188.5, volume: 36000000 },
  ],
};

export const MOCK_USER_PREFERENCES = {
  theme: "light",
  currency: "USD",
  dateFormat: "MM/DD/YYYY",
  notifications: {
    email: true,
    push: true,
    priceAlerts: true,
    marketUpdates: true,
  },
  dashboard: {
    showQuickStats: true,
    showRecentActivity: true,
    showAIInsights: true,
    showMarketNews: true,
  },
  portfolio: {
    defaultView: "overview",
    showUnrealizedGains: true,
    showDividends: true,
    showFees: true,
  },
};
