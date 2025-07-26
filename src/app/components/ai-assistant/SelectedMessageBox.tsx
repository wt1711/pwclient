import React from 'react';
import { Box, Text, Icon, IconButton } from 'folds';
import { Icons } from 'folds';
import { useRoomMessage } from '../../features/room/RoomMessageContext';

export function SelectedMessageBox() {
  const { selectedMessage, setSelectedMessage } = useRoomMessage();

  if (!selectedMessage) {
    return null;
  }

  const handleClearSelection = () => {
    setSelectedMessage(null);
  };

  return (
    <Box
      direction="Column"
      gap="200"
      style={{
        margin: '16px',
        padding: '16px',
        backgroundColor: '#2a2a3a',
        borderRadius: '8px',
        border: '1px solid #5a5a6a',
        position: 'relative',
      }}
    >
      <Box direction="Row" justifyContent="SpaceBetween" alignItems="Center">
        <Text size="T300" style={{ color: '#bcb6eb', fontWeight: '500' }}>
          Tin nhắn đã chọn
        </Text>
        <IconButton variant="SurfaceVariant" size="200" radii="300" onClick={handleClearSelection}>
          <Icon src={Icons.Cross} size="100" />
        </IconButton>
      </Box>

      <Box
        style={{
          padding: '12px',
          backgroundColor: '#1a1a1a',
          borderRadius: '6px',
          border: '1px solid #404040',
        }}
      >
        <Text style={{ color: '#fff', lineHeight: '1.4' }}>{selectedMessage.text}</Text>
      </Box>
    </Box>
  );
}
