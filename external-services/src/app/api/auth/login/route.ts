import { NextRequest, NextResponse } from 'next/server';
import { IgApiClient } from 'instagram-private-api';
import jwt from 'jsonwebtoken';
import { SessionManager } from '@/lib/db';
import { getRealtimeService } from '@/lib/realtime';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.CORS_ALLOW_ORIGIN ?? 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// Initialize session manager
const sessionManager = new SessionManager();

// Keep a small in-memory cache for Instagram client instances
// Note: In production, you might want to serialize/deserialize these
const igClientCache = new Map<string, IgApiClient>();

// Handle preflight OPTIONS request
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Create Instagram API client
    const ig = new IgApiClient();

    // Generate device ID based on username
    ig.state.generateDevice(username);

    try {
      // Attempt to login
      const loggedInUser = await ig.account.login(username, password);

      // Create session ID
      const sessionId = `${username}_${Date.now()}`;

      // Create JWT token
      const token = jwt.sign(
        {
          userId: loggedInUser.pk.toString(),
          username: loggedInUser.username,
          sessionId: sessionId,
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Store session data in Redis
      await sessionManager.setSession(
        sessionId,
        {
          userId: loggedInUser.pk.toString(),
          username: loggedInUser.username,
          fullName: loggedInUser.full_name,
          profilePicUrl: loggedInUser.profile_pic_url,
          loginTime: new Date().toISOString(),
        },
        86400
      ); // 24 hours expiration

      // Debug: Check cookies before storing
      console.log(`🔍 Login successful for user ${loggedInUser.pk.toString()}:`);
      console.log(
        `- Cookies after login: ${ig.state.cookieJar.getCookies('https://instagram.com').length}`
      );

      let cookieUserId = 'Not set';
      try {
        cookieUserId = ig.state.cookieUserId || 'Not set';
      } catch (error) {
        console.log(
          `- Cookie error after login: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
      console.log(`- User ID after login: ${cookieUserId}`);

      // Store Instagram client instance in database instead of memory cache
      await sessionManager.storeInstagramClient(loggedInUser.pk.toString(), ig, 24);

      // Initialize realtime service for this user
      try {
        const realtimeService = getRealtimeService();
        await realtimeService.initialize(username, password);
        console.log('✅ Realtime service initialized for user:', username);
      } catch (realtimeError) {
        console.warn('⚠️ Failed to initialize realtime service:', realtimeError);
        // Don't fail the login if realtime service fails
      }

      // Clean up old client instances from memory cache (if any remain)
      const userSessions = Array.from(igClientCache.keys()).filter((key) =>
        key.startsWith(`${username}_`)
      );

      userSessions.forEach((sessionId) => {
        igClientCache.delete(sessionId);
      });

      return NextResponse.json(
        {
          success: true,
          token,
          user: {
            id: loggedInUser.pk.toString(),
            username: loggedInUser.username,
            fullName: loggedInUser.full_name,
            profilePicUrl: loggedInUser.profile_pic_url,
          },
        },
        {
          headers: corsHeaders,
        }
      );
    } catch (loginError: unknown) {
      console.error('Instagram login error:', loginError);

      const errorMessage = loginError instanceof Error ? loginError.message : String(loginError);

      // Handle specific Instagram errors
      if (errorMessage.includes('challenge_required')) {
        return NextResponse.json(
          {
            error: 'Account verification required. Please log in through the Instagram app first.',
          },
          { status: 400, headers: corsHeaders }
        );
      }

      if (errorMessage.includes('bad_password')) {
        return NextResponse.json(
          { error: 'Invalid username or password' },
          { status: 401, headers: corsHeaders }
        );
      }

      if (errorMessage.includes('rate_limit')) {
        return NextResponse.json(
          { error: 'Too many login attempts. Please try again later.' },
          { status: 429, headers: corsHeaders }
        );
      }

      return NextResponse.json(
        { error: 'Login failed. Please check your credentials and try again.' },
        { status: 401, headers: corsHeaders }
      );
    }
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Export the session manager and client cache for use in other API routes
export { sessionManager, igClientCache };
