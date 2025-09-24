import chroma from 'chroma-js';

export const colorScale = chroma
  .scale(['#00C853', '#AEEA00', '#FFD600', '#FF6D00', '#D50000'])
  .domain([0, 25, 50, 75, 100]);

export const toneProperties = [
  {
    id: 'spiciness',
    emoji: '🌶️',
    label: 'Spiciness',
    minLabel: 'Mild teasing',
    maxLabel: 'Heavy innuendo',
  },
  {
    id: 'boldness',
    emoji: '💪',
    label: 'Boldness',
    minLabel: 'Reserved',
    maxLabel: 'Alpha assertive',
  },
  { id: 'thirst', emoji: '💦', label: 'Thirst', minLabel: 'Subtle interest', maxLabel: 'Down bad' },
  { id: 'energy', emoji: '⚡️', label: 'Energy', minLabel: 'Chill', maxLabel: 'Hype/excited' },
  { id: 'toxicity', emoji: '☠️', label: 'Toxicity', minLabel: 'Nice guy', maxLabel: 'Villain arc' },
  { id: 'humour', emoji: '🤡', label: 'Humour', minLabel: 'Dry wit', maxLabel: 'Full clown' },
  {
    id: 'emojiUse',
    emoji: '😂',
    label: 'Emoji Use',
    minLabel: 'Clean text',
    maxLabel: 'Gen Z emoji spam',
  },
];

export const personas = [
  {
    id: 'chad',
    label: 'Chad',
    filter: 'Chad',
    persona: 1,
  },
  {
    id: 'rizz',
    label: 'Rizz',
    filter: 'Rizz',
    persona: 2,
  },
  {
    id: 'simp',
    label: 'Simp',
    filter: 'Simp',
    persona: 3,
  },
  {
    id: 'main-character',
    label: 'Main Character',
    filter: 'Main Character',
    persona: 4,
  },
];

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
