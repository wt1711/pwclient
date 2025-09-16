import React from 'react';
import './Slider.scss';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function Slider({ value, onChange, min = 0, max = 100, step = 1 }: SliderProps) {
  const numTicks = 50;

  return (
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
  );
}
