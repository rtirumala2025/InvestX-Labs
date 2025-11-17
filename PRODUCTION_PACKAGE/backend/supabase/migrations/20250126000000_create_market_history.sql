-- Market History Table for Historical Price Data
-- This table stores historical stock prices fetched from Alpha Vantage
-- Used for charts, benchmarks, and historical analysis

CREATE TABLE IF NOT EXISTS public.market_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol TEXT NOT NULL,
    date DATE NOT NULL,
    open NUMERIC(12, 4) NOT NULL,
    high NUMERIC(12, 4) NOT NULL,
    low NUMERIC(12, 4) NOT NULL,
    close NUMERIC(12, 4) NOT NULL,
    volume BIGINT NOT NULL,
    interval TEXT DEFAULT 'daily',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(symbol, date, interval)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_market_history_symbol ON public.market_history(symbol);
CREATE INDEX IF NOT EXISTS idx_market_history_date ON public.market_history(date DESC);
CREATE INDEX IF NOT EXISTS idx_market_history_symbol_date ON public.market_history(symbol, date DESC);
CREATE INDEX IF NOT EXISTS idx_market_history_interval ON public.market_history(interval);

-- Enable Row Level Security
ALTER TABLE public.market_history ENABLE ROW LEVEL SECURITY;

-- Create policy for read access (all users can read historical data)
CREATE POLICY "Enable read access for all users" ON public.market_history
    FOR SELECT USING (true);

-- Create policy for write access (only service role can write)
CREATE POLICY "Enable write access for service role" ON public.market_history
    FOR INSERT 
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable update access for service role" ON public.market_history
    FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_market_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_market_history_timestamp
    BEFORE UPDATE ON public.market_history
    FOR EACH ROW
    EXECUTE FUNCTION public.update_market_history_updated_at();

-- Create RPC function to get historical data for a symbol
CREATE OR REPLACE FUNCTION public.get_market_history(
    p_symbol TEXT,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL,
    p_interval TEXT DEFAULT 'daily',
    p_limit INTEGER DEFAULT 1000
)
RETURNS TABLE (
    date DATE,
    open NUMERIC(12, 4),
    high NUMERIC(12, 4),
    low NUMERIC(12, 4),
    close NUMERIC(12, 4),
    volume BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mh.date,
        mh.open,
        mh.high,
        mh.low,
        mh.close,
        mh.volume
    FROM public.market_history mh
    WHERE mh.symbol = UPPER(p_symbol)
        AND mh.interval = p_interval
        AND (p_start_date IS NULL OR mh.date >= p_start_date)
        AND (p_end_date IS NULL OR mh.date <= p_end_date)
    ORDER BY mh.date DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_market_history TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_market_history TO anon;

