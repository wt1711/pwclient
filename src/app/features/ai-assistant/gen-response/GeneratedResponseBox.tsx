import React from 'react';
import { Box } from 'folds';
import { useAIAssistant } from '../AIAssistantContext';
import './GeneratedResponseBox.scss';
import { PersonaSelector } from './persona-selector/PersonaSelector';
import { ResponseFilter } from './filter-selector/ResponseFilter';

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
        <ResponseFilter
          selectedProperty={selectedProperty}
          setSelectedProperty={setSelectedProperty}
          toneValues={toneValues}
          onSliderChange={handleSliderChange}
        />
        <PersonaSelector selectedPersona={selectedPersona} onSelectPersona={handlePersonaChange} />
      </Box>
    </Box>
  );
}
