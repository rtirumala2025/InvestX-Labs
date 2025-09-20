# 🔥 Firestore Database Setup Guide

## ✅ What We've Set Up

### 1. **Database Structure**
Your Firestore database is now organized with these collections:

- **`users`** - User profiles and settings
- **`portfolios`** - User investment portfolios
- **`holdings`** - Individual stock/investment holdings
- **`suggestions`** - AI-generated investment suggestions
- **`educational_content`** - Learning materials and courses
- **`user_progress`** - User learning progress and achievements
- **`market_data`** - Real-time market data and stock prices
- **`market_news`** - Financial news and updates

### 2. **Security Rules**
- ✅ Users can only access their own data
- ✅ Educational content is publicly readable
- ✅ Market data is publicly readable
- ✅ Admin-only write access for system data

### 3. **Services Created**
- ✅ **User Service** - Profile management, goals, risk tolerance
- ✅ **Portfolio Service** - Portfolio creation, holdings management
- ✅ **Educational Service** - Content delivery, progress tracking
- ✅ **Market Data Service** - Stock data, news, price history

## 🚀 Next Steps

### Step 1: Test the Database
1. **Start your app:**
   ```bash
   npm start
   ```

2. **Create a test account:**
   - Sign up with email or Google
   - Check Firebase Console > Firestore to see data being created

### Step 2: Initialize Sample Data
Run this in your browser console to add sample educational content:

```javascript
// Import the setup script
import { initializeFirestore } from './firestore-setup.js';

// Initialize the database
await initializeFirestore();
```

### Step 3: Test User Features
1. **User Profile:**
   - Sign up → Profile created automatically
   - Update risk tolerance
   - Add investment goals

2. **Portfolio Management:**
   - Create a portfolio
   - Add stock holdings
   - View performance metrics

3. **Educational Content:**
   - Browse learning materials
   - Track progress
   - Complete courses

## 📊 Database Schema

### Users Collection
```javascript
{
  userId: "user123",
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  riskTolerance: "moderate",
  investmentGoals: [
    {
      id: "goal1",
      title: "Retirement",
      targetAmount: 1000000,
      targetDate: "2050-01-01",
      currentAmount: 50000
    }
  ],
  experienceLevel: "beginner",
  notifications: {
    email: true,
    push: true,
    marketUpdates: true
  },
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z"
}
```

### Portfolios Collection
```javascript
{
  portfolioId: "portfolio123",
  userId: "user123",
  name: "My Investment Portfolio",
  description: "Long-term growth portfolio",
  totalValue: 50000,
  totalCost: 45000,
  totalGainLoss: 5000,
  totalGainLossPercent: 11.11,
  holdings: [
    {
      id: "holding1",
      symbol: "AAPL",
      name: "Apple Inc.",
      shares: 10,
      averagePrice: 150.00,
      currentPrice: 155.00,
      totalValue: 1550.00,
      gainLoss: 50.00,
      gainLossPercent: 3.33
    }
  ],
  performance: {
    daily: 0.5,
    weekly: 2.1,
    monthly: 8.5,
    yearly: 15.2
  },
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z"
}
```

### Educational Content Collection
```javascript
{
  id: "intro-to-investing",
  title: "Introduction to Investing",
  category: "beginner",
  content: "Learn the basics of investing...",
  difficulty: "beginner",
  estimatedTime: "15 minutes",
  tags: ["stocks", "bonds", "mutual funds"],
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z"
}
```

## 🔧 Usage Examples

### Create User Profile
```javascript
import { createUserProfile } from './services/firebase/userService';

const profile = await createUserProfile(userId, {
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com"
});
```

### Create Portfolio
```javascript
import { createPortfolio } from './services/firebase/portfolioService';

const portfolio = await createPortfolio(userId, {
  name: "My Portfolio",
  description: "Long-term growth"
});
```

### Add Stock Holding
```javascript
import { addHolding } from './services/firebase/portfolioService';

await addHolding(portfolioId, {
  symbol: "AAPL",
  name: "Apple Inc.",
  shares: 10,
  averagePrice: 150.00
});
```

### Get Educational Content
```javascript
import { getAllEducationalContent } from './services/firebase/educationalService';

const content = await getAllEducationalContent();
```

## 📈 Scaling Considerations

### Current Limits (Free Tier)
- **1GB storage** - ~100,000 user profiles
- **50,000 reads/day** - ~1,500 active users
- **20,000 writes/day** - ~650 transactions/day

### Optimization Tips
1. **Efficient queries** - Use indexes for common searches
2. **Data structure** - Store only necessary data
3. **Caching** - Cache frequently accessed data
4. **Batch operations** - Group multiple operations

### When to Upgrade
- **1,500+ daily active users**
- **Exceeding read/write limits**
- **Need for advanced features**

## 🎯 Ready to Go!

Your Firestore database is now set up and ready for your InvestX Labs platform. You can:

1. ✅ **Test authentication** - Sign up/login works
2. ✅ **Create user profiles** - Data stored securely
3. ✅ **Manage portfolios** - Add/edit investments
4. ✅ **Track learning** - Educational content system
5. ✅ **Access market data** - Stock prices and news

Start building your features and let me know if you need help with any specific functionality!
