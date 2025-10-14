import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.CORS_ALLOW_ORIGIN ?? 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

// Handle preflight OPTIONS request
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentIntentId: string }> }
) {
  try {
    const { paymentIntentId } = await params;

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment Intent ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-08-27.basil',
    });

    try {
      // Retrieve the PaymentIntent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      return NextResponse.json(
        {
          paymentIntent: {
            id: paymentIntent.id,
            status: paymentIntent.status,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            created: paymentIntent.created,
            client_secret: paymentIntent.client_secret,
          },
        },
        {
          headers: corsHeaders,
        }
      );
    } catch (stripeError) {
      console.error('Stripe error:', stripeError);

      if (
        stripeError instanceof Error &&
        'code' in stripeError &&
        stripeError.code === 'resource_missing'
      ) {
        return NextResponse.json(
          { error: 'Payment Intent not found' },
          { status: 404, headers: corsHeaders }
        );
      }

      return NextResponse.json(
        { error: 'Failed to retrieve payment status' },
        { status: 500, headers: corsHeaders }
      );
    }
  } catch (error) {
    console.error('Error retrieving payment status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
