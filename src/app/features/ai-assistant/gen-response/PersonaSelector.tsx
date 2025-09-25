import React from 'react';
import { Box } from 'folds';
import { personas } from '~/app/features/ai-assistant/utils/data';
import { useAIAssistant } from '~/app/features/ai-assistant/AIAssistantContext';

const styles = {
  container: {
    display: 'flex',
    padding: '10px 12px',
    marginBottom: '8px',
    borderRadius: '9999px',
    border: '1px solid rgba(255, 255, 255, 0.44)',
    background: 'var(--white-shade-opacity-10, rgba(255, 255, 255, 0.1))',
    boxShadow: '0 15px 26px 0 rgba(29, 29, 29, 0.2)',
    backdropFilter: 'blur(50px)',
    gap: '8px',
    justifyContent: 'space-evenly',
  },
  button: {
    flex: '0 0 auto',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    height: '40px',
    padding: '8px 20px',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    gap: '4px',
    color: 'var(--white-shade-opacity-100, #fff)',
    fontFeatureSettings: "'liga' off, 'clig' off",
    fontFamily: 'SF Pro',
    fontSize: '15px',
    fontStyle: 'normal',
    fontWeight: 700,
    lineHeight: '20px',
    letterSpacing: '-0.2px',
    whiteSpace: 'nowrap',
  },
  selectedButton: {
    borderRadius: '999px',
    background: 'var(--white-shade-opacity-25, rgba(255, 255, 255, 0.25))',
  },
} as const;

export function PersonaSelector() {
  const { selectedPersona, handlePersonaChange } = useAIAssistant();
  return (
    <div style={styles.container}>
      {personas.map((persona) => (
        <Box
          key={persona.id}
          style={{
            ...styles.button,
            ...(selectedPersona.id === persona.id ? styles.selectedButton : {}),
          }}
          onClick={() => handlePersonaChange(persona)}
        >
          {persona.label}
        </Box>
      ))}
    </div>
  );
}
