-- Minimal test - try this first
-- Copy and paste this into Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.get_quote(symbol text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN jsonb_build_object(
        'symbol', symbol,
        'price', 150.25,
        'change', 2.50,
        'change_percent', 1.69,
        'updated_at', now()
    );
END;
$$;

-- Grant permission
GRANT EXECUTE ON FUNCTION public.get_quote(text) TO anon, authenticated, service_role;
