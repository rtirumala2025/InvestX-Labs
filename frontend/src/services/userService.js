/**
 * User Service
 * 
 * Handles user profile and preferences management with Supabase integration.
 * Features:
 * - Supabase RPC integration
 * - In-memory caching with TTL
 * - Automatic cache invalidation on updates
 * - Fallback to mock data in development
 * - Centralized error handling
 * - Browser and Node.js compatible
 */

import { supabase } from '../lib/supabaseClient.js';

// Logging utilities
const isDevelopment = process.env.NODE_ENV === 'development' || 
                     (typeof window !== 'undefined' && window.location?.hostname === 'localhost');

const logInfo = (message, data = {}) => {
  if (isDevelopment) {
    console.log(`[UserService] ${message}`, data);
  }
};

const logError = (message, error = {}) => {
  console.error(`[UserService] ${message}`, error);
};

// Cache configuration
const CACHE_TTL = {
  PROFILE: 5 * 60 * 1000, // 5 minutes
  PREFERENCES: 10 * 60 * 1000, // 10 minutes
};

// In-memory cache
const cache = new Map();

/**
 * Cache utilities
 */
const getCacheKey = (type, userId) => `${type}:${userId}`;

const getCachedData = (type, userId) => {
  const key = getCacheKey(type, userId);
  const cached = cache.get(key);
  
  if (!cached) return null;
  
  const now = Date.now();
  if (now > cached.expiresAt) {
    cache.delete(key);
    return null;
  }
  
  logInfo(`Cache hit for ${type}`, { userId });
  return cached.data;
};

const setCachedData = (type, userId, data, ttl) => {
  const key = getCacheKey(type, userId);
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttl,
  });
  logInfo(`Cached ${type}`, { userId, ttl });
};

const invalidateCache = (type, userId) => {
  const key = getCacheKey(type, userId);
  cache.delete(key);
  logInfo(`Invalidated cache for ${type}`, { userId });
};

const clearAllCache = () => {
  cache.clear();
  logInfo('Cleared all cache');
};

/**
 * Mock data generators for fallback
 */
const generateMockProfile = (userId) => ({
  user_id: userId,
  email: `user${userId.slice(0, 8)}@example.com`,
  full_name: 'Demo User',
  avatar_url: null,
  bio: 'Investment enthusiast learning about financial markets',
  experience_level: 'intermediate',
  investment_goals: ['growth', 'income'],
  risk_tolerance: 'moderate',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const generateMockPreferences = (userId) => ({
  user_id: userId,
  theme: 'light',
  language: 'en',
  currency: 'USD',
  notifications: {
    email: true,
    push: true,
    price_alerts: true,
    market_updates: true,
    portfolio_updates: true,
  },
  dashboard: {
    default_view: 'overview',
    show_news: true,
    show_recommendations: true,
    show_portfolio: true,
  },
  privacy: {
    profile_visibility: 'private',
    share_portfolio: false,
    share_activity: false,
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

/**
 * Get user profile
 * @param {string} userId - User ID (UUID)
 * @param {object} options - Options { useCache: boolean }
 * @returns {Promise<object>} User profile data
 */
export const getUserProfile = async (userId, options = {}) => {
  const { useCache = true } = options;
  
  try {
    // Check cache first
    if (useCache) {
      const cached = getCachedData('profile', userId);
      if (cached) return cached;
    }
    
    logInfo('Fetching user profile', { userId });
    
    // Call Supabase RPC
    const { data, error } = await supabase
      .rpc('get_user_profile', { p_user_id: userId })
      .single();
    
    if (error) throw error;
    
    // Cache the result
    if (useCache && data) {
      setCachedData('profile', userId, data, CACHE_TTL.PROFILE);
    }
    
    logInfo('Successfully fetched user profile', { userId });
    return data;
    
  } catch (error) {
    logError('Error fetching user profile', { error, userId });
    
    // Fallback to mock data in development
    if (isDevelopment) {
      logInfo('Using mock profile data in development', { userId });
      const mockData = generateMockProfile(userId);
      if (useCache) {
        setCachedData('profile', userId, mockData, CACHE_TTL.PROFILE);
      }
      return mockData;
    }
    
    throw error;
  }
};

/**
 * Update user profile
 * @param {string} userId - User ID (UUID)
 * @param {object} updates - Profile updates
 * @returns {Promise<object>} Updated user profile
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    logInfo('Updating user profile', { userId, updates });
    
    // Call Supabase RPC
    const { data, error } = await supabase
      .rpc('update_user_profile', {
        p_user_id: userId,
        p_profile_updates: updates,
      })
      .single();
    
    if (error) throw error;
    
    // Invalidate cache
    invalidateCache('profile', userId);
    
    // Cache the new data
    setCachedData('profile', userId, data, CACHE_TTL.PROFILE);
    
    logInfo('Successfully updated user profile', { userId });
    return data;
    
  } catch (error) {
    logError('Error updating user profile', { error, userId, updates });
    
    // Fallback to mock data in development
    if (isDevelopment) {
      logInfo('Using mock profile update in development', { userId });
      const mockData = {
        ...generateMockProfile(userId),
        ...updates,
        updated_at: new Date().toISOString(),
      };
      invalidateCache('profile', userId);
      setCachedData('profile', userId, mockData, CACHE_TTL.PROFILE);
      return mockData;
    }
    
    throw error;
  }
};

/**
 * Get user preferences
 * @param {string} userId - User ID (UUID)
 * @param {object} options - Options { useCache: boolean }
 * @returns {Promise<object>} User preferences
 */
export const getUserPreferences = async (userId, options = {}) => {
  const { useCache = true } = options;
  
  try {
    // Check cache first
    if (useCache) {
      const cached = getCachedData('preferences', userId);
      if (cached) return cached;
    }
    
    logInfo('Fetching user preferences', { userId });
    
    // Call Supabase RPC
    const { data, error } = await supabase
      .rpc('get_user_preferences', { p_user_id: userId })
      .single();
    
    if (error) throw error;
    
    // Cache the result
    if (useCache && data) {
      setCachedData('preferences', userId, data, CACHE_TTL.PREFERENCES);
    }
    
    logInfo('Successfully fetched user preferences', { userId });
    return data;
    
  } catch (error) {
    logError('Error fetching user preferences', { error, userId });
    
    // Fallback to mock data in development
    if (isDevelopment) {
      logInfo('Using mock preferences data in development', { userId });
      const mockData = generateMockPreferences(userId);
      if (useCache) {
        setCachedData('preferences', userId, mockData, CACHE_TTL.PREFERENCES);
      }
      return mockData;
    }
    
    throw error;
  }
};

/**
 * Update user preferences
 * @param {string} userId - User ID (UUID)
 * @param {object} preferences - Preferences updates
 * @returns {Promise<object>} Updated user preferences
 */
export const updateUserPreferences = async (userId, preferences) => {
  try {
    logInfo('Updating user preferences', { userId, preferences });
    
    // Call Supabase RPC
    const { data, error } = await supabase
      .rpc('update_user_preferences', {
        p_user_id: userId,
        p_preferences: preferences,
      })
      .single();
    
    if (error) throw error;
    
    // Invalidate cache
    invalidateCache('preferences', userId);
    
    // Cache the new data
    setCachedData('preferences', userId, data, CACHE_TTL.PREFERENCES);
    
    logInfo('Successfully updated user preferences', { userId });
    return data;
    
  } catch (error) {
    logError('Error updating user preferences', { error, userId, preferences });
    
    // Fallback to mock data in development
    if (isDevelopment) {
      logInfo('Using mock preferences update in development', { userId });
      const mockData = {
        ...generateMockPreferences(userId),
        ...preferences,
        updated_at: new Date().toISOString(),
      };
      invalidateCache('preferences', userId);
      setCachedData('preferences', userId, mockData, CACHE_TTL.PREFERENCES);
      return mockData;
    }
    
    throw error;
  }
};

/**
 * Get complete user data (profile + preferences)
 * @param {string} userId - User ID (UUID)
 * @param {object} options - Options { useCache: boolean }
 * @returns {Promise<object>} Complete user data
 */
export const getUserData = async (userId, options = {}) => {
  try {
    logInfo('Fetching complete user data', { userId });
    
    const [profile, preferences] = await Promise.all([
      getUserProfile(userId, options),
      getUserPreferences(userId, options),
    ]);
    
    return {
      profile,
      preferences,
    };
    
  } catch (error) {
    logError('Error fetching complete user data', { error, userId });
    throw error;
  }
};

/**
 * Clear user cache
 * @param {string} userId - User ID (UUID)
 */
export const clearUserCache = (userId) => {
  invalidateCache('profile', userId);
  invalidateCache('preferences', userId);
  logInfo('Cleared user cache', { userId });
};

/**
 * Test connection to user service
 * @returns {Promise<object>} Connection test result
 */
export const testConnection = async () => {
  try {
    const testUserId = '00000000-0000-0000-0000-000000000000';
    await getUserProfile(testUserId, { useCache: false });
    
    return {
      success: true,
      message: 'User service connection successful',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      message: 'User service connection failed',
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

// Export utilities
export const userServiceUtils = {
  clearAllCache,
  clearUserCache,
  testConnection,
};

// Default export
const userService = {
  getUserProfile,
  updateUserProfile,
  getUserPreferences,
  updateUserPreferences,
  getUserData,
  clearUserCache,
  clearAllCache,
  testConnection,
};

export default userService;

/**
 * ============================================================================
 * USAGE EXAMPLES
 * ============================================================================
 */

/*
// Example 1: Get user profile
import { getUserProfile } from './services/userService';

const userId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const profile = await getUserProfile(userId);
console.log('User profile:', profile);

// Example 2: Update user profile
import { updateUserProfile } from './services/userService';

const updates = {
  full_name: 'John Doe',
  bio: 'Experienced investor',
  risk_tolerance: 'high',
};
const updatedProfile = await updateUserProfile(userId, updates);
console.log('Updated profile:', updatedProfile);

// Example 3: Get user preferences
import { getUserPreferences } from './services/userService';

const preferences = await getUserPreferences(userId);
console.log('User preferences:', preferences);

// Example 4: Update user preferences
import { updateUserPreferences } from './services/userService';

const newPreferences = {
  theme: 'dark',
  notifications: {
    email: false,
    push: true,
  },
};
const updatedPreferences = await updateUserPreferences(userId, newPreferences);
console.log('Updated preferences:', updatedPreferences);

// Example 5: Get complete user data
import { getUserData } from './services/userService';

const userData = await getUserData(userId);
console.log('Profile:', userData.profile);
console.log('Preferences:', userData.preferences);

// Example 6: Clear user cache
import { clearUserCache } from './services/userService';

clearUserCache(userId);

// Example 7: Test connection
import { testConnection } from './services/userService';

const connectionTest = await testConnection();
console.log('Connection test:', connectionTest);

// Example 8: Using default export
import userService from './services/userService';

const profile = await userService.getUserProfile(userId);
const preferences = await userService.getUserPreferences(userId);
userService.clearUserCache(userId);

// Example 9: Disable caching for fresh data
const freshProfile = await getUserProfile(userId, { useCache: false });

// Example 10: Error handling
import { getUserProfile } from './services/userService';

try {
  const profile = await getUserProfile(userId);
  console.log('Profile loaded:', profile);
} catch (error) {
  console.error('Failed to load profile:', error);
  // Handle error appropriately
}
*/
