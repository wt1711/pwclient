import React, { RefObject, forwardRef, useCallback, useEffect, useState } from 'react';
import { useAtomValue } from 'jotai';
import { Room } from 'matrix-js-sdk';
import { Editor } from 'slate';
import { Icon, IconButton, Icons, Line } from 'folds';

import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { useRoomEditor } from '../RoomEditorContext';
import { CustomEditor, Toolbar } from '../../../components/editor';
import { useTypingStatusUpdater } from '../../../hooks/useTypingStatusUpdater';
import { useFilePicker } from '../../../hooks/useFilePicker';
import { useFilePasteHandler } from '../../../hooks/useFilePasteHandler';
import { useFileDropZone } from '../../../hooks/useFileDrop';
import { useSetting } from '../../../state/hooks/settings';
import { settingsAtom } from '../../../state/settings';
import { useElementSizeObserver } from '../../../hooks/useElementSizeObserver';
import { roomToParentsAtom } from '../../../state/room/roomToParents';
import { useMediaAuthentication } from '../../../hooks/useMediaAuthentication';
import { useImagePackRooms } from '../../../hooks/useImagePackRooms';
import { GetPowerLevelTag } from '../../../hooks/usePowerLevelTags';
import { powerLevelAPI, usePowerLevelsContext } from '../../../hooks/usePowerLevels';
import colorMXID from '../../../../util/colorMXID';
import { useIsDirectRoom } from '../../../hooks/useRoom';

import { ReplyPreview } from './ReplyPreview';
import { RoomInputActions } from './RoomInputActions';
import { UploadArea } from './UploadArea';
import { AutocompleteHandler } from './AutocompleteHandler';
import { useFileUploads } from './hooks/useFileUploads';
import { useMessageSubmit } from './hooks/useMessageSubmit';
import { useAutocomplete } from './hooks/useAutocomplete';
import { useInputState } from './hooks/useInputState';
import { useEditorEvents } from './hooks/useEditorEvents';

interface RoomInputProps {
  editor: Editor;
  fileDropContainerRef: RefObject<HTMLElement>;
  roomId: string;
  room: Room;
  getPowerLevelTag: GetPowerLevelTag;
  accessibleTagColors: Map<string, string>;
}
export const RoomInput = forwardRef<HTMLDivElement, RoomInputProps>(
  ({ editor, fileDropContainerRef, roomId, room, getPowerLevelTag, accessibleTagColors }, ref) => {
    const mx = useMatrixClient();
    const useAuthentication = useMediaAuthentication();
    const [enterForNewline] = useSetting(settingsAtom, 'enterForNewline');
    const [isMarkdown] = useSetting(settingsAtom, 'isMarkdown');
    const [hideActivity] = useSetting(settingsAtom, 'hideActivity');
    const [legacyUsernameColor] = useSetting(settingsAtom, 'legacyUsernameColor');
    const direct = useIsDirectRoom();
    const roomToParents = useAtomValue(roomToParentsAtom);
    const powerLevels = usePowerLevelsContext();
    const { setEditor: setRoomEditor } = useRoomEditor();

    const {
      uploadBoard,
      setUploadBoard,
      selectedFiles,
      uploadFamilyObserverAtom,
      uploadBoardHandlers,
      handleFiles,
      handleFileMetadata,
      handleRemoveUpload,
      handleCancelUpload,
      handleSendUpload,
    } = useFileUploads(room);

    const pickFile = useFilePicker(handleFiles, true);
    const handlePaste = useFilePasteHandler(handleFiles);
    const dropZoneVisible = useFileDropZone(fileDropContainerRef, handleFiles);
    const [hideStickerBtn, setHideStickerBtn] = useState(document.body.clientWidth < 500);
    useElementSizeObserver(
      useCallback(() => document.body, []),
      useCallback((width) => setHideStickerBtn(width < 500), [setHideStickerBtn])
    );
    const sendTypingStatus = useTypingStatusUpdater(mx, roomId);

    const { submit, replyDraft, setReplyDraft } = useMessageSubmit(
      editor,
      room,
      isMarkdown,
      sendTypingStatus
    );

    useInputState(editor, roomId);

    const {
      autocompleteQuery,
      setAutocompleteQuery,
      handleKeyUp: handleAutocompleteKeyUp,
      handleCloseAutocomplete,
    } = useAutocomplete(editor);
    const replyUserID = replyDraft?.userId;

    const { handleKeyDown, handleKeyUp, handleEmoticonSelect, handleStickerSelect } =
      useEditorEvents({
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
      });

    const replyPowerTag = getPowerLevelTag(powerLevelAPI.getPowerLevel(powerLevels, replyUserID));
    const replyPowerColor = replyPowerTag.color
      ? accessibleTagColors.get(replyPowerTag.color)
      : undefined;
    const replyUsernameColor =
      legacyUsernameColor || direct ? colorMXID(replyUserID ?? '') : replyPowerColor;
    const imagePackRooms: Room[] = useImagePackRooms(roomId, roomToParents);

    const [
      toolbar,
      // setToolbar
    ] = useSetting(settingsAtom, 'editorToolbar');

    // Set the editor in AI Assistant context
    useEffect(() => {
      setRoomEditor(editor);
    }, [editor, setRoomEditor]);

    return (
      <div ref={ref}>
        <UploadArea
          room={room}
          selectedFiles={selectedFiles}
          uploadBoard={uploadBoard}
          setUploadBoard={setUploadBoard}
          uploadFamilyObserverAtom={uploadFamilyObserverAtom}
          handleSendUpload={handleSendUpload}
          uploadBoardHandlers={uploadBoardHandlers}
          handleCancelUpload={handleCancelUpload}
          handleFileMetadata={handleFileMetadata}
          handleRemoveUpload={handleRemoveUpload}
          dropZoneVisible={dropZoneVisible}
        />
        <AutocompleteHandler
          autocompleteQuery={autocompleteQuery}
          handleCloseAutocomplete={handleCloseAutocomplete}
          editor={editor}
          room={room}
          roomId={roomId}
          imagePackRooms={imagePackRooms}
        />
        <CustomEditor
          editableName="RoomInput"
          editor={editor}
          placeholder="Send a message..."
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onPaste={handlePaste}
          top={
            <ReplyPreview
              replyDraft={replyDraft}
              setReplyDraft={setReplyDraft}
              replyUsernameColor={replyUsernameColor}
              room={room}
            />
          }
          before={
            <IconButton
              onClick={() => pickFile('*')}
              variant="SurfaceVariant"
              size="300"
              radii="300"
            >
              <Icon src={Icons.PlusCircle} />
            </IconButton>
          }
          after={
            <RoomInputActions
              editor={editor}
              submit={submit}
              imagePackRooms={imagePackRooms}
              handleEmoticonSelect={handleEmoticonSelect}
              handleStickerSelect={handleStickerSelect}
              hideStickerBtn={hideStickerBtn}
            />
          }
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
  }
);
