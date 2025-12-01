-- ============================================================
-- QUICK STATUS CHECK - All in One View
-- ============================================================
-- Run this in your CORRECT project to see everything at once
-- ============================================================

SELECT 
    'Tables' AS category,
    'user_profiles' AS item,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles')
        THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END AS status,
    '' AS migration_needed
UNION ALL
SELECT 
    'Tables' AS category,
    'portfolios' AS item,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'portfolios')
        THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END AS status,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'portfolios')
        THEN '20250124000001_add_purchase_price_simple.sql'
        ELSE ''
    END AS migration_needed
UNION ALL
SELECT 
    'Tables' AS category,
    'holdings' AS item,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'holdings')
        THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END AS status,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'holdings')
        THEN '20250124000001_add_purchase_price_simple.sql'
        ELSE ''
    END AS migration_needed
UNION ALL
SELECT 
    'Columns (user_profiles)' AS category,
    'xp' AS item,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'xp')
        THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END AS status,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'xp')
        THEN '20250124000004_add_xp_networth_to_user_profiles.sql'
        ELSE ''
    END AS migration_needed
UNION ALL
SELECT 
    'Columns (user_profiles)' AS category,
    'net_worth' AS item,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'net_worth')
        THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END AS status,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'net_worth')
        THEN '20250124000004_add_xp_networth_to_user_profiles.sql'
        ELSE ''
    END AS migration_needed
UNION ALL
SELECT 
    'Columns (holdings)' AS category,
    'purchase_price' AS item,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'holdings' AND column_name = 'purchase_price')
        THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END AS status,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'holdings' AND column_name = 'purchase_price')
        THEN '20250124000001_add_purchase_price_simple.sql'
        ELSE ''
    END AS migration_needed
ORDER BY category, item;
