import React from 'react';
import { Box, Text, Spinner, Button } from 'folds';
import { useAIAssistant } from '../AIAssistantContext';

export function GeneratedResponseBox() {
  const { isGeneratingResponse, locale, generatedResponse, handleUseSuggestion } = useAIAssistant();
  const TITLES = {
    EN: ['Use Suggestion'],
    VI: ['Dùng gợi ý'],
  };
  const [useSuggestionTitle] = TITLES[locale as keyof typeof TITLES] || [''];

  const renderContent = () => {
    if (isGeneratingResponse) {
      return (
        <Box alignItems="Center" justifyContent="Center" style={{ padding: '16px' }}>
          <Spinner size="200" />
        </Box>
      );
    }
    if (generatedResponse) {
      return (
        <Box direction="Column" style={{ width: '100%', gap: '8px' }}>
          <Text size="B400">{generatedResponse}</Text>
          <Button
            onClick={() => handleUseSuggestion(generatedResponse)}
            disabled={isGeneratingResponse}
            fill="Soft"
            style={{ width: '100%', padding: '12px 8px' }}
          >
            <Text size="B400">{useSuggestionTitle}</Text>
          </Button>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box
      direction="Column"
      style={{
        width: '100%',
      }}
    >
      {renderContent()}
    </Box>
  );
}
