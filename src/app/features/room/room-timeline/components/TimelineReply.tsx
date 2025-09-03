import React from 'react';
import { EventTimelineSet } from 'matrix-js-sdk';

import { Reply } from '../../../../components/message';
import { useRoomTimelineContext } from '../RoomTimelineContext';

interface TimelineReplyProps {
  timelineSet: EventTimelineSet;
  replyEventId: string;
  threadRootId?: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export function TimelineReply({
  timelineSet,
  replyEventId,
  threadRootId,
  onClick,
}: TimelineReplyProps) {
  const {
    room,
    getPowerLevel,
    getPowerLevelTag,
    accessibleTagColors,
    legacyUsernameColor,
    direct,
  } = useRoomTimelineContext();

  return (
    <Reply
      room={room}
      timelineSet={timelineSet}
      replyEventId={replyEventId}
      threadRootId={threadRootId}
      onClick={onClick}
      getPowerLevel={getPowerLevel}
      getPowerLevelTag={getPowerLevelTag}
      accessibleTagColors={accessibleTagColors}
      legacyUsernameColor={legacyUsernameColor || direct}
    />
  );
}
