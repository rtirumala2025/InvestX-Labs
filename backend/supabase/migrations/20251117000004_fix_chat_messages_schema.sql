-- Fix chat_messages schema and RLS policies
-- This migration adds user_id column, updates RLS policies, and adds table to realtime publication

-- STEP 1: Verify chat_messages table exists and add user_id column if missing
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'chat_messages'
    ) THEN
        -- Add user_id column if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'chat_messages' 
            AND column_name = 'user_id'
        ) THEN
            -- Add user_id column
            ALTER TABLE public.chat_messages 
            ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
            
            -- Populate user_id from chat_sessions for existing rows
            UPDATE public.chat_messages cm
            SET user_id = cs.user_id
            FROM public.chat_sessions cs
            WHERE cm.session_id = cs.id
            AND cm.user_id IS NULL;
            
            -- Make user_id NOT NULL after populating
            ALTER TABLE public.chat_messages 
            ALTER COLUMN user_id SET NOT NULL;
            
            -- Create index for better query performance
            CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id 
            ON public.chat_messages(user_id);
            
            RAISE NOTICE '✅ Added user_id column to chat_messages table';
        ELSE
            RAISE NOTICE '✅ user_id column already exists in chat_messages table';
        END IF;
        
        -- Ensure updated_at column exists (for consistency)
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'chat_messages' 
            AND column_name = 'updated_at'
        ) THEN
            ALTER TABLE public.chat_messages 
            ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            
            RAISE NOTICE '✅ Added updated_at column to chat_messages table';
        ELSE
            RAISE NOTICE '✅ updated_at column already exists in chat_messages table';
        END IF;
    ELSE
        RAISE NOTICE '⚠️  chat_messages table does not exist';
    END IF;
END $$;

-- STEP 2: Ensure RLS is enabled
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'chat_messages'
    ) THEN
        ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ RLS enabled on chat_messages table';
    END IF;
END $$;

-- STEP 3: Drop old RLS policies (if they exist) and create new ones
DO $$
BEGIN
    -- Drop old policies that use session_id relationship
    DROP POLICY IF EXISTS "Users can view messages in their own sessions" ON public.chat_messages;
    DROP POLICY IF EXISTS "Users can insert messages in their own sessions" ON public.chat_messages;
    DROP POLICY IF EXISTS "Users can update messages in their own sessions" ON public.chat_messages;
    DROP POLICY IF EXISTS "Users can delete messages in their own sessions" ON public.chat_messages;
    
    RAISE NOTICE '✅ Dropped old RLS policies';
END $$;

-- Create new RLS policies using user_id directly
CREATE POLICY IF NOT EXISTS "Users can view own messages"
ON public.chat_messages FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own messages"
ON public.chat_messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own messages"
ON public.chat_messages FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete own messages"
ON public.chat_messages FOR DELETE
USING (auth.uid() = user_id);

-- STEP 4: Add chat_messages to supabase_realtime publication
DO $$
BEGIN
    -- Check if publication exists
    IF EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        -- Check if table is already in publication
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND tablename = 'chat_messages'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
            RAISE NOTICE '✅ Added chat_messages to supabase_realtime publication';
        ELSE
            RAISE NOTICE '✅ chat_messages already in supabase_realtime publication';
        END IF;
    ELSE
        RAISE NOTICE '⚠️  supabase_realtime publication does not exist';
    END IF;
END $$;

-- STEP 5: Create trigger function and trigger for updated_at (outside DO block)
CREATE OR REPLACE FUNCTION update_chat_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_chat_messages_updated_at ON public.chat_messages;
CREATE TRIGGER trigger_update_chat_messages_updated_at
BEFORE UPDATE ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION update_chat_messages_updated_at();

-- STEP 6: Ensure indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);

DO $$
BEGIN
    RAISE NOTICE '✅ Chat messages schema fix complete';
END $$;

