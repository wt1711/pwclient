import { Box, Icon, Icons, Text, as, color, toRem } from 'folds';
import { EventTimelineSet, Room } from 'matrix-js-sdk';
import React, { MouseEventHandler, ReactNode, useCallback, useMemo } from 'react';
import classNames from 'classnames';
import { getMemberDisplayName, trimReplyFromBody } from '../../utils/room';
import { getMxIdLocalPart } from '../../utils/matrix';
import { LinePlaceholder } from './placeholder';
import { randomNumberBetween } from '../../utils/common';
import * as css from './Reply.css';
import { MessageBadEncryptedContent, MessageDeletedContent, MessageFailedContent } from './content';
import { scaleSystemEmoji } from '../../plugins/react-custom-html-parser';
import { useRoomEvent } from '../../hooks/useRoomEvent';
import { GetPowerLevelTag } from '../../hooks/usePowerLevelTags';
import colorMXID from '../../../util/colorMXID';

type ReplyLayoutProps = {
  userColor?: string;
  username?: ReactNode;
};
export const ReplyLayout = as<'div', ReplyLayoutProps>(
  ({ username, userColor, className, children, ...props }, ref) => (
    <Box
      className={classNames(css.Reply, className)}
      alignItems="Center"
      gap="100"
      {...props}
      ref={ref}
    >
      <Box style={{ color: userColor, maxWidth: toRem(200) }} alignItems="Center" shrink="No">
        <Icon size="100" src={Icons.ReplyArrow} />
        {username}
      </Box>
      <Box grow="Yes" className={css.ReplyContent}>
        {children}
      </Box>
    </Box>
  )
);

export const ThreadIndicator = as<'div'>(({ ...props }, ref) => (
  <Box className={css.ThreadIndicator} alignItems="Center" {...props} ref={ref}>
    <Icon className={css.ThreadIndicatorIcon} src={Icons.Message} />
    <Text size="T200">Threaded reply</Text>
  </Box>
));

type ReplyProps = {
  room: Room;
  timelineSet?: EventTimelineSet | undefined;
  replyEventId: string;
  threadRootId?: string | undefined;
  onClick?: MouseEventHandler | undefined;
  getPowerLevel?: (userId: string) => number;
  getPowerLevelTag?: GetPowerLevelTag;
  accessibleTagColors?: Map<string, string>;
  legacyUsernameColor?: boolean;
};

export const Reply = as<'div', ReplyProps>(
  (
    {
      room,
      timelineSet,
      replyEventId,
      threadRootId,
      onClick,
      getPowerLevel,
      getPowerLevelTag,
      accessibleTagColors,
      legacyUsernameColor,
      ...props
    },
    ref
  ) => {
    const placeholderWidth = useMemo(() => randomNumberBetween(40, 400), []);
    const getFromLocalTimeline = useCallback(
      () => timelineSet?.findEventById(replyEventId),
      [timelineSet, replyEventId]
    );
    const replyEvent = useRoomEvent(room, replyEventId, getFromLocalTimeline);

    const { body } = replyEvent?.getContent() ?? {};
    const sender = replyEvent?.getSender();
    const senderPL = sender && getPowerLevel?.(sender);
    const powerTag = typeof senderPL === 'number' ? getPowerLevelTag?.(senderPL) : undefined;
    const tagColor = powerTag?.color ? accessibleTagColors?.get(powerTag.color) : undefined;

    const usernameColor = legacyUsernameColor ? colorMXID(sender ?? replyEventId) : tagColor;

    const fallbackBody = replyEvent?.isRedacted() ? (
      <MessageDeletedContent />
    ) : (
      <MessageFailedContent />
    );

    const badEncryption = replyEvent?.getContent().msgtype === 'm.bad.encrypted';
    const bodyJSX = body ? scaleSystemEmoji(trimReplyFromBody(body)) : fallbackBody;

    return (
      <Box direction="Column" alignItems="Start" {...props} ref={ref}>
        {threadRootId && (
          <ThreadIndicator as="button" data-event-id={threadRootId} onClick={onClick} />
        )}
        <ReplyLayout
          as="button"
          userColor={usernameColor}
          username={
            sender && (
              <Text size="T300" truncate>
                <b>{getMemberDisplayName(room, sender) ?? getMxIdLocalPart(sender)}</b>
              </Text>
            )
          }
          data-event-id={replyEventId}
          onClick={onClick}
        >
          {replyEvent !== undefined ? (
            <Text size="T300" truncate>
              {badEncryption ? <MessageBadEncryptedContent /> : bodyJSX}
            </Text>
          ) : (
            <LinePlaceholder
              style={{
                backgroundColor: color.SurfaceVariant.ContainerActive,
                width: toRem(placeholderWidth),
                maxWidth: '100%',
              }}
            />
          )}
        </ReplyLayout>
      </Box>
    );
  }
);
