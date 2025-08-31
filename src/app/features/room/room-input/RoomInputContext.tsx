import React, {
  createContext,
  useContext,
  RefObject,
  useState,
  useCallback,
  MutableRefObject,
  useMemo,
} from 'react';
import { Editor } from 'slate';
import { Room } from 'matrix-js-sdk';
import { useAtomValue } from 'jotai';

import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { useSetting } from '../../../state/hooks/settings';
import { settingsAtom } from '../../../state/settings';
import { useIsDirectRoom } from '../../../hooks/useRoom';
import { roomToParentsAtom } from '../../../state/room/roomToParents';
import { useImagePackRooms } from '../../../hooks/useImagePackRooms';
import { GetPowerLevelTag } from '../../../hooks/usePowerLevelTags';
import { powerLevelAPI, usePowerLevelsContext } from '../../../hooks/usePowerLevels';
import { useTypingStatusUpdater } from '../../../hooks/useTypingStatusUpdater';
import { useFileUploads } from './hooks/useFileUploads';
import { useMessageSubmit } from './hooks/useMessageSubmit';
import { useAutocomplete } from './hooks/useAutocomplete';
import { useInputState } from './hooks/useInputState';
import { useEditorEvents } from './hooks/useEditorEvents';
import { useMediaAuthentication } from '../../../hooks/useMediaAuthentication';
import { useFilePicker } from '../../../hooks/useFilePicker';
import { useFilePasteHandler } from '../../../hooks/useFilePasteHandler';
import { useFileDropZone } from '../../../hooks/useFileDrop';
import { useElementSizeObserver } from '../../../hooks/useElementSizeObserver';
import colorMXID from '../../../../util/colorMXID';
import {
  IReplyDraft,
  TUploadContent,
  TUploadItem,
  TUploadMetadata,
} from '../../../state/room/roomInputDrafts';
import { Upload, UploadSuccess, createUploadFamilyObserverAtom } from '../../../state/upload';
import { AutocompletePrefix, AutocompleteQuery } from '../../../components/editor';
import { UploadBoardImperativeHandlers } from '../../../components/upload-board';

interface RoomInputContextType {
  editor: Editor;
  room: Room;
  roomId: string;
  imagePackRooms: Room[];
  toolbar: boolean;
  uploadBoard: boolean;
  setUploadBoard: (open: boolean) => void;
  selectedFiles: TUploadItem[];
  uploadFamilyObserverAtom: ReturnType<typeof createUploadFamilyObserverAtom>;
  uploadBoardHandlers: MutableRefObject<UploadBoardImperativeHandlers | undefined>;
  handleFileMetadata: (fileItem: TUploadItem, metadata: TUploadMetadata) => void;
  handleRemoveUpload: (upload: TUploadContent | TUploadContent[]) => void;
  handleCancelUpload: (uploads: Upload[]) => void;
  handleSendUpload: (uploads: UploadSuccess[]) => Promise<void>;
  submit: () => void;
  replyDraft: IReplyDraft | undefined;
  setReplyDraft: (draft: IReplyDraft | undefined) => void;
  autocompleteQuery: AutocompleteQuery<AutocompletePrefix> | undefined;
  handleCloseAutocomplete: () => void;
  handleKeyDown: (evt: React.KeyboardEvent<Element>) => void;
  handleKeyUp: (evt: React.KeyboardEvent<Element>) => void;
  handleEmoticonSelect: (key: string, shortcode: string) => void;
  handleStickerSelect: (mxc: string, shortcode: string, label: string) => Promise<void>;
  pickFile: (accept: string) => void;
  handlePaste: (event: React.ClipboardEvent<HTMLDivElement>) => void;
  dropZoneVisible: boolean;
  hideStickerBtn: boolean;
  replyUsernameColor?: string;
}

const RoomInputContext = createContext<RoomInputContextType | null>(null);

interface RoomInputProviderProps {
  children: React.ReactNode;
  editor: Editor;
  fileDropContainerRef: RefObject<HTMLElement>;
  roomId: string;
  room: Room;
  getPowerLevelTag: GetPowerLevelTag;
  accessibleTagColors: Map<string, string>;
}

export function RoomInputProvider({
  children,
  editor,
  fileDropContainerRef,
  roomId,
  room,
  getPowerLevelTag,
  accessibleTagColors,
}: RoomInputProviderProps) {
  const mx = useMatrixClient();
  const useAuthentication = useMediaAuthentication();
  const [enterForNewline] = useSetting(settingsAtom, 'enterForNewline');
  const [isMarkdown] = useSetting(settingsAtom, 'isMarkdown');
  const [hideActivity] = useSetting(settingsAtom, 'hideActivity');
  const [legacyUsernameColor] = useSetting(settingsAtom, 'legacyUsernameColor');

  const direct = useIsDirectRoom();
  const roomToParents = useAtomValue(roomToParentsAtom);
  const powerLevels = usePowerLevelsContext();

  const fileUploads = useFileUploads(room);
  const sendTypingStatus = useTypingStatusUpdater(mx, roomId);
  const messageSubmit = useMessageSubmit(editor, room, isMarkdown, sendTypingStatus);
  useInputState(editor, roomId);
  const autocomplete = useAutocomplete(editor);
  const editorEvents = useEditorEvents({
    editor,
    submit: messageSubmit.submit,
    setReplyDraft: messageSubmit.setReplyDraft,
    enterForNewline,
    autocompleteQuery: autocomplete.autocompleteQuery,
    setAutocompleteQuery: autocomplete.setAutocompleteQuery,
    handleAutocompleteKeyUp: autocomplete.handleKeyUp,
    hideActivity,
    sendTypingStatus,
    mx,
    useAuthentication,
    roomId,
  });

  const pickFile = useFilePicker(fileUploads.handleFiles, true);
  const handlePaste = useFilePasteHandler(fileUploads.handleFiles);
  const dropZoneVisible = useFileDropZone(fileDropContainerRef, fileUploads.handleFiles);
  const [hideStickerBtn, setHideStickerBtn] = useState(document.body.clientWidth < 500);
  useElementSizeObserver(
    useCallback(() => document.body, []),
    useCallback((width) => setHideStickerBtn(width < 500), [setHideStickerBtn])
  );

  const imagePackRooms: Room[] = useImagePackRooms(roomId, roomToParents);
  const [toolbar] = useSetting(settingsAtom, 'editorToolbar');
  const replyUserID = messageSubmit.replyDraft?.userId;

  const replyPowerTag = getPowerLevelTag(powerLevelAPI.getPowerLevel(powerLevels, replyUserID));
  const replyPowerColor = replyPowerTag.color
    ? accessibleTagColors.get(replyPowerTag.color)
    : undefined;
  const replyUsernameColor =
    legacyUsernameColor || direct ? colorMXID(replyUserID ?? '') : replyPowerColor;

  const value = useMemo(
    () => ({
      editor,
      room,
      roomId,
      imagePackRooms,
      toolbar,
      pickFile,
      handlePaste,
      dropZoneVisible,
      hideStickerBtn,
      replyUsernameColor,
      ...fileUploads,
      ...messageSubmit,
      ...autocomplete,
      ...editorEvents,
    }),
    [
      editor,
      room,
      roomId,
      imagePackRooms,
      toolbar,
      pickFile,
      handlePaste,
      dropZoneVisible,
      hideStickerBtn,
      replyUsernameColor,
      fileUploads,
      messageSubmit,
      autocomplete,
      editorEvents,
    ]
  );

  return <RoomInputContext.Provider value={value}>{children}</RoomInputContext.Provider>;
}

export const useRoomInputContext = (): RoomInputContextType => {
  const context = useContext(RoomInputContext);
  if (!context) {
    throw new Error('useRoomInputContext must be used within a RoomInputProvider');
  }
  return context;
};
