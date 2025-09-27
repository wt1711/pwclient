import React from 'react';
import { Box, Icon, IconButton, Icons, Input, Spinner } from 'folds';

interface ChatInputProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  handleSend: () => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export function ChatInput({
  inputValue,
  setInputValue,
  handleSend,
  isLoading = false,
  placeholder = 'Type a message...',
  disabled = false,
}: ChatInputProps) {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box style={{ padding: '16px', borderTop: '1px solid var(--bg-surface-border)' }}>
      <Box direction="Row" gap="200" alignItems="End">
        <Input
          variant="Background"
          value={inputValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          style={{ flexGrow: 1 }}
          disabled={disabled || isLoading}
        />
        <IconButton
          variant="Primary"
          onClick={handleSend}
          disabled={isLoading || !inputValue.trim() || disabled}
          aria-label="Send message"
        >
          {isLoading ? (
            <Spinner size="200" />
          ) : (
            <Icon src={Icons.Send} />
          )}
        </IconButton>
      </Box>
    </Box>
  );
}