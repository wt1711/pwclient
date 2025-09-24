import React from 'react';
import { Box, Text, Button } from 'folds';
import cn from 'classnames';
import { toneProperties } from '~/app/features/ai-assistant/data';
import './ToneSelector.scss';

interface ToneProperty {
  id: string;
  emoji: string;
  label: string;
  minLabel: string;
  maxLabel: string;
}

interface ToneSelectorProps {
  selectedProperty: ToneProperty;
  setSelectedProperty: (property: ToneProperty) => void;
  toneValues: Record<string, number>;
}

export function ToneSelector({
  selectedProperty,
  setSelectedProperty,
  toneValues,
}: ToneSelectorProps) {
  return (
    <Box direction="Column" alignItems="Center" className="toneSelector">
      <Box direction="Row" justifyContent="Center" className="toneButtons">
        {toneProperties.map((prop) => (
          <Box direction="Column" alignItems="Center" key={prop.id}>
            <Button
              onClick={() => setSelectedProperty(prop)}
              className={cn('toneButton', {
                'toneButton--selected': selectedProperty.id === prop.id,
              })}
            >
              <Text size="T500">{prop.emoji}</Text>
            </Button>
            <Text className="toneValue">{toneValues[prop.id]}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
