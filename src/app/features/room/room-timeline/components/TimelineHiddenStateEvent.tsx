import React from 'react';
import { MatrixEvent } from 'matrix-js-sdk';
import { Box, Icons, Text } from 'folds';

import { useRoomTimelineContext } from '../RoomTimelineContext';
import { getMemberDisplayName } from '../../../../utils/room';
import { getMxIdLocalPart } from '../../../../utils/matrix';
import { Event } from '../../message';
import { EventContent, Time } from '../../../../components/message';
import { MessageLayout } from '../../../../state/settings';
import * as customHtmlCss from '../../../../styles/CustomHtml.css';

interface TimelineHiddenStateEventProps {
  mEventId: string;
  mEvent: MatrixEvent;
  item: number;
}

export function TimelineHiddenStateEvent({
  mEventId,
  mEvent,
  item,
}: TimelineHiddenStateEventProps) {
  const {
    room,
    showHiddenEvents,
    focusItem,
    messageLayout,
    messageSpacing,
    canRedact,
    hideActivity,
    showDeveloperTools,
    mx,
  } = useRoomTimelineContext();

  if (!showHiddenEvents) return null;

  const highlighted = focusItem?.index === item && focusItem.highlight;
  const senderId = mEvent.getSender() ?? '';
  const senderName = getMemberDisplayName(room, senderId) || getMxIdLocalPart(senderId);

  const timeJSX = <Time ts={mEvent.getTs()} compact={messageLayout === MessageLayout.Compact} />;

  return (
    <Event
      key={mEvent.getId()}
      data-message-item={item}
      data-message-id={mEventId}
      room={room}
      mEvent={mEvent}
      highlight={highlighted}
      messageSpacing={messageSpacing}
      canDelete={canRedact || mEvent.getSender() === mx.getUserId()}
      hideReadReceipts={hideActivity}
      showDeveloperTools={showDeveloperTools}
    >
      <EventContent
        messageLayout={messageLayout}
        time={timeJSX}
        iconSrc={Icons.Code}
        content={
          <Box grow="Yes" direction="Column">
            <Text size="T300" priority="300">
              <b>{senderName}</b>
              {' sent '}
              <code className={customHtmlCss.Code}>{mEvent.getType()}</code>
              {' state event'}
            </Text>
          </Box>
        }
      />
    </Event>
  );
}
