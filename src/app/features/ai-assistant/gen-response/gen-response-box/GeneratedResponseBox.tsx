import React from 'react';
import { Box } from 'folds';
import { useAIAssistant } from '~/app/features/ai-assistant/AIAssistantContext';
import './GeneratedResponseBox.scss';
import { PersonaSelector } from '~/app/features/ai-assistant/gen-response/persona-selector/PersonaSelector';
import { Slider } from '~/app/features/ai-assistant/gen-response/slider/Slider';
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
    <Box direction="Column" className="generatedResponseBox">
      <Box direction="Column" className="generatedResponseBox__content">
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
