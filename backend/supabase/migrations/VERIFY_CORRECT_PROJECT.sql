-- VERIFY YOU'RE IN THE CORRECT SUPABASE PROJECT
-- Run this FIRST to confirm you're in the right project before running migrations

-- This will show you the current project's database name and connection info
SELECT 
    current_database() AS database_name,
    current_user AS current_user,
    version() AS postgres_version;

-- Check if the tables we expect exist
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles')
        THEN '✅ user_profiles table EXISTS'
        ELSE '❌ user_profiles table DOES NOT EXIST'
    END AS user_profiles_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'holdings')
        THEN '✅ holdings table EXISTS'
        ELSE '❌ holdings table DOES NOT EXIST'
    END AS holdings_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'portfolios')
        THEN '✅ portfolios table EXISTS'
        ELSE '❌ portfolios table DOES NOT EXIST'
    END AS portfolios_status;

-- Check current columns in user_profiles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Check if xp and net_worth columns exist
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'user_profiles' 
            AND column_name = 'xp'
        ) THEN '✅ xp column EXISTS'
        ELSE '❌ xp column DOES NOT EXIST'
    END AS xp_column_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'user_profiles' 
            AND column_name = 'net_worth'
        ) THEN '✅ net_worth column EXISTS'
        ELSE '❌ net_worth column DOES NOT EXIST'
    END AS net_worth_column_status;

-- Check if purchase_price exists in holdings
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'holdings' 
            AND column_name = 'purchase_price'
        ) THEN '✅ purchase_price column EXISTS in holdings'
        ELSE '❌ purchase_price column DOES NOT EXIST in holdings'
    END AS purchase_price_status;

-- IMPORTANT: Compare the database name above with your frontend .env file
-- The REACT_APP_SUPABASE_URL should match this project
-- Example: If URL is https://oysuothaldgentevxzod.supabase.co
--          Then the project ID is: oysuothaldgentevxzod
