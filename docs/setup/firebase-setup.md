# Firebase Setup Instructions for InvestX Labs

## ✅ Firebase Project Connected
Your InvestX Labs application is now connected to your Firebase project: **investx-labs**

## 🔧 Required Firebase Services Setup

### 1. Authentication Setup
1. Go to [Firebase Console](https://console.firebase.google.com/project/investx-labs)
2. Navigate to **Authentication > Sign-in method**
3. Enable **Email/Password** provider
4. Add authorized domains:
   - `localhost` (for development)
   - Your production domain (when you deploy)

### 2. Firestore Database Setup
1. Go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select location: **us-central1** (recommended)

### 3. Security Rules (Important!)
After creating Firestore, update the security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Portfolio data
    match /portfolios/{portfolioId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // AI suggestions
    match /suggestions/{suggestionId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Educational content (public read)
    match /educational_content/{contentId} {
      allow read: if true;
      allow write: if false; // Only admins can write
    }
    
    // User progress
    match /user_progress/{progressId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}
```

### 4. Optional: Cloud Functions
If you want to use AI features:
1. Go to **Functions**
2. Enable Cloud Functions
3. Deploy the functions from the `functions/` directory

### 5. Optional: Hosting
For deployment:
1. Go to **Hosting**
2. Get started with Firebase Hosting
3. Use `firebase deploy` to deploy your app

## 🚀 Testing the Connection

1. **Start your development server:**
   ```bash
   npm start
   ```

2. **Test authentication:**
   - Go to http://localhost:3002
   - Try signing up with a new account
   - Check Firebase Console > Authentication to see the new user

3. **Test Firestore:**
   - Sign up/login to create user data
   - Check Firebase Console > Firestore to see the data

## 🔒 Security Notes

- **Never commit API keys** to version control
- **Use environment variables** for production
- **Update security rules** before going live
- **Enable App Check** for production security

## 📱 Next Steps

1. Set up the required services above
2. Test the application functionality
3. Customize the educational content
4. Deploy to Firebase Hosting when ready

Your InvestX Labs application is now ready to use with real Firebase backend! 🎉
