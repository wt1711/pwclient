/* eslint-disable react/destructuring-assignment */
import React, {
  forwardRef,
  MouseEventHandler,
  RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Direction, EventTimelineSet, MatrixEvent, Room } from 'matrix-js-sdk';
import { Editor } from 'slate';
import { useAtomValue } from 'jotai';
import { Badge, Box, Chip, Icon, Icons, Scroll, Text, color, config, toRem } from 'folds';
import { isKeyHotkey } from 'is-hotkey';

import { getMxIdLocalPart } from '../../../utils/matrix';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { useVirtualPaginator } from '../../../hooks/useVirtualPaginator';
import { useAlive } from '../../../hooks/useAlive';
import { editableActiveElement, scrollToBottom } from '../../../utils/dom';
import {
  DefaultPlaceholder,
  CompactPlaceholder,
  MessageBase,
  MessageUnsupportedContent,
  Time,
  MessageNotDecryptedContent,
  RedactedContent,
  MSticker,
  ImageContent,
  EventContent,
} from '../../../components/message';
import {
  canEditEvent,
  getEditedEvent,
  getEventReactions,
  getLatestEditableEvt,
  getMemberDisplayName,
  isMembershipChanged,
  reactionOrEditEvent,
} from '../../../utils/room';
import { MessageLayout } from '../../../state/settings';
import { useMatrixEventRenderer } from '../../../hooks/useMatrixEventRenderer';
import { Reactions, Message, Event, EncryptedContent } from '../message';
import { useMemberEventParser } from '../../../hooks/useMemberEventParser';
import * as customHtmlCss from '../../../styles/CustomHtml.css';
import { RoomIntro } from '../../../components/room-intro';
import {
  getIntersectionObserverEntry,
  useIntersectionObserver,
} from '../../../hooks/useIntersectionObserver';
import { markAsRead } from '../../../../client/action/notifications';
import { useDebounce } from '../../../hooks/useDebounce';
import { getResizeObserverEntry, useResizeObserver } from '../../../hooks/useResizeObserver';
import { PAGINATION_LIMIT } from './constants';
import {
  useLiveEventArrive,
  useEventTimelineLoader,
  useTimelinePagination,
  useLiveTimelineRefresh,
} from './hooks/useEventAndTimeline';
import {
  getEventTimeline,
  getFirstLinkedTimeline,
  getLiveTimeline,
  getLinkedTimelines,
  getTimelinesEventsCount,
  getEventIdAbsoluteIndex,
  getTimelineAndBaseIndex,
  getTimelineEvent,
  getTimelineRelativeIndex,
  getEmptyTimeline,
  getInitialTimeline,
  getRoomUnreadInfo,
} from './hooks/getEventAndTimeline';
import {
  inSameDay,
  minuteDifference,
  timeDayMonthYear,
  today,
  yesterday,
} from '../../../utils/time';
import { isEmptyEditor } from '../../../components/editor';
import { GetContentCallback, MessageEvent, StateEvent } from '../../../../types/matrix/room';
import { useKeyDown } from '../../../hooks/useKeyDown';
import { useDocumentFocusChange } from '../../../hooks/useDocumentFocusChange';
import { RenderMessageContent } from '../../../components/RenderMessageContent';
import { Image } from '../../../components/media';
import { ImageViewer } from '../../../components/image-viewer';
import { roomToParentsAtom } from '../../../state/room/roomToParents';
import { useRoomNavigate } from '../../../hooks/useRoomNavigate';
import { useIgnoredUsers } from '../../../hooks/useIgnoredUsers';
import { useImagePackRooms } from '../../../hooks/useImagePackRooms';
import { GetPowerLevelTag } from '../../../hooks/usePowerLevelTags';
import { RoomTimelineProvider, useRoomTimelineContext } from './RoomTimelineContext';
import { TimelineFloat, TimelineDivider } from './components/TimelineExtra';
import { TimelineReply } from './components/TimelineReply';

type RoomTimelineProps = {
  room: Room;
  eventId?: string;
  roomInputRef: RefObject<HTMLElement>;
  editor: Editor;
  getPowerLevelTag: GetPowerLevelTag;
  accessibleTagColors: Map<string, string>;
};

type RoomTimelineInternalProps = Omit<
  RoomTimelineProps,
  'room' | 'getPowerLevelTag' | 'accessibleTagColors'
>;

const RoomTimelineInternal = forwardRef<HTMLDivElement, RoomTimelineInternalProps>(
  ({ eventId, roomInputRef, editor }, ref) => {
    const {
      room,
      hideActivity,
      messageLayout,
      messageSpacing,
      legacyUsernameColor,
      encUrlPreview,
      urlPreview,
      showDeveloperTools,
      mediaAutoLoad,
      hideMembershipEvents,
      hideNickAvatarEvents,
      showHiddenEvents,
      editId,
      setEditId,
      unreadInfo,
      setUnreadInfo,
      canRedact,
      canSendReaction,
      canPinEvent,
      getPowerLevel,
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
    } = useRoomTimelineContext();
    const mx = useMatrixClient();

    const showUrlPreview = room.hasEncryptionStateEvent() ? encUrlPreview : urlPreview;

    const ignoredUsersList = useIgnoredUsers();
    const ignoredUsersSet = useMemo(() => new Set(ignoredUsersList), [ignoredUsersList]);

    const roomToParents = useAtomValue(roomToParentsAtom);
    const { navigateRoom } = useRoomNavigate();

    const imagePackRooms: Room[] = useImagePackRooms(room.roomId, roomToParents);

    const readUptoEventIdRef = useRef<string>();
    if (unreadInfo) {
      readUptoEventIdRef.current = unreadInfo.readUptoEventId;
    }

    const atBottomAnchorRef = useRef<HTMLElement>(null);
    const [atBottom, setAtBottom] = useState<boolean>(true);
    const atBottomRef = useRef(atBottom);
    atBottomRef.current = atBottom;

    const scrollRef = useRef<HTMLDivElement>(null);
    const scrollToBottomRef = useRef({
      count: 0,
      smooth: true,
    });

    const alive = useAlive();

    const parseMemberEvent = useMemberEventParser();

    const eventsLength = getTimelinesEventsCount(timeline.linkedTimelines);
    const liveTimelineLinked =
      timeline.linkedTimelines[timeline.linkedTimelines.length - 1] === getLiveTimeline(room);
    const canPaginateBack =
      typeof timeline.linkedTimelines[0]?.getPaginationToken(Direction.Backward) === 'string';
    const rangeAtStart = timeline.range.start === 0;
    const rangeAtEnd = timeline.range.end === eventsLength;
    const atLiveEndRef = useRef(liveTimelineLinked && rangeAtEnd);
    atLiveEndRef.current = liveTimelineLinked && rangeAtEnd;

    const handleTimelinePagination = useTimelinePagination(
      mx,
      timeline,
      setTimeline,
      PAGINATION_LIMIT
    );

    const getScrollElement = useCallback(() => scrollRef.current, []);

    const { getItems, scrollToItem, scrollToElement, observeBackAnchor, observeFrontAnchor } =
      useVirtualPaginator({
        count: eventsLength,
        limit: PAGINATION_LIMIT,
        range: timeline.range,
        onRangeChange: useCallback(
          (r) => setTimeline((cs) => ({ ...cs, range: r })),
          [setTimeline]
        ),
        getScrollElement,
        getItemElement: useCallback(
          (index: number) =>
            (scrollRef.current?.querySelector(`[data-message-item="${index}"]`) as HTMLElement) ??
            undefined,
          []
        ),
        onEnd: handleTimelinePagination,
      });

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
        [alive, setTimeline, setFocusItem]
      ),
      useCallback(() => {
        if (!alive()) return;
        setTimeline(getInitialTimeline(room));
        scrollToBottomRef.current.count += 1;
        scrollToBottomRef.current.smooth = false;
      }, [alive, room, setTimeline])
    );

    useLiveEventArrive(
      room,
      useCallback(
        (mEvt: MatrixEvent) => {
          // if user is at bottom of timeline
          // keep paginating timeline and conditionally mark as read
          // otherwise we update timeline without paginating
          // so timeline can be updated with evt like: edits, reactions etc
          if (atBottomRef.current) {
            if (document.hasFocus() && (!unreadInfo || mEvt.getSender() === mx.getUserId())) {
              // Check if the document is in focus (user is actively viewing the app),
              // and either there are no unread messages or the latest message is from the current user.
              // If either condition is met, trigger the markAsRead function to send a read receipt.
              requestAnimationFrame(() => markAsRead(mx, mEvt.getRoomId() ?? '', hideActivity));
            }

            if (!document.hasFocus() && !unreadInfo) {
              setUnreadInfo(getRoomUnreadInfo(room));
            }

            scrollToBottomRef.current.count += 1;
            scrollToBottomRef.current.smooth = true;

            setTimeline((ct) => ({
              ...ct,
              range: {
                start: ct.range.start + 1,
                end: ct.range.end + 1,
              },
            }));
            return;
          }
          setTimeline((ct) => ({ ...ct }));
          if (!unreadInfo) {
            setUnreadInfo(getRoomUnreadInfo(room));
          }
        },
        [mx, room, unreadInfo, setUnreadInfo, hideActivity, setTimeline]
      )
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
      [room, timeline, scrollToItem, loadEventTimeline, setTimeline, setFocusItem]
    );

    useLiveTimelineRefresh(
      room,
      useCallback(() => {
        if (liveTimelineLinked) {
          setTimeline(getInitialTimeline(room));
        }
      }, [room, liveTimelineLinked, setTimeline])
    );

    // Stay at bottom when room editor resize
    useResizeObserver(
      useMemo(() => {
        let mounted = false;
        return (entries) => {
          if (!mounted) {
            // skip initial mounting call
            mounted = true;
            return;
          }
          if (!roomInputRef.current) return;
          const editorBaseEntry = getResizeObserverEntry(roomInputRef.current, entries);
          const scrollElement = getScrollElement();
          if (!editorBaseEntry || !scrollElement) return;

          if (atBottomRef.current) {
            scrollToBottom(scrollElement);
          }
        };
      }, [getScrollElement, roomInputRef]),
      useCallback(() => roomInputRef.current, [roomInputRef])
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
    }, [mx, room, hideActivity]);

    const debounceSetAtBottom = useDebounce(
      useCallback((entry: IntersectionObserverEntry) => {
        if (!entry.isIntersecting) setAtBottom(false);
      }, []),
      { wait: 1000 }
    );
    useIntersectionObserver(
      useCallback(
        (entries) => {
          const target = atBottomAnchorRef.current;
          if (!target) return;
          const targetEntry = getIntersectionObserverEntry(target, entries);
          if (targetEntry) debounceSetAtBottom(targetEntry);
          if (targetEntry?.isIntersecting && atLiveEndRef.current) {
            setAtBottom(true);
            if (document.hasFocus()) {
              tryAutoMarkAsRead();
            }
          }
        },
        [debounceSetAtBottom, tryAutoMarkAsRead]
      ),
      useCallback(
        () => ({
          root: getScrollElement(),
          rootMargin: '100px',
        }),
        [getScrollElement]
      ),
      useCallback(() => atBottomAnchorRef.current, [])
    );

    useDocumentFocusChange(
      useCallback(
        (inFocus) => {
          if (inFocus && atBottomRef.current) {
            if (unreadInfo?.inLiveTimeline) {
              handleOpenEvent(unreadInfo.readUptoEventId, false, (scrolled) => {
                // the unread event is already in view
                // so, try mark as read;
                if (!scrolled) {
                  tryAutoMarkAsRead();
                }
              });
              return;
            }
            tryAutoMarkAsRead();
          }
        },
        [tryAutoMarkAsRead, unreadInfo, handleOpenEvent]
      )
    );

    // Handle up arrow edit
    useKeyDown(
      window,
      useCallback(
        (evt) => {
          if (
            isKeyHotkey('arrowup', evt) &&
            editableActiveElement() &&
            document.activeElement?.getAttribute('data-editable-name') === 'RoomInput' &&
            isEmptyEditor(editor)
          ) {
            const editableEvt = getLatestEditableEvt(room.getLiveTimeline(), (mEvt) =>
              canEditEvent(mx, mEvt)
            );
            const editableEvtId = editableEvt?.getId();
            if (!editableEvtId) return;
            setEditId(editableEvtId);
            evt.preventDefault();
          }
        },
        [mx, room, editor, setEditId]
      )
    );

    useEffect(() => {
      if (eventId) {
        setTimeline(getEmptyTimeline());
        loadEventTimeline(eventId);
      }
    }, [eventId, loadEventTimeline, setTimeline]);

    // Scroll to bottom on initial timeline load
    useLayoutEffect(() => {
      const scrollEl = scrollRef.current;
      if (scrollEl) {
        scrollToBottom(scrollEl);
      }
    }, []);

    // if live timeline is linked and unreadInfo change
    // Scroll to last read message
    useLayoutEffect(() => {
      const { readUptoEventId, inLiveTimeline, scrollTo } = unreadInfo ?? {};
      if (readUptoEventId && inLiveTimeline && scrollTo) {
        const linkedTimelines = getLinkedTimelines(getLiveTimeline(room));
        const evtTimeline = getEventTimeline(room, readUptoEventId);
        const absoluteIndex =
          evtTimeline && getEventIdAbsoluteIndex(linkedTimelines, evtTimeline, readUptoEventId);
        if (absoluteIndex) {
          scrollToItem(absoluteIndex, {
            behavior: 'instant',
            align: 'start',
            stopInView: true,
          });
        }
      }
    }, [room, unreadInfo, scrollToItem]);

    // scroll to focused message
    useLayoutEffect(() => {
      if (focusItem && focusItem.scrollTo) {
        scrollToItem(focusItem.index, {
          behavior: 'instant',
          align: 'center',
          stopInView: true,
        });
      }

      setTimeout(() => {
        if (!alive()) return;
        setFocusItem((currentItem) => {
          if (currentItem === focusItem) return undefined;
          return currentItem;
        });
      }, 2000);
    }, [alive, focusItem, scrollToItem, setFocusItem]);

    // scroll to bottom of timeline
    const scrollToBottomCount = scrollToBottomRef.current.count;
    useLayoutEffect(() => {
      if (scrollToBottomCount > 0) {
        const scrollEl = scrollRef.current;
        if (scrollEl)
          scrollToBottom(scrollEl, scrollToBottomRef.current.smooth ? 'smooth' : 'instant');
      }
    }, [scrollToBottomCount]);

    // Remove unreadInfo on mark as read
    useEffect(() => {
      if (unreadInfo === undefined) {
        setUnreadInfo(undefined);
      }
    }, [unreadInfo, setUnreadInfo]);

    // scroll out of view msg editor in view.
    useEffect(() => {
      if (editId) {
        const editMsgElement =
          (scrollRef.current?.querySelector(`[data-message-id="${editId}"]`) as HTMLElement) ??
          undefined;
        if (editMsgElement) {
          scrollToElement(editMsgElement, {
            align: 'center',
            behavior: 'smooth',
            stopInView: true,
          });
        }
      }
    }, [scrollToElement, editId]);

    const handleJumpToLatest = () => {
      if (eventId) {
        navigateRoom(room.roomId, undefined, { replace: true });
      }
      setTimeline(getInitialTimeline(room));
      scrollToBottomRef.current.count += 1;
      scrollToBottomRef.current.smooth = false;
    };

    const handleJumpToUnread = () => {
      if (unreadInfo?.readUptoEventId) {
        setTimeline(getEmptyTimeline());
        loadEventTimeline(unreadInfo.readUptoEventId);
      }
    };

    const handleOpenReply: MouseEventHandler<HTMLButtonElement> = useCallback(
      async (evt) => {
        const targetId = evt.currentTarget.getAttribute('data-event-id');
        if (!targetId) return;
        handleOpenEvent(targetId);
      },
      [handleOpenEvent]
    );

    const renderMatrixEvent = useMatrixEventRenderer<
      [string, MatrixEvent, number, EventTimelineSet, boolean]
    >(
      {
        [MessageEvent.RoomMessage]: (mEventId, mEvent, item, timelineSet, collapse) => {
          const reactionRelations = getEventReactions(timelineSet, mEventId);
          const reactions = reactionRelations && reactionRelations.getSortedAnnotationsByKey();
          const hasReactions = reactions && reactions.length > 0;
          const { replyEventId, threadRootId } = mEvent;
          const highlighted = focusItem?.index === item && focusItem.highlight;

          const editedEvent = getEditedEvent(mEventId, mEvent, timelineSet);
          const getContent = (() =>
            editedEvent?.getContent()['m.new_content'] ??
            mEvent.getContent()) as GetContentCallback;

          const senderId = mEvent.getSender() ?? '';
          const senderPowerLevel = getPowerLevel(mEvent.getSender());
          const senderDisplayName =
            getMemberDisplayName(room, senderId) ?? getMxIdLocalPart(senderId) ?? senderId;

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
              onClick={handleMessageClick}
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
              {mEvent.isRedacted() ? (
                <RedactedContent reason={mEvent.getUnsigned().redacted_because?.content.reason} />
              ) : (
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
              )}
            </Message>
          );
        },
        [MessageEvent.RoomMessageEncrypted]: (mEventId, mEvent, item, timelineSet, collapse) => {
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
                      getMemberDisplayName(room, senderId) ??
                      getMxIdLocalPart(senderId) ??
                      senderId;
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
        },
        [MessageEvent.Sticker]: (mEventId, mEvent, item, timelineSet, collapse) => {
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
        },
        [StateEvent.RoomMember]: (mEventId, mEvent, item) => {
          const membershipChanged = isMembershipChanged(mEvent);
          if (membershipChanged && hideMembershipEvents) return null;
          if (!membershipChanged && hideNickAvatarEvents) return null;

          const highlighted = focusItem?.index === item && focusItem.highlight;
          const parsed = parseMemberEvent(mEvent);

          const timeJSX = (
            <Time ts={mEvent.getTs()} compact={messageLayout === MessageLayout.Compact} />
          );

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
        },
        [StateEvent.RoomName]: (mEventId, mEvent, item) => {
          const highlighted = focusItem?.index === item && focusItem.highlight;
          const senderId = mEvent.getSender() ?? '';
          const senderName = getMemberDisplayName(room, senderId) || getMxIdLocalPart(senderId);

          const timeJSX = (
            <Time ts={mEvent.getTs()} compact={messageLayout === MessageLayout.Compact} />
          );

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
                iconSrc={Icons.Hash}
                content={
                  <Box grow="Yes" direction="Column">
                    <Text size="T300" priority="300">
                      <b>{senderName}</b>
                      {' changed room name'}
                    </Text>
                  </Box>
                }
              />
            </Event>
          );
        },
        [StateEvent.RoomTopic]: (mEventId, mEvent, item) => {
          const highlighted = focusItem?.index === item && focusItem.highlight;
          const senderId = mEvent.getSender() ?? '';
          const senderName = getMemberDisplayName(room, senderId) || getMxIdLocalPart(senderId);

          const timeJSX = (
            <Time ts={mEvent.getTs()} compact={messageLayout === MessageLayout.Compact} />
          );

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
                iconSrc={Icons.Hash}
                content={
                  <Box grow="Yes" direction="Column">
                    <Text size="T300" priority="300">
                      <b>{senderName}</b>
                      {' changed room topic'}
                    </Text>
                  </Box>
                }
              />
            </Event>
          );
        },
        [StateEvent.RoomAvatar]: (mEventId, mEvent, item) => {
          const highlighted = focusItem?.index === item && focusItem.highlight;
          const senderId = mEvent.getSender() ?? '';
          const senderName = getMemberDisplayName(room, senderId) || getMxIdLocalPart(senderId);

          const timeJSX = (
            <Time ts={mEvent.getTs()} compact={messageLayout === MessageLayout.Compact} />
          );

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
                iconSrc={Icons.Hash}
                content={
                  <Box grow="Yes" direction="Column">
                    <Text size="T300" priority="300">
                      <b>{senderName}</b>
                      {' changed room avatar'}
                    </Text>
                  </Box>
                }
              />
            </Event>
          );
        },
      },
      (mEventId, mEvent, item) => {
        if (!showHiddenEvents) return null;
        const highlighted = focusItem?.index === item && focusItem.highlight;
        const senderId = mEvent.getSender() ?? '';
        const senderName = getMemberDisplayName(room, senderId) || getMxIdLocalPart(senderId);

        const timeJSX = (
          <Time ts={mEvent.getTs()} compact={messageLayout === MessageLayout.Compact} />
        );

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
      },
      (mEventId, mEvent, item) => {
        if (!showHiddenEvents) return null;
        if (Object.keys(mEvent.getContent()).length === 0) return null;
        if (mEvent.getRelation()) return null;
        if (mEvent.isRedaction()) return null;

        const highlighted = focusItem?.index === item && focusItem.highlight;
        const senderId = mEvent.getSender() ?? '';
        const senderName = getMemberDisplayName(room, senderId) || getMxIdLocalPart(senderId);

        const timeJSX = (
          <Time ts={mEvent.getTs()} compact={messageLayout === MessageLayout.Compact} />
        );

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
                    {' event'}
                  </Text>
                </Box>
              }
            />
          </Event>
        );
      }
    );

    let prevEvent: MatrixEvent | undefined;
    let isPrevRendered = false;
    let newDivider = false;
    let dayDivider = false;
    const eventRenderer = (item: number) => {
      const [eventTimeline, baseIndex] = getTimelineAndBaseIndex(timeline.linkedTimelines, item);
      if (!eventTimeline) return null;
      const timelineSet = eventTimeline?.getTimelineSet();
      const mEvent = getTimelineEvent(eventTimeline, getTimelineRelativeIndex(item, baseIndex));
      const mEventId = mEvent?.getId();

      if (!mEvent || !mEventId) return null;

      const eventSender = mEvent.getSender();
      if (eventSender && ignoredUsersSet.has(eventSender)) {
        return null;
      }
      if (mEvent.isRedacted() && !showHiddenEvents) {
        return null;
      }

      if (!newDivider && readUptoEventIdRef.current) {
        newDivider = prevEvent?.getId() === readUptoEventIdRef.current;
      }
      if (!dayDivider) {
        dayDivider = prevEvent ? !inSameDay(prevEvent.getTs(), mEvent.getTs()) : false;
      }

      const collapsed =
        isPrevRendered &&
        !dayDivider &&
        (!newDivider || eventSender === mx.getUserId()) &&
        prevEvent !== undefined &&
        prevEvent.getSender() === eventSender &&
        prevEvent.getType() === mEvent.getType() &&
        minuteDifference(prevEvent.getTs(), mEvent.getTs()) < 2;

      const eventJSX = reactionOrEditEvent(mEvent)
        ? null
        : renderMatrixEvent(
            mEvent.getType(),
            typeof mEvent.getStateKey() === 'string',
            mEventId,
            mEvent,
            item,
            timelineSet,
            collapsed
          );
      prevEvent = mEvent;
      isPrevRendered = !!eventJSX;

      const newDividerJSX =
        newDivider && eventJSX && eventSender !== mx.getUserId() ? (
          <MessageBase space={messageSpacing}>
            <TimelineDivider style={{ color: color.Success.Main }} variant="Inherit">
              <Badge as="span" size="500" variant="Success" fill="Solid" radii="300">
                <Text size="L400">New Messages</Text>
              </Badge>
            </TimelineDivider>
          </MessageBase>
        ) : null;

      const dayDividerJSX =
        dayDivider && eventJSX ? (
          <MessageBase space={messageSpacing}>
            <TimelineDivider variant="Surface">
              <Badge as="span" size="500" variant="Secondary" fill="None" radii="300">
                <Text size="L400">
                  {(() => {
                    if (today(mEvent.getTs())) return 'Today';
                    if (yesterday(mEvent.getTs())) return 'Yesterday';
                    return timeDayMonthYear(mEvent.getTs());
                  })()}
                </Text>
              </Badge>
            </TimelineDivider>
          </MessageBase>
        ) : null;

      if (eventJSX && (newDividerJSX || dayDividerJSX)) {
        if (newDividerJSX) newDivider = false;
        if (dayDividerJSX) dayDivider = false;

        return (
          <React.Fragment key={mEventId}>
            {newDividerJSX}
            {dayDividerJSX}
            {eventJSX}
          </React.Fragment>
        );
      }

      return eventJSX;
    };

    return (
      <Box grow="Yes" style={{ position: 'relative' }} ref={ref}>
        {unreadInfo?.readUptoEventId && !unreadInfo?.inLiveTimeline && (
          <TimelineFloat position="Top">
            <Chip
              variant="Primary"
              radii="Pill"
              outlined
              before={<Icon size="50" src={Icons.MessageUnread} />}
              onClick={handleJumpToUnread}
            >
              <Text size="L400">Jump to Unread</Text>
            </Chip>

            <Chip
              variant="SurfaceVariant"
              radii="Pill"
              outlined
              before={<Icon size="50" src={Icons.CheckTwice} />}
              onClick={handleMarkAsRead}
            >
              <Text size="L400">Mark as Read</Text>
            </Chip>
          </TimelineFloat>
        )}
        <Scroll ref={scrollRef} visibility="Hover">
          <Box
            direction="Column"
            justifyContent="End"
            style={{ minHeight: '100%', padding: `${config.space.S600} 0` }}
          >
            {!canPaginateBack && rangeAtStart && getItems().length > 0 && (
              <div
                style={{
                  padding: `${config.space.S700} ${config.space.S400} ${config.space.S600} ${
                    messageLayout === MessageLayout.Compact ? config.space.S400 : toRem(64)
                  }`,
                }}
              >
                <RoomIntro room={room} />
              </div>
            )}
            {(canPaginateBack || !rangeAtStart) &&
              (messageLayout === MessageLayout.Compact ? (
                <>
                  <MessageBase>
                    <CompactPlaceholder key={getItems().length} />
                  </MessageBase>
                  <MessageBase>
                    <CompactPlaceholder key={getItems().length} />
                  </MessageBase>
                  <MessageBase>
                    <CompactPlaceholder key={getItems().length} />
                  </MessageBase>
                  <MessageBase>
                    <CompactPlaceholder key={getItems().length} />
                  </MessageBase>
                  <MessageBase ref={observeBackAnchor}>
                    <CompactPlaceholder key={getItems().length} />
                  </MessageBase>
                </>
              ) : (
                <>
                  <MessageBase>
                    <DefaultPlaceholder key={getItems().length} />
                  </MessageBase>
                  <MessageBase>
                    <DefaultPlaceholder key={getItems().length} />
                  </MessageBase>
                  <MessageBase ref={observeBackAnchor}>
                    <DefaultPlaceholder key={getItems().length} />
                  </MessageBase>
                </>
              ))}

            {getItems().map(eventRenderer)}

            {(!liveTimelineLinked || !rangeAtEnd) &&
              (messageLayout === MessageLayout.Compact ? (
                <>
                  <MessageBase ref={observeFrontAnchor}>
                    <CompactPlaceholder key={getItems().length} />
                  </MessageBase>
                  <MessageBase>
                    <CompactPlaceholder key={getItems().length} />
                  </MessageBase>
                  <MessageBase>
                    <CompactPlaceholder key={getItems().length} />
                  </MessageBase>
                  <MessageBase>
                    <CompactPlaceholder key={getItems().length} />
                  </MessageBase>
                  <MessageBase>
                    <CompactPlaceholder key={getItems().length} />
                  </MessageBase>
                </>
              ) : (
                <>
                  <MessageBase ref={observeFrontAnchor}>
                    <DefaultPlaceholder key={getItems().length} />
                  </MessageBase>
                  <MessageBase>
                    <DefaultPlaceholder key={getItems().length} />
                  </MessageBase>
                  <MessageBase>
                    <DefaultPlaceholder key={getItems().length} />
                  </MessageBase>
                </>
              ))}
            <span ref={atBottomAnchorRef} />
          </Box>
        </Scroll>
        {!atBottom && (
          <TimelineFloat position="Bottom">
            <Chip
              variant="SurfaceVariant"
              radii="Pill"
              outlined
              before={<Icon size="50" src={Icons.ArrowBottom} />}
              onClick={handleJumpToLatest}
            >
              <Text size="L400">Jump to Latest</Text>
            </Chip>
          </TimelineFloat>
        )}
      </Box>
    );
  }
);

export function RoomTimeline(props: RoomTimelineProps) {
  return (
    <RoomTimelineProvider
      room={props.room}
      editor={props.editor}
      getPowerLevelTag={props.getPowerLevelTag}
      accessibleTagColors={props.accessibleTagColors}
      eventId={props.eventId}
    >
      <RoomTimelineInternal {...props} />
    </RoomTimelineProvider>
  );
}
