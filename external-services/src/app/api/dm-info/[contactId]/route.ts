import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { sessionManager, igClientCache } from '../../auth/login/route';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.CORS_ALLOW_ORIGIN ?? 'http://localhost:5173',
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
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

    const { contactId } = await params;
    if (!contactId) {
      return NextResponse.json(
        { error: 'Contact ID is required' },
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
      // Get direct message threads to find the contact
      const inbox = await ig.feed.directInbox();
      const threads = await inbox.items();

      // Find the thread with the specific contact
      const thread = threads.find((t) => t.users.some((user) => user.pk.toString() === contactId));

      if (!thread) {
        return NextResponse.json(
          { error: 'Contact not found' },
          { status: 404, headers: corsHeaders }
        );
      }

      // Find the contact user in the thread
      const contact = thread.users.find((user) => user.pk.toString() === contactId);

      if (!contact) {
        return NextResponse.json(
          { error: 'Contact not found' },
          { status: 404, headers: corsHeaders }
        );
      }

      // Get additional user info if needed
      let userInfo = null;
      try {
        userInfo = await ig.user.info(contact.pk);
      } catch (userInfoError) {
        console.warn('Could not fetch additional user info:', userInfoError);
      }

      // Format the DM info response
      const dmInfo = {
        id: contact.pk.toString(),
        username: contact.username,
        fullName: contact.full_name || contact.username,
        profilePicUrl: contact.profile_pic_url || '',
        isVerified: contact.is_verified || false,
        isPrivate: contact.is_private || false,
        followerCount: userInfo?.follower_count || 0,
        followingCount: userInfo?.following_count || 0,
        mediaCount: userInfo?.media_count || 0,
        biography: userInfo?.biography || '',
        externalUrl: userInfo?.external_url || '',
        isBusinessAccount: userInfo?.is_business || false,
        businessCategoryName: '',
        lastMessageTime: thread.last_activity_at ? new Date(Number(thread.last_activity_at) / 1000).toISOString() : null,
        unreadCount: 0, // Simplified unread count calculation
      };

      return NextResponse.json(
        {
          success: true,
          dmInfo: dmInfo,
        },
        {
          headers: corsHeaders,
        }
      );
    } catch (dmInfoError) {
      console.error('DM info fetch error:', dmInfoError);
      const errorMessage =
        dmInfoError instanceof Error ? dmInfoError.message : String(dmInfoError);

      if (errorMessage.includes('rate_limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please wait before fetching DM info again.' },
          { status: 429, headers: corsHeaders }
        );
      }

      return NextResponse.json(
        { error: 'Could not fetch DM info' },
        { status: 500, headers: corsHeaders }
      );
    }
  } catch (error) {
    console.error('DM info API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}