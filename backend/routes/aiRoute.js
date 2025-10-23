import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { generateRequestId } from "../ai-services/utils.js";
import logger from "../utils/logger.js";

dotenv.config();

const router = express.Router();

// Mock data for recommendations
const mockRecommendations = [
  {
    id: 'rec_001',
    type: 'stock',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    recommendation: 'BUY',
    confidence: 0.85,
    reason: 'Strong financials and consistent growth',
    riskLevel: 'low',
    timeHorizon: 'long',
    lastUpdated: new Date().toISOString(),
    educational_disclaimer: 'This is not financial advice. Please do your own research before making investment decisions.'
  },
  {
    id: 'rec_002',
    type: 'etf',
    symbol: 'VTI',
    name: 'Vanguard Total Stock Market ETF',
    recommendation: 'HOLD',
    confidence: 0.78,
    reason: 'Broad market exposure with low fees',
    riskLevel: 'medium',
    timeHorizon: 'long',
    lastUpdated: new Date().toISOString(),
    educational_disclaimer: 'This is not financial advice. Please do your own research before making investment decisions.'
  },
  {
    id: 'rec_003',
    type: 'crypto',
    symbol: 'BTC-USD',
    name: 'Bitcoin',
    recommendation: 'SELL',
    confidence: 0.65,
    reason: 'High volatility and regulatory concerns',
    riskLevel: 'high',
    timeHorizon: 'short',
    lastUpdated: new Date().toISOString(),
    educational_disclaimer: 'This is not financial advice. Please do your own research before making investment decisions.'
  }
];

// Get AI recommendations based on user profile
router.get('/ai/recommendations', (req, res) => {
  try {
    // In a real implementation, we would use the user's profile to generate personalized recommendations
    const recommendations = mockRecommendations.map(rec => ({
      ...rec,
      requestId: generateRequestId('rec')
    }));

    res.status(200).json({
      success: true,
      data: recommendations,
      timestamp: new Date().toISOString(),
      educational_disclaimer: 'This is not financial advice. Please consult with a financial advisor before making investment decisions.'
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate recommendations',
      details: error.message
    });
  }
});

router.post("/chat", async (req, res) => {
  try {
    const { message, userProfile } = req.body;

    // Validate input
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required and must be a string' });
    }

    // Build system prompt with user profile context
    const systemPrompt = `You are InvestIQ, an AI financial education assistant for teenagers (ages 13-18).

**User Profile:**
- Age: ${userProfile?.age || 16}
- Experience Level: ${userProfile?.experience_level || 'beginner'}
- Risk Tolerance: ${userProfile?.risk_tolerance || 'moderate'}
- Monthly Budget: $${userProfile?.budget || 'Not set'}
- Portfolio Value: $${userProfile?.portfolio_value || 0}
- Interests: ${userProfile?.interests?.join(', ') || 'General investing'}

**Your Role:**
- Educational guide, NOT a financial advisor
- Patient teacher who explains concepts clearly
- Encouraging mentor who builds confidence
- Safety-focused advocate for parental involvement

**Communication Style:**
- Clear, conversational tone without being condescating
- Break complex topics into digestible chunks (2-3 paragraphs max)
- Use relatable analogies (gaming, social media, streaming services)
- Minimal emoji use (1-2 per response max) for emphasis only
- Structured formatting with headers and bullet points
- Always provide educational information, never specific financial advice

**Important:**
- Always mention consulting parents/guardians for users under 18
- Emphasize that this is educational information, not financial advice
- Encourage learning before investing
- Provide age-appropriate examples and platform recommendations`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.APP_URL || "http://localhost:3002",
        "X-Title": "InvestX Labs - InvestIQ Chatbot"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-70b-instruct",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          { role: "user", content: message },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenRouter API error:", errorData);
      throw new Error(`AI API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content || 
                 "Sorry, I couldn't generate a response at the moment. Please try again later.";

    // Return response with optional structured data
    res.json({ 
      reply,
      structuredData: {
        model: data?.model,
        tokens: data?.usage
      }
    });
  } catch (error) {
    console.error("AI Route Error:", error);
    res.status(500).json({ 
      error: "Failed to process your request. Please try again later.",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
