import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { sessionManager, igClientCache } from '../auth/login/route';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': (process.env.CORS_ALLOW_ORIGIN ?? 'http://localhost:5173'),
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

// Handle preflight OPTIONS request
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

interface JWTPayload {
  userId: string;
  username: string;
  sessionId: string;
}

interface InstagramUser {
  pk: number;
  username: string;
  full_name?: string;
  profile_pic_url?: string;
  is_verified?: boolean;
  follower_count?: number;
  is_private?: boolean;
}

export async function GET(  request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401, headers: corsHeaders }   
      );
    }

    const token = authHeader.substring(7);
    let decoded: JWTPayload;

    try {
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401, headers: corsHeaders }           
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters long' },
        { status: 400, headers: corsHeaders }           
      );
    }

    // Check session in Redis
    const sessionData = await sessionManager.getSession(decoded.sessionId);
    if (!sessionData) {
      return NextResponse.json(
        { error: 'Session expired. Please log in again.' },
        { status: 401, headers: corsHeaders }           
      );
    }

    // Get the Instagram client from cache
    const ig = igClientCache.get(decoded.sessionId);
    if (!ig) {
      return NextResponse.json(
        { error: 'Session expired. Please log in again.' },
        { status: 401, headers: corsHeaders }           
      );
    }

    try {
      // Search for users
      const searchResults = await ig.user.search(query.trim());
      
      // Format the results
      const users = searchResults.users.map((user: InstagramUser) => ({
        id: user.pk.toString(),
        username: user.username,
        fullName: user.full_name || '',
        profilePicUrl: user.profile_pic_url || '',
        isVerified: user.is_verified || false,
        followerCount: user.follower_count || 0,
        isPrivate: user.is_private || false
      }));

      return NextResponse.json({
        success: true,
        users: users.slice(0, 20), // Limit to 20 results
        query: query.trim()
      }, {
        headers: corsHeaders
      });

    } catch (searchError) {
      console.error('User search error:', searchError);
      const errorMessage = searchError instanceof Error ? searchError.message : String(searchError);
      
      if (errorMessage.includes('rate_limit')) {
        return NextResponse.json(
          { error: 'Search rate limit exceeded. Please wait before searching again.' },
          { status: 429, headers: corsHeaders }
        );
      }
      
      return NextResponse.json(
        { error: 'Search failed. Please try again.' },
        { status: 500, headers: corsHeaders }
      );
    }

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}