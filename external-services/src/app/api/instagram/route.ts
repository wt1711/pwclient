import { NextRequest, NextResponse } from 'next/server';
import { getPostgresPool } from '../../../lib/db';
import { checkAuth } from '@/lib/utils';
import { Pool } from 'pg';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.CORS_ALLOW_ORIGIN ?? 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(request: NextRequest) {
  try {
    // Extract JWT token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Get user's Instagram connection status from database
    const client = await pool.connect();

    // Verify JWT token
    const payload = await checkAuth(token, client);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401, headers: corsHeaders }
      );
    }

    const query = `
      SELECT is_instagram_connected 
      FROM matrix_user 
      WHERE matrix_user_id = $1
    `;

    const result = await client.query(query, [payload.userId]);

    // If user doesn't exist in database, they're not connected
    const isInstagramConnected =
      result.rows.length > 0 ? result.rows[0].is_instagram_connected : false;

    client.release();

    return NextResponse.json(
      {
        isInstagramConnected,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error checking Instagram connection status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Handle preflight OPTIONS request
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}
