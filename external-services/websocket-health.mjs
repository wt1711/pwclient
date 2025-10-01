import http from 'http';
import { getRedisClient } from './src/lib/db.js';

// Simple health check server for WebSocket service
const server = http.createServer(async (req, res) => {
  if (req.url === '/health' && req.method === 'GET') {
    try {
      // Check Redis connection
      const redis = getRedisClient();
      const result = await redis.ping();
      const redisHealthy = result === 'PONG';
      
      const health = {
        status: redisHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          redis: redisHealthy ? 'healthy' : 'unhealthy',
          websocket: 'healthy', // If this endpoint responds, WebSocket service is running
        },
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0',
      };

      const statusCode = health.status === 'healthy' ? 200 : 503;
      
      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(health, null, 2));
    } catch (error) {
      console.error('WebSocket health check failed:', error);
      
      const errorResponse = {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        uptime: process.uptime(),
      };
      
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(errorResponse, null, 2));
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

const port = process.env.WS_HEALTH_PORT || 8089;
server.listen(port, () => {
  console.log(`WebSocket health check server running on port ${port}`);
});

export default server;