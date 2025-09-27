import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const PORT = process.env.WS_PORT || 8080;

// Store connected clients
const connectedClients = new Map();
const MAX_CONNECTIONS = 100; // Limit concurrent connections

// Create WebSocket server
const wss = new WebSocketServer({ 
  port: PORT,
  path: '/ws',
  maxPayload: 16 * 1024, // 16KB max message size
  perMessageDeflate: false // Disable compression to save resources
});

console.log(`🚀 WebSocket server started on port ${PORT}`);

wss.on('connection', (ws, request) => {
  console.log('👤 New WebSocket connection from:', request.socket.remoteAddress);
  
  // Check connection limit
  if (wss.clients.size > MAX_CONNECTIONS) {
    console.log('🚫 Connection rejected - max connections reached:', wss.clients.size);
    ws.close(1013, 'Server overloaded');
    return;
  }
  
  // Set connection timeout
  const connectionTimeout = setTimeout(() => {
    if (!ws.userId) {
      console.log('⏰ Connection timeout - no authentication received');
      ws.close(1008, 'Authentication timeout');
    }
  }, 30000); // 30 seconds to authenticate
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      // Handle authentication
      if (data.type === 'auth') {
        try {
          const decoded = jwt.verify(data.token, JWT_SECRET);
          
          // Clear timeout since we got authentication
          clearTimeout(connectionTimeout);
          
          // Store user info on WebSocket connection
          ws.userId = decoded.userId;
          ws.sessionId = decoded.sessionId;
          ws.username = decoded.username;
          
          // Store in connected clients map
          connectedClients.set(decoded.userId, ws);
          
          ws.send(JSON.stringify({
            type: 'auth_success',
            message: 'WebSocket authenticated successfully',
            userId: decoded.userId
          }));
          
          console.log(`✅ WebSocket authenticated for user: ${decoded.username} (${decoded.userId})`);
          
        } catch (authError) {
          console.error('❌ Authentication failed:', authError.message);
          ws.send(JSON.stringify({
            type: 'auth_error',
            message: 'Invalid authentication token'
          }));
          ws.close(1008, 'Authentication failed');
        }
      }
      
      // Handle ping/pong for connection health
      else if (data.type === 'ping') {
        ws.send(JSON.stringify({ 
          type: 'pong',
          timestamp: Date.now()
        }));
      }
      
      // Handle message sending (relay to Instagram API)
      else if (data.type === 'send_message') {
        if (!ws.userId) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Not authenticated'
          }));
          return;
        }
        
        // Here you would integrate with your Instagram API
        // For now, just acknowledge the message
        ws.send(JSON.stringify({
          type: 'message_sent',
          messageId: Date.now().toString(),
          recipientId: data.recipientId,
          text: data.text,
          timestamp: Date.now()
        }));
      }
      
    } catch (error) {
      console.error('❌ WebSocket message error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  });
  
  ws.on('close', (code, reason) => {
    clearTimeout(connectionTimeout);
    
    if (ws.userId) {
      connectedClients.delete(ws.userId);
      console.log(`👋 WebSocket disconnected for user: ${ws.username} (${ws.userId}) - Code: ${code}, Reason: ${reason}`);
    } else {
      console.log(`👋 Unauthenticated WebSocket disconnected - Code: ${code}`);
    }
  });
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
    clearTimeout(connectionTimeout);
  });
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to Instagram Chat WebSocket server',
    timestamp: Date.now()
  }));
});

// Function to broadcast message to specific user
function sendMessageToUser(userId, message) {
  const ws = connectedClients.get(userId);
  if (ws && ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(message));
    return true;
  }
  return false;
}

// Function to broadcast to all connected clients
function broadcastToAll(message) {
  const messageStr = JSON.stringify(message);
  let sentCount = 0;
  
  console.log('📡 Broadcasting message:', JSON.stringify(message, null, 2));
  console.log(`📡 Total connected clients: ${connectedClients.size}`);
  
  connectedClients.forEach((ws, clientInfo) => {
    if (ws.readyState === ws.OPEN) {
      console.log(`📤 Sending to client ${clientInfo.userId}:`, messageStr);
      ws.send(messageStr);
      sentCount++;
    } else {
      console.log(`❌ Client ${clientInfo.userId} connection not open (state: ${ws.readyState})`);
      // Clean up dead connections
      connectedClients.delete(clientInfo);
    }
  });
  
  console.log(`📡 Successfully sent message to ${sentCount}/${connectedClients.size} clients`);
}

// Health check endpoint simulation
setInterval(() => {
  const connectedCount = connectedClients.size;
  console.log(`📊 WebSocket Health Check - Connected clients: ${connectedCount}`);
  
  // Clean up dead connections
  connectedClients.forEach((ws, userId) => {
    if (ws.readyState !== ws.OPEN) {
      connectedClients.delete(userId);
    }
  });
}, 60000); // Every minute



// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down WebSocket server...');
  wss.close(() => {
    console.log('✅ WebSocket server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Shutting down WebSocket server...');
  wss.close(() => {
    console.log('✅ WebSocket server closed');
    process.exit(0);
  });
});

// Export functions for external use
export {
  sendMessageToUser,
  broadcastToAll,
  connectedClients
};