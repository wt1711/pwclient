import React, {
  ChangeEventHandler,
  FocusEventHandler,
  MouseEventHandler,
  UIEventHandler,
  ReactNode,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import {
  Badge,
  Box,
  Chip,
  Icon,
  IconButton,
  Icons,
  Input,
  Line,
  Scroll,
  Text,
  Tooltip,
  TooltipProvider,
  as,
  config,
  toRem,
} from 'folds';
import FocusTrap from 'focus-trap-react';
import { isKeyHotkey } from 'is-hotkey';
import classNames from 'classnames';
import { MatrixClient, Room } from 'matrix-js-sdk';
import { atom, useAtomValue, useSetAtom } from 'jotai';

import * as css from './EmojiBoard.css';
import { EmojiGroupId, IEmoji, IEmojiGroup, emojiGroups, emojis } from '../../plugins/emoji';
import { IEmojiGroupLabels, useEmojiGroupLabels } from './useEmojiGroupLabels';
import { IEmojiGroupIcons, useEmojiGroupIcons } from './useEmojiGroupIcons';
import { preventScrollWithArrowKey, stopPropagation } from '../../utils/keyboard';
import { useRelevantImagePacks } from '../../hooks/useImagePacks';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { useRecentEmoji } from '../../hooks/useRecentEmoji';
import { isUserId, mxcUrlToHttp } from '../../utils/matrix';
import { editableActiveElement, isIntersectingScrollView, targetFromEvent } from '../../utils/dom';
import { useAsyncSearch, UseAsyncSearchOptions } from '../../hooks/useAsyncSearch';
import { useDebounce } from '../../hooks/useDebounce';
import { useThrottle } from '../../hooks/useThrottle';
import { addRecentEmoji } from '../../plugins/recent-emoji';
import { mobileOrTablet } from '../../utils/user-agent';
import { useMediaAuthentication } from '../../hooks/useMediaAuthentication';
import { ImagePack, ImageUsage, PackImageReader } from '../../plugins/custom-emoji';
import { getEmoticonSearchStr } from '../../plugins/utils';

const RECENT_GROUP_ID = 'recent_group';
const SEARCH_GROUP_ID = 'search_group';

export enum EmojiBoardTab {
  Emoji = 'Emoji',
  Sticker = 'Sticker',
}

enum EmojiType {
  Emoji = 'emoji',
  CustomEmoji = 'customEmoji',
  Sticker = 'sticker',
}

export type EmojiItemInfo = {
  type: EmojiType;
  data: string;
  shortcode: string;
  label: string;
};

const getDOMGroupId = (id: string): string => `EmojiBoardGroup-${id}`;

const getEmojiItemInfo = (element: Element): EmojiItemInfo | undefined => {
  const type = element.getAttribute('data-emoji-type') as EmojiType | undefined;
  const data = element.getAttribute('data-emoji-data');
  const label = element.getAttribute('title');
  const shortcode = element.getAttribute('data-emoji-shortcode');

  if (type && data && shortcode && label)
    return {
      type,
      data,
      shortcode,
      label,
    };
  return undefined;
};

const activeGroupIdAtom = atom<string | undefined>(undefined);

function Sidebar({ children }: { children: ReactNode }) {
  return (
    <Box className={css.Sidebar} shrink="No">
      <Scroll size="0">
        <Box className={css.SidebarContent} direction="Column" alignItems="Center" gap="100">
          {children}
        </Box>
      </Scroll>
    </Box>
  );
}

const SidebarStack = as<'div'>(({ className, children, ...props }, ref) => (
  <Box
    className={classNames(css.SidebarStack, className)}
    direction="Column"
    alignItems="Center"
    gap="100"
    {...props}
    ref={ref}
  >
    {children}
  </Box>
));
function SidebarDivider() {
  return <Line className={css.SidebarDivider} size="300" variant="Surface" />;
}

function Header({ children }: { children: ReactNode }) {
  return (
    <Box className={css.Header} direction="Column" shrink="No">
      {children}
    </Box>
  );
}

function Content({ children }: { children: ReactNode }) {
  return <Box grow="Yes">{children}</Box>;
}

function Footer({ children }: { children: ReactNode }) {
  return (
    <Box shrink="No" className={css.Footer} gap="300" alignItems="Center">
      {children}
    </Box>
  );
}

const EmojiBoardLayout = as<
  'div',
  {
    header: ReactNode;
    sidebar?: ReactNode;
    footer?: ReactNode;
    children: ReactNode;
  }
>(({ className, header, sidebar, footer, children, ...props }, ref) => (
  <Box
    display="InlineFlex"
    className={classNames(css.Base, className)}
    direction="Row"
    {...props}
    ref={ref}
  >
    <Box direction="Column" grow="Yes">
      {header}
      {children}
      {footer}
    </Box>
    <Line size="300" direction="Vertical" />
    {sidebar}
  </Box>
));

function EmojiBoardTabs({
  tab,
  onTabChange,
}: {
  tab: EmojiBoardTab;
  onTabChange: (tab: EmojiBoardTab) => void;
}) {
  return (
    <Box gap="100">
      <Badge
        className={css.EmojiBoardTab}
        as="button"
        variant="Secondary"
        fill={tab === EmojiBoardTab.Sticker ? 'Solid' : 'None'}
        size="500"
        onClick={() => onTabChange(EmojiBoardTab.Sticker)}
      >
        <Text as="span" size="L400">
          Sticker
        </Text>
      </Badge>
      <Badge
        className={css.EmojiBoardTab}
        as="button"
        variant="Secondary"
        fill={tab === EmojiBoardTab.Emoji ? 'Solid' : 'None'}
        size="500"
        onClick={() => onTabChange(EmojiBoardTab.Emoji)}
      >
        <Text as="span" size="L400">
          Emoji
        </Text>
      </Badge>
    </Box>
  );
}

export function SidebarBtn<T extends string>({
  active,
  label,
  id,
  onItemClick,
  children,
}: {
  active?: boolean;
  label: string;
  id: T;
  onItemClick: (id: T) => void;
  children: ReactNode;
}) {
  return (
    <TooltipProvider
      delay={500}
      position="Left"
      tooltip={
        <Tooltip id={`SidebarStackItem-${id}-label`}>
          <Text size="T300">{label}</Text>
        </Tooltip>
      }
    >
      {(ref) => (
        <IconButton
          aria-pressed={active}
          aria-labelledby={`SidebarStackItem-${id}-label`}
          ref={ref}
          onClick={() => onItemClick(id)}
          size="400"
          radii="300"
          variant="Surface"
        >
          {children}
        </IconButton>
      )}
    </TooltipProvider>
  );
}

export const EmojiGroup = as<
  'div',
  {
    id: string;
    label: string;
    children: ReactNode;
  }
>(({ className, id, label, children, ...props }, ref) => (
  <Box
    id={getDOMGroupId(id)}
    data-group-id={id}
    className={classNames(css.EmojiGroup, className)}
    direction="Column"
    gap="200"
    {...props}
    ref={ref}
  >
    <Text id={`EmojiGroup-${id}-label`} as="label" className={css.EmojiGroupLabel} size="O400">
      {label}
    </Text>
    <div aria-labelledby={`EmojiGroup-${id}-label`} className={css.EmojiGroupContent}>
      <Box wrap="Wrap" justifyContent="Center">
        {children}
      </Box>
    </div>
  </Box>
));

export function EmojiItem({
  label,
  type,
  data,
  shortcode,
  children,
}: {
  label: string;
  type: EmojiType;
  data: string;
  shortcode: string;
  children: ReactNode;
}) {
  return (
    <Box
      as="button"
      className={css.EmojiItem}
      type="button"
      alignItems="Center"
      justifyContent="Center"
      title={label}
      aria-label={`${label} emoji`}
      data-emoji-type={type}
      data-emoji-data={data}
      data-emoji-shortcode={shortcode}
    >
      {children}
    </Box>
  );
}

export function StickerItem({
  label,
  type,
  data,
  shortcode,
  children,
}: {
  label: string;
  type: EmojiType;
  data: string;
  shortcode: string;
  children: ReactNode;
}) {
  return (
    <Box
      as="button"
      className={css.StickerItem}
      type="button"
      alignItems="Center"
      justifyContent="Center"
      title={label}
      aria-label={`${label} sticker`}
      data-emoji-type={type}
      data-emoji-data={data}
      data-emoji-shortcode={shortcode}
    >
      {children}
    </Box>
  );
}

function RecentEmojiSidebarStack({ onItemClick }: { onItemClick: (id: string) => void }) {
  const activeGroupId = useAtomValue(activeGroupIdAtom);

  return (
    <SidebarStack>
      <SidebarBtn
        active={activeGroupId === RECENT_GROUP_ID}
        id={RECENT_GROUP_ID}
        label="Recent"
        onItemClick={() => onItemClick(RECENT_GROUP_ID)}
      >
        <Icon src={Icons.RecentClock} filled={activeGroupId === RECENT_GROUP_ID} />
      </SidebarBtn>
    </SidebarStack>
  );
}

function ImagePackSidebarStack({
  mx,
  packs,
  usage,
  onItemClick,
  useAuthentication,
}: {
  mx: MatrixClient;
  packs: ImagePack[];
  usage: ImageUsage;
  onItemClick: (id: string) => void;
  useAuthentication?: boolean;
}) {
  const activeGroupId = useAtomValue(activeGroupIdAtom);
  return (
    <SidebarStack>
      {usage === ImageUsage.Emoticon && <SidebarDivider />}
      {packs.map((pack) => {
        let label = pack.meta.name;
        if (!label) label = isUserId(pack.id) ? 'Personal Pack' : mx.getRoom(pack.id)?.name;
        return (
          <SidebarBtn
            active={activeGroupId === pack.id}
            key={pack.id}
            id={pack.id}
            label={label || 'Unknown Pack'}
            onItemClick={onItemClick}
          >
            <img
              style={{
                width: toRem(24),
                height: toRem(24),
                objectFit: 'contain',
              }}
              src={
                mxcUrlToHttp(mx, pack.getAvatarUrl(usage) ?? '', useAuthentication) ||
                pack.meta.avatar
              }
              alt={label || 'Unknown Pack'}
            />
          </SidebarBtn>
        );
      })}
    </SidebarStack>
  );
}

function NativeEmojiSidebarStack({
  groups,
  icons,
  labels,
  onItemClick,
}: {
  groups: IEmojiGroup[];
  icons: IEmojiGroupIcons;
  labels: IEmojiGroupLabels;
  onItemClick: (id: EmojiGroupId) => void;
}) {
  const activeGroupId = useAtomValue(activeGroupIdAtom);
  return (
    <SidebarStack className={css.NativeEmojiSidebarStack}>
      <SidebarDivider />
      {groups.map((group) => (
        <SidebarBtn
          key={group.id}
          active={activeGroupId === group.id}
          id={group.id}
          label={labels[group.id]}
          onItemClick={onItemClick}
        >
          <Icon src={icons[group.id]} filled={activeGroupId === group.id} />
        </SidebarBtn>
      ))}
    </SidebarStack>
  );
}

export function RecentEmojiGroup({
  label,
  id,
  emojis: recentEmojis,
}: {
  label: string;
  id: string;
  emojis: IEmoji[];
}) {
  return (
    <EmojiGroup key={id} id={id} label={label}>
      {recentEmojis.map((emoji) => (
        <EmojiItem
          key={emoji.unicode}
          label={emoji.label}
          type={EmojiType.Emoji}
          data={emoji.unicode}
          shortcode={emoji.shortcode}
        >
          {emoji.unicode}
        </EmojiItem>
      ))}
    </EmojiGroup>
  );
}

export function SearchEmojiGroup({
  mx,
  tab,
  label,
  id,
  emojis: searchResult,
  useAuthentication,
}: {
  mx: MatrixClient;
  tab: EmojiBoardTab;
  label: string;
  id: string;
  emojis: Array<PackImageReader | IEmoji>;
  useAuthentication?: boolean;
}) {
  return (
    <EmojiGroup key={id} id={id} label={label}>
      {tab === EmojiBoardTab.Emoji
        ? searchResult.map((emoji) =>
            'unicode' in emoji ? (
              <EmojiItem
                key={emoji.unicode}
                label={emoji.label}
                type={EmojiType.Emoji}
                data={emoji.unicode}
                shortcode={emoji.shortcode}
              >
                {emoji.unicode}
              </EmojiItem>
            ) : (
              <EmojiItem
                key={emoji.shortcode}
                label={emoji.body || emoji.shortcode}
                type={EmojiType.CustomEmoji}
                data={emoji.url}
                shortcode={emoji.shortcode}
              >
                <img
                  loading="lazy"
                  className={css.CustomEmojiImg}
                  alt={emoji.body || emoji.shortcode}
                  src={mxcUrlToHttp(mx, emoji.url, useAuthentication) ?? emoji.url}
                />
              </EmojiItem>
            )
          )
        : searchResult.map((emoji) =>
            'unicode' in emoji ? null : (
              <StickerItem
                key={emoji.shortcode}
                label={emoji.body || emoji.shortcode}
                type={EmojiType.Sticker}
                data={emoji.url}
                shortcode={emoji.shortcode}
              >
                <img
                  loading="lazy"
                  className={css.StickerImg}
                  alt={emoji.body || emoji.shortcode}
                  src={mxcUrlToHttp(mx, emoji.url, useAuthentication) ?? emoji.url}
                />
              </StickerItem>
            )
          )}
    </EmojiGroup>
  );
}

export const CustomEmojiGroups = memo(
  ({
    mx,
    groups,
    useAuthentication,
  }: {
    mx: MatrixClient;
    groups: ImagePack[];
    useAuthentication?: boolean;
  }) => (
    <>
      {groups.map((pack) => (
        <EmojiGroup key={pack.id} id={pack.id} label={pack.meta.name || 'Unknown'}>
          {pack
            .getImages(ImageUsage.Emoticon)
            .sort((a, b) => a.shortcode.localeCompare(b.shortcode))
            .map((image) => (
              <EmojiItem
                key={image.shortcode}
                label={image.body || image.shortcode}
                type={EmojiType.CustomEmoji}
                data={image.url}
                shortcode={image.shortcode}
              >
                <img
                  loading="lazy"
                  className={css.CustomEmojiImg}
                  alt={image.body || image.shortcode}
                  src={mxcUrlToHttp(mx, image.url, useAuthentication) ?? image.url}
                />
              </EmojiItem>
            ))}
        </EmojiGroup>
      ))}
    </>
  )
);

export const StickerGroups = memo(
  ({
    mx,
    groups,
    useAuthentication,
  }: {
    mx: MatrixClient;
    groups: ImagePack[];
    useAuthentication?: boolean;
  }) => (
    <>
      {groups.length === 0 && (
        <Box
          style={{ padding: `${toRem(60)} ${config.space.S500}` }}
          alignItems="Center"
          justifyContent="Center"
          direction="Column"
          gap="300"
        >
          <Icon size="600" src={Icons.Sticker} />
          <Box direction="Inherit">
            <Text align="Center">No Sticker Packs!</Text>
            <Text priority="300" align="Center" size="T200">
              Add stickers from user, room or space settings.
            </Text>
          </Box>
        </Box>
      )}
      {groups.map((pack) => (
        <EmojiGroup key={pack.id} id={pack.id} label={pack.meta.name || 'Unknown'}>
          {pack
            .getImages(ImageUsage.Sticker)
            .sort((a, b) => a.shortcode.localeCompare(b.shortcode))
            .map((image) => (
              <StickerItem
                key={image.shortcode}
                label={image.body || image.shortcode}
                type={EmojiType.Sticker}
                data={image.url}
                shortcode={image.shortcode}
              >
                <img
                  loading="lazy"
                  className={css.StickerImg}
                  alt={image.body || image.shortcode}
                  src={mxcUrlToHttp(mx, image.url, useAuthentication) ?? image.url}
                />
              </StickerItem>
            ))}
        </EmojiGroup>
      ))}
    </>
  )
);

export const NativeEmojiGroups = memo(
  ({ groups, labels }: { groups: IEmojiGroup[]; labels: IEmojiGroupLabels }) => (
    <>
      {groups.map((emojiGroup) => (
        <EmojiGroup key={emojiGroup.id} id={emojiGroup.id} label={labels[emojiGroup.id]}>
          {emojiGroup.emojis.map((emoji) => (
            <EmojiItem
              key={emoji.unicode}
              label={emoji.label}
              type={EmojiType.Emoji}
              data={emoji.unicode}
              shortcode={emoji.shortcode}
            >
              {emoji.unicode}
            </EmojiItem>
          ))}
        </EmojiGroup>
      ))}
    </>
  )
);

const SEARCH_OPTIONS: UseAsyncSearchOptions = {
  limit: 1000,
  matchOptions: {
    contain: true,
  },
};

export function EmojiBoard({
  tab = EmojiBoardTab.Emoji,
  onTabChange,
  imagePackRooms,
  requestClose,
  returnFocusOnDeactivate,
  onEmojiSelect,
  onCustomEmojiSelect,
  onStickerSelect,
  allowTextCustomEmoji,
  addToRecentEmoji = true,
}: {
  tab?: EmojiBoardTab;
  onTabChange?: (tab: EmojiBoardTab) => void;
  imagePackRooms: Room[];
  requestClose: () => void;
  returnFocusOnDeactivate?: boolean;
  onEmojiSelect?: (unicode: string, shortcode: string) => void;
  onCustomEmojiSelect?: (mxc: string, shortcode: string) => void;
  onStickerSelect?: (mxc: string, shortcode: string, label: string) => void;
  allowTextCustomEmoji?: boolean;
  addToRecentEmoji?: boolean;
}) {
  const emojiTab = tab === EmojiBoardTab.Emoji;
  const stickerTab = tab === EmojiBoardTab.Sticker;
  const usage = emojiTab ? ImageUsage.Emoticon : ImageUsage.Sticker;

  const setActiveGroupId = useSetAtom(activeGroupIdAtom);
  const mx = useMatrixClient();
  const useAuthentication = useMediaAuthentication();
  const emojiGroupLabels = useEmojiGroupLabels();
  const emojiGroupIcons = useEmojiGroupIcons();
  const imagePacks = useRelevantImagePacks(usage, imagePackRooms);
  const recentEmojis = useRecentEmoji(mx, 21);

  const contentScrollRef = useRef<HTMLDivElement>(null);
  const emojiPreviewRef = useRef<HTMLDivElement>(null);
  const emojiPreviewTextRef = useRef<HTMLParagraphElement>(null);

  const searchList = useMemo(() => {
    let list: Array<PackImageReader | IEmoji> = [];
    list = list.concat(imagePacks.flatMap((pack) => pack.getImages(usage)));
    if (emojiTab) list = list.concat(emojis);
    return list;
  }, [emojiTab, usage, imagePacks]);

  const [result, search, resetSearch] = useAsyncSearch(
    searchList,
    getEmoticonSearchStr,
    SEARCH_OPTIONS
  );

  const searchedItems = result?.items.slice(0, 100);

  const handleOnChange: ChangeEventHandler<HTMLInputElement> = useDebounce(
    useCallback(
      (evt) => {
        const term = evt.target.value;
        if (term) search(term);
        else resetSearch();
      },
      [search, resetSearch]
    ),
    { wait: 200 }
  );

  const syncActiveGroupId = useCallback(() => {
    const targetEl = contentScrollRef.current;
    if (!targetEl) return;
    const groupEls = Array.from(targetEl.querySelectorAll('div[data-group-id]')) as HTMLElement[];
    const groupEl = groupEls.find((el) => isIntersectingScrollView(targetEl, el));
    const groupId = groupEl?.getAttribute('data-group-id') ?? undefined;
    setActiveGroupId(groupId);
  }, [setActiveGroupId]);

  const handleOnScroll: UIEventHandler<HTMLDivElement> = useThrottle(syncActiveGroupId, {
    wait: 500,
  });

  const handleScrollToGroup = (groupId: string) => {
    setActiveGroupId(groupId);
    const groupElement = document.getElementById(getDOMGroupId(groupId));
    groupElement?.scrollIntoView();
  };

  const handleEmojiClick: MouseEventHandler = (evt) => {
    const targetEl = targetFromEvent(evt.nativeEvent, 'button');
    if (!targetEl) return;
    const emojiInfo = getEmojiItemInfo(targetEl);
    if (!emojiInfo) return;
    if (emojiInfo.type === EmojiType.Emoji) {
      onEmojiSelect?.(emojiInfo.data, emojiInfo.shortcode);
      if (!evt.altKey && !evt.shiftKey) {
        if (addToRecentEmoji) {
          addRecentEmoji(mx, emojiInfo.data);
        }
        requestClose();
      }
    }
    if (emojiInfo.type === EmojiType.CustomEmoji) {
      onCustomEmojiSelect?.(emojiInfo.data, emojiInfo.shortcode);
      if (!evt.altKey && !evt.shiftKey) requestClose();
    }
    if (emojiInfo.type === EmojiType.Sticker) {
      onStickerSelect?.(emojiInfo.data, emojiInfo.shortcode, emojiInfo.label);
      if (!evt.altKey && !evt.shiftKey) requestClose();
    }
  };

  const handleEmojiPreview = useCallback(
    (element: HTMLButtonElement) => {
      const emojiInfo = getEmojiItemInfo(element);
      if (!emojiInfo || !emojiPreviewTextRef.current) return;
      if (emojiInfo.type === EmojiType.Emoji && emojiPreviewRef.current) {
        emojiPreviewRef.current.textContent = emojiInfo.data;
      } else if (emojiInfo.type === EmojiType.CustomEmoji && emojiPreviewRef.current) {
        const img = document.createElement('img');
        img.className = css.CustomEmojiImg;
        img.setAttribute(
          'src',
          mxcUrlToHttp(mx, emojiInfo.data, useAuthentication) || emojiInfo.data
        );
        img.setAttribute('alt', emojiInfo.shortcode);
        emojiPreviewRef.current.textContent = '';
        emojiPreviewRef.current.appendChild(img);
      }
      emojiPreviewTextRef.current.textContent = `:${emojiInfo.shortcode}:`;
    },
    [mx, useAuthentication]
  );

  const throttleEmojiHover = useThrottle(handleEmojiPreview, {
    wait: 200,
    immediate: true,
  });

  const handleEmojiHover: MouseEventHandler = (evt) => {
    const targetEl = targetFromEvent(evt.nativeEvent, 'button') as HTMLButtonElement | undefined;
    if (!targetEl) return;
    throttleEmojiHover(targetEl);
  };

  const handleEmojiFocus: FocusEventHandler = (evt) => {
    const targetEl = evt.target as HTMLButtonElement;
    handleEmojiPreview(targetEl);
  };

  // Reset scroll top on search and tab change
  useEffect(() => {
    syncActiveGroupId();
    contentScrollRef.current?.scrollTo({
      top: 0,
    });
  }, [result, emojiTab, syncActiveGroupId]);

  return (
    <FocusTrap
      focusTrapOptions={{
        returnFocusOnDeactivate,
        initialFocus: false,
        onDeactivate: requestClose,
        clickOutsideDeactivates: true,
        allowOutsideClick: true,
        isKeyForward: (evt: KeyboardEvent) =>
          !editableActiveElement() && isKeyHotkey(['arrowdown', 'arrowright'], evt),
        isKeyBackward: (evt: KeyboardEvent) =>
          !editableActiveElement() && isKeyHotkey(['arrowup', 'arrowleft'], evt),
        escapeDeactivates: stopPropagation,
      }}
    >
      <EmojiBoardLayout
        header={
          <Header>
            <Box direction="Column" gap="200">
              {onTabChange && <EmojiBoardTabs tab={tab} onTabChange={onTabChange} />}
              <Input
                data-emoji-board-search
                variant="SurfaceVariant"
                size="400"
                placeholder={allowTextCustomEmoji ? 'Search or Text Reaction ' : 'Search'}
                maxLength={50}
                after={
                  allowTextCustomEmoji && result?.query ? (
                    <Chip
                      variant="Primary"
                      radii="Pill"
                      after={<Icon src={Icons.ArrowRight} size="50" />}
                      outlined
                      onClick={() => {
                        const searchInput = document.querySelector<HTMLInputElement>(
                          '[data-emoji-board-search="true"]'
                        );
                        const textReaction = searchInput?.value.trim();
                        if (!textReaction) return;
                        onCustomEmojiSelect?.(textReaction, textReaction);
                        requestClose();
                      }}
                    >
                      <Text size="L400">React</Text>
                    </Chip>
                  ) : (
                    <Icon src={Icons.Search} size="50" />
                  )
                }
                onChange={handleOnChange}
                autoFocus={!mobileOrTablet()}
              />
            </Box>
          </Header>
        }
        sidebar={
          <Sidebar>
            {emojiTab && recentEmojis.length > 0 && (
              <RecentEmojiSidebarStack onItemClick={handleScrollToGroup} />
            )}
            {imagePacks.length > 0 && (
              <ImagePackSidebarStack
                mx={mx}
                usage={usage}
                packs={imagePacks}
                onItemClick={handleScrollToGroup}
                useAuthentication={useAuthentication}
              />
            )}
            {emojiTab && (
              <NativeEmojiSidebarStack
                groups={emojiGroups}
                icons={emojiGroupIcons}
                labels={emojiGroupLabels}
                onItemClick={handleScrollToGroup}
              />
            )}
          </Sidebar>
        }
        footer={
          emojiTab ? (
            <Footer>
              <Box
                display="InlineFlex"
                ref={emojiPreviewRef}
                className={css.EmojiPreview}
                alignItems="Center"
                justifyContent="Center"
              >
                😃
              </Box>
              <Text ref={emojiPreviewTextRef} size="H5" truncate>
                :smiley:
              </Text>
            </Footer>
          ) : (
            imagePacks.length > 0 && (
              <Footer>
                <Text ref={emojiPreviewTextRef} size="H5" truncate>
                  :smiley:
                </Text>
              </Footer>
            )
          )
        }
      >
        <Content>
          <Scroll
            ref={contentScrollRef}
            size="400"
            onScroll={handleOnScroll}
            onKeyDown={preventScrollWithArrowKey}
            hideTrack
          >
            <Box
              onClick={handleEmojiClick}
              onMouseMove={handleEmojiHover}
              onFocus={handleEmojiFocus}
              direction="Column"
              gap="200"
            >
              {searchedItems && (
                <SearchEmojiGroup
                  mx={mx}
                  tab={tab}
                  id={SEARCH_GROUP_ID}
                  label={searchedItems.length ? 'Search Results' : 'No Results found'}
                  emojis={searchedItems}
                  useAuthentication={useAuthentication}
                />
              )}
              {emojiTab && recentEmojis.length > 0 && (
                <RecentEmojiGroup id={RECENT_GROUP_ID} label="Recent" emojis={recentEmojis} />
              )}
              {emojiTab && (
                <CustomEmojiGroups
                  mx={mx}
                  groups={imagePacks}
                  useAuthentication={useAuthentication}
                />
              )}
              {stickerTab && (
                <StickerGroups mx={mx} groups={imagePacks} useAuthentication={useAuthentication} />
              )}
              {emojiTab && <NativeEmojiGroups groups={emojiGroups} labels={emojiGroupLabels} />}
            </Box>
          </Scroll>
        </Content>
      </EmojiBoardLayout>
    </FocusTrap>
  );
}
