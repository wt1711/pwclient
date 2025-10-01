import { NextRequest, NextResponse } from 'next/server';
import { getPostgresPool, getRedisClient } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Check database connection
    const dbHealthy = await checkDatabaseHealth();
    
    // Check Redis connection
    const redisHealthy = await checkRedisHealth();
    
    const health = {
      status: dbHealthy && redisHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealthy ? 'healthy' : 'unhealthy',
        redis: redisHealthy ? 'healthy' : 'unhealthy',
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
    };

    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        uptime: process.uptime(),
      },
      { status: 503 }
    );
  }
}

async function checkDatabaseHealth(): Promise<boolean> {
  try {
    // Simple query to check database connectivity
    const pool = getPostgresPool();
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

async function checkRedisHealth(): Promise<boolean> {
  try {
    // Check Redis connectivity
    const redis = getRedisClient();
    const result = await redis.ping();
    return result === 'PONG';
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
}