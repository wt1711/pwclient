import React from 'react';
import { Avatar, Box, Scroll, Text } from 'folds';
import * as css from './AIAssistant.css';
import wingmanPFP from './wingman.png';
import { GeneratedResponseBox } from './GeneratedResponseBox';
import { ChatHistory } from './ChatHistory';
import { ChatInput } from './ChatInput';
import { AIAssistantHeader } from './AIAssistantHeader';
import { SelectedMessageBox } from './SelectedMessageBox';
import { AIAssistantProvider, useAIAssistant } from './AIAssistantContext';

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
    <Box className={css.AIAssistant} shrink="No" direction="Column">
      <AIAssistantHeader />
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
    <AIAssistantProvider>
      <AIAssistantContent />
    </AIAssistantProvider>
  );
}
