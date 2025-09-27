import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { PaymentStorageService, PaymentStatus } from '../services/paymentStorageService';

interface PaymentVerificationState {
  isLoading: boolean;
  hasPaid: boolean;
  paymentId?: string;
  error?: string;
}

interface PaymentVerificationContextType {
  paymentState: PaymentVerificationState;
  checkPaymentStatus: () => Promise<void>;
  refreshPaymentStatus: () => Promise<void>;
}

const PaymentVerificationContext = createContext<PaymentVerificationContextType | undefined>(undefined);

export const usePaymentVerification = (matrixUserId?: string) => {
  const [state, setState] = useState<PaymentVerificationState>({
    isLoading: true,
    hasPaid: false,
  });

  const paymentService = PaymentStorageService.getInstance();

  const checkPaymentStatus = async () => {
    if (!matrixUserId) {
      console.log('⚠️ No Matrix User ID provided');
      setState(prev => ({ ...prev, isLoading: false, error: 'Matrix User ID is required' }));
      return;
    }

    try {
      console.log('🔄 Starting payment status check for user:', matrixUserId);
      setState(prev => ({ ...prev, isLoading: true, error: undefined }));
      console.log('🔍 Checking payment status for user:', matrixUserId);
      console.log('🌐 Making request to payment API...');
      
      const status: PaymentStatus = await paymentService.checkPaymentStatus(matrixUserId);
      console.log('💰 Payment status response:', status);
      
      const newState = {
        isLoading: false,
        hasPaid: status.payed,
        paymentId: status.paymentId,
      };
      
      console.log('🔄 Setting new payment state:', newState);
      setState(newState);
      
      console.log('✅ Payment state updated successfully');
    } catch (error) {
      console.error('❌ Error checking payment status:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to check payment status'
      }));
    }
  };

  const refreshPaymentStatus = async () => {
    console.log('🔄 refreshPaymentStatus called for user:', matrixUserId);
    console.log('📊 Current state before refresh:', state);
    await checkPaymentStatus();
    console.log('📊 State after refresh:', state);
  };

  useEffect(() => {
    console.log('🎯 useEffect triggered - matrixUserId changed to:', matrixUserId);
    checkPaymentStatus();
  }, [matrixUserId]);

  // Log state changes
  useEffect(() => {
    console.log('📈 Payment state changed:', state);
  }, [state]);

  return {
    paymentState: state,
    checkPaymentStatus,
    refreshPaymentStatus,
  };
}

/**
 * Specific hook for AI assistance payment verification
 */
export function useAIAssistancePayment(matrixUserId?: string) {
  return usePaymentVerification(matrixUserId);
}

/**
 * Hook to check if user can access AI assistance features
 */
export function useAIAssistanceAccess(matrixUserId?: string) {
  const paymentVerification = useAIAssistancePayment(matrixUserId);
  
  return {
    ...paymentVerification,
    canAccessAI: paymentVerification.paymentState.hasPaid,
    requiresPayment: !paymentVerification.paymentState.hasPaid && !paymentVerification.paymentState.isLoading,
  };
}

/**
 * Higher-order component to protect AI features with payment verification
 */
export function withPaymentVerification<T extends object>(
  Component: React.ComponentType<T>,
  matrixUserId?: string
) {
  return function PaymentProtectedComponent(props: T) {
    const { paymentState } = usePaymentVerification(matrixUserId);

    if (paymentState.isLoading) {
      return <div>Checking payment status...</div>;
    }

    if (!paymentState.hasPaid) {
      return <div>Payment required to access this feature.</div>;
    }

    return <Component {...props} />;
  };
}