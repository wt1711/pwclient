import React, { useEffect, useRef } from 'react';
import { Box, Icon, IconButton, Icons, PopOut } from 'folds';
import { ReactEditor } from 'slate-react';
import { GeneratedResponseBox } from '~/app/features/ai-assistant/gen-response/GeneratedResponseBox';
import { useAIAssistant } from '../../ai-assistant/AIAssistantContext';
import { EmojiBoard, EmojiBoardTab } from '~/app/components/emoji-board';
import { UseStateProvider } from '~/app/components/UseStateProvider';
import { mobileOrTablet } from '~/app/utils/user-agent';
import { useRoomInputContext } from './RoomInputContext';

export function RoomInputActions() {
  const {
    editor,
    submit,
    imagePackRooms,
    handleEmoticonSelect,
    handleStickerSelect,
    hideStickerBtn,
  } = useRoomInputContext();
  const { isAIAssistantOpen, toggleAIAssistant, generateNewResponseFromMessage } = useAIAssistant();
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
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAIAssistantOpen, toggleAIAssistant]);

  return (
    <>
      {isAIAssistantOpen && (
        <Box
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <Box
            ref={popoutContentRef}
            direction="Column"
            style={{
              width: '320px',
              backgroundColor: 'var(--bg-surface)',
              padding: '16px',
              borderRadius: '16px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
            }}
          >
            <GeneratedResponseBox />
          </Box>
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
        <Icon src={Icons.Star} />
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
