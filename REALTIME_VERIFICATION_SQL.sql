-- Realtime Subscription Verification SQL Queries
-- Run these in Supabase SQL Editor to verify Realtime configuration

-- ============================================================================
-- 1. CHECK IF SUPABASE_REALTIME PUBLICATION EXISTS
-- ============================================================================

SELECT 
    pubname AS publication_name,
    puballtables AS all_tables,
    pubinsert AS insert_enabled,
    pubupdate AS update_enabled,
    pubdelete AS delete_enabled,
    pubtruncate AS truncate_enabled
FROM pg_publication
WHERE pubname = 'supabase_realtime';

-- Expected result: One row with pubname = 'supabase_realtime'
-- If no rows returned, the publication does not exist

-- ============================================================================
-- 2. LIST ALL TABLES IN SUPABASE_REALTIME PUBLICATION
-- ============================================================================

SELECT 
    pt.pubname AS publication_name,
    pt.schemaname AS schema_name,
    pt.tablename AS table_name
FROM pg_publication_tables pt
WHERE pt.pubname = 'supabase_realtime'
ORDER BY pt.schemaname, pt.tablename;

-- Expected result: List of all tables in the publication
-- Should include: holdings, transactions (if Realtime is enabled)

-- ============================================================================
-- 3. SPECIFICALLY CHECK HOLDINGS AND TRANSACTIONS
-- ============================================================================

SELECT 
    pt.pubname AS publication_name,
    pt.schemaname AS schema_name,
    pt.tablename AS table_name,
    CASE 
        WHEN pt.tablename IS NOT NULL THEN '✅ IN PUBLICATION'
        ELSE '❌ NOT IN PUBLICATION'
    END AS publication_status
FROM pg_publication_tables pt
WHERE pt.pubname = 'supabase_realtime'
    AND pt.schemaname = 'public'
    AND pt.tablename IN ('holdings', 'transactions')
ORDER BY pt.tablename;

-- Expected result: Two rows (one for holdings, one for transactions)
-- If rows are missing, those tables are not in the publication

-- ============================================================================
-- 4. CHECK TABLE-LEVEL REALTIME SETTINGS (ALTERNATIVE METHOD)
-- ============================================================================

-- Note: Supabase uses publications for Realtime, but we can also check
-- if tables have the necessary configuration by checking replication slots

SELECT 
    t.tablename,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_publication_tables pt
            WHERE pt.pubname = 'supabase_realtime'
                AND pt.schemaname = 'public'
                AND pt.tablename = t.tablename
        ) THEN '✅ ENABLED'
        ELSE '❌ NOT ENABLED'
    END AS realtime_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_publication_tables pt
            WHERE pt.pubname = 'supabase_realtime'
                AND pt.schemaname = 'public'
                AND pt.tablename = t.tablename
        ) THEN 'Table is in supabase_realtime publication'
        ELSE 'Table is NOT in supabase_realtime publication'
    END AS notes
FROM pg_tables t
WHERE t.schemaname = 'public'
    AND t.tablename IN ('holdings', 'transactions')
ORDER BY t.tablename;

-- ============================================================================
-- 5. CHECK FOR MISSING TABLES (COMPREHENSIVE CHECK)
-- ============================================================================

-- Compare expected tables vs actual tables in publication
WITH expected_tables AS (
    SELECT 'holdings' AS tablename
    UNION ALL
    SELECT 'transactions' AS tablename
),
actual_tables AS (
    SELECT pt.tablename
    FROM pg_publication_tables pt
    WHERE pt.pubname = 'supabase_realtime'
        AND pt.schemaname = 'public'
)
SELECT 
    e.tablename AS expected_table,
    CASE 
        WHEN a.tablename IS NOT NULL THEN '✅ IN PUBLICATION'
        ELSE '❌ MISSING FROM PUBLICATION'
    END AS status,
    CASE 
        WHEN a.tablename IS NOT NULL THEN 'Realtime is enabled'
        ELSE 'Realtime is NOT enabled - needs to be added to publication'
    END AS notes
FROM expected_tables e
LEFT JOIN actual_tables a ON e.tablename = a.tablename
ORDER BY e.tablename;

-- ============================================================================
-- 6. CHECK REALTIME REPLICATION SLOTS (ADVANCED)
-- ============================================================================

-- Check if replication slots exist (indicates Realtime is active)
SELECT 
    slot_name,
    slot_type,
    database,
    active,
    pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS lag
FROM pg_replication_slots
WHERE slot_name LIKE '%realtime%' OR slot_name LIKE '%supabase%'
ORDER BY slot_name;

-- ============================================================================
-- 7. VERIFY TABLE EXISTS AND IS ACCESSIBLE
-- ============================================================================

-- Ensure tables exist before enabling Realtime
SELECT 
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN '✅ TABLE EXISTS'
        ELSE '❌ TABLE DOES NOT EXIST'
    END AS table_status
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name IN ('holdings', 'transactions')
ORDER BY table_name;

-- ============================================================================
-- 8. FIX QUERIES (DO NOT RUN AUTOMATICALLY - FOR REFERENCE ONLY)
-- ============================================================================

-- ⚠️  THESE QUERIES WILL MODIFY THE DATABASE
-- ⚠️  ONLY RUN IF YOU NEED TO FIX MISSING TABLES

-- Add holdings to publication (if missing):
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.holdings;

-- Add transactions to publication (if missing):
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;

-- Remove table from publication (if needed):
-- ALTER PUBLICATION supabase_realtime DROP TABLE public.holdings;

-- ============================================================================
-- 9. COMPREHENSIVE STATUS REPORT
-- ============================================================================

SELECT 
    t.tablename,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_publication_tables pt
            WHERE pt.pubname = 'supabase_realtime'
                AND pt.schemaname = 'public'
                AND pt.tablename = t.tablename
        ) THEN '✅ ENABLED'
        ELSE '❌ NOT ENABLED'
    END AS publication_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_publication_tables pt
            WHERE pt.pubname = 'supabase_realtime'
                AND pt.schemaname = 'public'
                AND pt.tablename = t.tablename
        ) THEN 'Table is in supabase_realtime publication'
        ELSE 'Table is NOT in publication - Realtime will not work'
    END AS notes,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_publication_tables pt
            WHERE pt.pubname = 'supabase_realtime'
                AND pt.schemaname = 'public'
                AND pt.tablename = t.tablename
        ) THEN NULL
        ELSE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.' || t.tablename || ';'
    END AS fix_command
FROM pg_tables t
WHERE t.schemaname = 'public'
    AND t.tablename IN ('holdings', 'transactions')
ORDER BY t.tablename;

