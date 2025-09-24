import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { Spinner, Box, Icon, IconButton, Icons } from 'folds';
import { Room } from 'matrix-js-sdk';
import './PredictiveMessage.scss';
import { useMatrixClient } from '~/app/hooks/useMatrixClient';
import { gradeMessage } from '~/app/features/ai-assistant/utils/ai';
// import type { Message } from '~/app/features/ai-assistant/utils/ai';
import { isFromMe } from '~/app/features/ai-assistant/utils/utils';
import { useAIAssistant } from '~/app/features/ai-assistant/AIAssistantContext';
import { GeneratedResponseBox } from '~/app/features/ai-assistant/gen-response/GeneratedResponseBox';
import { getReactionGrade } from '~/app/features/ai-assistant/utils/data';

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
  room: Room;
}
export function PredictiveMessage({ editorText, room }: PredictiveMessageProps) {
  const [score, setScore] = useState<number | null>(null);
  const mx = useMatrixClient();
  const { isAIAssistantOpen, toggleAIAssistant, generateInitialResponse } = useAIAssistant();
  const aiAssistantBtnRef = React.useRef<HTMLButtonElement>(null);
  const popoutContentRef = React.useRef<HTMLDivElement>(null);

  const roomContext = useMemo(() => {
    const timeline = room.getLiveTimeline().getEvents();
    return timeline
      .filter((event) => event.getSender() && event.getContent().body)
      .map((event) => ({
        sender: event.getSender() as string,
        text: event.getContent().body as string,
        timestamp: new Date(event.getTs()).toISOString(),
        is_from_me: isFromMe(event.getSender() as string, mx.getUserId() as string),
      }));
  }, [room, mx]);

  const debouncedGradeMessage = useCallback(
    async (text: string) => {
      if (text.trim().length > 0) {
        const newScore = await gradeMessage({ message: text, context: roomContext });
        setScore(newScore);
      } else {
        setScore(null);
      }
    },
    [roomContext]
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      debouncedGradeMessage(editorText);
    }, 500); // 500ms debounce delay

    return () => clearTimeout(timeoutId);
  }, [editorText, debouncedGradeMessage]);

  useEscapeKey(isAIAssistantOpen, () => toggleAIAssistant(false));

  const prediction = useMemo(() => {
    if (score === null) return null;
    const analysis = getReactionGrade(score);
    return { ...analysis, score };
  }, [score]);

  const handleAIAssistantClick = useCallback(() => {
    if (isAIAssistantOpen) {
      toggleAIAssistant(false);
    } else {
      generateInitialResponse();
    }
  }, [isAIAssistantOpen, toggleAIAssistant, generateInitialResponse]);

  const aiAssistantButton = useMemo(
    () => (
      <IconButton
        ref={aiAssistantBtnRef}
        onClick={handleAIAssistantClick}
        variant="SurfaceVariant"
        size="300"
        radii="300"
      >
        <Icon src={Icons.Setting} />
      </IconButton>
    ),
    [handleAIAssistantClick]
  );

  const popoutContent = useMemo(
    () =>
      isAIAssistantOpen && (
        <Box
          ref={popoutContentRef}
          direction="Column"
          style={{
            position: 'absolute',
            bottom: 'calc(100%)',
            left: 0,
            zIndex: 1000,
          }}
        >
          <GeneratedResponseBox />
        </Box>
      ),
    [isAIAssistantOpen]
  );

  if (!prediction) {
    return (
      <div className="predictive-message">
        <Spinner size="200" />
      </div>
    );
  }

  return (
    <div className="predictive-message">
      <p>
        {prediction.emoji} &nbsp; {prediction.grade} ({prediction.score}%)
      </p>
      {aiAssistantButton}
      {popoutContent}
    </div>
  );
}
