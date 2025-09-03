import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Room } from 'matrix-js-sdk';
import { MessageLayout, MessageSpacing, settingsAtom } from '../../../state/settings';
import { useSetting } from '../../../state/hooks/settings';
import { getRoomUnreadInfo } from './hooks/getEventAndTimeline';
import { useRoomUnread } from '../../../state/hooks/unread';
import { roomToUnreadAtom } from '../../../state/room/roomToUnread';
import { usePowerLevelsAPI, usePowerLevelsContext } from '../../../hooks/usePowerLevels';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { MessageEvent, StateEvent } from '../../../../types/matrix/room';

interface RoomTimelineContextType {
  room: Room;
  hideActivity: boolean;
  messageLayout: MessageLayout;
  messageSpacing: MessageSpacing;
  legacyUsernameColor: boolean;
  hideMembershipEvents: boolean;
  hideNickAvatarEvents: boolean;
  mediaAutoLoad: boolean;
  urlPreview: boolean;
  encUrlPreview: boolean;
  showHiddenEvents: boolean;
  showDeveloperTools: boolean;
  editId?: string;
  setEditId: (id?: string) => void;
  unreadInfo?: any;
  setUnreadInfo: React.Dispatch<React.SetStateAction<any | undefined>>;
  getPowerLevel: (userId?: string | undefined, atRoomState?: boolean | undefined) => number;
  canRedact: boolean;
  canSendReaction: boolean;
  canPinEvent: boolean;
}

const RoomTimelineContext = createContext<RoomTimelineContextType | null>(null);

interface RoomTimelineProviderProps {
  children: React.ReactNode;
  room: Room;
}

export function RoomTimelineProvider({ children, room }: RoomTimelineProviderProps) {
  const [hideActivity] = useSetting(settingsAtom, 'hideActivity');
  const [messageLayout] = useSetting(settingsAtom, 'messageLayout');
  const [messageSpacing] = useSetting(settingsAtom, 'messageSpacing');
  const [legacyUsernameColor] = useSetting(settingsAtom, 'legacyUsernameColor');
  const [hideMembershipEvents] = useSetting(settingsAtom, 'hideMembershipEvents');
  const [hideNickAvatarEvents] = useSetting(settingsAtom, 'hideNickAvatarEvents');
  const [mediaAutoLoad] = useSetting(settingsAtom, 'mediaAutoLoad');
  const [urlPreview] = useSetting(settingsAtom, 'urlPreview');
  const [encUrlPreview] = useSetting(settingsAtom, 'encUrlPreview');
  const [showHiddenEvents] = useSetting(settingsAtom, 'showHiddenEvents');
  const [showDeveloperTools] = useSetting(settingsAtom, 'developerTools');
  const [editId, setEditId] = useState<string>();
  const [unreadInfo, setUnreadInfo] = useState(() => getRoomUnreadInfo(room, true));

  const mx = useMatrixClient();
  const powerLevels = usePowerLevelsContext();
  const { canDoAction, canSendEvent, canSendStateEvent, getPowerLevel } =
    usePowerLevelsAPI(powerLevels);
  const myPowerLevel = getPowerLevel(mx.getUserId() ?? '');
  const canRedact = canDoAction('redact', myPowerLevel);
  const canSendReaction = canSendEvent(MessageEvent.Reaction, myPowerLevel);
  const canPinEvent = canSendStateEvent(StateEvent.RoomPinnedEvents, myPowerLevel);

  const unread = useRoomUnread(room.roomId, roomToUnreadAtom);
  useEffect(() => {
    if (!unread) {
      setUnreadInfo(undefined);
    }
  }, [unread]);

  const value = useMemo(
    () => ({
      room,
      hideActivity,
      messageLayout,
      messageSpacing,
      legacyUsernameColor,
      hideMembershipEvents,
      hideNickAvatarEvents,
      mediaAutoLoad,
      urlPreview,
      encUrlPreview,
      showHiddenEvents,
      showDeveloperTools,
      editId,
      setEditId,
      unreadInfo,
      setUnreadInfo,
      getPowerLevel,
      canRedact,
      canSendReaction,
      canPinEvent,
    }),
    [
      room,
      hideActivity,
      messageLayout,
      messageSpacing,
      legacyUsernameColor,
      hideMembershipEvents,
      hideNickAvatarEvents,
      mediaAutoLoad,
      urlPreview,
      encUrlPreview,
      showHiddenEvents,
      showDeveloperTools,
      editId,
      unreadInfo,
      getPowerLevel,
      canRedact,
      canSendReaction,
      canPinEvent,
    ]
  );

  return <RoomTimelineContext.Provider value={value}>{children}</RoomTimelineContext.Provider>;
}

export const useRoomTimelineContext = (): RoomTimelineContextType => {
  const context = useContext(RoomTimelineContext);
  if (!context) {
    throw new Error('useRoomTimelineContext must be used within a RoomTimelineProvider');
  }
  return context;
};
