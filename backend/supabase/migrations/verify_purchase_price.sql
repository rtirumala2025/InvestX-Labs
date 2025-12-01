-- ============================================================================
-- VERIFICATION QUERY - Run this in Supabase SQL Editor
-- ============================================================================
-- This will tell you if the purchase_price column exists

-- 1. Check if column exists
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'holdings' 
  AND column_name = 'purchase_price';

-- Expected result: 
-- If column exists: 1 row with purchase_price details ✅
-- If column does NOT exist: 0 rows ❌

-- 2. Test query to verify we can select the column
SELECT 
    id,
    symbol,
    shares,
    purchase_price,
    current_price
FROM public.holdings
LIMIT 1;

-- Expected result:
-- If column exists: Query succeeds, returns data or empty result ✅
-- If column does NOT exist: Error "column purchase_price does not exist" ❌

-- 3. If column doesn't exist, run the migration:
-- Copy and run: backend/supabase/migrations/20250124000000_add_purchase_price_to_holdings.sql
