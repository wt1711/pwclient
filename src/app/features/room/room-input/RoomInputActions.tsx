import React, { useRef } from 'react';
import { Box, Icon, IconButton, Icons, PopOut } from 'folds';
import { ReactEditor } from 'slate-react';
import { EmojiBoard, EmojiBoardTab } from '~/app/components/emoji-board';
import { UseStateProvider } from '~/app/components/UseStateProvider';
import { mobileOrTablet } from '~/app/utils/user-agent';
import { useRoomInputContext } from './RoomInputContext';
import { GenerateResponseButton } from '~/app/features/ai-assistant/gen-response/GenerateResponseButton';
import { useAIAssistant } from '~/app/features/ai-assistant/AIAssistantContext';

export function RoomInputActions() {
  const {
    submit,
    editor,
    imagePackRooms,
    handleEmoticonSelect,
    handleStickerSelect,
    hideStickerBtn,
  } = useRoomInputContext();
  const { isAIAssistantOpen, toggleAIAssistant, generateInitialResponse } = useAIAssistant();
  const emojiBtnRef = useRef<HTMLButtonElement>(null);
  const aiAssistantBtnRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <Box direction="Row" alignItems="Center" gap="100">
        <GenerateResponseButton />
      </Box>
      <IconButton
        ref={aiAssistantBtnRef}
        onClick={() => {
          if (isAIAssistantOpen) {
            toggleAIAssistant(false);
          } else {
            generateInitialResponse();
          }
        }}
        variant="SurfaceVariant"
        size="300"
        radii="300"
      >
        <Icon src={Icons.Setting} />
      </IconButton>
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
                    setTimeout(() => ReactEditor.focus(editor), 0);
                  }
                  setEmojiBoardTab(undefined);
                }}
              />
            }
          >
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
