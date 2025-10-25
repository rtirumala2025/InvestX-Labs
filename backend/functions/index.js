const { onRequest } = require('firebase-functions/v2/https');
const { onCall } = require('firebase-functions/v2/https');
const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const cors = require('cors');
const { handleChatMessage } = require('./chat/chatService');
const { getStockQuote, getMarketNews } = require('../market/marketService');

// Configure CORS
const corsHandler = cors({
  origin: [
    'http://localhost:3000',
    'https://investx-labs.web.app',
    'https://investx-labs.firebaseapp.com'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();
const auth = getAuth();

// AI Suggestion Generation
const generateAISuggestions = require('./ai/suggestions');
const generateRiskAssessment = require('./ai/riskAssessment');
const generateExplanation = require('./ai/explanationGenerator');

// Portfolio Calculations
const calculatePortfolioMetrics = require('./portfolio/calculations');
const updatePortfolioPerformance = require('./portfolio/performanceTracking');

// Market Data
const fetchMarketData = require('./market/marketData');
const updateStockPrices = require('./market/stockPrices');

// User Management
const createUserProfile = require('./users/userManagement');
const updateUserProgress = require('./users/progressTracking');

// Market Data Endpoints
exports.marketData = onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    // Send response to OPTIONS requests
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).send('');
    return;
  }

  try {
    const { symbol } = req.query;
    
    if (!symbol) {
      res.status(400).json({ error: 'Symbol parameter is required' });
      return;
    }

    const quote = await getStockQuote(symbol);
    res.status(200).json(quote);
  } catch (error) {
    console.error('Error in market data endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to fetch market data',
      details: error.message 
    });
  }
});

exports.marketNews = onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    // Send response to OPTIONS requests
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).send('');
    return;
  }

  try {
    const news = await getMarketNews();
    res.status(200).json(news);
  } catch (error) {
    console.error('Error in market news endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to fetch market news',
      details: error.message 
    });
  }
});

// Export Cloud Functions
exports.generatePersonalizedSuggestions = onCall(async (request) => {
  if (!request.auth) {
    throw new Error('User must be authenticated');
  }
  
  const userId = request.auth.uid;
  const { userProfile, portfolioData } = request.data;
  
  try {
    const suggestions = await generateAISuggestions(userProfile, portfolioData);
    
    // Save suggestions to Firestore
    const batch = db.batch();
    suggestions.forEach(suggestion => {
      const suggestionRef = db.collection('suggestions').doc();
      batch.set(suggestionRef, {
        ...suggestion,
        userId,
        createdAt: new Date(),
        status: 'pending'
      });
    });
    
    await batch.commit();
    return { success: true, count: suggestions.length };
  } catch (error) {
    console.error('Error generating suggestions:', error);
    throw new Error('Failed to generate suggestions');
  }
});

exports.generateRiskAssessment = onCall(async (request) => {
  if (!request.auth) {
    throw new Error('User must be authenticated');
  }
  
  const userId = request.auth.uid;
  const { quizResponses } = request.data;
  
  try {
    const riskProfile = await generateRiskAssessment(quizResponses);
    
    // Update user profile with risk assessment
    await db.collection('users').doc(userId).update({
      'profile.riskTolerance': riskProfile.level,
      'profile.riskScore': riskProfile.score,
      'profile.riskAssessment': riskProfile,
      updatedAt: new Date()
    });
    
    return { success: true, riskProfile };
  } catch (error) {
    console.error('Error generating risk assessment:', error);
    throw new Error('Failed to generate risk assessment');
  }
});

exports.generateExplanation = onCall(async (request) => {
  if (!request.auth) {
    throw new Error('User must be authenticated');
  }
  
  const { concept, userLevel, context } = request.data;
  
  try {
    const explanation = await generateExplanation(concept, userLevel, context);
    return { success: true, explanation };
  } catch (error) {
    console.error('Error generating explanation:', error);
    throw new Error('Failed to generate explanation');
  }
});

exports.calculatePortfolioMetrics = onCall(async (request) => {
  if (!request.auth) {
    throw new Error('User must be authenticated');
  }
  
  const userId = request.auth.uid;
  const { holdings } = request.data;
  
  try {
    const metrics = await calculatePortfolioMetrics(holdings);
    
    // Update portfolio with calculated metrics
    const portfolioRef = db.collection('portfolios').where('userId', '==', userId);
    const portfolioSnapshot = await portfolioRef.get();
    
    if (!portfolioSnapshot.empty) {
      const portfolioDoc = portfolioSnapshot.docs[0];
      await portfolioDoc.ref.update({
        ...metrics,
        updatedAt: new Date()
      });
    }
    
    return { success: true, metrics };
  } catch (error) {
    console.error('Error calculating portfolio metrics:', error);
    throw new Error('Failed to calculate portfolio metrics');
  }
});

exports.updateStockPrices = onRequest(async (req, res) => {
  try {
    const updatedPrices = await updateStockPrices();
    res.json({ success: true, updated: updatedPrices.length });
  } catch (error) {
    console.error('Error updating stock prices:', error);
    res.status(500).json({ error: 'Failed to update stock prices' });
  }
});

exports.fetchMarketData = onRequest(async (req, res) => {
  try {
    const { symbols } = req.query;
    const symbolsArray = symbols ? symbols.split(',') : [];
    
    const marketData = await fetchMarketData(symbolsArray);
    res.json({ success: true, data: marketData });
  } catch (error) {
    console.error('Error fetching market data:', error);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
});

// Firestore Triggers
exports.onUserCreated = onDocumentCreated('users/{userId}', async (event) => {
  const userData = event.data.data();
  const userId = event.params.userId;
  
  try {
    // Create initial portfolio
    await db.collection('portfolios').add({
      userId,
      holdings: [],
      totalValue: 0,
      totalCostBasis: 0,
      totalGainLoss: 0,
      totalGainLossPercentage: 0,
      diversificationScore: 0,
      riskScore: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Create user progress tracking
    await db.collection('user_progress').add({
      userId,
      completedModules: [],
      earnedBadges: [],
      totalLearningTime: 0,
      lastActiveAt: new Date(),
      createdAt: new Date()
    });
    
    console.log(`Initialized user data for ${userId}`);
  } catch (error) {
    console.error(`Error initializing user data for ${userId}:`, error);
  }
});

exports.onPortfolioUpdated = onDocumentUpdated('portfolios/{portfolioId}', async (event) => {
  const portfolioData = event.data.after.data();
  const portfolioId = event.params.portfolioId;
  
  try {
    // Update portfolio performance tracking
    await updatePortfolioPerformance(portfolioId, portfolioData);
    console.log(`Updated portfolio performance for ${portfolioId}`);
  } catch (error) {
    console.error(`Error updating portfolio performance for ${portfolioId}:`, error);
  }
});

exports.onSuggestionCreated = onDocumentCreated('suggestions/{suggestionId}', async (event) => {
  const suggestionData = event.data.data();
  const suggestionId = event.params.suggestionId;
  
  try {
    // Send notification to user (if notifications are enabled)
    // This could integrate with Firebase Cloud Messaging
    console.log(`New suggestion created: ${suggestionId}`);
  } catch (error) {
    console.error(`Error processing suggestion ${suggestionId}:`, error);
  }
});

// Scheduled Functions (using Firebase Functions v2)
const { onSchedule } = require('firebase-functions/v2/scheduler');

exports.dailyMarketUpdate = onSchedule('0 9 * * *', async (event) => {
  try {
    console.log('Running daily market update...');
    await updateStockPrices();
    console.log('Daily market update completed');
  } catch (error) {
    console.error('Error in daily market update:', error);
  }
});

exports.weeklyPortfolioAnalysis = onSchedule('0 10 * * 1', async (event) => {
  try {
    console.log('Running weekly portfolio analysis...');
    
    // Get all portfolios
    const portfoliosSnapshot = await db.collection('portfolios').get();
    
    for (const portfolioDoc of portfoliosSnapshot.docs) {
      const portfolioData = portfolioDoc.data();
      await updatePortfolioPerformance(portfolioDoc.id, portfolioData);
    }
    
    console.log('Weekly portfolio analysis completed');
  } catch (error) {
    console.error('Error in weekly portfolio analysis:', error);
  }
});

// Chat Endpoint
exports.chat = onRequest(async (req, res) => {
  console.log('Received chat request:', {
    method: req.method,
    headers: req.headers,
    body: req.body
  });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return corsHandler(req, res, () => {
      res.status(204).send('');
    });
  }

  // Handle actual request with CORS
  return corsHandler(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        console.error('Method not allowed:', req.method);
        return res.status(405).json({ 
          error: 'Method not allowed',
          allowed: ['POST']
        });
      }

      console.log('Processing chat message:', req.body);
      const { message, userId = 'anonymous', sessionId = 'default' } = req.body;

      if (!message) {
        console.error('No message provided in request');
        return res.status(400).json({ 
          error: 'Message is required',
          received: req.body
        });
      }

      console.log('Calling handleChatMessage with:', { message, userId, sessionId });
      const response = await handleChatMessage(message, userId, sessionId);
      
      console.log('Sending response:', response);
      res.json(response);
      
    } catch (error) {
      console.error('Error in chat endpoint:', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });
      
      res.status(500).json({ 
        error: 'Failed to process chat message',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString()
      });
    }
  });
});

// Health Check Endpoint
exports.healthCheck = onRequest(async (req, res) => {
  cors(req, res, () => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });
});
