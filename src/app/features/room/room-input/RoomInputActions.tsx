import React, { useRef } from 'react';
import { Box, Icon, IconButton, Icons, Spinner, PopOut } from 'folds';
import { ReactEditor } from 'slate-react';
import { EmojiBoard, EmojiBoardTab } from '~/app/components/emoji-board';
import { UseStateProvider } from '~/app/components/UseStateProvider';
import { mobileOrTablet } from '~/app/utils/user-agent';
import { useAIAssistant } from '~/app/features/ai-assistant/AIAssistantContext';
import { useRoomInputContext } from './RoomInputContext';

import GenResponseIcon from '~/app/features/ai-assistant/assets/gen-response.svg';
import GenResponseActiveIcon from '~/app/features/ai-assistant/assets/gen-response-active.svg';

export function RoomInputActions() {
  const {
    submit,
    editor,
    imagePackRooms,
    handleEmoticonSelect,
    handleStickerSelect,
    hideStickerBtn,
  } = useRoomInputContext();
  const { regenerateResponse, generatedResponse, isGeneratingResponse } = useAIAssistant();
  const emojiBtnRef = useRef<HTMLButtonElement>(null);

  const renderGenerateIcon = () => {
    if (isGeneratingResponse) {
      return <Spinner size="300" />;
    }
    if (generatedResponse) {
      return <img src={GenResponseActiveIcon} alt="Regenerate Response" height={30} />;
    }
    return <img src={GenResponseIcon} alt="Regenerate Response" height={30} />;
  };

  return (
    <>
      <Box direction="Row" alignItems="Center" gap="100">
        <IconButton
          onClick={() => {
            regenerateResponse();
          }}
          variant="SurfaceVariant"
          size="300"
          radii="300"
        >
          {renderGenerateIcon()}
        </IconButton>
      </Box>
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
