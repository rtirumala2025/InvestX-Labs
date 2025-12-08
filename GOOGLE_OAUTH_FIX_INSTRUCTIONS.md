# 🔧 Google OAuth Fix - Step by Step Instructions

## 🚨 IMMEDIATE FIX REQUIRED

The Google OAuth menu isn't opening because the provider likely isn't enabled in Supabase. Follow these steps:

---

## ✅ STEP 1: Enable Google OAuth in Supabase Dashboard

1. **Go to Supabase Dashboard:**
   - URL: https://app.supabase.com/project/oysuothaldgentevxzod
   - Login if needed

2. **Navigate to Authentication:**
   - Click **Authentication** in the left sidebar
   - Click **Providers** tab

3. **Enable Google Provider:**
   - Find **Google** in the provider list
   - Toggle **Enable Google provider** to **ON** (green)

4. **Configure Google Credentials:**
   - **Client ID (for OAuth):** Enter your Google OAuth Client ID
   - **Client Secret (for OAuth):** Enter your Google OAuth Client Secret
   - Click **Save**

   > **Where to get these?** See Step 2 below.

---

## ✅ STEP 2: Get Google OAuth Credentials

1. **Go to Google Cloud Console:**
   - URL: https://console.cloud.google.com/
   - Select your project (or create one)

2. **Enable Google+ API:**
   - Go to **APIs & Services** → **Library**
   - Search for "Google+ API"
   - Click **Enable**

3. **Create OAuth 2.0 Credentials:**
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Name: `InvestX Labs OAuth`

4. **Configure Authorized URIs:**
   
   **Authorized JavaScript origins:**
   ```
   http://localhost:3002
   https://oysuothaldgentevxzod.supabase.co
   ```
   
   **Authorized redirect URIs:**
   ```
   https://oysuothaldgentevxzod.supabase.co/auth/v1/callback
   ```

5. **Copy Credentials:**
   - Copy the **Client ID**
   - Copy the **Client Secret**
   - Paste them into Supabase (Step 1, #4)

---

## ✅ STEP 3: Configure Supabase URL Settings

1. **In Supabase Dashboard:**
   - Go to **Authentication** → **URL Configuration**

2. **Set Site URL:**
   ```
   http://localhost:3002
   ```

3. **Add Redirect URLs:**
   Click **Add URL** for each:
   ```
   http://localhost:3002/dashboard
   http://localhost:3002/*
   ```

4. **Save changes**

---

## ✅ STEP 4: Test the Fix

1. **Refresh your browser** at `http://localhost:3002/login`
2. **Open browser console** (F12)
3. **Click "Sign in with Google"**
4. **Check console logs** - you should see:
   ```
   🔐 [Auth] ========== STARTING GOOGLE OAUTH ==========
   🔐 [Auth] Step 1: Checking Supabase client...
   🔐 [Auth] ✅ Supabase client available
   🔐 [Auth] Step 4: Calling signInWithOAuth...
   🔐 [Auth] ✅ Google OAuth URL generated successfully!
   🔐 [Auth] Step 6: Redirecting to Google OAuth...
   ```

5. **You should be redirected to Google sign-in page**

---

## ❌ If It Still Doesn't Work

### Check Console for Errors:

**Error: "Unsupported provider" or "provider not enabled"**
- → Google provider is not enabled in Supabase
- → Go back to Step 1

**Error: "invalid_client" or "Client ID"**
- → Client ID/Secret are wrong in Supabase
- → Verify they match Google Cloud Console

**Error: "redirect_uri_mismatch"**
- → Redirect URI doesn't match
- → Verify Step 2, #4 and Step 3, #3

**No error, but no redirect:**
- → Check if `data.url` exists in console
- → If null, provider isn't configured correctly

---

## 🔍 Debug Commands

Run these in browser console to check:

```javascript
// Check if Supabase is initialized
console.log('Supabase:', window.supabase || 'Not found');

// Check if auth is available
import { supabase } from './services/supabase/config';
console.log('Auth available:', !!supabase?.auth);
console.log('signInWithOAuth available:', typeof supabase?.auth?.signInWithOAuth === 'function');

// Test OAuth call directly
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'http://localhost:3002/dashboard'
  }
});
console.log('OAuth result:', { data, error });
```

---

## 📝 SQL File

I've created `SUPABASE_GOOGLE_OAUTH_SETUP.sql` with verification queries, but **Google OAuth must be enabled through the Dashboard UI, not SQL**.

---

## ✅ Quick Checklist

- [ ] Google provider enabled in Supabase Dashboard
- [ ] Client ID entered in Supabase
- [ ] Client Secret entered in Supabase
- [ ] Site URL set to `http://localhost:3002`
- [ ] Redirect URLs added: `http://localhost:3002/dashboard`
- [ ] Google Cloud Console redirect URI matches: `https://oysuothaldgentevxzod.supabase.co/auth/v1/callback`
- [ ] Browser console shows OAuth URL being generated
- [ ] Redirect to Google sign-in page works

---

**After completing these steps, the Google OAuth menu should open!**

