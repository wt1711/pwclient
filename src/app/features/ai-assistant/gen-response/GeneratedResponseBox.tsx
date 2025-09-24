import React from 'react';
import { Box } from 'folds';
import { useAIAssistant } from '../AIAssistantContext';
import './GeneratedResponseBox.scss';
import { PersonaSelector } from './persona-selector/PersonaSelector';
import { Slider } from './slider/Slider';
import { ToneSelector } from './tone-selector/ToneSelector';

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
