# 🚀 Quick Test Reference Card

## One-Line Commands

```bash
# Unit Tests (Mocked)
npm run test:user

# Integration Tests (Real Supabase)
npm run test:integration

# Service Tests (Comprehensive)
npm run test:service

# All Tests
npm run test:all

# RPC Health Check
node backend/scripts/checkSupabaseRPCs.js

# Watch Mode (Unit Tests)
npm run test:user:watch
```

## Environment Setup

```bash
# Create .env file
cat > frontend/.env << EOF
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
TEST_USER_ID=00000000-0000-0000-0000-000000000000
NODE_ENV=development
EOF
```

## Quick Troubleshooting

```bash
# Check if Supabase is reachable
curl https://your-project.supabase.co/rest/v1/

# Verify environment variables
echo $REACT_APP_SUPABASE_URL

# Clear Jest cache
npm run test:user -- --clearCache

# Verbose output
VERBOSE=true npm run test:service
```

## Expected Output

### ✅ Success
```
✅ All tests passed!
Total Tests: 27
Passed: 27
Failed: 0
```

### ❌ Failure
```
❌ Some tests failed
Check error messages above
```

## Quick Fixes

| Error | Fix |
|-------|-----|
| Missing credentials | Create `frontend/.env` |
| RPC not found | Run migrations in Supabase |
| Tests timeout | Check Supabase connection |
| Cache not working | Expected (in-memory, resets) |

## File Locations

```
frontend/
  src/services/userService.js          # Service implementation
  __tests__/userService.test.js        # Unit tests
  scripts/testUserService.js           # Service tests
  scripts/testIntegration.js           # Integration tests

backend/
  scripts/checkSupabaseRPCs.js         # RPC health check
  supabase/migrations/
    20250125000000_verify_user_rpcs.sql # Health check migration

.github/workflows/
  user-service-tests.yml               # CI/CD pipeline
```

## CI/CD

```bash
# GitHub Secrets Required:
SUPABASE_URL
SUPABASE_ANON_KEY
TEST_USER_ID

# Workflow runs on:
- Push to main/develop
- Pull requests
- Changes to user service files
```

## Next Steps

1. ✅ Run all tests locally
2. ✅ Verify RPC health
3. ✅ Push to GitHub
4. ✅ Check CI/CD passes
5. ✅ Proceed to Phase 3

---

**Need Help?** See `USER_SERVICE_TESTING_GUIDE.md`
