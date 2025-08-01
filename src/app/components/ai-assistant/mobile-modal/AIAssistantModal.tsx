import React from 'react';
import { Overlay, OverlayCenter, OverlayBackdrop, Portal, Box, Scroll, Avatar, Text } from 'folds';
import FocusTrap from 'focus-trap-react';

import { useSetSetting } from '../../../state/hooks/settings';
import { settingsAtom } from '../../../state/settings';
import { stopPropagation } from '../../../utils/keyboard';
import { AIAssistantProvider, useAIAssistant } from '../AIAssistantContext';
import { AIAssistantHeader } from '../desktop-ui/AIAssistantHeader';
import { GeneratedResponseBox } from '../desktop-ui/GeneratedResponseBox';
import { SelectedMessageBox } from '../desktop-ui/SelectedMessageBox';
import { ChatHistory } from '../desktop-ui/ChatHistory';
import { ChatInput } from '../desktop-ui/ChatInput';
import wingmanPFP from '../wingman.png';

function EmptyState() {
  return (
    <Box
      grow="Yes"
      direction="Column"
      justifyContent="Center"
      alignItems="Center"
      gap="200"
      style={{ height: '100%' }}
    >
      <Avatar size="500">
        <img src={wingmanPFP} alt="Wingman" style={{ width: '100%', height: '100%' }} />
      </Avatar>
      <Text size="H4">Hỏi Wingman ngay</Text>
      <Text align="Center" style={{ maxWidth: '300px' }}>
        Nhận gợi ý hoặc phân tích về cuộc hội thoại từ Wingman
      </Text>
    </Box>
  );
}

function AIAssistantContent() {
  const { chatHistory } = useAIAssistant();
  const showEmptyState = chatHistory.length === 0;

  return (
    <Box
      shrink="No"
      direction="Column"
      style={{
        width: '80vw',
        maxWidth: '468px',
        height: '80vh',
        backgroundColor: 'var(--bg-surface-extra-raised)',
        borderRadius: '12px',
      }}
    >
      <AIAssistantHeader />
      <Box grow="Yes" direction="Column" style={{ position: 'relative', overflow: 'hidden' }}>
        <GeneratedResponseBox />
        <Scroll variant="Background" visibility="Hover">
          <Box direction="Column" gap="400" style={{ padding: '16px', minHeight: '100%' }}>
            <SelectedMessageBox />
            {showEmptyState ? <EmptyState /> : <ChatHistory />}
          </Box>
        </Scroll>
      </Box>
      <ChatInput />
    </Box>
  );
}

export function AIAssistantModal() {
  const setAiDrawer = useSetSetting(settingsAtom, 'isAiDrawerOpen');
  const handleClose = () => setAiDrawer(false);

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
            <div
            // onMouseDown={stopPropagation}
            >
              <AIAssistantProvider>
                <AIAssistantContent />
              </AIAssistantProvider>
            </div>
          </FocusTrap>
        </OverlayCenter>
      </Overlay>
    </Portal>
  );
}
