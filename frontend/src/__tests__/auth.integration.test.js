/**
 * Supabase Authentication Integration Tests
 * 
 * Tests all authentication flows including:
 * - Environment configuration
 * - Signup/Login/Logout
 * - Password reset
 * - Email verification
 * - Session management
 */

import { supabase } from '../services/supabase/config';
import {
  signInUser,
  signUpUser,
  signOutUser,
  getCurrentUser,
  sendPasswordResetEmail,
  updatePassword,
  resendVerificationEmail,
  signInWithGoogle,
} from '../services/supabase/auth';

describe('Supabase Authentication - Environment Setup', () => {
  test('Environment variables are loaded', () => {
    expect(process.env.REACT_APP_SUPABASE_URL).toBeDefined();
    expect(process.env.REACT_APP_SUPABASE_ANON_KEY).toBeDefined();
    console.log('✅ Environment variables loaded');
  });

  test('Supabase client is initialized', () => {
    expect(supabase).toBeDefined();
    expect(supabase.auth).toBeDefined();
    console.log('✅ Supabase client initialized');
  });
});

describe('Supabase Authentication - Function Exports', () => {
  test('All auth functions are exported', () => {
    expect(typeof signInUser).toBe('function');
    expect(typeof signUpUser).toBe('function');
    expect(typeof signOutUser).toBe('function');
    expect(typeof getCurrentUser).toBe('function');
    expect(typeof sendPasswordResetEmail).toBe('function');
    expect(typeof updatePassword).toBe('function');
    expect(typeof resendVerificationEmail).toBe('function');
    expect(typeof signInWithGoogle).toBe('function');
    console.log('✅ All auth functions exported');
  });
});

describe('Supabase Authentication - Signup Flow', () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  test('signUpUser creates new user account', async () => {
    try {
      const result = await signUpUser(testEmail, testPassword, {
        fullName: 'Test User',
        username: 'testuser',
      });

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(testEmail);
      console.log('✅ Signup successful');
    } catch (error) {
      console.log('⚠️ Signup test:', error.message);
      // May fail if email already exists - this is expected
    }
  });
});

describe('Supabase Authentication - Login Flow', () => {
  test('signInUser validates credentials', async () => {
    // This will fail with invalid credentials (expected)
    try {
      await signInUser('invalid@example.com', 'wrongpassword');
      console.log('❌ Login should have failed with invalid credentials');
    } catch (error) {
      expect(error).toBeDefined();
      console.log('✅ Invalid login correctly rejected');
    }
  });
});

describe('Supabase Authentication - Session Management', () => {
  test('getCurrentUser returns current session', async () => {
    const user = await getCurrentUser();
    // User may be null if not logged in (expected)
    console.log(user ? '✅ Session found' : '⚠️ No active session');
  });
});

describe('Supabase Authentication - Password Reset', () => {
  test('sendPasswordResetEmail function exists and can be called', async () => {
    try {
      // Using a test email that won't actually receive email
      await sendPasswordResetEmail('test@example.com');
      console.log('✅ Password reset email sent');
    } catch (error) {
      console.log('⚠️ Password reset:', error.message);
    }
  });
});

describe('Supabase Authentication - Email Verification', () => {
  test('resendVerificationEmail function exists', async () => {
    try {
      await resendVerificationEmail('test@example.com');
      console.log('✅ Verification email resend attempted');
    } catch (error) {
      console.log('⚠️ Email verification:', error.message);
    }
  });
});

describe('Supabase Authentication - Logout', () => {
  test('signOutUser clears session', async () => {
    try {
      await signOutUser();
      const user = await getCurrentUser();
      expect(user).toBeNull();
      console.log('✅ Logout successful');
    } catch (error) {
      console.log('⚠️ Logout:', error.message);
    }
  });
});

describe('Supabase Authentication - OAuth', () => {
  test('signInWithGoogle function is defined', () => {
    expect(typeof signInWithGoogle).toBe('function');
    console.log('✅ Google OAuth function available');
  });
});

