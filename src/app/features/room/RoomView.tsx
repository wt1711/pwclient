import React, { useCallback, useRef } from 'react';
import { Box, Text, config } from 'folds';
import { EventType, Room } from 'matrix-js-sdk';
import { ReactEditor } from 'slate-react';
import { isKeyHotkey } from 'is-hotkey';
import { useStateEvent } from '../../hooks/useStateEvent';
import { StateEvent } from '../../../types/matrix/room';
import { usePowerLevelsAPI, usePowerLevelsContext } from '../../hooks/usePowerLevels';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { useRoomEditor } from './RoomEditorContext';
import { RoomInputPlaceholder } from './room-input/room-input-placeholder/RoomInputPlaceholder';
import { RoomTimeline } from './room-timeline/RoomTimeline';
import { RoomViewTyping } from './room-view-typing/RoomViewTyping';
import { RoomTombstone } from './room-tombstone/RoomTombstone';
import { RoomInput } from './room-input/RoomInput';
// import { RoomViewFollowing, RoomViewFollowingPlaceholder } from './room-view-following/RoomViewFollowing';
import { Page } from '../../components/page';
import { RoomViewHeader } from './room-view-header/RoomViewHeader';
import { useKeyDown } from '../../hooks/useKeyDown';
import { editableActiveElement } from '../../utils/dom';
import navigation from '../../../client/state/navigation';
// import { settingsAtom } from '../../state/settings';
// import { useSetting } from '../../state/hooks/settings';
import { useAccessibleTagColors, usePowerLevelTags } from '../../hooks/usePowerLevelTags';
import { useTheme } from '../../hooks/useTheme';
import { AIAssistantProvider } from '../ai-assistant/AIAssistantContext';

const FN_KEYS_REGEX = /^F\d+$/;
const shouldFocusMessageField = (evt: KeyboardEvent): boolean => {
  const { code } = evt;
  if (evt.metaKey || evt.altKey || evt.ctrlKey) {
    return false;
  }

  // do not focus on F keys
  if (FN_KEYS_REGEX.test(code)) return false;

  // do not focus on numlock/scroll lock
  if (
    code.startsWith('OS') ||
    code.startsWith('Meta') ||
    code.startsWith('Shift') ||
    code.startsWith('Alt') ||
    code.startsWith('Control') ||
    code.startsWith('Arrow') ||
    code.startsWith('Page') ||
    code.startsWith('End') ||
    code.startsWith('Home') ||
    code === 'Tab' ||
    code === 'Space' ||
    code === 'Enter' ||
    code === 'NumLock' ||
    code === 'ScrollLock'
  ) {
    return false;
  }

  return true;
};

export function RoomView({
  room,
  eventId,
  messageOnly,
}: {
  room: Room;
  eventId?: string;
  messageOnly?: boolean;
}) {
  const roomInputRef = useRef<HTMLDivElement>(null);
  const roomViewRef = useRef<HTMLDivElement>(null);

  // const [hideActivity] = useSetting(settingsAtom, 'hideActivity');

  const { roomId } = room;
  const { editor } = useRoomEditor();

  const mx = useMatrixClient();

  const tombstoneEvent = useStateEvent(room, StateEvent.RoomTombstone);
  const powerLevels = usePowerLevelsContext();
  const { getPowerLevel, canSendEvent } = usePowerLevelsAPI(powerLevels);
  const myUserId = mx.getUserId();
  const canMessage = myUserId
    ? canSendEvent(EventType.RoomMessage, getPowerLevel(myUserId))
    : false;

  const [powerLevelTags, getPowerLevelTag] = usePowerLevelTags(room, powerLevels);
  const theme = useTheme();
  const accessibleTagColors = useAccessibleTagColors(theme.kind, powerLevelTags);

  useKeyDown(
    window,
    useCallback(
      (evt) => {
        if (editableActiveElement()) return;
        if (
          document.body.lastElementChild?.className !== 'ReactModalPortal' ||
          navigation.isRawModalVisible
        ) {
          return;
        }
        if (shouldFocusMessageField(evt) || isKeyHotkey('mod+v', evt)) {
          ReactEditor.focus(editor);
        }
      },
      [editor]
    )
  );

  return (
    <Page ref={roomViewRef}>
      <RoomViewHeader />
      <Box grow="Yes" direction="Column">
        <RoomTimeline
          key={roomId}
          room={room}
          eventId={eventId}
          roomInputRef={roomInputRef}
          editor={editor}
          getPowerLevelTag={getPowerLevelTag}
          accessibleTagColors={accessibleTagColors}
          messageOnly={messageOnly}
        />
        <RoomViewTyping room={room} />
      </Box>
      <Box shrink="No" direction="Column">
        <div style={{ padding: `0 ${config.space.S400}` }}>
          {tombstoneEvent ? (
            <RoomTombstone
              roomId={roomId}
              body={tombstoneEvent.getContent().body}
              replacementRoomId={tombstoneEvent.getContent().replacement_room}
            />
          ) : (
            <>
              {canMessage && (
                <AIAssistantProvider isMobile={false}>
                  <RoomInput
                    room={room}
                    editor={editor}
                    roomId={roomId}
                    fileDropContainerRef={roomViewRef}
                    ref={roomInputRef}
                    getPowerLevelTag={getPowerLevelTag}
                    accessibleTagColors={accessibleTagColors}
                  />
                </AIAssistantProvider>
              )}
              {!canMessage && (
                <RoomInputPlaceholder
                  style={{ padding: config.space.S200 }}
                  alignItems="Center"
                  justifyContent="Center"
                >
                  <Text align="Center">You do not have permission to post in this room</Text>
                </RoomInputPlaceholder>
              )}
            </>
          )}
        </div>
        {/* {hideActivity ? <RoomViewFollowingPlaceholder /> : <RoomViewFollowing room={room} />} */}
      </Box>
    </Page>
  );
}
