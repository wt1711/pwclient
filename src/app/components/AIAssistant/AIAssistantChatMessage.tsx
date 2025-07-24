import React from 'react';
import { Box, Text } from 'folds';
import { ChatMessage } from './AIAssistant';

export function AIAssistantChatMessage({ chat }: { chat: ChatMessage }) {
  return (
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
  );
}
