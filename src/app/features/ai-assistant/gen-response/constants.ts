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
