-- Fix Schema Issues Migration
-- This migration fixes missing columns and creates views for frontend compatibility

-- 1. Ensure portfolios table exists with proper structure
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

-- 2. Add is_simulation column to portfolios table if it doesn't exist
DO $$
BEGIN
    -- Check if table exists first
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'portfolios'
    ) THEN
        -- Check if column exists
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'portfolios' 
            AND column_name = 'is_simulation'
        ) THEN
            ALTER TABLE public.portfolios 
            ADD COLUMN is_simulation BOOLEAN DEFAULT FALSE;
            
            RAISE NOTICE 'Added is_simulation column to portfolios table';
        ELSE
            RAISE NOTICE 'is_simulation column already exists in portfolios table';
        END IF;
        
        -- Ensure is_simulation has default value for existing rows
        UPDATE public.portfolios 
        SET is_simulation = FALSE 
        WHERE is_simulation IS NULL;
    ELSE
        RAISE NOTICE 'portfolios table does not exist, will be created by CREATE TABLE IF NOT EXISTS';
    END IF;
END $$;

-- Create index for is_simulation if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_portfolios_is_simulation 
ON public.portfolios(is_simulation);

-- Create index for user_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id 
ON public.portfolios(user_id);

-- 3. Create achievements table that matches frontend expectations
-- The frontend expects: id, user_id, type, details, earned_at
-- This is a simple table that the frontend can use directly

-- Check if achievements table exists, and handle accordingly
DO $$
BEGIN
    -- If table doesn't exist, create it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'achievements'
    ) THEN
        CREATE TABLE public.achievements (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            type TEXT NOT NULL,
            details JSONB DEFAULT '{}'::jsonb,
            earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            metadata JSONB DEFAULT '{}'::jsonb,
            UNIQUE(user_id, type)
        );
        RAISE NOTICE 'Created achievements table';
    ELSE
        -- Table exists, add missing columns
        RAISE NOTICE 'Achievements table already exists, adding missing columns if needed';
        
        -- Add type column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'achievements' AND column_name = 'type'
        ) THEN
            ALTER TABLE public.achievements ADD COLUMN type TEXT;
            RAISE NOTICE 'Added type column to achievements table';
        END IF;
        
        -- Add details column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'achievements' AND column_name = 'details'
        ) THEN
            ALTER TABLE public.achievements ADD COLUMN details JSONB DEFAULT '{}'::jsonb;
            RAISE NOTICE 'Added details column to achievements table';
        END IF;
        
        -- Add earned_at column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'achievements' AND column_name = 'earned_at'
        ) THEN
            ALTER TABLE public.achievements ADD COLUMN earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Added earned_at column to achievements table';
        END IF;
        
        -- Add metadata column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'achievements' AND column_name = 'metadata'
        ) THEN
            ALTER TABLE public.achievements ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
            RAISE NOTICE 'Added metadata column to achievements table';
        END IF;
        
        -- Note: user_id should already exist if table exists, so we don't add it here
        -- If it doesn't exist, the table structure is too different and needs manual intervention
    END IF;
END $$;

-- Create indexes (only if columns exist) - use dynamic SQL to avoid parse errors
DO $$
BEGIN
    -- Always create user_id index (should always exist)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'achievements' AND column_name = 'user_id'
    ) THEN
        BEGIN
            EXECUTE 'CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON public.achievements(user_id)';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not create user_id index: %', SQLERRM;
        END;
    END IF;
    
    -- Create type index if column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'achievements' AND column_name = 'type'
    ) THEN
        BEGIN
            EXECUTE 'CREATE INDEX IF NOT EXISTS idx_achievements_type ON public.achievements(type)';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not create type index: %', SQLERRM;
        END;
    END IF;
    
    -- Create earned_at index ONLY if column exists
    -- Use dynamic SQL to prevent parse-time errors
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'achievements' AND column_name = 'earned_at'
    ) THEN
        BEGIN
            EXECUTE 'CREATE INDEX IF NOT EXISTS idx_achievements_earned_at ON public.achievements(earned_at DESC)';
            RAISE NOTICE 'Created earned_at index';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not create earned_at index: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'earned_at column does not exist, skipping index creation';
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for achievements
DO $$
BEGIN
    -- Drop existing policies if they exist (to avoid conflicts)
    DROP POLICY IF EXISTS "Users can view own achievements" ON public.achievements;
    DROP POLICY IF EXISTS "Users can view all achievements (leaderboard)" ON public.achievements;
    DROP POLICY IF EXISTS "Users can insert own achievements" ON public.achievements;
    DROP POLICY IF EXISTS "Users can update own achievements" ON public.achievements;
    
    -- Create policies
    CREATE POLICY "Users can view own achievements"
        ON public.achievements
        FOR SELECT
        USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can view all achievements (leaderboard)"
        ON public.achievements
        FOR SELECT
        USING (true);
    
    CREATE POLICY "Users can insert own achievements"
        ON public.achievements
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update own achievements"
        ON public.achievements
        FOR UPDATE
        USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can delete own achievements"
        ON public.achievements
        FOR DELETE
        USING (auth.uid() = user_id);
END $$;

-- 4. Ensure user_achievements table exists (in case the migration wasn't applied)
DO $$
BEGIN
    -- If table doesn't exist, create it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_achievements'
    ) THEN
        CREATE TABLE public.user_achievements (
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
        RAISE NOTICE 'Created user_achievements table';
    ELSE
        -- Table exists, add missing earned_at column if needed
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'user_achievements' AND column_name = 'earned_at'
        ) THEN
            ALTER TABLE public.user_achievements ADD COLUMN earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Added earned_at column to user_achievements table';
        END IF;
    END IF;
END $$;

-- Create indexes if they don't exist (using different names to avoid conflicts)
-- Use dynamic SQL to avoid errors if columns don't exist
DO $$
BEGIN
    -- Create user_id index if column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'user_achievements' AND column_name = 'user_id'
    ) THEN
        BEGIN
            EXECUTE 'CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id)';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not create user_achievements user_id index: %', SQLERRM;
        END;
    END IF;
    
    -- Create earned_at index if column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'user_achievements' AND column_name = 'earned_at'
    ) THEN
        BEGIN
            EXECUTE 'CREATE INDEX IF NOT EXISTS idx_user_achievements_earned_at ON public.user_achievements(earned_at)';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not create user_achievements earned_at index: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'user_achievements.earned_at column does not exist, skipping index creation';
    END IF;
END $$;

-- Enable RLS on user_achievements if not already enabled
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_achievements if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_achievements' 
        AND policyname = 'Users can view own achievements'
    ) THEN
        CREATE POLICY "Users can view own achievements"
            ON public.user_achievements
            FOR SELECT
            USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_achievements' 
        AND policyname = 'Users can view all achievements (leaderboard)'
    ) THEN
        CREATE POLICY "Users can view all achievements (leaderboard)"
            ON public.user_achievements
            FOR SELECT
            USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_achievements' 
        AND policyname = 'Users can insert own achievements'
    ) THEN
        CREATE POLICY "Users can insert own achievements"
            ON public.user_achievements
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- 5. Ensure portfolios table has RLS enabled
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for portfolios if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'portfolios' 
        AND policyname = 'Users can view own portfolios'
    ) THEN
        CREATE POLICY "Users can view own portfolios"
            ON public.portfolios
            FOR SELECT
            USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'portfolios' 
        AND policyname = 'Users can insert own portfolios'
    ) THEN
        CREATE POLICY "Users can insert own portfolios"
            ON public.portfolios
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'portfolios' 
        AND policyname = 'Users can update own portfolios'
    ) THEN
        CREATE POLICY "Users can update own portfolios"
            ON public.portfolios
            FOR UPDATE
            USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'portfolios' 
        AND policyname = 'Users can delete own portfolios'
    ) THEN
        CREATE POLICY "Users can delete own portfolios"
            ON public.portfolios
            FOR DELETE
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- Comments
COMMENT ON TABLE public.achievements IS 'User achievements table with frontend-compatible schema (id, user_id, type, details, earned_at)';
COMMENT ON COLUMN public.portfolios.is_simulation IS 'Indicates if this is a simulation portfolio (true) or real portfolio (false)';
COMMENT ON TABLE public.portfolios IS 'User portfolios (real and simulation)';

