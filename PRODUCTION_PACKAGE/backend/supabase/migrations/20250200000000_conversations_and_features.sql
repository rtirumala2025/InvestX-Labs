-- Conversations table for chat history
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    messages JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- RLS policies for conversations
CREATE POLICY "Users can view own conversations"
    ON public.conversations
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
    ON public.conversations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
    ON public.conversations
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
    ON public.conversations
    FOR DELETE
    USING (auth.uid() = user_id);

-- Portfolios table (if not exists)
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

CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON public.portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_is_simulation ON public.portfolios(is_simulation);

-- Enable RLS
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;

-- RLS policies for portfolios
CREATE POLICY "Users can view own portfolios"
    ON public.portfolios
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own portfolios"
    ON public.portfolios
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolios"
    ON public.portfolios
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own portfolios"
    ON public.portfolios
    FOR DELETE
    USING (auth.uid() = user_id);

-- Holdings table
CREATE TABLE IF NOT EXISTS public.holdings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    symbol TEXT NOT NULL,
    company_name TEXT,
    shares DECIMAL(15, 6) NOT NULL,
    purchase_price DECIMAL(15, 2) NOT NULL,
    purchase_date DATE NOT NULL,
    current_price DECIMAL(15, 2),
    sector TEXT,
    asset_type TEXT DEFAULT 'Stock',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_holdings_portfolio_id ON public.holdings(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_holdings_user_id ON public.holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_holdings_symbol ON public.holdings(symbol);

-- Enable RLS
ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;

-- RLS policies for holdings
CREATE POLICY "Users can view own holdings"
    ON public.holdings
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own holdings"
    ON public.holdings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own holdings"
    ON public.holdings
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own holdings"
    ON public.holdings
    FOR DELETE
    USING (auth.uid() = user_id);

-- Transactions table (for simulation mode)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE NOT NULL,
    transaction_type TEXT CHECK (transaction_type IN ('buy', 'sell', 'deposit', 'withdrawal')) NOT NULL,
    symbol TEXT,
    shares DECIMAL(15, 6),
    price DECIMAL(15, 2),
    total_amount DECIMAL(15, 2) NOT NULL,
    fees DECIMAL(15, 2) DEFAULT 0,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_portfolio_id ON public.transactions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(transaction_date);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for transactions
CREATE POLICY "Users can view own transactions"
    ON public.transactions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
    ON public.transactions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Achievements/Badges table
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    badge_id TEXT NOT NULL,
    badge_name TEXT NOT NULL,
    badge_description TEXT,
    badge_icon TEXT,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_earned_at ON public.user_achievements(earned_at);

-- Enable RLS
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS policies for achievements
CREATE POLICY "Users can view own achievements"
    ON public.user_achievements
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view all achievements (leaderboard)"
    ON public.user_achievements
    FOR SELECT
    USING (true);

-- Leaderboard scores table
CREATE TABLE IF NOT EXISTS public.leaderboard_scores (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    username TEXT,
    score INTEGER DEFAULT 0,
    rank INTEGER,
    portfolio_return DECIMAL(10, 2) DEFAULT 0,
    achievements_count INTEGER DEFAULT 0,
    trades_count INTEGER DEFAULT 0,
    learning_progress INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON public.leaderboard_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON public.leaderboard_scores(rank);

-- Enable RLS
ALTER TABLE public.leaderboard_scores ENABLE ROW LEVEL SECURITY;

-- RLS policies for leaderboard (public read, own write)
CREATE POLICY "Anyone can view leaderboard"
    ON public.leaderboard_scores
    FOR SELECT
    USING (true);

CREATE POLICY "Users can update own score"
    ON public.leaderboard_scores
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own score"
    ON public.leaderboard_scores
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Spending analysis table
CREATE TABLE IF NOT EXISTS public.spending_analysis (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    month_year TEXT NOT NULL,
    total_income DECIMAL(15, 2) DEFAULT 0,
    total_expenses DECIMAL(15, 2) DEFAULT 0,
    savings_rate DECIMAL(5, 2) DEFAULT 0,
    discretionary_spending DECIMAL(15, 2) DEFAULT 0,
    investment_capacity DECIMAL(15, 2) DEFAULT 0,
    categories JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, month_year)
);

CREATE INDEX IF NOT EXISTS idx_spending_user_id ON public.spending_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_spending_month_year ON public.spending_analysis(month_year);

-- Enable RLS
ALTER TABLE public.spending_analysis ENABLE ROW LEVEL SECURITY;

-- RLS policies for spending analysis
CREATE POLICY "Users can view own spending analysis"
    ON public.spending_analysis
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own spending analysis"
    ON public.spending_analysis
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own spending analysis"
    ON public.spending_analysis
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Function to update leaderboard ranks
CREATE OR REPLACE FUNCTION update_leaderboard_ranks()
RETURNS TRIGGER AS $$
BEGIN
    WITH ranked_scores AS (
        SELECT 
            id,
            ROW_NUMBER() OVER (ORDER BY score DESC) as new_rank
        FROM public.leaderboard_scores
    )
    UPDATE public.leaderboard_scores ls
    SET rank = rs.new_rank
    FROM ranked_scores rs
    WHERE ls.id = rs.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update ranks
CREATE TRIGGER trigger_update_leaderboard_ranks
    AFTER INSERT OR UPDATE ON public.leaderboard_scores
    FOR EACH STATEMENT
    EXECUTE FUNCTION update_leaderboard_ranks();

-- Function to calculate portfolio metrics
CREATE OR REPLACE FUNCTION calculate_portfolio_metrics(p_user_id UUID, p_portfolio_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    total_value DECIMAL(15, 2);
    total_cost DECIMAL(15, 2);
    total_gain_loss DECIMAL(15, 2);
BEGIN
    SELECT 
        COALESCE(SUM(shares * COALESCE(current_price, purchase_price)), 0),
        COALESCE(SUM(shares * purchase_price), 0)
    INTO total_value, total_cost
    FROM public.holdings
    WHERE portfolio_id = p_portfolio_id AND user_id = p_user_id;
    
    total_gain_loss := total_value - total_cost;
    
    result := jsonb_build_object(
        'total_value', total_value,
        'total_cost', total_cost,
        'total_gain_loss', total_gain_loss,
        'gain_loss_percentage', CASE 
            WHEN total_cost > 0 THEN (total_gain_loss / total_cost) * 100 
            ELSE 0 
        END
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to award achievement
CREATE OR REPLACE FUNCTION award_achievement(
    p_user_id UUID,
    p_badge_id TEXT,
    p_badge_name TEXT,
    p_badge_description TEXT DEFAULT '',
    p_badge_icon TEXT DEFAULT '🏆'
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    achievement_id UUID;
BEGIN
    -- Insert achievement (ignore if already exists)
    INSERT INTO public.user_achievements (user_id, badge_id, badge_name, badge_description, badge_icon)
    VALUES (p_user_id, p_badge_id, p_badge_name, p_badge_description, p_badge_icon)
    ON CONFLICT (user_id, badge_id) DO NOTHING
    RETURNING id INTO achievement_id;
    
    IF achievement_id IS NOT NULL THEN
        -- Update leaderboard score
        INSERT INTO public.leaderboard_scores (user_id, achievements_count, score)
        VALUES (p_user_id, 1, 100)
        ON CONFLICT (user_id) DO UPDATE
        SET 
            achievements_count = public.leaderboard_scores.achievements_count + 1,
            score = public.leaderboard_scores.score + 100,
            updated_at = NOW();
        
        result := jsonb_build_object(
            'success', true,
            'achievement_id', achievement_id,
            'message', 'Achievement unlocked!'
        );
    ELSE
        result := jsonb_build_object(
            'success', false,
            'message', 'Achievement already earned'
        );
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get leaderboard
CREATE OR REPLACE FUNCTION get_leaderboard(p_limit INTEGER DEFAULT 100)
RETURNS TABLE (
    user_id UUID,
    username TEXT,
    score INTEGER,
    rank INTEGER,
    portfolio_return DECIMAL(10, 2),
    achievements_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ls.user_id,
        COALESCE(ls.username, p.email) as username,
        ls.score,
        ls.rank,
        ls.portfolio_return,
        ls.achievements_count
    FROM public.leaderboard_scores ls
    LEFT JOIN auth.users p ON ls.user_id = p.id
    ORDER BY ls.rank ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE public.conversations IS 'Chat conversation history for AI chatbot';
COMMENT ON TABLE public.portfolios IS 'User portfolios (real and simulation)';
COMMENT ON TABLE public.holdings IS 'Individual stock/asset holdings';
COMMENT ON TABLE public.transactions IS 'Trading transactions for simulation mode';
COMMENT ON TABLE public.user_achievements IS 'User earned achievements/badges';
COMMENT ON TABLE public.leaderboard_scores IS 'Leaderboard rankings and scores';
COMMENT ON TABLE public.spending_analysis IS 'Analyzed spending patterns from uploaded CSV';

