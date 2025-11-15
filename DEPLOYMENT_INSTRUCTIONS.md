# 🚀 Deployment Instructions - InvestX Labs

## Pre-Deployment Checklist

Before deploying to production, ensure you have completed:

- [ ] All environment variables configured
- [ ] Supabase project created and migrations run
- [ ] Alpha Vantage API key obtained
- [ ] OpenRouter API key obtained
- [ ] Frontend builds without errors
- [ ] Backend starts without errors
- [ ] All routes accessible
- [ ] Database RLS policies tested

---

## Environment Setup

### 1. Supabase Production Setup

1. **Create Production Project**
   ```bash
   # Go to https://app.supabase.com/
   # Create new project
   # Note the URL and keys
   ```

2. **Run Migrations**
   ```bash
   # Option A: Using Supabase CLI
   cd backend
   npx supabase db push --project-ref your-project-ref
   
   # Option B: Manual
   # Copy SQL from backend/supabase/migrations/*.sql
   # Execute in Supabase dashboard SQL Editor
   ```

3. **Verify Tables**
   ```sql
   -- Run in Supabase SQL Editor
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   
   -- Should see: profiles, conversations, portfolios, 
   -- holdings, transactions, user_achievements, 
   -- leaderboard_scores, spending_analysis
   ```

4. **Test RLS Policies**
   ```sql
   -- Test as authenticated user
   SELECT * FROM portfolios;  -- Should only see own portfolios
   SELECT * FROM leaderboard_scores;  -- Should see all scores
   ```

---

## Frontend Deployment

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Configure Environment**
   ```bash
   cd frontend
   vercel
   ```

3. **Set Environment Variables**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add all REACT_APP_* variables from `.env`
   - Set for Production, Preview, and Development

4. **Deploy**
   ```bash
   vercel --prod
   ```

5. **Environment Variables to Set:**
   ```
   REACT_APP_SUPABASE_URL=https://your-project.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your_anon_key
   REACT_APP_BACKEND_URL=https://your-backend.railway.app
   REACT_APP_ALPHA_VANTAGE_API_KEY=your_key
   REACT_APP_OPENROUTER_API_KEY=your_key
   REACT_APP_ENVIRONMENT=production
   ```

### Option 2: Netlify

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Build Project**
   ```bash
   cd frontend
   npm run build
   ```

3. **Deploy**
   ```bash
   netlify deploy --prod --dir=build
   ```

4. **Set Environment Variables**
   - Go to Netlify Dashboard → Site settings → Build & deploy → Environment
   - Add all REACT_APP_* variables

### Option 3: Manual Static Hosting

1. **Build**
   ```bash
   cd frontend
   npm run build
   ```

2. **Upload `build/` folder to:**
   - AWS S3 + CloudFront
   - Google Cloud Storage
   - Azure Static Web Apps
   - Any static host

---

## Backend Deployment

### Option 1: Railway (Recommended)

1. **Create Railway Account**
   - Go to https://railway.app/
   - Connect GitHub repository

2. **Create New Project**
   - Select your repository
   - Choose `backend` directory as root

3. **Set Environment Variables**
   ```
   PORT=5001
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend.vercel.app
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_KEY=your_service_key
   OPENROUTER_API_KEY=your_key
   ALPHA_VANTAGE_API_KEY=your_key
   ```

4. **Deploy**
   - Railway auto-deploys on push
   - Get deployment URL

5. **Update Frontend**
   - Update `REACT_APP_BACKEND_URL` in Vercel to Railway URL

### Option 2: Render

1. **Create Render Account**
   - Go to https://render.com/

2. **New Web Service**
   - Connect repository
   - Root directory: `backend`
   - Build command: `npm install`
   - Start command: `npm start`

3. **Add Environment Variables**
   - Same as Railway above

### Option 3: Heroku

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **Create App**
   ```bash
   cd backend
   heroku create investx-labs-backend
   ```

3. **Set Config Vars**
   ```bash
   heroku config:set SUPABASE_URL=...
   heroku config:set SUPABASE_ANON_KEY=...
   # ... etc for all variables
   ```

4. **Deploy**
   ```bash
   git subtree push --prefix backend heroku main
   ```

---

## Post-Deployment

### 1. Verify Deployment

**Frontend Checks:**
```bash
# Test frontend
curl https://your-frontend.vercel.app/

# Should return HTML
# Check browser console for errors
```

**Backend Checks:**
```bash
# Test backend
curl https://your-backend.railway.app/health

# Should return: {"status":"ok"}
```

### 2. Test Critical Flows

- [ ] User signup
- [ ] User login
- [ ] Portfolio creation
- [ ] Simulation mode
- [ ] CSV upload
- [ ] AI chat
- [ ] Leaderboard

### 3. Monitor Errors

**Frontend:**
- Check browser console
- Vercel/Netlify logs
- Set up error tracking (Sentry)

**Backend:**
- Check Railway/Render logs
- Monitor API response times
- Check Supabase database logs

### 4. Configure CORS

Update backend CORS settings:

```javascript
// backend/index.js
app.use(cors({
  origin: [
    'http://localhost:3000', // Development
    'https://your-frontend.vercel.app', // Production
    'https://your-custom-domain.com' // Custom domain
  ],
  credentials: true
}));
```

---

## Custom Domain Setup

### Frontend (Vercel)

1. Go to Vercel Dashboard → Project → Settings → Domains
2. Add your custom domain (e.g., investxlabs.com)
3. Update DNS records:
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

### Backend (Railway)

1. Go to Railway Dashboard → Project → Settings → Domains
2. Add custom domain (e.g., api.investxlabs.com)
3. Update DNS:
   ```
   Type: CNAME
   Name: api
   Value: your-app.railway.app
   ```

---

## SSL/HTTPS

All recommended platforms (Vercel, Netlify, Railway, Render) provide automatic SSL certificates. Ensure:

1. HTTPS is enforced
2. Update `REACT_APP_BACKEND_URL` to use `https://`
3. Update Supabase allowed origins to include production URLs

---

## Environment Variables Reference

### Frontend (Required)

| Variable | Description | Example |
|----------|-------------|---------|
| REACT_APP_SUPABASE_URL | Supabase project URL | https://abc.supabase.co |
| REACT_APP_SUPABASE_ANON_KEY | Supabase anon key | eyJhbGciOi... |
| REACT_APP_BACKEND_URL | Backend API URL | https://api.example.com |
| REACT_APP_ALPHA_VANTAGE_API_KEY | Market data key | ABC123XYZ |
| REACT_APP_OPENROUTER_API_KEY | AI API key | sk-or-v1-abc... |

### Backend (Required)

| Variable | Description | Example |
|----------|-------------|---------|
| PORT | Server port | 5001 |
| NODE_ENV | Environment | production |
| FRONTEND_URL | Frontend URL | https://app.example.com |
| SUPABASE_URL | Supabase URL | https://abc.supabase.co |
| SUPABASE_ANON_KEY | Supabase anon key | eyJhbGciOi... |
| SUPABASE_SERVICE_KEY | Supabase service key | eyJhbGciOi... |
| OPENROUTER_API_KEY | AI API key | sk-or-v1-abc... |
| ALPHA_VANTAGE_API_KEY | Market data key | ABC123XYZ |

---

## Monitoring & Maintenance

### 1. Error Tracking

**Option A: Sentry**
```bash
npm install @sentry/react @sentry/node

# Add to frontend/src/index.js
import * as Sentry from "@sentry/react";
Sentry.init({ dsn: "your-sentry-dsn" });
```

**Option B: LogRocket**
```bash
npm install logrocket

# Add to frontend
import LogRocket from 'logrocket';
LogRocket.init('your-app-id');
```

### 2. Analytics

**Option A: Google Analytics**
```javascript
// Add to frontend
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
```

**Option B: Plausible (Privacy-friendly)**
```javascript
<script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>
```

### 3. Performance Monitoring

- Vercel Analytics (built-in)
- Lighthouse CI
- Web Vitals tracking

### 4. Database Backups

Supabase provides automatic backups. To manual backup:

```bash
# Using Supabase CLI
npx supabase db dump -f backup.sql

# Or export from dashboard
```

### 5. API Rate Limits

Monitor Alpha Vantage usage:
- Free tier: 5 calls/minute, 500 calls/day
- Consider caching strategy
- Upgrade if needed

---

## Scaling Considerations

### When to Scale

- Users > 1,000
- API requests > 10,000/day
- Database connections > 50 concurrent

### Scaling Options

1. **Frontend:**
   - Vercel auto-scales
   - Add CDN for static assets
   - Enable edge caching

2. **Backend:**
   - Horizontal scaling (add more instances)
   - Load balancer
   - Redis for caching

3. **Database:**
   - Supabase Pro plan
   - Read replicas
   - Connection pooling

---

## Rollback Procedure

If deployment fails:

1. **Frontend:**
   ```bash
   # Vercel
   vercel rollback
   
   # Netlify
   netlify deploy --prod --dir=build-backup
   ```

2. **Backend:**
   ```bash
   # Railway/Render - use dashboard to rollback to previous deploy
   
   # Heroku
   heroku rollback
   ```

3. **Database:**
   ```bash
   # Restore from backup
   psql -h db.xyz.supabase.co -U postgres -d postgres -f backup.sql
   ```

---

## Security Hardening

1. **Environment Variables**
   - Never commit `.env` files
   - Rotate keys regularly
   - Use separate keys for dev/prod

2. **Supabase**
   - Enable RLS on all tables
   - Use service key only in backend
   - Regular security audits

3. **API Keys**
   - Restrict API key origins
   - Monitor usage
   - Set up rate limiting

4. **CORS**
   - Whitelist specific domains
   - No wildcard (*) in production

---

## Support & Troubleshooting

### Common Issues

1. **"Cannot connect to backend"**
   - Check backend URL in frontend env
   - Verify backend is running
   - Check CORS settings

2. **"Database connection failed"**
   - Verify Supabase credentials
   - Check if migrations ran
   - Test connection in Supabase dashboard

3. **"Market data not loading"**
   - Check Alpha Vantage API key
   - Verify rate limits not exceeded
   - Check API key restrictions

### Getting Help

1. Check logs (Vercel, Railway, Supabase)
2. Review browser console
3. Test API endpoints directly
4. Check Supabase database queries

---

## Success Checklist

- [ ] Frontend deployed and accessible
- [ ] Backend deployed and health check passes
- [ ] Database migrations complete
- [ ] All environment variables set
- [ ] Custom domains configured (if applicable)
- [ ] SSL/HTTPS working
- [ ] CORS configured correctly
- [ ] User signup/login working
- [ ] Portfolio features working
- [ ] Simulation mode working
- [ ] CSV upload working
- [ ] AI chat working
- [ ] Leaderboard displaying
- [ ] Error tracking setup
- [ ] Backups configured
- [ ] Documentation updated

---

**Deployment Complete! 🎉**

Your InvestX Labs application should now be live and accessible to users.

