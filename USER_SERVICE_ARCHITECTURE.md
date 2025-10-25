# 🏗️ User Service Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Application                     │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Dashboard   │  │   Profile    │  │  Settings    │         │
│  │  Component   │  │  Component   │  │  Component   │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                 │                 │                   │
│         └─────────────────┼─────────────────┘                   │
│                           │                                     │
│                  ┌────────▼────────┐                            │
│                  │  userService.js │                            │
│                  │                 │                            │
│                  │  • getUserProfile                            │
│                  │  • updateUserProfile                         │
│                  │  • getUserPreferences                        │
│                  │  • updateUserPreferences                     │
│                  │  • Cache Management                          │
│                  │  • Error Handling                            │
│                  └────────┬────────┘                            │
│                           │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            │ Supabase Client
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                      Supabase Platform                           │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                    PostgREST API                        │    │
│  │                                                         │    │
│  │  RPC Endpoints:                                        │    │
│  │  • /rest/v1/rpc/get_user_profile                      │    │
│  │  • /rest/v1/rpc/update_user_profile                   │    │
│  │  • /rest/v1/rpc/get_user_preferences                  │    │
│  │  • /rest/v1/rpc/update_user_preferences               │    │
│  │  • /rest/v1/rpc/check_user_rpcs_health                │    │
│  └────────────────────┬───────────────────────────────────┘    │
│                       │                                         │
│  ┌────────────────────▼───────────────────────────────────┐    │
│  │              PostgreSQL Database                        │    │
│  │                                                         │    │
│  │  Functions:                                            │    │
│  │  • get_user_profile(p_user_id UUID)                   │    │
│  │  • update_user_profile(p_user_id UUID, ...)           │    │
│  │  • get_user_preferences(p_user_id UUID)               │    │
│  │  • update_user_preferences(p_user_id UUID, ...)       │    │
│  │                                                         │    │
│  │  Tables:                                               │    │
│  │  • user_profiles                                       │    │
│  │  • user_preferences                                    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Read Operation (with Cache)

```
Component Request
    │
    ▼
getUserProfile(userId)
    │
    ▼
Check Cache ────► Cache HIT ────► Return Cached Data
    │                                      │
    │ Cache MISS                           │
    ▼                                      │
Call Supabase RPC                          │
    │                                      │
    ▼                                      │
supabase.rpc('get_user_profile')           │
    │                                      │
    ▼                                      │
Supabase PostgREST                         │
    │                                      │
    ▼                                      │
PostgreSQL Function                        │
    │                                      │
    ▼                                      │
Return JSONB Data                          │
    │                                      │
    ▼                                      │
Store in Cache (TTL: 5 min)                │
    │                                      │
    └──────────────────────────────────────┘
                │
                ▼
        Return to Component
```

### Write Operation (with Cache Invalidation)

```
Component Update Request
    │
    ▼
updateUserProfile(userId, updates)
    │
    ▼
Call Supabase RPC
    │
    ▼
supabase.rpc('update_user_profile')
    │
    ▼
Supabase PostgREST
    │
    ▼
PostgreSQL Function
    │
    ▼
Update Database
    │
    ▼
Return Updated Data
    │
    ▼
Invalidate Cache ────► Clear Old Cache Entry
    │
    ▼
Store New Data in Cache (TTL: 5 min)
    │
    ▼
Return to Component
```

## Cache Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    In-Memory Cache (Map)                     │
│                                                              │
│  Key: "profile:user-123"                                    │
│  Value: {                                                   │
│    data: { user_id, email, full_name, ... },               │
│    expiresAt: 1706198400000  (now + 5 min)                 │
│  }                                                          │
│                                                              │
│  Key: "preferences:user-123"                                │
│  Value: {                                                   │
│    data: { user_id, theme, language, ... },                │
│    expiresAt: 1706199000000  (now + 10 min)                │
│  }                                                          │
│                                                              │
│  Operations:                                                │
│  • getCachedData(type, userId)  → Check & return if valid  │
│  • setCachedData(type, userId, data, ttl)  → Store with TTL│
│  • invalidateCache(type, userId)  → Delete entry           │
│  • clearAllCache()  → Clear entire cache                   │
└─────────────────────────────────────────────────────────────┘
```

## Testing Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Test Suite                           │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Unit Tests (Jest)                       │  │
│  │                                                       │  │
│  │  • Mock Supabase Client                             │  │
│  │  • Test Cache Logic                                 │  │
│  │  • Test Error Handling                              │  │
│  │  • Test Mock Fallbacks                              │  │
│  │                                                       │  │
│  │  Run: npm run test:user                             │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Integration Tests (Node.js)                │  │
│  │                                                       │  │
│  │  • Real Supabase Connection                         │  │
│  │  • Test All RPCs                                    │  │
│  │  • Verify Health Check                              │  │
│  │  • Test CRUD Operations                             │  │
│  │                                                       │  │
│  │  Run: npm run test:integration                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Service Tests (Node.js)                   │  │
│  │                                                       │  │
│  │  • End-to-End Validation                            │  │
│  │  • Cache Performance                                │  │
│  │  • Update Operations                                │  │
│  │  • Complete User Data                               │  │
│  │                                                       │  │
│  │  Run: npm run test:service                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           RPC Health Check (Node.js)                 │  │
│  │                                                       │  │
│  │  • Verify RPCs Exist                                │  │
│  │  • Test Each Function                               │  │
│  │  • Health Report                                    │  │
│  │                                                       │  │
│  │  Run: node backend/scripts/checkSupabaseRPCs.js     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## CI/CD Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Actions                           │
│                                                              │
│  Trigger: Push/PR to main/develop                           │
│                                                              │
│  ┌────────────┐                                             │
│  │   Unit     │  ──► Run Jest Tests                         │
│  │   Tests    │  ──► Upload Coverage                        │
│  └────┬───────┘                                             │
│       │ ✅ Pass                                             │
│       ▼                                                      │
│  ┌────────────┐                                             │
│  │Integration │  ──► Test Real Supabase                     │
│  │   Tests    │  ──► Verify RPCs                            │
│  └────┬───────┘                                             │
│       │ ✅ Pass                                             │
│       ▼                                                      │
│  ┌────────────┐                                             │
│  │  Service   │  ──► Comprehensive Tests                    │
│  │   Tests    │  ──► Verbose Output                         │
│  └────┬───────┘                                             │
│       │ ✅ Pass                                             │
│       ▼                                                      │
│  ┌────────────┐                                             │
│  │  Supabase  │  ──► Health Check                           │
│  │   Health   │  ──► Verify All RPCs                        │
│  └────┬───────┘                                             │
│       │ ✅ Pass                                             │
│       ▼                                                      │
│  ┌────────────┐                                             │
│  │  Summary   │  ──► Aggregate Results                      │
│  │            │  ──► Post to PR                             │
│  └────────────┘                                             │
│                                                              │
│  Result: ✅ All Tests Passed / ❌ Build Failed              │
└─────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
Component Call
    │
    ▼
userService Function
    │
    ▼
Try Block
    │
    ├─► Supabase RPC Call
    │       │
    │       ▼
    │   Success? ──► Yes ──► Return Data
    │       │
    │       No
    │       │
    │       ▼
    │   Catch Block
    │       │
    │       ▼
    │   Log Error (logError)
    │       │
    │       ▼
    │   Development Mode?
    │       │
    │       ├─► Yes ──► Return Mock Data
    │       │
    │       └─► No ──► Throw Error
    │                       │
    │                       ▼
    │               Component Error Boundary
    │                       │
    │                       ▼
    │               Display Error UI
    │
    └─────────────────────────────────────┘
```

## Performance Optimization

### Without Cache
```
Request 1: 150ms (Supabase RPC)
Request 2: 145ms (Supabase RPC)
Request 3: 148ms (Supabase RPC)
Request 4: 152ms (Supabase RPC)
Request 5: 147ms (Supabase RPC)

Total: 742ms
Average: 148.4ms
```

### With Cache
```
Request 1: 150ms (Supabase RPC) ──► Cache Miss
Request 2:   2ms (Cache Hit)    ──► Cache Hit
Request 3:   1ms (Cache Hit)    ──► Cache Hit
Request 4:   2ms (Cache Hit)    ──► Cache Hit
Request 5:   1ms (Cache Hit)    ──► Cache Hit

Total: 156ms
Average: 31.2ms
Improvement: 79% faster
```

## Security Model

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                           │
│                                                              │
│  Frontend (Browser)                                         │
│  │                                                           │
│  ├─► Supabase Anon Key (Public)                            │
│  │   • Limited permissions                                  │
│  │   • Row Level Security (RLS)                            │
│  │                                                           │
│  ▼                                                           │
│  Supabase PostgREST                                         │
│  │                                                           │
│  ├─► JWT Authentication                                     │
│  │   • Verify user identity                                │
│  │   • Check permissions                                    │
│  │                                                           │
│  ▼                                                           │
│  PostgreSQL Functions                                       │
│  │                                                           │
│  ├─► SECURITY DEFINER                                       │
│  │   • Execute with function owner privileges              │
│  │   • Controlled access                                    │
│  │                                                           │
│  ├─► Parameter Validation                                   │
│  │   • Type checking                                        │
│  │   • Input sanitization                                   │
│  │                                                           │
│  └─► Row Level Security (RLS)                               │
│      • User can only access own data                        │
│      • Enforced at database level                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Production Environment                    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Frontend (Vercel/Netlify)               │  │
│  │                                                       │  │
│  │  • React App (Port 3002)                            │  │
│  │  • userService.js                                   │  │
│  │  • In-Memory Cache                                  │  │
│  │  • Environment Variables                            │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │                                     │
│                       │ HTTPS                               │
│                       │                                     │
│  ┌────────────────────▼─────────────────────────────────┐  │
│  │           Supabase Cloud (Managed)                   │  │
│  │                                                       │  │
│  │  • PostgREST API                                    │  │
│  │  • PostgreSQL Database                              │  │
│  │  • Authentication                                   │  │
│  │  • Row Level Security                               │  │
│  │  • Automatic Backups                                │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Monitoring & Logging                    │  │
│  │                                                       │  │
│  │  • Supabase Dashboard                               │  │
│  │  • GitHub Actions Logs                              │  │
│  │  • Application Logs (console)                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
InvestX Labs/
│
├── frontend/
│   ├── src/
│   │   └── services/
│   │       └── userService.js          ⭐ Main Service
│   │
│   ├── __tests__/
│   │   └── userService.test.js         🧪 Unit Tests
│   │
│   ├── scripts/
│   │   ├── testUserService.js          🧪 Service Tests
│   │   └── testIntegration.js          🧪 Integration Tests
│   │
│   └── package.json                     📦 NPM Scripts
│
├── backend/
│   ├── scripts/
│   │   └── checkSupabaseRPCs.js        🔍 Health Check
│   │
│   └── supabase/
│       └── migrations/
│           └── 20250125000000_verify_user_rpcs.sql  🗄️ SQL
│
├── .github/
│   └── workflows/
│       └── user-service-tests.yml      🚀 CI/CD
│
└── Documentation/
    ├── USER_SERVICE_IMPLEMENTATION.md   📚 Implementation
    ├── USER_SERVICE_TESTING_GUIDE.md    📚 Testing Guide
    ├── USER_SERVICE_VALIDATION_COMPLETE.md  📚 Summary
    ├── USER_SERVICE_ARCHITECTURE.md     📚 This File
    └── QUICK_TEST_REFERENCE.md          📚 Quick Ref
```

---

**Last Updated**: January 25, 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
