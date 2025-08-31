import React from 'react';
import { Editor } from 'slate';
import { Room } from 'matrix-js-sdk';
import {
  AutocompletePrefix,
  AutocompleteQuery,
  RoomMentionAutocomplete,
  UserMentionAutocomplete,
  EmoticonAutocomplete,
} from '../../../components/editor';
import { CommandAutocomplete } from '../CommandAutocomplete';

interface AutocompleteHandlerProps {
  autocompleteQuery: AutocompleteQuery<AutocompletePrefix> | undefined;
  handleCloseAutocomplete: () => void;
  editor: Editor;
  room: Room;
  roomId: string;
  imagePackRooms: Room[];
}

export function AutocompleteHandler({
  autocompleteQuery,
  handleCloseAutocomplete,
  editor,
  room,
  roomId,
  imagePackRooms,
}: AutocompleteHandlerProps) {
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
