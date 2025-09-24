import React from 'react';
import { Slider } from '../slider/Slider';
import '../GeneratedResponseBox.scss';
import { ToneSelector } from '../tone-selector/ToneSelector';

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
      <ToneSelector
        selectedProperty={selectedProperty}
        setSelectedProperty={setSelectedProperty}
        toneValues={toneValues}
      />
    </>
  );
}
