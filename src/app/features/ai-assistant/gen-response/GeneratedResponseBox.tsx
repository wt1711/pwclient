import React from 'react';
import { Box } from 'folds';
import { useAIAssistant } from '~/app/features/ai-assistant/AIAssistantContext';
import { PersonaSelector } from '~/app/features/ai-assistant/gen-response/persona-selector/PersonaSelector';
import { Slider } from '~/app/features/ai-assistant/gen-response/tone-slider/Slider';
import { ToneSelector } from '~/app/features/ai-assistant/gen-response/tone-selector/ToneSelector';

export function GeneratedResponseBox() {
  const {
    selectedProperty,
    setSelectedProperty,
    toneValues,
    handleSliderChange,
    selectedPersona,
    handlePersonaChange,
  } = useAIAssistant();

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
      <Box direction="Column" gap="200" className="generatedResponseBox__content">
        <Slider
          value={toneValues[selectedProperty.id]}
          onChange={handleSliderChange}
          min={0}
          max={100}
          step={1}
          label={selectedProperty.label}
        />
        <ToneSelector
          selectedProperty={selectedProperty}
          setSelectedProperty={setSelectedProperty}
          toneValues={toneValues}
        />
        <PersonaSelector selectedPersona={selectedPersona} onSelectPersona={handlePersonaChange} />
      </Box>
    </Box>
  );
}
