# Environment Setup Guide

## Quick Start

### 1. Create `.env` File

```bash
# Copy the template
cp config/env.example .env
```

### 2. Add Supabase Credentials (REQUIRED)

Open `.env` and add these lines at the top:

```bash
# Supabase Configuration (REQUIRED)
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Backend Supabase (for Node.js services)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_KEY=your_supabase_service_role_key_here
```

### 3. Get Your Supabase Keys

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy:
   - `URL` → Use for `SUPABASE_URL`
   - `anon public` → Use for `SUPABASE_ANON_KEY`
   - `service_role` → Use for `SUPABASE_SERVICE_KEY` (keep secret!)

### 4. Verify Setup

```bash
# Check that variables are set
grep SUPABASE .env

# Start the app
cd frontend
npm start
```

## Complete Environment Variables

See `config/env.example` for all available options including:
- Firebase configuration
- OpenAI API keys
- Market data API keys (Alpha Vantage, Yahoo Finance)
- Feature flags
- Analytics and monitoring

## Security Notes

⚠️ **Never commit `.env` to version control!**

- ✅ `.env` is in `.gitignore`
- ✅ Use `.env.example` for templates
- ✅ Keep service keys secret
- ⚠️ Rotate keys if accidentally exposed

