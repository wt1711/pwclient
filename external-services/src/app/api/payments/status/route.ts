import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

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

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

console.log('DATABASE_URL:', process.env.DATABASE_URL);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const matrixUserId = searchParams.get('matrixUserId');

    if (!matrixUserId) {
      return NextResponse.json(
        { error: 'Matrix User ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const client = await pool.connect();
    try {
      // Check if user has paid
      const result = await client.query(
        `SELECT payment_id FROM payments 
         WHERE matrix_user_id = $1`,
        [matrixUserId]
      );

      const hasPaid = result.rows.length > 0;
      const paymentId = hasPaid ? result.rows[0].payment_id : undefined;

      return NextResponse.json(
        {
          payed: hasPaid,
          paymentId: paymentId,
        },
        {
          headers: corsHeaders,
        }
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error checking payment status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Remove the old POST method - we'll create a new /api/payment endpoint instead
