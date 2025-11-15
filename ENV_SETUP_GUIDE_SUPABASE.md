# 🔧 Environment Setup Guide - Supabase Only

## Overview

InvestX Labs now uses **Supabase as the single backend**. Firebase has been completely removed.

## Required Environment Variables

### Frontend (.env in `/frontend` directory)

Create a `.env` file in the `frontend` directory with:

```bash
# Supabase (PRIMARY DATABASE)
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Backend API
REACT_APP_BACKEND_URL=http://localhost:5001

# Market Data
REACT_APP_ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key_here

# AI Services
REACT_APP_OPENROUTER_API_KEY=your_openrouter_api_key_here

# App Settings
REACT_APP_APP_NAME=InvestX Labs
REACT_APP_ENVIRONMENT=development
```

### Backend (.env in `/backend` directory)

Create a `.env` file in the `backend` directory with:

```bash
# Server
PORT=5001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Supabase
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_KEY=your_supabase_service_role_key_here

# APIs
OPENROUTER_API_KEY=your_openrouter_api_key_here
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key_here
```

## Getting Your API Keys

### 1. Supabase (Required)

1. Go to https://app.supabase.com/
2. Create a new project or select existing
3. Go to Project Settings → API
4. Copy:
   - Project URL → `SUPABASE_URL`
   - `anon` `public` key → `SUPABASE_ANON_KEY`
   - `service_role` `secret` key → `SUPABASE_SERVICE_KEY` (backend only)

### 2. Alpha Vantage (Required for market data)

1. Go to https://www.alphavantage.co/support/#api-key
2. Sign up for a free API key
3. Copy the key → `ALPHA_VANTAGE_API_KEY`

### 3. OpenRouter (Required for AI chat)

1. Go to https://openrouter.ai/keys
2. Create an account and generate an API key
3. Copy the key → `OPENROUTER_API_KEY`

## Database Setup

### Run Supabase Migrations

```bash
# Navigate to backend directory
cd backend

# Run migrations
npx supabase db push
```

Or manually execute the SQL files in `backend/supabase/migrations/` through the Supabase dashboard.

### Enable Row Level Security

All tables have RLS enabled by default in the migrations. Users can only access their own data.

## Verification Checklist

- [ ] Supabase project created
- [ ] Environment variables set in both frontend and backend
- [ ] Migrations run successfully
- [ ] Can sign up/login (tests Supabase auth)
- [ ] Can view portfolio (tests database connection)
- [ ] Market data loads (tests Alpha Vantage)
- [ ] AI chat works (tests OpenRouter)

## Important Notes

### ⚠️ Firebase Removal

Firebase has been **completely removed**. Do NOT add:
- `REACT_APP_FIREBASE_*` variables
- `firebase-admin` or `firebase` packages
- Any Firebase imports

### 🔒 Security

- Never commit `.env` files to git
- Keep your `SUPABASE_SERVICE_KEY` secret (backend only)
- Rotate keys regularly
- Use environment-specific keys (dev vs prod)

### 📝 Development vs Production

For production, use environment variables in your hosting platform:
- **Vercel**: Project Settings → Environment Variables
- **Netlify**: Site Settings → Build & deploy → Environment
- **Railway/Render**: Dashboard → Environment Variables

## Troubleshooting

### "Missing Supabase credentials"

Make sure `.env` files exist in both `frontend/` and `backend/` directories.

### "Database connection failed"

1. Check Supabase project is active
2. Verify URLs and keys are correct
3. Check if tables exist (run migrations)

### "Market data not loading"

1. Verify Alpha Vantage API key is valid
2. Check if you've exceeded rate limits (5 API calls/minute on free tier)
3. Consider using cached data for development

## Quick Start

```bash
# 1. Clone and install
git clone <repo>
cd investx-labs
npm install

# 2. Set up environment variables
# Create .env files as shown above

# 3. Run migrations
cd backend
npx supabase db push

# 4. Start development servers
# Terminal 1 - Frontend
cd frontend
npm start

# Terminal 2 - Backend
cd backend
npm start
```

Your app should now be running at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5001

## Need Help?

Check the documentation in `/docs/setup/` or create an issue in the repository.

