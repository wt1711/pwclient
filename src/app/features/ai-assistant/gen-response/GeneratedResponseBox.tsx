import React from 'react';
import { Box, Spinner, Button, Text } from 'folds';
import { useAIAssistant } from '../AIAssistantContext';

export function GeneratedResponseBox() {
  const { isGeneratingResponse, generatedResponse, handleUseSuggestion } = useAIAssistant();

  return (
    <Box
      direction="Column"
      style={{
        width: '100%',
      }}
    >
      {isGeneratingResponse ? (
        <Box alignItems="Center" justifyContent="Center" style={{ padding: '16px' }}>
          <Spinner size="200" />
        </Box>
      ) : (
        <Box direction="Column" style={{ width: '100%', color: 'white' }}>
          {generatedResponse}
          <Button
            variant="Secondary"
            fill="Soft"
            size="400"
            radii="300"
            type="button"
            onClick={() => handleUseSuggestion(generatedResponse)}
          >
            <Text size="B400">Use Suggestion</Text>
          </Button>
        </Box>
      )}
    </Box>
  );
}
