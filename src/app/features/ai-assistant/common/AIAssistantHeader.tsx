import React from 'react';
import { Avatar, Box, Header, Icon, IconButton, Icons, Text } from 'folds';
import { useSetSetting } from '../../../state/hooks/settings';
import { settingsAtom } from '../../../state/settings';
import { useAIAssistant } from '../AIAssistantContext';
import wingmanPFP from '../wingman.png';

export function AIAssistantHeader() {
  const setAiDrawer = useSetSetting(settingsAtom, 'isAiDrawerOpen');
  const isMobile = useAIAssistant();

  return (
    <Header variant="Surface" size="600" style={{ borderRadius: isMobile ? '12px' : '0px' }}>
      <Box grow="Yes" alignItems="Center" gap="200">
        <Avatar size="200" style={{ borderRadius: '100%' }}>
          <img
            src={wingmanPFP}
            alt="Wingman"
            style={{ width: '100%', height: '100%', marginLeft: '10px' }}
          />
        </Avatar>
        <Text size="T400">Wingman AI</Text>
      </Box>
      <IconButton size="300" onClick={() => setAiDrawer(false)} radii="300">
        <Icon src={Icons.Cross} />
      </IconButton>
    </Header>
  );
}
