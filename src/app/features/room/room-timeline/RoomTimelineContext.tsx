import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Room, MatrixClient, Direction } from 'matrix-js-sdk';
import { Editor } from 'slate';
import { HTMLReactParserOptions } from 'html-react-parser';
import { Opts as LinkifyOpts } from 'linkifyjs';
import { useAtomValue } from 'jotai';

import { MessageLayout, MessageSpacing, settingsAtom } from '../../../state/settings';
import { useSetting } from '../../../state/hooks/settings';
import { useRoomUnread } from '../../../state/hooks/unread';
import { roomToUnreadAtom } from '../../../state/room/roomToUnread';
import { usePowerLevelsAPI, usePowerLevelsContext } from '../../../hooks/usePowerLevels';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { useVirtualPaginator } from '../../../hooks/useVirtualPaginator';
import { MessageEvent, StateEvent } from '../../../../types/matrix/room';
import { eventWithShortcode, factoryEventSentBy } from '../../../utils/matrix';
import { getEventReactions, getReactionContent } from '../../../utils/room';
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
  getLiveTimeline,
  getTimelinesEventsCount,
  getEventTimeline,
  getEventIdAbsoluteIndex,
  getFirstLinkedTimeline,
} from './hooks/getEventAndTimeline';
import {
  useHandleEdit,
  useHandleMessageClick,
  useHandleReplyClick,
  useHandleUserClick,
  useHandleUsernameClick,
  useHandleMarkAsRead,
} from './hooks/useHandleActions';
import { PAGINATION_LIMIT, Timeline } from './constants';
import { roomToParentsAtom } from '../../../state/room/roomToParents';
import { useImagePackRooms } from '../../../hooks/useImagePackRooms';
import { MemberEventParser, useMemberEventParser } from '../../../hooks/useMemberEventParser';
import { useRoomNavigate } from '../../../hooks/useRoomNavigate';
import { useAlive } from '../../../hooks/useAlive';
import { useEventTimelineLoader, useTimelinePagination } from './hooks/useEventAndTimeline';
import { useIgnoredUsers } from '../../../hooks/useIgnoredUsers';
import { markAsRead } from '../../../../client/action/notifications';

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
  handleTimelinePagination: (direction: any, limit?: number | undefined) => Promise<void>;
  linkifyOpts: LinkifyOpts;
  htmlReactParserOptions: HTMLReactParserOptions;
  getPowerLevelTag: GetPowerLevelTag;
  accessibleTagColors: Map<string, string>;
  direct: boolean;
  timeline: Timeline;
  setTimeline: React.Dispatch<React.SetStateAction<Timeline>>;
  focusItem?: FocusItem;
  setFocusItem: React.Dispatch<React.SetStateAction<FocusItem | undefined>>;
  showUrlPreview: boolean;
  imagePackRooms: Room[];
  mx: MatrixClient;
  parseMemberEvent: MemberEventParser;
  scrollToBottomRef: React.MutableRefObject<{
    count: number;
    smooth: boolean;
  }>;
  scrollRef: React.RefObject<HTMLDivElement>;
  atBottomAnchorRef: React.RefObject<HTMLElement>;
  atBottom: boolean;
  setAtBottom: React.Dispatch<React.SetStateAction<boolean>>;
  atBottomRef: React.MutableRefObject<boolean>;
  readUptoEventIdRef: React.MutableRefObject<string | undefined>;
  atLiveEndRef: React.MutableRefObject<boolean>;
  handleJumpToLatest: () => void;
  handleJumpToUnread: () => void;
  loadEventTimeline: (eventId: string) => void;
  eventsLength: number;
  liveTimelineLinked: boolean;
  canPaginateBack: boolean;
  rangeAtStart: boolean;
  rangeAtEnd: boolean;
  ignoredUsersSet: Set<string>;
  alive: () => boolean;
  getItems: () => number[];
  scrollToItem: (
    index: number,
    options?: {
      behavior?: 'auto' | 'instant' | 'smooth' | undefined;
      align?: 'start' | 'center' | 'end';
      stopInView?: boolean;
    }
  ) => boolean;
  scrollToElement: (
    element: HTMLElement,
    options?: {
      behavior?: 'auto' | 'instant' | 'smooth' | undefined;
      align?: 'start' | 'center' | 'end';
      stopInView?: boolean;
    }
  ) => void;
  observeBackAnchor: (element: HTMLElement | null) => void;
  observeFrontAnchor: (element: HTMLElement | null) => void;
  handleOpenEvent: (
    evtId: string,
    highlight?: boolean,
    onScroll?: (scrolled: boolean) => void
  ) => Promise<void>;
  handleOpenReply: React.MouseEventHandler<HTMLButtonElement>;
  tryAutoMarkAsRead: () => void;
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
  const scrollToBottomRef = useRef({
    count: 0,
    smooth: true,
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const atBottomAnchorRef = useRef<HTMLElement>(null);
  const [atBottom, setAtBottom] = useState<boolean>(true);
  const atBottomRef = useRef(atBottom);
  atBottomRef.current = atBottom;

  const getScrollElement = useCallback(() => scrollRef.current, [scrollRef]);

  const ignoredUsersList = useIgnoredUsers();
  const ignoredUsersSet = useMemo(() => new Set(ignoredUsersList), [ignoredUsersList]);
  const alive = useAlive();
  const { navigateRoom } = useRoomNavigate();

  const readUptoEventIdRef = useRef<string>();
  useEffect(() => {
    readUptoEventIdRef.current = unreadInfo?.readUptoEventId;
  }, [unreadInfo]);

  const eventsLength = getTimelinesEventsCount(timeline.linkedTimelines);
  const liveTimelineLinked =
    timeline.linkedTimelines.length > 0 &&
    timeline.linkedTimelines[timeline.linkedTimelines.length - 1] === getLiveTimeline(room);
  const canPaginateBack =
    timeline.linkedTimelines.length > 0 &&
    typeof timeline.linkedTimelines[0]?.getPaginationToken(Direction.Backward) === 'string';
  const rangeAtStart = timeline.range.start === 0;
  const rangeAtEnd = timeline.range.end === eventsLength;

  const atLiveEndRef = useRef(liveTimelineLinked && rangeAtEnd);
  atLiveEndRef.current = liveTimelineLinked && rangeAtEnd;

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
  const roomToParents = useAtomValue(roomToParentsAtom);
  const imagePackRooms = useImagePackRooms(room.roomId, roomToParents);
  const showUrlPreview = room.hasEncryptionStateEvent() ? encUrlPreview : urlPreview;
  const parseMemberEvent = useMemberEventParser();

  const handleUserClick = useHandleUserClick(room);
  const handleUsernameClick = useHandleUsernameClick(room, editor);
  const handleEdit = useHandleEdit(editor, setEditId);
  const handleReplyClick = useHandleReplyClick(room, editor);
  const handleMessageClick = useHandleMessageClick(room);
  const handleMarkAsRead = useHandleMarkAsRead(room, hideActivity);
  const handleTimelinePagination = useTimelinePagination(
    mx,
    timeline,
    setTimeline,
    PAGINATION_LIMIT
  );

  const { getItems, scrollToItem, scrollToElement, observeBackAnchor, observeFrontAnchor } =
    useVirtualPaginator({
      count: eventsLength,
      limit: PAGINATION_LIMIT,
      range: timeline.range,
      onRangeChange: useCallback((r) => setTimeline((cs) => ({ ...cs, range: r })), [setTimeline]),
      getScrollElement,
      getItemElement: useCallback(
        (index: number) =>
          (scrollRef.current?.querySelector(`[data-message-item="${index}"]`) as HTMLElement) ??
          undefined,
        [scrollRef]
      ),
      onEnd: handleTimelinePagination,
    });

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

  const loadEventTimeline = useEventTimelineLoader(
    mx,
    room,
    useCallback(
      (evtId, lTimelines, evtAbsIndex) => {
        if (!alive()) return;
        const evLength = getTimelinesEventsCount(lTimelines);

        setFocusItem({
          index: evtAbsIndex,
          scrollTo: true,
          highlight: evtId !== readUptoEventIdRef.current,
        });
        setTimeline({
          linkedTimelines: lTimelines,
          range: {
            start: Math.max(evtAbsIndex - PAGINATION_LIMIT, 0),
            end: Math.min(evtAbsIndex + PAGINATION_LIMIT, evLength),
          },
        });
      },
      [alive, setTimeline, setFocusItem, readUptoEventIdRef]
    ),
    useCallback(() => {
      if (!alive()) return;
      setTimeline(getInitialTimeline(room));
      scrollToBottomRef.current.count += 1;
      scrollToBottomRef.current.smooth = false;
    }, [alive, room, setTimeline, scrollToBottomRef])
  );

  const handleOpenEvent = useCallback(
    async (
      evtId: string,
      highlight = true,
      onScroll: ((scrolled: boolean) => void) | undefined = undefined
    ) => {
      const evtTimeline = getEventTimeline(room, evtId);
      const absoluteIndex =
        evtTimeline && getEventIdAbsoluteIndex(timeline.linkedTimelines, evtTimeline, evtId);

      if (typeof absoluteIndex === 'number') {
        const scrolled = scrollToItem(absoluteIndex, {
          behavior: 'smooth',
          align: 'center',
          stopInView: true,
        });
        if (onScroll) onScroll(scrolled);
        setFocusItem({
          index: absoluteIndex,
          scrollTo: false,
          highlight,
        });
      } else {
        setTimeline(getEmptyTimeline());
        loadEventTimeline(evtId);
      }
    },
    [room, timeline, scrollToItem, setTimeline, setFocusItem, loadEventTimeline]
  );

  const handleOpenReply = useCallback<React.MouseEventHandler<HTMLButtonElement>>(
    async (evt) => {
      const targetId = evt.currentTarget.getAttribute('data-event-id');
      if (!targetId) return;
      handleOpenEvent(targetId);
    },
    [handleOpenEvent]
  );

  const tryAutoMarkAsRead = useCallback(() => {
    const readUptoEventId = readUptoEventIdRef.current;
    if (!readUptoEventId) {
      requestAnimationFrame(() => markAsRead(mx, room.roomId, hideActivity));
      return;
    }
    const evtTimeline = getEventTimeline(room, readUptoEventId);
    const latestTimeline = evtTimeline && getFirstLinkedTimeline(evtTimeline, Direction.Forward);
    if (latestTimeline === room.getLiveTimeline()) {
      requestAnimationFrame(() => markAsRead(mx, room.roomId, hideActivity));
    }
  }, [mx, room, hideActivity, readUptoEventIdRef]);

  const handleJumpToLatest = useCallback(() => {
    if (eventId) {
      navigateRoom(room.roomId, undefined, { replace: true });
    }
    setTimeline(getInitialTimeline(room));
    scrollToBottomRef.current.count += 1;
    scrollToBottomRef.current.smooth = false;
  }, [eventId, navigateRoom, room, setTimeline, scrollToBottomRef]);

  const handleJumpToUnread = useCallback(() => {
    if (unreadInfo?.readUptoEventId) {
      setTimeline(getEmptyTimeline());
      loadEventTimeline(unreadInfo.readUptoEventId);
    }
  }, [unreadInfo, setTimeline, loadEventTimeline]);
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

  const unread = useRoomUnread(room.roomId, roomToUnreadAtom);
  useEffect(() => {
    if (!unread) {
      setUnreadInfo(undefined);
    }
  }, [unread]);

  useEffect(() => {
    if (eventId) {
      setTimeline(getEmptyTimeline());
      loadEventTimeline(eventId);
    }
  }, [eventId, loadEventTimeline, setTimeline]);

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
      handleTimelinePagination,
      linkifyOpts,
      htmlReactParserOptions,
      getPowerLevelTag,
      accessibleTagColors,
      direct,
      timeline,
      setTimeline,
      focusItem,
      setFocusItem,
      showUrlPreview,
      imagePackRooms,
      mx,
      parseMemberEvent,
      scrollToBottomRef,
      scrollRef,
      atBottomAnchorRef,
      atBottom,
      setAtBottom,
      atBottomRef,
      readUptoEventIdRef,
      atLiveEndRef,
      handleJumpToLatest,
      handleJumpToUnread,
      loadEventTimeline,
      eventsLength,
      liveTimelineLinked,
      canPaginateBack,
      rangeAtStart,
      rangeAtEnd,
      ignoredUsersSet,
      alive,
      getItems,
      scrollToItem,
      scrollToElement,
      observeBackAnchor,
      observeFrontAnchor,
      handleOpenEvent,
      handleOpenReply,
      tryAutoMarkAsRead,
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
      handleTimelinePagination,
      linkifyOpts,
      htmlReactParserOptions,
      getPowerLevelTag,
      accessibleTagColors,
      direct,
      timeline,
      focusItem,
      showUrlPreview,
      imagePackRooms,
      mx,
      parseMemberEvent,
      atBottom,
      handleJumpToLatest,
      handleJumpToUnread,
      loadEventTimeline,
      eventsLength,
      liveTimelineLinked,
      canPaginateBack,
      rangeAtStart,
      rangeAtEnd,
      ignoredUsersSet,
      alive,
      getItems,
      scrollToItem,
      scrollToElement,
      observeBackAnchor,
      observeFrontAnchor,
      handleOpenEvent,
      handleOpenReply,
      tryAutoMarkAsRead,
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
