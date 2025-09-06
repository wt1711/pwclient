/* eslint-disable react/destructuring-assignment */
import React, {
  forwardRef,
  MouseEventHandler,
  RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
} from 'react';
import { Direction, EventTimelineSet, MatrixEvent, Room } from 'matrix-js-sdk';
import { Editor } from 'slate';
import { Box, Chip, Icon, Icons, Scroll, Text, config, toRem } from 'folds';
import { isKeyHotkey } from 'is-hotkey';

import { useVirtualPaginator } from '../../../hooks/useVirtualPaginator';
import { useAlive } from '../../../hooks/useAlive';
import { editableActiveElement, scrollToBottom } from '../../../utils/dom';
import { DefaultPlaceholder, CompactPlaceholder, MessageBase } from '../../../components/message';
import { canEditEvent, getLatestEditableEvt, reactionOrEditEvent } from '../../../utils/room';
import { MessageLayout } from '../../../state/settings';
import { useMatrixEventRenderer } from '../../../hooks/useMatrixEventRenderer';
import { RoomIntro } from '../../../components/room-intro';
import {
  getIntersectionObserverEntry,
  useIntersectionObserver,
} from '../../../hooks/useIntersectionObserver';
import { markAsRead } from '../../../../client/action/notifications';
import { useDebounce } from '../../../hooks/useDebounce';
import { getResizeObserverEntry, useResizeObserver } from '../../../hooks/useResizeObserver';
import { PAGINATION_LIMIT } from './constants';
import { useLiveEventArrive, useLiveTimelineRefresh } from './hooks/useEventAndTimeline';
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
import { inSameDay, minuteDifference } from '../../../utils/time';
import { isEmptyEditor } from '../../../components/editor';
import { MessageEvent, StateEvent } from '../../../../types/matrix/room';
import { useKeyDown } from '../../../hooks/useKeyDown';
import { useDocumentFocusChange } from '../../../hooks/useDocumentFocusChange';
import { useIgnoredUsers } from '../../../hooks/useIgnoredUsers';
import { GetPowerLevelTag } from '../../../hooks/usePowerLevelTags';
import { RoomTimelineProvider, useRoomTimelineContext } from './RoomTimelineContext';
import {
  TimelineFloat,
  NewMessagesDivider,
  DayDivider,
} from './components/TimelineFloatAndDividers';
import { TimelineMessage } from './components/TimelineMessage';
import { TimelineEncryptedMessage } from './components/TimelineEncryptedMessage';
import { TimelineStickerMessage } from './components/TimelineStickerMessage';
import { TimelineRoomMemberEvent } from './components/TimelineRoomMemberEvent';
import { TimelineRoomNameEvent } from './components/TimelineRoomNameEvent';
import { TimelineRoomTopicEvent } from './components/TimelineRoomTopicEvent';
import { TimelineRoomAvatarEvent } from './components/TimelineRoomAvatarEvent';
import { TimelineHiddenStateEvent } from './components/TimelineHiddenStateEvent';
import { TimelineUnknownEvent } from './components/TimelineUnknownEvent';

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
      showHiddenEvents,
      editId,
      setEditId,
      unreadInfo,
      setUnreadInfo,
      handleMarkAsRead,
      timeline,
      setTimeline,
      focusItem,
      setFocusItem,
      mx,
      handleTimelinePagination,
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
    } = useRoomTimelineContext();

    const ignoredUsersList = useIgnoredUsers();
    const ignoredUsersSet = useMemo(() => new Set(ignoredUsersList), [ignoredUsersList]);

    const alive = useAlive();

    const eventsLength = getTimelinesEventsCount(timeline.linkedTimelines);
    const liveTimelineLinked =
      timeline.linkedTimelines[timeline.linkedTimelines.length - 1] === getLiveTimeline(room);
    const canPaginateBack =
      typeof timeline.linkedTimelines[0]?.getPaginationToken(Direction.Backward) === 'string';
    const rangeAtStart = timeline.range.start === 0;
    const rangeAtEnd = timeline.range.end === eventsLength;

    const getScrollElement = useCallback(() => scrollRef.current, [scrollRef]);

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
          [scrollRef]
        ),
        onEnd: handleTimelinePagination,
      });

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
        [
          mx,
          room,
          unreadInfo,
          setUnreadInfo,
          hideActivity,
          setTimeline,
          scrollToBottomRef,
          atBottomRef,
        ]
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
      [room, timeline, scrollToItem, setTimeline, setFocusItem, loadEventTimeline]
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
      }, [getScrollElement, roomInputRef, atBottomRef]),
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
    }, [mx, room, hideActivity, readUptoEventIdRef]);

    const debounceSetAtBottom = useDebounce(
      useCallback(
        (entry: IntersectionObserverEntry) => {
          if (!entry.isIntersecting) setAtBottom(false);
        },
        [setAtBottom]
      ),
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
        [debounceSetAtBottom, tryAutoMarkAsRead, atBottomAnchorRef, setAtBottom, atLiveEndRef]
      ),
      useCallback(
        () => ({
          root: getScrollElement(),
          rootMargin: '100px',
        }),
        [getScrollElement]
      ),
      useCallback(() => atBottomAnchorRef.current, [atBottomAnchorRef])
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
        [tryAutoMarkAsRead, unreadInfo, handleOpenEvent, atBottomRef]
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
    }, [scrollRef]);

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
    }, [scrollToBottomCount, scrollToBottomRef, scrollRef]);

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
    }, [scrollToElement, editId, scrollRef]);

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
        [MessageEvent.RoomMessage]: (mEventId, mEvent, item, timelineSet, collapse) => (
          <TimelineMessage
            mEventId={mEventId}
            mEvent={mEvent}
            item={item}
            timelineSet={timelineSet}
            collapse={collapse}
            handleOpenReply={handleOpenReply}
          />
        ),
        [MessageEvent.RoomMessageEncrypted]: (mEventId, mEvent, item, timelineSet, collapse) => (
          <TimelineEncryptedMessage
            mEventId={mEventId}
            mEvent={mEvent}
            item={item}
            timelineSet={timelineSet}
            collapse={collapse}
            handleOpenReply={handleOpenReply}
          />
        ),
        [MessageEvent.Sticker]: (mEventId, mEvent, item, timelineSet, collapse) => (
          <TimelineStickerMessage
            mEventId={mEventId}
            mEvent={mEvent}
            item={item}
            timelineSet={timelineSet}
            collapse={collapse}
          />
        ),
        [StateEvent.RoomMember]: (mEventId, mEvent, item) => (
          <TimelineRoomMemberEvent mEventId={mEventId} mEvent={mEvent} item={item} />
        ),
        [StateEvent.RoomName]: (mEventId, mEvent, item) => (
          <TimelineRoomNameEvent mEventId={mEventId} mEvent={mEvent} item={item} />
        ),
        [StateEvent.RoomTopic]: (mEventId, mEvent, item) => (
          <TimelineRoomTopicEvent mEventId={mEventId} mEvent={mEvent} item={item} />
        ),
        [StateEvent.RoomAvatar]: (mEventId, mEvent, item) => (
          <TimelineRoomAvatarEvent mEventId={mEventId} mEvent={mEvent} item={item} />
        ),
      },
      (mEventId, mEvent, item) => (
        <TimelineHiddenStateEvent mEventId={mEventId} mEvent={mEvent} item={item} />
      ),
      (mEventId, mEvent, item) => (
        <TimelineUnknownEvent mEventId={mEventId} mEvent={mEvent} item={item} />
      )
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

      const collapsed: boolean =
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
        newDivider && eventJSX && eventSender !== mx.getUserId() ? <NewMessagesDivider /> : null;

      const dayDividerJSX = dayDivider && eventJSX ? <DayDivider ts={mEvent.getTs()} /> : null;

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
