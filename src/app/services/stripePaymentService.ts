import { loadStripe, Stripe } from '@stripe/stripe-js';

// Initialize Stripe
let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');
  }
  return stripePromise;
};

export const STRIPE_CONFIG = {
  appearance: {
    theme: 'stripe' as const,
  },
};

export interface PaymentIntentData {
  amount: number;
  currency: string;
  description: string;
  userId: string;
  feature: string;
}

export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  error?: string;
}

export class StripePaymentService {
  private static instance: StripePaymentService;
  private stripe: Stripe | null = null;

  private constructor() {}

  public static getInstance(): StripePaymentService {
    if (!StripePaymentService.instance) {
      StripePaymentService.instance = new StripePaymentService();
    }
    return StripePaymentService.instance;
  }

  private async initializeStripe(): Promise<Stripe | null> {
    if (!this.stripe) {
      this.stripe = await getStripe();
    }
    return this.stripe;
  }

  /**
   * Create a payment intent for AI assistance feature
   */
  public async createPaymentIntent(data: PaymentIntentData): Promise<{ clientSecret: string; paymentIntentId: string }> {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payments/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: data.amount,
          currency: data.currency,
          description: data.description,
          metadata: {
            userId: data.userId,
            feature: data.feature,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const result = await response.json();
      return {
        clientSecret: result.clientSecret,
        paymentIntentId: result.paymentIntentId,
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  /**
   * Process payment for AI assistance
   */
  public async processPayment(
    clientSecret: string,
    paymentMethodId?: string
  ): Promise<PaymentResult> {
    try {
      const stripe = await this.initializeStripe();
      if (!stripe) {
        throw new Error('Stripe failed to initialize');
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        return {
          success: true,
          paymentIntentId: paymentIntent.id,
        };
      }

      return {
        success: false,
        error: 'Payment was not successful',
      };
    } catch (error) {
      console.error('Error processing payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Create payment for AI assistance with predefined amount
   */
  public async createAIAssistancePayment(userId: string): Promise<{ clientSecret: string; paymentIntentId: string }> {
    const AI_ASSISTANCE_PRICE = 9.99; // $9.99 one-time payment
    
    return this.createPaymentIntent({
      amount: AI_ASSISTANCE_PRICE,
      currency: 'usd',
      description: 'AI Assistant Feature Access - One-time payment',
      userId,
      feature: 'ai_assistance',
    });
  }
}

export const stripePaymentService = StripePaymentService.getInstance();