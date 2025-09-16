import React, { useState } from 'react';
import { Box, Text, Spinner, Button } from 'folds';
import cn from 'classnames';
import chroma from 'chroma-js';
import { useAIAssistant } from '../AIAssistantContext';
import { Slider } from './slider/Slider';
import { useDebouncedCallback } from '~/app/hooks/useDebouncedCallback';
import './GeneratedResponseBox.scss';
import { LoadingState } from './LoadingState';

const colorScale = chroma
  .scale(['#00C853', '#AEEA00', '#FFD600', '#FF6D00', '#D50000'])
  .domain([0, 25, 50, 75, 100]);

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
  { id: 'energy', emoji: '⚡️', label: 'Energy', minLabel: 'Chill', maxLabel: 'Hype/excited' },
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
    const payload = {
      filter: 'Main Character',
      persona: 3,
      ...newTones,
    };
    generateNewResponseFromMessage(payload);
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
      return <LoadingState />;
    }
    if (generatedResponse) {
      return (
        <Box direction="Column" className="generatedResponseBox__content">
          <Box direction="Column" alignItems="Center" className="generatedResponseBox__response">
            {isGeneratingResponse ? (
              <Spinner size="300" />
            ) : (
              <Text size="B400">{generatedResponse}</Text>
            )}
          </Box>

          <Box
            direction="Column"
            alignItems="Center"
            className="generatedResponseBox__toneSelector"
          >
            <Box
              direction="Row"
              justifyContent="Center"
              className="generatedResponseBox__toneButtons"
            >
              {toneProperties.map((prop) => (
                <Button
                  key={prop.id}
                  onClick={() => setSelectedProperty(prop)}
                  className={cn('generatedResponseBox__toneButton', {
                    'generatedResponseBox__toneButton--selected': selectedProperty.id === prop.id,
                  })}
                >
                  <Text size="T500">{prop.emoji}</Text>
                </Button>
              ))}
            </Box>
          </Box>

          <Box direction="Column" className="generatedResponseBox__sliderContainer">
            <Text
              size="T400"
              align="Center"
              className="generatedResponseBox__toneLabel"
              style={{ color: colorScale(toneValues[selectedProperty.id]).hex() }}
            >
              {`${selectedProperty.label.toUpperCase()} (${toneValues[selectedProperty.id]})`}
            </Text>
            <Slider
              value={toneValues[selectedProperty.id]}
              onChange={handleSliderChange}
              min={0}
              max={100}
              step={1}
            />
            <Box direction="Row" justifyContent="SpaceBetween">
              <Text size="B400" className="generatedResponseBox__sliderLabel">
                {selectedProperty.minLabel}
              </Text>
              <Text size="B400" className="generatedResponseBox__sliderLabel">
                {selectedProperty.maxLabel}
              </Text>
            </Box>
          </Box>

          <Button
            onClick={() => handleUseSuggestion(generatedResponse)}
            disabled={isGeneratingResponse}
            fill="Soft"
            className="generatedResponseBox__useSuggestionButton"
          >
            <Text size="B400" className="generatedResponseBox__useSuggestionButtonText">
              {useSuggestionTitle}
            </Text>
          </Button>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box direction="Column" className="generatedResponseBox">
      {renderContent()}
    </Box>
  );
}
