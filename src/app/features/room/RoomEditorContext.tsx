import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';
import { Editor, Transforms } from 'slate';
import { useEditor } from '../../components/editor';

type RoomEditorContextType = {
  editor: Editor;
  insertText: (text: string) => void;
  deleteText: () => void;
};

const RoomEditorContext = createContext<RoomEditorContextType | undefined>(undefined);

type RoomEditorProviderProps = {
  children: ReactNode;
};

export function RoomEditorProvider({ children }: RoomEditorProviderProps) {
  const editor = useEditor();

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

  const deleteText = useCallback(() => {
    if (editor) {
      try {
        Transforms.select(editor, {
          anchor: Editor.start(editor, []),
          focus: Editor.end(editor, []),
        });
        Transforms.delete(editor);
      } catch (error) {
        throw new Error('Error deleting text from room editor:');
      }
    } else {
      throw new Error('Editor not available');
    }
  }, [editor]);

  const value: RoomEditorContextType = useMemo(
    () => ({
      editor,
      insertText,
      deleteText,
    }),
    [editor, insertText, deleteText]
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
