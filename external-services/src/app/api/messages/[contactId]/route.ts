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

    // Get pagination parameters from query string
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

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
      const thread = threads.find((t) => t.users.some((user) => user.pk.toString() === contactId));

      if (!thread) {
        // If no existing thread, return empty messages
        return NextResponse.json(
          {
            success: true,
            messages: [],
            nextCursor: null,
          },
          {
            headers: corsHeaders,
          }
        );
      }

      // Use threadFeed for proper pagination with Instagram's native cursors
      const threadFeed = ig.feed.directThread({
        thread_id: thread.thread_id,
        oldest_cursor: cursor || undefined, // Use provided cursor for pagination
      });

      // Get messages from the thread using the feed
      const feedMessages = await threadFeed.items();
      
      console.log(`📱 Loaded ${feedMessages.length} messages from threadFeed`);

      // Limit the number of messages returned
      const paginatedMessages = feedMessages.slice(0, limit);

      // For older message pagination, use the oldest message's item_id as the cursor
      // This ensures we can always fetch older messages by using the last message's ID
      let nextCursor: string | null = null;
      
      if (paginatedMessages.length > 0) {
        // Get the oldest message (last in the array since messages are in reverse chronological order)
        const oldestMessage = paginatedMessages[paginatedMessages.length - 1];
        
        // Check if there are potentially more messages
        // We have more if we got the full limit OR if the feed indicates more are available
        const hasMore = feedMessages.length >= limit || threadFeed.isMoreAvailable();
        
        if (hasMore && oldestMessage.item_id) {
          nextCursor = oldestMessage.item_id;
        }
      }

      console.log(`📄 Pagination info: messageCount=${paginatedMessages.length}, feedMessageCount=${feedMessages.length}, limit=${limit}, nextCursor=${nextCursor}`);

      // Format messages
      const messages = paginatedMessages
        .map((item) => {
          const isFromCurrentUser = item.user_id.toString() === decoded.userId;

          return {
            id: item.item_id || `${item.timestamp}_${Math.random()}`,
            contactId: contactId,
            userId: decoded.userId,
            text: item.text || '',
            timestamp: new Date(Number(item.timestamp) / 1000).toISOString(),
            messageType: 'text' as const,
            isFromMe: isFromCurrentUser,
          };
        })
        .reverse(); // Reverse to show oldest first

      return NextResponse.json(
        {
          success: true,
          messages: messages,
          nextCursor: nextCursor,
        },
        {
          headers: corsHeaders,
        }
      );
    } catch (messagesError) {
      console.error('Messages fetch error:', messagesError);
      const errorMessage =
        messagesError instanceof Error ? messagesError.message : String(messagesError);

      if (errorMessage.includes('rate_limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please wait before loading messages again.' },
          { status: 429, headers: corsHeaders }
        );
      }

      // Return empty messages if there's an error
      return NextResponse.json(
        {
          success: true,
          messages: [],
          error: 'Could not load message history',
        },
        {
          headers: corsHeaders,
        }
      );
    }
  } catch (error) {
    console.error('Messages API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
