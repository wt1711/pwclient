import React from 'react';
import { Box } from 'folds';
import { PersonaSelector } from '~/app/features/ai-assistant/gen-response/persona-selector/PersonaSelector';
import { Slider } from '~/app/features/ai-assistant/gen-response/tone-slider/Slider';
import { ToneSelector } from '~/app/features/ai-assistant/gen-response/tone-selector/ToneSelector';

export function GeneratedResponseBox() {

  return (
    <Box
      direction="Column"
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '21px 19px 19px 19px',
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
