import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';
import { Editor, Transforms } from 'slate';

type RoomEditorContextType = {
  editor: Editor | null;
  setEditor: (editor: Editor | null) => void;
  insertText: (text: string) => void;
};

const RoomEditorContext = createContext<RoomEditorContextType | undefined>(undefined);

type RoomEditorProviderProps = {
  children: ReactNode;
};

export function RoomEditorProvider({ children }: RoomEditorProviderProps) {
  const [editor, setEditor] = useState<Editor | null>(null);

  const insertText = useCallback(
    (text: string) => {
      if (editor && text) {
        try {
          Transforms.insertText(editor, text);
        } catch (error) {
          throw new Error('Error inserting text into room editor:');
        }
      } else {
        throw new Error('Editor not available or no text to insert');
      }
    },
    [editor]
  );

  const value: RoomEditorContextType = useMemo(
    () => ({
      editor,
      setEditor,
      insertText,
    }),
    [editor, setEditor, insertText]
  );

  return <RoomEditorContext.Provider value={value}>{children}</RoomEditorContext.Provider>;
}

export function useRoomEditor() {
  const context = useContext(RoomEditorContext);
  if (context === undefined) {
    throw new Error('useRoomEditor must be used within a RoomEditorProvider');
  }
  return context;
}
