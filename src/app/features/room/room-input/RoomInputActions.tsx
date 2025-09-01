import React, { useEffect, useRef } from 'react';
import { Box, Icon, IconButton, Icons, PopOut } from 'folds';
import { ReactEditor } from 'slate-react';
import { GeneratedResponseBox } from '../../ai-assistant/gen-response/GeneratedResponseBox';
import { useAIAssistant } from '../../ai-assistant/AIAssistantContext';
import { EmojiBoard, EmojiBoardTab } from '../../../components/emoji-board';
import { UseStateProvider } from '../../../components/UseStateProvider';
import { mobileOrTablet } from '../../../utils/user-agent';
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
  const { isAIAssistantOpen, toggleAIAssistant } = useAIAssistant();
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
          <Icon src={Icons.Star} />
        </IconButton>
      </PopOut>
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
