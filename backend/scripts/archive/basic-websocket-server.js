#!/usr/bin/env node

import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const PORT = 3003;

// Create HTTP server
const server = createServer();

// Create WebSocket server
const wss = new WebSocketServer({ 
  server,
  path: '/ws'
});

// Store connected clients
const clients = new Set();

console.log('🚀 Starting WebSocket server...');

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  const clientId = Math.random().toString(36).substr(2, 9);
  clients.add(ws);
  
  console.log(`✅ Client ${clientId} connected from ${req.socket.remoteAddress}`);
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Connected to InvestX Labs WebSocket Server',
    clientId,
    timestamp: new Date().toISOString()
  }));

  // Handle incoming messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log(`📨 Received message from ${clientId}:`, message);
      
      // Echo the message back with server info
      ws.send(JSON.stringify({
        type: 'echo',
        originalMessage: message,
        serverResponse: 'Message received successfully',
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error processing message:', error);
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
    console.log(`❌ Client ${clientId} disconnected`);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error(`WebSocket error for client ${clientId}:`, error);
    clients.delete(ws);
  });
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
        <title>InvestX Labs WebSocket Server</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .status { color: green; font-weight: bold; }
          .info { background: #f0f0f0; padding: 20px; border-radius: 5px; margin: 10px 0; }
          button { padding: 10px 20px; font-size: 16px; cursor: pointer; }
          #output { margin-top: 10px; padding: 10px; background: #f9f9f9; border-radius: 5px; }
        </style>
      </head>
      <body>
        <h1>InvestX Labs WebSocket Server</h1>
        <p class="status">✅ Server is running on port ${PORT}</p>
        <div class="info">
          <h3>Connection Info:</h3>
          <p><strong>WebSocket URL:</strong> ws://localhost:${PORT}/ws</p>
          <p><strong>Health Check:</strong> http://localhost:${PORT}/health</p>
          <p><strong>Connected Clients:</strong> <span id="clientCount">${clients.size}</span></p>
        </div>
        <div class="info">
          <h3>Test WebSocket Connection:</h3>
          <button onclick="testConnection()">Test Connection</button>
          <button onclick="clearOutput()">Clear Output</button>
          <div id="output"></div>
        </div>
        <script>
          function updateClientCount() {
            document.getElementById('clientCount').textContent = ${clients.size};
          }
          
          function testConnection() {
            const output = document.getElementById('output');
            output.innerHTML += '<p>🔄 Attempting to connect to WebSocket...</p>';
            
            const ws = new WebSocket('ws://localhost:${PORT}/ws');
            
            ws.onopen = () => {
              output.innerHTML += '<p>✅ Connected to WebSocket server</p>';
              ws.send(JSON.stringify({type: 'test', message: 'Hello from browser!', timestamp: new Date().toISOString()}));
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
          
          function clearOutput() {
            document.getElementById('output').innerHTML = '';
          }
          
          // Update client count every 5 seconds
          setInterval(updateClientCount, 5000);
        </script>
      </body>
      </html>
    `);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 WebSocket server running on port ${PORT}`);
  console.log(`🔗 WebSocket endpoint: ws://localhost:${PORT}/ws`);
  console.log(`🌐 Web interface: http://localhost:${PORT}/`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Connected clients: ${clients.size}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down WebSocket server...');
  
  // Close all client connections
  clients.forEach(client => {
    client.close();
  });
  
  server.close(() => {
    console.log('✅ WebSocket server stopped');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('🛑 Shutting down WebSocket server...');
  
  clients.forEach(client => {
    client.close();
  });
  
  server.close(() => {
    console.log('✅ WebSocket server stopped');
    process.exit(0);
  });
});

// Log periodic status
setInterval(() => {
  console.log(`📊 Server status: ${clients.size} connected clients`);
}, 30000); // Every 30 seconds
