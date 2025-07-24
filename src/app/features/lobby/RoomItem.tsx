import React, { MouseEventHandler, ReactNode, useCallback, useRef } from 'react';
import {
  Avatar,
  Badge,
  Box,
  Chip,
  Icon,
  Icons,
  Line,
  Overlay,
  OverlayBackdrop,
  OverlayCenter,
  Spinner,
  Text,
  Tooltip,
  TooltipProvider,
  as,
  color,
  toRem,
} from 'folds';
import FocusTrap from 'focus-trap-react';
import { JoinRule, MatrixError, Room } from 'matrix-js-sdk';
import { IHierarchyRoom } from 'matrix-js-sdk/lib/@types/spaces';
import { RoomAvatar, RoomIcon } from '../../components/room-avatar';
import { SequenceCard } from '../../components/sequence-card';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { HierarchyItem } from '../../hooks/useSpaceHierarchy';
import { millify } from '../../plugins/millify';
import { LocalRoomSummaryLoader } from '../../components/RoomSummaryLoader';
import { UseStateProvider } from '../../components/UseStateProvider';
import { RoomTopicViewer } from '../../components/room-topic-viewer';
import { onEnterOrSpace, stopPropagation } from '../../utils/keyboard';
import { Membership } from '../../../types/matrix/room';
import * as css from './RoomItem.css';
import * as styleCss from './style.css';
import { AsyncStatus, useAsyncCallback } from '../../hooks/useAsyncCallback';
import { getDirectRoomAvatarUrl, getRoomAvatarUrl } from '../../utils/room';
import { ItemDraggableTarget, useDraggableItem } from './DnD';
import { mxcUrlToHttp } from '../../utils/matrix';
import { useMediaAuthentication } from '../../hooks/useMediaAuthentication';

type RoomJoinButtonProps = {
  roomId: string;
  via?: string[];
};
function RoomJoinButton({ roomId, via }: RoomJoinButtonProps) {
  const mx = useMatrixClient();

  const [joinState, join] = useAsyncCallback<Room, MatrixError, []>(
    useCallback(() => mx.joinRoom(roomId, { viaServers: via }), [mx, roomId, via])
  );

  const canJoin = joinState.status === AsyncStatus.Idle || joinState.status === AsyncStatus.Error;

  return (
    <Box shrink="No" gap="200" alignItems="Center">
      {joinState.status === AsyncStatus.Error && (
        <TooltipProvider
          tooltip={
            <Tooltip variant="Critical" style={{ maxWidth: toRem(200) }}>
              <Box direction="Column" gap="100">
                <Text style={{ wordBreak: 'break-word' }} size="T400">
                  {joinState.error.data?.error || joinState.error.message}
                </Text>
                <Text size="T200">{joinState.error.name}</Text>
              </Box>
            </Tooltip>
          }
        >
          {(triggerRef) => (
            <Icon
              ref={triggerRef}
              style={{ color: color.Critical.Main, cursor: 'pointer' }}
              src={Icons.Warning}
              size="400"
              filled
              tabIndex={0}
              aria-label={joinState.error.data?.error || joinState.error.message}
            />
          )}
        </TooltipProvider>
      )}
      <Chip
        variant="Secondary"
        fill="Soft"
        size="400"
        radii="Pill"
        before={
          canJoin ? <Icon src={Icons.Plus} size="50" /> : <Spinner variant="Secondary" size="100" />
        }
        onClick={join}
        disabled={!canJoin}
      >
        <Text size="B300">Join</Text>
      </Chip>
    </Box>
  );
}

function RoomProfileLoading() {
  return (
    <Box grow="Yes" gap="300">
      <Avatar className={styleCss.AvatarPlaceholder} />
      <Box grow="Yes" direction="Column" gap="100">
        <Box gap="200" alignItems="Center">
          <Box className={styleCss.LinePlaceholder} shrink="No" style={{ maxWidth: toRem(80) }} />
        </Box>
        <Box gap="200" alignItems="Center">
          <Box className={styleCss.LinePlaceholder} shrink="No" style={{ maxWidth: toRem(40) }} />
          <Box
            className={styleCss.LinePlaceholder}
            shrink="No"
            style={{
              maxWidth: toRem(120),
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}

type RoomProfileErrorProps = {
  roomId: string;
  inaccessibleRoom: boolean;
  suggested?: boolean;
  via?: string[];
};
function RoomProfileError({ roomId, suggested, inaccessibleRoom, via }: RoomProfileErrorProps) {
  return (
    <Box grow="Yes" gap="300">
      <Avatar>
        <RoomAvatar
          roomId={roomId}
          src={undefined}
          alt={roomId}
          renderFallback={() => (
            <RoomIcon
              size="300"
              joinRule={inaccessibleRoom ? JoinRule.Invite : JoinRule.Restricted}
              filled
            />
          )}
        />
      </Avatar>
      <Box grow="Yes" direction="Column" className={css.ErrorNameContainer}>
        <Box gap="200" alignItems="Center">
          <Text size="H5" truncate>
            Unknown
          </Text>
          {suggested && (
            <Box shrink="No" alignItems="Center">
              <Badge variant="Success" fill="Soft" radii="Pill" outlined>
                <Text size="L400">Suggested</Text>
              </Badge>
            </Box>
          )}
        </Box>
        <Box gap="200" alignItems="Center">
          {inaccessibleRoom ? (
            <Badge variant="Secondary" fill="Soft" radii="300" size="500">
              <Text size="L400">Inaccessible</Text>
            </Badge>
          ) : (
            <Text size="T200" truncate>
              {roomId}
            </Text>
          )}
        </Box>
      </Box>
      {!inaccessibleRoom && <RoomJoinButton roomId={roomId} via={via} />}
    </Box>
  );
}

type RoomProfileProps = {
  roomId: string;
  name: string;
  topic?: string;
  avatarUrl?: string;
  suggested?: boolean;
  memberCount?: number;
  joinRule?: JoinRule;
  options?: ReactNode;
};
function RoomProfile({
  roomId,
  name,
  topic,
  avatarUrl,
  suggested,
  memberCount,
  joinRule,
  options,
}: RoomProfileProps) {
  return (
    <Box grow="Yes" gap="300">
      <Avatar>
        <RoomAvatar
          roomId={roomId}
          src={avatarUrl}
          alt={name}
          renderFallback={() => (
            <RoomIcon size="300" joinRule={joinRule ?? JoinRule.Restricted} filled />
          )}
        />
      </Avatar>
      <Box grow="Yes" direction="Column">
        <Box gap="200" alignItems="Center">
          <Text size="H5" truncate>
            {name}
          </Text>
          {suggested && (
            <Box shrink="No" alignItems="Center">
              <Badge variant="Success" fill="Soft" radii="Pill" outlined>
                <Text size="L400">Suggested</Text>
              </Badge>
            </Box>
          )}
        </Box>
        <Box gap="200" alignItems="Center">
          {memberCount && (
            <Box shrink="No" gap="200">
              <Text size="T200" priority="300">{`${millify(memberCount)} Members`}</Text>
            </Box>
          )}
          {memberCount && topic && (
            <Line
              variant="SurfaceVariant"
              style={{ height: toRem(12) }}
              direction="Vertical"
              size="400"
            />
          )}
          {topic && (
            <UseStateProvider initial={false}>
              {(view, setView) => (
                <>
                  <Text
                    className={css.RoomProfileTopic}
                    size="T200"
                    priority="300"
                    truncate
                    onClick={() => setView(true)}
                    onKeyDown={onEnterOrSpace(() => setView(true))}
                    tabIndex={0}
                  >
                    {topic}
                  </Text>
                  <Overlay open={view} backdrop={<OverlayBackdrop />}>
                    <OverlayCenter>
                      <FocusTrap
                        focusTrapOptions={{
                          initialFocus: false,
                          clickOutsideDeactivates: true,
                          onDeactivate: () => setView(false),
                          escapeDeactivates: stopPropagation,
                        }}
                      >
                        <RoomTopicViewer
                          name={name}
                          topic={topic}
                          requestClose={() => setView(false)}
                        />
                      </FocusTrap>
                    </OverlayCenter>
                  </Overlay>
                </>
              )}
            </UseStateProvider>
          )}
        </Box>
      </Box>
      {options}
    </Box>
  );
}

type RoomItemCardProps = {
  item: HierarchyItem;
  loading: boolean;
  error: Error | null;
  summary: IHierarchyRoom | undefined;
  dm?: boolean;
  firstChild?: boolean;
  lastChild?: boolean;
  onOpen: MouseEventHandler<HTMLButtonElement>;
  options?: ReactNode;
  before?: ReactNode;
  after?: ReactNode;
  onDragging: (item?: HierarchyItem) => void;
  canReorder: boolean;
  getRoom: (roomId: string) => Room | undefined;
};
export const RoomItemCard = as<'div', RoomItemCardProps>(
  (
    {
      item,
      loading,
      error,
      summary,
      dm,
      onOpen,
      options,
      before,
      after,
      onDragging,
      canReorder,
      getRoom,
      ...props
    },
    ref
  ) => {
    const mx = useMatrixClient();
    const useAuthentication = useMediaAuthentication();
    const { roomId, content } = item;
    const room = getRoom(roomId);
    const targetRef = useRef<HTMLDivElement>(null);
    const targetHandleRef = useRef<HTMLDivElement>(null);
    useDraggableItem(item, targetRef, onDragging, targetHandleRef);

    const joined = room?.getMyMembership() === Membership.Join;

    return (
      <SequenceCard
        className={css.RoomItemCard}
        variant="SurfaceVariant"
        gap="300"
        alignItems="Center"
        {...props}
        ref={ref}
      >
        {before}
        <Box ref={canReorder ? targetRef : null} grow="Yes">
          {canReorder && <ItemDraggableTarget ref={targetHandleRef} />}
          {room ? (
            <LocalRoomSummaryLoader room={room}>
              {(localSummary) => (
                <RoomProfile
                  roomId={roomId}
                  name={localSummary.name}
                  topic={localSummary.topic}
                  avatarUrl={
                    dm
                      ? getDirectRoomAvatarUrl(mx, room, 96, useAuthentication)
                      : getRoomAvatarUrl(mx, room, 96, useAuthentication)
                  }
                  memberCount={localSummary.memberCount}
                  suggested={content.suggested}
                  joinRule={localSummary.joinRule}
                  options={
                    joined ? (
                      <Box shrink="No" gap="100" alignItems="Center">
                        <Chip
                          data-room-id={roomId}
                          onClick={onOpen}
                          variant="Secondary"
                          fill="None"
                          size="400"
                          radii="Pill"
                          aria-label="Open Room"
                        >
                          <Icon size="50" src={Icons.ArrowRight} />
                        </Chip>
                      </Box>
                    ) : (
                      <RoomJoinButton roomId={roomId} via={content.via} />
                    )
                  }
                />
              )}
            </LocalRoomSummaryLoader>
          ) : (
            <>
              {!summary &&
                (error ? (
                  <RoomProfileError
                    roomId={roomId}
                    inaccessibleRoom={false}
                    suggested={content.suggested}
                    via={content.via}
                  />
                ) : (
                  <>
                    {loading && <RoomProfileLoading />}
                    {!loading && (
                      <RoomProfileError
                        roomId={roomId}
                        inaccessibleRoom
                        suggested={content.suggested}
                        via={content.via}
                      />
                    )}
                  </>
                ))}
              {summary && (
                <RoomProfile
                  roomId={roomId}
                  name={summary.name || summary.canonical_alias || roomId}
                  topic={summary.topic}
                  avatarUrl={
                    summary?.avatar_url
                      ? mxcUrlToHttp(mx, summary.avatar_url, useAuthentication, 96, 96, 'crop') ??
                        undefined
                      : undefined
                  }
                  memberCount={summary.num_joined_members}
                  suggested={content.suggested}
                  joinRule={summary.join_rule}
                  options={<RoomJoinButton roomId={roomId} via={content.via} />}
                />
              )}
            </>
          )}
        </Box>
        {options}
        {after}
      </SequenceCard>
    );
  }
);
