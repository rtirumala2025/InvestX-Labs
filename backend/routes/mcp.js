import express from 'express';
import { mcpServer } from '../mcp/mcpServer.js';
import { createApiResponse } from '../ai-services/utils.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Initialize MCP server
let mcpInitialized = false;

/**
 * Initialize MCP server if not already initialized
 */
async function initializeMcp() {
  if (!mcpInitialized) {
    try {
      await mcpServer.initialize();
      await mcpServer.start();
      mcpInitialized = true;
      logger.info('MCP Server initialized and started');
    } catch (error) {
      logger.error('Failed to initialize MCP Server:', error);
      throw error;
    }
  }
  return mcpServer;
}

/**
 * Middleware to ensure MCP is initialized
 */
async function ensureMcpInitialized(req, res, next) {
  try {
    await initializeMcp();
    next();
  } catch (error) {
    res.status(500).json(createApiResponse(
      null,
      'MCP Server initialization failed',
      false,
      500
    ));
  }
}

/**
 * @swagger
 * /api/mcp/status:
 *   get:
 *     summary: Get MCP server status
 *     description: Returns the current status of the Model Context Protocol server
 *     responses:
 *       200:
 *         description: Successful response with MCP server status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 statusCode:
 *                   type: number
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                     models:
 *                       type: array
 *                       items:
 *                         type: object
 *                     providers:
 *                       type: array
 *                       items:
 *                         type: object
 */
router.get('/status', ensureMcpInitialized, async (req, res) => {
  try {
    const models = await mcpServer.getModels();
    const providers = await mcpServer.getDataProviders();
    
    const status = {
      status: 'running',
      models: models.map(model => ({
        id: model.id,
        name: model.name,
        description: model.description,
        capabilities: model.capabilities
      })),
      providers: providers.map(provider => ({
        id: provider.id,
        name: provider.name,
        description: provider.description,
        capabilities: provider.capabilities
      })),
      timestamp: new Date().toISOString()
    };
    
    res.json(createApiResponse(status, 'MCP Server is running'));
  } catch (error) {
    logger.error('Error getting MCP status:', error);
    res.status(500).json(createApiResponse(
      null,
      'Failed to get MCP status',
      false,
      500
    ));
  }
});

/**
 * @swagger
 * /api/mcp/context:
 *   get:
 *     summary: Get context for AI interactions
 *     description: Retrieves a merged context including user profile, portfolio, and market data
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to get context for
 *       - in: query
 *         name: includeMarketData
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Whether to include market data in the context
 *       - in: query
 *         name: symbols
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Array of stock symbols to include market data for
 *     responses:
 *       200:
 *         description: Successful response with merged context
 *       400:
 *         description: Missing or invalid parameters
 *       500:
 *         description: Server error
 */
router.get('/context', ensureMcpInitialized, async (req, res) => {
  try {
    const { userId, includeMarketData, symbols = [] } = req.query;
    
    if (!userId) {
      return res.status(400).json(createApiResponse(
        null,
        'User ID is required',
        false,
        400
      ));
    }

    const contextManager = mcpServer.getContextManager();
    const context = await contextManager.getComprehensiveContext(userId, {
      includeMarketData: includeMarketData === 'true',
      symbols: Array.isArray(symbols) ? symbols : [symbols]
    });
    
    res.json(createApiResponse(context, 'Context retrieved successfully'));
  } catch (error) {
    logger.error('Error getting context:', error);
    res.status(500).json(createApiResponse(
      null,
      'Failed to get context',
      false,
      500
    ));
  }
});

/**
 * @swagger
 * /api/mcp/generate:
 *   post:
 *     summary: Generate content using MCP
 *     description: Generates content using the specified model and context
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - prompt
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID for context
 *               modelId:
 *                 type: string
 *                 default: llama-3-70b-instruct
 *                 description: ID of the model to use
 *               prompt:
 *                 type: string
 *                 description: The prompt to generate a response for
 *               context:
 *                 type: object
 *                 description: Additional context to include
 *               options:
 *                 type: object
 *                 description: Generation options (temperature, max_tokens, etc.)
 *     responses:
 *       200:
 *         description: Successful response with generated content
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Server error
 */
router.post('/generate', ensureMcpInitialized, async (req, res) => {
  try {
    const { userId, modelId = 'llama-3-70b-instruct', prompt, context = {}, options = {} } = req.body;
    
    if (!userId || !prompt) {
      return res.status(400).json(createApiResponse(
        null,
        'User ID and prompt are required',
        false,
        400
      ));
    }

    // Get the requested model
    const model = await mcpServer.getModel(modelId);
    if (!model) {
      return res.status(404).json(createApiResponse(
        null,
        `Model not found: ${modelId}`,
        false,
        404
      ));
    }

    // Get user context
    const contextManager = mcpServer.getContextManager();
    const userContext = await contextManager.getUserProfileContext(userId);
    
    // Merge contexts
    const mergedContext = {
      ...userContext,
      ...context,
      generation_timestamp: new Date().toISOString(),
      model: modelId
    };

    // Prepare messages for the model
    const messages = [
      {
        role: 'system',
        content: 'You are an AI assistant for InvestX Labs, an educational investment platform. ' +
                 'Provide clear, educational responses based on the provided context.'
      },
      {
        role: 'user',
        content: `Context: ${JSON.stringify(mergedContext, null, 2)}\n\nPrompt: ${prompt}`
      }
    ];

    // Generate response
    const response = await model.generate({
      messages,
      ...options
    });

    // Save the interaction
    try {
      const supabase = mcpServer.getDataProvider('supabase');
      if (supabase) {
        await supabase.saveAiResponse({
          userId,
          context: mergedContext,
          model: modelId,
          prompt,
          response: response.choices[0].message.content,
          metadata: {
            ...options,
            model_version: model.getModelInfo().version || 'unknown'
          }
        });
      }
    } catch (error) {
      logger.error('Failed to save AI response:', error);
      // Don't fail the request if saving fails
    }

    // Return the generated content
    res.json(createApiResponse({
      content: response.choices[0].message.content,
      model: modelId,
      usage: response.usage,
      timestamp: new Date().toISOString()
    }, 'Content generated successfully'));
  } catch (error) {
    logger.error('Error generating content:', error);
    res.status(500).json(createApiResponse(
      null,
      'Failed to generate content',
      false,
      500
    ));
  }
});

/**
 * @swagger
 * /api/mcp/chat:
 *   post:
 *     summary: Chat with the AI
 *     description: Have a conversation with the AI, maintaining chat history
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - message
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID for the chat
 *               message:
 *                 type: string
 *                 description: The user's message
 *               chatId:
 *                 type: string
 *                 description: Optional chat ID for continuing a conversation
 *               modelId:
 *                 type: string
 *                 default: llama-3-70b-instruct
 *                 description: ID of the model to use
 *               options:
 *                 type: object
 *                 description: Generation options (temperature, max_tokens, etc.)
 *     responses:
 *       200:
 *         description: Successful response with AI's reply
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Server error
 */
router.post('/chat', ensureMcpInitialized, async (req, res) => {
  try {
    const { 
      userId, 
      message, 
      chatId = null, 
      modelId = 'llama-3-70b-instruct',
      options = {}
    } = req.body;
    
    if (!userId || !message) {
      return res.status(400).json(createApiResponse(
        null,
        'User ID and message are required',
        false,
        400
      ));
    }

    // Get the requested model
    const model = await mcpServer.getModel(modelId);
    if (!model) {
      return res.status(404).json(createApiResponse(
        null,
        `Model not found: ${modelId}`,
        false,
        404
      ));
    }

    // Get chat history if chatId is provided
    let chatHistory = [];
    if (chatId) {
      // In a real implementation, this would fetch the chat history from the database
      // For now, we'll use an empty array
      chatHistory = [];
    }

    // Get user context
    const contextManager = mcpServer.getContextManager();
    const userContext = await contextManager.getUserProfileContext(userId);
    
    // Prepare messages for the model
    const messages = [
      {
        role: 'system',
        content: 'You are an AI assistant for InvestX Labs, an educational investment platform. ' +
                 'Provide clear, educational responses. Be friendly and helpful. ' +
                 'If asked for investment advice, provide educational information ' +
                 'rather than specific recommendations.'
      },
      ...chatHistory,
      {
        role: 'user',
        content: message
      }
    ];

    // Generate response
    const response = await model.generate({
      messages,
      ...options
    });

    const aiResponse = response.choices[0].message.content;

    // Save the conversation
    try {
      const supabase = mcpServer.getDataProvider('supabase');
      if (supabase) {
        // Save user message
        await supabase.saveAiResponse({
          userId,
          context: {
            chatId,
            ...userContext,
            model: modelId,
            timestamp: new Date().toISOString()
          },
          model: modelId,
          prompt: message,
          response: aiResponse,
          metadata: {
            ...options,
            message_type: 'user',
            chat_id: chatId
          }
        });

        // Save AI response
        await supabase.saveAiResponse({
          userId,
          context: {
            chatId,
            ...userContext,
            model: modelId,
            timestamp: new Date().toISOString()
          },
          model: modelId,
          prompt: message,
          response: aiResponse,
          metadata: {
            ...options,
            message_type: 'assistant',
            chat_id: chatId,
            model_version: model.getModelInfo().version || 'unknown'
          }
        });
      }
    } catch (error) {
      logger.error('Failed to save chat messages:', error);
      // Don't fail the request if saving fails
    }

    // Return the AI's response
    res.json(createApiResponse({
      chatId: chatId || `chat_${Date.now()}`,
      message: aiResponse,
      model: modelId,
      timestamp: new Date().toISOString(),
      usage: response.usage
    }, 'Chat response generated successfully'));
  } catch (error) {
    logger.error('Error in chat endpoint:', error);
    res.status(500).json(createApiResponse(
      null,
      'Failed to process chat message',
      false,
      500
    ));
  }
});

export default router;
