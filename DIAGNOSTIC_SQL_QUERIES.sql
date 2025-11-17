-- Dashboard Loading Diagnostic SQL Queries
-- Run these in Supabase SQL Editor to diagnose dashboard loading issues

-- ============================================================================
-- 1. DATABASE SCHEMA VERIFICATION
-- ============================================================================

-- Check if tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public' 
    AND table_name IN ('holdings', 'transactions')
ORDER BY table_name;

-- Check holdings columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'holdings'
ORDER BY column_name;

-- Check transactions columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'transactions'
ORDER BY column_name;

-- Verify foreign keys
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('holdings', 'transactions')
ORDER BY tc.table_name, kcu.column_name;

-- Verify indexes
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('holdings', 'transactions')
ORDER BY tablename, indexname;

-- ============================================================================
-- 2. RLS POLICIES VERIFICATION
-- ============================================================================

-- Check if RLS is enabled
SELECT
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('holdings', 'transactions');

-- List all RLS policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd AS command,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('holdings', 'transactions')
ORDER BY tablename, policyname;

-- Check for missing policies (should have SELECT, INSERT, UPDATE, DELETE)
-- Holdings policies
SELECT 
    'holdings' AS table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'holdings' AND cmd = 'SELECT') THEN '✅ SELECT'
        ELSE '❌ SELECT'
    END AS select_policy,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'holdings' AND cmd = 'INSERT') THEN '✅ INSERT'
        ELSE '❌ INSERT'
    END AS insert_policy,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'holdings' AND cmd = 'UPDATE') THEN '✅ UPDATE'
        ELSE '❌ UPDATE'
    END AS update_policy,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'holdings' AND cmd = 'DELETE') THEN '✅ DELETE'
        ELSE '❌ DELETE'
    END AS delete_policy;

-- Transactions policies
SELECT 
    'transactions' AS table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND cmd = 'SELECT') THEN '✅ SELECT'
        ELSE '❌ SELECT'
    END AS select_policy,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND cmd = 'INSERT') THEN '✅ INSERT'
        ELSE '❌ INSERT'
    END AS insert_policy,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND cmd = 'UPDATE') THEN '✅ UPDATE'
        ELSE '❌ UPDATE'
    END AS update_policy,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND cmd = 'DELETE') THEN '✅ DELETE'
        ELSE '❌ DELETE'
    END AS delete_policy;

-- ============================================================================
-- 3. REALTIME VERIFICATION
-- ============================================================================

-- Check if Realtime is enabled (requires Supabase-specific tables)
-- Note: This may not work in all Supabase instances
SELECT
    schemaname,
    tablename,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND schemaname = 'public' 
            AND tablename IN ('holdings', 'transactions')
        ) THEN '✅ Enabled'
        ELSE '❌ Not Enabled'
    END AS realtime_status
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('holdings', 'transactions');

-- Alternative: Check publication tables directly
SELECT
    pubname,
    schemaname,
    tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename IN ('holdings', 'transactions');

-- ============================================================================
-- 4. TEST QUERIES (Replace USER_ID with actual user ID)
-- ============================================================================

-- Test holdings query (simulating frontend)
-- Replace 'YOUR_USER_ID_HERE' with an actual user ID
SELECT 
    id,
    user_id,
    portfolio_id,
    symbol,
    company_name,
    shares,
    purchase_price,
    purchase_date,
    current_price,
    sector,
    asset_type,
    created_at,
    updated_at
FROM public.holdings
WHERE user_id = 'YOUR_USER_ID_HERE'
ORDER BY created_at DESC
LIMIT 10;

-- Test transactions query (simulating frontend)
-- Replace 'YOUR_USER_ID_HERE' with an actual user ID
SELECT 
    id,
    user_id,
    portfolio_id,
    transaction_date,
    transaction_type,
    symbol,
    shares,
    price,
    total_amount,
    fees,
    notes,
    metadata,
    created_at,
    updated_at
FROM public.transactions
WHERE user_id = 'YOUR_USER_ID_HERE'
ORDER BY transaction_date DESC NULLS LAST
LIMIT 10;

-- ============================================================================
-- 5. DATA INTEGRITY CHECKS
-- ============================================================================

-- Check for NULL user_id values (should not exist)
SELECT 
    'holdings' AS table_name,
    COUNT(*) AS null_user_id_count
FROM public.holdings
WHERE user_id IS NULL
UNION ALL
SELECT 
    'transactions' AS table_name,
    COUNT(*) AS null_user_id_count
FROM public.transactions
WHERE user_id IS NULL;

-- Check for orphaned records (portfolio_id without matching portfolio)
SELECT 
    'holdings' AS table_name,
    COUNT(*) AS orphaned_count
FROM public.holdings h
LEFT JOIN public.portfolios p ON h.portfolio_id = p.id
WHERE h.portfolio_id IS NOT NULL AND p.id IS NULL
UNION ALL
SELECT 
    'transactions' AS table_name,
    COUNT(*) AS orphaned_count
FROM public.transactions t
LEFT JOIN public.portfolios p ON t.portfolio_id = p.id
WHERE t.portfolio_id IS NOT NULL AND p.id IS NULL;

-- ============================================================================
-- 6. PERMISSION CHECKS
-- ============================================================================

-- Check table permissions for authenticated role
SELECT
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
    AND table_name IN ('holdings', 'transactions')
    AND grantee IN ('authenticated', 'anon', 'service_role')
ORDER BY table_name, grantee, privilege_type;

