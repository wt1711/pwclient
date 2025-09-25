import React, { useEffect } from 'react';
import { Spinner, Box, Icon, IconButton, Icons } from 'folds';
import { useAIAssistant } from '~/app/features/ai-assistant/AIAssistantContext';
import { GeneratedResponseBox } from '~/app/features/ai-assistant/gen-response/GeneratedResponseBox';

const styles = {
  container: {
    padding: '8px 14px',
    fontSize: '14px',
    color: 'var(--tc-surface-low)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  text: {
    margin: 0,
    lineHeight: 1.4,
  },
  popout: {
    position: 'absolute',
    bottom: 'calc(100%)',
    left: 0,
    zIndex: 1000,
  },
} as const;

const useEscapeKey = (isOpen: boolean, onClose: () => void) => {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);
};

interface PredictiveMessageProps {
  editorText: string;
}
export function PredictiveMessage({ editorText }: PredictiveMessageProps) {
  const {
    isAIAssistantOpen,
    toggleAIAssistant,
    generateInitialResponse,
    prediction,
    gradeEditorText,
  } = useAIAssistant();
  const aiAssistantBtnRef = React.useRef<HTMLButtonElement>(null);
  const popoutContentRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      gradeEditorText(editorText);
    }, 500); // 500ms debounce delay

    return () => clearTimeout(timeoutId);
  }, [editorText, gradeEditorText]);

  useEscapeKey(isAIAssistantOpen, () => toggleAIAssistant(false));

  if (!prediction) {
    return (
      <div style={styles.container}>
        <Spinner size="200" />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <p style={styles.text}>
        {prediction.emoji} &nbsp; {prediction.grade} ({prediction.score}%)
      </p>
      <IconButton
        ref={aiAssistantBtnRef}
        onClick={() => {
          if (isAIAssistantOpen) {
            toggleAIAssistant(false);
          } else {
            generateInitialResponse();
          }
        }}
        variant="SurfaceVariant"
        size="300"
        radii="300"
      >
        <Icon src={Icons.Setting} />
      </IconButton>
      {isAIAssistantOpen && (
        <Box ref={popoutContentRef} direction="Column" style={styles.popout}>
          <GeneratedResponseBox />
        </Box>
      )}
    </div>
  );
}
