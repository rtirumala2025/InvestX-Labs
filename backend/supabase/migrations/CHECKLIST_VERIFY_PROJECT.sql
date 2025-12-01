-- ============================================================
-- PROJECT VERIFICATION CHECKLIST
-- ============================================================
-- Run this in your CORRECT Supabase project (InvestX Labs)
-- Project ID should be: oysuothaldgentevxzod
-- URL: https://oysuothaldgentevxzod.supabase.co
-- ============================================================

-- STEP 1: Verify you're in the correct project
SELECT 
    current_database() AS database_name,
    'Check this matches your .env file project ID' AS note;

-- STEP 2: Check which tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('user_profiles', 'portfolios', 'holdings', 'transactions', 'leaderboard_scores')
        THEN '✅ REQUIRED TABLE'
        ELSE '⚠️  Additional table'
    END AS status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- STEP 3: Check user_profiles table columns
SELECT 
    'user_profiles columns' AS table_name,
    column_name,
    data_type,
    CASE 
        WHEN column_name IN ('id', 'username', 'full_name', 'avatar_url', 'created_at', 'updated_at')
        THEN '✅ Base column'
        WHEN column_name IN ('xp', 'net_worth')
        THEN '⚠️  Migration column (may be missing)'
        ELSE 'ℹ️  Other column'
    END AS status
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- STEP 4: Check holdings table columns
SELECT 
    'holdings columns' AS table_name,
    column_name,
    data_type,
    CASE 
        WHEN column_name = 'purchase_price'
        THEN '⚠️  Migration column (may be missing)'
        WHEN column_name IN ('id', 'portfolio_id', 'user_id', 'symbol', 'shares', 'current_price', 'purchase_date')
        THEN '✅ Base column'
        ELSE 'ℹ️  Other column'
    END AS status
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'holdings'
ORDER BY ordinal_position;

-- STEP 5: Summary - What's missing?
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'user_profiles' 
            AND column_name = 'xp'
        ) THEN '✅ xp column EXISTS'
        ELSE '❌ xp column MISSING - Run: 20250124000004_add_xp_networth_to_user_profiles.sql'
    END AS xp_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'user_profiles' 
            AND column_name = 'net_worth'
        ) THEN '✅ net_worth column EXISTS'
        ELSE '❌ net_worth column MISSING - Run: 20250124000004_add_xp_networth_to_user_profiles.sql'
    END AS net_worth_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'holdings' 
            AND column_name = 'purchase_price'
        ) THEN '✅ purchase_price column EXISTS'
        ELSE '❌ purchase_price column MISSING - Run: 20250124000001_add_purchase_price_simple.sql'
    END AS purchase_price_status;

-- STEP 6: Check if holdings table exists at all
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'holdings'
        ) THEN '✅ holdings table EXISTS'
        ELSE '❌ holdings table MISSING - Run: 20250124000001_add_purchase_price_simple.sql (creates table)'
    END AS holdings_table_status;

-- STEP 7: Check if portfolios table exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'portfolios'
        ) THEN '✅ portfolios table EXISTS'
        ELSE '❌ portfolios table MISSING - Run: 20250124000001_add_purchase_price_simple.sql (creates table)'
    END AS portfolios_table_status;
