-- Simulation Enhancements Migration
-- Adds portfolio history tracking, simulation logs, and performance metrics

-- Ensure portfolios table exists before creating dependent tables
CREATE TABLE IF NOT EXISTS public.portfolios (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT DEFAULT 'My Portfolio',
    description TEXT,
    is_simulation BOOLEAN DEFAULT FALSE,
    virtual_balance DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON public.portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_is_simulation ON public.portfolios(is_simulation);

-- Enable RLS if not already enabled
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;

-- RLS policies for portfolios (drop and recreate to ensure they exist)
DROP POLICY IF EXISTS "Users can view own portfolios" ON public.portfolios;
CREATE POLICY "Users can view own portfolios"
    ON public.portfolios
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own portfolios" ON public.portfolios;
CREATE POLICY "Users can insert own portfolios"
    ON public.portfolios
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own portfolios" ON public.portfolios;
CREATE POLICY "Users can update own portfolios"
    ON public.portfolios
    FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own portfolios" ON public.portfolios;
CREATE POLICY "Users can delete own portfolios"
    ON public.portfolios
    FOR DELETE
    USING (auth.uid() = user_id);

-- Portfolio history table for charting performance over time
CREATE TABLE IF NOT EXISTS public.portfolio_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    total_value DECIMAL(15, 2) NOT NULL,
    cash_balance DECIMAL(15, 2) NOT NULL,
    invested_value DECIMAL(15, 2) NOT NULL,
    daily_change DECIMAL(15, 2) DEFAULT 0,
    daily_change_percent DECIMAL(10, 4) DEFAULT 0,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_portfolio_history_portfolio_id ON public.portfolio_history(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_history_user_id ON public.portfolio_history(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_history_recorded_at ON public.portfolio_history(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_history_portfolio_date ON public.portfolio_history(portfolio_id, recorded_at DESC);

-- Enable RLS
ALTER TABLE public.portfolio_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for portfolio_history
CREATE POLICY "Users can view own portfolio history"
    ON public.portfolio_history
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own portfolio history"
    ON public.portfolio_history
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Simulation logs table for detailed activity tracking
CREATE TABLE IF NOT EXISTS public.simulation_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('buy', 'sell', 'reset', 'achievement', 'login', 'portfolio_update')),
    symbol TEXT,
    shares DECIMAL(15, 6),
    price DECIMAL(15, 2),
    total_amount DECIMAL(15, 2),
    fees DECIMAL(15, 2) DEFAULT 0,
    gain_loss DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_simulation_logs_user_id ON public.simulation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_simulation_logs_portfolio_id ON public.simulation_logs(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_simulation_logs_action ON public.simulation_logs(action);
CREATE INDEX IF NOT EXISTS idx_simulation_logs_created_at ON public.simulation_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.simulation_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for simulation_logs
CREATE POLICY "Users can view own simulation logs"
    ON public.simulation_logs
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own simulation logs"
    ON public.simulation_logs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Add performance tracking columns to portfolios table
DO $$
BEGIN
    -- Add performance columns if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'portfolios' 
        AND column_name = 'starting_balance'
    ) THEN
        ALTER TABLE public.portfolios 
        ADD COLUMN starting_balance DECIMAL(15, 2) DEFAULT 10000;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'portfolios' 
        AND column_name = 'all_time_high'
    ) THEN
        ALTER TABLE public.portfolios 
        ADD COLUMN all_time_high DECIMAL(15, 2);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'portfolios' 
        AND column_name = 'max_drawdown'
    ) THEN
        ALTER TABLE public.portfolios 
        ADD COLUMN max_drawdown DECIMAL(10, 4) DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'portfolios' 
        AND column_name = 'total_return'
    ) THEN
        ALTER TABLE public.portfolios 
        ADD COLUMN total_return DECIMAL(15, 2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'portfolios' 
        AND column_name = 'total_return_percent'
    ) THEN
        ALTER TABLE public.portfolios 
        ADD COLUMN total_return_percent DECIMAL(10, 4) DEFAULT 0;
    END IF;
END $$;

-- Function to record portfolio snapshot for history
CREATE OR REPLACE FUNCTION public.record_portfolio_snapshot(
    p_portfolio_id UUID,
    p_total_value DECIMAL,
    p_cash_balance DECIMAL,
    p_invested_value DECIMAL,
    p_daily_change DECIMAL DEFAULT 0,
    p_daily_change_percent DECIMAL DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_snapshot_id UUID;
BEGIN
    -- Get user_id from portfolio
    SELECT user_id INTO v_user_id
    FROM public.portfolios
    WHERE id = p_portfolio_id;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Portfolio not found';
    END IF;

    -- Insert snapshot
    INSERT INTO public.portfolio_history (
        portfolio_id,
        user_id,
        total_value,
        cash_balance,
        invested_value,
        daily_change,
        daily_change_percent,
        recorded_at
    )
    VALUES (
        p_portfolio_id,
        v_user_id,
        p_total_value,
        p_cash_balance,
        p_invested_value,
        p_daily_change,
        p_daily_change_percent,
        NOW()
    )
    RETURNING id INTO v_snapshot_id;

    -- Keep only last 365 days of history per portfolio
    DELETE FROM public.portfolio_history
    WHERE portfolio_id = p_portfolio_id
    AND recorded_at < NOW() - INTERVAL '365 days';

    RETURN v_snapshot_id;
END;
$$;

-- Function to get portfolio performance metrics
CREATE OR REPLACE FUNCTION public.get_portfolio_performance(p_portfolio_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_portfolio RECORD;
    v_holdings_value DECIMAL;
    v_total_value DECIMAL;
    v_total_return DECIMAL;
    v_total_return_percent DECIMAL;
    v_result JSONB;
BEGIN
    -- Get portfolio info
    SELECT * INTO v_portfolio
    FROM public.portfolios
    WHERE id = p_portfolio_id;

    IF v_portfolio IS NULL THEN
        RETURN jsonb_build_object('error', 'Portfolio not found');
    END IF;

    -- Calculate holdings value
    SELECT COALESCE(SUM(shares * COALESCE(current_price, purchase_price)), 0)
    INTO v_holdings_value
    FROM public.holdings
    WHERE portfolio_id = p_portfolio_id;

    -- Calculate total value
    v_total_value := COALESCE(v_portfolio.virtual_balance, 0) + v_holdings_value;

    -- Calculate returns
    v_total_return := v_total_value - COALESCE(v_portfolio.starting_balance, 10000);
    v_total_return_percent := CASE 
        WHEN COALESCE(v_portfolio.starting_balance, 10000) > 0 
        THEN (v_total_return / v_portfolio.starting_balance) * 100 
        ELSE 0 
    END;

    -- Build result
    v_result := jsonb_build_object(
        'total_value', v_total_value,
        'cash_balance', COALESCE(v_portfolio.virtual_balance, 0),
        'holdings_value', v_holdings_value,
        'starting_balance', COALESCE(v_portfolio.starting_balance, 10000),
        'total_return', v_total_return,
        'total_return_percent', v_total_return_percent,
        'all_time_high', v_portfolio.all_time_high,
        'max_drawdown', COALESCE(v_portfolio.max_drawdown, 0)
    );

    RETURN v_result;
END;
$$;

-- Comments
COMMENT ON TABLE public.portfolio_history IS 'Historical snapshots of portfolio values for charting';
COMMENT ON TABLE public.simulation_logs IS 'Detailed activity logs for simulation mode';
COMMENT ON FUNCTION public.record_portfolio_snapshot IS 'Records a portfolio value snapshot for history tracking';
COMMENT ON FUNCTION public.get_portfolio_performance IS 'Calculates and returns portfolio performance metrics';
