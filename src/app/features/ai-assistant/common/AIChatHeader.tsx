import React from 'react';
import { Avatar, Box, Header, Icon, IconButton, Icons, Text } from 'folds';
import { JoinRule } from 'matrix-js-sdk';
import { useAtomValue } from 'jotai';

import { useSetSetting } from '../../../state/hooks/settings';
import { settingsAtom } from '../../../state/settings';
import { useAIAssistant } from '../AIAssistantContext';

import { RoomAvatar, RoomIcon } from '../../../components/room-avatar';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { useMediaAuthentication } from '../../../hooks/useMediaAuthentication';
import { useRoom } from '../../../hooks/useRoom';
import { useRoomAvatar, useRoomName } from '../../../hooks/useRoomMeta';
import { mDirectAtom } from '../../../state/mDirectList';
import { mxcUrlToHttp } from '../../../utils/matrix';

export function AIChatHeader() {
  const setAiDrawer = useSetSetting(settingsAtom, 'isAiDrawerOpen');
  const isMobile = useAIAssistant();

  const room = useRoom();
  const mDirects = useAtomValue(mDirectAtom);
  const avatarMxc = useRoomAvatar(room, mDirects.has(room.roomId));
  const mx = useMatrixClient();
  const useAuthentication = useMediaAuthentication();
  const name = useRoomName(room);
  const avatarUrl = avatarMxc
    ? mxcUrlToHttp(mx, avatarMxc, useAuthentication, 40, 40, 'crop') ?? undefined
    : undefined;

  return (
    <Header variant="Surface" size="600" style={{ borderRadius: isMobile ? '12px' : '0px' }}>
      <Box grow="Yes" alignItems="Center" gap="200">
        <Box alignItems="Center">
          <Avatar size="300" style={{ marginLeft: '10px' }}>
            <RoomAvatar
              roomId={room.roomId}
              src={avatarUrl}
              alt={name}
              renderFallback={() => (
                <RoomIcon size="300" joinRule={room.getJoinRule() ?? JoinRule.Restricted} filled />
              )}
            />
          </Avatar>
        </Box>
        <Text size="H5">{name}</Text>
      </Box>
      <IconButton size="300" onClick={() => setAiDrawer(false)} radii="300">
        <Icon src={Icons.Cross} />
      </IconButton>
    </Header>
  );
}
