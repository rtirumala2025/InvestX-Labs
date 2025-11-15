# 🚀 InvestIQ Chat - Quick Start Guide

## ⚡ 3-Minute Setup

### Prerequisites
- ✅ Frontend already running on http://localhost:3002
- ⏳ Backend needs to start on http://localhost:5001
- ⏳ OpenRouter API key required

---

## Step 1: Get API Key (2 minutes)

1. Visit https://openrouter.ai/keys
2. Sign up/login with Google or email
3. Click "Create Key"
4. Copy the key (starts with `sk-or-v1-`)
5. Add $5 credits: https://openrouter.ai/credits

---

## Step 2: Configure Backend (30 seconds)

```bash
cd /Users/ritvik/Desktop/InvestX\ Labs/backend

# Copy example file
cp .env.example .env

# Edit .env and paste your API key
nano .env
# OR
open .env  # Opens in default editor
```

Replace this line:
```
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

With your actual key:
```
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
```

Save and close.

---

## Step 3: Install & Start Backend (1 minute)

```bash
# Still in /backend directory
npm install
npm start
```

**Expected output:**
```
Server running on port 5001
```

---

## Step 4: Test Chat (30 seconds)

1. Open browser: http://localhost:3002
2. Click on **Chat** page
3. Type: **"What is compound interest?"**
4. Press Enter

**Expected:**
- Three-dot typing indicator appears
- After 3-5 seconds, educational response displays
- Response is personalized to age 16, beginner level

---

## ✅ Success Indicators

You'll know it's working when:

1. **Backend terminal shows:**
   ```
   Server running on port 5001
   POST /api/chat 200 3245ms
   ```

2. **Browser shows:**
   - No red errors in DevTools console
   - AI response appears in chat
   - Response mentions age-appropriate examples

3. **Response quality:**
   - Uses gaming/tech analogies (based on interests)
   - Mentions parental guidance (for age 16)
   - Explains concepts simply
   - No specific stock recommendations

---

## 🐛 Common Issues

### "AI service unavailable"

**Check 1:** Is backend running?
```bash
curl http://localhost:5001/health
```
Should return: `{"status":"ok"}`

**Check 2:** Is API key valid?
```bash
cd backend
cat .env | grep OPENROUTER_API_KEY
```
Should show your actual key, not placeholder.

**Check 3:** Does frontend know backend URL?
Frontend should auto-use `http://localhost:5001` from `REACT_APP_BACKEND_URL`.

If frontend shows error, add to `/frontend/.env`:
```
REACT_APP_BACKEND_URL=http://localhost:5001
```
Then restart frontend: Stop (Ctrl+C) and `npm start`

---

### Backend won't start

**Error:** "Port 5001 already in use"
```bash
# Find what's using port 5001
lsof -i :5001

# Kill it
kill -9 <PID>

# Try again
npm start
```

**Error:** "Cannot find module"
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
npm start
```

---

### Chat responds but answer is generic

**Issue:** API key may not have credits or model is rate-limited.

**Solution:**
1. Check credits: https://openrouter.ai/credits
2. Add $5 minimum
3. Try again

---

## 📊 Test Commands

### Test backend directly (without UI):
```bash
curl -X POST http://localhost:5001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Explain diversification in simple terms",
    "userProfile": {
      "age": 16,
      "experience_level": "beginner",
      "risk_tolerance": "moderate",
      "budget": 100,
      "portfolio_value": 500,
      "interests": ["gaming", "technology"]
    }
  }'
```

Expected: JSON response with `reply` field containing educational content.

---

## 🎯 What's Connected

```
User Browser (localhost:3002)
    ↓
Frontend React App
    ↓ POST /api/chat
Backend Express Server (localhost:5001)
    ↓ POST with system prompt
OpenRouter API
    ↓ LLaMA 3.1 70B
AI Response
    ↓
Backend processes response
    ↓ JSON { reply, structuredData }
Frontend displays in chat
    ↓
User sees educational answer
```

---

## 💰 Cost Estimate

**LLaMA 3.1 70B Pricing:**
- Input: $0.88 per 1M tokens
- Output: $0.88 per 1M tokens

**Per message:**
- ~750 tokens total
- ~$0.0007 per message
- $5 = ~7,000 messages

---

## 🎉 You're All Set!

Once you see a response in the chat, the integration is complete. The system will:

1. ✅ Send your message with user profile to backend
2. ✅ Backend builds personalized educational prompt
3. ✅ Calls OpenRouter with LLaMA 3.1 70B
4. ✅ Returns age-appropriate educational content
5. ✅ Frontend displays response instantly
6. ✅ No specific financial advice, only education
7. ✅ Mentions parental guidance for under-18 users

---

## 📚 Additional Resources

- **Full validation report:** `INTEGRATION_VALIDATION.md`
- **Detailed status:** `INTEGRATION_STATUS.md`
- **Automated startup:** `./START_CHAT_INTEGRATION.sh`
- **Backend API docs:** `backend/routes/aiRoute.js` (commented)
- **Frontend hook:** `frontend/src/hooks/useInvestIQChat.js`

**Need help?** Check backend terminal logs and browser DevTools console for specific error messages.
