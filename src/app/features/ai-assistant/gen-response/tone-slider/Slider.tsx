import React from 'react';
import { Box, Text } from 'folds';
import { colorScale } from '~/app/features/ai-assistant/utils/data';
import './Slider.scss';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label: string;
}

export function Slider({ value, onChange, min = 0, max = 100, step = 1, label }: SliderProps) {
  const numTicks = 50;

  return (
    <Box direction="Column" className="generatedResponseBox__sliderContainer">
      <Text
        size="O400"
        align="Center"
        className="generatedResponseBox__toneLabel"
        style={{
          color: colorScale(value).hex(),
        }}
      >
        {`${label.toUpperCase()} (${value}%)`}
      </Text>
      <div className="slider-container">
        <div className="slider-ticks">
          {Array.from({ length: numTicks + 1 }).map((_, i) => {
            const isMajor = i % 5 === 0;
            const childID = `tick-${i}`;
            return <div key={childID} className={`tick ${isMajor ? 'major' : ''}`} />;
          })}
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="slider"
        />
      </div>
    </Box>
  );
}
