-- Step 3: Verify Your Setup
-- Run this to check if everything is configured correctly

-- 1. Check if API key is stored
SELECT 
    service_name,
    CASE 
        WHEN api_key IS NOT NULL THEN 'Key configured ✅'
        ELSE 'Key missing ❌'
    END as status,
    rate_limit_per_minute,
    created_at,
    updated_at
FROM api_configurations 
WHERE service_name = 'alpha_vantage';

-- 2. Check if allowed symbols exist
SELECT 
    COUNT(*) as total_symbols,
    COUNT(*) FILTER (WHERE is_active = true) as active_symbols
FROM allowed_symbols;

-- 3. List all allowed symbols
SELECT symbol, name, exchange, is_active
FROM allowed_symbols
ORDER BY symbol;

-- 4. Test if the get_real_quote function exists
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_name IN (
    'get_real_quote',
    'get_batch_market_data',
    'is_symbol_allowed',
    'get_cached_quote'
);
