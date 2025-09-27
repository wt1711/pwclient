import React, { useState } from 'react';
import { IconButton, Spinner } from 'folds';
import { useAIAssistant } from '~/app/features/ai-assistant/AIAssistantContext';
import GenResponseIcon from '~/app/features/ai-assistant/assets/gen-response.svg';
import GenResponseActiveIcon from '~/app/features/ai-assistant/assets/gen-response-active.svg';
import { usePaymentVerification } from '~/app/hooks/usePaymentVerification';
import { PaymentModal } from '~/app/components/payment/PaymentModal';
import { useMatrixClient } from '~/app/hooks/useMatrixClient';

export function GenerateResponseButton() {
  const { regenerateResponse, generatedResponse, isGeneratingResponse } = useAIAssistant();
  const mx = useMatrixClient();
  const matrixUserId = mx.getUserId();
  const { paymentState } = usePaymentVerification(matrixUserId || undefined);
  const { hasPaid, isLoading: paymentLoading } = paymentState;
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleClick = () => {
    if (!hasPaid) {
      setShowPaymentModal(true);
      return;
    }
    regenerateResponse();
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    regenerateResponse();
  };

  const renderGenerateIcon = () => {
    if (isGeneratingResponse) {
      return <Spinner size="300" />;
    }
    if (generatedResponse) {
      return <img src={GenResponseActiveIcon} alt="Regenerate Response" height={30} />;
    }
    return <img src={GenResponseIcon} alt="Regenerate Response" height={30} />;
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        variant="SurfaceVariant"
        size="300"
        radii="300"
        disabled={paymentLoading}
      >
        {renderGenerateIcon()}
      </IconButton>
      
      <PaymentModal
        isOpen={showPaymentModal}
        matrixUserId={mx.getUserId() || ''}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
}
