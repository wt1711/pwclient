import React from 'react';
import { Avatar, Box, Text } from 'folds';
import wingmanPFP from '~/app/features/ai-assistant/wingman.png';
import { useAIAssistant } from '~/app/features/ai-assistant/AIAssistantContext';

export function EmptyState() {
  const { locale } = useAIAssistant();
  const TITLES = {
    EN: [`Ask Wingman about the convo`, `or a specific message`],
    VI: [`Hỏi Wingman về cuộc hội thoại`, `hoặc một tin nhắn cụ thể`],
  };
  const title = TITLES[locale as keyof typeof TITLES];
  return (
    <Box
      grow="Yes"
      direction="Column"
      justifyContent="Center"
      alignItems="Center"
      gap="200"
      style={{ height: '100%' }}
    >
      <Avatar size="500" style={{ borderRadius: '100%' }}>
        <img src={wingmanPFP} alt="Wingman" style={{ width: '100%', height: '100%' }} />
      </Avatar>
      {/* <Text size="H4">Hỏi Wingman ngay</Text> */}
      <Text align="Center" style={{ maxWidth: '300px' }}>
        {title[0]}
      </Text>
      <Text align="Center" style={{ maxWidth: '300px' }}>
        {title[1]}
      </Text>
    </Box>
  );
}
