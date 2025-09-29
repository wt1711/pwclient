import React, { useState } from 'react';
import { Box, Icon, Icons, config } from 'folds';
import { Slider } from './Slider';
import { ToneSelector } from './ToneSelector';

export function ToneTuning() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Box direction="Column" gap="100">
      <Box
        as="button"
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        style={{
          border: 'none',
          background: 'transparent',
          padding: 0,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-label={isExpanded ? 'Hide Tone Tuning' : 'Show Tone Tuning'}
      >
        <Icon src={isExpanded ? Icons.ChevronBottom : Icons.ChevronTop} size="200" />
      </Box>
      {isExpanded && (
        <Box direction="Column" style={{ gap: config.space.S300 }}>
          <Slider />
          <ToneSelector />
        </Box>
      )}
    </Box>
  );
}
