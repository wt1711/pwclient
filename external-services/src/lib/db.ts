import { Pool } from 'pg';
import Redis from 'ioredis';
import crypto from 'crypto';

// PostgreSQL connection
let pool: Pool | null = null;

export function getPostgresPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'instagram_chat',
      user: process.env.DB_USER || 'instagram_user',
      password: process.env.DB_PASSWORD || 'instagram_password',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  return pool;
}

// Redis connection
let redis: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redis) {
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    redis.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    redis.on('connect', () => {
      console.log('Connected to Redis');
    });
  }
  return redis;
}

// Database helper functions
export async function executeQuery(text: string, params?: unknown[]): Promise<unknown> {
  const pool = getPostgresPool();
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Graceful shutdown
export async function closeConnections(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// Initialize connections on startup
export async function initializeConnections(): Promise<void> {
  try {
    // Test Redis connection
    const redisClient = getRedisClient();
    await redisClient.ping();
    console.log('Redis connection established');

    // Test PostgreSQL connection
    const pgPool = getPostgresPool();
    await pgPool.query('SELECT NOW()');
    console.log('PostgreSQL connection established');
  } catch (error) {
    console.error('Failed to initialize database connections:', error);
    throw error;
  }
}
