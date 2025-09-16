import React from 'react';
import { Avatar, Box, Header, Text } from 'folds';
import wingmanPFP from '~/app/features/ai-assistant/assets/wingman.png';
import { useAIAssistant } from '~/app/features/ai-assistant/AIAssistantContext';

export function AIAssistantHeader() {
  const { locale } = useAIAssistant();
  const TITLES = {
    EN: `Wingman AI support`,
    VI: `Wingman AI hỗ trợ`,
  };
  const title = TITLES[locale as keyof typeof TITLES];
  return (
    <Header variant="Surface" size="600" style={{ marginTop: '12px' }}>
      <Box grow="Yes" alignItems="Center" gap="200">
        <Avatar size="300" style={{ borderRadius: '100%', marginLeft: '10px' }}>
          <img src={wingmanPFP} alt="Wingman" style={{ width: '100%', height: '100%' }} />
        </Avatar>
        <Text size="T400">{title}</Text>
      </Box>
    </Header>
  );
}
