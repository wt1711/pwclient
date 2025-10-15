import React from 'react';
import { Box, Text, Spinner, color, config } from 'folds';
import { PersonaSelector } from '~/app/features/ai-assistant/gen-response/personal-selector/PersonaSelector';
import { Slider } from '~/app/features/ai-assistant/gen-response/tone-slider/Slider';
import { ToneSelector } from '~/app/features/ai-assistant/gen-response/tone-selector/ToneSelector';
import { useAIAssistant } from '~/app/features/ai-assistant/AIAssistantContext';
import { useEscapeKey } from '~/app/features/ai-assistant/utils/utils';

export function GeneratedResponseBox() {
  const {
    isAIAssistantOpen,
    toggleAIAssistant,
    isGeneratingResponse,
    generatedResponse,
    errorMessage,
  } = useAIAssistant();

  useEscapeKey(isAIAssistantOpen, () => toggleAIAssistant(false));

  return (
    <Box
      direction="Column"
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '21px 19px 19px 19px',
        background: 'rgba(255, 255, 255, 0.10)',
        boxShadow: '0 40px 30px 0 rgba(0, 0, 0, 0.05), 0 1px 1px 0 rgba(255, 255, 255, 0.60) inset',
        backdropFilter: 'blur(50px)',
      }}
    >
      <Box direction="Column" gap="200">
        {errorMessage && (
          <Box
            direction="Row"
            gap="200"
            alignItems="Center"
            style={{
              padding: config.space.S300,
              backgroundColor: color.Critical.Container,
              borderRadius: config.radii.R400,
            }}
          >
            <Text
              size="T300"
              style={{
                color: color.Critical.OnContainer,
              }}
            >
              ⚠️ {errorMessage}
            </Text>
          </Box>
        )}
        {isGeneratingResponse && (
          <Box
            direction="Row"
            justifyContent="Center"
            style={{
              padding: config.space.S300,
            }}
          >
            <Spinner size="300" />
          </Box>
        )}
        {generatedResponse && (
          <Box
            style={{
              padding: config.space.S300,
              backgroundColor: color.Surface.Container,
              borderRadius: config.radii.R400,
              maxHeight: '200px',
              overflowY: 'auto',
            }}
          >
            <Text size="T300">{generatedResponse}</Text>
          </Box>
        )}
        <Slider />
        <ToneSelector />
        <PersonaSelector />
      </Box>
    </Box>
  );
}
