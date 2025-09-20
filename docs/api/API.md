# InvestX Labs API Documentation

## Overview

This document describes the API endpoints and services available in the InvestX Labs application. The API is built using Firebase services including Authentication, Firestore, and Cloud Functions.

## Base URLs

- **Development**: `http://localhost:5000`
- **Production**: `https://investx-labs.web.app`
- **Firebase Functions**: `https://us-central1-your-project-id.cloudfunctions.net`

## Authentication

All protected endpoints require a valid Firebase Authentication token. Include the token in the Authorization header:

```
Authorization: Bearer <firebase-auth-token>
```

## Firebase Services

### Authentication

#### Sign Up
```javascript
// Client-side usage
import { createUserWithEmailAndPassword } from 'firebase/auth';

const signUp = async (email, password, additionalData) => {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  // Additional profile setup
  return user;
};
```

#### Sign In
```javascript
import { signInWithEmailAndPassword } from 'firebase/auth';

const signIn = async (email, password) => {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
};
```

#### Sign Out
```javascript
import { signOut } from 'firebase/auth';

const signOut = async () => {
  await signOut(auth);
};
```

### Firestore Database

#### User Profile

**Create User Profile**
```javascript
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const createUserProfile = async (uid, profileData) => {
  const userDoc = {
    uid,
    email: profileData.email,
    profile: {
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      age: profileData.age,
      monthlyAllowance: profileData.monthlyAllowance,
      investmentGoals: profileData.investmentGoals,
      riskTolerance: profileData.riskTolerance,
      interests: profileData.interests
    },
    onboardingCompleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  
  await setDoc(doc(db, 'users', uid), userDoc);
  return userDoc;
};
```

**Update User Profile**
```javascript
import { doc, updateDoc } from 'firebase/firestore';

const updateUserProfile = async (uid, updates) => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
};
```

#### Portfolio Management

**Create Portfolio**
```javascript
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const createPortfolio = async (userId) => {
  const portfolioDoc = {
    userId,
    holdings: [],
    totalValue: 0,
    totalCostBasis: 0,
    totalGainLoss: 0,
    totalGainLossPercentage: 0,
    diversificationScore: 0,
    riskScore: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  
  const portfolioRef = await addDoc(collection(db, 'portfolios'), portfolioDoc);
  return { id: portfolioRef.id, ...portfolioDoc };
};
```

**Add Holding**
```javascript
const addHolding = async (portfolioId, holding) => {
  const portfolioRef = doc(db, 'portfolios', portfolioId);
  const portfolioDoc = await getDoc(portfolioRef);
  
  if (portfolioDoc.exists()) {
    const currentHoldings = portfolioDoc.data().holdings || [];
    const updatedHoldings = [...currentHoldings, {
      ...holding,
      id: Date.now().toString(),
      addedAt: serverTimestamp()
    }];
    
    await updateDoc(portfolioRef, {
      holdings: updatedHoldings,
      updatedAt: serverTimestamp()
    });
  }
};
```

**Update Holding**
```javascript
const updateHolding = async (portfolioId, holdingId, updates) => {
  const portfolioRef = doc(db, 'portfolios', portfolioId);
  const portfolioDoc = await getDoc(portfolioRef);
  
  if (portfolioDoc.exists()) {
    const holdings = portfolioDoc.data().holdings;
    const updatedHoldings = holdings.map(holding => 
      holding.id === holdingId 
        ? { ...holding, ...updates, updatedAt: serverTimestamp() }
        : holding
    );
    
    await updateDoc(portfolioRef, {
      holdings: updatedHoldings,
      updatedAt: serverTimestamp()
    });
  }
};
```

#### AI Suggestions

**Save Suggestion**
```javascript
const saveSuggestion = async (userId, suggestionData) => {
  const suggestionDoc = {
    userId,
    type: suggestionData.type, // 'investment', 'rebalance', 'education'
    title: suggestionData.title,
    description: suggestionData.description,
    reasoning: suggestionData.reasoning,
    confidence: suggestionData.confidence,
    sourceStrategy: suggestionData.sourceStrategy,
    status: 'pending',
    createdAt: serverTimestamp(),
    expiresAt: suggestionData.expiresAt
  };
  
  const suggestionRef = await addDoc(collection(db, 'suggestions'), suggestionDoc);
  return { id: suggestionRef.id, ...suggestionDoc };
};
```

**Get User Suggestions**
```javascript
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';

const getUserSuggestions = async (userId) => {
  const q = query(
    collection(db, 'suggestions'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
```

## Cloud Functions

### AI Suggestions

#### Generate Personalized Suggestions
```javascript
import { httpsCallable } from 'firebase/functions';

const generatePersonalizedSuggestions = httpsCallable(functions, 'generatePersonalizedSuggestions');

const getSuggestions = async (userProfile, portfolioData) => {
  try {
    const result = await generatePersonalizedSuggestions({
      userProfile,
      portfolioData
    });
    
    return result.data;
  } catch (error) {
    console.error('Error generating suggestions:', error);
    throw error;
  }
};
```

**Request Body:**
```json
{
  "userProfile": {
    "age": 16,
    "monthlyAllowance": 100,
    "investmentGoals": ["College Fund", "First Car"],
    "riskTolerance": "moderate",
    "interests": ["technology", "renewable-energy"]
  },
  "portfolioData": {
    "holdings": [...],
    "totalValue": 1000,
    "diversificationScore": 65
  }
}
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "suggestions": [
    {
      "id": "suggestion_1",
      "type": "investment",
      "title": "Consider Adding Microsoft (MSFT)",
      "description": "Microsoft offers strong growth potential...",
      "reasoning": "Based on your interest in technology...",
      "confidence": 85,
      "sourceStrategy": "acorns"
    }
  ]
}
```

#### Generate Risk Assessment
```javascript
const generateRiskAssessment = httpsCallable(functions, 'generateRiskAssessment');

const assessRisk = async (quizResponses) => {
  try {
    const result = await generateRiskAssessment({
      quizResponses
    });
    
    return result.data;
  } catch (error) {
    console.error('Error generating risk assessment:', error);
    throw error;
  }
};
```

**Request Body:**
```json
{
  "quizResponses": [
    {
      "questionId": "risk_1",
      "answer": "moderate",
      "weight": 0.3
    },
    {
      "questionId": "risk_2", 
      "answer": "conservative",
      "weight": 0.2
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "riskProfile": {
    "level": "moderate",
    "score": 65,
    "recommendations": {
      "stockAllocation": 60,
      "bondAllocation": 30,
      "cashAllocation": 10
    }
  }
}
```

#### Generate Explanation
```javascript
const generateExplanation = httpsCallable(functions, 'generateExplanation');

const getExplanation = async (concept, userLevel, context) => {
  try {
    const result = await generateExplanation({
      concept,
      userLevel,
      context
    });
    
    return result.data;
  } catch (error) {
    console.error('Error generating explanation:', error);
    throw error;
  }
};
```

### Portfolio Calculations

#### Calculate Portfolio Metrics
```javascript
const calculatePortfolioMetrics = httpsCallable(functions, 'calculatePortfolioMetrics');

const getPortfolioMetrics = async (holdings) => {
  try {
    const result = await calculatePortfolioMetrics({
      holdings
    });
    
    return result.data;
  } catch (error) {
    console.error('Error calculating portfolio metrics:', error);
    throw error;
  }
};
```

**Request Body:**
```json
{
  "holdings": [
    {
      "symbol": "AAPL",
      "shares": 2,
      "purchasePrice": 150.00,
      "currentPrice": 175.50,
      "purchaseDate": "2024-01-01"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "metrics": {
    "totalValue": 351.00,
    "totalCostBasis": 300.00,
    "totalGainLoss": 51.00,
    "totalGainLossPercentage": 17.0,
    "diversificationScore": 65,
    "riskScore": 45
  }
}
```

### Market Data

#### Update Stock Prices
```javascript
const updateStockPrices = httpsCallable(functions, 'updateStockPrices');

const refreshStockPrices = async () => {
  try {
    const result = await updateStockPrices();
    return result.data;
  } catch (error) {
    console.error('Error updating stock prices:', error);
    throw error;
  }
};
```

#### Fetch Market Data
```javascript
const fetchMarketData = httpsCallable(functions, 'fetchMarketData');

const getMarketData = async (symbols) => {
  try {
    const result = await fetchMarketData({
      symbols: symbols.join(',')
    });
    
    return result.data;
  } catch (error) {
    console.error('Error fetching market data:', error);
    throw error;
  }
};
```

## External APIs

### Yahoo Finance API

#### Get Stock Price
```javascript
const fetchStockPrice = async (symbol) => {
  try {
    const response = await axios.get(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`
    );
    
    const result = response.data.chart.result[0];
    return {
      symbol: result.meta.symbol,
      price: result.meta.regularMarketPrice,
      change: result.meta.regularMarketPrice - result.meta.previousClose,
      changePercent: ((result.meta.regularMarketPrice - result.meta.previousClose) / result.meta.previousClose) * 100
    };
  } catch (error) {
    console.error(`Failed to fetch price for ${symbol}:`, error);
    throw error;
  }
};
```

### OpenAI API

#### Generate AI Suggestion
```javascript
const generateAISuggestion = async (userProfile, portfolioData) => {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an educational investment advisor for high school students...'
          },
          {
            role: 'user',
            content: `Generate investment suggestions for a ${userProfile.age}-year-old student...`
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating AI suggestion:', error);
    throw error;
  }
};
```

## Error Handling

### Common Error Codes

- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

### Error Response Format
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request data is invalid",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  }
}
```

## Rate Limits

- **Firebase Authentication**: 10 requests per minute per IP
- **Firestore**: 50,000 reads per day (free tier)
- **Cloud Functions**: 125,000 invocations per month (free tier)
- **OpenAI API**: Based on your plan limits

## Security Considerations

1. **Authentication**: All protected endpoints require valid Firebase tokens
2. **Data Validation**: Input validation on both client and server
3. **Rate Limiting**: Implement rate limiting for API calls
4. **CORS**: Configure CORS for cross-origin requests
5. **Environment Variables**: Keep API keys secure and use environment variables

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### API Testing with Postman
Import the Postman collection from `docs/postman/` to test API endpoints.

## Support

For API support and questions:
- **Documentation**: Check this API documentation
- **Issues**: Report bugs on GitHub Issues
- **Email**: api-support@investxlabs.com
