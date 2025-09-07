import React, { useState } from 'react';
import { Box, Text, Spinner, Button } from 'folds';
import { useAIAssistant } from '../AIAssistantContext';
import { Slider } from './slider/Slider';
import { useDebouncedCallback } from '../../../hooks/useDebouncedCallback';
import { ContainerColor } from '../../../styles/ContainerColor.css';

export function GeneratedResponseBox() {
  const {
    isGeneratingResponse,
    locale,
    generatedResponse,
    handleUseSuggestion,
    generateNewResponseFromMessage,
  } = useAIAssistant();
  const [sliderValue, setSliderValue] = useState(1);

  // Fix: Ensure the debounced function accepts any arguments to match the expected type
  const debouncedGenerateResponse = useDebouncedCallback((...args: unknown[]) => {
    // Forward only the first argument as tone, since generateNewResponseFromMessage expects (tone?: string)
    generateNewResponseFromMessage(args[0] as string | undefined);
  }, 500);

  const TITLES = {
    EN: ['Use Suggestion'],
    VI: ['Dùng gợi ý'],
  };
  const [useSuggestionTitle] = TITLES[locale as keyof typeof TITLES] || [''];

  const getSliderLabel = (value: number) => {
    if (value === 0) return 'Nice Guy';
    if (value === 1) return 'Gentleman';
    return 'Bad Boy';
  };

  const handleSliderChange = (value: number) => {
    setSliderValue(value);
    debouncedGenerateResponse(getSliderLabel(value));
  };

  const renderContent = () => {
    if (isGeneratingResponse) {
      return (
        <Box alignItems="Center" justifyContent="Center" style={{ padding: '24px' }}>
          <Spinner size="200" />
        </Box>
      );
    }
    if (generatedResponse) {
      return (
        <Box direction="Column" style={{ width: '100%', gap: '12px' }}>
          <Box direction="Row" alignItems="Center" style={{ gap: '8px' }}>
            <span>❄️</span>
            <Slider value={sliderValue} onChange={handleSliderChange} min={0} max={2} step={1} />
            <span>🔥</span>
          </Box>
          <Text size="T500" style={{ textAlign: 'center' }}>
            {getSliderLabel(sliderValue)}
          </Text>
          <Text size="B400">{generatedResponse}</Text>
          <Button
            onClick={() => handleUseSuggestion(generatedResponse)}
            disabled={isGeneratingResponse}
            fill="Soft"
            style={{ width: '100%', padding: '10px 8px' }}
          >
            <Text size="B400">{useSuggestionTitle}</Text>
          </Button>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box
      direction="Column"
      className={ContainerColor({ variant: 'SurfaceVariant' })}
      style={{
        width: '100%',
        padding: '12px',
        borderRadius: '8px',
      }}
    >
      {renderContent()}
    </Box>
  );
}
