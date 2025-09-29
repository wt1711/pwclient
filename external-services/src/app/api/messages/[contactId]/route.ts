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

      // TODO: adsdsadas
      const threadFeed = ig.feed.directThread({
        thread_id: thread.thread_id,
        oldest_cursor: thread.oldest_cursor,
      });

      // Get messages from the thread
      const messagesDAS = await threadFeed.items();

      console.log(
        thread,
        messagesDAS.length,
        messagesDAS.map((el) => [el.text, el.uq_seq_id])
      );

      // Get all messages from the thread
      const allMessages = thread.items;
      console.log(
        allMessages.length,
        allMessages.map((el) => [el.text, el?.uq_seq_id ?? ''])
      );

      // If cursor is provided, find the starting point for pagination
      let startIndex = 0;
      if (cursor) {
        const cursorIndex = allMessages.findIndex(
          (item) => (item.item_id || `${item.timestamp}_${Math.random()}`) === cursor
        );
        if (cursorIndex !== -1) {
          startIndex = cursorIndex + 1; // Start after the cursor message
        }
      }

      // Get the paginated slice of messages
      const paginatedMessages = allMessages.slice(startIndex, startIndex + limit);

      // Determine if there are more messages
      const hasMore = startIndex + limit < allMessages.length;
      const nextCursor =
        hasMore && paginatedMessages.length > 0
          ? paginatedMessages[paginatedMessages.length - 1].item_id ||
            `${paginatedMessages[paginatedMessages.length - 1].timestamp}_${Math.random()}`
          : null;

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
