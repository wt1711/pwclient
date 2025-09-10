import React, { useState } from 'react';
import { Box, Text, Spinner, Button } from 'folds';
import { useAIAssistant } from '../AIAssistantContext';
import { Slider } from './slider/Slider';
import { useDebouncedCallback } from '../../../hooks/useDebouncedCallback';

const toneProperties = [
  {
    id: 'spiciness',
    emoji: '🌶️',
    label: 'Spiciness',
    minLabel: 'Mild teasing',
    maxLabel: 'Heavy innuendo',
  },
  {
    id: 'boldness',
    emoji: '💪',
    label: 'Boldness',
    minLabel: 'Reserved',
    maxLabel: 'Alpha assertive',
  },
  { id: 'thirst', emoji: '💦', label: 'Thirst', minLabel: 'Subtle interest', maxLabel: 'Down bad' },
  { id: 'energy', emoji: '⚡', label: 'Energy', minLabel: 'Chill', maxLabel: 'Hype/excited' },
  { id: 'toxicity', emoji: '☠️', label: 'Toxicity', minLabel: 'Nice guy', maxLabel: 'Villain arc' },
  { id: 'humour', emoji: '🤡', label: 'Humour', minLabel: 'Dry wit', maxLabel: 'Full clown' },
  {
    id: 'emojiUse',
    emoji: '😂',
    label: 'Emoji Use',
    minLabel: 'Clean text',
    maxLabel: 'Gen Z emoji spam',
  },
];

export function GeneratedResponseBox() {
  const {
    isGeneratingResponse,
    locale,
    generatedResponse,
    handleUseSuggestion,
    generateNewResponseFromMessage,
  } = useAIAssistant();
  const [selectedProperty, setSelectedProperty] = useState(toneProperties[0]);
  const [toneValues, setToneValues] = useState<Record<string, number>>(
    toneProperties.reduce((acc, prop) => ({ ...acc, [prop.id]: 50 }), {})
  );

  const debouncedGenerateResponse = useDebouncedCallback((newTones: any) => {
    const toneString = Object.entries(newTones)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    generateNewResponseFromMessage(toneString);
  }, 500);

  const handleSliderChange = (value: number) => {
    const newToneValues = {
      ...toneValues,
      [selectedProperty.id]: value,
    };
    setToneValues(newToneValues);
    debouncedGenerateResponse(newToneValues);
  };

  const TITLES = {
    EN: ['Use Suggestion'],
    VI: ['Dùng gợi ý'],
  };
  const [useSuggestionTitle] = TITLES[locale as keyof typeof TITLES] || [''];

  const renderContent = () => {
    if (isGeneratingResponse && !generatedResponse) {
      return (
        <Box alignItems="Center" justifyContent="Center" style={{ padding: '24px' }}>
          <Spinner size="200" />
        </Box>
      );
    }
    if (generatedResponse) {
      return (
        <Box direction="Column" style={{ width: '100%', gap: '12px', color: 'white' }}>
          <Box
            direction="Column"
            style={{
              backgroundColor: '#333',
              padding: '12px',
              borderRadius: '12px',
              minHeight: '60px',
              justifyContent: 'center',
            }}
          >
            {isGeneratingResponse && <Spinner size="100" />}
            <Text size="B400">{generatedResponse}</Text>
          </Box>

          <Box direction="Column" alignItems="Center" style={{ gap: '16px', padding: '16px 0' }}>
            <Text size="T400" style={{ fontWeight: 'bold' }}>
              {selectedProperty.label.toUpperCase()}
            </Text>
            <Box direction="Row" justifyContent="Center" style={{ gap: '12px', flexWrap: 'wrap' }}>
              {toneProperties.map((prop) => (
                <Button
                  key={prop.id}
                  onClick={() => setSelectedProperty(prop)}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: selectedProperty.id === prop.id ? '#007aff' : '#333',
                    border: '2px solid',
                    borderColor: selectedProperty.id === prop.id ? '#007aff' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                  }}
                >
                  <Text size="T500">{prop.emoji}</Text>
                </Button>
              ))}
            </Box>
          </Box>

          <Box direction="Column" style={{ width: '100%', gap: '8px', padding: '0 12px' }}>
            <Slider
              value={toneValues[selectedProperty.id]}
              onChange={handleSliderChange}
              min={0}
              max={100}
              step={1}
            />
            <Box direction="Row" justifyContent="SpaceBetween">
              <Text size="B400" style={{ color: '#aaa' }}>
                {selectedProperty.minLabel}
              </Text>
              <Text size="B400" style={{ color: '#aaa' }}>
                {selectedProperty.maxLabel}
              </Text>
            </Box>
          </Box>

          <Button
            onClick={() => handleUseSuggestion(generatedResponse)}
            disabled={isGeneratingResponse}
            fill="Soft"
            style={{
              width: '100%',
              padding: '12px 8px',
              backgroundColor: '#333',
              marginTop: '16px',
            }}
          >
            <Text size="B400" style={{ color: 'white' }}>
              {useSuggestionTitle}
            </Text>
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
        padding: '12px',
        borderRadius: '8px',
        backgroundColor: '#1c1c1e', // Dark background
      }}
    >
      {renderContent()}
    </Box>
  );
}
