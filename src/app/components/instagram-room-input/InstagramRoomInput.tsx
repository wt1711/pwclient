import React, { RefObject, forwardRef, useCallback, useState } from 'react';
import { Descendant, Editor, Node, createEditor } from 'slate';
import { withReact } from 'slate-react';
import { withHistory } from 'slate-history';
import { Box, Icon, IconButton, Icons, Line, Spinner } from 'folds';

import { CustomEditor, Toolbar } from '../../components/editor';
import { BlockType, MarkType } from '../../components/editor/types';
import { resetEditor } from '../../components/editor/utils';
import { toPlainText } from '../../components/editor/output';

interface InstagramRoomInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  fileDropContainerRef?: RefObject<HTMLElement>;
}

const initialValue: Descendant[] = [
  {
    type: BlockType.Paragraph,
    children: [{ text: '' }],
  },
];

export const InstagramRoomInput = forwardRef<HTMLDivElement, InstagramRoomInputProps>(
  ({ onSendMessage, disabled = false, placeholder = 'Send a message...', fileDropContainerRef }, ref) => {
    const [editor] = useState(() => withHistory(withReact(createEditor())));
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = useCallback(async () => {
       if (disabled || isLoading) return;
       
       const text = toPlainText(editor.children, false).trim();
       if (!text) return;

       setIsLoading(true);
       try {
         await onSendMessage(text);
         // Reset editor after successful send
         resetEditor(editor);
       } catch (error) {
         console.error('Failed to send message:', error);
       } finally {
         setIsLoading(false);
       }
     }, [editor, onSendMessage, disabled, isLoading]);

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          handleSend();
        }
      },
      [handleSend]
    );

    return (
      <div ref={ref} style={{ position: 'relative' }}>
        <Box direction="Column" gap="200">
          <Line variant="Surface" size="300" />
          <Box alignItems="End" gap="200">
            <Box grow="Yes">
              <CustomEditor
                 editableName="InstagramRoomInput"
                 editor={editor}
                 placeholder={placeholder}
                 onKeyDown={handleKeyDown}
               />
            </Box>
            <IconButton
              onClick={handleSend}
              disabled={disabled || isLoading}
              variant="Primary"
              size="300"
              radii="300"
            >
              {isLoading ? (
                <Spinner size="300" />
              ) : (
                <Icon src={Icons.Send} size="300" />
              )}
            </IconButton>
          </Box>
        </Box>
      </div>
    );
  }
);