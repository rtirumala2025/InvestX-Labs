#!/usr/bin/env node

import { mcpServer } from '../mcp/mcpServer.js';
import { logger } from '../utils/logger.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function startMCPServer() {
  try {
    logger.info('🚀 Starting MCP Server...');
    
    // Initialize the MCP server
    await mcpServer.initialize();
    
    // Start the server on port 3002
    await mcpServer.start(3002);
    
    logger.info('✅ MCP Server started successfully on port 3002');
    logger.info('🔗 WebSocket endpoint: ws://localhost:3002/ws');
    
    // Keep the process running
    process.on('SIGINT', async () => {
      logger.info('🛑 Shutting down MCP Server...');
      await mcpServer.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      logger.info('🛑 Shutting down MCP Server...');
      await mcpServer.stop();
      process.exit(0);
    });
    
  } catch (error) {
    logger.error('❌ Failed to start MCP Server:', error);
    process.exit(1);
  }
}

// Start the server
startMCPServer();
