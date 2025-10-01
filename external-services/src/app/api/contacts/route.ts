import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { sessionManager, igClientCache } from '../auth/login/route';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.CORS_ALLOW_ORIGIN ?? 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

interface JWTPayload {
  userId: string;
  username: string;
  sessionId: string;
}

// Handle preflight OPTIONS request
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function GET(request: NextRequest) {
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

    // Debug logging
    console.log('🔍 Contacts API Debug:');
    console.log('- JWT sessionId:', decoded.sessionId);
    console.log('- Available cache keys:', Array.from(igClientCache.keys()));
    console.log('- Cache size:', igClientCache.size);

    // Check session in Redis
    const sessionData = await sessionManager.getSession(decoded.sessionId);
    if (!sessionData) {
      console.log('❌ Session not found in Redis for sessionId:', decoded.sessionId);
      return NextResponse.json(
        { error: 'Session expired. Please log in again.' },
        { status: 401, headers: corsHeaders }
      );
    }
    console.log('✅ Session found in Redis:', sessionData, igClientCache);

    // Get the Instagram client from cache
    const ig = igClientCache.get(decoded.sessionId);
    if (!ig) {
      console.log('❌ Instagram client not found in cache for sessionId:', decoded.sessionId);
      return NextResponse.json(
        { error: 'Session expired. Please log in again.' },
        { status: 401, headers: corsHeaders }
      );
    }
    console.log('✅ Instagram client found in cache');

    try {
      // Get direct message threads (conversations)
      const inbox = await ig.feed.directInbox();
      const threads = await inbox.items();

      // Format contacts from threads
      const contacts = threads
        .map((thread) => {
          // Get the other user in the conversation (not the current user)
          const otherUser = thread.users.find((user) => user.pk.toString() !== decoded.userId);

          if (!otherUser) {
            return null;
          }

          return {
            id: otherUser.pk.toString(),
            username: otherUser.username,
            fullName: otherUser.full_name || '',
            profilePicUrl: otherUser.profile_pic_url || '',
            isVerified: otherUser.is_verified || false,
            lastMessage: thread.items?.[0]?.text || '',
            lastMessageTime: thread.items?.[0]?.timestamp
              ? new Date(parseInt(thread.items[0].timestamp) / 1000).toISOString()
              : null,
            threadId: thread.thread_id,
            unreadCount: 0, // Instagram API doesn't provide unread count in this format
          };
        })
        .filter((contact) => contact !== null);

      return NextResponse.json(
        {
          success: true,
          contacts,
        },
        {
          headers: corsHeaders,
        }
      );
    } catch (instagramError) {
      console.error('Instagram API error:', instagramError);

      // Return empty contacts list with error message for graceful degradation
      return NextResponse.json(
        {
          success: true,
          contacts: [],
          error:
            'Could not load existing conversations. You can still search for users to start new conversations.',
        },
        {
          headers: corsHeaders,
        }
      );
    }
  } catch (error) {
    console.error('Contacts API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
