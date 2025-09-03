import React from 'react';
import { EventTimelineSet, MatrixEvent } from 'matrix-js-sdk';
import { config, Text } from 'folds';

import { useRoomTimelineContext } from '../RoomTimelineContext';
import { getEditedEvent, getEventReactions, getMemberDisplayName } from '../../../../utils/room';
import { EncryptedContent, Message, Reactions } from '../../message';
import { TimelineReply } from './TimelineReply';
import {
  ImageContent,
  MessageNotDecryptedContent,
  MessageUnsupportedContent,
  MSticker,
  RedactedContent,
} from '../../../../components/message';
import { Image } from '../../../../components/media';
import { ImageViewer } from '../../../../components/image-viewer';
import { RenderMessageContent } from '../../../../components/RenderMessageContent';
import { GetContentCallback, MessageEvent } from '../../../../../types/matrix/room';
import { getMxIdLocalPart } from '../../../../utils/matrix';
import { MessageLayout } from '../../../../state/settings';

interface TimelineEncryptedMessageProps {
  mEventId: string;
  mEvent: MatrixEvent;
  item: number;
  timelineSet: EventTimelineSet;
  collapse: boolean;
  handleOpenReply: (evt: React.MouseEvent<HTMLButtonElement>) => void;
}

export function TimelineEncryptedMessage({
  mEventId,
  mEvent,
  item,
  timelineSet,
  collapse,
  handleOpenReply,
}: TimelineEncryptedMessageProps) {
  const {
    room,
    messageSpacing,
    messageLayout,
    editId,
    canRedact,
    canSendReaction,
    canPinEvent,
    imagePackRooms,
    handleUserClick,
    handleUsernameClick,
    handleReplyClick,
    handleReactionToggle,
    handleEdit,
    hideActivity,
    showDeveloperTools,
    getPowerLevel,
    getPowerLevelTag,
    accessibleTagColors,
    legacyUsernameColor,
    direct,
    focusItem,
    mediaAutoLoad,
    showUrlPreview,
    htmlReactParserOptions,
    linkifyOpts,
    mx,
  } = useRoomTimelineContext();

  const reactionRelations = getEventReactions(timelineSet, mEventId);
  const reactions = reactionRelations && reactionRelations.getSortedAnnotationsByKey();
  const hasReactions = reactions && reactions.length > 0;
  const { replyEventId, threadRootId } = mEvent;
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
      edit={editId === mEventId}
      canDelete={canRedact || mEvent.getSender() === mx.getUserId()}
      canSendReaction={canSendReaction}
      canPinEvent={canPinEvent}
      imagePackRooms={imagePackRooms}
      relations={hasReactions ? reactionRelations : undefined}
      onUserClick={handleUserClick}
      onUsernameClick={handleUsernameClick}
      onReplyClick={handleReplyClick}
      onReactionToggle={handleReactionToggle}
      onEditId={handleEdit}
      reply={
        replyEventId && (
          <TimelineReply
            timelineSet={timelineSet}
            replyEventId={replyEventId}
            threadRootId={threadRootId}
            onClick={handleOpenReply}
          />
        )
      }
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
      <EncryptedContent mEvent={mEvent}>
        {() => {
          if (mEvent.isRedacted()) return <RedactedContent />;
          if (mEvent.getType() === MessageEvent.Sticker)
            return (
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
            );
          if (mEvent.getType() === MessageEvent.RoomMessage) {
            const editedEvent = getEditedEvent(mEventId, mEvent, timelineSet);
            const getContent = (() =>
              editedEvent?.getContent()['m.new_content'] ??
              mEvent.getContent()) as GetContentCallback;

            const senderId = mEvent.getSender() ?? '';
            const senderDisplayName =
              getMemberDisplayName(room, senderId) ?? getMxIdLocalPart(senderId) ?? senderId;
            return (
              <RenderMessageContent
                displayName={senderDisplayName}
                msgType={mEvent.getContent().msgtype ?? ''}
                ts={mEvent.getTs()}
                edited={!!editedEvent}
                getContent={getContent}
                mediaAutoLoad={mediaAutoLoad}
                urlPreview={showUrlPreview}
                htmlReactParserOptions={htmlReactParserOptions}
                linkifyOpts={linkifyOpts}
                outlineAttachment={messageLayout === MessageLayout.Bubble}
              />
            );
          }
          if (mEvent.getType() === MessageEvent.RoomMessageEncrypted)
            return (
              <Text>
                <MessageNotDecryptedContent />
              </Text>
            );
          return (
            <Text>
              <MessageUnsupportedContent />
            </Text>
          );
        }}
      </EncryptedContent>
    </Message>
  );
}
