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
      <Text size="L400" style={{ fontWeight: 'bold' }}>
        Lịch sử trò chuyện với Wingman AI:
      </Text>
      {chatHistory.map((chat) => (
        <Box key={chat.timestamp} alignSelf={chat.sender === 'user' ? 'End' : 'Start'}>
          <Box
            style={{
              padding: '8px 12px',
              borderRadius: '12px',
              color: chat.sender === 'user' ? '#000' : '#fff',
              backgroundColor: chat.sender === 'user' ? '#e0e0e0' : '#262626',
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
