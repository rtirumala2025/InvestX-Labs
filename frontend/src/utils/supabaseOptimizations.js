/**
 * Supabase Query Optimization Utilities
 * 
 * Provides optimized query helpers to reduce over-fetching
 * and improve performance.
 */

/**
 * Select only necessary columns instead of '*'
 * @param {string[]} columns - Array of column names to select
 * @returns {string} Comma-separated column string or '*' if empty
 */
export const selectColumns = (columns) => {
  if (!columns || columns.length === 0) return '*';
  return columns.join(', ');
};

/**
 * Common column selections for frequently queried tables
 */
export const COMMON_SELECTS = {
  user_profiles: selectColumns([
    'id',
    'username',
    'full_name',
    'avatar_url',
    'created_at',
    'updated_at',
    // Note: email is in auth.users, not user_profiles
    // Note: xp, net_worth, profile_completed may not exist in base schema
  ]),
  portfolios: selectColumns([
    'id',
    'user_id',
    'name',
    'description',
    'virtual_balance',
    'is_simulation',
    'created_at',
    'updated_at',
  ]),
  holdings: selectColumns([
    'id',
    'portfolio_id',
    'symbol',
    'shares',
    'purchase_price',
    'current_price',
    'purchase_date',
    'created_at',
    'updated_at',
  ]),
  transactions: selectColumns([
    'id',
    'portfolio_id',
    'symbol',
    'transaction_type',
    'shares',
    'price',
    'total_amount',
    'transaction_date',
    'created_at',
  ]),
  leaderboard_scores: selectColumns([
    'user_id',
    'username',
    'score',
    'rank',
    'portfolio_return',
    'achievements_count',
    'trades_count',
    'lessons_completed',
    'updated_at',
  ]),
};

/**
 * Cache configuration for different query types
 */
export const CACHE_CONFIG = {
  user_profile: { ttl: 5 * 60 * 1000 }, // 5 minutes
  portfolio: { ttl: 2 * 60 * 1000 }, // 2 minutes
  holdings: { ttl: 1 * 60 * 1000 }, // 1 minute
  transactions: { ttl: 5 * 60 * 1000 }, // 5 minutes
  leaderboard: { ttl: 30 * 1000 }, // 30 seconds
  market_data: { ttl: 60 * 1000 }, // 1 minute
};

/**
 * Simple in-memory cache for query results
 */
const queryCache = new Map();

/**
 * Get cached query result if available and not expired
 * @param {string} key - Cache key
 * @param {number} ttl - Time to live in milliseconds
 * @returns {any|null} Cached result or null
 */
export const getCachedQuery = (key, ttl = 60000) => {
  const cached = queryCache.get(key);
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > ttl) {
    queryCache.delete(key);
    return null;
  }
  
  return cached.data;
};

/**
 * Cache a query result
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 */
export const setCachedQuery = (key, data) => {
  queryCache.set(key, {
    data,
    timestamp: Date.now(),
  });
};

/**
 * Clear cache for a specific key or all cache
 * @param {string|null} key - Cache key to clear, or null to clear all
 */
export const clearCache = (key = null) => {
  if (key) {
    queryCache.delete(key);
  } else {
    queryCache.clear();
  }
};

/**
 * Generate cache key from query parameters
 * @param {string} table - Table name
 * @param {object} filters - Query filters
 * @returns {string} Cache key
 */
export const generateCacheKey = (table, filters = {}) => {
  const filterStr = JSON.stringify(filters);
  return `${table}:${filterStr}`;
};

