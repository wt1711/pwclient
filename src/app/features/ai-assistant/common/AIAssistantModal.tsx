// comment to trigger re-lint
import React, { useState } from 'react';
import { Overlay, OverlayCenter, OverlayBackdrop, Portal, Box, Scroll } from 'folds';
import FocusTrap from 'focus-trap-react';

import { useSetSetting } from '../../../state/hooks/settings';
import { settingsAtom } from '../../../state/settings';
import { stopPropagation } from '../../../utils/keyboard';
import { AIAssistantProvider, useAIAssistant } from '../AIAssistantContext';
import { AIAssistantHeader } from './AIAssistantHeader';
import { GeneratedResponseBox } from './GeneratedResponseBox';
import { SelectedMessageBox } from './SelectedMessageBox';
import { ChatHistory } from './ChatHistory';
import { ChatInput } from './ChatInput';
import { EmptyState } from './EmptyState';
import Tabs from '../../../atoms/tabs/Tabs.jsx';
import { AIAssistantStats } from './AIAssistantStats';
import { useRoomMessage } from '../../room/RoomMessageContext';

function AIAssistantContent() {
  const { chatHistory } = useAIAssistant();
  const showEmptyState = chatHistory.length === 0;
  const { selectedMessage } = useRoomMessage();
  const defaultTabName = selectedMessage ? 'chat' : 'response';
  const defaultTabIndex = selectedMessage ? 1 : 0;
  const [selectedTab, setSelectedTab] = useState(defaultTabName);

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
      <AIAssistantHeader />
      <AIAssistantStats />
      <Tabs
        items={[
          { text: 'Response', id: 'response' },
          { text: 'Chat', id: 'chat' },
        ]}
        defaultSelected={defaultTabIndex}
        onSelect={(item) => setSelectedTab(item.id)}
      />
      <Box grow="Yes" direction="Column" style={{ position: 'relative', overflow: 'hidden' }}>
        {selectedTab === 'response' && <GeneratedResponseBox />}
        {selectedTab === 'chat' && (
          <>
            <Scroll variant="Background" visibility="Hover">
              <Box direction="Column" gap="400" style={{ padding: '16px', minHeight: '100%' }}>
                <SelectedMessageBox />
                {showEmptyState ? <EmptyState /> : <ChatHistory />}
              </Box>
            </Scroll>
            <ChatInput />
          </>
        )}
      </Box>
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
