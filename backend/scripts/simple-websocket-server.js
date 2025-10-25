#!/usr/bin/env node

import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { logger } from '../utils/logger.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const PORT = process.env.MCP_PORT || 3002;

// Create HTTP server
const server = createServer();

// Create WebSocket server
const wss = new WebSocketServer({ 
  server,
  path: '/ws'
});

// Store connected clients
const clients = new Set();

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  const clientId = Math.random().toString(36).substr(2, 9);
  clients.add(ws);
  
  logger.info(`✅ Client ${clientId} connected from ${req.socket.remoteAddress}`);
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Connected to InvestX Labs MCP Server',
    clientId,
    timestamp: new Date().toISOString()
  }));

  // Handle incoming messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      logger.info(`📨 Received message from ${clientId}:`, message);
      
      // Echo the message back with server info
      ws.send(JSON.stringify({
        type: 'echo',
        originalMessage: message,
        serverResponse: 'Message received successfully',
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      logger.error('Error processing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format',
        timestamp: new Date().toISOString()
      }));
    }
  });

  // Handle client disconnect
  ws.on('close', () => {
    clients.delete(ws);
    logger.info(`❌ Client ${clientId} disconnected`);
  });

  // Handle errors
  ws.on('error', (error) => {
    logger.error(`WebSocket error for client ${clientId}:`, error);
    clients.delete(ws);
  });
});

// Broadcast function to send messages to all connected clients
function broadcast(message) {
  const data = JSON.stringify({
    type: 'broadcast',
    message,
    timestamp: new Date().toISOString()
  });
  
  clients.forEach(client => {
    if (client.readyState === client.OPEN) {
      client.send(data);
    }
  });
}

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 WebSocket server running on port ${PORT}`);
  logger.info(`🔗 WebSocket endpoint: ws://localhost:${PORT}/ws`);
  logger.info(`📊 Connected clients: ${clients.size}`);
});

// Health check endpoint
server.on('request', (req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      port: PORT,
      connectedClients: clients.size,
      timestamp: new Date().toISOString()
    }));
  } else if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>InvestX Labs MCP Server</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .status { color: green; font-weight: bold; }
          .info { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <h1>InvestX Labs MCP Server</h1>
        <p class="status">✅ Server is running</p>
        <div class="info">
          <h3>Connection Info:</h3>
          <p><strong>WebSocket URL:</strong> ws://localhost:${PORT}/ws</p>
          <p><strong>Health Check:</strong> http://localhost:${PORT}/health</p>
          <p><strong>Connected Clients:</strong> ${clients.size}</p>
        </div>
        <div class="info">
          <h3>Test WebSocket Connection:</h3>
          <button onclick="testConnection()">Test Connection</button>
          <div id="output"></div>
        </div>
        <script>
          function testConnection() {
            const ws = new WebSocket('ws://localhost:${PORT}/ws');
            const output = document.getElementById('output');
            
            ws.onopen = () => {
              output.innerHTML += '<p>✅ Connected to WebSocket server</p>';
              ws.send(JSON.stringify({type: 'test', message: 'Hello from browser!'}));
            };
            
            ws.onmessage = (event) => {
              const data = JSON.parse(event.data);
              output.innerHTML += '<p>📨 Received: ' + JSON.stringify(data, null, 2) + '</p>';
            };
            
            ws.onclose = () => {
              output.innerHTML += '<p>❌ Connection closed</p>';
            };
            
            ws.onerror = (error) => {
              output.innerHTML += '<p>❌ Error: ' + error + '</p>';
            };
          }
        </script>
      </body>
      </html>
    `);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('🛑 Shutting down WebSocket server...');
  
  // Close all client connections
  clients.forEach(client => {
    client.close();
  });
  
  server.close(() => {
    logger.info('✅ WebSocket server stopped');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  logger.info('🛑 Shutting down WebSocket server...');
  
  clients.forEach(client => {
    client.close();
  });
  
  server.close(() => {
    logger.info('✅ WebSocket server stopped');
    process.exit(0);
  });
});

// Log periodic status
setInterval(() => {
  logger.info(`📊 Server status: ${clients.size} connected clients`);
}, 30000); // Every 30 seconds
