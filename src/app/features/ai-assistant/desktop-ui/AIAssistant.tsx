import React from 'react';
import { Box, Scroll } from 'folds';
import * as css from './AIAssistant.css';
import { GeneratedResponseBox } from '../common/GeneratedResponseBox';
import { ChatHistory } from '../common/ChatHistory';
import { ChatInput } from '../common/ChatInput';
import { AIAssistantHeader } from '../common/AIAssistantHeader';
import { SelectedMessageBox } from '../common/SelectedMessageBox';
import { AIAssistantProvider, useAIAssistant } from '../AIAssistantContext';
import { AIAssistantStats } from '../common/AIAssistantStats';
import { EmptyState } from '../common/EmptyState';

function AIAssistantContent() {
  const { chatHistory } = useAIAssistant();

  const showEmptyState = chatHistory.length === 0;

  return (
    <Box className={css.AIAssistant} shrink="No" direction="Column">
      <AIAssistantHeader />
      <AIAssistantStats />

      <Box grow="Yes" direction="Column" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Generated Response Box */}
        <GeneratedResponseBox />
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
