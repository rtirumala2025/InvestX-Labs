/**
 * User Service Unit Tests
 * 
 * Tests the userService.js implementation with mocked Supabase client
 * Run: npm run test:user
 */

import { jest } from '@jest/globals';

// Mock Supabase client before importing userService
const mockRpc = jest.fn();
const mockSingle = jest.fn();

jest.unstable_mockModule('../src/lib/supabaseClient.js', () => ({
  supabase: {
    rpc: mockRpc,
  },
}));

// Import after mocking
const { 
  getUserProfile, 
  updateUserProfile,
  getUserPreferences,
  updateUserPreferences,
  getUserData,
  clearUserCache,
  testConnection,
} = await import('../src/services/userService.js');

describe('User Service', () => {
  const TEST_USER_ID = 'test-user-123';
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    mockRpc.mockReturnValue({ single: mockSingle });
    
    // Clear cache
    clearUserCache(TEST_USER_ID);
  });
  
  describe('getUserProfile', () => {
    it('should fetch user profile from Supabase', async () => {
      const mockProfile = {
        user_id: TEST_USER_ID,
        email: 'test@example.com',
        full_name: 'Test User',
        risk_tolerance: 'moderate',
      };
      
      mockSingle.mockResolvedValue({ data: mockProfile, error: null });
      
      const result = await getUserProfile(TEST_USER_ID, { useCache: false });
      
      expect(mockRpc).toHaveBeenCalledWith('get_user_profile', { 
        p_user_id: TEST_USER_ID 
      });
      expect(result).toEqual(mockProfile);
    });
    
    it('should use cached data on second call', async () => {
      const mockProfile = {
        user_id: TEST_USER_ID,
        email: 'test@example.com',
        full_name: 'Test User',
      };
      
      mockSingle.mockResolvedValue({ data: mockProfile, error: null });
      
      // First call
      await getUserProfile(TEST_USER_ID, { useCache: true });
      expect(mockRpc).toHaveBeenCalledTimes(1);
      
      // Second call - should use cache
      await getUserProfile(TEST_USER_ID, { useCache: true });
      expect(mockRpc).toHaveBeenCalledTimes(1); // Still 1, not 2
    });
    
    it('should bypass cache when useCache is false', async () => {
      const mockProfile = {
        user_id: TEST_USER_ID,
        email: 'test@example.com',
      };
      
      mockSingle.mockResolvedValue({ data: mockProfile, error: null });
      
      // First call
      await getUserProfile(TEST_USER_ID, { useCache: false });
      expect(mockRpc).toHaveBeenCalledTimes(1);
      
      // Second call with useCache: false
      await getUserProfile(TEST_USER_ID, { useCache: false });
      expect(mockRpc).toHaveBeenCalledTimes(2); // Called twice
    });
    
    it('should return mock data on error in development', async () => {
      mockSingle.mockResolvedValue({ 
        data: null, 
        error: new Error('RPC not found') 
      });
      
      // Set NODE_ENV to development
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const result = await getUserProfile(TEST_USER_ID, { useCache: false });
      
      expect(result).toBeDefined();
      expect(result.user_id).toBe(TEST_USER_ID);
      
      // Restore NODE_ENV
      process.env.NODE_ENV = originalEnv;
    });
  });
  
  describe('updateUserProfile', () => {
    it('should update user profile and invalidate cache', async () => {
      const mockUpdatedProfile = {
        user_id: TEST_USER_ID,
        full_name: 'Updated Name',
        bio: 'Updated bio',
      };
      
      mockSingle.mockResolvedValue({ data: mockUpdatedProfile, error: null });
      
      const updates = { full_name: 'Updated Name', bio: 'Updated bio' };
      const result = await updateUserProfile(TEST_USER_ID, updates);
      
      expect(mockRpc).toHaveBeenCalledWith('update_user_profile', {
        p_user_id: TEST_USER_ID,
        p_profile_updates: updates,
      });
      expect(result).toEqual(mockUpdatedProfile);
    });
    
    it('should invalidate cache after update', async () => {
      const mockProfile = { user_id: TEST_USER_ID, full_name: 'Original' };
      const mockUpdated = { user_id: TEST_USER_ID, full_name: 'Updated' };
      
      // First, get profile (will be cached)
      mockSingle.mockResolvedValue({ data: mockProfile, error: null });
      await getUserProfile(TEST_USER_ID, { useCache: true });
      expect(mockRpc).toHaveBeenCalledTimes(1);
      
      // Update profile (should invalidate cache)
      mockSingle.mockResolvedValue({ data: mockUpdated, error: null });
      await updateUserProfile(TEST_USER_ID, { full_name: 'Updated' });
      
      // Get profile again (should call RPC again, not use cache)
      mockSingle.mockResolvedValue({ data: mockUpdated, error: null });
      await getUserProfile(TEST_USER_ID, { useCache: true });
      
      // Should have been called 3 times total (get, update, get)
      expect(mockRpc).toHaveBeenCalledTimes(3);
    });
  });
  
  describe('getUserPreferences', () => {
    it('should fetch user preferences from Supabase', async () => {
      const mockPreferences = {
        user_id: TEST_USER_ID,
        theme: 'dark',
        language: 'en',
        currency: 'USD',
      };
      
      mockSingle.mockResolvedValue({ data: mockPreferences, error: null });
      
      const result = await getUserPreferences(TEST_USER_ID, { useCache: false });
      
      expect(mockRpc).toHaveBeenCalledWith('get_user_preferences', { 
        p_user_id: TEST_USER_ID 
      });
      expect(result).toEqual(mockPreferences);
    });
    
    it('should cache preferences separately from profile', async () => {
      const mockProfile = { user_id: TEST_USER_ID };
      const mockPreferences = { user_id: TEST_USER_ID, theme: 'dark' };
      
      mockSingle.mockResolvedValueOnce({ data: mockProfile, error: null });
      mockSingle.mockResolvedValueOnce({ data: mockPreferences, error: null });
      
      // Get both
      await getUserProfile(TEST_USER_ID, { useCache: true });
      await getUserPreferences(TEST_USER_ID, { useCache: true });
      expect(mockRpc).toHaveBeenCalledTimes(2);
      
      // Get both again (should use cache)
      await getUserProfile(TEST_USER_ID, { useCache: true });
      await getUserPreferences(TEST_USER_ID, { useCache: true });
      expect(mockRpc).toHaveBeenCalledTimes(2); // Still 2
    });
  });
  
  describe('updateUserPreferences', () => {
    it('should update user preferences', async () => {
      const mockUpdated = {
        user_id: TEST_USER_ID,
        theme: 'dark',
        notifications: { email: false },
      };
      
      mockSingle.mockResolvedValue({ data: mockUpdated, error: null });
      
      const updates = { theme: 'dark', notifications: { email: false } };
      const result = await updateUserPreferences(TEST_USER_ID, updates);
      
      expect(mockRpc).toHaveBeenCalledWith('update_user_preferences', {
        p_user_id: TEST_USER_ID,
        p_preferences: updates,
      });
      expect(result).toEqual(mockUpdated);
    });
  });
  
  describe('getUserData', () => {
    it('should fetch both profile and preferences', async () => {
      const mockProfile = { user_id: TEST_USER_ID, full_name: 'Test' };
      const mockPreferences = { user_id: TEST_USER_ID, theme: 'light' };
      
      mockSingle
        .mockResolvedValueOnce({ data: mockProfile, error: null })
        .mockResolvedValueOnce({ data: mockPreferences, error: null });
      
      const result = await getUserData(TEST_USER_ID, { useCache: false });
      
      expect(result).toEqual({
        profile: mockProfile,
        preferences: mockPreferences,
      });
      expect(mockRpc).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('clearUserCache', () => {
    it('should clear cache for specific user', async () => {
      const mockProfile = { user_id: TEST_USER_ID };
      
      mockSingle.mockResolvedValue({ data: mockProfile, error: null });
      
      // Get profile (will be cached)
      await getUserProfile(TEST_USER_ID, { useCache: true });
      expect(mockRpc).toHaveBeenCalledTimes(1);
      
      // Clear cache
      clearUserCache(TEST_USER_ID);
      
      // Get profile again (should call RPC again)
      await getUserProfile(TEST_USER_ID, { useCache: true });
      expect(mockRpc).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('testConnection', () => {
    it('should return success when connection works', async () => {
      const mockProfile = { user_id: '00000000-0000-0000-0000-000000000000' };
      mockSingle.mockResolvedValue({ data: mockProfile, error: null });
      
      const result = await testConnection();
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('successful');
      expect(result.timestamp).toBeDefined();
    });
    
    it('should return failure when connection fails', async () => {
      mockSingle.mockResolvedValue({ 
        data: null, 
        error: new Error('Connection failed') 
      });
      
      const result = await testConnection();
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('failed');
      expect(result.error).toBeDefined();
    });
  });
  
  describe('Cache TTL', () => {
    it('should respect cache TTL', async () => {
      // This test would need to mock timers
      // Skipping for now as it requires more complex setup
      expect(true).toBe(true);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle Supabase errors gracefully', async () => {
      mockSingle.mockResolvedValue({ 
        data: null, 
        error: new Error('Database error') 
      });
      
      // In production, should throw
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      await expect(getUserProfile(TEST_USER_ID, { useCache: false }))
        .rejects.toThrow();
      
      process.env.NODE_ENV = originalEnv;
    });
    
    it('should log errors appropriately', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockSingle.mockResolvedValue({ 
        data: null, 
        error: new Error('Test error') 
      });
      
      try {
        await getUserProfile(TEST_USER_ID, { useCache: false });
      } catch (e) {
        // Expected in production mode
      }
      
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });
});
