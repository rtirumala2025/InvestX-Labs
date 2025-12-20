# Google OAuth Debugging Guide

## Current Issue
Sign in with Google button is not working - no logs appearing, immediate redirect to dashboard.

## Debugging Steps

### 1. Check Browser Console
Open DevTools (F12) → Console tab and look for:
- `🔐 [LoginPage]` logs
- `🔐 [Auth]` logs  
- `🔍 [OAuthHealthCheck]` logs
- Any error messages

### 2. Check What Happens When You Click
The button should log:
```
🔐 [LoginPage] Button onClick triggered!
🔐 [LoginPage] ========== handleGoogleSignIn CALLED ==========
🔐 [Auth] ========== STARTING GOOGLE OAUTH ==========
```

If you don't see these logs, the function isn't being called.

### 3. Run Diagnostic Tool
In browser console, type:
```javascript
diagnoseGoogleOAuth()
```

This will show you:
- Health check status
- What's configured
- What's missing
- Specific errors

### 4. Check Common Issues

#### Issue: Health Check Failing
**Symptoms**: No OAuth URL generated, error about provider not enabled
**Fix**: Enable Google OAuth in Supabase Dashboard

#### Issue: No Logs at All
**Symptoms**: Button click does nothing, no console logs
**Possible causes**:
- JavaScript error preventing execution
- Event handler not attached
- Form submission interfering

#### Issue: Immediate Redirect
**Symptoms**: Click button → redirects to dashboard immediately
**Possible causes**:
- OAuth working but logs filtered
- Error causing fallback redirect
- Already authenticated

### 5. Manual Testing Steps

1. **Clear browser cache and localStorage**
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   ```

2. **Refresh page** (hard refresh: Ctrl+Shift+R or Cmd+Shift+R)

3. **Open console** (F12)

4. **Click "Sign in with Google"**

5. **Check console for logs**

6. **If no logs appear**, check:
   - Is JavaScript enabled?
   - Are there any console errors?
   - Is the button actually clickable?

### 6. Verify Configuration

Run this in console:
```javascript
// Check Supabase
console.log('Supabase:', window.supabase || 'Not found');
console.log('Supabase Auth:', window.supabase?.auth || 'Not found');

// Check environment
console.log('REACT_APP_SUPABASE_URL:', process.env.REACT_APP_SUPABASE_URL ? 'Set' : 'Missing');
console.log('REACT_APP_SUPABASE_ANON_KEY:', process.env.REACT_APP_SUPABASE_ANON_KEY ? 'Set' : 'Missing');

// Test OAuth directly
import { supabase } from './services/supabase/config';
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: window.location.origin + '/dashboard' }
});
console.log('OAuth test:', { data, error });
```

## Next Steps

1. Run `diagnoseGoogleOAuth()` in console
2. Check the results
3. Follow the specific fixes provided
4. Try signing in again
5. Check console logs for detailed error messages

