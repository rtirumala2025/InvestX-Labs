-- Verify User RPCs Health Check
-- This migration verifies that all required user RPCs exist

DO $$
DECLARE
    missing_functions text[];
    func_name text;
BEGIN
    -- Check for required functions
    SELECT ARRAY_AGG(required_func)
    INTO missing_functions
    FROM (
        SELECT unnest(ARRAY[
            'get_user_profile',
            'update_user_profile',
            'get_user_preferences',
            'update_user_preferences'
        ]) AS required_func
    ) required
    WHERE NOT EXISTS (
        SELECT 1
        FROM information_schema.routines
        WHERE routine_schema = 'public'
        AND routine_name = required_func
    );
    
    -- If any functions are missing, raise a notice
    IF array_length(missing_functions, 1) > 0 THEN
        FOREACH func_name IN ARRAY missing_functions
        LOOP
            RAISE NOTICE 'Missing function: %', func_name;
        END LOOP;
        
        RAISE EXCEPTION 'Required user RPC functions are missing. Please run the user profile migration first.';
    ELSE
        RAISE NOTICE 'All required user RPC functions exist';
    END IF;
END $$;

-- Verify function signatures
DO $$
BEGIN
    -- Verify get_user_profile signature
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.parameters
        WHERE specific_schema = 'public'
        AND specific_name IN (
            SELECT specific_name
            FROM information_schema.routines
            WHERE routine_schema = 'public'
            AND routine_name = 'get_user_profile'
        )
        AND parameter_name = 'p_user_id'
    ) THEN
        RAISE EXCEPTION 'get_user_profile has incorrect signature';
    END IF;
    
    RAISE NOTICE 'All function signatures are correct';
END $$;

-- Create a health check function
CREATE OR REPLACE FUNCTION public.check_user_rpcs_health()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
    func_count integer;
BEGIN
    SELECT COUNT(*)
    INTO func_count
    FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND routine_name IN (
        'get_user_profile',
        'update_user_profile',
        'get_user_preferences',
        'update_user_preferences'
    );
    
    result := jsonb_build_object(
        'healthy', func_count = 4,
        'functions_found', func_count,
        'functions_expected', 4,
        'timestamp', now(),
        'details', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'name', routine_name,
                    'type', routine_type,
                    'language', external_language
                )
            )
            FROM information_schema.routines
            WHERE routine_schema = 'public'
            AND routine_name IN (
                'get_user_profile',
                'update_user_profile',
                'get_user_preferences',
                'update_user_preferences'
            )
        )
    );
    
    RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_user_rpcs_health() TO anon, authenticated, service_role;

-- Run the health check
SELECT check_user_rpcs_health();
