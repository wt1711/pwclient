import React, { useEffect, useRef } from 'react';
import { Box, Icon, IconButton, Icons, PopOut, Spinner } from 'folds';
import { ReactEditor } from 'slate-react';
import { GeneratedResponseBox } from '~/app/features/ai-assistant/gen-response/GeneratedResponseBox';
import { useAIAssistant } from '../../ai-assistant/AIAssistantContext';
import { EmojiBoard, EmojiBoardTab } from '~/app/components/emoji-board';
import { UseStateProvider } from '~/app/components/UseStateProvider';
import { mobileOrTablet } from '~/app/utils/user-agent';
import { useRoomInputContext } from './RoomInputContext';

import GenResponseIcon from '~/app/features/ai-assistant/assets/gen-response.svg';
import GenResponseActiveIcon from '~/app/features/ai-assistant/assets/gen-response-active.svg';

export function RoomInputActions() {
  const {
    editor,
    submit,
    imagePackRooms,
    handleEmoticonSelect,
    handleStickerSelect,
    hideStickerBtn,
  } = useRoomInputContext();
  const {
    isAIAssistantOpen,
    toggleAIAssistant,
    generateNewResponseFromMessage,
    isGeneratingResponse,
  } = useAIAssistant();
  const aiAssistantBtnRef = useRef<HTMLButtonElement>(null);
  const popoutContentRef = useRef<HTMLDivElement>(null);
  const emojiBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isAIAssistantOpen) return undefined;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoutContentRef.current &&
        !popoutContentRef.current.contains(event.target as Node) &&
        aiAssistantBtnRef.current &&
        !aiAssistantBtnRef.current.contains(event.target as Node)
      ) {
        toggleAIAssistant(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        toggleAIAssistant(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAIAssistantOpen, toggleAIAssistant]);

  return (
    <>
      {isAIAssistantOpen && (
        <Box
          ref={popoutContentRef}
          direction="Column"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: 0,
            zIndex: 1000,
          }}
        >
          <GeneratedResponseBox />
        </Box>
      )}
      <IconButton
        ref={aiAssistantBtnRef}
        onClick={() => {
          generateNewResponseFromMessage();
        }}
        variant="SurfaceVariant"
        size="300"
        radii="300"
      >
        {isGeneratingResponse ? (
          <Spinner size="300" />
        ) : (
          <img
            src={isAIAssistantOpen ? GenResponseActiveIcon : GenResponseIcon}
            alt="Gen Response"
            height={30}
          />
        )}
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
