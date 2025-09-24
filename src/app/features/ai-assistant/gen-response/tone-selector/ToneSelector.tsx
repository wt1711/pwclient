import React from 'react';
import { Box, Text, Button } from 'folds';
import cn from 'classnames';
import { toneProperties } from '~/app/features/ai-assistant/utils/data';
import { useAIAssistant } from '~/app/features/ai-assistant/AIAssistantContext';
import './ToneSelector.scss';

export function ToneSelector() {
  const { selectedProperty, setSelectedProperty, toneValues } = useAIAssistant();
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
