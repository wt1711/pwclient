import React from 'react';
import { Box, Text, Spinner } from 'folds';
import { useAIAssistant } from './AIAssistantContext';

export function ChatHistory() {
  const { chatHistory, isLoading } = useAIAssistant();

  if (chatHistory.length === 0) {
    return null;
  }

  return (
    <Box direction="Column" gap="200" style={{ marginTop: '32px' }}>
      <Text size="L400">Chat với Wingman AI:</Text>
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
