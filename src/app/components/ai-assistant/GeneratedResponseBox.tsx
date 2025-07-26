import React from 'react';
import { Box, Text, Spinner, Button } from 'folds';
import { useAIAssistant } from './AIAssistantContext';

export function GeneratedResponseBox() {
  const { generatedResponse, isGeneratingResponse, generateNewResponse, useSuggestion } =
    useAIAssistant();

  const handleUseSuggestion = () => {
    if (generatedResponse) {
      useSuggestion(generatedResponse);
    }
  };

  return (
    <Box
      direction="Column"
      gap="200"
      style={{
        padding: '16px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
      }}
    >
      <Text size="L400" style={{ fontWeight: 'bold' }}>
        GỢI Ý CHO TIN NHẮN:
      </Text>
      {generatedResponse ? (
        <Box direction="Column" gap="200">
          <Text style={{ padding: '12px', backgroundColor: 'white', borderRadius: '6px' }}>
            {generatedResponse}
          </Text>
          <Box direction="Row" gap="200">
            <Button variant="Primary" onClick={handleUseSuggestion} disabled={!generatedResponse}>
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
        <Box direction="Column" gap="200" alignItems="Center">
          <Text size="T400" style={{ color: '#666' }}>
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
