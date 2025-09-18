import React, { RefObject, forwardRef, useCallback, useState } from 'react';
import { Descendant, Editor, Node } from 'slate';
import { Room } from 'matrix-js-sdk';
import { Icon, IconButton, Icons, Line } from 'folds';

import { CustomEditor, Toolbar } from '../../../components/editor';
import { GetPowerLevelTag } from '../../../hooks/usePowerLevelTags';

import { ReplyPreview } from './ReplyPreview';
import { RoomInputActions } from './RoomInputActions';
import { UploadArea } from './UploadArea';
import { AutocompleteHandler } from './AutocompleteHandler';
import { RoomInputProvider, useRoomInputContext } from './RoomInputContext';
import { PredictiveMessage } from './predictive-message/PredictiveMessage';
import { useDebounceValue } from '../../../hooks/useDebounceValue';
import { useAIAssistant } from '../../ai-assistant/AIAssistantContext';

const RoomInputInternal = forwardRef<HTMLDivElement>((props, ref) => {
  const { editor, handleKeyDown, handleKeyUp, handlePaste, pickFile, toolbar, room } =
    useRoomInputContext();
  const { isAIAssistantOpen } = useAIAssistant();

  const [editorText, setEditorText] = useState('');
  const debouncedEditorText = useDebounceValue(editorText, 500);

  const handleEditorChange = useCallback(
    (value: Descendant[]) => {
      const text = value.map((n) => Node.string(n)).join('\n');
      setEditorText(text);
    },
    [setEditorText]
  );
  const hasText = debouncedEditorText.trim().length > 0;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <UploadArea />
      <AutocompleteHandler />
      <CustomEditor
        editableName="RoomInput"
        editor={editor}
        placeholder="Send a message..."
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onPaste={handlePaste}
        onChange={handleEditorChange}
        top={
          <>
            {(hasText || isAIAssistantOpen) && (
              <PredictiveMessage room={room} editorText={debouncedEditorText} />
            )}
            <ReplyPreview />
          </>
        }
        before={
          <IconButton onClick={() => pickFile('*')} variant="SurfaceVariant" size="300" radii="300">
            <Icon src={Icons.PlusCircle} />
          </IconButton>
        }
        after={<RoomInputActions />}
        bottom={
          toolbar && (
            <div>
              <Line variant="SurfaceVariant" size="300" />
              <Toolbar />
            </div>
          )
        }
      />
    </div>
  );
});

interface RoomInputProps {
  editor: Editor;
  fileDropContainerRef: RefObject<HTMLElement>;
  roomId: string;
  room: Room;
  getPowerLevelTag: GetPowerLevelTag;
  accessibleTagColors: Map<string, string>;
}
export const RoomInput = forwardRef<HTMLDivElement, RoomInputProps>((props, ref) => (
  <RoomInputProvider {...props}>
    <RoomInputInternal ref={ref} />
  </RoomInputProvider>
));
