import { Pool } from 'pg';
import Redis from 'ioredis';
import { IgApiClient } from 'instagram-private-api';
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

// Session management with Redis
export class SessionManager {
  private redis: Redis;
  private encryptionKey: string;

  constructor() {
    this.redis = getRedisClient();
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-change-this-in-production';
  }

  // Existing session methods
  async setSession(sessionId: string, sessionData: Record<string, unknown>, expirationSeconds: number = 86400): Promise<void> {
    try {
      await this.redis.setex(
        `session:${sessionId}`,
        expirationSeconds,
        JSON.stringify(sessionData)
      );
    } catch (error) {
      console.error('Error setting session:', error);
      throw error;
    }
  }

  async getSession(sessionId: string): Promise<Record<string, unknown> | null> {
    try {
      const sessionData = await this.redis.get(`session:${sessionId}`);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      await this.redis.del(`session:${sessionId}`);
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }

  async getAllSessions(): Promise<string[]> {
    try {
      const keys = await this.redis.keys('session:*');
      return keys.map(key => key.replace('session:', ''));
    } catch (error) {
      console.error('Error getting all sessions:', error);
      return [];
    }
  }

  // Instagram client session methods
  private encrypt(text: string): string {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  private decrypt(encryptedText: string): string {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipher(algorithm, key);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  async storeInstagramClient(userId: string, igClient: IgApiClient, expirationHours: number = 24): Promise<void> {
    try {
      const pool = getPostgresPool();
      
      // Debug: Check what we're storing
      console.log(`🔍 Storing Instagram client for user ${userId}:`);
      const cookiesBeforeStorage = igClient.state.cookieJar.getCookies('https://instagram.com');
      console.log(`- Has cookies before serialization: ${cookiesBeforeStorage.length > 0}`);
      console.log(`- Number of cookies: ${cookiesBeforeStorage.length}`);
      
      if (cookiesBeforeStorage.length > 0) {
        console.log(`- Cookie domains: ${cookiesBeforeStorage.map(c => c.domain).join(', ')}`);
        console.log(`- Cookie names: ${cookiesBeforeStorage.map(c => c.key).join(', ')}`);
      }
      
      let cookieUserId = 'Not set';
      try {
        cookieUserId = igClient.state.cookieUserId || 'Not set';
      } catch (error) {
        console.log(`- Cookie error during storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      console.log(`- User ID before serialization: ${cookieUserId}`);
      
      // Serialize the Instagram client state with device information and cookies
      const clientState = {
        state: igClient.state.serialize(),
        deviceString: igClient.state.deviceString,
        deviceId: igClient.state.deviceId,
        uuid: igClient.state.uuid,
        phoneId: igClient.state.phoneId,
        adid: igClient.state.adid,
        // Explicitly store cookies to ensure they're preserved
        cookies: igClient.state.cookieJar.getCookies('https://instagram.com').map(cookie => cookie.toString()),
        // Store additional metadata for reference
        createdAt: new Date().toISOString(),
      };
      
      const encryptedData = this.encrypt(JSON.stringify(clientState));
      const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000);
      
      // Upsert the session
      const query = `
        INSERT INTO instagram_sessions (user_id, session_data, expires_at, is_active)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          session_data = EXCLUDED.session_data,
          expires_at = EXCLUDED.expires_at,
          updated_at = CURRENT_TIMESTAMP,
          is_active = EXCLUDED.is_active
      `;
      
      await pool.query(query, [userId, encryptedData, expiresAt, true]);
      console.log(`✅ Instagram client stored for user: ${userId}`);
    } catch (error) {
      console.error('Error storing Instagram client:', error);
      throw error;
    }
  }

  async getInstagramClient(userId: string): Promise<IgApiClient | null> {
    try {
      const pool = getPostgresPool();
      
      const query = `
        SELECT session_data, expires_at 
        FROM instagram_sessions 
        WHERE user_id = $1 AND is_active = true AND expires_at > CURRENT_TIMESTAMP
      `;
      
      const result = await pool.query(query, [userId]);
      
      if (result.rows.length === 0) {
        console.log(`❌ No active Instagram session found for user: ${userId}`);
        return null;
      }
      
      const { session_data } = result.rows[0];
      const decryptedData = this.decrypt(session_data);
      const clientState = JSON.parse(decryptedData);
      
      // Recreate the Instagram client
      const igClient = new IgApiClient();
      
      // First restore device information
      if (clientState.deviceString) {
        igClient.state.deviceString = clientState.deviceString;
      }
      if (clientState.deviceId) {
        igClient.state.deviceId = clientState.deviceId;
      }
      if (clientState.uuid) {
        igClient.state.uuid = clientState.uuid;
      }
      if (clientState.phoneId) {
        igClient.state.phoneId = clientState.phoneId;
      }
      if (clientState.adid) {
        igClient.state.adid = clientState.adid;
      }
      
      // First deserialize the state
      igClient.state.deserialize(clientState.state);
      
      console.log(`🔍 Checking cookies in clientState for user ${userId}:`);
      console.log(`- clientState.cookies exists: ${!!clientState.cookies}`);
      console.log(`- clientState.cookies is array: ${Array.isArray(clientState.cookies)}`);
      console.log(`- clientState.cookies length: ${clientState.cookies ? clientState.cookies.length : 'N/A'}`);
      console.log(`- Available keys in clientState: ${Object.keys(clientState).join(', ')}`);
      
      // Then restore cookies if they were explicitly stored (this must happen after deserialization)
      if (clientState.cookies && Array.isArray(clientState.cookies) && clientState.cookies.length > 0) {
        console.log(`🔍 Restoring ${clientState.cookies.length} cookies after deserialization`);
        for (const cookieStr of clientState.cookies) {
          try {
            igClient.state.cookieJar.setCookie(cookieStr, 'https://instagram.com');
          } catch (error) {
            console.log(`- Failed to restore cookie: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      } else {
        console.log(`⚠️ No valid cookies found in stored state for user ${userId}`);
        console.log(`- Cookies array length: ${clientState.cookies ? clientState.cookies.length : 'N/A'}`);
        console.log(`❌ Session invalid - no authentication cookies available for user ${userId}`);
        console.log(`🔄 Returning null to force re-authentication`);
        return null;
      }
      
      // Debug: Check if the client has authentication data
      console.log(`🔍 Instagram client state for user ${userId}:`);
      console.log(`- Has cookies: ${igClient.state.cookieJar.getCookies('https://instagram.com').length > 0}`);
      console.log(`- Device ID: ${igClient.state.deviceId || 'Not set'}`);
      
      // Safely check for user ID without throwing error
      let cookieUserId = 'Not set';
      let hasAuthentication = false;
      try {
        cookieUserId = igClient.state.cookieUserId || 'Not set';
        hasAuthentication = !!igClient.state.cookieUserId;
      } catch (error) {
        console.log(`- Cookie error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        hasAuthentication = false;
      }
      
      console.log(`- User ID: ${cookieUserId}`);
      console.log(`- Has authentication: ${hasAuthentication}`);
      
      console.log(`✅ Instagram client retrieved for user: ${userId}`);
      return igClient;
    } catch (error) {
      console.error('Error retrieving Instagram client:', error);
      return null;
    }
  }

  async deleteInstagramClient(userId: string): Promise<void> {
    try {
      const pool = getPostgresPool();
      
      const query = `
        UPDATE instagram_sessions 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
      `;
      
      await pool.query(query, [userId]);
      console.log(`✅ Instagram client deleted for user: ${userId}`);
    } catch (error) {
      console.error('Error deleting Instagram client:', error);
      throw error;
    }
  }

  async cleanupExpiredInstagramSessions(): Promise<void> {
    try {
      const pool = getPostgresPool();
      
      const query = `
        UPDATE instagram_sessions 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE expires_at < CURRENT_TIMESTAMP AND is_active = true
      `;
      
      const result = await pool.query(query);
      console.log(`🧹 Cleaned up ${result.rowCount} expired Instagram sessions`);
    } catch (error) {
      console.error('Error cleaning up expired Instagram sessions:', error);
      throw error;
    }
  }
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