# InvestX Labs Deployment Guide

This guide covers deploying the InvestX Labs application to production using Firebase Hosting and Cloud Functions.

## Prerequisites

- Node.js 18+ and npm
- Firebase CLI installed and configured
- Firebase project with required services enabled
- Domain name (optional, for custom domain)

## Firebase Project Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `investx-labs`
4. Enable Google Analytics (optional)
5. Create project

### 2. Enable Required Services

#### Authentication
1. Go to Authentication > Sign-in method
2. Enable Email/Password provider
3. Configure authorized domains

#### Firestore Database
1. Go to Firestore Database
2. Create database in production mode
3. Choose location (us-central1 recommended)

#### Cloud Functions
1. Go to Functions
2. Enable Cloud Functions
3. Choose Node.js 18 runtime

#### Hosting
1. Go to Hosting
2. Get started with Firebase Hosting

### 3. Configure Security Rules

#### Firestore Rules
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

#### Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Environment Configuration

### 1. Production Environment Variables

Create a `.env.production` file:

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_production_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=investx-labs.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=investx-labs
REACT_APP_FIREBASE_STORAGE_BUCKET=investx-labs.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

# OpenAI Configuration
REACT_APP_OPENAI_API_KEY=your_production_openai_key

# Production Settings
REACT_APP_ENVIRONMENT=production
REACT_APP_ENABLE_AI_SUGGESTIONS=true
REACT_APP_ENABLE_REAL_MARKET_DATA=true
REACT_APP_USE_MOCK_DATA=false
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_DEBUG_MODE=false
```

### 2. Firebase Configuration

Update `src/services/firebase/config.js`:

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

export default app;
```

## Build and Deploy

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install functions dependencies
cd functions
npm install
cd ..
```

### 2. Build the Application

```bash
# Build React app
npm run build

# Build functions (if needed)
cd functions
npm run build
cd ..
```

### 3. Deploy to Firebase

#### Deploy Everything
```bash
firebase deploy
```

#### Deploy Specific Services
```bash
# Deploy only hosting
firebase deploy --only hosting

# Deploy only functions
firebase deploy --only functions

# Deploy only firestore rules
firebase deploy --only firestore:rules

# Deploy only storage rules
firebase deploy --only storage
```

### 4. Verify Deployment

1. Check Firebase Console for deployment status
2. Visit your hosted URL
3. Test authentication flow
4. Verify Cloud Functions are working
5. Check Firestore data access

## Custom Domain Setup

### 1. Add Custom Domain

1. Go to Firebase Console > Hosting
2. Click "Add custom domain"
3. Enter your domain name
4. Follow verification steps

### 2. DNS Configuration

Add the following DNS records:

```
Type: A
Name: @
Value: 151.101.1.195
TTL: 300

Type: A
Name: @
Value: 151.101.65.195
TTL: 300

Type: CNAME
Name: www
Value: investx-labs.web.app
TTL: 300
```

### 3. SSL Certificate

Firebase automatically provisions SSL certificates for custom domains.

## Monitoring and Analytics

### 1. Firebase Analytics

Enable Firebase Analytics in your project:

1. Go to Analytics > Events
2. Set up custom events for user interactions
3. Monitor user engagement and retention

### 2. Performance Monitoring

Enable Firebase Performance Monitoring:

1. Go to Performance > Overview
2. Monitor app performance metrics
3. Set up alerts for performance issues

### 3. Error Reporting

Enable Firebase Crashlytics:

1. Go to Crashlytics
2. Monitor app crashes and errors
3. Set up alerts for critical issues

## CI/CD Pipeline

### 1. GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install Firebase CLI
      run: npm install -g firebase-tools
    
    - name: Build
      run: npm run build
      env:
        REACT_APP_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
        REACT_APP_FIREBASE_AUTH_DOMAIN: ${{ secrets.FIREBASE_AUTH_DOMAIN }}
        REACT_APP_FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
        REACT_APP_FIREBASE_STORAGE_BUCKET: ${{ secrets.FIREBASE_STORAGE_BUCKET }}
        REACT_APP_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.FIREBASE_MESSAGING_SENDER_ID }}
        REACT_APP_FIREBASE_APP_ID: ${{ secrets.FIREBASE_APP_ID }}
        REACT_APP_OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
    
    - name: Deploy to Firebase
      run: firebase deploy --token ${{ secrets.FIREBASE_TOKEN }}
```

### 2. Environment Secrets

Add the following secrets to your GitHub repository:

- `FIREBASE_TOKEN`: Firebase CI token
- `FIREBASE_API_KEY`: Firebase API key
- `FIREBASE_AUTH_DOMAIN`: Firebase auth domain
- `FIREBASE_PROJECT_ID`: Firebase project ID
- `FIREBASE_STORAGE_BUCKET`: Firebase storage bucket
- `FIREBASE_MESSAGING_SENDER_ID`: Firebase messaging sender ID
- `FIREBASE_APP_ID`: Firebase app ID
- `OPENAI_API_KEY`: OpenAI API key

## Database Seeding

### 1. Seed Educational Content

```javascript
// scripts/seedEducationalContent.js
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const seedEducationalContent = async () => {
  const educationalContent = [
    {
      id: 'basics-stocks',
      title: 'What Are Stocks?',
      content: '...',
      difficulty: 'beginner',
      estimatedTime: 10,
      category: 'fundamentals'
    }
    // More content...
  ];
  
  educationalContent.forEach(async (content) => {
    await addDoc(collection(db, 'educational_content'), content);
  });
};

seedEducationalContent();
```

### 2. Seed Investment Strategies

```javascript
// scripts/seedInvestmentStrategies.js
import { INVESTMENT_STRATEGIES } from '../src/data/investmentStrategies';

const seedInvestmentStrategies = async () => {
  Object.entries(INVESTMENT_STRATEGIES).forEach(async ([key, strategy]) => {
    await addDoc(collection(db, 'investment_strategies'), {
      id: key,
      ...strategy
    });
  });
};

seedInvestmentStrategies();
```

## Performance Optimization

### 1. Code Splitting

Implement code splitting for better performance:

```javascript
// Lazy load components
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'));

// Use Suspense
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/dashboard" element={<DashboardPage />} />
    <Route path="/portfolio" element={<PortfolioPage />} />
  </Routes>
</Suspense>
```

### 2. Image Optimization

- Use WebP format for images
- Implement lazy loading
- Use responsive images
- Compress images before upload

### 3. Caching Strategy

Configure caching headers in `firebase.json`:

```json
{
  "hosting": {
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

## Security Checklist

- [ ] Firebase security rules configured
- [ ] Environment variables secured
- [ ] API keys not exposed in client code
- [ ] HTTPS enabled
- [ ] CORS configured properly
- [ ] Input validation implemented
- [ ] Rate limiting configured
- [ ] Error handling implemented
- [ ] Logging configured
- [ ] Monitoring set up

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check for TypeScript errors

2. **Deployment Failures**
   - Verify Firebase CLI is logged in
   - Check Firebase project configuration
   - Verify environment variables

3. **Function Timeouts**
   - Increase function timeout in `firebase.json`
   - Optimize function code
   - Check external API response times

4. **Database Connection Issues**
   - Verify Firestore rules
   - Check authentication status
   - Verify project ID configuration

### Debug Commands

```bash
# Check Firebase CLI status
firebase projects:list

# View deployment logs
firebase functions:log

# Test functions locally
firebase emulators:start

# Check hosting status
firebase hosting:channel:list
```

## Rollback Strategy

### 1. Rollback Hosting

```bash
# List previous deployments
firebase hosting:releases:list

# Rollback to previous version
firebase hosting:releases:rollback <release-id>
```

### 2. Rollback Functions

```bash
# List function versions
firebase functions:list

# Rollback function
firebase functions:rollback <function-name>
```

## Maintenance

### 1. Regular Updates

- Update dependencies monthly
- Monitor security advisories
- Update Firebase SDK versions
- Review and update security rules

### 2. Monitoring

- Set up alerts for errors
- Monitor performance metrics
- Track user engagement
- Monitor API usage and costs

### 3. Backup Strategy

- Export Firestore data regularly
- Backup Cloud Functions code
- Document configuration changes
- Maintain deployment history

## Support

For deployment issues:
- **Firebase Documentation**: [firebase.google.com/docs](https://firebase.google.com/docs)
- **Firebase Support**: [firebase.google.com/support](https://firebase.google.com/support)
- **GitHub Issues**: Report deployment issues on GitHub
- **Email**: deployment@investxlabs.com
