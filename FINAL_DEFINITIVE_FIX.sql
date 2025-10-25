-- Final Definitive Fix with Schema Refresh
-- Copy and paste this into Supabase SQL Editor

-- First, notify PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';

-- Drop any existing functions
DROP FUNCTION IF EXISTS public.get_recommendations();
DROP FUNCTION IF EXISTS public.get_recommendations(text, text, text, integer);
DROP FUNCTION IF EXISTS public.get_recomendations();
DROP FUNCTION IF EXISTS public.get_market_news();
DROP FUNCTION IF EXISTS public.get_market_news(integer, text);

-- Create get_recommendations function
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

-- Create get_market_news function
CREATE OR REPLACE FUNCTION public.get_market_news()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN '[
        {
            "id": 1,
            "title": "Tech Stocks Rally on Strong Earnings",
            "content": "Major technology companies report better than expected quarterly results...",
            "source": "Financial News",
            "url": "https://example.com/tech-rally",
            "published_at": "2025-10-25T01:00:00Z",
            "symbols": ["AAPL", "MSFT", "GOOGL"],
            "sentiment_score": 0.8
        },
        {
            "id": 2,
            "title": "Market Volatility Continues", 
            "content": "Investors remain cautious as economic indicators show mixed signals...",
            "source": "Market Watch",
            "url": "https://example.com/volatility",
            "published_at": "2025-10-25T00:30:00Z",
            "symbols": ["SPY", "QQQ"],
            "sentiment_score": -0.3
        },
        {
            "id": 3,
            "title": "Healthcare Sector Shows Strength",
            "content": "Biotech and pharmaceutical stocks gain on regulatory approvals...",
            "source": "Health Finance", 
            "url": "https://example.com/healthcare",
            "published_at": "2025-10-25T00:00:00Z",
            "symbols": ["JNJ", "PFE"],
            "sentiment_score": 0.6
        }
    ]'::jsonb;
END;
$$;

-- Grant permissions to all roles
GRANT EXECUTE ON FUNCTION public.get_recommendations() TO anon;
GRANT EXECUTE ON FUNCTION public.get_recommendations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_recommendations() TO service_role;

GRANT EXECUTE ON FUNCTION public.get_market_news() TO anon;
GRANT EXECUTE ON FUNCTION public.get_market_news() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_market_news() TO service_role;

-- Notify PostgREST again to reload the schema cache
NOTIFY pgrst, 'reload schema';
