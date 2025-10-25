-- Fix RPC function signatures to match frontend calls

-- Fix get_ai_recommendations to match frontend call signature
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

-- Create get_market_news function that frontend expects
CREATE OR REPLACE FUNCTION public.get_market_news(limit_count integer DEFAULT 10, symbol_filter text DEFAULT NULL)
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
        WHERE (symbol_filter IS NULL OR symbol_filter = ANY(symbols))
        ORDER BY published_at DESC
        LIMIT limit_count
    ) news;
    
    RETURN COALESCE(result, '[]'::jsonb);
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error getting market news: %', SQLERRM;
END;
$$;

-- Update get_recommendations to match frontend call signature
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

-- Create get_batch_market_data function that frontend expects
CREATE OR REPLACE FUNCTION public.get_batch_market_data(symbols text[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb := '{}';
    symbol text;
    quote_data jsonb;
BEGIN
    -- Get quotes for each symbol
    FOREACH symbol IN ARRAY symbols
    LOOP
        SELECT public.get_quote(symbol) INTO quote_data;
        result := result || jsonb_build_object(symbol, quote_data);
    END LOOP;
    
    RETURN result;
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error getting batch market data: %', SQLERRM;
END;
$$;

-- Create get_historical_data function that frontend expects
CREATE OR REPLACE FUNCTION public.get_historical_data(
    symbol text,
    start_date date DEFAULT NULL,
    end_date date DEFAULT NULL,
    interval_type text DEFAULT '1d'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- In a real implementation, this would fetch from a historical data table
    -- For now, return mock historical data
    RETURN (
        SELECT jsonb_agg(
            jsonb_build_object(
                'date', (current_date - (generate_series * interval '1 day'))::text,
                'open', (random() * 1000)::numeric(10,2),
                'high', (random() * 1000 + 50)::numeric(10,2),
                'low', (random() * 1000 - 50)::numeric(10,2),
                'close', (random() * 1000)::numeric(10,2),
                'volume', (random() * 1000000)::bigint
            )
        )
        FROM generate_series(0, 29) -- Last 30 days
        WHERE start_date IS NULL OR (current_date - (generate_series * interval '1 day')) >= start_date
        AND (end_date IS NULL OR (current_date - (generate_series * interval '1 day')) <= end_date)
    );
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error getting historical data for %: %', symbol, SQLERRM;
END;
$$;

-- Create additional functions that might be called by the frontend
CREATE OR REPLACE FUNCTION public.get_recommendation_explanation(
    recommendation_id text,
    user_id text DEFAULT 'anonymous'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN jsonb_build_object(
        'explanation', 'This is a sample explanation for recommendation ' || recommendation_id || ' for user ' || user_id,
        'details', jsonb_build_object(
            'reasoning', 'Based on technical analysis and market conditions',
            'confidence', 0.85,
            'risk_factors', ARRAY['Market volatility', 'Sector performance'],
            'time_horizon', 'Medium term (3-6 months)'
        )
    );
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error getting recommendation explanation: %', SQLERRM;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_market_insights(
    p_sectors text[] DEFAULT ARRAY[]::text[],
    p_timeframe text DEFAULT '1m',
    p_region text DEFAULT 'US',
    p_include_technical boolean DEFAULT true,
    p_include_fundamental boolean DEFAULT true,
    p_include_sentiment boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN jsonb_build_object(
        'technical', CASE WHEN p_include_technical THEN jsonb_build_object(
            'rsi', (random() * 40 + 30)::numeric(5,2),
            'macd', (random() * 2 - 1)::numeric(5,2),
            'bollinger', jsonb_build_object(
                'upper', (random() * 100 + 150)::numeric(10,2),
                'middle', (random() * 100 + 140)::numeric(10,2),
                'lower', (random() * 100 + 130)::numeric(10,2)
            )
        ) ELSE NULL END,
        'fundamental', CASE WHEN p_include_fundamental THEN jsonb_build_object(
            'pe_ratio', (random() * 20 + 15)::numeric(5,2),
            'dividend_yield', (random() * 3)::numeric(5,2),
            'market_cap', (random() * 1000000000000 + 500000000000)::bigint,
            'beta', (random() * 1.5 + 0.5)::numeric(5,2)
        ) ELSE NULL END,
        'sentiment', CASE WHEN p_include_sentiment THEN jsonb_build_object(
            'score', (random() * 2 - 1)::numeric(5,2),
            'positive', (random() * 30 + 40)::integer,
            'neutral', (random() * 20 + 30)::integer,
            'negative', (random() * 20 + 10)::integer,
            'sources', ARRAY['news', 'social', 'analysts']
        ) ELSE NULL END,
        'timeframe', p_timeframe,
        'region', p_region,
        'sectors', p_sectors,
        'generated_at', now()
    );
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error getting market insights: %', SQLERRM;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_recommendation_feedback(
    recommendation_id text,
    user_id text,
    rating text,
    comment text DEFAULT NULL,
    metadata jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- In a real implementation, this would store feedback in a table
    RETURN jsonb_build_object(
        'success', true,
        'feedback_id', 'feedback_' || extract(epoch from now())::bigint,
        'recommendation_id', recommendation_id,
        'user_id', user_id,
        'rating', rating,
        'submitted_at', now()
    );
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error submitting feedback: %', SQLERRM;
END;
$$;

CREATE OR REPLACE FUNCTION public.track_recommendation_interaction(
    p_recommendation_id text,
    p_interaction_type text,
    p_metadata jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- In a real implementation, this would store interaction data
    RETURN jsonb_build_object(
        'success', true,
        'interaction_id', 'interaction_' || extract(epoch from now())::bigint,
        'recommendation_id', p_recommendation_id,
        'interaction_type', p_interaction_type,
        'tracked_at', now()
    );
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error tracking interaction: %', SQLERRM;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_user_context(
    user_id text,
    context_updates jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- In a real implementation, this would update user context in a table
    RETURN jsonb_build_object(
        'success', true,
        'user_id', user_id,
        'updated_context', context_updates,
        'updated_at', now()
    );
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error updating user context: %', SQLERRM;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_feedback(
    user_id text,
    content_id text,
    rating integer,
    comment text DEFAULT NULL,
    metadata jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- In a real implementation, this would store feedback in a table
    RETURN jsonb_build_object(
        'success', true,
        'feedback_id', 'feedback_' || extract(epoch from now())::bigint,
        'user_id', user_id,
        'content_id', content_id,
        'rating', rating,
        'submitted_at', now()
    );
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error submitting feedback: %', SQLERRM;
END;
$$;

CREATE OR REPLACE FUNCTION public.track_interaction(
    user_id text,
    interaction_type text,
    content_id text,
    metadata jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- In a real implementation, this would store interaction data
    RETURN jsonb_build_object(
        'success', true,
        'interaction_id', 'interaction_' || extract(epoch from now())::bigint,
        'user_id', user_id,
        'interaction_type', interaction_type,
        'content_id', content_id,
        'tracked_at', now()
    );
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error tracking interaction: %', SQLERRM;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_ai_recommendations(text, jsonb) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_market_news(integer, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_recommendations(text, text, text, integer) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_batch_market_data(text[]) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_historical_data(text, date, date, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_recommendation_explanation(text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_market_insights(text[], text, text, boolean, boolean, boolean) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_recommendation_feedback(text, text, text, text, jsonb) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.track_recommendation_interaction(text, text, jsonb) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_user_context(text, jsonb) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_feedback(text, text, integer, text, jsonb) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.track_interaction(text, text, text, jsonb) TO anon, authenticated, service_role;
