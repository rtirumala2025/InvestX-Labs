# Troubleshooting: Google Sign-In ERR_BLOCKED_BY_CLIENT Errors

## Problem

When attempting to sign in with Google, you see `net::ERR_BLOCKED_BY_CLIENT` errors in the browser console for requests to `play.google.com/log`. This can prevent Google OAuth from completing successfully.

## Root Cause

The `ERR_BLOCKED_BY_CLIENT` error occurs when:
- **Ad blockers** (uBlock Origin, AdBlock Plus, etc.) block Google's analytics/tracking requests
- **Privacy extensions** (Privacy Badger, Ghostery, etc.) block third-party tracking
- **Browser settings** block certain requests

While these requests are primarily for analytics/tracking, some ad blockers can interfere with the OAuth flow.

## Solutions

### Solution 1: Disable Ad Blocker for Google OAuth (Recommended)

**For uBlock Origin:**
1. Click the uBlock Origin icon in your browser
2. Click the power button to disable it temporarily
3. Try signing in again
4. Re-enable after successful sign-in

**For AdBlock Plus:**
1. Click the AdBlock Plus icon
2. Select "Pause on this site"
3. Try signing in again

**For other ad blockers:**
- Temporarily disable the extension
- Complete the sign-in
- Re-enable the extension

### Solution 2: Add Exceptions for Google OAuth Domains

Add these domains to your ad blocker's whitelist:

**Required domains:**
- `accounts.google.com`
- `oauth2.googleapis.com`
- `*.googleapis.com`
- `*.supabase.co` (your Supabase project domain)

**For uBlock Origin:**
1. Click the uBlock Origin icon
2. Click the settings icon (gear)
3. Go to "Filter lists" → "Whitelist"
4. Add: `accounts.google.com oauth2.googleapis.com *.googleapis.com *.supabase.co`

**For AdBlock Plus:**
1. Click AdBlock Plus icon → Settings
2. Go to "Advanced" → "Whitelisted domains"
3. Add the domains above

### Solution 3: Use Incognito/Private Mode

1. Open an incognito/private window
2. Disable extensions in that window (if prompted)
3. Try signing in with Google
4. This helps isolate if extensions are the issue

### Solution 4: Check Browser Privacy Settings

**Chrome:**
1. Go to `chrome://settings/privacy`
2. Check "Block third-party cookies" - may need to allow for Google domains
3. Check "Send a 'Do Not Track' request" - may interfere with OAuth

**Firefox:**
1. Go to `about:preferences#privacy`
2. Under "Enhanced Tracking Protection", set to "Standard" or "Custom" (not "Strict")
3. Or add exceptions for Google domains

**Safari:**
1. Go to Safari → Settings → Privacy
2. Uncheck "Prevent cross-site tracking" temporarily
3. Or add exceptions for Google domains

## Verification

After applying a solution:

1. **Clear browser cache** (optional but recommended)
2. **Close and reopen the browser**
3. **Try signing in with Google again**
4. **Check the console** - you should see fewer or no `ERR_BLOCKED_BY_CLIENT` errors
5. **Verify sign-in completes** - you should be redirected to `/dashboard`

## Technical Details

### What are these requests?

The `play.google.com/log` requests are:
- **Analytics/tracking requests** from Google
- **Not critical** for authentication
- **Can interfere** with OAuth flow if blocked aggressively

### Why does this happen?

1. Ad blockers use filter lists that block common tracking domains
2. `play.google.com` is often in these lists
3. Some ad blockers block all requests to blocked domains, not just ads
4. This can break OAuth flows that rely on redirects and callbacks

### Is this a security issue?

**No.** These errors are from client-side blocking, not a security vulnerability. However, if sign-in fails, it's a usability issue that needs to be resolved.

## Prevention for Users

If you're deploying this app, consider:

1. **Add a notice** on the login page about ad blockers
2. **Detect blocked requests** and show a helpful message
3. **Provide clear instructions** for common ad blockers

## Related Issues

- **Popup blocked errors** - Similar issue, different cause
- **CORS errors** - Network/configuration issue
- **Redirect URI mismatch** - Configuration issue in Google Cloud Console

## Still Having Issues?

If none of the above solutions work:

1. **Check Supabase configuration:**
   - Verify Google OAuth provider is enabled
   - Verify Client ID and Secret are correct
   - Check redirect URLs in Supabase dashboard

2. **Check Google Cloud Console:**
   - Verify authorized redirect URI: `https://oysuothaldgentevxzod.supabase.co/auth/v1/callback`
   - Verify authorized JavaScript origins include your domain

3. **Check network:**
   - Try a different network (mobile hotspot, etc.)
   - Check firewall settings
   - Verify SSL/TLS is working

4. **Check browser console:**
   - Look for other errors beyond `ERR_BLOCKED_BY_CLIENT`
   - Check Network tab for failed requests
   - Verify OAuth redirect is happening

---

**Last Updated:** 2025-01-24  
**Related Docs:** 
- [Google Sign-In Setup Guide](../setup/GOOGLE_SIGNIN_SETUP.md)
- [Supabase Auth OAuth Audit Report](../../SUPABASE_AUTH_OAUTH_AUDIT_REPORT.md)
