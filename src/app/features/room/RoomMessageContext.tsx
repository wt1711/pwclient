import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { Message } from '~/app/components/ai-assistant/ai';

type RoomMessageContextType = {
  selectedMessage: Message | null;
  setSelectedMessage: (message: Message | null) => void;
};

const RoomMessageContext = createContext<RoomMessageContextType | undefined>(undefined);

type RoomMessageProviderProps = {
  children: ReactNode;
};

export function RoomMessageProvider({ children }: RoomMessageProviderProps) {
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const value: RoomMessageContextType = useMemo(
    () => ({
      selectedMessage,
      setSelectedMessage,
    }),
    [selectedMessage, setSelectedMessage]
  );

  return <RoomMessageContext.Provider value={value}>{children}</RoomMessageContext.Provider>;
}

export function useRoomMessage() {
  const context = useContext(RoomMessageContext);
  if (context === undefined) {
    throw new Error('useRoomMessage must be used within a RoomMessageProvider');
  }
  return context;
}
