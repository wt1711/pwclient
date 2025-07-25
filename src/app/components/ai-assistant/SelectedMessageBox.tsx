import React from 'react';
import { Box, Text, Icon, Icons, IconButton } from 'folds';
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
        margin: '16px 0px',
        backgroundColor: 'var(--bg-surface-raised)',
        borderRadius: '8px',
        position: 'relative',
      }}
    >
      <Box direction="Row" justifyContent="SpaceBetween" alignItems="Center">
        <Text size="L400">Tin nhắn đã chọn</Text>
        <IconButton variant="SurfaceVariant" size="300" radii="300" onClick={handleClearSelection}>
          <Icon src={Icons.Cross} size="100" />
        </IconButton>
      </Box>

      <Box
        style={{
          padding: '12px',
          backgroundColor: 'var(--bg-surface-low)',
          borderRadius: '8px',
          border: '1px solid var(--bg-surface-border)',
        }}
      >
        <Text style={{ lineHeight: '1.4' }}>{selectedMessage.text}</Text>
      </Box>
    </Box>
  );
}
