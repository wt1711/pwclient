import React from 'react';
import { Box, Text, Button } from 'folds';
import cn from 'classnames';
import { Slider } from '../slider/Slider';
import {
  toneProperties,
  // colorScale
} from '../constants';
import './GeneratedResponseBox.scss';

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
      <Box direction="Column" className="generatedResponseBox__sliderContainer">
        <Text
          size="O400"
          align="Center"
          className="generatedResponseBox__toneLabel"
          style={
            {
              // color: colorScale(toneValues[selectedProperty.id]).hex()
            }
          }
        >
          {`${selectedProperty.label.toUpperCase()} (${toneValues[selectedProperty.id]}%)`}
        </Text>
        <Slider
          value={toneValues[selectedProperty.id]}
          onChange={onSliderChange}
          min={0}
          max={100}
          step={1}
        />
        {/* <Box direction="Row" justifyContent="SpaceBetween">
          <Text size="B400" className="generatedResponseBox__sliderLabel">
            {selectedProperty.minLabel}
          </Text>
          <Text size="B400" className="generatedResponseBox__sliderLabel">
            {selectedProperty.maxLabel}
          </Text>
        </Box> */}
      </Box>
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
              {/* <Text className="generatedResponseBox__toneValue">{toneValues[prop.id]}</Text> */}
            </Box>
          ))}
        </Box>
      </Box>
    </>
  );
}
