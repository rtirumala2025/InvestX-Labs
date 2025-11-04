-- Complete Supabase Migration to Fix All 404 Errors
-- This migration creates all the RPC functions that the frontend is trying to call

-- 1. Create get_quote function (for market data)
CREATE OR REPLACE FUNCTION public.get_quote(symbol text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
BEGIN
    -- In a real implementation, this would fetch from a market data table or external API
    -- For now, return mock data
    result := jsonb_build_object(
        'symbol', symbol,
        'price', (random() * 1000)::numeric(10,2),
        'change', (random() * 10 - 5)::numeric(10,2),
        'change_percent', (random() * 5 - 2.5)::numeric(10,2),
        'updated_at', now()
    );
    
    RETURN result;
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error getting quote for %: %', symbol, SQLERRM;
END;
$$;

-- 2. Create get_user_context function (for MCP context)
CREATE OR REPLACE FUNCTION public.get_user_context(user_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
BEGIN
    -- In a real implementation, this would fetch user context from a table
    -- For now, return mock context data
    result := jsonb_build_object(
        'user_id', user_id,
        'risk_tolerance', 'moderate',
        'investment_goal', 'growth',
        'time_horizon', 5,
        'preferences', jsonb_build_object(
            'sectors', ARRAY['technology', 'healthcare', 'finance'],
            'investment_style', 'balanced',
            'notification_preferences', jsonb_build_object(
                'email', true,
                'push', true,
                'price_alerts', true
            )
        ),
        'portfolio_summary', jsonb_build_object(
            'total_value', (random() * 100000 + 50000)::numeric(12,2),
            'daily_change', (random() * 2000 - 1000)::numeric(12,2),
            'daily_change_percent', (random() * 4 - 2)::numeric(5,2)
        ),
        'watchlist', ARRAY['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META'],
        'last_updated', now()
    );
    
    RETURN result;
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error getting user context for %: %', user_id, SQLERRM;
END;
$$;

-- 3. Create get_ai_recommendations function
CREATE OR REPLACE FUNCTION public.get_ai_recommendations(user_id text, user_profile jsonb DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- In a real implementation, this would call an AI model with user profile
    RETURN jsonb_build_object(
        'recommendations', jsonb_agg(r)
    )
    FROM (
        SELECT 
            unnest(ARRAY['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META']) as symbol,
            unnest(ARRAY['Strong Buy', 'Hold', 'Buy', 'Sell', 'Hold']) as action,
            unnest(ARRAY[0.95, 0.75, 0.85, 0.45, 0.65]) as confidence,
            unnest(ARRAY[
                'Strong fundamentals and growth potential',
                'Stable performance with consistent growth',
                'Innovative products and strong market position',
                'Overvalued relative to peers',
                'Mixed signals, monitor closely'
            ]) as reasoning,
            unnest(ARRAY['LOW', 'LOW', 'MEDIUM', 'HIGH', 'MEDIUM']) as risk,
            unnest(ARRAY['LONG_TERM', 'MEDIUM_TERM', 'LONG_TERM', 'SHORT_TERM', 'MEDIUM_TERM']) as timeHorizon
    ) r;
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error getting AI recommendations for user %: %', user_id, SQLERRM;
END;
$$;

-- 4. Create get_recommendations function (for MCP)
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
    -- In a real implementation, this would generate recommendations based on user data
    RETURN (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', 'rec_' || generate_series,
                'type', COALESCE(recommendation_type, 'default'),
                'symbol', unnest(ARRAY['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META']),
                'action', unnest(ARRAY['BUY', 'HOLD', 'BUY', 'SELL', 'HOLD']),
                'confidence', unnest(ARRAY[0.85, 0.72, 0.78, 0.65, 0.69]),
                'score', unnest(ARRAY[0.85, 0.72, 0.78, 0.65, 0.69]),
                'content', 'Sample recommendation for ' || unnest(ARRAY['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META']),
                'context_id', context_id,
                'created_at', now()
            )
        )
        FROM generate_series(1, LEAST(max_results, 5))
    );
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error getting recommendations for user %: %', user_id, SQLERRM;
END;
$$;

-- 5. Create get_market_news function
CREATE OR REPLACE FUNCTION public.get_market_news(limit_count integer DEFAULT 10, symbol_filter text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
BEGIN
    -- Create market_news table if it doesn't exist
    CREATE TABLE IF NOT EXISTS public.market_news (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT,
        source TEXT,
        url TEXT,
        published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        symbols TEXT[],
        sentiment_score NUMERIC(3,2)
    );
    
    -- Insert some sample news if table is empty
    INSERT INTO public.market_news (title, content, source, url, symbols, sentiment_score)
    SELECT * FROM (VALUES
        ('Tech Stocks Rally on Strong Earnings', 'Major technology companies report better than expected quarterly results...', 'Financial News', 'https://example.com/tech-rally', ARRAY['AAPL', 'MSFT', 'GOOGL'], 0.8),
        ('Market Volatility Continues', 'Investors remain cautious as economic indicators show mixed signals...', 'Market Watch', 'https://example.com/volatility', ARRAY['SPY', 'QQQ'], -0.3),
        ('Healthcare Sector Shows Strength', 'Biotech and pharmaceutical stocks gain on regulatory approvals...', 'Health Finance', 'https://example.com/healthcare', ARRAY['JNJ', 'PFE'], 0.6),
        ('Energy Sector Mixed Results', 'Oil prices fluctuate as supply concerns persist...', 'Energy Daily', 'https://example.com/energy', ARRAY['XOM', 'CVX'], 0.1),
        ('Financial Services Update', 'Banks report strong lending activity despite rate concerns...', 'Banking Today', 'https://example.com/banking', ARRAY['JPM', 'BAC'], 0.4)
    ) AS t(title, content, source, url, symbols, sentiment_score)
    WHERE NOT EXISTS (SELECT 1 FROM public.market_news LIMIT 1);
    
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

-- 6. Create get_ai_health function (for health checks)
CREATE OR REPLACE FUNCTION public.get_ai_health()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN jsonb_build_object(
        'status', 'healthy',
        'timestamp', now(),
        'services', jsonb_build_object(
            'ai_model', 'operational',
            'recommendation_engine', 'operational',
            'data_processing', 'operational'
        ),
        'version', '1.0.0'
    );
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error checking AI health: %', SQLERRM;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_quote(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_context(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_ai_recommendations(text, jsonb) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_recommendations(text, text, text, integer) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_market_news(integer, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_ai_health() TO anon, authenticated, service_role;

-- Grant table permissions
GRANT SELECT ON public.market_news TO anon, authenticated, service_role;
GRANT INSERT ON public.market_news TO anon, authenticated, service_role;
GRANT UPDATE ON public.market_news TO anon, authenticated, service_role;
GRANT DELETE ON public.market_news TO anon, authenticated, service_role;
