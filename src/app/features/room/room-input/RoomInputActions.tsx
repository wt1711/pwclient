import React, { useRef, useState } from 'react';
import { Box, Icon, IconButton, Icons, PopOut } from 'folds';
import { ReactEditor } from 'slate-react';
import { EmojiBoard, EmojiBoardTab } from '~/app/components/emoji-board';
import { UseStateProvider } from '~/app/components/UseStateProvider';
import { mobileOrTablet } from '~/app/utils/user-agent';
import { useRoomInputContext } from './RoomInputContext';
import { GenerateResponseButton } from '~/app/features/ai-assistant/gen-response/GenerateResponseButton';
import { useAIAssistant } from '~/app/features/ai-assistant/AIAssistantContext';

import { usePaymentVerification } from '~/app/hooks/usePaymentVerification';
import { PaymentModal } from '~/app/components/payment/PaymentModal';
import { useMatrixClient } from '~/app/hooks/useMatrixClient';

export function RoomInputActions() {
  const {
    submit,
    editor,
    imagePackRooms,
    handleEmoticonSelect,
    handleStickerSelect,
    hideStickerBtn,
    roomId,
  } = useRoomInputContext();
  const { isAIAssistantOpen, toggleAIAssistant, generateInitialResponse } = useAIAssistant();
  const mx = useMatrixClient();
  const matrixUserId = mx.getUserId();
  const { paymentState, refreshPaymentStatus } = usePaymentVerification(matrixUserId || undefined);
  const { hasPaid, isLoading: paymentLoading } = paymentState;
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const emojiBtnRef = useRef<HTMLButtonElement>(null);
  const aiAssistantBtnRef = useRef<HTMLButtonElement>(null);

  const handleAIAssistantClick = () => {
    console.log('🤖 [RoomInputActions] AI Assistant clicked - Payment state:', {
      hasPaid,
      paymentLoading,
      showPaymentModal,
    });

    if (!hasPaid && !paymentLoading) {
      console.log('💳 [RoomInputActions] Payment required - showing payment modal');
      setShowPaymentModal(true);
      return;
    }

    if (isAIAssistantOpen) {
      toggleAIAssistant(false);
    } else {
      generateInitialResponse();
    }
  };

  const handlePaymentSuccess = () => {
    console.log('🎉 [RoomInputActions] Payment success callback triggered');
    console.log('📊 [RoomInputActions] Current payment state before refresh:', paymentState);
    console.log('🔄 [RoomInputActions] Calling refreshPaymentStatus...');

    refreshPaymentStatus()
      .then(() => {
        console.log('✅ [RoomInputActions] refreshPaymentStatus completed');
        console.log('📊 [RoomInputActions] Payment state after refresh:', paymentState);
      })
      .catch((error) => {
        console.error('❌ [RoomInputActions] refreshPaymentStatus failed:', error);
      });

    setShowPaymentModal(false);
    console.log('🚪 [RoomInputActions] Payment modal closed');

    // Open AI assistant after successful payment
    console.log('🤖 [RoomInputActions] Generating initial AI response...');
    generateInitialResponse();
  };

  return (
    <>
      <Box direction="Row" alignItems="Center" gap="100">
        <GenerateResponseButton />
      </Box>
      <IconButton
        ref={aiAssistantBtnRef}
        variant="SurfaceVariant"
        size="300"
        radii="300"
        onClick={handleAIAssistantClick}
        disabled={paymentLoading}
      >
        <Icon src={Icons.Setting} />
      </IconButton>
      <UseStateProvider initial={undefined}>
        {(
          emojiBoardTab: EmojiBoardTab | undefined,
          setEmojiBoardTab: (tab?: EmojiBoardTab) => void
        ) => (
          <PopOut
            offset={16}
            alignOffset={-44}
            position="Top"
            align="End"
            anchor={
              emojiBoardTab === undefined
                ? undefined
                : emojiBtnRef.current?.getBoundingClientRect() ?? undefined
            }
            content={
              <EmojiBoard
                tab={emojiBoardTab}
                onTabChange={setEmojiBoardTab}
                imagePackRooms={imagePackRooms}
                returnFocusOnDeactivate={false}
                onEmojiSelect={handleEmoticonSelect}
                onCustomEmojiSelect={handleEmoticonSelect}
                onStickerSelect={handleStickerSelect}
                requestClose={() => {
                  if (emojiBoardTab && !mobileOrTablet()) {
                    setTimeout(() => ReactEditor.focus(editor), 0);
                  }
                  setEmojiBoardTab(undefined);
                }}
              />
            }
          >
            <IconButton
              ref={emojiBtnRef}
              aria-pressed={
                hideStickerBtn ? !!emojiBoardTab : emojiBoardTab === EmojiBoardTab.Emoji
              }
              onClick={() => setEmojiBoardTab(EmojiBoardTab.Emoji)}
              variant="SurfaceVariant"
              size="300"
              radii="300"
            >
              <Icon
                src={Icons.Smile}
                filled={hideStickerBtn ? !!emojiBoardTab : emojiBoardTab === EmojiBoardTab.Emoji}
              />
            </IconButton>
          </PopOut>
        )}
      </UseStateProvider>
      <IconButton onClick={submit} variant="SurfaceVariant" size="300" radii="300">
        <Icon src={Icons.Send} />
      </IconButton>
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
          matrixUserId={mx.getUserId() || ''}
        />
      )}
    </>
  );
}
