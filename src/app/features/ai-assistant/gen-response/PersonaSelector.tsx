import React from 'react';
import { Button } from 'folds';
import cn from 'classnames';
import { personas } from './constants';
import './PersonaSelector.scss';

interface PersonaSelectorProps {
  selectedPersona: typeof personas[0];
  onSelectPersona: (persona: typeof personas[0]) => void;
}

export function PersonaSelector({ selectedPersona, onSelectPersona }: PersonaSelectorProps) {
  return (
    <div className="persona-selector">
      {personas.map((persona) => (
        <Button
          key={persona.id}
          className={cn('persona-selector__button', {
            'persona-selector__button--selected': selectedPersona.id === persona.id,
          })}
          onClick={() => onSelectPersona(persona)}
        >
          {persona.label}
        </Button>
      ))}
    </div>
  );
}
