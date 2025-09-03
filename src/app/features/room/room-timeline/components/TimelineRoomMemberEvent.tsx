import React from 'react';
import { MatrixEvent } from 'matrix-js-sdk';
import { Box, Text } from 'folds';

import { useRoomTimelineContext } from '../RoomTimelineContext';
import { isMembershipChanged } from '../../../../utils/room';
import { Time, EventContent } from '../../../../components/message';
import { MessageLayout } from '../../../../state/settings';
import { Event } from '../../message';

interface TimelineRoomMemberEventProps {
  mEventId: string;
  mEvent: MatrixEvent;
  item: number;
}

export function TimelineRoomMemberEvent({ mEventId, mEvent, item }: TimelineRoomMemberEventProps) {
  const {
    room,
    hideMembershipEvents,
    hideNickAvatarEvents,
    focusItem,
    parseMemberEvent,
    messageLayout,
    messageSpacing,
    canRedact,
    hideActivity,
    showDeveloperTools,
    mx,
  } = useRoomTimelineContext();

  const membershipChanged = isMembershipChanged(mEvent);
  if (membershipChanged && hideMembershipEvents) return null;
  if (!membershipChanged && hideNickAvatarEvents) return null;

  const highlighted = focusItem?.index === item && focusItem.highlight;
  const parsed = parseMemberEvent(mEvent);

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
        iconSrc={parsed.icon}
        content={
          <Box grow="Yes" direction="Column">
            <Text size="T300" priority="300">
              {parsed.body}
            </Text>
          </Box>
        }
      />
    </Event>
  );
}
