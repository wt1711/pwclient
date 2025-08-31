import { useCallback, useState } from 'react';
import { Editor } from 'slate';
import { ReactEditor } from 'slate-react';
import {
  AUTOCOMPLETE_PREFIXES,
  AutocompletePrefix,
  AutocompleteQuery,
  getAutocompleteQuery,
  getPrevWorldRange,
} from '../../../../components/editor';

export function useAutocomplete(editor: Editor) {
  const [autocompleteQuery, setAutocompleteQuery] =
    useState<AutocompleteQuery<AutocompletePrefix>>();

  const handleKeyUp = (evt: React.KeyboardEvent) => {
    if (evt.key === 'Escape') {
      evt.preventDefault();
      return;
    }

    const prevWordRange = getPrevWorldRange(editor);
    const query = prevWordRange
      ? getAutocompleteQuery<AutocompletePrefix>(editor, prevWordRange, AUTOCOMPLETE_PREFIXES)
      : undefined;
    setAutocompleteQuery(query);
  };

  const handleCloseAutocomplete = useCallback(() => {
    setAutocompleteQuery(undefined);
    ReactEditor.focus(editor);
  }, [editor]);

  return {
    autocompleteQuery,
    setAutocompleteQuery,
    handleKeyUp,
    handleCloseAutocomplete,
  };
}
