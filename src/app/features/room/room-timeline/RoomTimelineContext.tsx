import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { IContent, Room } from 'matrix-js-sdk';
import { Editor } from 'slate';
import { ReactEditor } from 'slate-react';
import { useSetAtom } from 'jotai';

import { MessageLayout, MessageSpacing, settingsAtom } from '../../../state/settings';
import { useSetting } from '../../../state/hooks/settings';
import { getRoomUnreadInfo } from './hooks/getEventAndTimeline';
import { useRoomUnread } from '../../../state/hooks/unread';
import { roomToUnreadAtom } from '../../../state/room/roomToUnread';
import { usePowerLevelsAPI, usePowerLevelsContext } from '../../../hooks/usePowerLevels';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { MessageEvent, StateEvent } from '../../../../types/matrix/room';
import { openProfileViewer } from '../../../../client/action/navigation';
import { eventWithShortcode, factoryEventSentBy, getMxIdLocalPart } from '../../../utils/matrix';
import {
  getEditedEvent,
  getEventReactions,
  getMemberDisplayName,
  getReactionContent,
} from '../../../utils/room';
import { createMentionElement, moveCursor } from '../../../components/editor';
import { roomIdToReplyDraftAtomFamily } from '../../../state/room/roomInputDrafts';
import { useRoomMessage } from '../RoomMessageContext';
import { Message as MessageType } from '../../ai-assistant/ai';
import { isFromMe } from '../../ai-assistant/utils';
import { markAsRead } from '../../../../client/action/notifications';

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
}

const RoomTimelineContext = createContext<RoomTimelineContextType | null>(null);

interface RoomTimelineProviderProps {
  children: React.ReactNode;
  room: Room;
  editor: Editor;
}

export function RoomTimelineProvider({ children, room, editor }: RoomTimelineProviderProps) {
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

  const mx = useMatrixClient();
  const powerLevels = usePowerLevelsContext();
  const { canDoAction, canSendEvent, canSendStateEvent, getPowerLevel } =
    usePowerLevelsAPI(powerLevels);
  const myPowerLevel = getPowerLevel(mx.getUserId() ?? '');
  const canRedact = canDoAction('redact', myPowerLevel);
  const canSendReaction = canSendEvent(MessageEvent.Reaction, myPowerLevel);
  const canPinEvent = canSendStateEvent(StateEvent.RoomPinnedEvents, myPowerLevel);
  const setReplyDraft = useSetAtom(roomIdToReplyDraftAtomFamily(room.roomId));
  const { setSelectedMessage } = useRoomMessage();

  const handleUserClick = useCallback(
    (evt: React.MouseEvent<HTMLButtonElement>) => {
      evt.preventDefault();
      evt.stopPropagation();
      const userId = evt.currentTarget.getAttribute('data-user-id');
      if (!userId) {
        console.warn('Button should have "data-user-id" attribute!');
        return;
      }
      openProfileViewer(userId, room.roomId);
    },
    [room]
  );
  const handleUsernameClick = useCallback(
    (evt: React.MouseEvent<HTMLButtonElement>) => {
      evt.preventDefault();
      const userId = evt.currentTarget.getAttribute('data-user-id');
      if (!userId) {
        console.warn('Button should have "data-user-id" attribute!');
        return;
      }
      const name = getMemberDisplayName(room, userId) ?? getMxIdLocalPart(userId) ?? userId;
      editor.insertNode(
        createMentionElement(
          userId,
          name.startsWith('@') ? name : `@${name}`,
          userId === mx.getUserId()
        )
      );
      ReactEditor.focus(editor);
      moveCursor(editor);
    },
    [mx, room, editor]
  );

  const handleEdit = useCallback(
    (editEvtId?: string) => {
      if (editEvtId) {
        setEditId(editEvtId);
        return;
      }
      setEditId(undefined);
      ReactEditor.focus(editor);
    },
    [editor, setEditId]
  );

  const handleReplyClick = useCallback(
    (evt: React.MouseEvent<HTMLButtonElement>, startThread = false) => {
      const replyId = evt.currentTarget.getAttribute('data-event-id');
      if (!replyId) {
        console.warn('Button should have "data-event-id" attribute!');
        return;
      }
      const replyEvt = room.findEventById(replyId);
      if (!replyEvt) return;
      const editedReply = getEditedEvent(replyId, replyEvt, room.getUnfilteredTimelineSet());
      const content: IContent = editedReply?.getContent()['m.new_content'] ?? replyEvt.getContent();
      const { body, formatted_body: formattedBody } = content;
      const { 'm.relates_to': relation } = startThread
        ? { 'm.relates_to': { rel_type: 'm.thread', event_id: replyId } }
        : replyEvt.getWireContent();
      const senderId = replyEvt.getSender();
      if (senderId && typeof body === 'string') {
        setReplyDraft({
          userId: senderId,
          eventId: replyId,
          body,
          formattedBody,
          relation,
        });
        setTimeout(() => ReactEditor.focus(editor), 100);
      }
    },
    [room, setReplyDraft, editor]
  );

  const handleMessageClick = useCallback(
    (evt: React.MouseEvent<HTMLDivElement>) => {
      const messageElement = evt.currentTarget;
      const messageText = messageElement.textContent?.trim();
      if (messageText) {
        // Create a Message object from the clicked message
        const messageEvent = evt.currentTarget.closest('[data-message-id]');
        if (messageEvent) {
          const messageEventId = messageEvent.getAttribute('data-message-id');
          const roomEvent = room.findEventById(messageEventId || '');
          if (roomEvent) {
            const sender = roomEvent.getSender() || '';
            const content = roomEvent.getContent();
            const body = content.body || messageText;

            const message: MessageType = {
              sender,
              text: body,
              timestamp: new Date(roomEvent.getTs()).toISOString(),
              is_from_me: isFromMe(sender, mx.getUserId() as string),
            };

            setSelectedMessage(message);
          }
        }
      }
    },
    [setSelectedMessage, room, mx]
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
