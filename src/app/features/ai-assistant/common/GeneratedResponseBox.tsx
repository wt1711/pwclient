import React from 'react';
import { Box, Text, Spinner, Button } from 'folds';
import { useAIAssistant } from '../AIAssistantContext';
// import { ScreenSize, useScreenSizeContext } from '../../../hooks/useScreenSize';

function GeneratingResponseButtons({ isGeneratingResponse }: { isGeneratingResponse: boolean }) {
  const { generateNewResponseFromMessage, generateNewResponseFromHistory } = useAIAssistant();
  return (
    <>
      <Button
        size="500"
        fill="Solid"
        variant="Primary"
        onClick={generateNewResponseFromMessage}
        disabled={isGeneratingResponse}
      >
        <Text size="H6">Trả lời tiếp</Text>
      </Button>
      <Button
        size="500"
        fill="Solid"
        variant="Primary"
        onClick={generateNewResponseFromHistory}
        disabled={isGeneratingResponse}
      >
        <Text size="H6">Gợi chuyện mới</Text>
      </Button>
    </>
  );
}

export function GeneratedResponseBox() {
  const { generatedResponse, isGeneratingResponse, handleUseSuggestion } = useAIAssistant();

  const onUseSuggestion = () => {
    if (generatedResponse) {
      handleUseSuggestion(generatedResponse);
    }
  };
  // const screenSize = useScreenSizeContext();
  // const isDesktop = screenSize === ScreenSize.Desktop;

  return (
    <Box
      direction="Column"
      gap="300"
      style={{
        margin: '16px',
        backgroundColor: 'var(--bg-surface-raised)',
      }}
    >
      {/* {isDesktop && <Text size="L400">Hỗ trợ nhắn tin</Text>} */}
      {generatedResponse ? (
        <Box direction="Column" gap="300">
          <Box
            style={{
              padding: '24px 16px',
              backgroundColor: 'var(--bg-surface-low)',
              borderRadius: '8px',
              border: '1px solid var(--bg-surface-border)',
              minHeight: '60px',
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Text>{generatedResponse}</Text>
          </Box>
          {isGeneratingResponse ? (
            <Box direction="Row" gap="200" justifyContent="Center">
              <Spinner size="200" />
            </Box>
          ) : (
            <Box direction="Row" gap="200" justifyContent="Center">
              <Button
                onClick={onUseSuggestion}
                rel="noreferrer noopener"
                fill="Solid"
                disabled={!generatedResponse}
                size="500"
                style={{
                  border: '1px solid var(--bg-surface-border)',
                }}
              >
                <Text size="B400">Dùng mẫu này </Text>
              </Button>
              <GeneratingResponseButtons isGeneratingResponse={isGeneratingResponse} />
            </Box>
          )}
        </Box>
      ) : (
        <Box direction="Row" alignItems="Center" justifyContent="Center" gap="200">
          {isGeneratingResponse ? (
            <Spinner size="200" />
          ) : (
            <GeneratingResponseButtons isGeneratingResponse={isGeneratingResponse} />
          )}
        </Box>
      )}
    </Box>
  );
}
