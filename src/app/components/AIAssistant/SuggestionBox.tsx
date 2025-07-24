import React from 'react';
import { Box, Text } from 'folds';

export function SuggestionBox({ content }: { content: string }) {
  const parts = content.split(':');
  const sender = parts.length > 1 ? parts[0] : null;
  const messageText = parts.length > 1 ? parts.slice(1).join(':').trim() : content;

  return (
    <Box direction="Column" gap="200">
      <Text size="L400">GỢI Ý CHO TIN NHẮN:</Text>
      <Box
        style={{
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '12px',
        }}
        direction="Column"
        gap="100"
      >
        {sender && <Text style={{ fontWeight: 'bold' }}>{sender}:</Text>}
        <Text>{messageText}</Text>
      </Box>
    </Box>
  );
}
