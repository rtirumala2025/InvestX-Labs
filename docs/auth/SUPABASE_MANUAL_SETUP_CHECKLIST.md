# 🔐 Supabase Manual Setup Checklist
## InvestX Labs Authentication Configuration

> **Last Updated:** November 3, 2025  
> **Status:** Action Required  
> **Environment:** Production Setup

---

## 📊 Overview

This checklist contains all manual tasks that must be completed in the Supabase dashboard to make authentication fully operational. These tasks **cannot** be completed via code alone.

**Priority Level Key:**
- 🔴 **CRITICAL** - Must be done before app can work
- 🟡 **HIGH** - Required for full functionality
- 🟢 **MEDIUM** - Recommended but optional
- ⚪ **LOW** - Nice to have

---

## ✅ Section 1: Already Done (via Migrations)

These items are already configured through SQL migrations and require **no manual action**:

- ✅ **Database Tables Created**
  - `user_profiles` table with RLS policies
  - `user_preferences` table with RLS policies  
  - `chat_sessions`, `chat_messages`, `analytics_events` tables
  - `market_news`, `market_data_cache` tables

- ✅ **Row Level Security (RLS) Policies**
  - User profiles: Users can view/update their own profile
  - User preferences: Users can view/update/insert their own preferences
  - Chat sessions: Full CRUD for user's own sessions
  - Chat messages: View/insert for own sessions
  - Analytics: Users can view own events
  - Market data: Public read access

- ✅ **Database Functions (RPCs)**
  - `get_quote()` - Market data quotes
  - `get_user_context()` - User context retrieval
  - `get_ai_recommendations()` - AI recommendations
  - `get_recommendations()` - MCP recommendations
  - `get_market_news()` - News retrieval
  - `get_ai_health()` - Health checks
  - `get_user_profile()` - Profile retrieval
  - `update_user_profile()` - Profile updates
  - `get_user_preferences()` - Preferences retrieval
  - `update_user_preferences()` - Preferences updates
  - `handle_new_user()` - Automatic profile creation trigger

- ✅ **Database Permissions**
  - Execute permissions granted to authenticated users
  - Table permissions configured for anon/authenticated/service_role

---

## ⚠️ Section 2: Manual Tasks Required

### 🔴 **CRITICAL - Priority 1** (Must complete first)

#### ✋ Task 1.1: Set Supabase Project URL and Keys

**What:** Obtain your Supabase project URL and anon key, add them to your local `.env` file.

**Why:** The app cannot connect to Supabase without these credentials.

**Where in Supabase Dashboard:**
1. Navigate to: **Project Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

**What to Do:**
```bash
# In /Users/ritvik/Desktop/InvestX Labs/frontend/.env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
```

**Verification:**
- Start the dev server: `cd frontend && npm start`
- Check browser console for: `✅ Supabase client initialized with environment variables`
- Should NOT see: `Missing required Supabase environment variables`

**Status:** ⬜ Not Done | ✅ Complete

---

#### ✋ Task 1.2: Configure Site URL

**What:** Set the site URL to match your development and production domains.

**Why:** Required for OAuth redirects and email verification links to work correctly.

**Where in Supabase Dashboard:**
1. Navigate to: **Authentication** → **URL Configuration**
2. Find: **Site URL** field

**What to Do:**
- **Development:** Set to `http://localhost:3000`
- **Production:** Update to your production domain (e.g., `https://investx-labs.com`)

**Important Notes:**
- You can only have ONE site URL active at a time
- Switch between dev and production as needed
- Or use the "Additional Redirect URLs" feature (see Task 2.1)

**Status:** ⬜ Not Done | ✅ Complete

---

#### ✋ Task 1.3: Enable Email Authentication

**What:** Enable email/password authentication method.

**Why:** Your app uses email/password signup and login.

**Where in Supabase Dashboard:**
1. Navigate to: **Authentication** → **Providers**
2. Find: **Email** provider
3. Toggle: **Enable Email provider** to **ON**

**Configuration Options:**
- ✅ **Confirm email** - RECOMMENDED (set to enabled for production)
  - During development, you can disable this to skip email verification
  - For production, enable this for security
- **Secure email change** - RECOMMENDED (enabled)
- **Double confirm email changes** - Optional

**Status:** ⬜ Not Done | ✅ Complete

---

#### ✋ Task 1.4: Configure Email Templates

**What:** Customize email templates for signup confirmation and password reset.

**Why:** Default templates may not match your brand and might have incorrect redirect URLs.

**Where in Supabase Dashboard:**
1. Navigate to: **Authentication** → **Email Templates**
2. You'll see templates for:
   - **Confirm signup** (email verification)
   - **Magic Link**
   - **Change Email Address**
   - **Reset Password**

**What to Do:**

**A) Confirm Signup Template:**
- Ensure the confirmation link redirects to: `{{ .SiteURL }}/verify-email`
- Update the email body to match your brand
- Test variable: `{{ .ConfirmationURL }}` should work

**B) Reset Password Template:**
- Ensure the reset link redirects to: `{{ .SiteURL }}/reset-password`
- Update the email body to match your brand
- Test variable: `{{ .ConfirmationURL }}` should work

**Example Reset Password Template:**
```html
<h2>Reset Your Password</h2>
<p>Hi there,</p>
<p>You requested to reset your password for InvestX Labs.</p>
<p>Click the link below to set a new password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>If you didn't request this, you can safely ignore this email.</p>
<p>This link expires in 24 hours.</p>
```

**Testing:**
1. Try signing up with a test email
2. Check if you receive the confirmation email
3. Click the link and verify it redirects to `/verify-email`
4. Try "Forgot Password" and verify redirect to `/reset-password`

**Status:** ⬜ Not Done | ✅ Complete

---

### 🟡 **HIGH - Priority 2** (Required for full functionality)

#### ✋ Task 2.1: Configure Redirect URLs (for OAuth and Email)

**What:** Add all valid redirect URLs for OAuth callbacks and email verification.

**Why:** Supabase will reject any redirect that's not in this whitelist.

**Where in Supabase Dashboard:**
1. Navigate to: **Authentication** → **URL Configuration**
2. Find: **Redirect URLs** section
3. Click: **Add URL** for each entry

**URLs to Add:**

**Development:**
```
http://localhost:3000/verify-email
http://localhost:3000/reset-password
http://localhost:3000/login
http://localhost:3000/
http://localhost:3002/verify-email
http://localhost:3002/reset-password
http://localhost:3002/login
http://localhost:3002/
```

**Production (when ready):**
```
https://your-domain.com/verify-email
https://your-domain.com/reset-password
https://your-domain.com/login
https://your-domain.com/
```

**Important Notes:**
- Do NOT include trailing slashes
- Must match exactly (case-sensitive)
- Can use wildcards for subdomains: `https://*.yourdomain.com/*`

**Verification:**
- Try password reset flow
- Check that redirect works without errors
- Check browser console for redirect errors

**Status:** ⬜ Not Done | ✅ Complete

---

#### ✋ Task 2.2: Enable Google OAuth Provider

**What:** Configure Google OAuth for "Sign in with Google" functionality.

**Why:** Your app has `signInWithGoogle()` functionality implemented.

**Where in Supabase Dashboard:**
1. Navigate to: **Authentication** → **Providers**
2. Find: **Google** in the list
3. Toggle: **Enable Google provider** to **ON**

**Configuration Steps:**

**Step A: Get Google OAuth Credentials**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable **Google+ API**
4. Go to **APIs & Services** → **Credentials**
5. Click **Create Credentials** → **OAuth 2.0 Client ID**
6. Select **Web application**
7. Add Authorized redirect URI:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```
   (Replace `your-project` with your actual Supabase project reference)
8. Copy the **Client ID** and **Client Secret**

**Step B: Configure in Supabase**
1. Paste **Client ID** into Supabase
2. Paste **Client Secret** into Supabase
3. Save changes

**Step C: Add Authorized Domains (in Google Console)**
1. Go back to Google Cloud Console
2. Navigate to **OAuth consent screen**
3. Add your domains:
   - `localhost` (for development)
   - Your production domain
   - `your-project.supabase.co`

**Testing:**
1. Go to your login page
2. Click "Sign in with Google"
3. Should redirect to Google sign-in
4. After signing in, should redirect back to your app

**Common Issues:**
- **Error 400: redirect_uri_mismatch** → Check that Supabase callback URL matches Google Console
- **Popup blocked** → Your app handles this (check `AuthContext.js`)

**Status:** ⬜ Not Done | ✅ Complete

---

#### ✋ Task 2.3: Configure Auth Settings (Session & JWT)

**What:** Configure session timeout, JWT expiry, and refresh token settings.

**Why:** Affects how long users stay logged in and when they need to re-authenticate.

**Where in Supabase Dashboard:**
1. Navigate to: **Authentication** → **Settings**
2. Find: **Auth Settings** section

**Recommended Configuration:**

**JWT Expiry:**
- Default: `3600` seconds (1 hour)
- Recommended: Keep at 1 hour
- Your app has 30-minute client-side timeout (shorter is fine)

**Refresh Token Lifetime:**
- Default: `2592000` seconds (30 days)
- Recommended: Keep at 30 days
- Users will need to log in again after 30 days of inactivity

**Refresh Token Reuse Interval:**
- Default: `10` seconds
- Recommended: Keep at 10 seconds
- Prevents abuse of refresh tokens

**Additional Settings:**
- **Disable Signup:** ⬜ OFF (allow new users)
- **Enable Phone Auth:** ⬜ OFF (not implemented yet)
- **Enable Phone Signup:** ⬜ OFF (not implemented yet)

**Status:** ⬜ Not Done | ✅ Complete

---

### 🟢 **MEDIUM - Priority 3** (Recommended)

#### ✋ Task 3.1: Fix Table Name Mismatch

**What:** There's a mismatch between your code and database schema.

**Why:** Your `AuthContext.js` queries a `profiles` table, but your migration creates a `user_profiles` table.

**Where Found:**
- **Database:** Table is named `user_profiles` (from migration `20231021000000_initial_schema.sql`)
- **Code:** `AuthContext.js` queries `profiles` table (lines 51, 69, 138)

**Solution Options:**

**Option A: Rename Table in Database (RECOMMENDED)**
1. Navigate to: **SQL Editor** in Supabase
2. Run this SQL:
```sql
-- Rename the table
ALTER TABLE public.user_profiles RENAME TO profiles;

-- Update the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the get_user_profile function
CREATE OR REPLACE FUNCTION public.get_user_profile()
RETURNS JSON AS $$
  SELECT json_build_object(
    'id', u.id,
    'email', u.email,
    'username', p.username,
    'full_name', p.full_name,
    'avatar_url', p.avatar_url,
    'created_at', u.created_at
  )
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.id
  WHERE u.id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;
```

**Option B: Update Code to Use `user_profiles`**
- Update `AuthContext.js` to query `user_profiles` instead of `profiles`
- Less recommended because `profiles` is more conventional

**Verification:**
- Log in to the app
- Check browser console for errors
- User profile should load without 404 errors

**Status:** ⬜ Not Done | ✅ Complete

---

#### ✋ Task 3.2: Set Up Email Rate Limiting

**What:** Configure rate limiting for auth-related emails to prevent abuse.

**Why:** Prevents spam and abuse of your email sending quota.

**Where in Supabase Dashboard:**
1. Navigate to: **Authentication** → **Rate Limits**

**Recommended Settings:**
- **Email sending rate:** 4 emails per hour per user
- **SMS sending rate:** N/A (not using SMS)
- **Token refresh rate:** 10 per 10 seconds

**What to Configure:**
- Adjust if you expect legitimate users to need more than 4 auth emails/hour
- Monitor abuse patterns in **Authentication** → **Users** logs

**Status:** ⬜ Not Done | ✅ Complete

---

#### ✋ Task 3.3: Configure Password Requirements

**What:** Set minimum password strength requirements.

**Why:** Improve security by enforcing strong passwords.

**Where in Supabase Dashboard:**
1. Navigate to: **Authentication** → **Policies**

**Current Implementation:**
- Your app doesn't enforce password requirements client-side
- Supabase default: minimum 6 characters

**Recommended:**
- Minimum length: 8 characters
- Require at least one number
- Require at least one special character

**Additional Action Required:**
- Update your `SignupPage.jsx` to show password requirements
- Add client-side validation before calling `signUpUser()`

**Status:** ⬜ Not Done | ✅ Complete

---

### ⚪ **LOW - Priority 4** (Nice to have)

#### ✋ Task 4.1: Enable Database Webhooks (Optional)

**What:** Set up webhooks to trigger external actions on auth events.

**Why:** Useful for sending welcome emails, analytics, or CRM updates.

**Where in Supabase Dashboard:**
1. Navigate to: **Database** → **Webhooks**
2. Create webhook for `auth.users` table

**Example Use Cases:**
- Send welcome email when user signs up
- Notify Slack channel of new signups
- Update analytics dashboard

**Status:** ⬜ Not Done | ✅ Complete | ⬜ Not Needed

---

#### ✋ Task 4.2: Set Up Logging and Monitoring

**What:** Enable logging for authentication events.

**Where in Supabase Dashboard:**
1. Navigate to: **Logs** → **Auth Logs**

**What to Monitor:**
- Failed login attempts
- Unusual signup patterns
- OAuth errors
- Rate limit violations

**Status:** ⬜ Not Done | ✅ Complete | ⬜ Not Needed

---

#### ✋ Task 4.3: Configure SMTP for Custom Email Sending (Production)

**What:** Use your own SMTP server instead of Supabase's default email service.

**Why:** 
- Better deliverability
- Custom domain for emails (e.g., `noreply@investx-labs.com`)
- Higher sending limits

**Where in Supabase Dashboard:**
1. Navigate to: **Project Settings** → **Auth** → **SMTP Settings**
2. Enable **Custom SMTP**

**What You Need:**
- SMTP host (e.g., SendGrid, Amazon SES, Mailgun)
- SMTP port (usually 587)
- SMTP username
- SMTP password
- From email address

**When to Do This:**
- **Development:** Use Supabase's default email (fine for testing)
- **Production:** HIGHLY RECOMMENDED to use custom SMTP

**Status:** ⬜ Not Done | ✅ Complete | ⬜ Not Needed (Dev Only)

---

## 📋 Quick Reference Summary

### Must Do Immediately (CRITICAL 🔴)
1. ✋ Get Supabase URL and keys → Add to `.env`
2. ✋ Set Site URL to `http://localhost:3000`
3. ✋ Enable Email authentication
4. ✋ Configure email templates (especially password reset)

### Do Next (HIGH 🟡)
5. ✋ Add all redirect URLs (localhost + production)
6. ✋ Configure Google OAuth (if using "Sign in with Google")
7. ✋ Review JWT/session settings

### Recommended (MEDIUM 🟢)
8. ✋ Fix `profiles` vs `user_profiles` table name mismatch
9. ✋ Set up rate limiting
10. ✋ Configure password requirements

### Optional (LOW ⚪)
11. ✋ Set up webhooks (if needed)
12. ✋ Enable logging and monitoring
13. ✋ Configure custom SMTP (for production)

---

## 🧪 Testing Checklist

After completing manual tasks, test these flows:

### Email/Password Authentication
- [ ] Sign up with new email
- [ ] Receive verification email
- [ ] Click verification link → redirects to `/verify-email`
- [ ] Log in with email/password
- [ ] Session persists after page reload
- [ ] Resend verification email works

### Password Reset
- [ ] Click "Forgot Password" on login page
- [ ] Enter email and submit
- [ ] Receive password reset email
- [ ] Click reset link → redirects to `/reset-password`
- [ ] Enter new password
- [ ] Can log in with new password

### Google OAuth
- [ ] Click "Sign in with Google"
- [ ] Google sign-in popup/redirect appears
- [ ] After Google auth, redirects back to app
- [ ] User is logged in
- [ ] Profile is created automatically

### Session Management
- [ ] User stays logged in after page refresh
- [ ] After 30 minutes of inactivity, session expires (your app's timeout)
- [ ] After 30 days, refresh token expires (Supabase setting)
- [ ] Logout button clears session

### UI/UX
- [ ] Logout button appears in header when logged in
- [ ] User's name/email displays in header
- [ ] Protected routes work (if enabled)
- [ ] Error messages display correctly

---

## 🚨 Troubleshooting Common Issues

### Issue 1: "Missing required Supabase environment variables"
**Cause:** `.env` file not configured or not loaded  
**Fix:** Complete Task 1.1, restart dev server

### Issue 2: "Invalid JWT" or "Session expired"
**Cause:** JWT expired or site URL mismatch  
**Fix:** Check Task 1.2 (Site URL) and Task 2.3 (JWT settings)

### Issue 3: Password reset email not received
**Cause:** Email provider blocking, wrong email template, or email not verified  
**Fix:** 
- Check spam folder
- Complete Task 1.4 (email templates)
- Use a real email address (not temp email services)
- Check Supabase logs for email delivery status

### Issue 4: Google OAuth shows "redirect_uri_mismatch"
**Cause:** Redirect URL in Google Console doesn't match Supabase  
**Fix:** Complete Task 2.2 Step A, ensure exact match including `/auth/v1/callback`

### Issue 5: "Table 'profiles' does not exist" error
**Cause:** Table name mismatch between code and database  
**Fix:** Complete Task 3.1 (rename table or update code)

### Issue 6: RLS Policy Error - "permission denied for table"
**Cause:** RLS policies too restrictive or not applied  
**Fix:** Check Supabase SQL Editor → Run:
```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('profiles', 'user_profiles');

-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('profiles', 'user_profiles');
```

### Issue 7: Session doesn't persist after refresh
**Cause:** localStorage blocked or Supabase client config issue  
**Fix:** 
- Check browser localStorage is enabled
- Verify `persistSession: true` in `frontend/src/services/supabase/config.js` (already set)
- Check for errors in browser console

---

## 📞 Support Resources

### Supabase Documentation
- [Authentication Docs](https://supabase.com/docs/guides/auth)
- [Email Templates Guide](https://supabase.com/docs/guides/auth/auth-email-templates)
- [OAuth Setup Guide](https://supabase.com/docs/guides/auth/social-login)
- [RLS Policies Guide](https://supabase.com/docs/guides/auth/row-level-security)

### InvestX Labs Project Files
- Authentication Code: `/frontend/src/contexts/AuthContext.js`
- Auth Service: `/frontend/src/services/supabase/auth.js`
- Supabase Config: `/frontend/src/services/supabase/config.js`
- Migrations: `/backend/supabase/migrations/`
- Testing Guide: `TESTING_QUICK_REFERENCE.md`
- Implementation Details: `AUTH_IMPLEMENTATION_COMPLETE.md`
- Audit Report: `SUPABASE_AUTH_AUDIT_REPORT.md`

---

## ✅ Completion Checklist

Mark tasks as you complete them:

### Critical (Must complete)
- [ ] Task 1.1: Supabase URL and keys added to `.env`
- [ ] Task 1.2: Site URL configured
- [ ] Task 1.3: Email authentication enabled
- [ ] Task 1.4: Email templates configured

### High Priority (Should complete)
- [ ] Task 2.1: Redirect URLs configured
- [ ] Task 2.2: Google OAuth enabled (if using)
- [ ] Task 2.3: Auth settings reviewed

### Medium Priority (Recommended)
- [ ] Task 3.1: Table name mismatch fixed
- [ ] Task 3.2: Rate limiting configured
- [ ] Task 3.3: Password requirements set

### Low Priority (Optional)
- [ ] Task 4.1: Webhooks configured (if needed)
- [ ] Task 4.2: Logging enabled
- [ ] Task 4.3: Custom SMTP configured (for production)

### Testing
- [ ] All authentication flows tested
- [ ] No errors in browser console
- [ ] Email delivery verified
- [ ] OAuth flows working (if applicable)

---

## 📝 Notes Section

Use this space to track your progress, issues encountered, or environment-specific details:

```
Date: _______________
Completed by: _______________

Notes:
- 
- 
- 

Issues Encountered:
- 
- 

Environment-Specific Details:
- Supabase Project ID: _______________
- Production Domain: _______________
- Custom SMTP Provider: _______________
```

---

**End of Checklist**

> 💡 **Tip:** Print this document and check off tasks as you complete them!  
> 📧 **Questions?** Review the audit report (`SUPABASE_AUTH_AUDIT_REPORT.md`) for more context.

**Last Updated:** November 3, 2025

