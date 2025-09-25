import React from 'react';
import { Box } from 'folds';
import cn from 'classnames';
import { personas } from '~/app/features/ai-assistant/utils/data';
import { useAIAssistant } from '~/app/features/ai-assistant/AIAssistantContext';
import './PersonaSelector.scss';

export function PersonaSelector() {
  const { selectedPersona, handlePersonaChange } = useAIAssistant();
  return (
    <div className="persona-selector">
      {personas.map((persona) => (
        <Box
          key={persona.id}
          className={cn('persona-selector__button', {
            'persona-selector__button--selected': selectedPersona.id === persona.id,
          })}
          onClick={() => handlePersonaChange(persona)}
        >
          {persona.label}
        </Box>
      ))}
    </div>
  );
}
