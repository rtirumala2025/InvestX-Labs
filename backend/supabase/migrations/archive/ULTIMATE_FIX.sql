-- Ultimate Fix - Handle all parameter variations
-- Copy and paste this into Supabase SQL Editor

-- Fix get_recommendations to handle all parameter combinations
CREATE OR REPLACE FUNCTION public.get_recommendations(
    user_id text DEFAULT 'anonymous',
    recommendation_type text DEFAULT NULL,
    context_id text DEFAULT NULL,
    max_results integer DEFAULT 10
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Handle case where no parameters are passed
    IF user_id IS NULL THEN
        user_id := 'anonymous';
    END IF;
    
    IF max_results IS NULL OR max_results <= 0 THEN
        max_results := 10;
    END IF;
    
    RETURN (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', 'rec_' || generate_series,
                'type', COALESCE(recommendation_type, 'default'),
                'symbol', unnest(ARRAY['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META']),
                'action', unnest(ARRAY['BUY', 'HOLD', 'BUY', 'SELL', 'HOLD']),
                'confidence', unnest(ARRAY[0.85, 0.72, 0.78, 0.65, 0.69]),
                'content', 'Sample recommendation for ' || unnest(ARRAY['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META']),
                'created_at', now()
            )
        )
        FROM generate_series(1, LEAST(max_results, 5))
    );
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error getting recommendations for user %: %', user_id, SQLERRM;
END;
$$;

-- Fix get_market_news to handle no parameters
CREATE OR REPLACE FUNCTION public.get_market_news(limit_count integer DEFAULT 10, symbol_filter text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
BEGIN
    -- Handle case where no parameters are passed
    IF limit_count IS NULL OR limit_count <= 0 THEN
        limit_count := 10;
    END IF;
    
    -- Get market news from the table
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'title', title,
            'content', content,
            'source', source,
            'url', url,
            'published_at', published_at,
            'symbols', symbols,
            'sentiment_score', sentiment_score
        )
    ) INTO result
    FROM (
        SELECT *
        FROM public.market_news
        WHERE (symbol_filter IS NULL OR symbol_filter = ANY(symbols))
        ORDER BY published_at DESC
        LIMIT limit_count
    ) news;
    
    RETURN COALESCE(result, '[]'::jsonb);
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error getting market news: %', SQLERRM;
END;
$$;

-- Create a simpler version that accepts no parameters at all
CREATE OR REPLACE FUNCTION public.get_market_news()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
BEGIN
    -- Get market news from the table
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'title', title,
            'content', content,
            'source', source,
            'url', url,
            'published_at', published_at,
            'symbols', symbols,
            'sentiment_score', sentiment_score
        )
    ) INTO result
    FROM (
        SELECT *
        FROM public.market_news
        ORDER BY published_at DESC
        LIMIT 10
    ) news;
    
    RETURN COALESCE(result, '[]'::jsonb);
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error getting market news: %', SQLERRM;
END;
$$;

-- Create a simpler version of get_recommendations that accepts no parameters
CREATE OR REPLACE FUNCTION public.get_recommendations()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', 'rec_' || generate_series,
                'type', 'default',
                'symbol', unnest(ARRAY['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META']),
                'action', unnest(ARRAY['BUY', 'HOLD', 'BUY', 'SELL', 'HOLD']),
                'confidence', unnest(ARRAY[0.85, 0.72, 0.78, 0.65, 0.69]),
                'content', 'Sample recommendation for ' || unnest(ARRAY['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META']),
                'created_at', now()
            )
        )
        FROM generate_series(1, 5)
    );
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error getting recommendations: %', SQLERRM;
END;
$$;

-- Grant permissions for all versions
GRANT EXECUTE ON FUNCTION public.get_recommendations(text, text, text, integer) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_recommendations() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_market_news(integer, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_market_news() TO anon, authenticated, service_role;
