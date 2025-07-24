import React from 'react';
import { Avatar, Box, Icon, Icons, Text } from 'folds';

export function EmptyState() {
  return (
    <Box
      grow="Yes"
      direction="Column"
      justifyContent="Center"
      alignItems="Center"
      gap="200"
      style={{ height: '100%' }}
    >
      <Avatar size="400">
        <Icon src={Icons.User} size="400" />
      </Avatar>
      <Text size="H4">Hỏi Wingman ngay</Text>
      <Text align="Center" style={{ maxWidth: '200px' }}>
        Nhấp vào một tin nhắn để nhận gợi ý, hoặc hỏi Wingman một câu hỏi chung.
      </Text>
    </Box>
  );
}
