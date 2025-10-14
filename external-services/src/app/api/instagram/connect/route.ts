import { NextRequest, NextResponse } from 'next/server';
import MatrixClient, { ICookiesObject } from '@/lib/matrix';
import { checkAuth } from '@/lib/utils';
import { Pool } from 'pg';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
// Function to validate if cookies object matches ICookiesObject interface
function isValidICookiesObject(cookies: unknown): cookies is ICookiesObject {
  if (!cookies || typeof cookies !== 'object') {
    return false;
  }

  const requiredFields: (keyof ICookiesObject)[] = [
    'rur',
    'ps_n',
    'ps_l',
    'ds_user_id',
    'mid',
    'ig_did',
    'sessionid',
    'datr',
    'dpr',
    'wd',
    'csrftoken',
  ];

  // Check if all required fields exist and are strings
  return requiredFields.every(
    (field) =>
      field in cookies &&
      typeof (cookies as Record<string, unknown>)[field] === 'string' &&
      (cookies as Record<string, string>)[field].trim() !== ''
  );
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.CORS_ALLOW_ORIGIN ?? 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(req: NextRequest) {
  try {
    const cookies = await req.json();

    if (!isValidICookiesObject(cookies)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid cookies object.',
        },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }
    // Extract JWT token from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    const client = await pool.connect();

    const jwtPayload = await checkAuth(token, client);
    if (!jwtPayload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401, headers: corsHeaders }
      );
    }

    const matrixClient = new MatrixClient({
      accessToken: jwtPayload.accessToken,
      userId: jwtPayload.userId,
      deviceId: jwtPayload.deviceId,
    });

    const userDb = jwtPayload.userDb;
    if (!userDb?.is_instagram_connected) {
      let metaRoomId = userDb?.meta_bot_room_id;
      if (!metaRoomId) {
        metaRoomId = await matrixClient.createMetaBotRoom();
      }
      const isLoggedIn = await matrixClient.loginInstagram(metaRoomId, cookies);
      if (!isLoggedIn) {
        return NextResponse.json(
          { success: false, error: 'Failed to log in Instagram' },
          {
            status: 400,
            headers: corsHeaders,
          }
        );
      }
      await client.query(
        'UPDATE matrix_user SET is_instagram_connected = $1, meta_bot_room_id = $2 WHERE id = $3',
        [true, metaRoomId, userDb.id]
      );
    }
    client.release();

    return NextResponse.json(
      { success: true, message: 'Instagram connected' },
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error('Error connecting Instagram:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      {
        status: 400,
        headers: corsHeaders,
      }
    );
  }
}
