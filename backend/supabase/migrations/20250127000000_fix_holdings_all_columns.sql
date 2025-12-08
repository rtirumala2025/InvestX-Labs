-- Add all missing columns to holdings table
-- This migration ensures the holdings table has all required columns
-- Idempotent: Safe to run multiple times

DO $$
BEGIN
    -- Check if holdings table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'holdings'
    ) THEN
        RAISE NOTICE '⚠️  holdings table does not exist - this migration will not create it';
        RAISE NOTICE 'ℹ️  Please ensure the main schema migration has been run first';
        RETURN;
    END IF;

    RAISE NOTICE '🔍 Checking and adding missing columns to holdings table...';

    -- Add portfolio_id if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'holdings' 
        AND column_name = 'portfolio_id'
    ) THEN
        ALTER TABLE public.holdings 
        ADD COLUMN portfolio_id UUID;
        RAISE NOTICE '✅ Added portfolio_id column';
    END IF;

    -- Add user_id if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'holdings' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.holdings 
        ADD COLUMN user_id UUID;
        RAISE NOTICE '✅ Added user_id column';
        
        -- Try to populate user_id from portfolios table if possible
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'portfolios'
        ) THEN
            UPDATE public.holdings h
            SET user_id = p.user_id
            FROM public.portfolios p
            WHERE h.portfolio_id = p.id
            AND h.user_id IS NULL;
            RAISE NOTICE '✅ Populated user_id from portfolios table';
        END IF;
    END IF;

    -- Add symbol if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'holdings' 
        AND column_name = 'symbol'
    ) THEN
        ALTER TABLE public.holdings 
        ADD COLUMN symbol TEXT;
        RAISE NOTICE '✅ Added symbol column';
    END IF;

    -- Add company_name if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'holdings' 
        AND column_name = 'company_name'
    ) THEN
        ALTER TABLE public.holdings 
        ADD COLUMN company_name TEXT;
        RAISE NOTICE '✅ Added company_name column';
    END IF;

    -- Add shares if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'holdings' 
        AND column_name = 'shares'
    ) THEN
        ALTER TABLE public.holdings 
        ADD COLUMN shares DECIMAL(15, 6);
        RAISE NOTICE '✅ Added shares column';
    END IF;

    -- Add purchase_price if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'holdings' 
        AND column_name = 'purchase_price'
    ) THEN
        ALTER TABLE public.holdings 
        ADD COLUMN purchase_price DECIMAL(15, 2);
        RAISE NOTICE '✅ Added purchase_price column';
    END IF;

    -- Add purchase_date if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'holdings' 
        AND column_name = 'purchase_date'
    ) THEN
        ALTER TABLE public.holdings 
        ADD COLUMN purchase_date DATE;
        RAISE NOTICE '✅ Added purchase_date column';
        
        -- Set default purchase_date for existing rows if missing
        UPDATE public.holdings 
        SET purchase_date = COALESCE(purchase_date, CURRENT_DATE)
        WHERE purchase_date IS NULL;
        RAISE NOTICE '✅ Set default purchase_date for existing rows';
    END IF;

    -- Add current_price if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'holdings' 
        AND column_name = 'current_price'
    ) THEN
        ALTER TABLE public.holdings 
        ADD COLUMN current_price DECIMAL(15, 2);
        RAISE NOTICE '✅ Added current_price column';
        
        -- Populate existing rows with purchase_price as default
        UPDATE public.holdings 
        SET current_price = purchase_price 
        WHERE current_price IS NULL 
        AND purchase_price IS NOT NULL;
        RAISE NOTICE '✅ Populated current_price for existing holdings from purchase_price';
    END IF;

    -- Add sector if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'holdings' 
        AND column_name = 'sector'
    ) THEN
        ALTER TABLE public.holdings 
        ADD COLUMN sector TEXT;
        RAISE NOTICE '✅ Added sector column';
    END IF;

    -- Add asset_type if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'holdings' 
        AND column_name = 'asset_type'
    ) THEN
        ALTER TABLE public.holdings 
        ADD COLUMN asset_type TEXT DEFAULT 'Stock';
        RAISE NOTICE '✅ Added asset_type column';
        
        -- Set default for existing rows
        UPDATE public.holdings 
        SET asset_type = 'Stock'
        WHERE asset_type IS NULL;
    END IF;

    -- Add created_at if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'holdings' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.holdings 
        ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Added created_at column';
        
        -- Set default for existing rows
        UPDATE public.holdings 
        SET created_at = NOW()
        WHERE created_at IS NULL;
    END IF;

    -- Add updated_at if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'holdings' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.holdings 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Added updated_at column';
        
        -- Set default for existing rows
        UPDATE public.holdings 
        SET updated_at = NOW()
        WHERE updated_at IS NULL;
    END IF;

    -- Add metadata if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'holdings' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE public.holdings 
        ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE '✅ Added metadata column';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Holdings table migration complete!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'All required columns have been added to the holdings table.';
    RAISE NOTICE 'You may need to refresh PostgREST schema cache if columns still appear missing.';
    RAISE NOTICE 'This can take 1-2 minutes or you can refresh via Supabase Dashboard.';

END $$;

