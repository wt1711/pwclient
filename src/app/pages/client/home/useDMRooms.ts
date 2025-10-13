import { useAtomValue } from 'jotai';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { mDirectAtom } from '../../../state/mDirectList';
import { roomToParentsAtom } from '../../../state/room/roomToParents';
import { allRoomsAtom } from '../../../state/room-list/roomList';
import { useDirectMessageRooms } from '../../../state/hooks/roomList';

export const useDMRooms = () => {
  const mx = useMatrixClient();
  const mDirects = useAtomValue(mDirectAtom);
  const roomToParents = useAtomValue(roomToParentsAtom);
  const rooms = useDirectMessageRooms(mx, allRoomsAtom, mDirects, roomToParents);
  console.log('rooms', rooms);
  return rooms;
};
