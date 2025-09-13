import React from 'react';
import { Box, Scroll } from 'folds';
import * as css from './AIAssistant.css';
import { ChatHistory } from '~/app/features/ai-assistant/dashboard/ChatHistory';
import { ChatInput } from '~/app/features/ai-assistant/dashboard/ChatInput';
import { AIAssistantHeader } from '~/app/features/ai-assistant/dashboard/AIAssistantHeader';
import { SelectedMessageBox } from '~/app/features/ai-assistant/dashboard/SelectedMessageBox';
import {
  AIAssistantProvider,
  useAIAssistant,
} from '~/app/features/ai-assistant/AIAssistantContext';
import { AIAssistantStats } from '~/app/features/ai-assistant/dashboard/AIAssistantStats';
import { AIChatHeader } from '~/app/features/ai-assistant/dashboard/AIChatHeader';
import { EmptyState } from '~/app/features/ai-assistant/dashboard/EmptyState';

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
