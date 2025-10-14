import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/utils';
import { Pool } from 'pg';
import { decryptSecret } from '@/lib/crypto';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(req: NextRequest) {
  // Enable CORS
  const origin = req.headers.get('origin') || '*';
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return NextResponse.json(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Missing or invalid token' },
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.substring(7);
    const client = await pool.connect();

    const payload = await checkAuth(token, client);
    if (!payload) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401, headers: corsHeaders });
    }
    client.release();

    return NextResponse.json(
      {
        message: 'Token is valid',
        data: {
          userId: payload.userId,
          accessToken: payload.accessToken,
          deviceId: payload.deviceId,
          homeServer: payload.homeServer,
          randomString: decryptSecret(payload.userDb.encrypted_password),
        },
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    return NextResponse.json(
      { message: 'Token verification failed' },
      { status: 401, headers: corsHeaders }
    );
  }
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.CORS_ALLOW_ORIGIN ?? 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}
