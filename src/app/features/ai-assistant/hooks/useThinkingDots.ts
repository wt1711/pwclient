import { useState, useEffect } from 'react';

/**
 * Custom hook that provides animated thinking dots
 * Cycles through: "Thinking.", "Thinking..", "Thinking..."
 *
 * @param isActive - Whether the animation should be active
 * @param interval - Animation interval in milliseconds (default: 500ms)
 * @returns The current thinking text with animated dots
 */
export function useThinkingDots(isActive: boolean, interval: number = 500): string {
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    if (!isActive) {
      setDotCount(1);
      return;
    }

    const timer = setInterval(() => {
      setDotCount((prev) => (prev >= 3 ? 1 : prev + 1));
    }, interval);

    return () => clearInterval(timer);
  }, [isActive, interval]);

  return `Thinking${'.'.repeat(dotCount)}`;
}
