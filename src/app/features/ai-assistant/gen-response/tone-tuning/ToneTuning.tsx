import React, { useState } from 'react';
import { Box, Icon, Icons, config, Spinner } from 'folds';
import { useAIAssistant } from '~/app/features/ai-assistant/AIAssistantContext';
import { Slider } from './Slider';

import { ToneSelector } from './ToneSelector';

export function ToneTuning() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { regenerateResponse, isGeneratingResponse } = useAIAssistant();

  return (
    <Box direction="Column" style={{ gap: config.space.S300 }}>
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
          <Box
            direction="Row"
            style={{
              alignItems: 'center',
              gap: config.space.S100,
              width: '100%',
            }}
          >
            <Box style={{ flex: 1 }}>
              <Slider />
            </Box>
            <Box
              as="button"
              type="button"
              onClick={() => regenerateResponse()}
              disabled={isGeneratingResponse}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'transparent',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isGeneratingResponse ? 'not-allowed' : 'pointer',
              }}
              aria-label="Regenerate tone response"
            >
              {isGeneratingResponse ? (
                <Spinner size="200" />
              ) : (
                <Icon src={Icons.Reload} size="200" />
              )}
            </Box>
          </Box>
          <ToneSelector />
        </Box>
      )}
    </Box>
  );
}
