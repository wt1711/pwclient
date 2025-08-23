import React from 'react';
import { Box, Text, Spinner, Button } from 'folds';
import { useAIAssistant } from '../AIAssistantContext';

export function GeneratedResponseBox() {
  const { isGeneratingResponse, generateNewResponseFromMessage, generateNewResponseFromHistory } =
    useAIAssistant();

  return (
    <Box
      direction="Column"
      gap="300"
      style={{
        margin: '16px',
        backgroundColor: 'var(--bg-surface-raised)',
      }}
    >
      <Box direction="Row" alignItems="Center" justifyContent="Center" gap="200">
        {isGeneratingResponse ? (
          <Spinner size="200" />
        ) : (
          <>
            <Button
              size="500"
              fill="Solid"
              variant="Primary"
              onClick={generateNewResponseFromMessage}
              disabled={isGeneratingResponse}
            >
              <Text size="H6">Trả lời tiếp</Text>
            </Button>
            <Button
              size="500"
              fill="Solid"
              variant="Primary"
              onClick={generateNewResponseFromHistory}
              disabled={isGeneratingResponse}
            >
              <Text size="H6">Gợi chuyện mới</Text>
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
}
