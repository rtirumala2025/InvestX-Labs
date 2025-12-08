-- ============================================================================
-- SUPABASE GOOGLE OAUTH SETUP
-- ============================================================================
-- This file contains SQL queries to verify and configure Google OAuth in Supabase
-- 
-- NOTE: Google OAuth provider configuration is primarily done through the
-- Supabase Dashboard UI, not SQL. However, these queries can help verify
-- the configuration.
--
-- ============================================================================
-- STEP 1: Verify Auth Configuration
-- ============================================================================

-- Check if auth schema exists
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.schemata 
  WHERE schema_name = 'auth'
);

-- ============================================================================
-- STEP 2: Check Auth Providers Configuration
-- ============================================================================

-- Note: Provider configuration is stored in Supabase's internal config
-- This cannot be directly queried via SQL, but you can verify in the dashboard:
-- Authentication → Providers → Google

-- ============================================================================
-- STEP 3: Verify Site URL Configuration
-- ============================================================================

-- Check auth configuration (if accessible)
-- Note: Most auth config is in Supabase dashboard, not directly queryable

-- ============================================================================
-- MANUAL SETUP REQUIRED IN SUPABASE DASHBOARD:
-- ============================================================================
--
-- 1. Go to: https://app.supabase.com/project/oysuothaldgentevxzod
-- 2. Navigate to: Authentication → Providers
-- 3. Find: Google provider
-- 4. Toggle: Enable Google provider → ON
-- 5. Enter:
--    - Client ID (from Google Cloud Console)
--    - Client Secret (from Google Cloud Console)
-- 6. Save
--
-- 7. Navigate to: Authentication → URL Configuration
-- 8. Set Site URL: http://localhost:3002 (for development)
-- 9. Add Redirect URLs:
--    - http://localhost:3002/dashboard
--    - http://localhost:3002/*
--
-- ============================================================================
-- GOOGLE CLOUD CONSOLE SETUP:
-- ============================================================================
--
-- 1. Go to: https://console.cloud.google.com/
-- 2. Select your project
-- 3. Navigate to: APIs & Services → Credentials
-- 4. Create OAuth 2.0 Client ID (or edit existing)
-- 5. Add Authorized redirect URIs:
--    - https://oysuothaldgentevxzod.supabase.co/auth/v1/callback
-- 6. Add Authorized JavaScript origins:
--    - http://localhost:3002
--    - https://oysuothaldgentevxzod.supabase.co
--
-- ============================================================================
-- VERIFICATION QUERIES:
-- ============================================================================

-- Check if we can query auth users (verifies auth is working)
SELECT COUNT(*) as total_users 
FROM auth.users;

-- Check recent auth events (if log table exists)
-- Note: This may not be available depending on Supabase plan

-- ============================================================================
-- TROUBLESHOOTING:
-- ============================================================================
--
-- If Google OAuth still doesn't work after dashboard configuration:
--
-- 1. Verify Client ID and Secret are correct in Supabase dashboard
-- 2. Verify redirect URI matches exactly in Google Cloud Console
-- 3. Check browser console for specific error messages
-- 4. Ensure Site URL in Supabase matches your app URL
-- 5. Clear browser cache and localStorage
-- 6. Try in incognito mode to rule out extensions
--
-- ============================================================================

