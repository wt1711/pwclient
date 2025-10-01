import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getPostgresPool } from '../../../lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

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

export async function POST(request: NextRequest) {
  try {
    const { matrixUserId, matrixHost, paymentId } = await request.json();

    if (!matrixUserId || !matrixHost || !paymentId) {
      return NextResponse.json(
        { error: 'Matrix User ID, Matrix Host, and Payment ID are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate payment with Stripe
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
      
      // Check if payment is successful
      if (paymentIntent.status !== 'succeeded') {
        return NextResponse.json(
          { error: 'Payment not completed or invalid' },
          { status: 400, headers: corsHeaders }
        );
      }
    } catch (stripeError) {
      console.error('Stripe validation error:', stripeError);
      return NextResponse.json(
        { error: 'Invalid payment ID' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Store in database
    const pool = getPostgresPool();
    const client = await pool.connect();
    try {
      await client.query(
        `INSERT INTO payments (matrix_user_id, matrix_host, payment_id, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         ON CONFLICT (matrix_user_id, matrix_host) 
         DO UPDATE SET payment_id = $3, updated_at = NOW()`,
        [matrixUserId, matrixHost, paymentId]
      );

      return NextResponse.json({ 
        success: true,
        message: 'Payment validated and stored successfully'
      }, {
        headers: corsHeaders
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}