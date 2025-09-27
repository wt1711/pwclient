import React, { useState, useEffect, useCallback } from 'react';
import { 
  CardNumberElement, 
  CardExpiryElement, 
  CardCvcElement, 
  useStripe, 
  useElements, 
  Elements 
} from '@stripe/react-stripe-js';
import { Box, Button, Text, Spinner, Icon, Icons, Overlay, OverlayBackdrop, OverlayCenter } from 'folds';
import FocusTrap from 'focus-trap-react';
import { getStripe } from '../../services/stripePaymentService';
import { paymentStorageService } from '../../services/paymentStorageService';
import { stopPropagation } from '../../utils/keyboard';

interface PaymentFormProps {
  clientSecret: string;
  matrixUserId: string;
  onSuccess: () => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

function PaymentForm({ clientSecret, matrixUserId, onSuccess, onError, onCancel }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [cardComplete, setCardComplete] = useState({
    cardNumber: false,
    cardExpiry: false,
    cardCvc: false,
  });
  const [paymentAttempted, setPaymentAttempted] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('PaymentForm mounted');
    console.log('Stripe instance:', stripe);
    console.log('Elements instance:', elements);
    console.log('Client secret:', clientSecret);
  }, [stripe, elements, clientSecret]);

  // Reset payment attempt state when client secret changes (new payment)
  useEffect(() => {
    setPaymentAttempted(false);
    setErrorMessage('');
  }, [clientSecret]);

  // Add CSS to ensure Stripe elements are not affected by global styles and have proper width
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .StripeElement {
        pointer-events: auto !important;
        user-select: auto !important;
        -webkit-user-select: auto !important;
        -moz-user-select: auto !important;
        -ms-user-select: auto !important;
        touch-action: manipulation !important;
        position: relative !important;
        z-index: 1 !important;
        width: 100% !important;
        min-width: 0 !important;
        box-sizing: border-box !important;
      }
      .StripeElement input {
        pointer-events: auto !important;
        user-select: auto !important;
        -webkit-user-select: auto !important;
        -moz-user-select: auto !important;
        -ms-user-select: auto !important;
        touch-action: manipulation !important;
        width: 100% !important;
        min-width: 0 !important;
        box-sizing: border-box !important;
      }
      .StripeElement iframe {
        width: 100% !important;
        min-width: 0 !important;
        box-sizing: border-box !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleCardChange = (elementType: string) => (event: any) => {
    console.log(`Card ${elementType} changed:`, event);
    setCardComplete(prev => ({
      ...prev,
      [elementType]: event.complete,
    }));
    
    if (event.error) {
      setErrorMessage(event.error.message);
    } else {
      setErrorMessage('');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    // Prevent duplicate submissions
    if (isProcessing || paymentAttempted) {
      return;
    }

    setIsProcessing(true);
    setPaymentAttempted(true);
    setErrorMessage('');

    const cardNumberElement = elements.getElement(CardNumberElement);
    if (!cardNumberElement) {
      setErrorMessage('Card element not found');
      setIsProcessing(false);
      setPaymentAttempted(false);
      return;
    }

    try {
      // First, retrieve the PaymentIntent to check its current status
      const paymentIntentId = clientSecret.split('_secret_')[0];
      const retrieveResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payments/status/${paymentIntentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (retrieveResponse.ok) {
        const { paymentIntent: existingPI } = await retrieveResponse.json();
        
        // Check if payment is already succeeded
        if (existingPI && existingPI.status === 'succeeded') {
          // Payment already succeeded, just validate and store
          await paymentStorageService.validateAndStorePayment(matrixUserId, existingPI.id);
          onSuccess();
          return;
        }
        
        // Check if payment is in a state that cannot be confirmed
        if (existingPI && ['canceled', 'processing'].includes(existingPI.status)) {
          throw new Error(`Payment cannot be processed. Current status: ${existingPI.status}`);
        }
      }

      // Proceed with confirmation only if payment is not already succeeded
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardNumberElement,
        },
      });

      if (error) {
        // Handle specific error for already succeeded payments
        if (error.code === 'payment_intent_unexpected_state') {
          // Payment might have succeeded in another session, try to retrieve it
          try {
            const finalResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payments/status/${paymentIntentId}`, {
              method: 'GET',
            });
            
            if (finalResponse.ok) {
              const { paymentIntent: finalPI } = await finalResponse.json();
              if (finalPI && finalPI.status === 'succeeded') {
                await paymentStorageService.validateAndStorePayment(matrixUserId, finalPI.id);
                onSuccess();
                return;
              }
            }
          } catch (retrieveError) {
            console.error('Error retrieving payment status:', retrieveError);
          }
        }
        
        setErrorMessage(error.message || 'Payment failed');
        onError(error.message || 'Payment failed');
        setPaymentAttempted(false); // Allow retry on error
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Validate and store payment with the new API
        await paymentStorageService.validateAndStorePayment(matrixUserId, paymentIntent.id);
        onSuccess();
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Payment processing failed';
      setErrorMessage(errorMsg);
      onError(errorMsg);
      setPaymentAttempted(false); // Allow retry on error
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSmoothing: 'antialiased',
        '::placeholder': {
          color: '#aab7c4',
        },
        ':-webkit-autofill': {
          color: '#424770',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: true,
  };

  const stripeElementContainerStyle = {
    padding: '14px 16px',
    borderRadius: '8px',
    backgroundColor: '#fff',
    transition: 'border-color 0.2s ease',
    width: '100%',
    minWidth: 0,
    position: 'relative' as const,
    // Ensure the element is interactive
    pointerEvents: 'auto' as const,
    userSelect: 'auto' as const,
    touchAction: 'manipulation' as const,
    // Ensure proper z-index
    zIndex: 1,
    // Force width inheritance
    display: 'block',
    boxSizing: 'border-box' as const,
  };

  return (
    <Box as="form" onSubmit={handleSubmit} direction="Column" gap="400">
      <Box direction="Column" gap="200">
        <Text size="H4" style={{ color: '#1a1a1a', fontWeight: '600' }}>
          AI Assistance Payment
        </Text>
        <Text size="T300" priority="400" style={{ color: '#666' }}>
          One-time payment of $9.99 to unlock AI assistance features
        </Text>
      </Box>

      <Box direction="Column" gap="300">
        {/* Card Number */}
        <Box direction="Column" gap="100">
          <Text size="T200" style={{ color: '#374151', fontWeight: '500' }}>
            Card Number
          </Text>
          <Box
            style={{
              ...stripeElementContainerStyle,
              border: `2px solid ${cardComplete.cardNumber ? '#10b981' : '#e5e7eb'}`,
            }}
          >
            <CardNumberElement 
              options={cardElementOptions} 
              onChange={handleCardChange('cardNumber')}
            />
          </Box>
        </Box>

        {/* Expiry and CVC */}
        <Box direction="Row" gap="300">
          <Box direction="Column" gap="100" style={{ flex: 1 }}>
            <Text size="T200" style={{ color: '#374151', fontWeight: '500' }}>
              Expiry Date
            </Text>
            <Box
              style={{
                ...stripeElementContainerStyle,
                border: `2px solid ${cardComplete.cardExpiry ? '#10b981' : '#e5e7eb'}`,
              }}
            >
              <CardExpiryElement 
                options={cardElementOptions} 
                onChange={handleCardChange('cardExpiry')}
              />
            </Box>
          </Box>
          
          <Box direction="Column" gap="100" style={{ flex: 1 }}>
            <Text size="T200" style={{ color: '#374151', fontWeight: '500' }}>
              CVC
            </Text>
            <Box
              style={{
                ...stripeElementContainerStyle,
                border: `2px solid ${cardComplete.cardCvc ? '#10b981' : '#e5e7eb'}`,
              }}
            >
              <CardCvcElement 
                options={cardElementOptions} 
                onChange={handleCardChange('cardCvc')}
              />
            </Box>
          </Box>
        </Box>

        {errorMessage && (
          <Box 
            direction="Row" 
            alignItems="Center" 
            gap="200"
            style={{
              padding: '12px 16px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
            }}
          >
            <Icon src={Icons.Warning} size="400" style={{ color: '#dc2626' }} />
            <Text size="T300" style={{ color: '#dc2626' }}>
              {errorMessage}
            </Text>
          </Box>
        )}
      </Box>

      <Box direction="Row" gap="200" justifyContent="End" style={{ marginTop: '8px' }}>
        <Button
          type="button"
          variant="Secondary"
          onClick={onCancel}
          disabled={isProcessing}
          style={{
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: '500',
          }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="Primary"
          disabled={!stripe || isProcessing}
          before={isProcessing ? <Spinner size="200" /> : undefined}
          style={{
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: '600',
            backgroundColor: '#3b82f6',
            border: 'none',
          }}
        >
          {isProcessing ? 'Processing...' : 'Pay $9.99'}
        </Button>
      </Box>
    </Box>
  );
}

interface PaymentModalProps {
  isOpen: boolean;
  matrixUserId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function PaymentModal({ isOpen, onClose, matrixUserId, onSuccess }: PaymentModalProps) {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null);

  // Initialize Stripe promise
  useEffect(() => {
    console.log('Initializing Stripe...');
    const stripe = getStripe();
    setStripePromise(stripe);
    
    // Verify Stripe key
    console.log('Stripe publishable key:', import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
  }, []);

  const initializePayment = useCallback(async () => {
    if (!matrixUserId) return;

    try {
      setIsLoading(true);
      setError('');
      
      console.log('Creating payment intent...');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payments/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 500, // $5.00 in cents
          currency: 'usd',
          matrixUserId,
          description: 'Premium features access',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Payment intent created:', data);
      
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else {
        throw new Error('No client secret received');
      }
    } catch (err) {
      console.error('Payment initialization error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize payment';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [matrixUserId]);

  const handleSuccess = () => {
    console.log('💳 [PaymentModal] Payment successful - calling onSuccess callback');
    onSuccess();
    onClose();
  };

  const handleError = (error: string) => {
    setError(error);
  };

  useEffect(() => {
    if (isOpen && matrixUserId && clientSecret === '') {
      initializePayment();
    }
  }, [isOpen, matrixUserId, clientSecret, initializePayment]);

  if (!isOpen) return null;

  return (
    <Overlay open backdrop={<OverlayBackdrop />}>
      <OverlayCenter>
        <FocusTrap
          focusTrapOptions={{
            initialFocus: false,
            clickOutsideDeactivates: true,
            onDeactivate: onClose,
            escapeDeactivates: stopPropagation,
            fallbackFocus: () => document.body,
          }}
        >
          <Box
            style={{
              width: '500px',
              maxWidth: '90vw',
              padding: '32px',
              backgroundColor: '#fff',
              borderRadius: '16px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              position: 'relative',
              border: '1px solid #f3f4f6',
            }}
          >
            {/* Close button always present for focus trap */}
            <Button
              variant="Secondary"
              size="300"
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                minWidth: 'auto',
                padding: '8px',
                borderRadius: '8px',
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                transition: 'all 0.2s ease',
              }}
              aria-label="Close payment modal"
            >
              <Icon src={Icons.Cross} size="200" style={{ color: '#6b7280' }} />
            </Button>

            {clientSecret && stripePromise ? (
              <Box style={{ paddingTop: '20px' }}>
                <Elements 
                  stripe={stripePromise} 
                  options={{
                    clientSecret,
                    appearance: {
                      theme: 'stripe',
                      variables: {
                        colorPrimary: '#0570de',
                        colorBackground: '#ffffff',
                        colorText: '#30313d',
                        colorDanger: '#df1b41',
                        fontFamily: 'Ideal Sans, system-ui, sans-serif',
                        spacingUnit: '2px',
                        borderRadius: '4px',
                      },
                    },
                  }}
                >
                  <PaymentForm
                    clientSecret={clientSecret}
                    matrixUserId={matrixUserId}
                    onSuccess={handleSuccess}
                    onError={handleError}
                    onCancel={onClose}
                  />
                </Elements>
              </Box>
            ) : (
              <Box direction="Column" alignItems="Center" gap="400" style={{ padding: '40px' }}>
                <Spinner size="600" />
                <Text size="T300">Setting up payment...</Text>
                {error && (
                  <Text size="T200" style={{ color: '#df1b41', textAlign: 'center' }}>
                    {error}
                  </Text>
                )}
              </Box>
            )}
          </Box>
        </FocusTrap>
      </OverlayCenter>
    </Overlay>
  );
}

export { PaymentModal as default };
export { PaymentModal };