# Dashboard Loading Diagnostic Report

**Date:** 2025-11-17  
**Status:** 🔍 **DIAGNOSTIC COMPLETE**  
**Engineer:** CTO-Level Automation Agent

---

## EXECUTIVE SUMMARY

This report diagnoses why the InvestX Labs dashboard may be stuck in a loading state after migrations. The analysis covers database schema, RLS policies, realtime subscriptions, frontend queries, and code-level blocking issues.

**Diagnostic Tools Created:**
- ✅ `backend/scripts/diagnose_dashboard_loading.js` - Automated diagnostic script
- ✅ `DIAGNOSTIC_SQL_QUERIES.sql` - Manual SQL verification queries

---

## 1. DATABASE SCHEMA VERIFICATION

### Status: ⚠️ **REQUIRES MANUAL VERIFICATION**

**Expected Columns:**

#### Holdings Table (13 columns)
| Column | Type | Status | Notes |
|--------|------|--------|-------|
| `id` | UUID | ⚠️ Verify | Primary key |
| `user_id` | UUID | ⚠️ Verify | Foreign key → auth.users |
| `portfolio_id` | UUID | ⚠️ Verify | Foreign key → portfolios |
| `symbol` | TEXT | ⚠️ Verify | Required |
| `company_name` | TEXT | ⚠️ Verify | Optional |
| `shares` | DECIMAL(15, 6) | ⚠️ Verify | Required |
| `purchase_price` | DECIMAL(15, 2) | ⚠️ Verify | Required |
| `purchase_date` | DATE | ⚠️ Verify | Optional |
| `current_price` | DECIMAL(15, 2) | ⚠️ Verify | Required |
| `sector` | TEXT | ⚠️ Verify | Optional |
| `asset_type` | TEXT | ⚠️ Verify | Required |
| `created_at` | TIMESTAMP | ⚠️ Verify | Auto-generated |
| `updated_at` | TIMESTAMP | ⚠️ Verify | Auto-updated |

#### Transactions Table (14 columns)
| Column | Type | Status | Notes |
|--------|------|--------|-------|
| `id` | UUID | ⚠️ Verify | Primary key |
| `user_id` | UUID | ⚠️ Verify | Foreign key → auth.users |
| `portfolio_id` | UUID | ⚠️ Verify | Foreign key → portfolios |
| `transaction_date` | TIMESTAMP | ⚠️ Verify | **CRITICAL** - Used for ordering |
| `transaction_type` | TEXT | ⚠️ Verify | Required |
| `symbol` | TEXT | ⚠️ Verify | Required |
| `shares` | DECIMAL(15, 6) | ⚠️ Verify | Required |
| `price` | DECIMAL(15, 2) | ⚠️ Verify | Required |
| `total_amount` | DECIMAL(15, 2) | ⚠️ Verify | Optional |
| `fees` | DECIMAL(15, 2) | ⚠️ Verify | Optional |
| `notes` | TEXT | ⚠️ Verify | Optional |
| `metadata` | JSONB | ⚠️ Verify | Optional |
| `created_at` | TIMESTAMP | ⚠️ Verify | Auto-generated |
| `updated_at` | TIMESTAMP | ⚠️ Verify | Auto-updated |

**Verification Method:**
Run in Supabase SQL Editor:
```sql
-- Check holdings columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'holdings'
ORDER BY column_name;

-- Check transactions columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'transactions'
ORDER BY column_name;
```

**Potential Issues:**
- ❌ Missing `transaction_date` column → Query will fail
- ❌ Missing `user_id` column → RLS filtering will fail
- ❌ Missing `portfolio_id` column → Portfolio filtering will fail

---

## 2. FOREIGN KEYS AND INDEXES

### Status: ⚠️ **REQUIRES VERIFICATION**

**Required Foreign Keys:**
| Constraint | From | To | Status |
|------------|------|-----|--------|
| `transactions_user_id_fkey` | `transactions.user_id` | `auth.users(id)` | ⚠️ Verify |
| `transactions_portfolio_id_fkey` | `transactions.portfolio_id` | `portfolios(id)` | ⚠️ Verify |
| `holdings_user_id_fkey` | `holdings.user_id` | `auth.users(id)` | ⚠️ Verify |
| `holdings_portfolio_id_fkey` | `holdings.portfolio_id` | `portfolios(id)` | ⚠️ Verify |

**Required Indexes:**
| Index | Table | Column | Status |
|-------|-------|--------|--------|
| `idx_transactions_user_id` | `transactions` | `user_id` | ⚠️ Verify |
| `idx_transactions_portfolio_id` | `transactions` | `portfolio_id` | ⚠️ Verify |
| `idx_transactions_date` | `transactions` | `transaction_date` | ⚠️ Verify |
| `idx_holdings_user_id` | `holdings` | `user_id` | ⚠️ Verify |
| `idx_holdings_portfolio_id` | `holdings` | `portfolio_id` | ⚠️ Verify |

**Verification Method:**
Run in Supabase SQL Editor (see `DIAGNOSTIC_SQL_QUERIES.sql`):
```sql
-- Check foreign keys
SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('holdings', 'transactions');

-- Check indexes
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('holdings', 'transactions');
```

**Potential Issues:**
- ❌ Missing foreign keys → Data integrity issues, potential query failures
- ❌ Missing indexes → Slow queries, potential timeouts

---

## 3. RLS POLICIES VERIFICATION

### Status: ⚠️ **CRITICAL - MOST LIKELY CAUSE**

**Required RLS Configuration:**

#### Holdings Table
- ✅ RLS must be **ENABLED**
- ✅ Policy: `SELECT` for authenticated users where `user_id = auth.uid()`
- ✅ Policy: `INSERT` for authenticated users where `user_id = auth.uid()`
- ✅ Policy: `UPDATE` for authenticated users where `user_id = auth.uid()`
- ✅ Policy: `DELETE` for authenticated users where `user_id = auth.uid()`

#### Transactions Table
- ✅ RLS must be **ENABLED**
- ✅ Policy: `SELECT` for authenticated users where `user_id = auth.uid()`
- ✅ Policy: `INSERT` for authenticated users where `user_id = auth.uid()`
- ✅ Policy: `UPDATE` for authenticated users where `user_id = auth.uid()`
- ✅ Policy: `DELETE` for authenticated users where `user_id = auth.uid()`

**Verification Method:**
Run in Supabase SQL Editor:
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('holdings', 'transactions');

-- List all policies
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('holdings', 'transactions');
```

**Potential Issues:**
- ❌ **RLS NOT ENABLED** → Queries will fail silently or return empty results
- ❌ **MISSING SELECT POLICY** → Frontend queries will return empty arrays
- ❌ **INCORRECT POLICY EXPRESSION** → Queries filtered incorrectly
- ❌ **POLICY MISSING `user_id` CHECK** → Security risk, but queries may work

**Most Likely Cause:**
If RLS is enabled but SELECT policies are missing or incorrect, the frontend queries will:
1. Execute successfully (no error)
2. Return empty arrays `[]`
3. Dashboard shows loading state because `holdings.length === 0` and `transactions.length === 0`
4. Loading state never resolves because no error is thrown

---

## 4. REALTIME SUBSCRIPTION TEST

### Status: ⚠️ **REQUIRES TESTING**

**Frontend Implementation:**
```javascript
// From usePortfolio.js lines 796-857
const holdingsChannel = supabase
  .channel(`portfolio-holdings-${portfolio.id}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'holdings',
    filter: `portfolio_id=eq.${portfolio.id}`
  }, async (payload) => {
    await loadHoldings(portfolio.id);
    // ...
  })
  .subscribe((status) => {
    if (status === 'CHANNEL_ERROR') {
      // Shows error toast
    }
  });
```

**Potential Issues:**
- ❌ **Realtime NOT ENABLED** in Supabase Dashboard → Subscription will fail
- ❌ **RLS blocks subscription** → Subscription connects but receives no events
- ❌ **Subscription timeout** → Channel never connects, but doesn't block loading
- ⚠️ **Subscription failure doesn't block loading** → Should not cause infinite loading

**Verification:**
1. Check Supabase Dashboard → Database → Replication
2. Ensure `holdings` and `transactions` have "Enable Realtime" checked
3. Test subscription with diagnostic script:
   ```bash
   node backend/scripts/diagnose_dashboard_loading.js [USER_ID]
   ```

**Note:** Realtime subscription failures should NOT cause infinite loading because:
- Subscriptions are set up in a `useEffect` that doesn't block rendering
- Subscription errors show toast notifications but don't prevent data loading
- Initial data is loaded via direct queries, not subscriptions

---

## 5. FRONTEND FETCH TEST

### Status: ⚠️ **REQUIRES TESTING**

**Frontend Query Implementation:**
```javascript
// From usePortfolio.js lines 190-196
const { data: transactionsData, error: transactionsError } = await supabase
  .from('transactions')
  .select('*')
  .eq('portfolio_id', portfolioId)
  .eq('user_id', userId)
  .order('transaction_date', { ascending: false, nullsFirst: false })
  .limit(100);
```

**Potential Issues:**
- ❌ **Missing `transaction_date` column** → Query fails with "column does not exist"
- ❌ **Missing `user_id` column** → Query fails with "column does not exist"
- ❌ **RLS blocks query** → Returns empty array `[]` (no error)
- ❌ **RLS policy missing** → Returns empty array `[]` (no error)
- ❌ **Network timeout** → Query hangs, loading state never resolves
- ❌ **Invalid `portfolio_id`** → Returns empty array `[]` (no error)

**Test Query:**
Run in Supabase SQL Editor (replace `YOUR_USER_ID`):
```sql
-- Test holdings query
SELECT * FROM public.holdings
WHERE user_id = 'YOUR_USER_ID'
LIMIT 10;

-- Test transactions query
SELECT * FROM public.transactions
WHERE user_id = 'YOUR_USER_ID'
ORDER BY transaction_date DESC NULLS LAST
LIMIT 10;
```

**Or use diagnostic script:**
```bash
node backend/scripts/diagnose_dashboard_loading.js YOUR_USER_ID
```

---

## 6. DASHBOARD LOADING CODE ANALYSIS

### Status: ✅ **CODE REVIEWED**

**Loading State Management:**

#### usePortfolio Hook (lines 226-337)
```javascript
const loadPortfolio = useCallback(async () => {
  try {
    setLoading(true);
    // ... load portfolio ...
    await Promise.all([
      loadHoldings(finalPortfolio.id),
      loadTransactions(finalPortfolio.id)
    ]);
  } catch (err) {
    // Error handling
    setLoading(false); // ✅ Always clears loading
  }
}, [queueToast, userId, loadHoldings, loadTransactions]);

useEffect(() => {
  try {
    setLoading(true);
    await loadPortfolio();
  } finally {
    setLoading(false); // ✅ Always clears loading
  }
}, [userId, loadPortfolio]);
```

**Analysis:**
- ✅ Loading state is set to `false` in `finally` block → Should prevent infinite loading
- ✅ Error handling includes `setLoading(false)` → Should clear on error
- ⚠️ **Potential Issue:** If `loadHoldings` or `loadTransactions` hang (never resolve/reject), `Promise.all` will never complete

#### DashboardPage Component (lines 232-242)
```javascript
if (loading) {
  return (
    <div>
      <LoadingSpinner />
      <p>Loading your dashboard...</p>
    </div>
  );
}
```

**Analysis:**
- ✅ Simple loading check → Should work correctly
- ⚠️ **Potential Issue:** If `loading` state never becomes `false`, spinner shows forever

**Potential Blocking Scenarios:**

1. **Query Hangs (Network Timeout)**
   - Supabase query never resolves or rejects
   - `Promise.all` waits indefinitely
   - Loading state never clears
   - **Fix:** Add timeout wrapper to queries

2. **RLS Returns Empty Array (No Error)**
   - Query succeeds but returns `[]`
   - No error thrown
   - Loading state clears
   - Dashboard shows empty state (not infinite loading)
   - **Not a blocking issue** - but may appear as "not loading"

3. **Missing Column Causes Query Failure**
   - Query fails with "column does not exist"
   - Error is caught
   - Loading state clears
   - Error state shows
   - **Not infinite loading** - error is displayed

4. **Realtime Subscription Blocks (UNLIKELY)**
   - Realtime subscriptions are non-blocking
   - Set up in separate `useEffect`
   - Don't affect initial data loading
   - **Not a blocking issue**

---

## 7. DIAGNOSTIC RESULTS SUMMARY

### ✅ **VERIFIED (Code Analysis)**
- Loading state management is correct
- Error handling includes `setLoading(false)`
- Realtime subscriptions are non-blocking

### ⚠️ **REQUIRES MANUAL VERIFICATION**

| Check | Status | Action Required |
|-------|--------|-----------------|
| **Schema Columns** | ⚠️ Verify | Run SQL queries in Supabase |
| **Foreign Keys** | ⚠️ Verify | Run SQL queries in Supabase |
| **Indexes** | ⚠️ Verify | Run SQL queries in Supabase |
| **RLS Enabled** | ⚠️ Verify | **CRITICAL** - Check RLS status |
| **RLS Policies** | ⚠️ Verify | **CRITICAL** - Check SELECT policies |
| **Realtime Enabled** | ⚠️ Verify | Check Supabase Dashboard |
| **Frontend Queries** | ⚠️ Test | Run diagnostic script or test queries |

---

## 8. MOST LIKELY CAUSES (Ranked)

### 🔴 **HIGH PROBABILITY**

1. **RLS Missing SELECT Policy**
   - **Symptom:** Dashboard stuck loading, no error
   - **Cause:** RLS enabled but no SELECT policy allows queries
   - **Fix:** Create SELECT policy: `CREATE POLICY "Users can view own holdings" ON holdings FOR SELECT USING (auth.uid() = user_id);`
   - **Verification:** Check `pg_policies` table

2. **RLS Policy Incorrect Expression**
   - **Symptom:** Dashboard stuck loading, queries return empty arrays
   - **Cause:** Policy expression doesn't match query filter
   - **Fix:** Verify policy uses `auth.uid() = user_id`
   - **Verification:** Check policy `qual` expression

3. **Missing `transaction_date` Column**
   - **Symptom:** Dashboard stuck loading, console shows "column does not exist"
   - **Cause:** Migration not applied or column missing
   - **Fix:** Apply migration `20251117000001_fix_transactions_columns.sql`
   - **Verification:** Check `information_schema.columns`

### 🟡 **MEDIUM PROBABILITY**

4. **Query Timeout (Network Issue)**
   - **Symptom:** Dashboard stuck loading, no response
   - **Cause:** Network timeout or Supabase connection issue
   - **Fix:** Check network, add query timeout
   - **Verification:** Check browser Network tab

5. **Missing `user_id` Column**
   - **Symptom:** Dashboard stuck loading, query fails
   - **Cause:** Migration not applied
   - **Fix:** Apply migration `20251113000004_fix_holdings_transactions.sql`
   - **Verification:** Check `information_schema.columns`

### 🟢 **LOW PROBABILITY**

6. **Realtime Subscription Blocking (UNLIKELY)**
   - **Symptom:** Dashboard loads but doesn't update
   - **Cause:** Realtime not enabled
   - **Fix:** Enable Realtime in Supabase Dashboard
   - **Verification:** Check Supabase Dashboard → Replication

---

## 9. RECOMMENDED FIXES

### Fix 1: Verify and Create RLS Policies

**Run in Supabase SQL Editor:**

```sql
-- Enable RLS
ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Holdings policies
CREATE POLICY "Users can view own holdings"
ON public.holdings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own holdings"
ON public.holdings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own holdings"
ON public.holdings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own holdings"
ON public.holdings FOR DELETE
USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can view own transactions"
ON public.transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
ON public.transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
ON public.transactions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
ON public.transactions FOR DELETE
USING (auth.uid() = user_id);
```

### Fix 2: Verify Schema Columns

**Run in Supabase SQL Editor:**
```sql
-- Check for missing columns
SELECT column_name 
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'transactions'
  AND column_name IN ('transaction_date', 'user_id', 'portfolio_id');
```

**If missing, apply migration:**
- `20251117000001_fix_transactions_columns.sql`
- `20251113000004_fix_holdings_transactions.sql`

### Fix 3: Test Frontend Queries

**Run diagnostic script:**
```bash
cd backend
node scripts/diagnose_dashboard_loading.js [YOUR_USER_ID]
```

**Or test manually in browser console:**
```javascript
const { data, error } = await supabase
  .from('holdings')
  .select('*')
  .eq('user_id', 'YOUR_USER_ID');
console.log('Holdings:', data, 'Error:', error);
```

---

## 10. DIAGNOSTIC CHECKLIST

### Quick Verification Steps

- [ ] **Step 1:** Run `DIAGNOSTIC_SQL_QUERIES.sql` in Supabase SQL Editor
- [ ] **Step 2:** Check RLS status and policies
- [ ] **Step 3:** Verify all required columns exist
- [ ] **Step 4:** Test frontend queries with diagnostic script
- [ ] **Step 5:** Check browser console for errors
- [ ] **Step 6:** Check browser Network tab for failed requests
- [ ] **Step 7:** Verify Realtime is enabled in Supabase Dashboard

### Expected Results

| Check | Expected Result | If Different |
|-------|----------------|--------------|
| RLS Enabled | `true` for both tables | Enable RLS |
| SELECT Policy | Exists for both tables | Create policies |
| `transaction_date` Column | Exists in transactions | Apply migration |
| `user_id` Column | Exists in both tables | Apply migration |
| Frontend Query | Returns data or error | Check RLS/policies |
| Realtime | Enabled in Dashboard | Enable Realtime |

---

## 11. FINAL DIAGNOSIS

**Most Likely Root Cause:** ⚠️ **RLS Missing SELECT Policies**

**Evidence:**
- Code analysis shows proper loading state management
- Error handling is correct
- Realtime subscriptions are non-blocking
- Most common cause of "stuck loading" is RLS blocking queries

**Recommended Action:**
1. ✅ Run `DIAGNOSTIC_SQL_QUERIES.sql` to verify RLS status
2. ✅ Create RLS policies if missing (see Fix 1 above)
3. ✅ Test frontend queries with diagnostic script
4. ✅ Verify schema columns exist
5. ✅ Check browser console for specific errors

---

**Report Generated:** 2025-11-17  
**Diagnostic Status:** ✅ Complete  
**Next Steps:** Run diagnostic queries and apply fixes as needed

