import React from 'react';
import { Box } from 'folds';
import { PersonaSelector } from '~/app/features/ai-assistant/gen-response/personal-selector/PersonaSelector';
import { Slider } from '~/app/features/ai-assistant/gen-response/tone-slider/Slider';
import { ToneSelector } from '~/app/features/ai-assistant/gen-response/tone-selector/ToneSelector';
import { useAIAssistant } from '~/app/features/ai-assistant/AIAssistantContext';
import { useEscapeKey } from '~/app/features/ai-assistant/utils/utils';

export function GeneratedResponseBox() {
  const { isAIAssistantOpen, toggleAIAssistant } = useAIAssistant();

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
        <Slider />
        <ToneSelector />
        <PersonaSelector />
      </Box>
    </Box>
  );
}
