import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { sessionManager, igClientCache } from '../../auth/login/route';
import { getRealtimeService } from '@/lib/realtime';

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

export async function POST(request: NextRequest) {
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

    const { recipientId, message } = await request.json();

    if (!recipientId || !message) {
      return NextResponse.json(
        { error: 'Recipient ID and message are required' },
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

    // Try to use realtime service first, fallback to regular API
    const realtimeService = getRealtimeService();
    
    try {
      // Send message using realtime service if available
      if (realtimeService.isReady()) {
        const result = await realtimeService.sendMessage(recipientId, message);
        
        console.log('Message sent via realtime service:', {
          recipientId,
          result
        });

        const messageId = Date.now().toString();
         const timestamp = Date.now();
         
         return NextResponse.json({
           success: true,
           messageId,
           timestamp,
           message: {
             id: messageId,
             text: message,
             senderId: decoded.userId,
             recipientId: recipientId,
             timestamp,
             status: 'sent'
           },
           method: 'realtime'
         }, {
           headers: corsHeaders
         });
      }
      
      // Fallback to regular Instagram API
      const ig = igClientCache.get(decoded.sessionId);
      if (!ig) {
        return NextResponse.json(
          { error: 'Session expired. Please log in again.' },
          { status: 401, headers: corsHeaders }
        );
      }

      // Determine if recipientId is a username or user ID
      let userId: string;
      
      if (isNaN(Number(recipientId))) {
        // It's a username, need to get user ID
        try {
          const userInfo = await ig.user.searchExact(recipientId.replace('@', ''));
          userId = userInfo.pk.toString();
        } catch (searchError) {
          return NextResponse.json(
            { error: `User '${recipientId}' not found` },
            { status: 404, headers: corsHeaders }
          );
        }
      } else {
        userId = recipientId;
      }

      // Send the message using the thread method
      const thread = ig.entity.directThread([userId]);
      const result = await thread.broadcastText(message);
       const messageId = Date.now().toString();
       const timestamp = Date.now();
       
       return NextResponse.json({
         success: true,
         messageId,
         timestamp,
         message: {
           id: messageId,
           text: message,
           senderId: decoded.userId,
           recipientId: recipientId,
           timestamp,
           status: 'sent'
         },
         method: 'api'
       }, {
         headers: corsHeaders
       });

    } catch (error) {
      console.error('Message sending error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('rate_limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please wait before sending more messages.' },
          { status: 429, headers: corsHeaders }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500, headers: corsHeaders }
      );
    }

  } catch (error) {
    console.error('Send message API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}