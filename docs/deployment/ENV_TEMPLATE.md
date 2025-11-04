# 🔐 Environment Variables Template

## Backend Environment Variables

Create `backend/.env` with these variables:

```bash
# ============================================================================
# Supabase Configuration (REQUIRED)
# ============================================================================
# Get these from: https://app.supabase.com/project/_/settings/api

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================================================
# Alpha Vantage Configuration (REQUIRED for Phase 3)
# ============================================================================
# Get your free API key from: https://www.alphavantage.co/support/#api-key
# Free tier: 5 API calls per minute, 500 calls per day

ALPHA_VANTAGE_API_KEY=YOUR_ALPHA_VANTAGE_API_KEY

# ============================================================================
# OpenRouter Configuration (Optional - for AI features)
# ============================================================================
# Get your API key from: https://openrouter.ai/keys

OPENROUTER_API_KEY=sk-or-v1-...

# ============================================================================
# Server Configuration
# ============================================================================

PORT=3001
NODE_ENV=development
MCP_PORT=3002
```

---

## Frontend Environment Variables

Create `frontend/.env` with these variables:

```bash
# ============================================================================
# Supabase Configuration (REQUIRED)
# ============================================================================

REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================================================
# Application Configuration
# ============================================================================

REACT_APP_ENV=development
PORT=3002
```

---

## Supabase Edge Function Secrets

Set these secrets for the Edge Function:

```bash
supabase secrets set ALPHA_VANTAGE_API_KEY=YOUR_KEY --project-ref your-project-ref
supabase secrets set SUPABASE_URL=https://your-project.supabase.co --project-ref your-project-ref
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-key --project-ref your-project-ref
```

---

## How to Get API Keys

### 1. Supabase Keys

1. Go to https://app.supabase.com
2. Select your project
3. Go to Settings → API
4. Copy:
   - Project URL → `SUPABASE_URL`
   - `anon` `public` key → `SUPABASE_ANON_KEY`
   - `service_role` `secret` key → `SUPABASE_SERVICE_KEY`

### 2. Alpha Vantage API Key

1. Go to https://www.alphavantage.co/support/#api-key
2. Enter your email
3. Click "GET FREE API KEY"
4. Copy your API key → `ALPHA_VANTAGE_API_KEY`

**Free Tier Limits**:
- 5 API calls per minute
- 500 API calls per day

### 3. OpenRouter API Key (Optional)

1. Go to https://openrouter.ai/keys
2. Sign up or log in
3. Create a new API key
4. Copy your key → `OPENROUTER_API_KEY`

---

## Validation

Run this to validate your environment variables:

```bash
cd backend
node config/env.validation.js
```

Expected output:
```
🔍 Validating environment variables...

✅ SUPABASE_URL: https://...
✅ SUPABASE_ANON_KEY: eyJhbGciOi...
✅ SUPABASE_SERVICE_KEY: eyJhbGciOi...
✅ ALPHA_VANTAGE_API_KEY: YOUR_ALPHA...
⚠️  OPENROUTER_API_KEY: Not set (optional)
✅ PORT: Using default value (3001)
✅ NODE_ENV: Using default value (development)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Environment validation PASSED
```

---

## Security Best Practices

### ✅ DO:
- Keep `.env` files in `.gitignore`
- Use different keys for dev/prod
- Rotate keys regularly
- Use environment-specific keys
- Store production keys securely

### ❌ DON'T:
- Commit `.env` files to git
- Share API keys publicly
- Use production keys in development
- Hard-code API keys in source code
- Expose keys in client-side code

---

## Troubleshooting

### "Missing required environment variable"

**Solution**: Check that all REQUIRED variables are set in your `.env` file

### "Invalid API key"

**Solution**: 
1. Verify key is correct (no extra spaces)
2. Check key hasn't expired
3. Verify key has proper permissions

### "Rate limit exceeded"

**Solution**:
1. Wait for rate limit to reset
2. Upgrade to premium plan
3. Implement better caching

---

## Quick Setup Script

```bash
# Backend
cd backend
cp ENV_TEMPLATE.md .env
# Edit .env with your actual keys
node config/env.validation.js

# Frontend
cd ../frontend
echo "REACT_APP_SUPABASE_URL=https://your-project.supabase.co" > .env
echo "REACT_APP_SUPABASE_ANON_KEY=your-anon-key" >> .env
echo "PORT=3002" >> .env
```

---

**Last Updated**: January 25, 2025  
**Version**: 1.0.0
