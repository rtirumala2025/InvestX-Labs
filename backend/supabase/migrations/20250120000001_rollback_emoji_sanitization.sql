-- Rollback Script: Restore Emoji from Backup Tables
-- Description: Restores original text fields from backup tables created during emoji sanitization
-- Date: 2025-01-20
-- WARNING: Only run this if you need to rollback the emoji sanitization migration

-- ============================================================================
-- ROLLBACK: Restore original text fields from backup tables
-- ============================================================================

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

-- Optional: Drop backup tables after successful rollback
-- Uncomment the following lines if you want to remove backup tables:
/*
DROP TABLE IF EXISTS public.user_profiles_emoji_backup;
DROP TABLE IF EXISTS public.chat_sessions_emoji_backup;
DROP TABLE IF EXISTS public.chat_messages_emoji_backup;
DROP TABLE IF EXISTS public.conversations_emoji_backup;
DROP TABLE IF EXISTS public.portfolios_emoji_backup;
DROP TABLE IF EXISTS public.transactions_emoji_backup;
DROP TABLE IF EXISTS public.user_achievements_emoji_backup;
DROP TABLE IF EXISTS public.leaderboard_scores_emoji_backup;
DROP TABLE IF EXISTS public.market_news_emoji_backup;
*/

