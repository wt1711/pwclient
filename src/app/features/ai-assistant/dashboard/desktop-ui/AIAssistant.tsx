import React from 'react';
import { Box, Scroll } from 'folds';
import * as css from './AIAssistant.css';
import { ChatHistory } from '../ChatHistory';
import { ChatInput } from '../ChatInput';
import { AIAssistantHeader } from '../AIAssistantHeader';
import { SelectedMessageBox } from '../SelectedMessageBox';
import { AIAssistantProvider, useAIAssistant } from '../../AIAssistantContext';
import { AIAssistantStats } from '../AIAssistantStats';
import { AIChatHeader } from '../AIChatHeader';
import { EmptyState } from '../EmptyState';

function AIAssistantContent() {
  const { chatHistory } = useAIAssistant();

  const showEmptyState = chatHistory.length === 0;

  return (
    <Box className={css.AIAssistant} shrink="No" direction="Column">
      <AIChatHeader />
      <AIAssistantStats />
      <AIAssistantHeader />

      <Box grow="Yes" direction="Column" style={{ position: 'relative', overflow: 'hidden' }}>
        <Scroll variant="Background" visibility="Hover">
          <Box direction="Column" gap="400" style={{ padding: '16px', minHeight: '100%' }}>
            {/* Selected Message Box */}
            <SelectedMessageBox />
            {showEmptyState ? (
              <EmptyState />
            ) : (
              <>
                {/* Chat History */}
                <ChatHistory />
              </>
            )}
          </Box>
        </Scroll>
      </Box>
      <ChatInput />
    </Box>
  );
}

export function AIAssistant() {
  return (
    <AIAssistantProvider isMobile={false}>
      <AIAssistantContent />
    </AIAssistantProvider>
  );
}
