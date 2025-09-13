import React from 'react';
import { Box, Text, Spinner } from 'folds';
import { useAIAssistant } from '~/app/features/ai-assistant/AIAssistantContext';

export function ChatHistory() {
  const { chatHistory, isLoading, locale } = useAIAssistant();

  if (chatHistory.length === 0) {
    return null;
  }
  const TITLES = {
    EN: `Chat with Wingman AI:`,
    VI: `Chat với Wingman AI:`,
  };
  const title = TITLES[locale as keyof typeof TITLES];

  return (
    <Box direction="Column" gap="200" style={{ marginTop: '32px' }}>
      <Text size="L400">{title}</Text>
      {chatHistory.map((chat) => (
        <Box key={chat.timestamp} alignSelf={chat.sender === 'user' ? 'End' : 'Start'}>
          <Box
            style={{
              padding: '8px 12px',
              borderRadius: '12px',
              backgroundColor:
                chat.sender === 'user' ? 'var(--bg-surface-hover)' : 'var(--bg-surface-extra-low)',
            }}
          >
            <Text>{chat.text}</Text>
          </Box>
        </Box>
      ))}
      {isLoading && (
        <Box alignSelf="Start">
          <Spinner size="200" />
        </Box>
      )}
    </Box>
  );
}
