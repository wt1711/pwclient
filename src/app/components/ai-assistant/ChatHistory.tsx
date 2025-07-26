import React from 'react';
import { Box, Text, Spinner } from 'folds';

type ChatWithAIAssistantMessage = {
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
};

type ChatHistoryProps = {
  chatHistory: ChatWithAIAssistantMessage[];
  isLoading: boolean;
};

export function ChatHistory({ chatHistory, isLoading }: ChatHistoryProps) {
  if (chatHistory.length === 0) {
    return null;
  }

  return (
    <Box direction="Column" gap="200">
      <Text size="L400" style={{ fontWeight: 'bold' }}>
        Lịch sử trò chuyện:
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
