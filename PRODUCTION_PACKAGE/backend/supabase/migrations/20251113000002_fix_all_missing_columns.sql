-- Fix All Missing Columns - Comprehensive Check
-- This migration ensures ALL required columns exist in portfolios and leaderboard_scores

-- 1. Ensure portfolios table has ALL required columns
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'portfolios'
    ) THEN
        -- Check and add each column if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'portfolios' AND column_name = 'id'
        ) THEN
            -- Table structure is corrupted, skip
            RAISE NOTICE 'portfolios table exists but missing id column - table structure may be corrupted';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'portfolios' AND column_name = 'name'
        ) THEN
            ALTER TABLE public.portfolios ADD COLUMN name TEXT DEFAULT 'My Portfolio';
            RAISE NOTICE 'Added name column to portfolios';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'portfolios' AND column_name = 'description'
        ) THEN
            ALTER TABLE public.portfolios ADD COLUMN description TEXT;
            RAISE NOTICE 'Added description column to portfolios';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'portfolios' AND column_name = 'is_simulation'
        ) THEN
            ALTER TABLE public.portfolios ADD COLUMN is_simulation BOOLEAN DEFAULT FALSE;
            RAISE NOTICE 'Added is_simulation column to portfolios';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'portfolios' AND column_name = 'virtual_balance'
        ) THEN
            ALTER TABLE public.portfolios ADD COLUMN virtual_balance DECIMAL(15, 2) DEFAULT 0;
            RAISE NOTICE 'Added virtual_balance column to portfolios';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'portfolios' AND column_name = 'created_at'
        ) THEN
            ALTER TABLE public.portfolios ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Added created_at column to portfolios';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'portfolios' AND column_name = 'updated_at'
        ) THEN
            ALTER TABLE public.portfolios ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Added updated_at column to portfolios';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'portfolios' AND column_name = 'metadata'
        ) THEN
            ALTER TABLE public.portfolios ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
            RAISE NOTICE 'Added metadata column to portfolios';
        END IF;
        
        -- Update NULL values with defaults
        UPDATE public.portfolios SET is_simulation = FALSE WHERE is_simulation IS NULL;
        UPDATE public.portfolios SET virtual_balance = 0 WHERE virtual_balance IS NULL;
        UPDATE public.portfolios SET name = 'My Portfolio' WHERE name IS NULL;
        
    ELSE
        RAISE NOTICE 'portfolios table does not exist';
    END IF;
END $$;

-- 2. Ensure leaderboard_scores table has ALL required columns
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'leaderboard_scores'
    ) THEN
        -- Check and add each column if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'leaderboard_scores' AND column_name = 'username'
        ) THEN
            ALTER TABLE public.leaderboard_scores ADD COLUMN username TEXT;
            RAISE NOTICE 'Added username column to leaderboard_scores';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'leaderboard_scores' AND column_name = 'lessons_completed'
        ) THEN
            ALTER TABLE public.leaderboard_scores ADD COLUMN lessons_completed INTEGER DEFAULT 0;
            RAISE NOTICE 'Added lessons_completed column to leaderboard_scores';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'leaderboard_scores' AND column_name = 'rank'
        ) THEN
            ALTER TABLE public.leaderboard_scores ADD COLUMN rank INTEGER;
            RAISE NOTICE 'Added rank column to leaderboard_scores';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'leaderboard_scores' AND column_name = 'portfolio_return'
        ) THEN
            ALTER TABLE public.leaderboard_scores ADD COLUMN portfolio_return DECIMAL(10, 2) DEFAULT 0;
            RAISE NOTICE 'Added portfolio_return column to leaderboard_scores';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'leaderboard_scores' AND column_name = 'achievements_count'
        ) THEN
            ALTER TABLE public.leaderboard_scores ADD COLUMN achievements_count INTEGER DEFAULT 0;
            RAISE NOTICE 'Added achievements_count column to leaderboard_scores';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'leaderboard_scores' AND column_name = 'trades_count'
        ) THEN
            ALTER TABLE public.leaderboard_scores ADD COLUMN trades_count INTEGER DEFAULT 0;
            RAISE NOTICE 'Added trades_count column to leaderboard_scores';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'leaderboard_scores' AND column_name = 'learning_progress'
        ) THEN
            ALTER TABLE public.leaderboard_scores ADD COLUMN learning_progress INTEGER DEFAULT 0;
            RAISE NOTICE 'Added learning_progress column to leaderboard_scores';
        END IF;
        
    ELSE
        RAISE NOTICE 'leaderboard_scores table does not exist';
    END IF;
END $$;

-- Verify columns exist (for debugging)
DO $$
DECLARE
    portfolio_cols TEXT;
    leaderboard_cols TEXT;
BEGIN
    SELECT string_agg(column_name, ', ' ORDER BY column_name)
    INTO portfolio_cols
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'portfolios';
    
    RAISE NOTICE 'portfolios columns: %', COALESCE(portfolio_cols, 'none');
    
    SELECT string_agg(column_name, ', ' ORDER BY column_name)
    INTO leaderboard_cols
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leaderboard_scores';
    
    RAISE NOTICE 'leaderboard_scores columns: %', COALESCE(leaderboard_cols, 'none');
END $$;

