# Google Sign-In Setup Guide for InvestX Labs

## 🔧 Firebase Configuration Issues

The Google sign-in is currently not working because Firebase is not properly configured. Here's how to fix it:

## 📋 Prerequisites

1. **Firebase Project**: You need a Firebase project set up
2. **Google Cloud Console**: Access to Google Cloud Console
3. **Domain Configuration**: Your domain must be authorized

## 🚀 Step-by-Step Setup

### 1. Create/Configure Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable Authentication:
   - Go to Authentication → Sign-in method
   - Enable "Google" provider
   - Add your domain to authorized domains

### 2. Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Click "Add app" → Web app
4. Copy the configuration object

### 3. Update Environment Variables

Replace the placeholder values in `.env` file:

```env
# Replace these with your actual Firebase config values
REACT_APP_FIREBASE_API_KEY=AIzaSyC...your_actual_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-actual-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789012
REACT_APP_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
REACT_APP_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 4. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to "APIs & Services" → "Credentials"
4. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized JavaScript origins: 
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:3000/__/auth/handler` (for development)
     - `https://yourdomain.com/__/auth/handler` (for production)

### 5. Enable Required APIs

In Google Cloud Console, enable these APIs:
- Google+ API
- Google Identity API
- Firebase Authentication API

## 🔍 Common Issues & Solutions

### Issue 1: "Popup blocked"
**Solution**: 
- Allow popups for your domain
- Use the popup blocker detection utility we added

### Issue 2: "Invalid client ID"
**Solution**: 
- Check OAuth client configuration
- Ensure authorized domains match your app domain

### Issue 3: "Firebase not configured"
**Solution**: 
- Verify all environment variables are set correctly
- Restart the development server after updating .env

### Issue 4: "Operation not allowed"
**Solution**: 
- Enable Google sign-in in Firebase Authentication
- Check that the provider is properly configured

## 🧪 Testing

1. Start the development server: `npm start`
2. Go to login/signup page
3. Click "Sign in with Google"
4. Should open Google OAuth popup
5. Complete authentication flow

## 🔒 Security Notes

- Never commit real Firebase credentials to version control
- Use environment variables for all sensitive data
- Regularly rotate API keys
- Monitor authentication logs in Firebase Console

## 📞 Support

If you continue to have issues:
1. Check browser console for detailed error messages
2. Verify Firebase project configuration
3. Test with a fresh browser session
4. Check network connectivity

## 🎯 Next Steps

Once Google sign-in is working:
1. Test user profile creation
2. Verify Firestore integration
3. Test sign-out functionality
4. Implement additional OAuth providers if needed
