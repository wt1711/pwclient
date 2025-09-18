import React from 'react';
import { Box, Spinner } from 'folds';
import { useAIAssistant } from '../AIAssistantContext';
import './GeneratedResponseBox.scss';
import { PersonaSelector } from './persona-selector/PersonaSelector';
import { ResponseFilter } from './ResponseFilter';

export function GeneratedResponseBox() {
  const {
    isGeneratingResponse,
    generatedResponse,
    selectedProperty,
    setSelectedProperty,
    toneValues,
    handleSliderChange,
    selectedPersona,
    handlePersonaChange,
  } = useAIAssistant();

  const renderContent = () => {
    if (isGeneratingResponse && !generatedResponse) {
      return (
        <Box
          alignItems="Center"
          justifyContent="Center"
          className="loadingState"
          style={{ height: '300px', width: '320px' }}
        >
          <Spinner size="600" />
        </Box>
      );
    }
    if (generatedResponse) {
      return (
        <Box direction="Column" className="generatedResponseBox__content">
          <ResponseFilter
            selectedProperty={selectedProperty}
            setSelectedProperty={setSelectedProperty}
            toneValues={toneValues}
            onSliderChange={handleSliderChange}
          />
          <PersonaSelector
            selectedPersona={selectedPersona}
            onSelectPersona={handlePersonaChange}
          />
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
