import React from 'react';
import { Overlay, OverlayCenter, OverlayBackdrop, Portal, Box, Scroll } from 'folds';
import FocusTrap from 'focus-trap-react';

import { useSetSetting } from '~/app/state/hooks/settings';
import { settingsAtom } from '~/app/state/settings';
import { stopPropagation } from '~/app/utils/keyboard';
import {
  AIAssistantProvider,
  useAIAssistant,
} from '~/app/features/ai-assistant/AIAssistantContext';
import {
  AIAssistantHeader,
  AIChatHeader,
  SelectedMessageBox,
  ChatHistory,
  ChatInput,
  EmptyState,
  AIAssistantStats,
} from '~/app/features/ai-assistant/dashboard';
import { useRoomMessage } from '~/app/features/room/RoomMessageContext';

function AIAssistantContent() {
  const { chatHistory } = useAIAssistant();
  const { selectedMessage } = useRoomMessage();
  const showEmptyState = chatHistory.length === 0 && !selectedMessage;

  return (
    <Box
      shrink="No"
      direction="Column"
      style={{
        width: '80vw',
        maxWidth: '468px',
        height: '80vh',
        backgroundColor: 'var(--bg-surface-extra-low)',
        color: 'var(--tc-surface-normal)',
        borderRadius: '12px',
      }}
    >
      <AIChatHeader />
      <AIAssistantStats />
      <AIAssistantHeader />
      <Box grow="Yes" direction="Column" style={{ position: 'relative', overflow: 'hidden' }}>
        <>
          <Scroll variant="Background" visibility="Hover">
            <Box direction="Column" gap="400" style={{ padding: '16px', minHeight: '100%' }}>
              <SelectedMessageBox />
              {showEmptyState ? <EmptyState /> : <ChatHistory />}
            </Box>
          </Scroll>
          <ChatInput />
        </>
      </Box>
    </Box>
  );
}

export function AIAssistantModal() {
  const setAiDrawer = useSetSetting(settingsAtom, 'isAiDrawerOpen');
  const { setSelectedMessage } = useRoomMessage();

  const handleClose = () => {
    setAiDrawer(false);
    setSelectedMessage(null);
  };

  return (
    <Portal>
      <Overlay open backdrop={<OverlayBackdrop onClick={handleClose} />}>
        <OverlayCenter>
          <FocusTrap
            focusTrapOptions={{
              initialFocus: false,
              clickOutsideDeactivates: true,
              onDeactivate: handleClose,
              escapeDeactivates: stopPropagation,
            }}
          >
            <div>
              <AIAssistantProvider isMobile>
                <AIAssistantContent />
              </AIAssistantProvider>
            </div>
          </FocusTrap>
        </OverlayCenter>
      </Overlay>
    </Portal>
  );
}
