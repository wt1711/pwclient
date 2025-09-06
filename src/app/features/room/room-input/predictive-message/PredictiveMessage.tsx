import React, { useMemo } from 'react';
import './PredictiveMessage.scss';

const predictiveMessages = [
  { emoji: '😥', text: 'feeling uncomfortable (-thoughtfulness)' },
  { emoji: '😑', text: 'Losing interest' },
  { emoji: '🤔', text: 'feeling skeptical' },
  { emoji: '😕', text: 'is confused' },
  { emoji: '😟', text: 'is worried' },
  { emoji: '😬', text: 'feeling awkward' },
  { emoji: '😠', text: 'getting angry' },
  { emoji: '🥱', text: 'seems bored' },
  { emoji: '😥', text: 'feeling hurt' },
  { emoji: '🧐', text: 'is questioning your assumptions' },
];

function getTextHash(text: string): number {
  return text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

interface PredictiveMessageProps {
  editorText: string;
}
export function PredictiveMessage({ editorText }: PredictiveMessageProps) {
  const message = useMemo(() => {
    if (editorText.trim().length === 0) return null;
    const hash = getTextHash(editorText);
    return predictiveMessages[hash % predictiveMessages.length];
  }, [editorText]);

  if (!message) return null;

  return (
    <div className="predictive-message">
      <p>
        {message.emoji} {message.text}
      </p>
    </div>
  );
}
