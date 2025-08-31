import React from 'react';
import {
  EmoticonAutocomplete,
  RoomMentionAutocomplete,
  UserMentionAutocomplete,
} from '../../../components/editor/autocomplete';
import { CommandAutocomplete } from '../CommandAutocomplete';
import { AutocompletePrefix } from '../../../components/editor';
import { useRoomInputContext } from './RoomInputContext';

export function AutocompleteHandler() {
  const { autocompleteQuery, handleCloseAutocomplete, editor, room, roomId, imagePackRooms } =
    useRoomInputContext();

  if (!autocompleteQuery) {
    return null;
  }

  switch (autocompleteQuery.prefix) {
    case AutocompletePrefix.RoomMention:
      return (
        <RoomMentionAutocomplete
          roomId={roomId}
          editor={editor}
          query={autocompleteQuery}
          requestClose={handleCloseAutocomplete}
        />
      );
    case AutocompletePrefix.UserMention:
      return (
        <UserMentionAutocomplete
          room={room}
          editor={editor}
          query={autocompleteQuery}
          requestClose={handleCloseAutocomplete}
        />
      );
    case AutocompletePrefix.Emoticon:
      return (
        <EmoticonAutocomplete
          imagePackRooms={imagePackRooms}
          editor={editor}
          query={autocompleteQuery}
          requestClose={handleCloseAutocomplete}
        />
      );
    case AutocompletePrefix.Command:
      return (
        <CommandAutocomplete
          room={room}
          editor={editor}
          query={autocompleteQuery}
          requestClose={handleCloseAutocomplete}
        />
      );
    default:
      return null;
  }
}
