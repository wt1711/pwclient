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
        padding: '20px',
        backgroundColor: '#1a1a1a',
        borderRadius: '12px',
        border: '1px solid #333',
      }}
    >
      <Text size="L400" style={{ fontWeight: 'bold', color: '#fff' }}>
        GỢI Ý CHO TIN NHẮN:
      </Text>
      {generatedResponse ? (
        <Box direction="Column" gap="300">
          <Box
            style={{
              padding: '16px',
              backgroundColor: '#2a2a2a',
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
            <Button variant="Primary" onClick={onUseSuggestion} disabled={!generatedResponse}>
              <Text size="B400">Dùng gợi ý</Text>
            </Button>
            <Button
              variant="Secondary"
              onClick={generateNewResponse}
              disabled={isGeneratingResponse}
            >
              <Text size="B400">Tạo gợi ý mới</Text>
            </Button>
          </Box>
        </Box>
      ) : (
        <Box direction="Column" gap="300" alignItems="Center" style={{ padding: '24px 0' }}>
          <Text size="T400" style={{ color: '#ccc', textAlign: 'center' }}>
            Chưa có gợi ý nào được tạo
          </Text>
          <Button variant="Primary" onClick={generateNewResponse} disabled={isGeneratingResponse}>
            {isGeneratingResponse ? <Spinner size="200" /> : <Text size="B400">Tạo gợi ý mới</Text>}
          </Button>
        </Box>
      )}
    </Box>
  );
}
