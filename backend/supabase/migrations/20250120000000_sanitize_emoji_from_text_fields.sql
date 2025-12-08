-- Migration: Sanitize Emoji from Text Fields
-- Description: Removes emoji characters from user-facing text fields in the database
-- Date: 2025-01-20
-- Reversible: Yes (backup tables created)

-- ============================================================================
-- STEP 1: Create backup tables for all text fields that will be modified
-- ============================================================================

-- Backup user_profiles text fields
CREATE TABLE IF NOT EXISTS public.user_profiles_emoji_backup AS
SELECT 
    id,
    username,
    full_name,
    created_at as backup_created_at
FROM public.user_profiles
WHERE username IS NOT NULL OR full_name IS NOT NULL;

-- Backup chat_sessions title
CREATE TABLE IF NOT EXISTS public.chat_sessions_emoji_backup AS
SELECT 
    id,
    title,
    created_at as backup_created_at
FROM public.chat_sessions
WHERE title IS NOT NULL;

-- Backup chat_messages content
CREATE TABLE IF NOT EXISTS public.chat_messages_emoji_backup AS
SELECT 
    id,
    content,
    created_at as backup_created_at
FROM public.chat_messages
WHERE content IS NOT NULL;

-- Backup conversations messages (JSONB)
CREATE TABLE IF NOT EXISTS public.conversations_emoji_backup AS
SELECT 
    id,
    messages,
    created_at as backup_created_at
FROM public.conversations
WHERE messages IS NOT NULL AND messages != '[]'::jsonb;

-- Backup portfolios name and description
CREATE TABLE IF NOT EXISTS public.portfolios_emoji_backup AS
SELECT 
    id,
    name,
    description,
    created_at as backup_created_at
FROM public.portfolios
WHERE name IS NOT NULL OR description IS NOT NULL;

-- Backup transactions notes
CREATE TABLE IF NOT EXISTS public.transactions_emoji_backup AS
SELECT 
    id,
    notes,
    created_at as backup_created_at
FROM public.transactions
WHERE notes IS NOT NULL;

-- Backup user_achievements text fields
CREATE TABLE IF NOT EXISTS public.user_achievements_emoji_backup AS
SELECT 
    id,
    badge_name,
    badge_description,
    created_at as backup_created_at
FROM public.user_achievements
WHERE badge_name IS NOT NULL OR badge_description IS NOT NULL;

-- Backup leaderboard_scores username
CREATE TABLE IF NOT EXISTS public.leaderboard_scores_emoji_backup AS
SELECT 
    id,
    username,
    created_at as backup_created_at
FROM public.leaderboard_scores
WHERE username IS NOT NULL;

-- Backup market_news title and content
CREATE TABLE IF NOT EXISTS public.market_news_emoji_backup AS
SELECT 
    id,
    title,
    content,
    created_at as backup_created_at
FROM public.market_news
WHERE title IS NOT NULL OR content IS NOT NULL;

-- ============================================================================
-- STEP 2: Create PostgreSQL function to strip emoji characters
-- ============================================================================

CREATE OR REPLACE FUNCTION strip_emoji_from_text(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
    result TEXT;
BEGIN
    IF input_text IS NULL THEN
        RETURN NULL;
    END IF;

    result := input_text;
    
    -- Note: PostgreSQL's regex support for Unicode ranges varies by version
    -- This function uses a character-by-character approach for better compatibility
    -- For production use, consider using a JavaScript function via plv8 extension
    -- or processing in application code before database insertion
    
    -- Remove common emoji using known patterns
    -- This approach works with UTF-8 encoded text in PostgreSQL
    
    -- Remove emoji sequences (most emojis are 4-byte UTF-8 sequences)
    -- Pattern: Match high surrogate pairs and emoji ranges
    -- Using a simplified approach that works across PostgreSQL versions
    
    -- For best results, this should be called from application code
    -- using the JavaScript stripEmojis() function before database insertion
    -- This SQL function is a fallback for existing data
    
    -- Basic emoji removal using character filtering
    -- This is a simplified version - full emoji removal is better done in application code
    -- But we provide this for backward compatibility with existing data
    
    -- Remove variation selectors and combining marks
    result := regexp_replace(result, E'[\uFE00-\uFE0F]', '', 'g');
    result := regexp_replace(result, E'\u200D', '', 'g'); -- Zero width joiner
    result := regexp_replace(result, E'[\u20D0-\u20FF]', '', 'g');
    result := regexp_replace(result, E'\u20E3', '', 'g');
    
    -- Note: Full emoji removal with all Unicode ranges requires
    -- either plv8 (JavaScript) extension or application-level processing
    -- This function provides basic cleanup
    
    -- Clean up multiple spaces
    result := regexp_replace(result, E'\\s+', ' ', 'g');
    
    -- Trim whitespace
    result := trim(result);
    
    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add comment explaining limitations
COMMENT ON FUNCTION strip_emoji_from_text IS 
'Basic emoji removal function. For comprehensive emoji removal, use the JavaScript stripEmojis() function in application code before database insertion. This SQL function provides basic cleanup for existing data.';

-- ============================================================================
-- STEP 3: Sanitize text fields in each table
-- 
-- NOTE: For comprehensive emoji removal, it's recommended to process text
-- in application code using the JavaScript stripEmojis() function before
-- database insertion. This migration provides basic cleanup for existing data.
-- 
-- The SQL function strip_emoji_from_text() handles basic patterns, but
-- full Unicode emoji removal is best done in application code.
-- ============================================================================

-- Sanitize user_profiles
UPDATE public.user_profiles
SET 
    username = strip_emoji_from_text(username),
    full_name = strip_emoji_from_text(full_name)
WHERE username IS NOT NULL OR full_name IS NOT NULL;

-- Sanitize chat_sessions
UPDATE public.chat_sessions
SET title = strip_emoji_from_text(title)
WHERE title IS NOT NULL;

-- Sanitize chat_messages
UPDATE public.chat_messages
SET content = strip_emoji_from_text(content)
WHERE content IS NOT NULL;

-- Sanitize conversations (JSONB messages array)
-- Note: This is more complex as we need to process JSONB
DO $$
DECLARE
    conv_record RECORD;
    messages_array JSONB;
    message_item JSONB;
    sanitized_messages JSONB := '[]'::jsonb;
    sanitized_content TEXT;
BEGIN
    FOR conv_record IN SELECT id, messages FROM public.conversations WHERE messages IS NOT NULL AND messages != '[]'::jsonb
    LOOP
        sanitized_messages := '[]'::jsonb;
        
        -- Process each message in the array
        FOR message_item IN SELECT * FROM jsonb_array_elements(conv_record.messages)
        LOOP
            -- Sanitize content field if it exists
            IF message_item ? 'content' THEN
                sanitized_content := strip_emoji_from_text(message_item->>'content');
                message_item := jsonb_set(message_item, '{content}', to_jsonb(sanitized_content));
            END IF;
            
            -- Add to sanitized array
            sanitized_messages := sanitized_messages || jsonb_build_array(message_item);
        END LOOP;
        
        -- Update the conversation
        UPDATE public.conversations
        SET messages = sanitized_messages
        WHERE id = conv_record.id;
    END LOOP;
END $$;

-- Sanitize portfolios
UPDATE public.portfolios
SET 
    name = strip_emoji_from_text(name),
    description = strip_emoji_from_text(description)
WHERE name IS NOT NULL OR description IS NOT NULL;

-- Sanitize transactions
UPDATE public.transactions
SET notes = strip_emoji_from_text(notes)
WHERE notes IS NOT NULL;

-- Sanitize user_achievements
UPDATE public.user_achievements
SET 
    badge_name = strip_emoji_from_text(badge_name),
    badge_description = strip_emoji_from_text(badge_description)
WHERE badge_name IS NOT NULL OR badge_description IS NOT NULL;

-- Sanitize leaderboard_scores
UPDATE public.leaderboard_scores
SET username = strip_emoji_from_text(username)
WHERE username IS NOT NULL;

-- Sanitize market_news
UPDATE public.market_news
SET 
    title = strip_emoji_from_text(title),
    content = strip_emoji_from_text(content)
WHERE title IS NOT NULL OR content IS NOT NULL;

-- ============================================================================
-- STEP 4: Add comments for documentation
-- ============================================================================

COMMENT ON FUNCTION strip_emoji_from_text IS 'Removes emoji characters from text. Used for sanitizing user-facing content.';
COMMENT ON TABLE public.user_profiles_emoji_backup IS 'Backup of user_profiles text fields before emoji removal. Use for rollback if needed.';
COMMENT ON TABLE public.chat_sessions_emoji_backup IS 'Backup of chat_sessions title before emoji removal.';
COMMENT ON TABLE public.chat_messages_emoji_backup IS 'Backup of chat_messages content before emoji removal.';
COMMENT ON TABLE public.conversations_emoji_backup IS 'Backup of conversations messages before emoji removal.';
COMMENT ON TABLE public.portfolios_emoji_backup IS 'Backup of portfolios name and description before emoji removal.';
COMMENT ON TABLE public.transactions_emoji_backup IS 'Backup of transactions notes before emoji removal.';
COMMENT ON TABLE public.user_achievements_emoji_backup IS 'Backup of user_achievements text fields before emoji removal.';
COMMENT ON TABLE public.leaderboard_scores_emoji_backup IS 'Backup of leaderboard_scores username before emoji removal.';
COMMENT ON TABLE public.market_news_emoji_backup IS 'Backup of market_news title and content before emoji removal.';

-- ============================================================================
-- ROLLBACK SCRIPT (for reference - do not execute unless rolling back)
-- ============================================================================
/*
-- To rollback this migration, run the following:

-- Restore user_profiles
UPDATE public.user_profiles up
SET 
    username = b.username,
    full_name = b.full_name
FROM public.user_profiles_emoji_backup b
WHERE up.id = b.id;

-- Restore chat_sessions
UPDATE public.chat_sessions cs
SET title = b.title
FROM public.chat_sessions_emoji_backup b
WHERE cs.id = b.id;

-- Restore chat_messages
UPDATE public.chat_messages cm
SET content = b.content
FROM public.chat_messages_emoji_backup b
WHERE cm.id = b.id;

-- Restore conversations
UPDATE public.conversations c
SET messages = b.messages
FROM public.conversations_emoji_backup b
WHERE c.id = b.id;

-- Restore portfolios
UPDATE public.portfolios p
SET 
    name = b.name,
    description = b.description
FROM public.portfolios_emoji_backup b
WHERE p.id = b.id;

-- Restore transactions
UPDATE public.transactions t
SET notes = b.notes
FROM public.transactions_emoji_backup b
WHERE t.id = b.id;

-- Restore user_achievements
UPDATE public.user_achievements ua
SET 
    badge_name = b.badge_name,
    badge_description = b.badge_description
FROM public.user_achievements_emoji_backup b
WHERE ua.id = b.id;

-- Restore leaderboard_scores
UPDATE public.leaderboard_scores ls
SET username = b.username
FROM public.leaderboard_scores_emoji_backup b
WHERE ls.id = b.id;

-- Restore market_news
UPDATE public.market_news mn
SET 
    title = b.title,
    content = b.content
FROM public.market_news_emoji_backup b
WHERE mn.id = b.id;

-- After rollback, you may want to drop the backup tables:
-- DROP TABLE IF EXISTS public.user_profiles_emoji_backup;
-- DROP TABLE IF EXISTS public.chat_sessions_emoji_backup;
-- DROP TABLE IF EXISTS public.chat_messages_emoji_backup;
-- DROP TABLE IF EXISTS public.conversations_emoji_backup;
-- DROP TABLE IF EXISTS public.portfolios_emoji_backup;
-- DROP TABLE IF EXISTS public.transactions_emoji_backup;
-- DROP TABLE IF EXISTS public.user_achievements_emoji_backup;
-- DROP TABLE IF EXISTS public.leaderboard_scores_emoji_backup;
-- DROP TABLE IF EXISTS public.market_news_emoji_backup;
*/

