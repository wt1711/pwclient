import React, { useMemo, useEffect, useState } from 'react';
import './PredictiveMessage.scss';
import { Room } from 'matrix-js-sdk';
import { gradeMessage, Message } from '../../../ai-assistant/ai';
import { useMatrixClient } from '../../../../hooks/useMatrixClient';
import { isFromMe } from '../../../ai-assistant/utils';

export const predictiveMessages = [
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

type ReactionGrade = {
  grade: string;
  emoji: string;
  explanation: string;
};

export function getReactionGrade(score: number): ReactionGrade {
  if (score === 0) {
    return {
      grade: 'She will not respond',
      emoji: '😐',
      explanation: 'Very warm, attractive, and likely to get a positive reaction.',
    };
  }
  if (score >= 90) {
    return {
      grade: 'She’ll love it',
      emoji: '💖',
      explanation: 'Very warm, attractive, and likely to get a positive reaction.',
    };
  }
  if (score >= 70) {
    return {
      grade: 'Strong interest',
      emoji: '😍',
      explanation: 'Flirty or kind, shows confidence — high chance she’s into it.',
    };
  }
  if (score >= 40) {
    return {
      grade: 'Neutral-good',
      emoji: '🙂',
      explanation: 'Safe and pleasant, but not especially exciting.',
    };
  }
  if (score >= 10) {
    return {
      grade: 'Lukewarm',
      emoji: '😐',
      explanation: 'Okay, but might feel bland or not stand out.',
    };
  }
  if (score >= -9) {
    return {
      grade: 'Risky / Unclear',
      emoji: '🤔',
      explanation: 'Could be read multiple ways — not strongly good or bad.',
    };
  }
  if (score >= -39) {
    return {
      grade: 'Weak / Awkward',
      emoji: '😬',
      explanation: 'Might come across poorly, awkward or confusing.',
    };
  }
  if (score >= -69) {
    return {
      grade: 'Bad Vibes',
      emoji: '😡',
      explanation: 'Likely to annoy or turn her off.',
    };
  }
  if (score >= -89) {
    return {
      grade: 'Very bad',
      emoji: '🚩',
      explanation: 'Feels pushy, rude, or inappropriate — strong negative reaction.',
    };
  }
  return {
    grade: 'She’ll block you',
    emoji: '⛔',
    explanation: 'Extremely offensive, creepy, or disrespectful. Almost guaranteed rejection.',
  };
}

export function getTextHash(text: string): number {
  return text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

interface PredictiveMessageProps {
  editorText: string;
  room: Room;
}
export function PredictiveMessage({ editorText, room }: PredictiveMessageProps) {
  const [score, setScore] = useState<number | null>(null);
  const mx = useMatrixClient();

  useEffect(() => {
    const getScore = async () => {
      if (editorText.trim().length > 0) {
        const timeline = room.getLiveTimeline().getEvents();
        const roomContext: Message[] = timeline
          .filter((event) => event.getSender() && event.getContent().body)
          .map((event) => ({
            sender: event.getSender() as string,
            text: event.getContent().body as string,
            timestamp: new Date(event.getTs()).toISOString(),
            is_from_me: isFromMe(event.getSender() as string, mx.getUserId() as string),
          }));

        const newScore = await gradeMessage({ message: editorText, context: roomContext });
        setScore(newScore);
      } else {
        setScore(null);
      }
    };
    getScore();
  }, [editorText, room, mx]);

  const prediction = useMemo(() => {
    if (score === null) return null;
    const analysis = getReactionGrade(score);
    return { ...analysis, score };
  }, [score]);

  if (!prediction) return null;

  return (
    <div className="predictive-message">
      <p>
        {prediction.emoji} &nbsp; {prediction.grade} ({prediction.score}%)
      </p>
    </div>
  );
}
