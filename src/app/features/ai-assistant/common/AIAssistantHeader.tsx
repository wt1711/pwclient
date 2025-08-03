import React from 'react';
import { Avatar, Box, Header, Text } from 'folds';
import wingmanPFP from '../wingman.png';

// Imports from RoomViewHeader.tsx

export function AIAssistantHeader() {
  return (
    <Header variant="Surface" size="600" style={{ marginTop: '12px' }}>
      <Box grow="Yes" alignItems="Center" gap="200">
        <Avatar size="300" style={{ borderRadius: '100%', marginLeft: '10px' }}>
          <img src={wingmanPFP} alt="Wingman" style={{ width: '100%', height: '100%' }} />
        </Avatar>
        <Text size="T400">Wingman AI</Text>
      </Box>
    </Header>
  );
}
