import React from 'react';
import { Box } from 'folds';
import { useAIAssistant } from '../AIAssistantContext';
import './GeneratedResponseBox.scss';
import { LoadingState } from './LoadingState';
import { PersonaSelector } from './PersonaSelector';
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
      return <LoadingState />;
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
