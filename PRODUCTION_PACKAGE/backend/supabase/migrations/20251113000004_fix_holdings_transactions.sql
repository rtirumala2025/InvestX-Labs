-- Fix Holdings and Transactions Tables
-- This migration ensures holdings and transactions tables have user_id column

-- 1. Fix holdings table - add user_id if missing
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'holdings'
    ) THEN
        -- Add user_id column if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'holdings' AND column_name = 'user_id'
        ) THEN
            -- Check if there are existing rows
            IF EXISTS (SELECT 1 FROM public.holdings LIMIT 1) THEN
                -- If there are rows, we need to populate user_id from portfolio
                -- First add the column as nullable
                ALTER TABLE public.holdings ADD COLUMN user_id UUID;
                
                -- Update existing rows by joining with portfolios
                UPDATE public.holdings h
                SET user_id = p.user_id
                FROM public.portfolios p
                WHERE h.portfolio_id = p.id
                AND h.user_id IS NULL;
                
                -- Now make it NOT NULL if all rows were updated
                -- But first check if there are any NULL values
                IF NOT EXISTS (SELECT 1 FROM public.holdings WHERE user_id IS NULL) THEN
                    ALTER TABLE public.holdings ALTER COLUMN user_id SET NOT NULL;
                    ALTER TABLE public.holdings ADD CONSTRAINT holdings_user_id_fkey 
                        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
                ELSE
                    RAISE NOTICE '⚠️  Some holdings have NULL user_id - manual fix needed';
                END IF;
            ELSE
                -- No rows, can add as NOT NULL directly
                ALTER TABLE public.holdings ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL;
            END IF;
            
            RAISE NOTICE '✅ Added user_id column to holdings table';
        ELSE
            RAISE NOTICE '✅ user_id column already exists in holdings table';
        END IF;
        
        -- Ensure portfolio_id column exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'holdings' AND column_name = 'portfolio_id'
        ) THEN
            ALTER TABLE public.holdings ADD COLUMN portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE;
            RAISE NOTICE '✅ Added portfolio_id column to holdings table';
        END IF;
    ELSE
        RAISE NOTICE '⚠️  holdings table does not exist';
    END IF;
END $$;

-- 2. Fix transactions table - add user_id if missing
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'transactions'
    ) THEN
        -- Add user_id column if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'user_id'
        ) THEN
            -- Check if there are existing rows
            IF EXISTS (SELECT 1 FROM public.transactions LIMIT 1) THEN
                -- If there are rows, we need to populate user_id from portfolio
                ALTER TABLE public.transactions ADD COLUMN user_id UUID;
                
                -- Update existing rows by joining with portfolios
                UPDATE public.transactions t
                SET user_id = p.user_id
                FROM public.portfolios p
                WHERE t.portfolio_id = p.id
                AND t.user_id IS NULL;
                
                -- Now make it NOT NULL if all rows were updated
                IF NOT EXISTS (SELECT 1 FROM public.transactions WHERE user_id IS NULL) THEN
                    ALTER TABLE public.transactions ALTER COLUMN user_id SET NOT NULL;
                    ALTER TABLE public.transactions ADD CONSTRAINT transactions_user_id_fkey 
                        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
                ELSE
                    RAISE NOTICE '⚠️  Some transactions have NULL user_id - manual fix needed';
                END IF;
            ELSE
                -- No rows, can add as NOT NULL directly
                ALTER TABLE public.transactions ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL;
            END IF;
            
            RAISE NOTICE '✅ Added user_id column to transactions table';
        ELSE
            RAISE NOTICE '✅ user_id column already exists in transactions table';
        END IF;
        
        -- Ensure portfolio_id column exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'portfolio_id'
        ) THEN
            ALTER TABLE public.transactions ADD COLUMN portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE;
            RAISE NOTICE '✅ Added portfolio_id column to transactions table';
        END IF;
    ELSE
        RAISE NOTICE '⚠️  transactions table does not exist';
    END IF;
END $$;

-- 3. Create indexes for user_id columns
DO $$
BEGIN
    -- Holdings user_id index
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'holdings' AND column_name = 'user_id'
    ) THEN
        BEGIN
            EXECUTE 'CREATE INDEX IF NOT EXISTS idx_holdings_user_id ON public.holdings(user_id)';
            RAISE NOTICE '✅ Created index on holdings.user_id';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '⚠️  Could not create index: %', SQLERRM;
        END;
    END IF;
    
    -- Transactions user_id index
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'user_id'
    ) THEN
        BEGIN
            EXECUTE 'CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id)';
            RAISE NOTICE '✅ Created index on transactions.user_id';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '⚠️  Could not create index: %', SQLERRM;
        END;
    END IF;
END $$;

-- 4. Fix achievements duplicate key issue
-- The issue is that the frontend is trying to insert duplicate achievements
-- We need to ensure ON CONFLICT handling or fix the unique constraint
DO $$
BEGIN
    -- Check if the unique constraint exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'achievements_user_id_type_key'
        AND conrelid = 'public.achievements'::regclass
    ) THEN
        RAISE NOTICE '✅ Unique constraint exists: achievements_user_id_type_key';
        RAISE NOTICE 'ℹ️  Frontend should use ON CONFLICT DO NOTHING or check before insert';
    ELSE
        -- Create the unique constraint if it doesn't exist
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'achievements'
        ) THEN
            BEGIN
                ALTER TABLE public.achievements ADD CONSTRAINT achievements_user_id_type_key 
                    UNIQUE (user_id, type);
                RAISE NOTICE '✅ Created unique constraint on achievements(user_id, type)';
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE '⚠️  Could not create constraint: %', SQLERRM;
            END;
        END IF;
    END IF;
END $$;

-- 5. Create a function to safely insert achievements (handles duplicates)
CREATE OR REPLACE FUNCTION insert_achievement_safe(
    p_user_id UUID,
    p_type TEXT,
    p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.achievements (user_id, type, details)
    VALUES (p_user_id, p_type, p_details)
    ON CONFLICT (user_id, type) DO NOTHING
    RETURNING id INTO v_id;
    
    -- If conflict happened, return existing id
    IF v_id IS NULL THEN
        SELECT id INTO v_id
        FROM public.achievements
        WHERE user_id = p_user_id AND type = p_type
        LIMIT 1;
    END IF;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON COLUMN public.holdings.user_id IS 'User who owns this holding (for RLS)';
COMMENT ON COLUMN public.transactions.user_id IS 'User who owns this transaction (for RLS)';
COMMENT ON FUNCTION insert_achievement_safe IS 'Safely insert achievement, ignoring duplicates';

