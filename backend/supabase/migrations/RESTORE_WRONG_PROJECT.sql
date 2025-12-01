-- ============================================================
-- RESTORATION SCRIPT FOR WRONG PROJECT
-- ============================================================
-- Run this if you need to restore the objects that were removed
-- This will recreate them exactly as they were
-- ============================================================

-- STEP 1: Restore portfolios table (if it was dropped)
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

-- STEP 2: Restore holdings table (if it was dropped)
CREATE TABLE IF NOT EXISTS public.holdings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    symbol TEXT NOT NULL,
    company_name TEXT,
    shares DECIMAL(15, 6) NOT NULL,
    purchase_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    current_price DECIMAL(15, 2),
    sector TEXT,
    asset_type TEXT DEFAULT 'Stock',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- STEP 3: Restore purchase_price column in holdings (if it was removed)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'holdings' 
        AND column_name = 'purchase_price'
    ) THEN
        ALTER TABLE public.holdings 
        ADD COLUMN purchase_price DECIMAL(15, 2) DEFAULT 0;
        
        -- Populate existing rows
        UPDATE public.holdings 
        SET purchase_price = 0
        WHERE purchase_price IS NULL;
        
        RAISE NOTICE '✅ Restored purchase_price column to holdings';
    ELSE
        RAISE NOTICE 'ℹ️  purchase_price column already exists';
    END IF;
END $$;

-- STEP 4: Restore xp column in user_profiles (if it was removed)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'xp'
    ) THEN
        ALTER TABLE public.user_profiles 
        ADD COLUMN xp INTEGER DEFAULT 0 NOT NULL;
        
        RAISE NOTICE '✅ Restored xp column to user_profiles';
    ELSE
        RAISE NOTICE 'ℹ️  xp column already exists';
    END IF;
END $$;

-- STEP 5: Restore net_worth column in user_profiles (if it was removed)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'net_worth'
    ) THEN
        ALTER TABLE public.user_profiles 
        ADD COLUMN net_worth DECIMAL(15, 2) DEFAULT 0 NOT NULL;
        
        RAISE NOTICE '✅ Restored net_worth column to user_profiles';
    ELSE
        RAISE NOTICE 'ℹ️  net_worth column already exists';
    END IF;
END $$;

-- STEP 6: Create indexes for holdings (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_holdings_portfolio_id ON public.holdings(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_holdings_user_id ON public.holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_holdings_symbol ON public.holdings(symbol);

-- STEP 7: Enable RLS on holdings (if not already enabled)
ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;

-- STEP 8: Create RLS policies for holdings (if they don't exist)
DO $$
BEGIN
    -- SELECT policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'holdings' 
        AND policyname = 'Users can view own holdings'
    ) THEN
        CREATE POLICY "Users can view own holdings"
        ON public.holdings
        FOR SELECT
        USING (auth.uid() = user_id);
    END IF;
    
    -- INSERT policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'holdings' 
        AND policyname = 'Users can insert own holdings'
    ) THEN
        CREATE POLICY "Users can insert own holdings"
        ON public.holdings
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    END IF;
    
    -- UPDATE policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'holdings' 
        AND policyname = 'Users can update own holdings'
    ) THEN
        CREATE POLICY "Users can update own holdings"
        ON public.holdings
        FOR UPDATE
        USING (auth.uid() = user_id);
    END IF;
    
    -- DELETE policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'holdings' 
        AND policyname = 'Users can delete own holdings'
    ) THEN
        CREATE POLICY "Users can delete own holdings"
        ON public.holdings
        FOR DELETE
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- STEP 9: Verify restoration
SELECT 
    'RESTORATION VERIFICATION:' AS status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'holdings')
        THEN '✅ holdings table restored'
        ELSE '❌ holdings table missing'
    END AS holdings_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'portfolios')
        THEN '✅ portfolios table restored'
        ELSE '❌ portfolios table missing'
    END AS portfolios_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'xp')
        THEN '✅ xp column restored'
        ELSE '❌ xp column missing'
    END AS xp_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'net_worth')
        THEN '✅ net_worth column restored'
        ELSE '❌ net_worth column missing'
    END AS net_worth_status;
