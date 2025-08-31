import React, { useRef } from 'react';
import { Box, Icon, IconButton, Icons, PopOut } from 'folds';
import { Editor } from 'slate';
import { ReactEditor } from 'slate-react';
import { Room } from 'matrix-js-sdk';
import { GeneratedResponseBox } from '../../ai-assistant/common/GeneratedResponseBox';
import { useAIAssistant } from '../../ai-assistant/AIAssistantContext';
import { EmojiBoard, EmojiBoardTab } from '../../../components/emoji-board';
import { UseStateProvider } from '../../../components/UseStateProvider';
import { mobileOrTablet } from '../../../utils/user-agent';

interface RoomInputActionsProps {
  editor: Editor;
  submit: () => void;
  imagePackRooms: Room[];
  handleEmoticonSelect: (key: string, shortcode: string) => void;
  handleStickerSelect: (mxc: string, shortcode: string, label: string) => void;
  hideStickerBtn: boolean;
}

export function RoomInputActions({
  editor,
  submit,
  imagePackRooms,
  handleEmoticonSelect,
  handleStickerSelect,
  hideStickerBtn,
}: RoomInputActionsProps) {
  const { isAIAssistantOpen, toggleAIAssistant } = useAIAssistant();
  const aiAssistantBtnRef = useRef<HTMLButtonElement>(null);
  const popoutContentRef = useRef<HTMLDivElement>(null);
  const emojiBtnRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <PopOut
        offset={16}
        alignOffset={-44}
        position="Top"
        align="End"
        anchor={
          !isAIAssistantOpen
            ? undefined
            : aiAssistantBtnRef.current?.getBoundingClientRect() ?? undefined
        }
        content={
          <Box
            ref={popoutContentRef}
            direction="Column"
            style={{
              width: '200px',
              backgroundColor: 'var(--bg-surface)',
              padding: '8px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            <GeneratedResponseBox />
          </Box>
        }
      >
        <IconButton
          ref={aiAssistantBtnRef}
          onClick={() => {
            toggleAIAssistant();
          }}
          variant="SurfaceVariant"
          size="300"
          radii="300"
        >
          <Icon src={Icons.Pencil} />
        </IconButton>
      </PopOut>
      {/* <IconButton
        variant="SurfaceVariant"
        size="300"
        radii="300"
        onClick={() => setToolbar(!toolbar)}
      >
        <Icon src={toolbar ? Icons.AlphabetUnderline : Icons.Alphabet} />
      </IconButton> */}
      <UseStateProvider initial={undefined}>
        {(
          emojiBoardTab: EmojiBoardTab | undefined,
          setEmojiBoardTab: (tab?: EmojiBoardTab) => void
        ) => (
          <PopOut
            offset={16}
            alignOffset={-44}
            position="Top"
            align="End"
            anchor={
              emojiBoardTab === undefined
                ? undefined
                : emojiBtnRef.current?.getBoundingClientRect() ?? undefined
            }
            content={
              <EmojiBoard
                tab={emojiBoardTab}
                onTabChange={setEmojiBoardTab}
                imagePackRooms={imagePackRooms}
                returnFocusOnDeactivate={false}
                onEmojiSelect={handleEmoticonSelect}
                onCustomEmojiSelect={handleEmoticonSelect}
                onStickerSelect={handleStickerSelect}
                requestClose={() => {
                  if (emojiBoardTab && !mobileOrTablet()) {
                    ReactEditor.focus(editor);
                  }
                  setEmojiBoardTab(undefined);
                }}
              />
            }
          >
            {/* {!hideStickerBtn && (
              <IconButton
                aria-pressed={emojiBoardTab === EmojiBoardTab.Sticker}
                onClick={() => setEmojiBoardTab(EmojiBoardTab.Sticker)}
                variant="SurfaceVariant"
                size="300"
                radii="300"
              >
                <Icon
                  src={Icons.Sticker}
                  filled={emojiBoardTab === EmojiBoardTab.Sticker}
                />
              </IconButton>
            )} */}
            <IconButton
              ref={emojiBtnRef}
              aria-pressed={
                hideStickerBtn ? !!emojiBoardTab : emojiBoardTab === EmojiBoardTab.Emoji
              }
              onClick={() => setEmojiBoardTab(EmojiBoardTab.Emoji)}
              variant="SurfaceVariant"
              size="300"
              radii="300"
            >
              <Icon
                src={Icons.Smile}
                filled={hideStickerBtn ? !!emojiBoardTab : emojiBoardTab === EmojiBoardTab.Emoji}
              />
            </IconButton>
          </PopOut>
        )}
      </UseStateProvider>
      <IconButton onClick={submit} variant="SurfaceVariant" size="300" radii="300">
        <Icon src={Icons.Send} />
      </IconButton>
    </>
  );
}
