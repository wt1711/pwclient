import React from 'react';
import { Box, Text } from 'folds';
import { colorScale } from '~/app/features/ai-assistant/utils/data';
import { useAIAssistant } from '~/app/features/ai-assistant/AIAssistantContext';
import './Slider.scss';

export function Slider() {
  const { selectedProperty, toneValues, handleSliderChange } = useAIAssistant();

  const value = toneValues[selectedProperty.id];
  const { label } = selectedProperty;
  const min = 0;
  const max = 100;
  const step = 1;
  const numTicks = 50;

  return (
    <Box direction="Column" style={{ width: '100%' }}>
      <Text
        size="O400"
        align="Center"
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
          onChange={(e) => handleSliderChange(Number(e.target.value))}
          className="slider"
        />
      </div>
    </Box>
  );
}
