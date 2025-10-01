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

    // Parse form data
    const formData = await request.formData();
    const recipientId = formData.get('recipientId') as string;
    const imageFile = formData.get('image') as File;
    const caption = formData.get('caption') as string | null;

    if (!recipientId || !imageFile) {
      return NextResponse.json(
        { error: 'Recipient ID and image file are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate image file
    if (!imageFile.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
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

    // Convert File to Buffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Send the image using the thread method
    const thread = ig.entity.directThread([userId]);
    
    // Send image
    const result = await thread.broadcastPhoto({
      file: buffer,
    });

    // Send caption as separate text message if provided
    if (caption && caption.trim()) {
      await thread.broadcastText(caption);
    }

    const messageId = Date.now().toString();
    const timestamp = Date.now();
    
    return NextResponse.json({
      success: true,
      messageId,
      timestamp,
      message: {
        id: messageId,
        text: caption || '',
        senderId: decoded.userId,
        recipientId: recipientId,
        timestamp,
        messageType: 'media',
        mediaUrl: `data:${imageFile.type};base64,${buffer.toString('base64')}`,
        status: 'sent'
      },
      method: 'api'
    }, {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Send image API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}