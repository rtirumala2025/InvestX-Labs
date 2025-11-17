-- Fix Additional Schema Issues
-- This migration fixes remaining column and query issues

-- 1. Add missing columns to portfolios table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'portfolios'
    ) THEN
        -- Add description column if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'portfolios' AND column_name = 'description'
        ) THEN
            ALTER TABLE public.portfolios ADD COLUMN description TEXT;
            RAISE NOTICE 'Added description column to portfolios table';
        END IF;
        
        -- Add updated_at column if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'portfolios' AND column_name = 'updated_at'
        ) THEN
            ALTER TABLE public.portfolios ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Added updated_at column to portfolios table';
        END IF;
        
        -- Add virtual_balance column if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'portfolios' AND column_name = 'virtual_balance'
        ) THEN
            ALTER TABLE public.portfolios ADD COLUMN virtual_balance DECIMAL(15, 2) DEFAULT 0;
            RAISE NOTICE 'Added virtual_balance column to portfolios table';
        END IF;
    ELSE
        RAISE NOTICE 'portfolios table does not exist';
    END IF;
END $$;

-- 2. Ensure leaderboard_scores table exists and has username column
DO $$
BEGIN
    -- Create table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'leaderboard_scores'
    ) THEN
        CREATE TABLE public.leaderboard_scores (
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
        RAISE NOTICE 'Created leaderboard_scores table';
    ELSE
        -- Table exists, add username column if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'leaderboard_scores' AND column_name = 'username'
        ) THEN
            ALTER TABLE public.leaderboard_scores ADD COLUMN username TEXT;
            RAISE NOTICE 'Added username column to leaderboard_scores table';
        END IF;
        
        -- Add other columns if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'leaderboard_scores' AND column_name = 'rank'
        ) THEN
            ALTER TABLE public.leaderboard_scores ADD COLUMN rank INTEGER;
            RAISE NOTICE 'Added rank column to leaderboard_scores table';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'leaderboard_scores' AND column_name = 'portfolio_return'
        ) THEN
            ALTER TABLE public.leaderboard_scores ADD COLUMN portfolio_return DECIMAL(10, 2) DEFAULT 0;
            RAISE NOTICE 'Added portfolio_return column to leaderboard_scores table';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'leaderboard_scores' AND column_name = 'achievements_count'
        ) THEN
            ALTER TABLE public.leaderboard_scores ADD COLUMN achievements_count INTEGER DEFAULT 0;
            RAISE NOTICE 'Added achievements_count column to leaderboard_scores table';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'leaderboard_scores' AND column_name = 'trades_count'
        ) THEN
            ALTER TABLE public.leaderboard_scores ADD COLUMN trades_count INTEGER DEFAULT 0;
            RAISE NOTICE 'Added trades_count column to leaderboard_scores table';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'leaderboard_scores' AND column_name = 'learning_progress'
        ) THEN
            ALTER TABLE public.leaderboard_scores ADD COLUMN learning_progress INTEGER DEFAULT 0;
            RAISE NOTICE 'Added learning_progress column to leaderboard_scores table';
        END IF;
        
        -- Add lessons_completed column if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'leaderboard_scores' AND column_name = 'lessons_completed'
        ) THEN
            ALTER TABLE public.leaderboard_scores ADD COLUMN lessons_completed INTEGER DEFAULT 0;
            RAISE NOTICE 'Added lessons_completed column to leaderboard_scores table';
        END IF;
    END IF;
END $$;

-- Create indexes for leaderboard_scores (using dynamic SQL)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'leaderboard_scores'
    ) THEN
        -- Create score index
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'leaderboard_scores' AND column_name = 'score'
        ) THEN
            BEGIN
                EXECUTE 'CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON public.leaderboard_scores(score DESC)';
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Could not create score index: %', SQLERRM;
            END;
        END IF;
        
        -- Create rank index
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'leaderboard_scores' AND column_name = 'rank'
        ) THEN
            BEGIN
                EXECUTE 'CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON public.leaderboard_scores(rank)';
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Could not create rank index: %', SQLERRM;
            END;
        END IF;
    END IF;
END $$;

-- Enable RLS on leaderboard_scores
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'leaderboard_scores'
    ) THEN
        ALTER TABLE public.leaderboard_scores ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policies if they don't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' AND tablename = 'leaderboard_scores' 
            AND policyname = 'Anyone can view leaderboard'
        ) THEN
            CREATE POLICY "Anyone can view leaderboard"
                ON public.leaderboard_scores
                FOR SELECT
                USING (true);
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' AND tablename = 'leaderboard_scores' 
            AND policyname = 'Users can update own score'
        ) THEN
            CREATE POLICY "Users can update own score"
                ON public.leaderboard_scores
                FOR UPDATE
                USING (auth.uid() = user_id);
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' AND tablename = 'leaderboard_scores' 
            AND policyname = 'Users can insert own score'
        ) THEN
            CREATE POLICY "Users can insert own score"
                ON public.leaderboard_scores
                FOR INSERT
                WITH CHECK (auth.uid() = user_id);
        END IF;
    END IF;
END $$;

-- 3. Fix the update_leaderboard_ranks function to use ROW_NUMBER instead of RANK
-- This fixes the "WITHIN GROUP is required for ordered-set aggregate rank" error
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

-- Recreate trigger if it doesn't exist or is broken
DROP TRIGGER IF EXISTS trigger_update_leaderboard_ranks ON public.leaderboard_scores;
CREATE TRIGGER trigger_update_leaderboard_ranks
    AFTER INSERT OR UPDATE ON public.leaderboard_scores
    FOR EACH STATEMENT
    EXECUTE FUNCTION update_leaderboard_ranks();

-- 4. Fix get_leaderboard function to use ROW_NUMBER instead of RANK
-- Drop existing function first if it exists (to avoid return type conflicts)
DROP FUNCTION IF EXISTS get_leaderboard(INTEGER);

CREATE FUNCTION get_leaderboard(p_limit INTEGER DEFAULT 100)
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
        COALESCE(ls.username, u.email) as username,
        ls.score,
        ls.rank,
        ls.portfolio_return,
        ls.achievements_count
    FROM public.leaderboard_scores ls
    LEFT JOIN auth.users u ON ls.user_id = u.id
    ORDER BY ls.rank ASC NULLS LAST, ls.score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON COLUMN public.portfolios.description IS 'Portfolio description';
COMMENT ON COLUMN public.leaderboard_scores.username IS 'User display name for leaderboard';

