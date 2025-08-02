import React, { useCallback } from 'react';
import { Box, IconButton, Line } from 'folds';
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
import { AIAssistant } from '../ai-assistant/desktop-ui/AIAssistant';
import { AIAssistantModal } from '../ai-assistant/mobile-modal/AIAssistantModal';
import { RoomEditorProvider } from './RoomEditorContext';
import { RoomMessageProvider } from './RoomMessageContext';
import wingmanPFP from '../ai-assistant/wingman.png';

export function Room() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const mx = useMatrixClient();
  const room = useRoom();
  const { roomId } = room;
  const screenSize = useScreenSizeContext();
  const [isDrawer] = useSetting(settingsAtom, 'isPeopleDrawer');
  const [isAiDrawer, setIsAiDrawer] = useSetting(settingsAtom, 'isAiDrawerOpen');
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

  const isDesktop = screenSize === ScreenSize.Desktop;

  return (
    <PowerLevelsContextProvider value={powerLevels}>
      <RoomEditorProvider>
        <RoomMessageProvider>
          <Box grow="Yes">
            <RoomView room={room} eventId={eventId} />
            {isDesktop && isDrawer && (
              <>
                <Line variant="Background" direction="Vertical" size="300" />
                <MembersDrawer key={room.roomId} room={room} members={members} />
              </>
            )}
            {!isDesktop && isAiDrawer && <AIAssistantModal />}
            {isDesktop && isAiDrawer && (
              <>
                <Line variant="Background" direction="Vertical" size="300" />
                <AIAssistant />
              </>
            )}
            {!isDesktop && (
              <IconButton
                variant="Primary"
                style={{
                  position: 'fixed',
                  bottom: '80px',
                  left: '10px',
                  zIndex: 100,
                  borderRadius: '100%',
                  padding: '5px',
                  cursor: 'pointer',
                }}
                onClick={() => setIsAiDrawer(true)}
              >
                <img
                  src={wingmanPFP}
                  alt="Wingman"
                  style={{ width: '50px', height: '50px', borderRadius: '100%' }}
                />
              </IconButton>
            )}
          </Box>
        </RoomMessageProvider>
      </RoomEditorProvider>
    </PowerLevelsContextProvider>
  );
}
