-- Fix RLS Policies for Holdings and Transactions
-- This migration ensures RLS is enabled and SELECT policies exist for authenticated users
-- Idempotent: Safe to run multiple times

-- ============================================================================
-- 1. ENABLE RLS ON TABLES
-- ============================================================================

-- Enable RLS on holdings
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'holdings'
    ) THEN
        ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ RLS enabled on holdings table';
    ELSE
        RAISE NOTICE '⚠️  holdings table does not exist';
    END IF;
END $$;

-- Enable RLS on transactions
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'transactions'
    ) THEN
        ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ RLS enabled on transactions table';
    ELSE
        RAISE NOTICE '⚠️  transactions table does not exist';
    END IF;
END $$;

-- ============================================================================
-- 2. CREATE SELECT POLICIES FOR HOLDINGS
-- ============================================================================

-- Drop existing policy if it exists (to recreate with correct definition)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'holdings' 
        AND policyname = 'Users can view own holdings'
    ) THEN
        DROP POLICY "Users can view own holdings" ON public.holdings;
        RAISE NOTICE '✅ Dropped existing holdings SELECT policy';
    END IF;
END $$;

-- Create SELECT policy for holdings
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'holdings'
    ) THEN
        CREATE POLICY "Users can view own holdings"
        ON public.holdings
        FOR SELECT
        USING (auth.uid() = user_id);
        
        RAISE NOTICE '✅ Created SELECT policy for holdings';
    END IF;
END $$;

-- ============================================================================
-- 3. CREATE SELECT POLICIES FOR TRANSACTIONS
-- ============================================================================

-- Drop existing policy if it exists (to recreate with correct definition)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'transactions' 
        AND policyname = 'Users can view own transactions'
    ) THEN
        DROP POLICY "Users can view own transactions" ON public.transactions;
        RAISE NOTICE '✅ Dropped existing transactions SELECT policy';
    END IF;
END $$;

-- Create SELECT policy for transactions
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'transactions'
    ) THEN
        CREATE POLICY "Users can view own transactions"
        ON public.transactions
        FOR SELECT
        USING (auth.uid() = user_id);
        
        RAISE NOTICE '✅ Created SELECT policy for transactions';
    END IF;
END $$;

-- ============================================================================
-- 4. CREATE INSERT, UPDATE, DELETE POLICIES (for completeness)
-- ============================================================================

-- Holdings INSERT policy
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'holdings' 
        AND policyname = 'Users can insert own holdings'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = 'holdings'
        ) THEN
            CREATE POLICY "Users can insert own holdings"
            ON public.holdings
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);
            
            RAISE NOTICE '✅ Created INSERT policy for holdings';
        END IF;
    END IF;
END $$;

-- Holdings UPDATE policy
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'holdings' 
        AND policyname = 'Users can update own holdings'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = 'holdings'
        ) THEN
            CREATE POLICY "Users can update own holdings"
            ON public.holdings
            FOR UPDATE
            USING (auth.uid() = user_id);
            
            RAISE NOTICE '✅ Created UPDATE policy for holdings';
        END IF;
    END IF;
END $$;

-- Holdings DELETE policy
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'holdings' 
        AND policyname = 'Users can delete own holdings'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = 'holdings'
        ) THEN
            CREATE POLICY "Users can delete own holdings"
            ON public.holdings
            FOR DELETE
            USING (auth.uid() = user_id);
            
            RAISE NOTICE '✅ Created DELETE policy for holdings';
        END IF;
    END IF;
END $$;

-- Transactions INSERT policy
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'transactions' 
        AND policyname = 'Users can insert own transactions'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = 'transactions'
        ) THEN
            CREATE POLICY "Users can insert own transactions"
            ON public.transactions
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);
            
            RAISE NOTICE '✅ Created INSERT policy for transactions';
        END IF;
    END IF;
END $$;

-- Transactions UPDATE policy
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'transactions' 
        AND policyname = 'Users can update own transactions'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = 'transactions'
        ) THEN
            CREATE POLICY "Users can update own transactions"
            ON public.transactions
            FOR UPDATE
            USING (auth.uid() = user_id);
            
            RAISE NOTICE '✅ Created UPDATE policy for transactions';
        END IF;
    END IF;
END $$;

-- Transactions DELETE policy
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'transactions' 
        AND policyname = 'Users can delete own transactions'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = 'transactions'
        ) THEN
            CREATE POLICY "Users can delete own transactions"
            ON public.transactions
            FOR DELETE
            USING (auth.uid() = user_id);
            
            RAISE NOTICE '✅ Created DELETE policy for transactions';
        END IF;
    END IF;
END $$;

-- ============================================================================
-- 5. VERIFICATION SUMMARY
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ RLS Policies Created';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Holdings policies:';
    RAISE NOTICE '  - SELECT: Users can view own holdings';
    RAISE NOTICE '  - INSERT: Users can insert own holdings';
    RAISE NOTICE '  - UPDATE: Users can update own holdings';
    RAISE NOTICE '  - DELETE: Users can delete own holdings';
    RAISE NOTICE '';
    RAISE NOTICE 'Transactions policies:';
    RAISE NOTICE '  - SELECT: Users can view own transactions';
    RAISE NOTICE '  - INSERT: Users can insert own transactions';
    RAISE NOTICE '  - UPDATE: Users can update own transactions';
    RAISE NOTICE '  - DELETE: Users can delete own transactions';
    RAISE NOTICE '';
END $$;

