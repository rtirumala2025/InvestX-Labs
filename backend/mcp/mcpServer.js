import { MCPServer } from '@modelcontextprotocol/sdk';
import { logger } from '../utils/logger.js';
import { OpenRouterAdapter } from './adapters/openrouterAdapter.js';
import { AlphaVantageAdapter } from './adapters/alphaVantageAdapter.js';
import { SupabaseAdapter } from './adapters/supabaseAdapter.js';
import { ContextManager } from './contextManager.js';

class MCPServer {
  constructor() {
    this.server = new MCPServer({
      name: 'InvestX Labs MCP Server',
      version: '1.0.0',
      description: 'MCP server for InvestX Labs AI investment education platform',
    });
    
    this.adapters = {};
    this.contextManager = null;
  }

  async initialize() {
    try {
      logger.info('Initializing MCP Server...');
      
      // Initialize adapters
      this.adapters.openrouter = new OpenRouterAdapter({
        apiKey: process.env.OPENROUTER_API_KEY,
        model: 'meta-llama/llama-3-70b-instruct'
      });
      
      this.adapters.alphaVantage = new AlphaVantageAdapter({
        apiKey: process.env.ALPHA_VANTAGE_API_KEY
      });
      
      this.adapters.supabase = new SupabaseAdapter({
        url: process.env.SUPABASE_URL,
        key: process.env.SUPABASE_SERVICE_KEY
      });
      
      // Initialize context manager
      this.contextManager = new ContextManager({
        supabase: this.adapters.supabase
      });
      
      // Register models and data providers
      await this.registerModels();
      await this.registerDataProviders();
      
      logger.info('MCP Server initialized successfully');
      return this;
    } catch (error) {
      logger.error('Failed to initialize MCP Server:', error);
      throw error;
    }
  }
  
  async registerModels() {
    // Register LLaMA 4 Scout via OpenRouter
    await this.server.registerModel({
      id: 'llama-3-70b-instruct',
      name: 'LLaMA 3 70B Instruct',
      description: 'Meta\'s LLaMA 3 70B model for investment education',
      adapter: this.adapters.openrouter,
      capabilities: ['text-generation', 'investment-education']
    });
    
    logger.info('Registered AI models with MCP Server');
  }
  
  async registerDataProviders() {
    // Register Alpha Vantage as a data provider
    await this.server.registerDataProvider({
      id: 'alpha-vantage',
      name: 'Alpha Vantage',
      description: 'Stock market data and financial information',
      adapter: this.adapters.alphaVantage,
      capabilities: ['market-data', 'company-info', 'technical-indicators']
    });
    
    // Register Supabase as a data provider
    await this.server.registerDataProvider({
      id: 'supabase',
      name: 'Supabase',
      description: 'Database and authentication services',
      adapter: this.adapters.supabase,
      capabilities: ['data-persistence', 'user-profiles', 'cache']
    });
    
    logger.info('Registered data providers with MCP Server');
  }
  
  async start(port = process.env.MCP_PORT || 3002) {
    try {
      await this.server.start(port);
      logger.info(`MCP Server running on port ${port}`);
      return this;
    } catch (error) {
      logger.error('Failed to start MCP Server:', error);
      throw error;
    }
  }
  
  async stop() {
    try {
      await this.server.stop();
      logger.info('MCP Server stopped');
    } catch (error) {
      logger.error('Error stopping MCP Server:', error);
      throw error;
    }
  }
  
  // Helper method to get a model by ID
  async getModel(modelId) {
    return this.server.getModel(modelId);
  }
  
  // Helper method to get a data provider by ID
  async getDataProvider(providerId) {
    return this.server.getDataProvider(providerId);
  }
  
  // Get the context manager
  getContextManager() {
    return this.contextManager;
  }
}

// Create a singleton instance
const mcpServer = new MCPServer();

export { mcpServer };
