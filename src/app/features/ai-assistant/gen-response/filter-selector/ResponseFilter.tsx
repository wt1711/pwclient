import React from 'react';
import { Box, Text, Button } from 'folds';
import cn from 'classnames';
import { Slider } from '../slider/Slider';
import { toneProperties } from '../constants';
import '../GeneratedResponseBox.scss';

interface ToneProperty {
  id: string;
  emoji: string;
  label: string;
  minLabel: string;
  maxLabel: string;
}

interface ResponseFilterProps {
  selectedProperty: ToneProperty;
  setSelectedProperty: (property: ToneProperty) => void;
  toneValues: Record<string, number>;
  onSliderChange: (value: number) => void;
}

export function ResponseFilter({
  selectedProperty,
  setSelectedProperty,
  toneValues,
  onSliderChange,
}: ResponseFilterProps) {
  return (
    <>
      <Slider
        value={toneValues[selectedProperty.id]}
        onChange={onSliderChange}
        min={0}
        max={100}
        step={1}
        label={selectedProperty.label}
      />
      <Box direction="Column" alignItems="Center" className="generatedResponseBox__toneSelector">
        <Box direction="Row" justifyContent="Center" className="generatedResponseBox__toneButtons">
          {toneProperties.map((prop) => (
            <Box direction="Column" alignItems="Center">
              <Button
                key={prop.id}
                onClick={() => setSelectedProperty(prop)}
                className={cn('generatedResponseBox__toneButton', {
                  'generatedResponseBox__toneButton--selected': selectedProperty.id === prop.id,
                })}
              >
                <Text size="T500">{prop.emoji}</Text>
              </Button>
              <Text className="generatedResponseBox__toneValue">{toneValues[prop.id]}</Text>
            </Box>
          ))}
        </Box>
      </Box>
    </>
  );
}
