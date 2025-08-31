import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { Editor, Transforms } from 'slate';
import { roomIdToMsgDraftAtomFamily } from '../../../../state/room/roomInputDrafts';
import { isEmptyEditor, resetEditor, resetEditorHistory } from '../../../../components/editor';

export function useInputState(editor: Editor, roomId: string) {
  const [msgDraft, setMsgDraft] = useAtom(roomIdToMsgDraftAtomFamily(roomId));

  useEffect(() => {
    Transforms.insertFragment(editor, msgDraft);
  }, [editor, msgDraft]);

  useEffect(
    () => () => {
      if (!isEmptyEditor(editor)) {
        const parsedDraft = JSON.parse(JSON.stringify(editor.children));
        setMsgDraft(parsedDraft);
      } else {
        setMsgDraft([]);
      }
      resetEditor(editor);
      resetEditorHistory(editor);
    },
    [roomId, editor, setMsgDraft]
  );

  return { msgDraft, setMsgDraft };
}
