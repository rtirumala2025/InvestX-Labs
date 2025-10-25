-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Market Data Functions
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

-- MCP (Model Control Panel) Functions
CREATE OR REPLACE FUNCTION public.get_recommendations(user_id text DEFAULT 'anonymous')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- In a real implementation, this would generate recommendations based on user data
    RETURN (
        SELECT jsonb_agg(r)
        FROM (
            SELECT 
                unnest(ARRAY['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META']) as symbol,
                unnest(ARRAY['BUY', 'HOLD', 'BUY', 'SELL', 'HOLD']) as action,
                unnest(ARRAY[0.85, 0.72, 0.78, 0.65, 0.69]) as confidence
        ) r
    );
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error getting recommendations for user %: %', user_id, SQLERRM;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_context(user_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- In a real implementation, this would fetch user context from the database
    RETURN jsonb_build_object(
        'user_id', user_id,
        'preferences', jsonb_build_object(
            'theme', 'light',
            'notifications', true,
            'default_view', 'dashboard'
        ),
        'last_active', now(),
        'created_at', now() - (random() * interval '30 days')
    );
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error getting context for user %: %', user_id, SQLERRM;
END;
$$;

-- AI Service Functions
CREATE OR REPLACE FUNCTION public.get_ai_health()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN jsonb_build_object(
        'status', 'ok',
        'version', '1.0.0',
        'services', jsonb_build_object(
            'database', true,
            'cache', true,
            'models', jsonb_build_array('recommendation', 'sentiment', 'forecasting')
        ),
        'timestamp', now()
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_ai_recommendations(query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- In a real implementation, this would call an AI model
    RETURN (
        SELECT jsonb_build_object(
            'query', query,
            'recommendations', jsonb_agg(r)
        )
        FROM (
            SELECT 
                unnest(ARRAY['AAPL', 'MSFT', 'GOOGL']) as symbol,
                unnest(ARRAY['Strong Buy', 'Hold', 'Buy']) as recommendation,
                unnest(ARRAY[0.95, 0.75, 0.85]) as confidence,
                unnest(ARRAY[
                    'Strong fundamentals and growth potential',
                    'Market leader with stable performance',
                    'Innovative products and strong market position'
                ]) as reasoning
        ) r
    );
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error getting AI recommendations: %', SQLERRM;
END;
$$;

-- Market News Table
CREATE TABLE IF NOT EXISTS public.market_news (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT,
    source TEXT,
    url TEXT,
    published_at TIMESTAMPTZ DEFAULT now(),
    symbols TEXT[],
    sentiment_score NUMERIC(5,2),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_market_news_published_at ON public.market_news(published_at);
CREATE INDEX IF NOT EXISTS idx_market_news_symbols ON public.market_news USING GIN(symbols);

-- Insert some sample news if the table is empty
INSERT INTO public.market_news (title, content, source, url, symbols, sentiment_score)
SELECT 
    'Market ' || n || ' - ' || 
    (ARRAY['Rally Continues', 'Correction Ahead', 'Stable Growth', 'Volatility Expected'])[(n % 4) + 1] as title,
    'This is a sample news article about the stock market. ' ||
    'The market has been ' || 
    (ARRAY['performing well', 'experiencing volatility', 'showing stability', 'facing challenges'])[(n % 4) + 1] || 
    ' in recent trading sessions.' as content,
    (ARRAY['MarketWatch', 'Bloomberg', 'CNBC', 'Financial Times'])[(n % 4) + 1] as source,
    'https://example.com/news/' || n as url,
    ARRAY[
        (ARRAY['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META'])[(n % 5) + 1],
        (ARRAY['TSLA', 'NVDA', 'JPM', 'V', 'WMT'])[(n % 5) + 1]
    ] as symbols,
    (random() * 2 - 1)::numeric(5,2) as sentiment_score
FROM generate_series(1, 10) as n
WHERE NOT EXISTS (SELECT 1 FROM public.market_news LIMIT 1);

-- Set up Row Level Security (RLS)
ALTER TABLE public.market_news ENABLE ROW LEVEL SECURITY;

-- Create policies for secure access
CREATE POLICY "Enable read access for all users" ON public.market_news
    FOR SELECT USING (true);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at column
DROP TRIGGER IF EXISTS update_market_news_updated_at ON public.market_news;
CREATE TRIGGER update_market_news_updated_at
BEFORE UPDATE ON public.market_news
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
