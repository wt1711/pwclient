import React from 'react';
import { Avatar, Box, Text } from 'folds';
import wingmanPFP from '../wingman.png';

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
      <Avatar size="500">
        <img src={wingmanPFP} alt="Wingman" style={{ width: '100%', height: '100%' }} />
      </Avatar>
      <Text size="H4">Hỏi Wingman ngay</Text>
      <Text align="Center" style={{ maxWidth: '300px' }}>
        Nhận gợi ý hoặc phân tích về cuộc hội thoại từ Wingman
      </Text>
    </Box>
  );
}
