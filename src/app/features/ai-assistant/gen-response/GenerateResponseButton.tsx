import React from 'react';
import { IconButton } from 'folds';
import { useAIAssistant } from '~/app/features/ai-assistant/AIAssistantContext';
import GenResponseIcon from '~/app/features/ai-assistant/assets/gen-response.svg';
import GenResponseActiveIcon from '~/app/features/ai-assistant/assets/gen-response-active.svg';

export function GenerateResponseButton() {
  const { regenerateResponse, generatedResponse, toggleAIAssistant } = useAIAssistant();

  const renderGenerateIcon = () => {
    if (generatedResponse) {
      return <img src={GenResponseActiveIcon} alt="Regenerate Response" height={30} />;
    }
    return <img src={GenResponseIcon} alt="Regenerate Response" height={30} />;
  };

  return (
    <IconButton
      onClick={() => {
        if (generatedResponse) {
          toggleAIAssistant(false);
          return;
        }

        toggleAIAssistant(true);
        regenerateResponse();
      }}
      variant="SurfaceVariant"
      size="300"
      radii="300"
    >
      {renderGenerateIcon()}
    </IconButton>
  );
}
