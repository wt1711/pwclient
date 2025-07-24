import { useCallback, useEffect, useMemo } from 'react';
import { MatrixError, Room } from 'matrix-js-sdk';
import { RoomCanonicalAliasEventContent } from 'matrix-js-sdk/lib/types';
import { AsyncState, useAsyncCallback } from './useAsyncCallback';
import { useMatrixClient } from './useMatrixClient';
import { useAlive } from './useAlive';
import { useStateEvent } from './useStateEvent';
import { StateEvent } from '../../types/matrix/room';
import { getStateEvent } from '../utils/room';

export const usePublishedAliases = (room: Room): [string | undefined, string[]] => {
  const aliasContent = useStateEvent(
    room,
    StateEvent.RoomCanonicalAlias
  )?.getContent<RoomCanonicalAliasEventContent>();

  const canonicalAlias = aliasContent?.alias;

  const publishedAliases = useMemo(() => {
    const aliases: string[] = [];
    if (typeof aliasContent?.alias === 'string') {
      aliases.push(aliasContent.alias);
    }
    aliasContent?.alt_aliases?.forEach((alias) => {
      if (typeof alias === 'string') {
        aliases.push(alias);
      }
    });
    return aliases;
  }, [aliasContent]);

  return [canonicalAlias, publishedAliases];
};

export const useSetMainAlias = (room: Room): ((alias: string | undefined) => Promise<void>) => {
  const mx = useMatrixClient();
  const mainAlias = useCallback(
    async (alias: string | undefined) => {
      const content = getStateEvent(
        room,
        StateEvent.RoomCanonicalAlias
      )?.getContent<RoomCanonicalAliasEventContent>();

      const altAliases: string[] = [];
      if (content?.alias && content.alias !== alias) {
        altAliases.push(content.alias);
      }
      content?.alt_aliases?.forEach((a) => {
        if (a !== alias) {
          altAliases.push(a);
        }
      });

      const newContent: RoomCanonicalAliasEventContent = {
        alias,
        alt_aliases: altAliases,
      };

      await mx.sendStateEvent(room.roomId, StateEvent.RoomCanonicalAlias as any, newContent);
    },
    [mx, room]
  );

  return mainAlias;
};

export const usePublishUnpublishAliases = (
  room: Room
): {
  publishAliases: (aliases: string[]) => Promise<void>;
  unpublishAliases: (aliases: string[]) => Promise<void>;
} => {
  const mx = useMatrixClient();
  const publishAliases = useCallback(
    async (aliases: string[]) => {
      const content = getStateEvent(
        room,
        StateEvent.RoomCanonicalAlias
      )?.getContent<RoomCanonicalAliasEventContent>();
      const altAliases = content?.alt_aliases ?? [];

      aliases.forEach((alias) => {
        if (!altAliases.includes(alias)) {
          altAliases.push(alias);
        }
      });

      const newContent: RoomCanonicalAliasEventContent = {
        alias: content?.alias,
        alt_aliases: altAliases,
      };

      await mx.sendStateEvent(room.roomId, StateEvent.RoomCanonicalAlias as any, newContent);
    },
    [mx, room]
  );

  const unpublishAliases = useCallback(
    async (aliases: string[]) => {
      const content = getStateEvent(
        room,
        StateEvent.RoomCanonicalAlias
      )?.getContent<RoomCanonicalAliasEventContent>();
      const altAliases: string[] = [];

      content?.alt_aliases?.forEach((alias) => {
        if (!aliases.includes(alias)) {
          altAliases.push(alias);
        }
      });

      const newContent: RoomCanonicalAliasEventContent = {
        alias: content?.alias,
        alt_aliases: altAliases,
      };

      await mx.sendStateEvent(room.roomId, StateEvent.RoomCanonicalAlias as any, newContent);
    },
    [mx, room]
  );

  return {
    publishAliases,
    unpublishAliases,
  };
};

export const useLocalAliases = (
  roomId: string
): {
  localAliasesState: AsyncState<string[], MatrixError>;
  addLocalAlias: (alias: string) => Promise<void>;
  removeLocalAlias: (alias: string) => Promise<void>;
} => {
  const mx = useMatrixClient();
  const alive = useAlive();

  const [aliasesState, loadAliases] = useAsyncCallback<string[], MatrixError, []>(
    useCallback(async () => {
      const content = await mx.getLocalAliases(roomId);
      return content.aliases;
    }, [mx, roomId])
  );

  useEffect(() => {
    loadAliases();
  }, [loadAliases]);

  const addLocalAlias = useCallback(
    async (alias: string) => {
      await mx.createAlias(alias, roomId);
      if (alive()) await loadAliases();
    },
    [mx, roomId, loadAliases, alive]
  );

  const removeLocalAlias = useCallback(
    async (alias: string) => {
      await mx.deleteAlias(alias);
      if (alive()) await loadAliases();
    },
    [mx, loadAliases, alive]
  );

  return {
    localAliasesState: aliasesState,
    addLocalAlias,
    removeLocalAlias,
  };
};
