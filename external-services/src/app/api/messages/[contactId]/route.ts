import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { sessionManager, igClientCache } from '../../auth/login/route';

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
      // Get direct message threads
      const inbox = await ig.feed.directInbox();
      const threads = await inbox.items();
      
      // Find the thread with the specific contact
      const thread = threads.find(t => 
        t.users.some(user => user.pk.toString() === contactId)
      );
      
      if (!thread) {
        // If no existing thread, return empty messages
        return NextResponse.json({
        success: true,
        messages: []
      }, {
        headers: corsHeaders
      });
      }
      
      // Format messages
      const messages = thread.items.map(item => {
        const isFromCurrentUser = item.user_id.toString() === decoded.userId;
        
        return {
          id: item.item_id || `${item.timestamp}_${Math.random()}`,
          text: item.text || '',
          sender: isFromCurrentUser ? 'user' : 'contact',
          timestamp: new Date(Number(item.timestamp) / 1000).toISOString(),
          status: 'sent'
        };
      }).reverse(); // Reverse to show oldest first

      return NextResponse.json({
        success: true,
        messages: messages.slice(-50) // Get last 50 messages
      }, {
        headers: corsHeaders
      });

    } catch (messagesError) {
      console.error('Messages fetch error:', messagesError);
      const errorMessage = messagesError instanceof Error ? messagesError.message : String(messagesError);
      
      if (errorMessage.includes('rate_limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please wait before loading messages again.' },
          { status: 429, headers: corsHeaders }
        );
      }
      
      // Return empty messages if there's an error
      return NextResponse.json({
        success: true,
        messages: [],
        error: 'Could not load message history'
      }, {
        headers: corsHeaders
      });
    }

  } catch (error) {
    console.error('Messages API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}