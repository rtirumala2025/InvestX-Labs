# Firebase Setup Instructions

This document provides step-by-step instructions to set up Firebase for your InvestX Labs application after the security fixes have been applied.

## 🔧 Prerequisites

- Firebase CLI installed: `npm install -g firebase-tools`
- Node.js 18+ installed
- Git repository access

## 📋 Setup Steps

### 1. Environment Configuration

#### Copy Environment Template
```bash
# Copy the example file
cp .env.example .env.development

# Edit with your actual Firebase credentials
nano .env.development
```

#### Required Environment Variables
Fill in these values from your Firebase Console:

```env
# Firebase Configuration (REQUIRED)
REACT_APP_FIREBASE_API_KEY=your_actual_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 2. Firebase Console Setup

#### Enable Required Services

1. **Authentication**
   - Go to Firebase Console > Authentication > Sign-in method
   - Enable Email/Password provider
   - Enable Google provider (optional)
   - Add authorized domains:
     - `localhost` (for development)
     - Your production domain

2. **Firestore Database**
   - Go to Firestore Database
   - Create database in production mode
   - Choose location: `us-central1` (recommended)

3. **Storage** (optional)
   - Go to Storage
   - Get started with default rules

### 3. Deploy Security Rules

#### Deploy Firestore Rules
```bash
# Deploy Firestore security rules
firebase deploy --only firestore:rules

# Deploy Firestore indexes
firebase deploy --only firestore:indexes
```

#### Deploy Storage Rules (if using Storage)
```bash
# Deploy Storage security rules
firebase deploy --only storage
```

### 4. Verify Setup

#### Test Authentication
```bash
# Start development server
npm start

# Test signup/login functionality
# Check browser console for any Firebase errors
```

#### Test Firestore Access
```bash
# Check Firestore rules are working
# Try to access data without authentication (should fail)
# Try to access other users' data (should fail)
```

### 5. Production Setup

#### Create Production Environment
```bash
# Copy development environment
cp .env.development .env.production

# Update with production Firebase project credentials
nano .env.production
```

#### Deploy to Production
```bash
# Build for production
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

## 🔒 Security Checklist

- [ ] ✅ Hardcoded credentials removed from config.js
- [ ] ✅ Environment variables properly set
- [ ] ✅ Firestore security rules deployed
- [ ] ✅ Storage security rules deployed (if applicable)
- [ ] ✅ .env files added to .gitignore
- [ ] ✅ Error handling standardized
- [ ] ✅ Offline persistence enabled
- [ ] ✅ Network monitoring implemented

## 🚨 Important Security Notes

### Never Commit Credentials
- All `.env` files are in `.gitignore`
- Only commit `.env.example` with placeholder values
- Use different Firebase projects for development and production

### Test Security Rules
- Verify users can only access their own data
- Test that unauthenticated users cannot access protected data
- Ensure admin-only operations require proper authentication

### Monitor for Issues
- Check Firebase Console for authentication errors
- Monitor Firestore usage and security rule violations
- Set up alerts for unusual activity

## 🔧 Troubleshooting

### Common Issues

#### "Missing required Firebase environment variables"
- Ensure all required environment variables are set
- Check that variable names start with `REACT_APP_`
- Restart development server after changing environment variables

#### "Permission denied" errors
- Verify Firestore security rules are deployed
- Check that user is authenticated
- Ensure user is trying to access their own data

#### "Network error" messages
- Check internet connection
- Verify Firebase project is active
- Check Firebase Console for service status

#### Offline persistence not working
- Check browser console for persistence errors
- Ensure browser supports IndexedDB
- Try in incognito mode to test without cached data

### Getting Help

1. Check Firebase Console for error logs
2. Review browser console for client-side errors
3. Check Firebase documentation for specific error codes
4. Verify all environment variables are correctly set

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Firebase Hosting](https://firebase.google.com/docs/hosting)

## 🎯 Next Steps

After completing this setup:

1. Test all authentication flows
2. Verify data access controls
3. Test offline functionality
4. Set up monitoring and alerts
5. Plan for production deployment
6. Consider implementing additional security measures (2FA, etc.)

---

**Remember**: Security is an ongoing process. Regularly review and update your security rules, monitor for unusual activity, and keep Firebase services updated.
