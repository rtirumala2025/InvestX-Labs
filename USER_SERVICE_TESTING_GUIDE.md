# 🧪 User Service Testing & Validation Guide

## 📋 Overview

This guide covers the complete testing and validation suite for the InvestX Labs user service implementation.

## 🎯 What's Included

### 1. **User Service Implementation**
- **File**: `frontend/src/services/userService.js`
- **Features**: Supabase RPC integration, caching, error handling, mock fallbacks

### 2. **Unit Tests**
- **File**: `frontend/__tests__/userService.test.js`
- **Coverage**: Profile/preferences fetching, caching, updates, error handling
- **Run**: `npm run test:user`

### 3. **Integration Tests**
- **File**: `frontend/scripts/testIntegration.js`
- **Purpose**: Test against real Supabase instance
- **Run**: `npm run test:integration`

### 4. **Service Tests**
- **File**: `frontend/scripts/testUserService.js`
- **Purpose**: Comprehensive service validation
- **Run**: `npm run test:service`

### 5. **RPC Health Check**
- **File**: `backend/scripts/checkSupabaseRPCs.js`
- **Purpose**: Verify all Supabase RPCs exist
- **Run**: `node backend/scripts/checkSupabaseRPCs.js`

### 6. **SQL Health Check Migration**
- **File**: `backend/supabase/migrations/20250125000000_verify_user_rpcs.sql`
- **Purpose**: Database-level RPC verification

### 7. **CI/CD Pipeline**
- **File**: `.github/workflows/user-service-tests.yml`
- **Purpose**: Automated testing on every PR/push

---

## 🚀 Quick Start

### Prerequisites

1. **Environment Variables** (create `frontend/.env`):
```bash
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
TEST_USER_ID=00000000-0000-0000-0000-000000000000
NODE_ENV=development
```

2. **Install Dependencies**:
```bash
cd frontend
npm install
```

### Running Tests Locally

#### 1. Unit Tests (Mocked)
```bash
npm run test:user
```

**What it tests**:
- ✅ Profile fetching with Supabase RPC
- ✅ Cache hit/miss behavior
- ✅ Update operations and cache invalidation
- ✅ Error handling and fallbacks
- ✅ Development mode mock data

#### 2. Integration Tests (Real Supabase)
```bash
npm run test:integration
```

**What it tests**:
- ✅ Real Supabase connection
- ✅ RPC health check
- ✅ get_user_profile RPC
- ✅ get_user_preferences RPC
- ✅ update_user_profile RPC
- ✅ update_user_preferences RPC

#### 3. Service Tests (Comprehensive)
```bash
npm run test:service
```

**What it tests**:
- ✅ Supabase connection
- ✅ Profile and preferences fetching
- ✅ Cache functionality and timing
- ✅ Update operations
- ✅ Complete user data fetching

#### 4. All Tests
```bash
npm run test:all
```

Runs all three test suites sequentially.

#### 5. RPC Health Check
```bash
cd ..
node backend/scripts/checkSupabaseRPCs.js
```

**What it checks**:
- ✅ Health check RPC exists
- ✅ All 4 user RPCs are present
- ✅ Manual test of each RPC

---

## 🔧 Test Scripts Reference

### NPM Scripts (in `frontend/package.json`)

| Script | Command | Purpose |
|--------|---------|---------|
| `test:user` | Unit tests | Jest tests with mocked Supabase |
| `test:user:watch` | Watch mode | Unit tests in watch mode |
| `test:integration` | Integration tests | Tests against real Supabase |
| `test:service` | Service tests | Comprehensive service validation |
| `test:all` | All tests | Runs all test suites |
| `postbuild` | Auto-run | Runs service tests after build |

### Standalone Scripts

| Script | Location | Purpose |
|--------|----------|---------|
| `testUserService.js` | `frontend/scripts/` | Service integration tests |
| `testIntegration.js` | `frontend/scripts/` | Real Supabase integration tests |
| `checkSupabaseRPCs.js` | `backend/scripts/` | RPC health verification |

---

## 🏗️ CI/CD Pipeline

### GitHub Actions Workflow

**File**: `.github/workflows/user-service-tests.yml`

**Triggers**:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Changes to user service files

**Jobs**:

1. **Unit Tests**
   - Runs Jest unit tests
   - Uploads coverage reports

2. **Integration Tests**
   - Tests against Supabase
   - Uses GitHub secrets for credentials
   - Fails build if connection fails

3. **Service Tests**
   - Comprehensive service validation
   - Verbose output for debugging

4. **Supabase Health Check**
   - Verifies RPC functions exist
   - Calls `check_user_rpcs_health()`

5. **Summary**
   - Aggregates all test results
   - Posts summary to PR

### Required GitHub Secrets

Add these to your repository settings:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
TEST_USER_ID=00000000-0000-0000-0000-000000000000
```

**How to add**:
1. Go to GitHub repo → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each secret

---

## 📊 Test Coverage

### Unit Tests Coverage

- ✅ **getUserProfile**: Fetching, caching, cache bypass
- ✅ **updateUserProfile**: Updates, cache invalidation
- ✅ **getUserPreferences**: Fetching, separate caching
- ✅ **updateUserPreferences**: Updates, cache invalidation
- ✅ **getUserData**: Combined profile + preferences
- ✅ **clearUserCache**: Cache clearing
- ✅ **testConnection**: Connection validation
- ✅ **Error Handling**: Production vs development modes

### Integration Tests Coverage

- ✅ RPC health check function
- ✅ get_user_profile with real data
- ✅ get_user_preferences with real data
- ✅ update_user_profile with real updates
- ✅ update_user_preferences with real updates

### Service Tests Coverage

- ✅ Supabase connection test
- ✅ Profile fetching with timing
- ✅ Preferences fetching with timing
- ✅ Cache hit/miss verification
- ✅ Update operations
- ✅ Complete user data fetching

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Missing Supabase credentials"

**Solution**:
```bash
# Create frontend/.env
echo "REACT_APP_SUPABASE_URL=https://your-project.supabase.co" >> frontend/.env
echo "REACT_APP_SUPABASE_ANON_KEY=your-anon-key" >> frontend/.env
```

#### 2. "RPC function not found"

**Solution**:
```bash
# Run the RPC health check
node backend/scripts/checkSupabaseRPCs.js

# If functions are missing, apply the migration
# Go to Supabase Dashboard → SQL Editor
# Run: backend/supabase/migrations/[user_profile_migration].sql
```

#### 3. "Jest tests failing"

**Solution**:
```bash
# Clear Jest cache
npm run test:user -- --clearCache

# Run with verbose output
npm run test:user -- --verbose
```

#### 4. "Integration tests timeout"

**Solution**:
```bash
# Check Supabase connection
curl https://your-project.supabase.co/rest/v1/

# Verify environment variables
echo $REACT_APP_SUPABASE_URL
```

#### 5. "Cache not working in tests"

**Cause**: Cache is in-memory and resets between test runs.

**Solution**: This is expected behavior. Each test file gets a fresh cache.

---

## 📈 Next Steps: Phase 3

After all tests pass, proceed to Phase 3:

### Real Market Data Integration

1. **Replace Mock Data**:
   - Current: `get_quote` returns random SQL data
   - Goal: Fetch real data from Alpha Vantage/IEX/Yahoo Finance

2. **Create New RPC**:
```sql
CREATE OR REPLACE FUNCTION public.get_real_quote(symbol text)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    api_data jsonb;
BEGIN
    -- Call external API (via Edge Function or stored API key)
    -- Parse and return real market data
    RETURN api_data;
END;
$$;
```

3. **Update Service**:
```javascript
// frontend/src/services/marketService.js
export const getMarketData = async (symbol) => {
  const { data, error } = await supabase
    .rpc('get_real_quote', { symbol });
  return data;
};
```

---

## 🎯 Success Criteria

Before moving to Phase 3, ensure:

- [ ] All unit tests pass (`npm run test:user`)
- [ ] All integration tests pass (`npm run test:integration`)
- [ ] All service tests pass (`npm run test:service`)
- [ ] RPC health check passes (`node backend/scripts/checkSupabaseRPCs.js`)
- [ ] CI/CD pipeline is green
- [ ] No console errors in development
- [ ] Cache is working (second calls are faster)
- [ ] Updates invalidate cache correctly

---

## 📚 Additional Resources

### Test Output Examples

#### Successful Unit Test
```
PASS  __tests__/userService.test.js
  User Service
    getUserProfile
      ✓ should fetch user profile from Supabase (45ms)
      ✓ should use cached data on second call (12ms)
      ✓ should bypass cache when useCache is false (38ms)
```

#### Successful Integration Test
```
╔════════════════════════════════════════╗
║  User Service Integration Tests       ║
╚════════════════════════════════════════╝

━━━ RPC Health Check ━━━
✅ All 4/4 RPCs are healthy

━━━ Test get_user_profile ━━━
✅ get_user_profile returned data
ℹ️  User: test@example.com

Total Tests: 5
✅ Passed: 5
❌ Failed: 0

✅ All integration tests passed!
```

### Useful Commands

```bash
# Watch mode for unit tests
npm run test:user:watch

# Verbose service tests
VERBOSE=true npm run test:service

# Test specific user ID
TEST_USER_ID=your-uuid npm run test:integration

# Check RPC health with service key
SUPABASE_SERVICE_KEY=your-key node backend/scripts/checkSupabaseRPCs.js
```

---

## 🤝 Contributing

When adding new user service features:

1. **Update the service**: `frontend/src/services/userService.js`
2. **Add unit tests**: `frontend/__tests__/userService.test.js`
3. **Update integration tests**: `frontend/scripts/testIntegration.js`
4. **Run all tests**: `npm run test:all`
5. **Verify CI passes**: Check GitHub Actions

---

## 📞 Support

If tests fail or you encounter issues:

1. Check this guide's troubleshooting section
2. Review error messages carefully
3. Verify environment variables are set
4. Check Supabase dashboard for RPC functions
5. Review GitHub Actions logs for CI failures

---

**Last Updated**: January 25, 2025
**Version**: 1.0.0
**Status**: ✅ Production Ready
