// comment to trigger re-lint
import React, { useState } from 'react';
import { Overlay, OverlayCenter, OverlayBackdrop, Portal, Box, Scroll } from 'folds';
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
import { EmptyState } from '../common/EmptyState';
import Tabs from '../../../atoms/tabs/Tabs.jsx';

function AIAssistantContent() {
  const { chatHistory } = useAIAssistant();
  const showEmptyState = chatHistory.length === 0;
  const [selectedTab, setSelectedTab] = useState('response');

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
      <Tabs
        items={[
          { text: 'Response', id: 'response' },
          { text: 'Chat', id: 'chat' },
        ]}
        defaultSelected={0}
        onSelect={(item) => setSelectedTab(item.id)}
      />
      <Box grow="Yes" direction="Column" style={{ position: 'relative', overflow: 'hidden' }}>
        {selectedTab === 'response' && <GeneratedResponseBox />}
        {selectedTab === 'chat' && (
          <Scroll variant="Background" visibility="Hover">
            <Box direction="Column" gap="400" style={{ padding: '16px', minHeight: '100%' }}>
              <SelectedMessageBox />
              {showEmptyState ? <EmptyState /> : <ChatHistory />}
            </Box>
          </Scroll>
        )}
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
