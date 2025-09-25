import React, { useEffect } from 'react';
import { Spinner } from 'folds';
import { useAIAssistant } from '~/app/features/ai-assistant/AIAssistantContext';

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
} as const;

interface PredictiveMessageProps {
  editorText: string;
}
export function PredictiveMessage({ editorText }: PredictiveMessageProps) {
  const { prediction, gradeEditorText } = useAIAssistant();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      gradeEditorText(editorText);
    }, 500); // 500ms debounce delay

    return () => clearTimeout(timeoutId);
  }, [editorText, gradeEditorText]);

  if (!editorText) {
    return null;
  }

  return (
    <div style={styles.container}>
      {prediction ? (
        <p style={styles.text}>
          {prediction.emoji} &nbsp; {prediction.grade} ({prediction.score}%)
        </p>
      ) : (
        <Spinner size="200" />
      )}
    </div>
  );
}
