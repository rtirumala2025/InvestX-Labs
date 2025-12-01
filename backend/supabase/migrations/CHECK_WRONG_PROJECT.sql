-- ============================================================
-- CHECK WHAT WAS CREATED IN WRONG PROJECT
-- ============================================================
-- Run this in the WRONG project to see what you created there
-- This helps you decide if you need to undo anything
-- ============================================================

-- Check if you created holdings table
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'holdings'
        ) THEN '⚠️  holdings table EXISTS (you may have created this)'
        ELSE '✅ holdings table does not exist'
    END AS holdings_status;

-- Check if you created portfolios table
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'portfolios'
        ) THEN '⚠️  portfolios table EXISTS (you may have created this)'
        ELSE '✅ portfolios table does not exist'
    END AS portfolios_status;

-- Check if purchase_price column exists in holdings
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'holdings' 
            AND column_name = 'purchase_price'
        ) THEN '⚠️  purchase_price column EXISTS (you may have added this)'
        ELSE '✅ purchase_price column does not exist'
    END AS purchase_price_status;

-- Check if xp column exists in user_profiles
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'user_profiles' 
            AND column_name = 'xp'
        ) THEN '⚠️  xp column EXISTS (you may have added this)'
        ELSE '✅ xp column does not exist'
    END AS xp_status;

-- Check if net_worth column exists in user_profiles
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'user_profiles' 
            AND column_name = 'net_worth'
        ) THEN '⚠️  net_worth column EXISTS (you may have added this)'
        ELSE '✅ net_worth column does not exist'
    END AS net_worth_status;

-- Summary: What to undo (if anything)
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'holdings')
        OR EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'portfolios')
        OR EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'holdings' AND column_name = 'purchase_price')
        OR EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'xp')
        OR EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'net_worth')
        THEN '⚠️  You created some objects here. Check if this project is being used. If not, you can leave them or drop them.'
        ELSE '✅ No objects from today''s migrations found'
    END AS summary;

-- NOTE: If this is a test/development project that's not being used,
-- you can safely leave these objects. They won't cause any issues.
-- Only undo if this project is actively being used by another application.
