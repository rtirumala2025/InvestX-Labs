# 🚨 Google OAuth Quick Fix Guide

## Immediate Steps to Fix Google Sign-In

### Step 1: Check Browser Console
1. Open your app in the browser
2. Press `F12` to open Developer Tools
3. Go to the **Console** tab
4. Click "Sign in with Google" button
5. Look for error messages starting with `🔐 [Auth]`

### Step 2: Run Diagnostic Tool
In the browser console, type:
```javascript
diagnoseGoogleOAuth()
```

This will test your OAuth configuration and tell you exactly what's wrong.

### Step 3: Most Common Fix - Enable Google OAuth in Supabase

**If you see: "provider not enabled" or "Unsupported provider"**

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to: **Authentication** → **Providers**
4. Find **Google** in the list
5. Toggle **"Enable Google provider"** to **ON** (green)
6. Enter your **Google OAuth Client ID**
7. Enter your **Google OAuth Client Secret**
8. Click **Save**
9. Try signing in again

### Step 4: Get Google OAuth Credentials (if needed)

If you don't have Google OAuth credentials:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one)
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. **Authorized redirect URIs**: Add this:
   ```
   https://[your-project-id].supabase.co/auth/v1/callback
   ```
   (Replace `[your-project-id]` with your actual Supabase project reference)
7. Copy the **Client ID** and **Client Secret**
8. Paste them into Supabase (Step 3 above)

### Step 5: Configure Redirect URLs in Supabase

1. In Supabase Dashboard, go to: **Authentication** → **URL Configuration**
2. **Site URL**: Set to your app URL (e.g., `http://localhost:3000` or `http://localhost:3002`)
3. **Redirect URLs**: Add these:
   ```
   http://localhost:3000/dashboard
   http://localhost:3002/dashboard
   https://your-production-domain.com/dashboard
   ```
4. Click **Save**

### Step 6: Verify Google Cloud Console Redirect URI

1. Go back to [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** → **Credentials**
3. Open your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, make sure you have:
   ```
   https://[your-project-id].supabase.co/auth/v1/callback
   ```
5. Save if you made changes

## Quick Test

After making changes:

1. **Refresh your browser** (hard refresh: `Ctrl+Shift+R` or `Cmd+Shift+R`)
2. Open browser console (`F12`)
3. Click "Sign in with Google"
4. Check console for `🔐 [Auth]` messages
5. You should see: `✅ Google OAuth URL generated successfully!`
6. You should be redirected to Google sign-in page

## Common Error Messages & Solutions

| Error Message | Solution |
|--------------|----------|
| "provider not enabled" | Enable Google provider in Supabase Dashboard |
| "invalid_client" | Check Client ID/Secret in Supabase match Google Cloud Console |
| "redirect_uri_mismatch" | Add correct redirect URI to Google Cloud Console |
| "No OAuth URL generated" | Provider not enabled or credentials missing |
| "Supabase client is not available" | Check environment variables, restart dev server |

## Still Not Working?

1. **Run diagnostic**: `diagnoseGoogleOAuth()` in browser console
2. **Check environment variables**: Make sure `.env` file exists in `frontend/` directory
3. **Restart dev server**: After changing `.env` file, restart with `npm start`
4. **Check browser console**: Look for detailed error messages
5. **Disable ad blockers**: Temporarily disable to test

## Need More Help?

Check the detailed guides:
- `GOOGLE_OAUTH_FIX_INSTRUCTIONS.md` - Step-by-step setup
- `docs/auth/SUPABASE_MANUAL_SETUP_CHECKLIST.md` - Complete checklist

