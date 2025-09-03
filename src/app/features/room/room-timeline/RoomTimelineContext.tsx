import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Room } from 'matrix-js-sdk';
import { Editor } from 'slate';
import { HTMLReactParserOptions } from 'html-react-parser';
import { Opts as LinkifyOpts } from 'linkifyjs';

import { MessageLayout, MessageSpacing, settingsAtom } from '../../../state/settings';
import { useSetting } from '../../../state/hooks/settings';
import { useRoomUnread } from '../../../state/hooks/unread';
import { roomToUnreadAtom } from '../../../state/room/roomToUnread';
import { usePowerLevelsAPI, usePowerLevelsContext } from '../../../hooks/usePowerLevels';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { MessageEvent, StateEvent } from '../../../../types/matrix/room';
import { eventWithShortcode, factoryEventSentBy } from '../../../utils/matrix';
import { getEventReactions, getReactionContent } from '../../../utils/room';
import { markAsRead } from '../../../../client/action/notifications';
import { useMediaAuthentication } from '../../../hooks/useMediaAuthentication';
import { useMentionClickHandler } from '../../../hooks/useMentionClickHandler';
import { useSpoilerClickHandler } from '../../../hooks/useSpoilerClickHandler';
import {
  factoryRenderLinkifyWithMention,
  getReactCustomHtmlParser,
  LINKIFY_OPTS,
  makeMentionCustomProps,
  renderMatrixMention,
} from '../../../plugins/react-custom-html-parser';
import { GetPowerLevelTag } from '../../../hooks/usePowerLevelTags';
import { useIsDirectRoom } from '../../../hooks/useRoom';
import {
  getEmptyTimeline,
  getInitialTimeline,
  getRoomUnreadInfo,
} from './hooks/getEventAndTimeline';
import {
  useHandleEdit,
  useHandleMessageClick,
  useHandleReplyClick,
  useHandleUserClick,
  useHandleUsernameClick,
} from './hooks/useHandleActions';
import { Timeline } from './constants';

interface FocusItem {
  index: number;
  scrollTo: boolean;
  highlight: boolean;
}

interface RoomTimelineContextType {
  room: Room;
  hideActivity: boolean;
  messageLayout: MessageLayout;
  messageSpacing: MessageSpacing;
  legacyUsernameColor: boolean;
  hideMembershipEvents: boolean;
  hideNickAvatarEvents: boolean;
  mediaAutoLoad: boolean;
  urlPreview: boolean;
  encUrlPreview: boolean;
  showHiddenEvents: boolean;
  showDeveloperTools: boolean;
  editId?: string;
  setEditId: (id?: string) => void;
  unreadInfo?: any;
  setUnreadInfo: React.Dispatch<React.SetStateAction<any | undefined>>;
  getPowerLevel: (userId?: string | undefined, atRoomState?: boolean | undefined) => number;
  canRedact: boolean;
  canSendReaction: boolean;
  canPinEvent: boolean;
  handleUserClick: (evt: React.MouseEvent<HTMLButtonElement>) => void;
  handleUsernameClick: (evt: React.MouseEvent<HTMLButtonElement>) => void;
  handleEdit: (editEvtId?: string) => void;
  handleReplyClick: (evt: React.MouseEvent<HTMLButtonElement>, startThread?: boolean) => void;
  handleReactionToggle: (targetEventId: string, key: string, shortcode?: string) => void;
  handleMessageClick: (evt: React.MouseEvent<HTMLDivElement>) => void;
  handleMarkAsRead: () => void;
  linkifyOpts: LinkifyOpts;
  htmlReactParserOptions: HTMLReactParserOptions;
  getPowerLevelTag: GetPowerLevelTag;
  accessibleTagColors: Map<string, string>;
  direct: boolean;
  timeline: Timeline;
  setTimeline: React.Dispatch<React.SetStateAction<Timeline>>;
  focusItem?: FocusItem;
  setFocusItem: React.Dispatch<React.SetStateAction<FocusItem | undefined>>;
}

const RoomTimelineContext = createContext<RoomTimelineContextType | null>(null);

interface RoomTimelineProviderProps {
  children: React.ReactNode;
  room: Room;
  editor: Editor;
  getPowerLevelTag: GetPowerLevelTag;
  accessibleTagColors: Map<string, string>;
  eventId?: string;
}

export function RoomTimelineProvider({
  children,
  room,
  editor,
  getPowerLevelTag,
  accessibleTagColors,
  eventId,
}: RoomTimelineProviderProps) {
  const [hideActivity] = useSetting(settingsAtom, 'hideActivity');
  const [messageLayout] = useSetting(settingsAtom, 'messageLayout');
  const [messageSpacing] = useSetting(settingsAtom, 'messageSpacing');
  const [legacyUsernameColor] = useSetting(settingsAtom, 'legacyUsernameColor');
  const [hideMembershipEvents] = useSetting(settingsAtom, 'hideMembershipEvents');
  const [hideNickAvatarEvents] = useSetting(settingsAtom, 'hideNickAvatarEvents');
  const [mediaAutoLoad] = useSetting(settingsAtom, 'mediaAutoLoad');
  const [urlPreview] = useSetting(settingsAtom, 'urlPreview');
  const [encUrlPreview] = useSetting(settingsAtom, 'encUrlPreview');
  const [showHiddenEvents] = useSetting(settingsAtom, 'showHiddenEvents');
  const [showDeveloperTools] = useSetting(settingsAtom, 'developerTools');
  const [editId, setEditId] = useState<string>();
  const [unreadInfo, setUnreadInfo] = useState(() => getRoomUnreadInfo(room, true));
  const [timeline, setTimeline] = useState<Timeline>(() =>
    eventId ? getEmptyTimeline() : getInitialTimeline(room)
  );
  const [focusItem, setFocusItem] = useState<FocusItem | undefined>();

  const mx = useMatrixClient();
  const powerLevels = usePowerLevelsContext();
  const { canDoAction, canSendEvent, canSendStateEvent, getPowerLevel } =
    usePowerLevelsAPI(powerLevels);
  const myPowerLevel = getPowerLevel(mx.getUserId() ?? '');
  const canRedact = canDoAction('redact', myPowerLevel);
  const canSendReaction = canSendEvent(MessageEvent.Reaction, myPowerLevel);
  const canPinEvent = canSendStateEvent(StateEvent.RoomPinnedEvents, myPowerLevel);

  const useAuthentication = useMediaAuthentication();
  const mentionClickHandler = useMentionClickHandler(room.roomId);
  const spoilerClickHandler = useSpoilerClickHandler();
  const direct = useIsDirectRoom();

  const handleUserClick = useHandleUserClick(room);
  const handleUsernameClick = useHandleUsernameClick(room, editor);
  const handleEdit = useHandleEdit(editor, setEditId);
  const handleReplyClick = useHandleReplyClick(room, editor);
  const handleMessageClick = useHandleMessageClick(room);

  const linkifyOpts = useMemo<LinkifyOpts>(
    () => ({
      ...LINKIFY_OPTS,
      render: factoryRenderLinkifyWithMention((href) =>
        renderMatrixMention(mx, room.roomId, href, makeMentionCustomProps(mentionClickHandler))
      ),
    }),
    [mx, room, mentionClickHandler]
  );
  const htmlReactParserOptions = useMemo<HTMLReactParserOptions>(
    () =>
      getReactCustomHtmlParser(mx, room.roomId, {
        linkifyOpts,
        useAuthentication,
        handleSpoilerClick: spoilerClickHandler,
        handleMentionClick: mentionClickHandler,
      }),
    [mx, room, linkifyOpts, spoilerClickHandler, mentionClickHandler, useAuthentication]
  );

  const handleMarkAsRead = useCallback(() => {
    markAsRead(mx, room.roomId, hideActivity);
  }, [mx, room, hideActivity]);

  const handleReactionToggle = useCallback(
    (targetEventId: string, key: string, shortcode?: string) => {
      const relations = getEventReactions(room.getUnfilteredTimelineSet(), targetEventId);
      const allReactions = relations?.getSortedAnnotationsByKey() ?? [];
      const [, reactionsSet] = allReactions.find(([k]) => k === key) ?? [];
      const reactions = reactionsSet ? Array.from(reactionsSet) : [];
      const myReaction = reactions.find(factoryEventSentBy(mx.getUserId() ?? ''));

      if (myReaction && !!myReaction?.isRelation()) {
        mx.redactEvent(room.roomId, myReaction.getId() ?? '');
        return;
      }
      const rShortcode =
        shortcode ||
        (reactions.find(eventWithShortcode)?.getContent().shortcode as string | undefined);
      mx.sendEvent(
        room.roomId,
        MessageEvent.Reaction as any,
        getReactionContent(targetEventId, key, rShortcode)
      );
    },
    [mx, room]
  );

  const unread = useRoomUnread(room.roomId, roomToUnreadAtom);
  useEffect(() => {
    if (!unread) {
      setUnreadInfo(undefined);
    }
  }, [unread]);

  const value = useMemo(
    () => ({
      room,
      hideActivity,
      messageLayout,
      messageSpacing,
      legacyUsernameColor,
      hideMembershipEvents,
      hideNickAvatarEvents,
      mediaAutoLoad,
      urlPreview,
      encUrlPreview,
      showHiddenEvents,
      showDeveloperTools,
      editId,
      setEditId,
      unreadInfo,
      setUnreadInfo,
      getPowerLevel,
      canRedact,
      canSendReaction,
      canPinEvent,
      handleUserClick,
      handleUsernameClick,
      handleEdit,
      handleReplyClick,
      handleReactionToggle,
      handleMessageClick,
      handleMarkAsRead,
      linkifyOpts,
      htmlReactParserOptions,
      getPowerLevelTag,
      accessibleTagColors,
      direct,
      timeline,
      setTimeline,
      focusItem,
      setFocusItem,
    }),
    [
      room,
      hideActivity,
      messageLayout,
      messageSpacing,
      legacyUsernameColor,
      hideMembershipEvents,
      hideNickAvatarEvents,
      mediaAutoLoad,
      urlPreview,
      encUrlPreview,
      showHiddenEvents,
      showDeveloperTools,
      editId,
      unreadInfo,
      getPowerLevel,
      canRedact,
      canSendReaction,
      canPinEvent,
      handleUserClick,
      handleUsernameClick,
      handleEdit,
      handleReplyClick,
      handleReactionToggle,
      handleMessageClick,
      handleMarkAsRead,
      linkifyOpts,
      htmlReactParserOptions,
      getPowerLevelTag,
      accessibleTagColors,
      direct,
      timeline,
      focusItem,
    ]
  );

  return <RoomTimelineContext.Provider value={value}>{children}</RoomTimelineContext.Provider>;
}

export const useRoomTimelineContext = (): RoomTimelineContextType => {
  const context = useContext(RoomTimelineContext);
  if (!context) {
    throw new Error('useRoomTimelineContext must be used within a RoomTimelineProvider');
  }
  return context;
};
