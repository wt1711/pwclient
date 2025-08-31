import { useCallback, useRef, useState } from 'react';
import { useAtom } from 'jotai';
import { Room } from 'matrix-js-sdk';
import {
  TUploadContent,
  TUploadItem,
  TUploadMetadata,
  roomIdToUploadItemsAtomFamily,
  roomUploadAtomFamily,
} from '../../../../state/room/roomInputDrafts';
import { fulfilledPromiseSettledResult } from '../../../../utils/common';
import { encryptFile } from '../../../../utils/matrix';
import { safeFile } from '../../../../utils/mimeTypes';
import {
  Upload,
  UploadStatus,
  UploadSuccess,
  createUploadFamilyObserverAtom,
} from '../../../../state/upload';
import { useMatrixClient } from '../../../../hooks/useMatrixClient';
import { UploadBoardImperativeHandlers } from '../../../../components/upload-board';
import {
  getAudioMsgContent,
  getFileMsgContent,
  getImageMsgContent,
  getVideoMsgContent,
} from '../../msgContent';

export function useFileUploads(room: Room) {
  const mx = useMatrixClient();
  const [uploadBoard, setUploadBoard] = useState(true);
  const [selectedFiles, setSelectedFiles] = useAtom(roomIdToUploadItemsAtomFamily(room.roomId));
  const uploadFamilyObserverAtom = createUploadFamilyObserverAtom(
    roomUploadAtomFamily,
    selectedFiles.map((f) => f.file)
  );
  const uploadBoardHandlers = useRef<UploadBoardImperativeHandlers>();

  const handleFiles = useCallback(
    async (files: File[]) => {
      setUploadBoard(true);
      const safeFiles = files.map(safeFile);
      const fileItems: TUploadItem[] = [];

      if (room.hasEncryptionStateEvent()) {
        const encryptFiles = fulfilledPromiseSettledResult(
          await Promise.allSettled(safeFiles.map((f) => encryptFile(f)))
        );
        encryptFiles.forEach((ef) =>
          fileItems.push({
            ...ef,
            metadata: {
              markedAsSpoiler: false,
            },
          })
        );
      } else {
        safeFiles.forEach((f) =>
          fileItems.push({
            file: f,
            originalFile: f,
            encInfo: undefined,
            metadata: {
              markedAsSpoiler: false,
            },
          })
        );
      }
      setSelectedFiles({
        type: 'PUT',
        item: fileItems,
      });
    },
    [setSelectedFiles, room]
  );

  const handleFileMetadata = useCallback(
    (fileItem: TUploadItem, metadata: TUploadMetadata) => {
      setSelectedFiles({
        type: 'REPLACE',
        item: fileItem,
        replacement: { ...fileItem, metadata },
      });
    },
    [setSelectedFiles]
  );

  const handleRemoveUpload = useCallback(
    (upload: TUploadContent | TUploadContent[]) => {
      const uploads = Array.isArray(upload) ? upload : [upload];
      setSelectedFiles({
        type: 'DELETE',
        item: selectedFiles.filter((f) => uploads.find((u) => u === f.file)),
      });
      uploads.forEach((u) => roomUploadAtomFamily.remove(u));
    },
    [setSelectedFiles, selectedFiles]
  );

  const handleCancelUpload = (uploads: Upload[]) => {
    uploads.forEach((upload) => {
      if (upload.status === UploadStatus.Loading) {
        mx.cancelUpload(upload.promise);
      }
    });
    handleRemoveUpload(uploads.map((upload) => upload.file));
  };

  const handleSendUpload = async (uploads: UploadSuccess[]) => {
    const contentsPromises = uploads.map(async (upload) => {
      const fileItem = selectedFiles.find((f) => f.file === upload.file);
      if (!fileItem) throw new Error('Broken upload');

      if (fileItem.file.type.startsWith('image')) {
        return getImageMsgContent(mx, fileItem, upload.mxc);
      }
      if (fileItem.file.type.startsWith('video')) {
        return getVideoMsgContent(mx, fileItem, upload.mxc);
      }
      if (fileItem.file.type.startsWith('audio')) {
        return getAudioMsgContent(fileItem, upload.mxc);
      }
      return getFileMsgContent(fileItem, upload.mxc);
    });
    handleCancelUpload(uploads);
    const contents = fulfilledPromiseSettledResult(await Promise.allSettled(contentsPromises));
    contents.forEach((content) => mx.sendMessage(room.roomId, content));
  };

  return {
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
  };
}
