import React, { useState } from 'react';
import { Box, Button, Icon, Icons, Text } from 'folds';
import { Slider } from './Slider';
import { ToneSelector } from './ToneSelector';

export function ToneTuning() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Box direction="Column" gap="100">
      <Button
        variant="Secondary"
        fill="Soft"
        size="300"
        radii="300"
        outlined
        before={
          <Icon src={isExpanded ? Icons.ChevronTop : Icons.ChevronBottom} size="100" filled />
        }
        onClick={() => setIsExpanded((prev) => !prev)}
      >
        <Text size="B300">{isExpanded ? 'Hide Tone Tuning' : 'Show Tone Tuning'}</Text>
      </Button>
      {isExpanded && (
        <Box direction="Column" gap="200">
          <Slider />
          <ToneSelector />
        </Box>
      )}
    </Box>
  );
}
