import React, { useState } from 'react';
import { Box, Text, Spinner, Button } from 'folds';
import { useAIAssistant } from '../AIAssistantContext';
import { Slider } from '../../../atoms/slider/Slider';

export function GeneratedResponseBox() {
  const { isGeneratingResponse, locale, generatedResponse, handleUseSuggestion } = useAIAssistant();
  const [sliderValue, setSliderValue] = useState(50);

  const TITLES = {
    EN: ['Use Suggestion'],
    VI: ['Dùng gợi ý'],
  };
  const [useSuggestionTitle] = TITLES[locale as keyof typeof TITLES] || [''];

  const getSliderLabel = (value: number) => {
    if (value < 25) return 'Safe';
    if (value < 75) return 'Fun';
    return 'Wild';
  };

  const renderContent = () => {
    if (isGeneratingResponse) {
      return (
        <Box alignItems="Center" justifyContent="Center" style={{ padding: '16px' }}>
          <Spinner size="200" />
        </Box>
      );
    }
    if (generatedResponse) {
      return (
        <Box direction="Column" style={{ width: '100%', gap: '8px' }}>
          <Box direction="Row" alignItems="Center" style={{ gap: '8px' }}>
            <span>❄️</span>
            <Slider value={sliderValue} onChange={setSliderValue} />
            <span>🔥</span>
          </Box>
          <Text size="T500" style={{ textAlign: 'center', color: 'white' }}>
            {getSliderLabel(sliderValue)}
          </Text>
          <Text size="B400" style={{ color: 'white' }}>
            {generatedResponse}
          </Text>
          <Button
            onClick={() => handleUseSuggestion(generatedResponse)}
            disabled={isGeneratingResponse}
            fill="Soft"
            style={{ width: '100%', padding: '12px 8px' }}
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
      style={{
        width: '100%',
      }}
    >
      {renderContent()}
    </Box>
  );
}
