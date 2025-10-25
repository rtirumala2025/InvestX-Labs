-- Check what functions exist
-- Copy and paste this into Supabase SQL Editor

SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_recommendations', 'get_market_news')
ORDER BY routine_name;
