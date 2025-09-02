import React, { createContext, useContext, useMemo } from 'react';
import { Room } from 'matrix-js-sdk';

interface RoomTimelineContextType {
  room: Room;
}

const RoomTimelineContext = createContext<RoomTimelineContextType | null>(null);

interface RoomTimelineProviderProps {
  children: React.ReactNode;
  room: Room;
}

export function RoomTimelineProvider({ children, room }: RoomTimelineProviderProps) {
  const value = useMemo(
    () => ({
      room,
    }),
    [room]
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
