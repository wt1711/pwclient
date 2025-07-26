import React, { useCallback } from 'react';
import { Box, Line } from 'folds';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { isKeyHotkey } from 'is-hotkey';
import { RoomView } from './RoomView';
import { MembersDrawer } from './MembersDrawer';
import { ScreenSize, useScreenSizeContext } from '../../hooks/useScreenSize';
import { useSetting } from '../../state/hooks/settings';
import { settingsAtom } from '../../state/settings';
import { PowerLevelsContextProvider, usePowerLevels } from '../../hooks/usePowerLevels';
import { useRoom } from '../../hooks/useRoom';
import { useKeyDown } from '../../hooks/useKeyDown';
import { markAsRead } from '../../../client/action/notifications';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { useRoomMembers } from '../../hooks/useRoomMembers';
import { AIAssistant } from '../../components/ai-assistant/AIAssistant';
import { RoomEditorProvider } from './RoomEditorContext';

export function Room() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const mx = useMatrixClient();
  const room = useRoom();
  const { roomId } = room;
  const screenSize = useScreenSizeContext();
  const [isDrawer] = useSetting(settingsAtom, 'isDrawerOpen');
  const [isAiDrawer] = useSetting(settingsAtom, 'isAiDrawerOpen');
  const [hideActivity] = useSetting(settingsAtom, 'hideActivity');
  const powerLevels = usePowerLevels(room);
  const members = useRoomMembers(mx, room.roomId);

  useKeyDown(
    window,
    useCallback(
      (evt) => {
        if (isKeyHotkey('escape', evt)) {
          markAsRead(mx, room.roomId, hideActivity);
        }
        if (isKeyHotkey('mod+shift+o', evt)) {
          evt.preventDefault();
          navigate(`/room/${roomId}/members`);
        }
      },
      [mx, room.roomId, hideActivity, navigate, roomId]
    )
  );

  if (!room) {
    return <Navigate to="/" replace />;
  }

  return (
    <PowerLevelsContextProvider value={powerLevels}>
      <RoomEditorProvider>
        <Box grow="Yes">
          <RoomView room={room} eventId={eventId} />
          {screenSize === ScreenSize.Desktop && isDrawer && (
            <>
              <Line variant="Background" direction="Vertical" size="300" />
              <MembersDrawer key={room.roomId} room={room} members={members} />
            </>
          )}
          {screenSize === ScreenSize.Desktop && isAiDrawer && (
            <>
              <Line variant="Background" direction="Vertical" size="300" />
              <AIAssistant />
            </>
          )}
        </Box>
      </RoomEditorProvider>
    </PowerLevelsContextProvider>
  );
}
