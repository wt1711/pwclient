import React, { useState } from 'react';
import { Box, Text, Spinner, Button } from 'folds';
import cn from 'classnames';
import { useAIAssistant } from '../AIAssistantContext';
import { Slider } from './slider/Slider';
import { useDebouncedCallback } from '~/app/hooks/useDebouncedCallback';
import './GeneratedResponseBox.scss';
import { LoadingState } from './LoadingState';
import { toneProperties, colorScale, personas } from './constants';
import { PersonaSelector } from './PersonaSelector';

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
          <Box direction="Column" alignItems="Center" className="generatedResponseBox__response">
            {isGeneratingResponse ? (
              <Spinner size="300" />
            ) : (
              <Text size="B400">{generatedResponse}</Text>
            )}
          </Box>

          <PersonaSelector
            selectedPersona={selectedPersona}
            onSelectPersona={handlePersonaChange}
          />

          <Box
            direction="Column"
            alignItems="Center"
            className="generatedResponseBox__toneSelector"
          >
            <Box
              direction="Row"
              justifyContent="Center"
              className="generatedResponseBox__toneButtons"
            >
              {toneProperties.map((prop) => (
                <Button
                  key={prop.id}
                  onClick={() => setSelectedProperty(prop)}
                  className={cn('generatedResponseBox__toneButton', {
                    'generatedResponseBox__toneButton--selected': selectedProperty.id === prop.id,
                  })}
                >
                  <Text size="T500">{prop.emoji}</Text>
                </Button>
              ))}
            </Box>
          </Box>

          <Box direction="Column" className="generatedResponseBox__sliderContainer">
            <Text
              size="T400"
              align="Center"
              className="generatedResponseBox__toneLabel"
              style={{ color: colorScale(toneValues[selectedProperty.id]).hex() }}
            >
              {`${selectedProperty.label.toUpperCase()} (${toneValues[selectedProperty.id]})`}
            </Text>
            <Slider
              value={toneValues[selectedProperty.id]}
              onChange={handleSliderChange}
              min={0}
              max={100}
              step={1}
            />
            <Box direction="Row" justifyContent="SpaceBetween">
              <Text size="B400" className="generatedResponseBox__sliderLabel">
                {selectedProperty.minLabel}
              </Text>
              <Text size="B400" className="generatedResponseBox__sliderLabel">
                {selectedProperty.maxLabel}
              </Text>
            </Box>
          </Box>
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
