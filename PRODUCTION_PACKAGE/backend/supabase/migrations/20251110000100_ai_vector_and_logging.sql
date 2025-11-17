-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS vector;

-- Ensure avatars storage bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, created_at, updated_at)
VALUES ('avatars', 'avatars', TRUE, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif'], NOW(), NOW())
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types,
    updated_at = NOW();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can upload own avatars'
  ) THEN
    CREATE POLICY "Users can upload own avatars"
      ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'avatars'
        AND auth.role() = 'authenticated'
        AND split_part(name, '/', 1) = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can update own avatars'
  ) THEN
    CREATE POLICY "Users can update own avatars"
      ON storage.objects
      FOR UPDATE
      USING (
        bucket_id = 'avatars'
        AND auth.role() = 'authenticated'
        AND split_part(name, '/', 1) = auth.uid()::text
      )
      WITH CHECK (
        bucket_id = 'avatars'
        AND split_part(name, '/', 1) = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can read public avatars'
  ) THEN
    CREATE POLICY "Users can read public avatars"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'avatars');
  END IF;
END;
$$;

-- Knowledge base embeddings table
CREATE TABLE IF NOT EXISTS public.knowledge_base_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  strategy_id TEXT NOT NULL UNIQUE,
  ticker TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  audience JSONB DEFAULT '{}'::JSONB,
  embedding VECTOR(8) NOT NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_base_embeddings_ticker
  ON public.knowledge_base_embeddings (ticker);

CREATE INDEX IF NOT EXISTS idx_knowledge_base_embeddings_tags
  ON public.knowledge_base_embeddings USING GIN (tags);

-- Seed baseline strategies if missing
INSERT INTO public.knowledge_base_embeddings (strategy_id, ticker, title, summary, tags, audience, embedding, metadata)
VALUES
  (
    'growth_compounders_largecap',
    'AAPL',
    'Large-Cap Compounders',
    'Focus on resilient technology companies with recurring revenue and strong cash flows to balance long-term growth with stability.',
    ARRAY['growth','technology','large-cap','recurring-revenue'],
    jsonb_build_object('risk_profile', 'moderate', 'experience', 'intermediate'),
    '[0.78,0.66,0.42,0.58,0.71,0.37,0.49,0.62]'::vector,
    jsonb_build_object(
      'why_it_matters', 'Matches students leaning toward innovative sectors while needing reliable fundamentals.',
      'education_focus', 'Teaches compounding and reinvestment discipline via blue-chip tech leaders.'
    )
  ),
  (
    'dividend_defenders',
    'VIG',
    'Dividend Growth Defenders',
    'Blend dividend aristocrats ETF exposure to reinforce consistent income and lower volatility for cautious learners.',
    ARRAY['dividend','etf','income','stability'],
    jsonb_build_object('risk_profile', 'conservative', 'experience', 'beginner'),
    '[0.41,0.32,0.87,0.44,0.29,0.21,0.65,0.38]'::vector,
    jsonb_build_object(
      'why_it_matters', 'Helps conservative users learn steady compounding through dividend reinvestment.',
      'education_focus', 'Highlights budgeting, passive income, and risk mitigation lessons.'
    )
  ),
  (
    'future_trends_thematic',
    'QQQ',
    'Future Trends Tracker',
    'Harness Nasdaq-100 thematic exposure to teach diversification across innovators with medium-high growth potential.',
    ARRAY['etf','growth','innovation','technology'],
    jsonb_build_object('risk_profile', 'aggressive', 'experience', 'advanced'),
    '[0.82,0.74,0.28,0.63,0.79,0.48,0.36,0.71]'::vector,
    jsonb_build_object(
      'why_it_matters', 'Aligns with students pursuing high-growth themes while emphasizing diversification.',
      'education_focus', 'Explains sector weighting, index methodology, and volatility management.'
    )
  ),
  (
    'balanced_core_satellite',
    'VOO',
    'Core & Satellite Balance',
    'Anchor portfolios with an S&P 500 core allocation, leaving room for satellite picks that express personal interests.',
    ARRAY['etf','balanced','core-satellite','diversification'],
    jsonb_build_object('risk_profile', 'balanced', 'experience', 'intermediate'),
    '[0.55,0.49,0.61,0.72,0.47,0.39,0.58,0.53]'::vector,
    jsonb_build_object(
      'why_it_matters', 'Builds a disciplined framework to combine broad exposure with targeted ideas.',
      'education_focus', 'Shows rebalancing, asset allocation, and goal tracking fundamentals.'
    )
  )
ON CONFLICT (strategy_id) DO UPDATE
SET
  summary = EXCLUDED.summary,
  tags = EXCLUDED.tags,
  audience = EXCLUDED.audience,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Matching function using pgvector similarity
CREATE OR REPLACE FUNCTION public.match_strategies(profile_embedding VECTOR(8), match_count INTEGER DEFAULT 3)
RETURNS TABLE(
  id UUID,
  strategy_id TEXT,
  ticker TEXT,
  title TEXT,
  summary TEXT,
  tags TEXT[],
  similarity DOUBLE PRECISION,
  metadata JSONB
)
LANGUAGE sql
AS $$
  SELECT
    k.id,
    k.strategy_id,
    k.ticker,
    k.title,
    k.summary,
    k.tags,
    1 - (k.embedding <=> profile_embedding) AS similarity,
    k.metadata
  FROM public.knowledge_base_embeddings k
  ORDER BY k.embedding <-> profile_embedding
  LIMIT GREATEST(match_count, 1);
$$;

GRANT EXECUTE ON FUNCTION public.match_strategies(vector, integer) TO anon, authenticated, service_role;

-- AI suggestions log table
CREATE TABLE IF NOT EXISTS public.ai_suggestions_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users (id) ON DELETE CASCADE NOT NULL,
  suggestion_id TEXT NOT NULL,
  strategy_id TEXT NOT NULL,
  confidence NUMERIC(5,2) NOT NULL,
  profile_match NUMERIC(5,2),
  market_signal NUMERIC(5,2),
  news_sentiment NUMERIC(5,2),
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_suggestions_log_user_id
  ON public.ai_suggestions_log (user_id);

CREATE INDEX IF NOT EXISTS idx_ai_suggestions_log_suggestion_id
  ON public.ai_suggestions_log (suggestion_id);

-- Trigger to maintain updated_at
CREATE OR REPLACE FUNCTION public.touch_ai_suggestions_log_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ai_suggestions_log_updated_at ON public.ai_suggestions_log;
CREATE TRIGGER trg_ai_suggestions_log_updated_at
  BEFORE UPDATE ON public.ai_suggestions_log
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_ai_suggestions_log_updated_at();

ALTER TABLE public.ai_suggestions_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'ai_suggestions_log'
      AND policyname = 'Users can view own ai suggestions log'
  ) THEN
    CREATE POLICY "Users can view own ai suggestions log"
      ON public.ai_suggestions_log
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'ai_suggestions_log'
      AND policyname = 'Users can insert own ai suggestions log'
  ) THEN
    CREATE POLICY "Users can insert own ai suggestions log"
      ON public.ai_suggestions_log
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'ai_suggestions_log'
      AND policyname = 'Users can update own ai suggestions log'
  ) THEN
    CREATE POLICY "Users can update own ai suggestions log"
      ON public.ai_suggestions_log
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END;
$$;

-- AI request log table for auditing
CREATE TABLE IF NOT EXISTS public.ai_request_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users (id) ON DELETE CASCADE NOT NULL,
  input_profile JSONB NOT NULL,
  generated_suggestions JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_request_log_user_id
  ON public.ai_request_log (user_id);

ALTER TABLE public.ai_request_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'ai_request_log'
      AND policyname = 'Users can view own ai request log'
  ) THEN
    CREATE POLICY "Users can view own ai request log"
      ON public.ai_request_log
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'ai_request_log'
      AND policyname = 'Users can insert own ai request log'
  ) THEN
    CREATE POLICY "Users can insert own ai request log"
      ON public.ai_request_log
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END;
$$;

GRANT SELECT, INSERT, UPDATE ON public.ai_suggestions_log TO authenticated;
GRANT SELECT, INSERT ON public.ai_request_log TO authenticated;


