-- Test what functions exist in your Supabase database
-- Copy and paste this into Supabase SQL Editor

-- Check what RPC functions exist
SELECT 
    routine_name, 
    routine_type,
    data_type,
    parameter_name,
    parameter_mode,
    ordinal_position
FROM information_schema.routines 
LEFT JOIN information_schema.parameters ON routines.specific_name = parameters.specific_name
WHERE routine_schema = 'public' 
AND routine_name LIKE '%get_%'
ORDER BY routine_name, ordinal_position;
