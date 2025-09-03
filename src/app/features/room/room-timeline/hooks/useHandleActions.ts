import React, { useCallback } from 'react';
import { Editor } from 'slate';
import { ReactEditor } from 'slate-react';
import { IContent, Room } from 'matrix-js-sdk';
import { useSetAtom } from 'jotai';

import { openProfileViewer } from '../../../../../client/action/navigation';
import { useMatrixClient } from '../../../../hooks/useMatrixClient';
import { getEditedEvent, getMemberDisplayName } from '../../../../utils/room';
import { getMxIdLocalPart } from '../../../../utils/matrix';
import { createMentionElement, moveCursor } from '../../../../components/editor';
import { roomIdToReplyDraftAtomFamily } from '../../../../state/room/roomInputDrafts';
import { useRoomMessage } from '../../RoomMessageContext';
import { Message as MessageType } from '../../../ai-assistant/ai';
import { isFromMe } from '../../../ai-assistant/utils';
import { markAsRead } from '../../../../../client/action/notifications';

export function useHandleUserClick(room: Room) {
  return useCallback(
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
}

export function useHandleMarkAsRead(room: Room, hideActivity: boolean) {
  const mx = useMatrixClient();
  return useCallback(() => {
    markAsRead(mx, room.roomId, hideActivity);
  }, [mx, room, hideActivity]);
}

export function useHandleUsernameClick(room: Room, editor: Editor) {
  const mx = useMatrixClient();
  return useCallback(
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
}

export function useHandleEdit(
  editor: Editor,
  setEditId: React.Dispatch<React.SetStateAction<string | undefined>>
) {
  return useCallback(
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
}

export function useHandleReplyClick(room: Room, editor: Editor) {
  const setReplyDraft = useSetAtom(roomIdToReplyDraftAtomFamily(room.roomId));
  return useCallback(
    (evt: React.MouseEvent<HTMLButtonElement>, startThread = false) => {
      const replyId = evt.currentTarget.getAttribute('data-event-id');
      if (!replyId) {
        console.warn('Button should have "data-user-id" attribute!');
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
}

export function useHandleMessageClick(room: Room) {
  const mx = useMatrixClient();
  const { setSelectedMessage } = useRoomMessage();

  return useCallback(
    (evt: React.MouseEvent<HTMLDivElement>) => {
      const messageElement = evt.currentTarget;
      const messageText = messageElement.textContent?.trim();
      if (messageText) {
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
}
