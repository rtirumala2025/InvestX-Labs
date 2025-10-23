import express from 'express';
import { aiEngine } from '../ai-services/aiEngine.js';
import { dataInsights } from '../ai-services/dataInsights.js';
import { ruleBase } from '../ai-services/ruleBase.js';
import { createApiResponse, validateInvestmentParams } from '../ai-services/utils.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * @swagger
 * /api/ai/recommendations:
 *   post:
 *     summary: Get AI-powered investment recommendations
 *     description: Provides educational investment recommendations based on user profile and market data
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: Unique identifier for the user
 *               age:
 *                 type: number
 *                 description: User's age
 *               riskTolerance:
 *                 type: string
 *                 enum: [conservative, moderate, aggressive]
 *                 description: User's risk tolerance level
 *               timeHorizonYears:
 *                 type: number
 *                 description: Investment time horizon in years
 *               interests:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: User's investment interests (e.g., ['stocks', 'bonds', 'etfs'])
 *               amount:
 *                 type: number
 *                 description: Investment amount in USD
 *     responses:
 *       200:
 *         description: Successful response with investment recommendations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 statusCode:
 *                   type: number
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     assetAllocation:
 *                       type: object
 *                       properties:
 *                         stocks:
 *                           type: number
 *                         bonds:
 *                           type: number
 *                         cash:
 *                           type: number
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: object
 *                     educationalContent:
 *                       type: array
 *                       items:
 *                         type: object
 *                 educational_disclaimer:
 *                   type: string
 *       400:
 *         description: Invalid input parameters
 *       500:
 *         description: Server error
 */
router.post('/recommendations', async (req, res) => {
  try {
    const {
      userId,
      age = 25,
      riskTolerance = 'moderate',
      timeHorizonYears = 10,
      interests = ['stocks', 'etfs'],
      amount = 1000
    } = req.body;

    // Validate input parameters
    const validation = validateInvestmentParams({
      age,
      riskTolerance,
      timeHorizonYears,
      amount
    });

    if (!validation.isValid) {
      return res.status(400).json(createApiResponse(
        null,
        validation.error,
        false,
        400
      ));
    }

    // Get asset allocation based on risk tolerance and time horizon
    const assetAllocation = ruleBase.getAssetAllocation(
      riskTolerance.toLowerCase(),
      timeHorizonYears
    );

    // Get educational content based on interests
    const educationalContent = ruleBase.getEducationalContent(interests);

    // Prepare context for AI
    const context = {
      user: {
        id: userId,
        age,
        riskTolerance,
        timeHorizonYears,
        interests,
        amount
      },
      market: {
        // In a real implementation, this would include current market data
        status: 'Market data integration would be implemented here'
      },
      assetAllocation,
      educationalContent: educationalContent.map(item => ({
        title: item.title,
        type: item.type,
        duration: item.duration
      }))
    };

    // Get AI recommendation
    const aiRecommendation = await aiEngine.getInvestmentRecommendation(context);

    // Prepare response
    const response = createApiResponse({
      assetAllocation,
      recommendations: [
        {
          type: 'ai_recommendation',
          content: aiRecommendation,
          timestamp: new Date().toISOString()
        }
      ],
      educationalContent: educationalContent.map(item => ({
        title: item.title,
        type: item.type,
        duration: item.duration
      }))
    }, 'Recommendations generated successfully');

    res.json(response);
  } catch (error) {
    logger.error('Error generating recommendations:', error);
    res.status(500).json(createApiResponse(
      null,
      'Failed to generate recommendations',
      false,
      500
    ));
  }
});

/**
 * @swagger
 * /api/ai/analyze:
 *   post:
 *     summary: Analyze a stock or investment
 *     description: Provides educational analysis of a stock or investment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - symbol
 *             properties:
 *               symbol:
 *                 type: string
 *                 description: Stock symbol to analyze (e.g., 'AAPL')
 *               analysisType:
 *                 type: string
 *                 enum: [fundamental, technical, sentiment]
 *                 default: fundamental
 *                 description: Type of analysis to perform
 *     responses:
 *       200:
 *         description: Successful response with analysis
 *       400:
 *         description: Invalid input parameters
 *       500:
 *         description: Server error
 */
router.post('/analyze', async (req, res) => {
  try {
    const { symbol, analysisType = 'fundamental' } = req.body;

    if (!symbol) {
      return res.status(400).json(createApiResponse(
        null,
        'Symbol is required',
        false,
        400
      ));
    }

    // Get company overview from Alpha Vantage
    const overview = await dataInsights.getCompanyOverview(symbol);
    
    // Get stock quote
    const quote = await dataInsights.getStockQuote(symbol);
    
    // Prepare context for AI analysis
    const context = {
      symbol,
      analysisType,
      overview,
      quote,
      timestamp: new Date().toISOString()
    };

    // Get AI analysis
    const aiAnalysis = await aiEngine.getInvestmentRecommendation({
      role: 'system',
      content: `Provide a detailed ${analysisType} analysis of ${symbol} based on the following data. ` +
               'Focus on educational insights rather than direct investment advice. ' +
               'Explain any technical terms for educational purposes.\n\n' +
               `Company Overview: ${JSON.stringify(overview, null, 2)}\n\n` +
               `Current Quote: ${JSON.stringify(quote, null, 2)}`
    });

    // Prepare response
    const response = createApiResponse({
      symbol,
      analysisType,
      analysis: aiAnalysis,
      lastUpdated: new Date().toISOString(),
      dataSources: ['Alpha Vantage', 'OpenRouter (LLaMA 3)']
    }, 'Analysis completed successfully');

    res.json(response);
  } catch (error) {
    logger.error('Error performing analysis:', error);
    res.status(500).json(createApiResponse(
      null,
      'Failed to perform analysis',
      false,
      500
    ));
  }
});

export default router;
