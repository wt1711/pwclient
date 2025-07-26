import React from 'react';
import { Box, Text, Spinner, Button } from 'folds';
import { useAIAssistant } from './AIAssistantContext';

export function GeneratedResponseBox() {
  const { generatedResponse, isGeneratingResponse, generateNewResponse, handleUseSuggestion } =
    useAIAssistant();

  const onUseSuggestion = () => {
    if (generatedResponse) {
      handleUseSuggestion(generatedResponse);
    }
  };

  return (
    <Box
      direction="Column"
      gap="300"
      style={{
        margin: '16px',
        backgroundColor: '#1a1a1a',
      }}
    >
      <Text size="L400" style={{ fontWeight: 'bold', color: '#fff' }}>
        Hỗ trợ nhắn tin
      </Text>
      {generatedResponse ? (
        <Box direction="Column" gap="300">
          <Box
            style={{
              padding: '16px 16px',
              backgroundColor: 'green',
              borderRadius: '8px',
              border: '1px solid #404040',
              minHeight: '60px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', lineHeight: '1.5' }}>{generatedResponse}</Text>
          </Box>
          <Box direction="Row" gap="200" justifyContent="Center">
            <Button
              onClick={onUseSuggestion}
              disabled={!generatedResponse}
              style={{
                backgroundColor: '#bcb6eb', // Light purple (lavender)
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                cursor: 'pointer',
                color: '#333',
                fontWeight: '500',
              }}
            >
              <Text size="B400" style={{ color: '#333' }}>
                Dùng gợi ý này
              </Text>
            </Button>
            <Button
              onClick={generateNewResponse}
              disabled={isGeneratingResponse}
              style={{
                backgroundColor: '#423c66', // Dark purple (indigo)
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                cursor: 'pointer',
                color: '#fff',
                fontWeight: '500',
              }}
            >
              <Text size="B400" style={{ color: '#fff' }}>
                Lấy gợi ý mới
              </Text>
            </Button>
          </Box>
        </Box>
      ) : (
        <Box direction="Column" gap="300" alignItems="Center" style={{ padding: '24px 12' }}>
          <Button variant="Primary" onClick={generateNewResponse} disabled={isGeneratingResponse}>
            {isGeneratingResponse ? <Spinner size="200" /> : <Text size="B400">Tạo gợi ý</Text>}
          </Button>
        </Box>
      )}
    </Box>
  );
}
