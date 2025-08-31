import { useCallback } from 'react';
import { useAtom } from 'jotai';
import { Editor } from 'slate';
import { IContent, MsgType, Room, RelationType } from 'matrix-js-sdk';
import { useMatrixClient } from '../../../../hooks/useMatrixClient';
import {
  getBeginCommand,
  getMentions,
  resetEditor,
  resetEditorHistory,
  toMatrixCustomHTML,
  toPlainText,
  trimCommand,
  customHtmlEqualsPlainText,
  trimCustomHtml,
} from '../../../../components/editor';
import { roomIdToReplyDraftAtomFamily } from '../../../../state/room/roomInputDrafts';
import { Command, SHRUG, TABLEFLIP, UNFLIP, useCommands } from '../../../../hooks/useCommands';
import { getMentionContent } from '../../../../utils/room';

export function useMessageSubmit(
  editor: Editor,
  room: Room,
  isMarkdown: boolean,
  sendTypingStatus: (typing: boolean) => void
) {
  const mx = useMatrixClient();
  const { roomId } = room;
  const commands = useCommands(mx, room);
  const [replyDraft, setReplyDraft] = useAtom(roomIdToReplyDraftAtomFamily(roomId));

  const submit = useCallback(() => {
    const commandName = getBeginCommand(editor);
    let plainText = toPlainText(editor.children, isMarkdown).trim();
    let customHtml = trimCustomHtml(
      toMatrixCustomHTML(editor.children, {
        allowTextFormatting: true,
        allowBlockMarkdown: isMarkdown,
        allowInlineMarkdown: isMarkdown,
      })
    );
    let msgType = MsgType.Text;

    if (commandName) {
      plainText = trimCommand(commandName, plainText);
      customHtml = trimCommand(commandName, customHtml);
    }
    if (commandName === Command.Me) {
      msgType = MsgType.Emote;
    } else if (commandName === Command.Notice) {
      msgType = MsgType.Notice;
    } else if (commandName === Command.Shrug) {
      plainText = `${SHRUG} ${plainText}`;
      customHtml = `${SHRUG} ${customHtml}`;
    } else if (commandName === Command.TableFlip) {
      plainText = `${TABLEFLIP} ${plainText}`;
      customHtml = `${TABLEFLIP} ${customHtml}`;
    } else if (commandName === Command.UnFlip) {
      plainText = `${UNFLIP} ${plainText}`;
      customHtml = `${UNFLIP} ${customHtml}`;
    } else if (commandName) {
      const commandContent = commands[commandName as Command];
      if (commandContent) {
        commandContent.exe(plainText);
      }
      resetEditor(editor);
      resetEditorHistory(editor);
      sendTypingStatus(false);
      return;
    }

    if (plainText === '') return;

    const body = plainText;
    const formattedBody = customHtml;
    const mentionData = getMentions(mx, roomId, editor);

    const content: IContent = {
      msgtype: msgType,
      body,
    };

    if (replyDraft && replyDraft.userId !== mx.getUserId()) {
      mentionData.users.add(replyDraft.userId);
    }

    const mMentions = getMentionContent(Array.from(mentionData.users), mentionData.room);
    content['m.mentions'] = mMentions;

    if (replyDraft || !customHtmlEqualsPlainText(formattedBody, body)) {
      content.format = 'org.matrix.custom.html';
      content.formatted_body = formattedBody;
    }
    if (replyDraft) {
      content['m.relates_to'] = {
        'm.in_reply_to': {
          event_id: replyDraft.eventId,
        },
      };
      if (replyDraft.relation?.rel_type === RelationType.Thread) {
        content['m.relates_to'].event_id = replyDraft.relation.event_id;
        content['m.relates_to'].rel_type = RelationType.Thread;
        content['m.relates_to'].is_falling_back = false;
      }
    }
    mx.sendMessage(roomId, content);
    resetEditor(editor);
    resetEditorHistory(editor);
    setReplyDraft(undefined);
    sendTypingStatus(false);
  }, [mx, roomId, editor, replyDraft, sendTypingStatus, setReplyDraft, isMarkdown, commands]);

  return { submit, replyDraft, setReplyDraft };
}
