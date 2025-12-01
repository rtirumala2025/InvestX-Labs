-- Create holdings table and add purchase_price column
-- This migration creates the table if it doesn't exist, and ensures purchase_price column exists

-- First, ensure portfolios table exists (required for foreign key)
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

-- Create holdings table if it doesn't exist (with purchase_price included)
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

-- ALWAYS ensure purchase_price column exists (even if table was created earlier)
-- This handles the case where table exists but column doesn't
DO $$
BEGIN
    -- Only proceed if table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'holdings'
    ) THEN
        -- Add purchase_price column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'holdings' 
            AND column_name = 'purchase_price'
        ) THEN
            -- Add the column
            ALTER TABLE public.holdings 
            ADD COLUMN purchase_price DECIMAL(15, 2);
            
            RAISE NOTICE '✅ Added purchase_price column';
            
            -- Populate existing rows - check if current_price column exists first
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND table_name = 'holdings' 
                    AND column_name = 'current_price'
                ) THEN
                    -- Use current_price if it exists
                    UPDATE public.holdings 
                    SET purchase_price = COALESCE(current_price, 0)
                    WHERE purchase_price IS NULL;
                    RAISE NOTICE '✅ Populated purchase_price from current_price';
                ELSE
                    -- Just set to 0 if current_price doesn't exist
                    UPDATE public.holdings 
                    SET purchase_price = 0
                    WHERE purchase_price IS NULL;
                    RAISE NOTICE '✅ Populated purchase_price with default 0 (current_price column not found)';
                END IF;
            EXCEPTION
                WHEN OTHERS THEN
                    -- If update fails, just set defaults
                    UPDATE public.holdings 
                    SET purchase_price = 0
                    WHERE purchase_price IS NULL;
                    RAISE NOTICE '⚠️  Populated purchase_price with default 0 (error: %)', SQLERRM;
            END;
            
            -- Set default for future inserts
            ALTER TABLE public.holdings 
            ALTER COLUMN purchase_price SET DEFAULT 0;
            
            -- Try to make it NOT NULL (only if no NULLs remain)
            BEGIN
                -- Check if any NULLs exist
                IF NOT EXISTS (SELECT 1 FROM public.holdings WHERE purchase_price IS NULL) THEN
                    ALTER TABLE public.holdings 
                    ALTER COLUMN purchase_price SET NOT NULL;
                    RAISE NOTICE '✅ Set purchase_price to NOT NULL';
                ELSE
                    RAISE NOTICE '⚠️  Some holdings have NULL purchase_price - keeping nullable';
                END IF;
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE '⚠️  Could not set purchase_price to NOT NULL: %', SQLERRM;
            END;
        ELSE
            RAISE NOTICE '✅ purchase_price column already exists';
        END IF;
    ELSE
        RAISE NOTICE '✅ Holdings table created with purchase_price column (from CREATE TABLE above)';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error in purchase_price migration: %', SQLERRM;
        RAISE;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_holdings_portfolio_id ON public.holdings(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_holdings_user_id ON public.holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_holdings_symbol ON public.holdings(symbol);

-- Enable RLS
ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if they don't exist
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
