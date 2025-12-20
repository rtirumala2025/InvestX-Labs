# InvestX Labs Backend Integration Reference

**Complete technical documentation for integrating new frontend with existing backend**

---

## Table of Contents

1. [API Functions](#api-functions)
2. [Supabase Database Tables](#supabase-database-tables)
3. [Authentication Logic](#authentication-logic)
4. [AI Services](#ai-services)
5. [System Flow Diagram](#system-flow-diagram)
6. [Environment Variables](#environment-variables)

---

## API Functions

### Base URL
- **Development**: `http://localhost:5001`
- **Production**: Configure via `BACKEND_URL` environment variable

### Route Structure
All routes are mounted under `/api`:
- `/api/ai/*` - AI-related endpoints
- `/api/market/*` - Market data endpoints
- `/api/clubs/*` - Investment clubs endpoints
- `/api/education/*` - Education content endpoints
- `/api/mcp/*` - MCP (Model Context Protocol) endpoints
- `/api/health` - Health check

---

### 1. AI Routes (`/api/ai`)

**File**: `backend/routes/aiRoute.js`

| Method | Endpoint | Controller | Purpose | Dependencies |
|--------|----------|-----------|---------|--------------|
| GET | `/api/ai/health` | `healthCheck` | Check AI service status | OpenRouter API key, Alpha Vantage API key |
| POST | `/api/ai/suggestions` | `generateSuggestions` | Generate AI investment suggestions | `userId`, `profile`, `options` | Supabase, OpenRouter |
| PATCH | `/api/ai/suggestions/:logId/confidence` | `updateSuggestionConfidence` | Update suggestion confidence score | `logId`, `confidence`, `userId` | Supabase `ai_suggestions_log` table |
| POST | `/api/ai/suggestions/:logId/interactions` | `recordSuggestionInteraction` | Record user interaction with suggestion | `logId`, `interactionType`, `payload` | Supabase `ai_suggestions_log` table |
| GET | `/api/ai/suggestions/logs/:userId` | `getSuggestionLogs` | Get suggestion history for user | `userId`, `limit` (query param) | Supabase `ai_suggestions_log` table |
| POST | `/api/ai/chat` | `chat` | Chat with AI assistant (InvestIQ) | `message`, `userProfile`, `userId` | OpenRouter API (LLaMA 3.1 70B), Supabase for context |
| GET | `/api/ai/recommendations/:recommendationId/explanation` | `getRecommendationExplanation` | Get explanation for a recommendation | `recommendationId`, `userId` (query) | Supabase RPC `get_recommendation_explanation` |
| POST | `/api/ai/analytics` | `computeAnalytics` | Compute portfolio analytics server-side | `holdings`, `transactions`, `marketData` | None (client-side calculation) |

**Controller File**: `backend/controllers/aiController.js`

**Key Functions**:
- `generateSuggestions()` - Uses `ai-system/suggestionEngine.js`, caches responses (30s TTL)
- `chat()` - Uses OpenRouter API with LLaMA 3.1 70B model, includes user profile context
- `computeAnalytics()` - Calculates portfolio metrics (total value, P&L, ROI, sector allocation)

---

### 2. Market Routes (`/api/market`)

**File**: `backend/routes/market.js`

| Method | Endpoint | Controller | Purpose | Dependencies |
|--------|----------|-----------|---------|--------------|
| GET | `/api/market/quote/:symbol` | `getQuote` | Get real-time stock quote | `symbol` (path param) | Alpha Vantage API, cache (60s TTL) |
| GET | `/api/market/company/:symbol` | `getCompanyOverview` | Get company fundamentals | `symbol` (path param) | Alpha Vantage API, cache (60s TTL) |
| GET | `/api/market/search` | `searchSymbols` | Search for stock symbols | `keywords` (query param) | Mock data (offline fallback) |
| GET | `/api/market/historical/:symbol` | `getHistoricalData` | Get historical price data | `symbol` (path), `interval`, `outputsize` (query) | Alpha Vantage API, cache (60s TTL) |

**Controller File**: `backend/controllers/marketController.js`

**Key Functions**:
- `getQuote()` - Fetches from Alpha Vantage `GLOBAL_QUOTE` endpoint via `dataInsights.getStockQuote()`
- `getCompanyOverview()` - Fetches from Alpha Vantage `OVERVIEW` endpoint via `dataInsights.getCompanyOverview()`
- `getHistoricalData()` - Fetches time series data via `dataInsights.getTimeSeries()`

**Cache**: 60-second TTL for all market data endpoints

---

### 3. Clubs Routes (`/api/clubs`)

**File**: `backend/routes/clubs.js`

| Method | Endpoint | Controller | Purpose | Dependencies |
|--------|----------|-----------|---------|--------------|
| GET | `/api/clubs` | `listClubs` | List all investment clubs | None | Supabase `clubs`, `club_members` tables |
| POST | `/api/clubs` | `createClub` | Create new investment club | `name`, `description`, `focus`, `meetingCadence`, `ownerId` | Supabase `clubs` table |
| GET | `/api/clubs/:clubId` | `getClubById` | Get club details | `clubId` (path param) | Supabase `clubs`, `club_members` tables |
| PUT | `/api/clubs/:clubId` | `updateClub` | Update club information | `clubId`, `name`, `description`, `focus`, `meetingCadence` | Supabase `clubs` table |
| DELETE | `/api/clubs/:clubId` | `deleteClub` | Delete a club | `clubId` (path param) | Supabase `clubs`, `club_members` tables |
| POST | `/api/clubs/:clubId/members` | `addClubMember` | Add member to club | `clubId`, `userId`, `role` | Supabase `club_members`, `club_activity` tables |
| DELETE | `/api/clubs/:clubId/members/:userId` | `removeClubMember` | Remove member from club | `clubId`, `userId` (path params) | Supabase `club_members`, `club_activity` tables |
| GET | `/api/clubs/:clubId/members` | `listClubMembers` | List all club members | `clubId` (path param) | Supabase `club_members` table |
| GET | `/api/clubs/:clubId/activity` | `getClubActivity` | Get club activity feed | `clubId` (path), `limit` (query) | Supabase `club_activity` table |

**Controller File**: `backend/controllers/clubsController.js`

**Fallback**: Uses offline data from `backend/data/offlineClubs.js` when Supabase unavailable

---

### 4. Education Routes (`/api/education`)

**File**: `backend/routes/education.js`

| Method | Endpoint | Controller | Purpose | Dependencies |
|--------|----------|-----------|---------|--------------|
| GET | `/api/education/content` | `getEducationContent` | Get all education content (courses, modules, lessons) | None | Supabase `courses`, `modules`, `lessons`, `quizzes` tables |
| GET | `/api/education/progress/:userId` | `getUserProgress` | Get user's learning progress | `userId` (path param) | Supabase `user_progress` table |
| POST | `/api/education/progress` | `upsertUserProgress` | Update user's lesson completion status | `userId`, `lessonId`, `status` | Supabase `user_progress` table |
| GET | `/api/education/validate` | `validateEducationContent` | Validate education content integrity | None | Supabase `courses`, `modules`, `lessons` tables |

**Controller File**: `backend/controllers/educationController.js`

**Fallback**: Uses offline data from `backend/data/offlineEducation.js` when Supabase unavailable

---

### 5. MCP Routes (`/api/mcp`)

**File**: `backend/routes/mcpRoute.js`

| Method | Endpoint | Controller | Purpose | Dependencies |
|--------|----------|-----------|---------|--------------|
| GET | `/api/mcp/health` | `healthCheck` | Check MCP service status | None |
| GET | `/api/mcp/mcp/context` | `getContext` | Get MCP context (mock data) | None |

**Controller File**: `backend/controllers/mcpController.js`

**Note**: MCP (Model Context Protocol) server is defined in `backend/mcp/mcpServer.js` but routes return mock context data.

---

### 6. Health Check

**Endpoint**: `GET /api/health`

**Response**:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "environment": "development",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "uptime": 12345.67
}
```

---

## Supabase Database Tables

### Core Tables

#### 1. `user_profiles`
**Purpose**: User profile information linked to Supabase Auth

**Schema**:
```sql
id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
username TEXT UNIQUE (min 3 chars)
full_name TEXT
avatar_url TEXT
xp INTEGER DEFAULT 0
net_worth DECIMAL(15, 2) DEFAULT 0
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
```

**RLS Policies**:
- `SELECT`: Users can view their own profile (`auth.uid() = id`)
- `UPDATE`: Users can update their own profile (`auth.uid() = id`)

**Trigger**: `handle_new_user()` - Auto-creates profile on user signup

---

#### 2. `conversations`
**Purpose**: Chat conversation history for AI chatbot

**Schema**:
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
messages JSONB DEFAULT '[]'::jsonb
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
metadata JSONB DEFAULT '{}'::jsonb
```

**RLS Policies**:
- `SELECT`: Users can view own conversations (`auth.uid() = user_id`)
- `INSERT`: Users can insert own conversations (`auth.uid() = user_id`)
- `UPDATE`: Users can update own conversations (`auth.uid() = user_id`)
- `DELETE`: Users can delete own conversations (`auth.uid() = user_id`)

**Indexes**: `idx_conversations_user_id`, `idx_conversations_updated_at`

---

#### 3. `chat_sessions`
**Purpose**: Chat session metadata

**Schema**:
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
title TEXT NOT NULL
model_used TEXT
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
```

**RLS Policies**:
- `SELECT`: Users can view own sessions (`auth.uid() = user_id`)
- `INSERT`: Users can insert own sessions (`auth.uid() = user_id`)
- `UPDATE`: Users can update own sessions (`auth.uid() = user_id`)
- `DELETE`: Users can delete own sessions (`auth.uid() = user_id`)

**Indexes**: `idx_chat_sessions_user_id`

---

#### 4. `chat_messages`
**Purpose**: Individual chat messages within sessions

**Schema**:
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE NOT NULL
role TEXT CHECK (role IN ('user', 'assistant', 'system')) NOT NULL
content TEXT NOT NULL
metadata JSONB
created_at TIMESTAMPTZ DEFAULT NOW()
```

**RLS Policies**:
- `SELECT`: Users can view messages in own sessions (via session check)
- `INSERT`: Users can insert messages in own sessions (via session check)
- `UPDATE`: Users can update own messages
- `DELETE`: Users can delete own messages

**Indexes**: `idx_chat_messages_session_id`

---

#### 5. `portfolios`
**Purpose**: User portfolios (real and simulation)

**Schema**:
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
name TEXT DEFAULT 'My Portfolio'
description TEXT
is_simulation BOOLEAN DEFAULT FALSE
virtual_balance DECIMAL(15, 2) DEFAULT 0
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
metadata JSONB DEFAULT '{}'::jsonb
```

**RLS Policies**:
- `SELECT`: Users can view own portfolios (`auth.uid() = user_id`)
- `INSERT`: Users can insert own portfolios (`auth.uid() = user_id`)
- `UPDATE`: Users can update own portfolios (`auth.uid() = user_id`)
- `DELETE`: Users can delete own portfolios (`auth.uid() = user_id`)

**Indexes**: `idx_portfolios_user_id`, `idx_portfolios_is_simulation`

---

#### 6. `holdings`
**Purpose**: Individual stock/asset holdings in portfolios

**Schema**:
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE NOT NULL
user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
symbol TEXT NOT NULL
company_name TEXT
shares DECIMAL(15, 6) NOT NULL
purchase_price DECIMAL(15, 2) NOT NULL
purchase_date DATE NOT NULL
current_price DECIMAL(15, 2)
sector TEXT
asset_type TEXT DEFAULT 'Stock'
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
metadata JSONB DEFAULT '{}'::jsonb
```

**RLS Policies**:
- `SELECT`: Users can view own holdings (`auth.uid() = user_id`)
- `INSERT`: Users can insert own holdings (`auth.uid() = user_id`)
- `UPDATE`: Users can update own holdings (`auth.uid() = user_id`)
- `DELETE`: Users can delete own holdings (`auth.uid() = user_id`)

**Indexes**: `idx_holdings_portfolio_id`, `idx_holdings_user_id`, `idx_holdings_symbol`

---

#### 7. `transactions`
**Purpose**: Trading transactions for simulation mode

**Schema**:
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE NOT NULL
transaction_type TEXT CHECK (transaction_type IN ('buy', 'sell', 'deposit', 'withdrawal')) NOT NULL
symbol TEXT
shares DECIMAL(15, 6)
price DECIMAL(15, 2)
total_amount DECIMAL(15, 2) NOT NULL
fees DECIMAL(15, 2) DEFAULT 0
transaction_date TIMESTAMPTZ DEFAULT NOW()
notes TEXT
metadata JSONB DEFAULT '{}'::jsonb
```

**RLS Policies**:
- `SELECT`: Users can view own transactions (`auth.uid() = user_id`)
- `INSERT`: Users can insert own transactions (`auth.uid() = user_id`)

**Indexes**: `idx_transactions_user_id`, `idx_transactions_portfolio_id`, `idx_transactions_date`

---

#### 8. `user_achievements`
**Purpose**: User earned achievements/badges

**Schema**:
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
badge_id TEXT NOT NULL
badge_name TEXT NOT NULL
badge_description TEXT
badge_icon TEXT
earned_at TIMESTAMPTZ DEFAULT NOW()
metadata JSONB DEFAULT '{}'::jsonb
UNIQUE(user_id, badge_id)
```

**RLS Policies**:
- `SELECT`: Users can view own achievements (`auth.uid() = user_id`)
- `SELECT`: Public read access for leaderboard (`true`)

**Indexes**: `idx_achievements_user_id`, `idx_achievements_earned_at`

---

#### 9. `leaderboard_scores`
**Purpose**: Leaderboard rankings and scores

**Schema**:
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
username TEXT
score INTEGER DEFAULT 0
rank INTEGER
portfolio_return DECIMAL(10, 2) DEFAULT 0
achievements_count INTEGER DEFAULT 0
trades_count INTEGER DEFAULT 0
learning_progress INTEGER DEFAULT 0
updated_at TIMESTAMPTZ DEFAULT NOW()
UNIQUE(user_id)
```

**RLS Policies**:
- `SELECT`: Public read access (`true`)
- `UPDATE`: Users can update own score (`auth.uid() = user_id`)
- `INSERT`: Users can insert own score (`auth.uid() = user_id`)

**Indexes**: `idx_leaderboard_score`, `idx_leaderboard_rank`

**Trigger**: `update_leaderboard_ranks()` - Auto-updates ranks on score changes

---

#### 10. `spending_analysis`
**Purpose**: Analyzed spending patterns from uploaded CSV

**Schema**:
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
month_year TEXT NOT NULL
total_income DECIMAL(15, 2) DEFAULT 0
total_expenses DECIMAL(15, 2) DEFAULT 0
savings_rate DECIMAL(5, 2) DEFAULT 0
discretionary_spending DECIMAL(15, 2) DEFAULT 0
investment_capacity DECIMAL(15, 2) DEFAULT 0
categories JSONB DEFAULT '{}'::jsonb
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
UNIQUE(user_id, month_year)
```

**RLS Policies**:
- `SELECT`: Users can view own spending analysis (`auth.uid() = user_id`)
- `INSERT`: Users can insert own spending analysis (`auth.uid() = user_id`)
- `UPDATE`: Users can update own spending analysis (`auth.uid() = user_id`)

**Indexes**: `idx_spending_user_id`, `idx_spending_month_year`

---

#### 11. `analytics_events`
**Purpose**: User analytics and event tracking

**Schema**:
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
event_type TEXT NOT NULL
event_data JSONB
user_agent TEXT
page_url TEXT
created_at TIMESTAMPTZ DEFAULT NOW()
```

**RLS Policies**:
- `SELECT`: Users can view own events (`auth.uid() = user_id`)
- `INSERT`: Service role can insert events (`auth.role() = 'service_role'`)

**Indexes**: `idx_analytics_events_user_id`, `idx_analytics_events_event_type`, `idx_analytics_events_created_at`

---

#### 12. `market_news`
**Purpose**: Market news articles

**Schema**:
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
title TEXT NOT NULL
content TEXT
source TEXT
url TEXT
published_at TIMESTAMPTZ DEFAULT NOW()
symbols TEXT[]
sentiment_score NUMERIC(5,2)
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
```

**RLS Policies**:
- `SELECT`: Public read access (`true`)

**Indexes**: `idx_market_news_published_at`, `idx_market_news_symbols` (GIN)

---

#### 13. `courses`, `modules`, `lessons`, `quizzes`
**Purpose**: Education content hierarchy

**Schema** (simplified):
- `courses`: Course-level content
- `modules`: Modules within courses (has `course_id`)
- `lessons`: Lessons within modules (has `module_id`)
- `quizzes`: Quizzes linked to lessons (has `lesson_id`)

**RLS Policies**: Public read access for education content

---

#### 14. `user_progress`
**Purpose**: User's learning progress tracking

**Schema**:
```sql
user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
lesson_id UUID REFERENCES lessons(id)
status TEXT DEFAULT 'completed'
completed_at TIMESTAMPTZ
updated_at TIMESTAMPTZ DEFAULT NOW()
UNIQUE(user_id, lesson_id)
```

**RLS Policies**: Users can view/update own progress

---

#### 15. `clubs`, `club_members`, `club_activity`
**Purpose**: Investment clubs feature

**Schema** (simplified):
- `clubs`: Club information (`owner_id`, `name`, `description`, `focus`, `meeting_cadence`)
- `club_members`: Club membership (`club_id`, `user_id`, `role`, `joined_at`)
- `club_activity`: Activity feed (`club_id`, `user_id`, `activity_type`, `activity_data`)

**RLS Policies**: Users can view/manage clubs they own or are members of

---

#### 16. `ai_suggestions_log`
**Purpose**: Log of AI-generated suggestions

**Schema** (referenced in code, exact schema in migrations):
- Tracks AI suggestions, confidence scores, user interactions

---

#### 17. `market_data_cache`, `market_history`
**Purpose**: Cached market data and historical prices

**Schema** (simplified):
- `market_data_cache`: Cached quotes with expiration
- `market_history`: Historical price data

**RLS Policies**: Public read access

---

### Supabase RPC Functions

**Location**: Defined in `backend/supabase/migrations/`

| Function Name | Parameters | Returns | Purpose |
|---------------|------------|---------|---------|
| `get_quote` | `symbol TEXT` | `JSONB` | Get stock quote (may use cache) |
| `get_user_context` | `user_id TEXT` | `JSONB` | Get user context for AI |
| `get_ai_recommendations` | `user_id TEXT`, `user_profile JSONB` | `JSONB` | Get AI-generated recommendations |
| `get_recommendations` | `user_id TEXT`, `recommendation_type TEXT`, `context_id TEXT`, `max_results INTEGER` | `JSONB` | Get MCP recommendations |
| `get_market_news` | `limit_count INTEGER`, `symbol_filter TEXT` | `JSONB` | Get market news articles |
| `get_ai_health` | None | `JSONB` | Check AI service health |
| `get_user_profile` | `p_user_id UUID` | `JSONB` | Get user profile |
| `update_user_profile` | `p_user_id UUID`, `p_username TEXT`, `p_full_name TEXT`, `p_avatar_url TEXT` | `JSONB` | Update user profile |
| `get_user_preferences` | `p_user_id UUID` | `JSONB` | Get user preferences |
| `update_user_preferences` | `p_user_id UUID`, `p_preferences JSONB` | `JSONB` | Update user preferences |
| `handle_new_user` | Trigger function | None | Auto-create profile on signup |
| `calculate_portfolio_metrics` | `p_user_id UUID`, `p_portfolio_id UUID` | `JSONB` | Calculate portfolio P&L, returns |
| `award_achievement` | `p_user_id UUID`, `p_badge_id TEXT`, `p_badge_name TEXT`, `p_badge_description TEXT`, `p_badge_icon TEXT` | `JSONB` | Award achievement and update leaderboard |
| `get_leaderboard` | `p_limit INTEGER` | `TABLE` | Get leaderboard rankings |
| `update_leaderboard_ranks` | Trigger function | None | Auto-update ranks on score changes |
| `get_recommendation_explanation` | `recommendation_id TEXT`, `user_id TEXT` | `JSONB` | Get explanation for recommendation |
| `get_batch_market_data` | `symbols TEXT[]` | `JSONB` | Get batch market data |
| `get_historical_data` | `symbol TEXT`, `interval TEXT`, `outputsize TEXT` | `JSONB` | Get historical price data |
| `get_cached_quote` | `p_symbol TEXT` | `JSONB` | Get cached quote if available |
| `cache_market_data` | `p_symbol TEXT`, `p_data JSONB`, `p_expires_at TIMESTAMPTZ` | None | Cache market data |
| `clear_expired_cache` | None | None | Clean up expired cache entries |

---

## Authentication Logic

### Authentication Provider
**Service**: Supabase Auth

**Client Configuration**:
- **File**: `frontend/src/services/supabase/config.js` or `frontend/src/lib/supabaseClient.js`
- **URL**: `https://oysuothaldgentevxzod.supabase.co` (or from env: `REACT_APP_SUPABASE_URL`)
- **Anon Key**: From env: `REACT_APP_SUPABASE_ANON_KEY`
- **Settings**:
  - `autoRefreshToken: true`
  - `persistSession: true`
  - `detectSessionInUrl: true`

### Authentication Methods

#### 1. Email/Password Sign Up
**Function**: `signUpUser(email, password, userData)`
**File**: `frontend/src/services/supabase/auth.js`

**Flow**:
1. Call `supabase.auth.signUp({ email, password, options: { data: { full_name, username } } })`
2. Supabase sends email verification link
3. `handle_new_user()` trigger creates `user_profiles` record
4. User metadata stored in `auth.users.raw_user_meta_data`

**Response**: `{ user, session }`

---

#### 2. Email/Password Sign In
**Function**: `signInUser(email, password)`
**File**: `frontend/src/services/supabase/auth.js`

**Flow**:
1. Call `supabase.auth.signInWithPassword({ email, password })`
2. Supabase validates credentials
3. Returns session with JWT token
4. Session stored in browser (localStorage/sessionStorage)
5. Frontend fetches `user_profiles` record

**Response**: `{ user, session }`

---

#### 3. Google OAuth
**Function**: `signInWithGoogle()`
**File**: `frontend/src/services/supabase/auth.js`

**Flow**:
1. Call `supabase.auth.signInWithOAuth({ provider: 'google' })`
2. Redirects to Google OAuth consent screen
3. User authorizes
4. Google redirects back with code
5. Supabase exchanges code for session
6. `handle_new_user()` trigger creates profile

**Configuration Required**:
- Google OAuth Client ID in Supabase dashboard
- Redirect URL configured in Google Console

---

#### 4. Sign Out
**Function**: `signOut()`
**File**: `frontend/src/services/supabase/auth.js`

**Flow**:
1. Call `supabase.auth.signOut()`
2. Clears session from browser
3. Clears cached profile data

---

### Session Management

**Session Storage**:
- Supabase handles JWT token storage
- Frontend stores enriched profile in `sessionStorage` (via `AuthContext`)
- Session timeout: 30 minutes of inactivity (configurable)

**Session Refresh**:
- Automatic via `autoRefreshToken: true`
- Supabase SDK handles refresh token rotation

**Auth State Listener**:
- `onAuthStateChange()` listener in `AuthContext`
- Updates `currentUser` state on auth changes
- Fetches profile from `user_profiles` table

---

### Profile Management

**Profile Creation**:
- Automatic via `handle_new_user()` trigger on signup
- Extracts `username` and `full_name` from `auth.users.raw_user_meta_data`

**Profile Updates**:
- Direct Supabase client updates to `user_profiles` table
- RLS ensures users can only update own profile

**Profile Enrichment**:
- `enrichProfile()` function adds email from `auth.users`
- Combines `user_profiles` data with `auth.users` data

---

## AI Services

### 1. OpenRouter API (Primary AI Service)

**Service**: OpenRouter.ai
**Base URL**: `https://openrouter.ai/api/v1/chat/completions`
**API Key**: `OPENROUTER_API_KEY` environment variable

**Models Used**:
- **Chat**: `meta-llama/llama-3.1-70b-instruct` (via `aiController.chat()`)
- **Suggestions**: `meta-llama/llama-3-70b-instruct` (via `aiEngine`)
- **Legacy Chat**: `meta-llama/llama-3.1-8b-instruct:free` (via Firebase Functions)

**Integration Points**:
- **File**: `backend/controllers/aiController.js`
- **File**: `backend/ai-system/aiEngine.js`
- **File**: `backend/functions/chat/chatService.js`

**Request Format**:
```json
{
  "model": "meta-llama/llama-3.1-70b-instruct",
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "temperature": 0.7,
  "max_tokens": 1000
}
```

**Headers**:
- `Authorization: Bearer ${OPENROUTER_API_KEY}`
- `HTTP-Referer: ${APP_URL}`
- `X-Title: InvestX Labs`

**Caching**:
- Chat responses: 30-second TTL (in-memory)
- Suggestions: 30-second TTL (in-memory)

**Fallback**: Educational fallback responses when API unavailable

---

### 2. Alpha Vantage API (Market Data)

**Service**: Alpha Vantage
**Base URL**: `https://www.alphavantage.co/query`
**API Key**: `ALPHA_VANTAGE_API_KEY` environment variable

**Endpoints Used**:
- `GLOBAL_QUOTE` - Real-time stock quotes
- `OVERVIEW` - Company fundamentals
- `TIME_SERIES_DAILY` - Historical price data

**Integration Points**:
- **File**: `backend/controllers/marketController.js`
- **File**: `backend/ai-system/dataInsights.js`
- **File**: `backend/market/marketService.js`

**Rate Limiting**:
- 5 API calls per minute (free tier)
- 500 API calls per day (free tier)
- Rate limiter in `backend/utils/alphaVantageRateLimiter.js`

**Caching**:
- 60-second TTL for quotes and company data
- Supabase `market_data_cache` table for persistent cache

**Fallback**: Mock data when API unavailable

---

### 3. AI System Components

**File Structure**:
- `backend/ai-system/aiEngine.js` - Core AI engine (OpenRouter wrapper)
- `backend/ai-system/suggestionEngine.js` - Investment suggestion generation
- `backend/ai-system/dataInsights.js` - Market data integration
- `backend/ai-system/newsService.js` - News fetching and summarization
- `backend/ai-system/fallbackData.js` - Offline fallback strategies
- `backend/ai-system/ruleBase.js` - Rule-based recommendation logic

**Suggestion Engine Flow**:
1. Fetch user context (portfolio, preferences, history)
2. Build user embedding (if vector search enabled)
3. Generate system prompt with user context
4. Call OpenRouter API with LLaMA model
5. Parse and structure response
6. Log to `ai_suggestions_log` table
7. Return suggestions with confidence scores

**Chat Service Flow**:
1. Sanitize user message
2. Check cache (30s TTL)
3. Fetch enhanced user context (portfolio, learning progress)
4. Build system prompt with user profile
5. Call OpenRouter API
6. Cache response
7. Return reply with structured data

---

### 4. MCP (Model Context Protocol) Server

**File**: `backend/mcp/mcpServer.js`

**Purpose**: Protocol for AI model context management

**Adapters**:
- `OpenRouterAdapter` - AI model access
- `AlphaVantageAdapter` - Market data access
- `SupabaseAdapter` - Database access

**Context Manager**:
- Manages user context for AI interactions
- File: `backend/mcp/contextManager.js`

**Note**: Currently returns mock context data in routes

---

## System Flow Diagram

### High-Level Request Flow

```
User Action (Frontend)
    ↓
Frontend API Call
    ↓
Backend Express Server (port 5001)
    ├── Rate Limiting (100 req/15min)
    ├── CORS Check
    ├── Request Parsing
    └── Route Handler
        ↓
Controller Function
    ├── Input Validation
    ├── Cache Check (if applicable)
    ├── External API Call (if needed)
    │   ├── OpenRouter API (AI)
    │   ├── Alpha Vantage API (Market Data)
    │   └── Supabase RPC (Database)
    ├── Database Operation (Supabase)
    │   ├── Direct Table Access
    │   ├── RPC Function Call
    │   └── Real-time Subscription
    └── Response Formatting
        ↓
Response to Frontend
    ├── Success Response
    ├── Error Response (with fallback)
    └── Cached Response (if applicable)
```

---

### Authentication Flow

```
User Sign Up/Sign In
    ↓
Supabase Auth
    ├── Email/Password
    ├── Google OAuth
    └── Session Creation
        ↓
JWT Token Generated
    ↓
Session Stored (Browser)
    ↓
Auth State Change Listener
    ↓
Fetch User Profile (user_profiles table)
    ↓
Enrich Profile (add email from auth.users)
    ↓
Store in Context (React)
    ↓
User Authenticated
```

---

### AI Chat Flow

```
User Sends Message
    ↓
POST /api/ai/chat
    ├── Validate message
    ├── Check cache (30s TTL)
    └── Fetch user context
        ├── Portfolio data (holdings, transactions)
        ├── Learning progress (achievements, badges)
        └── Trading history
    ↓
Build System Prompt
    ├── User profile (age, experience, risk tolerance)
    ├── Portfolio context
    └── Educational guidelines
    ↓
Call OpenRouter API
    ├── Model: LLaMA 3.1 70B
    ├── System + User messages
    └── Temperature: 0.7, Max Tokens: 1000
    ↓
Parse Response
    ↓
Cache Response (30s TTL)
    ↓
Return to Frontend
    ├── reply: string
    └── structuredData: { model, tokens }
```

---

### Market Data Flow

```
User Requests Quote
    ↓
GET /api/market/quote/:symbol
    ├── Validate symbol
    ├── Check cache (60s TTL)
    └── Check Supabase cache table
    ↓
Call Alpha Vantage API
    ├── Endpoint: GLOBAL_QUOTE
    ├── Rate limit check (5/min)
    └── Parse response
    ↓
Cache Response
    ├── In-memory (60s TTL)
    └── Supabase cache table (optional)
    ↓
Return to Frontend
    ├── symbol, price, change, changePercent
    ├── open, high, low, volume
    └── latestTradingDay, previousClose
```

---

### Portfolio Operations Flow

```
User Creates Transaction
    ↓
Frontend → Supabase Direct
    ├── Insert into transactions table
    └── Update holdings table
        ↓
RLS Policy Check
    ├── Verify auth.uid() = user_id
    └── Allow/Deny
    ↓
Database Operation
    ├── Transaction recorded
    ├── Holdings updated
    └── Portfolio metrics recalculated (via RPC)
    ↓
Real-time Subscription
    ├── Frontend subscribed to changes
    └── UI updates automatically
    ↓
Leaderboard Update (if applicable)
    ├── award_achievement() RPC
    └── update_leaderboard_ranks() trigger
```

---

## Environment Variables

### Backend Environment Variables

**File**: `backend/.env`

```bash
# Server
PORT=5001
NODE_ENV=development

# Supabase
SUPABASE_URL=https://oysuothaldgentevxzod.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_KEY=<service-role-key>

# AI Services
OPENROUTER_API_KEY=<openrouter-api-key>

# Market Data
ALPHA_VANTAGE_API_KEY=<alpha-vantage-api-key>

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3002

# App URL (for OpenRouter headers)
APP_URL=http://localhost:3000
```

### Frontend Environment Variables

**File**: `frontend/.env`

```bash
# Supabase
REACT_APP_SUPABASE_URL=https://oysuothaldgentevxzod.supabase.co
REACT_APP_SUPABASE_ANON_KEY=<anon-key>

# Backend API
REACT_APP_BACKEND_URL=http://localhost:5001

# AI Services (optional, if frontend calls directly)
REACT_APP_LLAMA_API_KEY=<openrouter-api-key>
REACT_APP_LLAMA_API_URL=https://openrouter.ai/api/v1/chat/completions
```

---

## Middleware & Services

### Backend Middleware

**File**: `backend/middleware/requestTracker.js`

**Functions**:
- `requestTracker()` - Tracks requests, adds request ID
- `errorLogger()` - Logs errors with context
- `metricsMiddleware()` - Collects performance metrics

**Rate Limiting**:
- 100 requests per 15 minutes per IP
- Applied to `/api/*` routes

**Security**:
- Helmet.js for security headers
- CORS whitelist (development: all origins allowed)
- Request size limit: 10kb

---

### Utilities

**File**: `backend/utils/logger.js`
- Winston-based logging
- Logs to console and files (`backend/logs/`)

**File**: `backend/utils/cache.js`
- In-memory cache utilities
- TTL-based expiration

**File**: `backend/utils/alphaVantageRateLimiter.js`
- Rate limiting for Alpha Vantage API
- Prevents exceeding free tier limits

---

## Firebase Functions (Legacy)

**File**: `backend/functions/index.js`

**Note**: These are Firebase Cloud Functions, separate from Express server

**Endpoints**:
- `chat` - Chat endpoint (POST)
- `marketData` - Market data (GET)
- `marketNews` - Market news (GET)
- `healthCheck` - Health check (GET)

**Cloud Functions**:
- `generatePersonalizedSuggestions` - AI suggestions
- `generateRiskAssessment` - Risk profile generation
- `generateExplanation` - Concept explanations
- `calculatePortfolioMetrics` - Portfolio calculations
- `updateStockPrices` - Scheduled stock price updates
- `fetchMarketData` - Batch market data fetching

**Firestore Triggers**:
- `onUserCreated` - Initialize user data
- `onPortfolioUpdated` - Update performance tracking
- `onSuggestionCreated` - Send notifications

---

## Key Integration Points

### 1. Frontend → Backend API
- Use `REACT_APP_BACKEND_URL` for API calls
- All routes under `/api/*`
- Include auth token in headers if needed (Supabase handles this)

### 2. Frontend → Supabase Direct
- Use Supabase client for direct database access
- RLS policies enforce security
- Real-time subscriptions for live updates

### 3. Backend → External APIs
- OpenRouter for AI (via `OPENROUTER_API_KEY`)
- Alpha Vantage for market data (via `ALPHA_VANTAGE_API_KEY`)
- Rate limiting and caching implemented

### 4. Backend → Supabase
- Service role key for admin operations
- Anon key for user-scoped operations
- RPC functions for complex queries

---

## Error Handling

### API Error Format

**Success Response**:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "timestamp": "2025-01-15T10:30:00Z",
  "requestId": "req_123456789"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": { ... }
  },
  "timestamp": "2025-01-15T10:30:00Z",
  "requestId": "req_123456789"
}
```

### Fallback Behavior

- **AI Services**: Returns educational fallback when API unavailable
- **Market Data**: Returns cached data or mock data when API unavailable
- **Database**: Returns offline data files when Supabase unavailable

---

## Testing & Verification

### Health Checks

1. **Backend**: `GET /api/health`
2. **AI Service**: `GET /api/ai/health`
3. **MCP Service**: `GET /api/mcp/health`
4. **Supabase RPC**: `SELECT get_ai_health()`

### Test Scripts

- `backend/scripts/test_supabase_connection.js` - Test Supabase connectivity
- `backend/scripts/test_supabase_comprehensive.js` - Full Supabase test suite
- `backend/scripts/checkSupabaseRPCs.js` - Verify RPC functions exist

---

## Notes

1. **Alpha Vantage Environment Variable**: There's a known issue where `env.validation.js` requires `ALPHA_VANTAGE_API_KEY`, but some controllers may use `ALPHA_VANTAGE_KEY` or `ALPHAVANTAGE_API_KEY`. Standardize on `ALPHA_VANTAGE_API_KEY`.

2. **Authentication**: The frontend uses Supabase Auth directly. The backend Express server does not handle authentication - it relies on Supabase RLS policies for security.

3. **Real-time**: Supabase real-time subscriptions are handled client-side. The backend does not manage WebSocket connections.

4. **Caching**: Multiple caching layers:
   - In-memory cache (30-60s TTL)
   - Supabase `market_data_cache` table
   - Browser cache (handled by frontend)

5. **Legacy Code**: Some Firebase Functions exist but may not be actively used. The Express server is the primary backend.

---

## Quick Reference

### Most Common API Calls

```javascript
// Get stock quote
GET /api/market/quote/AAPL

// Chat with AI
POST /api/ai/chat
Body: { message: "...", userProfile: {...}, userId: "..." }

// Get AI suggestions
POST /api/ai/suggestions
Body: { userId: "...", profile: {...}, options: {...} }

// Get education content
GET /api/education/content

// Get user progress
GET /api/education/progress/:userId

// List clubs
GET /api/clubs

// Get portfolio metrics (via Supabase RPC)
supabase.rpc('calculate_portfolio_metrics', { 
  p_user_id: userId, 
  p_portfolio_id: portfolioId 
})
```

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-15  
**Maintained By**: Backend Integration Team

