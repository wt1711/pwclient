import React from 'react';
import { Box, Text, IconButton, Icons, config, Icon } from 'folds';
import { RelationType, Room } from 'matrix-js-sdk';
import { ReplyLayout, ThreadIndicator } from '../../../components/message';
import { getMemberDisplayName, trimReplyFromBody } from '../../../utils/room';
import { IReplyDraft } from '../../../state/room/roomInputDrafts';
import { getMxIdLocalPart } from '../../../utils/matrix';

interface ReplyPreviewProps {
  replyDraft: IReplyDraft | undefined;
  setReplyDraft: (draft: IReplyDraft | undefined) => void;
  replyUsernameColor?: string;
  room: Room;
}

export function ReplyPreview({
  replyDraft,
  setReplyDraft,
  replyUsernameColor,
  room,
}: ReplyPreviewProps) {
  if (!replyDraft) {
    return null;
  }

  return (
    <div>
      <Box
        alignItems="Center"
        gap="300"
        style={{ padding: `${config.space.S200} ${config.space.S300} 0` }}
      >
        <IconButton
          onClick={() => setReplyDraft(undefined)}
          variant="SurfaceVariant"
          size="300"
          radii="300"
        >
          <Icon src={Icons.Cross} size="50" />
        </IconButton>
        <Box direction="Column">
          {replyDraft.relation?.rel_type === RelationType.Thread && <ThreadIndicator />}
          <ReplyLayout
            userColor={replyUsernameColor}
            username={
              <Text size="T300" truncate>
                <b>
                  {getMemberDisplayName(room, replyDraft.userId) ??
                    getMxIdLocalPart(replyDraft.userId) ??
                    replyDraft.userId}
                </b>
              </Text>
            }
          >
            <Text size="T300" truncate>
              {trimReplyFromBody(replyDraft.body)}
            </Text>
          </ReplyLayout>
        </Box>
      </Box>
    </div>
  );
}
