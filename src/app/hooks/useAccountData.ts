import { useState, useCallback } from 'react';
import { useMatrixClient } from './useMatrixClient';
import { useAccountDataCallback } from './useAccountDataCallback';

export function useAccountData(eventType: string) {
  const mx = useMatrixClient();
  const [event, setEvent] = useState(() => {
    // Check if getAccountData method exists and client is initialized
    if (mx && typeof mx.getAccountData === 'function') {
      try {
        return mx.getAccountData(eventType);
      } catch (error) {
        console.warn('Failed to get account data:', error);
        return undefined;
      }
    }
    return undefined;
  });

  useAccountDataCallback(
    mx,
    useCallback(
      (evt) => {
        if (evt.getType() === eventType) {
          setEvent(evt);
        }
      },
      [eventType, setEvent]
    )
  );

  return event;
}
