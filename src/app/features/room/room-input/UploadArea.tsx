import React, { MutableRefObject } from 'react';
import {
  Box,
  Dialog,
  Icon,
  Icons,
  Overlay,
  OverlayBackdrop,
  OverlayCenter,
  Scroll,
  Text,
  toRem,
} from 'folds';
import { Room } from 'matrix-js-sdk';
import {
  UploadBoard,
  UploadBoardContent,
  UploadBoardHeader,
  UploadBoardImperativeHandlers,
} from '../../../components/upload-board';
import { UploadCardRenderer } from '../../../components/upload-card';
import { TUploadContent, TUploadItem, TUploadMetadata } from '../../../state/room/roomInputDrafts';
import { Upload, UploadSuccess } from '../../../state/upload';

interface UploadAreaProps {
  room?: Room;
  selectedFiles: TUploadItem[];
  uploadBoard: boolean;
  setUploadBoard: (open: boolean) => void;
  uploadFamilyObserverAtom: any;
  handleSendUpload: (uploads: UploadSuccess[]) => Promise<void>;
  uploadBoardHandlers: MutableRefObject<UploadBoardImperativeHandlers | undefined>;
  handleCancelUpload: (uploads: Upload[]) => void;
  handleFileMetadata: (fileItem: TUploadItem, metadata: TUploadMetadata) => void;
  handleRemoveUpload: (upload: TUploadContent | TUploadContent[]) => void;
  dropZoneVisible: boolean;
}

export function UploadArea({
  room,
  selectedFiles,
  uploadBoard,
  setUploadBoard,
  uploadFamilyObserverAtom,
  handleSendUpload,
  uploadBoardHandlers,
  handleCancelUpload,
  handleFileMetadata,
  handleRemoveUpload,
  dropZoneVisible,
}: UploadAreaProps) {
  if (selectedFiles.length === 0) {
    return (
      <Overlay
        open={dropZoneVisible}
        backdrop={<OverlayBackdrop />}
        style={{ pointerEvents: 'none' }}
      >
        <OverlayCenter>
          <Dialog variant="Primary">
            <Box
              direction="Column"
              justifyContent="Center"
              alignItems="Center"
              gap="500"
              style={{ padding: toRem(60) }}
            >
              <Icon size="600" src={Icons.File} />
              <Text size="H4" align="Center">
                {`Drop Files in "${room?.name || 'Room'}"`}
              </Text>
              <Text align="Center">Drag and drop files here or click for selection dialog</Text>
            </Box>
          </Dialog>
        </OverlayCenter>
      </Overlay>
    );
  }

  return (
    <UploadBoard
      header={
        <UploadBoardHeader
          open={uploadBoard}
          onToggle={() => setUploadBoard(!uploadBoard)}
          uploadFamilyObserverAtom={uploadFamilyObserverAtom}
          onSend={handleSendUpload}
          imperativeHandlerRef={
            uploadBoardHandlers as MutableRefObject<UploadBoardImperativeHandlers | undefined>
          }
          onCancel={handleCancelUpload}
        />
      }
    >
      {uploadBoard && (
        <Scroll size="300" hideTrack visibility="Hover">
          <UploadBoardContent>
            {Array.from(selectedFiles)
              .reverse()
              .map((fileItem, index) => (
                <UploadCardRenderer
                  // eslint-disable-next-line react/no-array-index-key
                  key={index}
                  isEncrypted={!!fileItem.encInfo}
                  fileItem={fileItem}
                  setMetadata={handleFileMetadata}
                  onRemove={handleRemoveUpload}
                />
              ))}
          </UploadBoardContent>
        </Scroll>
      )}
    </UploadBoard>
  );
}
