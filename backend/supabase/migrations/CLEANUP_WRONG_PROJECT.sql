-- ============================================================
-- CLEANUP SCRIPT FOR WRONG PROJECT
-- ============================================================
-- Run this in the WRONG project to remove objects created by today's migrations
-- WARNING: Only run this if you're sure this project is not being used!
-- ============================================================

-- STEP 1: Check what exists before cleanup
SELECT 
    'BEFORE CLEANUP - Objects that will be removed:' AS status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'holdings')
        THEN '⚠️  holdings table EXISTS (will be dropped)'
        ELSE '✅ holdings table does not exist'
    END AS holdings_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'portfolios')
        THEN '⚠️  portfolios table EXISTS (will be dropped)'
        ELSE '✅ portfolios table does not exist'
    END AS portfolios_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'holdings' AND column_name = 'purchase_price')
        THEN '⚠️  purchase_price column EXISTS (will be dropped)'
        ELSE '✅ purchase_price column does not exist'
    END AS purchase_price_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'xp')
        THEN '⚠️  xp column EXISTS (will be dropped)'
        ELSE '✅ xp column does not exist'
    END AS xp_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'net_worth')
        THEN '⚠️  net_worth column EXISTS (will be dropped)'
        ELSE '✅ net_worth column does not exist'
    END AS net_worth_status;

-- STEP 2: Remove columns from user_profiles (if they exist and were added today)
-- Only remove if user_profiles table exists
DO $$
BEGIN
    -- Remove xp column if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'xp'
    ) THEN
        ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS xp;
        RAISE NOTICE '✅ Removed xp column from user_profiles';
    ELSE
        RAISE NOTICE 'ℹ️  xp column does not exist, skipping';
    END IF;
    
    -- Remove net_worth column if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'net_worth'
    ) THEN
        ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS net_worth;
        RAISE NOTICE '✅ Removed net_worth column from user_profiles';
    ELSE
        RAISE NOTICE 'ℹ️  net_worth column does not exist, skipping';
    END IF;
END $$;

-- STEP 3: Remove purchase_price column from holdings (if it exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'holdings'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'holdings' 
            AND column_name = 'purchase_price'
        ) THEN
            ALTER TABLE public.holdings DROP COLUMN IF EXISTS purchase_price;
            RAISE NOTICE '✅ Removed purchase_price column from holdings';
        ELSE
            RAISE NOTICE 'ℹ️  purchase_price column does not exist, skipping';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️  holdings table does not exist, skipping purchase_price removal';
    END IF;
END $$;

-- STEP 4: Drop tables (ONLY if they were created today and have no important data)
-- WARNING: This will delete all data in these tables!
-- Check if tables have data first
DO $$
DECLARE
    holdings_count INTEGER;
    portfolios_count INTEGER;
BEGIN
    -- Check holdings table
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'holdings'
    ) THEN
        SELECT COUNT(*) INTO holdings_count FROM public.holdings;
        
        IF holdings_count > 0 THEN
            RAISE NOTICE '⚠️  holdings table has % rows. NOT dropping to preserve data.', holdings_count;
            RAISE NOTICE '⚠️  If you want to drop it anyway, manually run: DROP TABLE IF EXISTS public.holdings CASCADE;';
        ELSE
            DROP TABLE IF EXISTS public.holdings CASCADE;
            RAISE NOTICE '✅ Dropped holdings table (was empty)';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️  holdings table does not exist, skipping';
    END IF;
    
    -- Check portfolios table
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'portfolios'
    ) THEN
        SELECT COUNT(*) INTO portfolios_count FROM public.portfolios;
        
        IF portfolios_count > 0 THEN
            RAISE NOTICE '⚠️  portfolios table has % rows. NOT dropping to preserve data.', portfolios_count;
            RAISE NOTICE '⚠️  If you want to drop it anyway, manually run: DROP TABLE IF EXISTS public.portfolios CASCADE;';
        ELSE
            DROP TABLE IF EXISTS public.portfolios CASCADE;
            RAISE NOTICE '✅ Dropped portfolios table (was empty)';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️  portfolios table does not exist, skipping';
    END IF;
END $$;

-- STEP 5: Verify cleanup
SELECT 
    'AFTER CLEANUP - Verification:' AS status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'holdings')
        THEN '⚠️  holdings table still exists'
        ELSE '✅ holdings table removed'
    END AS holdings_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'portfolios')
        THEN '⚠️  portfolios table still exists'
        ELSE '✅ portfolios table removed'
    END AS portfolios_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'xp')
        THEN '⚠️  xp column still exists'
        ELSE '✅ xp column removed'
    END AS xp_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'net_worth')
        THEN '⚠️  net_worth column still exists'
        ELSE '✅ net_worth column removed'
    END AS net_worth_status;

-- NOTE: If tables have data, they were NOT dropped automatically for safety.
-- You can manually drop them if you're sure they're not needed:
-- DROP TABLE IF EXISTS public.holdings CASCADE;
-- DROP TABLE IF EXISTS public.portfolios CASCADE;
