import React from 'react';
import { Box, config } from 'folds';
import { PersonaSelector } from '~/app/features/ai-assistant/gen-response/personal-selector/PersonaSelector';
import { ToneTuning } from '~/app/features/ai-assistant/gen-response/tone-tuning/ToneTuning';
import { useAIAssistant } from '~/app/features/ai-assistant/AIAssistantContext';
import { useEscapeKey } from '~/app/features/ai-assistant/utils/utils';

export function GeneratedResponseBox() {
  const { isAIAssistantOpen, toggleAIAssistant } = useAIAssistant();

  useEscapeKey(isAIAssistantOpen, () => toggleAIAssistant(false));

  return (
    <Box
      direction="Column"
      style={{
        maxWidth: '468px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box direction="Column" style={{ gap: config.space.S300 }}>
        <ToneTuning />
        <PersonaSelector />
      </Box>
    </Box>
  );
}
