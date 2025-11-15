# 🚀 Quick Start Guide - InvestX Labs

## Get Up and Running in 10 Minutes

This guide will help you get InvestX Labs running locally in minutes.

---

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- A Supabase account (free tier works)
- Alpha Vantage API key (free)
- OpenRouter API key (optional for AI chat)

---

## Step 1: Clone and Install (2 minutes)

```bash
# Clone repository
git clone <your-repo-url>
cd investx-labs

# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install

cd ..
```

---

## Step 2: Set Up Supabase (3 minutes)

### Create Supabase Project

1. Go to https://app.supabase.com/
2. Click "New Project"
3. Fill in:
   - Name: `investx-labs`
   - Database Password: (save this!)
   - Region: Choose closest to you
4. Wait 2 minutes for project to initialize

### Get Your Credentials

1. Go to Project Settings → API
2. Copy these values:
   - **Project URL** (looks like: `https://abc123.supabase.co`)
   - **anon public key** (starts with `eyJhbG...`)
   - **service_role secret key** (starts with `eyJhbG...`)

### Run Database Migrations

1. Go to SQL Editor in Supabase dashboard
2. Click "New Query"
3. Copy contents from `backend/supabase/migrations/20250200000000_conversations_and_features.sql`
4. Paste and click "Run"
5. Verify tables created (should see 8 new tables)

---

## Step 3: Configure Environment Variables (2 minutes)

### Frontend Environment

Create `frontend/.env`:

```bash
# Required
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
REACT_APP_BACKEND_URL=http://localhost:5001

# Get free key from https://www.alphavantage.co/support/#api-key
REACT_APP_ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key

# Optional (for AI chat)
REACT_APP_OPENROUTER_API_KEY=your_openrouter_key

# Settings
REACT_APP_ENVIRONMENT=development
```

### Backend Environment

Create `backend/.env`:

```bash
# Server
PORT=5001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Supabase (same as frontend)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_role_key_here

# APIs (same as frontend)
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
OPENROUTER_API_KEY=your_openrouter_key
```

---

## Step 4: Start Development Servers (1 minute)

Open **two terminal windows**:

### Terminal 1: Frontend

```bash
cd frontend
npm start
```

Wait for message: `Compiled successfully!`  
Opens automatically at http://localhost:3000

### Terminal 2: Backend

```bash
cd backend
npm start
```

Wait for message: `Server running on port 5001`

---

## Step 5: Test the Application (2 minutes)

### Quick Test Checklist

1. **Visit** http://localhost:3000
   - ✅ Landing page loads

2. **Sign Up**
   - Click "Get Started"
   - Create account with email/password
   - ✅ Account created

3. **Complete Onboarding**
   - Enter age (13-19)
   - Select interests
   - Complete quiz
   - ✅ Profile created

4. **Try Simulation**
   - Go to `/simulation` route
   - Search for "AAPL"
   - Buy 10 shares
   - ✅ Trade executed
   - ✅ $10,000 - trade cost = new balance

5. **Check Leaderboard**
   - Should see your rank
   - ✅ Leaderboard displays

---

## Common Issues & Solutions

### Issue: "Missing Supabase credentials"

**Solution:** 
- Verify `.env` files exist in both `frontend/` and `backend/`
- Check variable names start with `REACT_APP_` in frontend
- Restart servers after creating `.env` files

### Issue: "Database connection failed"

**Solution:**
- Verify Supabase project is active (green indicator in dashboard)
- Check if migrations ran successfully
- Confirm URL and keys are correct (no typos)

### Issue: "Market data not loading"

**Solution:**
- Verify Alpha Vantage API key is valid
- Free tier limit: 5 calls/minute
- Check browser console for specific errors

### Issue: "Port already in use"

**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 5001
lsof -ti:5001 | xargs kill -9
```

---

## What's Working Now

After setup, you have:

✅ **User authentication** - Sign up, login, logout  
✅ **Profile management** - Onboarding, settings  
✅ **Portfolio tracking** - Real portfolio with live data  
✅ **Simulation mode** - Virtual trading with $10,000  
✅ **CSV upload** - Transaction analysis  
✅ **Leaderboard** - Rankings and scores  
✅ **Achievements** - Badges and progress  
✅ **AI Chat** - Educational chatbot (if OpenRouter key set)  
✅ **Education** - Learning modules and quizzes

---

## Next Steps

### Add More Features

1. **Customize Onboarding**
   - Edit `frontend/src/components/onboarding/Onboarding.js`
   
2. **Add More Badges**
   - Edit `frontend/src/assets/educationalContent.js`
   - Add to `BADGES` array
   
3. **Customize AI Personality**
   - Edit `frontend/src/services/chat/systemPromptBuilder.js`

### Deploy to Production

See `DEPLOYMENT_INSTRUCTIONS.md` for complete deployment guide.

Quick deploy options:
- **Frontend:** Vercel (free, automatic)
- **Backend:** Railway (free tier available)

---

## Learning Resources

### Documentation

- **Feature Guide:** `IMPLEMENTATION_COMPLETE.md`
- **Deployment:** `DEPLOYMENT_INSTRUCTIONS.md`
- **Environment:** `ENV_SETUP_GUIDE_SUPABASE.md`
- **Testing:** `frontend/src/tests/e2e.test.js`

### Code Examples

- **CSV Upload:** `frontend/src/components/portfolio/UploadCSV.jsx`
- **Trading:** `frontend/src/components/simulation/TradingInterface.jsx`
- **Leaderboard:** `frontend/src/components/leaderboard/LeaderboardWidget.jsx`
- **AI Chat:** `frontend/src/services/chat/chatServiceSupabase.js`

---

## Getting Help

### Check These First

1. Browser console (F12) for frontend errors
2. Terminal output for backend errors
3. Supabase dashboard logs
4. `ENV_SETUP_GUIDE_SUPABASE.md` for configuration help

### Still Stuck?

- Review documentation in `/docs/` directory
- Check Supabase status page
- Verify API keys are valid
- Try clearing browser cache

---

## Development Tips

### Hot Reload

Both frontend and backend support hot reload:
- Edit any file
- Save
- Changes appear automatically

### Database Changes

After modifying migrations:
1. Run new migration in Supabase SQL Editor
2. Or use: `npx supabase db push`

### Testing Changes

```bash
# Frontend
cd frontend
npm test

# Backend
cd backend
npm test
```

---

## Project Structure

```
investx-labs/
├── frontend/           # React app
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Route pages
│   │   ├── contexts/    # State management
│   │   ├── services/    # API calls
│   │   └── hooks/       # Custom hooks
│   └── public/
│
├── backend/           # Node.js API
│   ├── routes/        # API endpoints
│   ├── supabase/      # Migrations
│   └── ai-services/   # AI logic
│
└── docs/             # Documentation
```

---

## Performance Tips

### Development

- Use Chrome DevTools for debugging
- Enable React DevTools extension
- Monitor network tab for API calls
- Check Supabase dashboard for query performance

### Optimization

- Implement caching for market data
- Use React.memo for expensive components
- Lazy load routes with React.lazy
- Optimize images

---

## Security Reminders

🔒 **Never commit `.env` files**  
🔒 **Keep service role key secret**  
🔒 **Use HTTPS in production**  
🔒 **Rotate API keys regularly**  
🔒 **Enable MFA on Supabase**

---

## Success! 🎉

You now have InvestX Labs running locally!

**What to try:**
1. Create an account
2. Upload a CSV file
3. Try simulation trading
4. Earn some badges
5. Check the leaderboard
6. Chat with the AI

**Ready to deploy?**  
See `DEPLOYMENT_INSTRUCTIONS.md`

---

**Questions?** Check the documentation or review the code - it's well-commented!

**Happy coding!** 💻🚀

