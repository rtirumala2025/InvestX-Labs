/**
 * Application constants
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_BASE_URL || 'https://api.investxlabs.com',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3
};

// Firebase Configuration
export const FIREBASE_CONFIG = {
  COLLECTIONS: {
    USERS: 'users',
    PORTFOLIOS: 'portfolios',
    HOLDINGS: 'holdings',
    SUGGESTIONS: 'suggestions',
    TRANSACTIONS: 'transactions',
    WATCHLIST: 'watchlist',
    ALERTS: 'alerts'
  }
};

// Investment Constants
export const INVESTMENT_TYPES = {
  STOCK: 'Stock',
  BOND: 'Bond',
  ETF: 'ETF',
  MUTUAL_FUND: 'Mutual Fund',
  CRYPTO: 'Cryptocurrency',
  COMMODITY: 'Commodity',
  REIT: 'REIT',
  OPTION: 'Option',
  FUTURE: 'Future'
};

export const SECTORS = {
  TECHNOLOGY: 'Technology',
  HEALTHCARE: 'Healthcare',
  FINANCIAL: 'Financial',
  CONSUMER_DISCRETIONARY: 'Consumer Discretionary',
  INDUSTRIAL: 'Industrial',
  ENERGY: 'Energy',
  MATERIALS: 'Materials',
  UTILITIES: 'Utilities',
  REAL_ESTATE: 'Real Estate',
  CONSUMER_STAPLES: 'Consumer Staples',
  COMMUNICATION_SERVICES: 'Communication Services'
};

export const RISK_LEVELS = {
  VERY_LOW: 'Very Low',
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  VERY_HIGH: 'Very High'
};

export const RISK_PROFILES = {
  CONSERVATIVE: 'conservative',
  MODERATE: 'moderate',
  BALANCED: 'balanced',
  AGGRESSIVE: 'aggressive'
};

// UI Constants
export const UI_CONFIG = {
  BREAKPOINTS: {
    SM: '640px',
    MD: '768px',
    LG: '1024px',
    XL: '1280px',
    '2XL': '1536px'
  },
  COLORS: {
    PRIMARY: '#2563eb',
    SECONDARY: '#64748b',
    SUCCESS: '#059669',
    WARNING: '#d97706',
    ERROR: '#dc2626',
    INFO: '#0891b2'
  },
  SPACING: {
    XS: '0.25rem',
    SM: '0.5rem',
    MD: '1rem',
    LG: '1.5rem',
    XL: '2rem',
    '2XL': '3rem'
  }
};

// Chart Configuration
export const CHART_CONFIG = {
  COLORS: [
    '#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed',
    '#0891b2', '#be123c', '#0d9488', '#ca8a04', '#9333ea'
  ],
  DEFAULT_OPTIONS: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  }
};

// Date and Time Constants
export const DATE_FORMATS = {
  SHORT: 'MM/DD/YYYY',
  LONG: 'MMMM DD, YYYY',
  ISO: 'YYYY-MM-DD',
  DISPLAY: 'MMM DD, YYYY'
};

export const TIME_PERIODS = {
  '1D': '1d',
  '5D': '5d',
  '1M': '1mo',
  '3M': '3mo',
  '6M': '6mo',
  '1Y': '1y',
  '2Y': '2y',
  '5Y': '5y',
  '10Y': '10y',
  'YTD': 'ytd',
  'MAX': 'max'
};

// Validation Constants
export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: {
    MIN_LENGTH: 6,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: false
  },
  SYMBOL: /^[A-Z]{1,5}$/,
  PRICE: {
    MIN: 0.01,
    MAX: 1000000,
    DECIMAL_PLACES: 2
  }
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  AUTH_ERROR: 'Authentication failed. Please try again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  PERMISSION_DENIED: 'You do not have permission to perform this action.',
  RATE_LIMIT: 'Too many requests. Please try again later.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Successfully logged in!',
  LOGOUT_SUCCESS: 'Successfully logged out!',
  SIGNUP_SUCCESS: 'Account created successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  HOLDING_ADDED: 'Holding added to portfolio!',
  HOLDING_UPDATED: 'Holding updated successfully!',
  HOLDING_REMOVED: 'Holding removed from portfolio!',
  SUGGESTION_DISMISSED: 'Suggestion dismissed!',
  ALERT_CREATED: 'Price alert created!',
  ALERT_UPDATED: 'Price alert updated!',
  ALERT_DELETED: 'Price alert deleted!'
};

// Local Storage Keys
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'userPreferences',
  WATCHLIST: 'watchlist',
  PRICE_ALERTS: 'priceAlerts',
  THEME: 'theme',
  CURRENCY: 'currency',
  DATE_FORMAT: 'dateFormat',
  NOTIFICATIONS: 'notifications'
};

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    SIGNUP: '/auth/signup',
    REFRESH: '/auth/refresh'
  },
  USER: {
    PROFILE: '/user/profile',
    PREFERENCES: '/user/preferences',
    ONBOARDING: '/user/onboarding'
  },
  PORTFOLIO: {
    BASE: '/portfolio',
    HOLDINGS: '/portfolio/holdings',
    PERFORMANCE: '/portfolio/performance',
    ALLOCATION: '/portfolio/allocation'
  },
  MARKET: {
    QUOTES: '/market/quotes',
    HISTORICAL: '/market/historical',
    SEARCH: '/market/search',
    INDICES: '/market/indices',
    SECTORS: '/market/sectors',
    NEWS: '/market/news'
  },
  AI: {
    SUGGESTIONS: '/ai/suggestions',
    ANALYSIS: '/ai/analysis',
    EXPLANATIONS: '/ai/explanations'
  }
};

// Feature Flags
export const FEATURE_FLAGS = {
  AI_SUGGESTIONS: process.env.REACT_APP_ENABLE_AI_SUGGESTIONS === 'true',
  REAL_TIME_DATA: process.env.REACT_APP_ENABLE_REAL_TIME_DATA === 'true',
  ADVANCED_CHARTS: process.env.REACT_APP_ENABLE_ADVANCED_CHARTS === 'true',
  SOCIAL_FEATURES: process.env.REACT_APP_ENABLE_SOCIAL_FEATURES === 'true',
  PREMIUM_FEATURES: process.env.REACT_APP_ENABLE_PREMIUM_FEATURES === 'true'
};

// Performance Constants
export const PERFORMANCE_CONFIG = {
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 1000,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  MAX_RETRIES: 3,
  TIMEOUT: 10000
};
