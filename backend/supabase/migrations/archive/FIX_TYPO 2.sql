-- Fix the typo in function names
-- Copy and paste this into Supabase SQL Editor

-- Drop the incorrectly named function
DROP FUNCTION IF EXISTS public.get_recomendations();

-- Create the correctly named function
CREATE OR REPLACE FUNCTION public.get_recommendations()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN '[
        {
            "id": "rec_1",
            "type": "default",
            "symbol": "AAPL",
            "action": "BUY",
            "confidence": 0.85,
            "content": "Strong buy recommendation for AAPL",
            "created_at": "2025-10-25T01:30:00Z"
        },
        {
            "id": "rec_2", 
            "type": "default",
            "symbol": "MSFT",
            "action": "HOLD",
            "confidence": 0.72,
            "content": "Hold recommendation for MSFT",
            "created_at": "2025-10-25T01:30:00Z"
        },
        {
            "id": "rec_3",
            "type": "default", 
            "symbol": "GOOGL",
            "action": "BUY",
            "confidence": 0.78,
            "content": "Buy recommendation for GOOGL",
            "created_at": "2025-10-25T01:30:00Z"
        }
    ]'::jsonb;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_recommendations() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_market_news() TO anon, authenticated, service_role;
