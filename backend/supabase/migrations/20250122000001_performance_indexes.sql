-- Performance Optimization: Database Indexes
-- This migration adds indexes to improve query performance

-- Portfolio queries
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_user_simulation ON portfolios(user_id, is_simulation);
CREATE INDEX IF NOT EXISTS idx_portfolios_updated_at ON portfolios(updated_at DESC);

-- Holdings queries
CREATE INDEX IF NOT EXISTS idx_holdings_portfolio_id ON holdings(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_holdings_user_id ON holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_holdings_portfolio_user ON holdings(portfolio_id, user_id);
CREATE INDEX IF NOT EXISTS idx_holdings_symbol ON holdings(symbol);
CREATE INDEX IF NOT EXISTS idx_holdings_created_at ON holdings(created_at DESC);

-- Transactions queries
CREATE INDEX IF NOT EXISTS idx_transactions_portfolio_id ON transactions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_portfolio_user ON transactions(portfolio_id, user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_symbol ON transactions(symbol);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);

-- User profiles queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_updated_at ON user_profiles(updated_at DESC);

-- Leaderboard queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_scores_rank ON leaderboard_scores(rank ASC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_scores_score ON leaderboard_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_scores_updated_at ON leaderboard_scores(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_scores_user_id ON leaderboard_scores(user_id);

-- Achievements queries
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_earned_at ON user_achievements(earned_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_earned ON user_achievements(user_id, earned_at DESC);

-- Note: Chat messages indexes are created in migration 20251117000004_fix_chat_messages_schema.sql
-- to ensure the user_id column exists first

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_portfolios_user_sim_updated ON portfolios(user_id, is_simulation, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_holdings_portfolio_symbol ON holdings(portfolio_id, symbol);
CREATE INDEX IF NOT EXISTS idx_transactions_portfolio_date ON transactions(portfolio_id, transaction_date DESC);

-- Analyze tables after index creation
ANALYZE portfolios;
ANALYZE holdings;
ANALYZE transactions;
ANALYZE user_profiles;
ANALYZE leaderboard_scores;
ANALYZE user_achievements;

