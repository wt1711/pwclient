import React, { useMemo, useEffect, useState } from 'react';
import { Spinner, Box, Icon, IconButton, Icons } from 'folds';
import { Room } from 'matrix-js-sdk';
import './PredictiveMessage.scss';
import { useMatrixClient } from '~/app/hooks/useMatrixClient';
import { gradeMessage, Message } from '~/app/features/ai-assistant/utils/ai';
import { isFromMe } from '~/app/features/ai-assistant/utils/utils';
import { useAIAssistant } from '~/app/features/ai-assistant/AIAssistantContext';
import { GeneratedResponseBox } from '~/app/features/ai-assistant/gen-response/gen-response-box/GeneratedResponseBox';
import { getReactionGrade } from '~/app/features/ai-assistant/utils/data';

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

  useEffect(() => {
    if (!isAIAssistantOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        toggleAIAssistant(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAIAssistantOpen, toggleAIAssistant]);

  const prediction = useMemo(() => {
    if (score === null) return null;
    const analysis = getReactionGrade(score);
    return { ...analysis, score };
  }, [score]);

  if (!prediction)
    return (
      <div className="predictive-message">
        <Spinner size="200" />
      </div>
    );

  return (
    <div className="predictive-message">
      <p>
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
      )}
    </div>
  );
}
