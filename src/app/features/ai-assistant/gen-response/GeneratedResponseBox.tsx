import React from 'react';
import { Box, Text, Spinner, Button, Icon, Icons, Line } from 'folds';
import { useAIAssistant } from '../AIAssistantContext';

export function GeneratedResponseBox() {
  const {
    isGeneratingResponse,
    generateNewResponseFromMessage,
    generateNewResponseFromHistory,
    locale,
  } = useAIAssistant();
  const TITLES = {
    EN: ['Reply', 'New Topic'],
    VI: ['Trả lời', 'Chủ đề mới'],
  };
  const [replyTitle, newTopicTitle] = TITLES[locale as keyof typeof TITLES] || ['', ''];

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
      )}
    </Box>
  );
}
