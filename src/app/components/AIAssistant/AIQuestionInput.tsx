import React from 'react';
import { Box, Input, IconButton, Icon, Icons } from 'folds';

type AIQuestionInputProps = {
  inputValue: string;
  setInputValue: (value: string) => void;
  handleSend: () => void;
  isLoading: boolean;
};

export function AIQuestionInput({
  inputValue,
  setInputValue,
  handleSend,
  isLoading,
}: AIQuestionInputProps) {
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
