# Realtime Verification - Step-by-Step SQL Queries

**Run these queries ONE AT A TIME in Supabase SQL Editor and provide the output for each.**

---

## STEP 1: Check if Tables Exist

**Purpose:** Verify that `holdings` and `transactions` tables exist before checking Realtime.

**Query:**
```sql
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
```

**Expected Output:** Should show 2 rows (one for holdings, one for transactions)

**Run this first and share the output.**

---

## STEP 2: Check if Publication Exists

**Purpose:** Verify that the `supabase_realtime` publication exists.

**Query:**
```sql
SELECT 
    pubname AS publication_name,
    puballtables AS all_tables,
    pubinsert AS insert_enabled,
    pubupdate AS update_enabled,
    pubdelete AS delete_enabled
FROM pg_publication
WHERE pubname = 'supabase_realtime';
```

**Expected Output:** Should show 1 row with publication details

**Run this and share the output.**

---

## STEP 3: List ALL Tables in Publication

**Purpose:** See which tables are currently in the `supabase_realtime` publication.

**Query:**
```sql
SELECT 
    pt.pubname AS publication_name,
    pt.schemaname AS schema_name,
    pt.tablename AS table_name
FROM pg_publication_tables pt
WHERE pt.pubname = 'supabase_realtime'
ORDER BY pt.schemaname, pt.tablename;
```

**Expected Output:** List of all tables in the publication (may be many tables)

**Run this and share the output.**

---

## STEP 4: Check SPECIFICALLY for Holdings and Transactions

**Purpose:** Verify if `holdings` and `transactions` are in the publication.

**Query:**
```sql
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
```

**Expected Output:** Should show 0, 1, or 2 rows
- **0 rows** = Neither table is in publication (both missing)
- **1 row** = One table is in publication (one missing)
- **2 rows** = Both tables are in publication (all good!)

**Run this and share the output.**

---

## STEP 5: Comprehensive Status Report (FINAL CHECK)

**Purpose:** Get the complete status with fix commands if needed.

**Query:**
```sql
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
```

**Expected Output:** 2 rows showing status and fix commands (if needed)

**Run this last and share the output.**

---

## Summary

**Run in this order:**
1. ✅ STEP 1: Check if tables exist
2. ✅ STEP 2: Check if publication exists
3. ✅ STEP 3: List all tables in publication
4. ✅ STEP 4: Check specifically for holdings/transactions
5. ✅ STEP 5: Comprehensive status report

**After each step, share the output and I'll tell you what it means and what to do next!**

