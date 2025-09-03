import React from 'react';
import { EventTimelineSet, MatrixEvent } from 'matrix-js-sdk';
import { config } from 'folds';

import { useRoomTimelineContext } from '../RoomTimelineContext';
import { getEventReactions } from '../../../../utils/room';
import { Message, Reactions } from '../../message';
import { ImageContent, MSticker, RedactedContent } from '../../../../components/message';
import { Image } from '../../../../components/media';
import { ImageViewer } from '../../../../components/image-viewer';

interface TimelineStickerMessageProps {
  mEventId: string;
  mEvent: MatrixEvent;
  item: number;
  timelineSet: EventTimelineSet;
  collapse: boolean;
}

export function TimelineStickerMessage({
  mEventId,
  mEvent,
  item,
  timelineSet,
  collapse,
}: TimelineStickerMessageProps) {
  const {
    room,
    messageSpacing,
    messageLayout,
    canRedact,
    canSendReaction,
    canPinEvent,
    imagePackRooms,
    handleUserClick,
    handleUsernameClick,
    handleReplyClick,
    handleReactionToggle,
    hideActivity,
    showDeveloperTools,
    getPowerLevel,
    getPowerLevelTag,
    accessibleTagColors,
    legacyUsernameColor,
    direct,
    focusItem,
    mediaAutoLoad,
    mx,
  } = useRoomTimelineContext();

  const reactionRelations = getEventReactions(timelineSet, mEventId);
  const reactions = reactionRelations && reactionRelations.getSortedAnnotationsByKey();
  const hasReactions = reactions && reactions.length > 0;
  const highlighted = focusItem?.index === item && focusItem.highlight;
  const senderPowerLevel = getPowerLevel(mEvent.getSender());

  return (
    <Message
      key={mEvent.getId()}
      data-message-item={item}
      data-message-id={mEventId}
      room={room}
      mEvent={mEvent}
      messageSpacing={messageSpacing}
      messageLayout={messageLayout}
      collapse={collapse}
      highlight={highlighted}
      canDelete={canRedact || mEvent.getSender() === mx.getUserId()}
      canSendReaction={canSendReaction}
      canPinEvent={canPinEvent}
      imagePackRooms={imagePackRooms}
      relations={hasReactions ? reactionRelations : undefined}
      onUserClick={handleUserClick}
      onUsernameClick={handleUsernameClick}
      onReplyClick={handleReplyClick}
      onReactionToggle={handleReactionToggle}
      reactions={
        reactionRelations && (
          <Reactions
            style={{ marginTop: config.space.S200 }}
            room={room}
            relations={reactionRelations}
            mEventId={mEventId}
            canSendReaction={canSendReaction}
            onReactionToggle={handleReactionToggle}
          />
        )
      }
      hideReadReceipts={hideActivity}
      showDeveloperTools={showDeveloperTools}
      powerLevelTag={getPowerLevelTag(senderPowerLevel)}
      accessibleTagColors={accessibleTagColors}
      legacyUsernameColor={legacyUsernameColor || direct}
    >
      {mEvent.isRedacted() ? (
        <RedactedContent reason={mEvent.getUnsigned().redacted_because?.content.reason} />
      ) : (
        <MSticker
          content={mEvent.getContent()}
          renderImageContent={(props) => (
            <ImageContent
              {...props}
              autoPlay={mediaAutoLoad}
              renderImage={(p) => <Image {...p} loading="lazy" />}
              renderViewer={(p) => <ImageViewer {...p} />}
            />
          )}
        />
      )}
    </Message>
  );
}
