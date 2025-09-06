import React from 'react';
import { Box, Text, Spinner, Button, Icon, Icons, Line } from 'folds';
import { useAIAssistant } from '../AIAssistantContext';

export function GeneratedResponseBox() {
  const {
    isGeneratingResponse,
    generateNewResponseFromMessage,
    generateNewResponseFromHistory,
    locale,
    generatedResponse,
    handleUseSuggestion,
  } = useAIAssistant();
  const TITLES = {
    EN: ['Reply', 'New Topic', 'Use Suggestion'],
    VI: ['Trả lời', 'Chủ đề mới', 'Dùng gợi ý'],
  };
  const [replyTitle, newTopicTitle, useSuggestionTitle] = TITLES[locale as keyof typeof TITLES] || [
    '',
    '',
    '',
  ];

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
    return (
      <Box direction="Column" style={{ width: '100%' }}>
        <Button
          onClick={generateNewResponseFromMessage}
          disabled={isGeneratingResponse}
          fill="None"
          style={{ width: '100%', padding: '12px 8px', borderRadius: 0 }}
        >
          <Box
            direction="Row"
            justifyContent="SpaceBetween"
            alignItems="Center"
            style={{ width: '100%' }}
          >
            <Text size="B400">{replyTitle}</Text>
            <Icon src={Icons.Pencil} />
          </Box>
        </Button>
        <Line variant="Surface" />
        <Button
          onClick={generateNewResponseFromHistory}
          disabled={isGeneratingResponse}
          fill="None"
          style={{ width: '100%', padding: '12px 8px', borderRadius: 0 }}
        >
          <Box
            direction="Row"
            justifyContent="SpaceBetween"
            alignItems="Center"
            style={{ width: '100%' }}
          >
            <Text size="B400">{newTopicTitle}</Text>
            <Icon src={Icons.Star} />
          </Box>
        </Button>
      </Box>
    );
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
