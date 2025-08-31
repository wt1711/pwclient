import { KeyboardEventHandler, useCallback } from 'react';
import { Editor } from 'slate';
import { isKeyHotkey } from 'is-hotkey';
import { EventType, MatrixClient } from 'matrix-js-sdk';

import {
  AutocompletePrefix,
  AutocompleteQuery,
  createEmoticonElement,
  isEmptyEditor,
  moveCursor,
} from '../../../../components/editor';
import { getImageUrlBlob, loadImageElement } from '../../../../utils/dom';
import { getImageInfo, mxcUrlToHttp } from '../../../../utils/matrix';
import { IReplyDraft } from '../../../../state/room/roomInputDrafts';

interface EditorEventsHookProps {
  editor: Editor;
  submit: () => void;
  setReplyDraft: (draft: IReplyDraft | undefined) => void;
  enterForNewline: boolean;
  autocompleteQuery: AutocompleteQuery<AutocompletePrefix> | undefined;
  setAutocompleteQuery: (query: AutocompleteQuery<AutocompletePrefix> | undefined) => void;
  handleAutocompleteKeyUp: (evt: React.KeyboardEvent<Element>) => void;
  hideActivity: boolean;
  sendTypingStatus: (typing: boolean) => void;
  mx: MatrixClient;
  useAuthentication: boolean;
  roomId: string;
}

export function useEditorEvents({
  editor,
  submit,
  setReplyDraft,
  enterForNewline,
  autocompleteQuery,
  setAutocompleteQuery,
  handleAutocompleteKeyUp,
  hideActivity,
  sendTypingStatus,
  mx,
  useAuthentication,
  roomId,
}: EditorEventsHookProps) {
  const handleKeyDown: KeyboardEventHandler = useCallback(
    (evt) => {
      if (
        (isKeyHotkey('mod+enter', evt) || (!enterForNewline && isKeyHotkey('enter', evt))) &&
        !evt.nativeEvent.isComposing
      ) {
        evt.preventDefault();
        submit();
      }
      if (isKeyHotkey('escape', evt)) {
        evt.preventDefault();
        if (autocompleteQuery) {
          setAutocompleteQuery(undefined);
          return;
        }
        setReplyDraft(undefined);
      }
    },
    [submit, setReplyDraft, enterForNewline, autocompleteQuery, setAutocompleteQuery]
  );

  const handleKeyUp: KeyboardEventHandler = useCallback(
    (evt) => {
      handleAutocompleteKeyUp(evt as React.KeyboardEvent<Element>);
      if (!hideActivity) {
        sendTypingStatus(!isEmptyEditor(editor));
      }
    },
    [handleAutocompleteKeyUp, hideActivity, sendTypingStatus, editor]
  );

  const handleEmoticonSelect = (key: string, shortcode: string) => {
    editor.insertNode(createEmoticonElement(key, shortcode));
    moveCursor(editor);
  };

  const handleStickerSelect = async (mxc: string, shortcode: string, label: string) => {
    const stickerUrl = mxcUrlToHttp(mx, mxc, useAuthentication);
    if (!stickerUrl) return;

    const info = await getImageInfo(
      await loadImageElement(stickerUrl),
      await getImageUrlBlob(stickerUrl)
    );

    mx.sendEvent(roomId, EventType.Sticker, {
      body: label,
      url: mxc,
      info,
    });
  };

  return {
    handleKeyDown,
    handleKeyUp,
    handleEmoticonSelect,
    handleStickerSelect,
  };
}
