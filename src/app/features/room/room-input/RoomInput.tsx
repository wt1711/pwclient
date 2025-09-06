import React, { RefObject, forwardRef } from 'react';
import { Editor } from 'slate';
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

const RoomInputInternal = forwardRef<HTMLDivElement>((props, ref) => {
  const { editor, handleKeyDown, handleKeyUp, handlePaste, pickFile, toolbar } =
    useRoomInputContext();

  return (
    <div ref={ref}>
      <UploadArea />
      <AutocompleteHandler />
      <CustomEditor
        editableName="RoomInput"
        editor={editor}
        placeholder="Send a message..."
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onPaste={handlePaste}
        top={
          <>
            <PredictiveMessage />
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
