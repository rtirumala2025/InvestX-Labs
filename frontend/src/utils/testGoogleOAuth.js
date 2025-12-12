/**
 * Test Google OAuth Configuration
 * Run this in browser console to diagnose OAuth issues
 */

import { supabase } from '../services/supabase/config';

export const testGoogleOAuth = async () => {
  console.log('🧪 Testing Google OAuth Configuration...');
  
  // Test 1: Check Supabase client
  console.log('\n1️⃣ Checking Supabase client...');
  if (!supabase || !supabase.auth) {
    console.error('❌ Supabase client is not available');
    return { success: false, error: 'Supabase client unavailable' };
  }
  console.log('✅ Supabase client is available');
  
  // Test 2: Check if Google provider is enabled
  console.log('\n2️⃣ Testing Google OAuth provider...');
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    
    if (error) {
      console.error('❌ Google OAuth error:', error);
      return { success: false, error: error.message };
    }
    
    if (data?.url) {
      console.log('✅ Google OAuth URL generated:', data.url);
      console.log('\n🎯 OAuth is configured correctly!');
      console.log('📋 Next step: Click the button to test the full flow');
      return { success: true, url: data.url };
    } else {
      console.warn('⚠️ No OAuth URL returned');
      return { success: false, error: 'No OAuth URL returned' };
    }
  } catch (error) {
    console.error('❌ Exception during OAuth test:', error);
    return { success: false, error: error.message };
  }
};

// Make it available globally for console testing
if (typeof window !== 'undefined') {
  window.testGoogleOAuth = testGoogleOAuth;
}

