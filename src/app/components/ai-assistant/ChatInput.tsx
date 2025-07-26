import React from 'react';
import { Box, Icon, IconButton, Icons, Input } from 'folds';
import { useAIAssistant } from './AIAssistantContext';

export function ChatInput() {
  const { inputValue, setInputValue, handleSend, isLoading } = useAIAssistant();

  return (
    <Box style={{ padding: '16px' }} direction="Row" gap="200" alignItems="Center">
      <Input
        variant="Background"
        value={inputValue}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
        onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Enter') handleSend();
        }}
        placeholder="Hỏi Wingman ở đây..."
        style={{ flexGrow: 1 }}
      />
      <IconButton variant="Primary" onClick={handleSend} disabled={isLoading || !inputValue.trim()}>
        <Icon src={Icons.Send} />
      </IconButton>
    </Box>
  );
}
