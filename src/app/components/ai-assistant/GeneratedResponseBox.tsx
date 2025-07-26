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
        backgroundColor: 'var(--bg-surface-raised)',
      }}
    >
      <Text size="L400" style={{ fontWeight: 'bold', color: 'var(--fg-primary)' }}>
        Hỗ trợ nhắn tin
      </Text>
      {generatedResponse ? (
        <Box direction="Column" gap="300">
          <Box
            style={{
              padding: '24px 16px',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '8px',
              border: '1px solid var(--bg-surface-border)',
              minHeight: '60px',
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Text style={{ color: 'var(--fg-primary)', lineHeight: '1.5' }}>
              {generatedResponse}
            </Text>
          </Box>
          <Box direction="Row" gap="200" justifyContent="Center">
            <Button
              onClick={onUseSuggestion}
              rel="noreferrer noopener"
              fill="Solid"
              disabled={!generatedResponse}
              style={{
                border: '1px solid var(--bg-surface-border)',
              }}
            >
              <Text size="B400" style={{ color: 'var(--fg-on-primary)' }}>
                Dùng gợi ý này
              </Text>
            </Button>
            <Button
              onClick={generateNewResponse}
              rel="noreferrer noopener"
              fill="Soft"
              disabled={isGeneratingResponse}
              style={{
                padding: '12px 24px',
              }}
            >
              <Text size="B400" style={{ color: 'var(--fg-primary)' }}>
                Lấy gợi ý mới
              </Text>
            </Button>
          </Box>
        </Box>
      ) : (
        <Box direction="Column" gap="300" alignItems="Center" style={{ padding: '24px 12px' }}>
          <Button variant="Primary" onClick={generateNewResponse} disabled={isGeneratingResponse}>
            {isGeneratingResponse ? <Spinner size="200" /> : <Text size="B400">Tạo gợi ý</Text>}
          </Button>
        </Box>
      )}
    </Box>
  );
}
