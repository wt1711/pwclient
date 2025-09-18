import React, { useState } from 'react';
import { Box } from 'folds';
import { useAIAssistant } from '../AIAssistantContext';
import { useDebouncedCallback } from '~/app/hooks/useDebouncedCallback';
import './GeneratedResponseBox.scss';
import { LoadingState } from './LoadingState';
import { toneProperties, personas } from './constants';
import { PersonaSelector } from './PersonaSelector';
import { ResponseFilter } from './ResponseFilter';

export function GeneratedResponseBox() {
  const { isGeneratingResponse, generatedResponse, generateNewResponseFromMessage } =
    useAIAssistant();
  const [selectedProperty, setSelectedProperty] = useState(toneProperties[0]);
  const [selectedPersona, setSelectedPersona] = useState(personas[3]);
  const [toneValues, setToneValues] = useState<Record<string, number>>(
    toneProperties.reduce((acc, prop) => ({ ...acc, [prop.id]: 50 }), {})
  );

  const debouncedGenerateResponse = useDebouncedCallback((newTones: any) => {
    const payload = {
      filter: selectedPersona.filter,
      persona: selectedPersona.persona,
      ...newTones,
    };
    generateNewResponseFromMessage(payload);
  }, 500);

  const handleSliderChange = (value: number) => {
    const newToneValues = {
      ...toneValues,
      [selectedProperty.id]: value,
    };
    setToneValues(newToneValues);
    debouncedGenerateResponse(newToneValues);
  };

  const handlePersonaChange = (persona: typeof personas[0]) => {
    setSelectedPersona(persona);
    debouncedGenerateResponse(toneValues);
  };

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
