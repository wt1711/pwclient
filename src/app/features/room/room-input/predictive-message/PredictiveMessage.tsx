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

function getRandomMessage() {
  const messages = [...predictiveMessages];
  const firstIndex = Math.floor(Math.random() * messages.length);
  const [firstMessage] = messages.splice(firstIndex, 1);
  return firstMessage;
}

export function PredictiveMessage() {
  const message1 = useMemo(() => getRandomMessage(), []);

  return (
    <div className="predictive-message">
      <p>
        {message1.emoji} {message1.text}
      </p>
    </div>
  );
}
