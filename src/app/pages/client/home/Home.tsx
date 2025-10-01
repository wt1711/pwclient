import React, { MouseEventHandler, forwardRef, useMemo, useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHomeInstagramChatPath } from '../../pathUtils';
import { fetchInstagramContacts, InstagramContact } from '../../../services/instagramApi';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Icon,
  IconButton,
  Icons,
  Menu,
  MenuItem,
  PopOut,
  RectCords,
  Spinner,
  Text,
  config,
  toRem,
} from 'folds';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useAtom, useAtomValue } from 'jotai';
import FocusTrap from 'focus-trap-react';
import { factoryRoomIdByActivity, factoryRoomIdByAtoZ } from '../../../utils/sort';
import {
  NavButton,
  NavCategory,
  NavCategoryHeader,
  NavEmptyCenter,
  NavEmptyLayout,
  NavItem,
  NavItemContent,
  NavLink,
} from '../../../components/nav';
import { getExplorePath, getHomeRoomPath, getHomeSearchPath } from '../../pathUtils';
import { getCanonicalAliasOrRoomId } from '../../../utils/matrix';
import { useSelectedRoom } from '../../../hooks/router/useSelectedRoom';
import { useHomeSearchSelected } from '../../../hooks/router/useHomeSelected';
import { useHomeRooms } from './useHomeRooms';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { VirtualTile } from '../../../components/virtualizer';
import { RoomNavCategoryButton, RoomNavItem } from '../../../features/room-nav';
import { makeNavCategoryId } from '../../../state/closedNavCategories';
import { roomToUnreadAtom } from '../../../state/room/roomToUnread';
import { useCategoryHandler } from '../../../hooks/useCategoryHandler';
import { useNavToActivePathMapper } from '../../../hooks/useNavToActivePathMapper';
import { openCreateRoom, openJoinAlias } from '../../../../client/action/navigation';
import { PageNav, PageNavHeader, PageNavContent } from '../../../components/page';
import { useRoomsUnread } from '../../../state/hooks/unread';
import { markAsRead } from '../../../../client/action/notifications';
import { useClosedNavCategoriesAtom } from '../../../state/hooks/closedNavCategories';
import { stopPropagation } from '../../../utils/keyboard';
import { useSetting } from '../../../state/hooks/settings';
import { settingsAtom } from '../../../state/settings';
import {
  getRoomNotificationMode,
  useRoomsNotificationPreferencesContext,
} from '../../../hooks/useRoomsNotificationPreferences';
import { InstagramLoginModal } from '../../../components/InstagramLoginModal';

type HomeMenuProps = {
  requestClose: () => void;
};
const HomeMenu = forwardRef<HTMLDivElement, HomeMenuProps>(({ requestClose }, ref) => {
  const orphanRooms = useHomeRooms();
  const [hideActivity] = useSetting(settingsAtom, 'hideActivity');
  const unread = useRoomsUnread(orphanRooms, roomToUnreadAtom);
  const mx = useMatrixClient();

  const handleMarkAsRead = () => {
    if (!unread) return;
    orphanRooms.forEach((rId) => markAsRead(mx, rId, hideActivity));
    requestClose();
  };

  const handleJoinAddress = () => {
    openJoinAlias();
    requestClose();
  };

  return (
    <Menu ref={ref} style={{ maxWidth: toRem(160), width: '100vw' }}>
      <Box direction="Column" gap="100" style={{ padding: config.space.S100 }}>
        <MenuItem
          onClick={handleMarkAsRead}
          size="300"
          after={<Icon size="100" src={Icons.CheckTwice} />}
          radii="300"
          aria-disabled={!unread}
        >
          <Text style={{ flexGrow: 1 }} as="span" size="T300" truncate>
            Mark as Read
          </Text>
        </MenuItem>
        <MenuItem
          onClick={handleJoinAddress}
          size="300"
          radii="300"
          after={<Icon size="100" src={Icons.Link} />}
        >
          <Text style={{ flexGrow: 1 }} as="span" size="T300" truncate>
            Join with Address
          </Text>
        </MenuItem>
      </Box>
    </Menu>
  );
});

function HomeHeader() {
  const [menuAnchor, setMenuAnchor] = useState<RectCords>();

  const handleOpenMenu: MouseEventHandler<HTMLButtonElement> = (evt) => {
    const cords = evt.currentTarget.getBoundingClientRect();
    setMenuAnchor((currentState) => {
      if (currentState) return undefined;
      return cords;
    });
  };

  return (
    <>
      <PageNavHeader>
        <Box alignItems="Center" grow="Yes" gap="300">
          <Box grow="Yes">
            <Text size="H4" truncate>
              Home
            </Text>
          </Box>
          <Box>
            <IconButton aria-pressed={!!menuAnchor} variant="Background" onClick={handleOpenMenu}>
              <Icon src={Icons.VerticalDots} size="200" />
            </IconButton>
          </Box>
        </Box>
      </PageNavHeader>
      <PopOut
        anchor={menuAnchor}
        position="Bottom"
        align="End"
        offset={6}
        content={
          <FocusTrap
            focusTrapOptions={{
              initialFocus: false,
              returnFocusOnDeactivate: false,
              onDeactivate: () => setMenuAnchor(undefined),
              clickOutsideDeactivates: true,
              isKeyForward: (evt: KeyboardEvent) => evt.key === 'ArrowDown',
              isKeyBackward: (evt: KeyboardEvent) => evt.key === 'ArrowUp',
              escapeDeactivates: stopPropagation,
            }}
          >
            <HomeMenu requestClose={() => setMenuAnchor(undefined)} />
          </FocusTrap>
        }
      />
    </>
  );
}

function HomeEmpty() {
  const navigate = useNavigate();

  return (
    <NavEmptyCenter>
      <NavEmptyLayout
        icon={<Icon size="600" src={Icons.Hash} />}
        title={
          <Text size="H5" align="Center">
            No Rooms
          </Text>
        }
        content={
          <Text size="T300" align="Center">
            You do not have any rooms yet.
          </Text>
        }
        options={
          <>
            <Button onClick={() => openCreateRoom()} variant="Secondary" size="300">
              <Text size="B300" truncate>
                Create Room
              </Text>
            </Button>
            <Button
              onClick={() => navigate(getExplorePath())}
              variant="Secondary"
              fill="Soft"
              size="300"
            >
              <Text size="B300" truncate>
                Explore Community Rooms
              </Text>
            </Button>
          </>
        }
      />
    </NavEmptyCenter>
  );
}

const DEFAULT_CATEGORY_ID = makeNavCategoryId('home', 'room');

// Instagram DM List Component
function InstagramDMList() {
  const [contacts, setContacts] = useState<InstagramContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch Instagram threads on component mount
  useEffect(() => {
    const loadContacts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const fetchedContacts = await fetchInstagramContacts();
        setContacts(fetchedContacts);
      } catch (err) {
        console.error('Failed to load Instagram contacts:', err);
        setError(err instanceof Error ? err.message : 'Failed to load conversations');
      } finally {
        setIsLoading(false);
      }
    };

    loadContacts();
  }, []);

  const handleContactClick = (contactId: string) => {
    // Navigate to Instagram chat view
    navigate(getHomeInstagramChatPath(contactId));
  };

  return (
    <NavCategory>
      <NavCategoryHeader>
        <RoomNavCategoryButton
          closed={false}
          data-category-id="instagram-dms"
          onClick={() => console.log('Instagram DMs category clicked')}
        >
          Instagram DMs
        </RoomNavCategoryButton>
      </NavCategoryHeader>

      {isLoading ? (
        <NavItem variant="Background" radii="400">
          <NavItemContent>
            <Box as="span" grow="Yes" alignItems="Center" gap="200" style={{ padding: '8px 0' }}>
              <Spinner size="100" />
              <Text as="span" size="T300" priority="300" truncate>
                Loading conversations...
              </Text>
            </Box>
          </NavItemContent>
        </NavItem>
      ) : error ? (
        <NavItem variant="Background" radii="400">
          <NavItemContent>
            <Box as="span" grow="Yes" alignItems="Center" gap="200" style={{ padding: '8px 0' }}>
              <Icon src={Icons.Warning} size="100" />
              <Text as="span" size="T300" priority="300" truncate>
                {error}
              </Text>
            </Box>
          </NavItemContent>
        </NavItem>
      ) : contacts.length === 0 ? (
        <NavItem variant="Background" radii="400">
          <NavItemContent>
            <Box as="span" grow="Yes" alignItems="Center" gap="200" style={{ padding: '8px 0' }}>
              <Text as="span" size="T300" priority="300" truncate>
                No direct messages yet
              </Text>
            </Box>
          </NavItemContent>
        </NavItem>
      ) : (
        contacts.map((contact) => {
          const displayName = contact.fullName || contact.username || 'Unknown';
          const hasUnread = (contact.unreadCount || 0) > 0;

          return (
            <NavItem key={contact.id} variant="Background" radii="400">
              <NavButton onClick={() => handleContactClick(contact.id)}>
                <NavItemContent>
                  <Box as="span" grow="Yes" alignItems="Center" gap="200">
                    <Avatar size="200" radii="400">
                      {contact.profilePicUrl ? (
                        <img
                          src={contact.profilePicUrl}
                          alt={displayName}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <Icon src={Icons.User} size="100" />
                      )}
                    </Avatar>
                    <Box as="span" grow="Yes" direction="Column" alignItems="Start">
                      <Text as="span" size="Inherit" truncate priority={hasUnread ? '500' : '400'}>
                        {displayName}
                      </Text>
                      <Text as="span" size="T200" priority="300" truncate>
                        {contact.lastMessageTime ? 'Recent activity' : 'No messages'}
                      </Text>
                    </Box>
                    {hasUnread && (
                      <Badge variant="Primary" size="300" radii="Pill">
                        <Text size="L400">{contact.unreadCount}</Text>
                      </Badge>
                    )}
                  </Box>
                </NavItemContent>
              </NavButton>
            </NavItem>
          );
        })
      )}
    </NavCategory>
  );
}

// Helper function to check Instagram connection status
function useInstagramConnection() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkConnection = () => {
      const token = localStorage.getItem('instagram_token');
      setIsConnected(!!token);
    };

    // Check initial connection
    checkConnection();

    // Listen for storage changes (when token is added/removed)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'instagram_token') {
        checkConnection();
      }
    };

    // Listen for custom events (for same-tab updates)
    const handleTokenChange = () => {
      checkConnection();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('instagram-token-changed', handleTokenChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('instagram-token-changed', handleTokenChange);
    };
  }, []);

  return isConnected;
}

// Instagram Connect Component
function InstagramConnectSection() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [availableMethods, setAvailableMethods] = useState<Array<{ id: string; name: string }>>([]);
  const [savedCredentials, setSavedCredentials] = useState<{
    username: string;
    password: string;
  } | null>(null);

  // Check for existing token on component mount
  useEffect(() => {
    const token = localStorage.getItem('instagram_token');
    if (token) {
      setIsConnected(true);
    }
  }, []);

  // Don't render anything if already connected
  if (isConnected) {
    return null;
  }

  const handleInstagramLogin = async (
    username: string,
    password: string,
    verificationCode?: string,
    challengeId?: string,
    verificationMethod?: string
  ) => {
    setIsLoading(true);
    setError(null);

    // For 2FA verification, use saved credentials if available
    let actualUsername = username;
    let actualPassword = password;

    if (verificationCode && challengeId && savedCredentials) {
      actualUsername = savedCredentials.username;
      actualPassword = savedCredentials.password;
    }

    // Save credentials for potential 2FA use (only on initial login)
    if (!verificationCode) {
      setSavedCredentials({ username: actualUsername, password: actualPassword });
    }

    try {
      const requestBody: any = { username: actualUsername, password: actualPassword };

      // Add 2FA parameters if provided
      if (verificationCode && challengeId) {
        requestBody.verificationCode = verificationCode;
        requestBody.challengeId = challengeId;
        if (verificationMethod) {
          requestBody.verificationMethod = verificationMethod;
        }
      }

      console.log('Sending login request:', { ...requestBody, password: '[REDACTED]' });

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('Login response:', data);

      if (response.ok) {
        if (data.requires2FA) {
          // Handle 2FA challenge
          console.log('🔐 2FA required, showing verification modal');
          setRequires2FA(true);
          setChallengeId(data.challengeId);

          // Transform backend availableMethods format to frontend format
          const transformedMethods = (data.availableMethods || []).map((method: any) => ({
            id: method.verificationMethod,
            name: method.label,
          }));
          setAvailableMethods(transformedMethods);

          setError(null);
          console.log('2FA required:', data.message);
          console.log('Available methods:', transformedMethods);
        } else if (data.success) {
          // Successful login
          localStorage.setItem('instagram_token', data.token);
          localStorage.setItem('instagram_user', JSON.stringify(data.user));

          // Dispatch custom event to notify other components
          window.dispatchEvent(new CustomEvent('instagram-token-changed'));

          setIsConnected(true);
          setIsModalOpen(false);
          setRequires2FA(false);
          setChallengeId(null);
          console.log('Successfully connected to Instagram:', data.user);
        }
      } else {
        // Handle error response with potential suggestion
        let errorMessage = data.error || 'Failed to connect to Instagram';
        if (data.suggestion) {
          errorMessage += `\n\n${data.suggestion}`;
        }
        setError(errorMessage);

        // Only reset 2FA state if it's not a 2FA verification error
        // If it's a 2FA verification error (401 with specific message), keep 2FA state active
        const is2FAVerificationError =
          response.status === 401 &&
          (data.error?.includes('Invalid verification code') ||
            data.error?.includes('verification'));

        if (requires2FA && !is2FAVerificationError) {
          // Reset 2FA state only for non-verification errors
          setRequires2FA(false);
          setChallengeId(null);
        }

        throw new Error(errorMessage);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Network error. Make sure the Instagram service is running on port 3000.';
      setError(errorMessage);
      console.error('Instagram connection error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectClick = () => {
    setError(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    if (!isLoading) {
      setIsModalOpen(false);
      setError(null);
      setRequires2FA(false);
      setChallengeId(null);
      setSavedCredentials(null);
    }
  };

  // Don't render the connect button if already connected
  if (isConnected) {
    return null;
  }

  return (
    <>
      <NavCategory>
        <NavItem variant="Background" radii="400">
          <NavButton onClick={handleConnectClick} disabled={isLoading}>
            <NavItemContent>
              <Box as="span" grow="Yes" alignItems="Center" gap="200">
                <Avatar size="200" radii="400">
                  <Icon src={Icons.Photo} size="100" />
                </Avatar>
                <Box as="span" grow="Yes">
                  <Text as="span" size="Inherit" truncate>
                    Connect to Instagram
                  </Text>
                  {error && (
                    <Text as="span" size="T200" priority="300" truncate>
                      {error}
                    </Text>
                  )}
                </Box>
              </Box>
            </NavItemContent>
          </NavButton>
        </NavItem>
      </NavCategory>

      <InstagramLoginModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onLogin={handleInstagramLogin}
        isLoading={isLoading}
        error={error}
        requires2FA={requires2FA}
        challengeId={challengeId || undefined}
        availableMethods={availableMethods}
        initialUsername={savedCredentials?.username || ''}
        initialPassword={savedCredentials?.password || ''}
      />
    </>
  );
}
export function Home() {
  const mx = useMatrixClient();
  useNavToActivePathMapper('home');
  const scrollRef = useRef<HTMLDivElement>(null);
  const rooms = useHomeRooms();
  const notificationPreferences = useRoomsNotificationPreferencesContext();
  const roomToUnread = useAtomValue(roomToUnreadAtom);
  const isInstagramConnected = useInstagramConnection();

  const selectedRoomId = useSelectedRoom();
  const searchSelected = useHomeSearchSelected();
  const noRoomToDisplay = rooms.length === 0;
  const [closedCategories, setClosedCategories] = useAtom(useClosedNavCategoriesAtom());

  const sortedRooms = useMemo(() => {
    const items = Array.from(rooms).sort(
      closedCategories.has(DEFAULT_CATEGORY_ID)
        ? factoryRoomIdByActivity(mx)
        : factoryRoomIdByAtoZ(mx)
    );
    if (closedCategories.has(DEFAULT_CATEGORY_ID)) {
      return items.filter((rId) => roomToUnread.has(rId) || rId === selectedRoomId);
    }
    return items;
  }, [mx, rooms, closedCategories, roomToUnread, selectedRoomId]);

  const virtualizer = useVirtualizer({
    count: sortedRooms.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 38,
    overscan: 10,
  });

  const handleCategoryClick = useCategoryHandler(setClosedCategories, (categoryId) =>
    closedCategories.has(categoryId)
  );

  return (
    <PageNav>
      <HomeHeader />
      {noRoomToDisplay ? (
        <HomeEmpty />
      ) : (
        <PageNavContent scrollRef={scrollRef}>
          <Box direction="Column" gap="300">
            {/* Instagram Connect Button - only show if not connected */}
            <InstagramConnectSection />

            {/* Instagram DM List - only show if connected */}
            {isInstagramConnected && <InstagramDMList />}

            {/* <NavCategory>
              <NavItem variant="Background" radii="400">
                <NavButton onClick={() => openCreateRoom()}>
                  <NavItemContent>
                    <Box as="span" grow="Yes" alignItems="Center" gap="200">
                      <Avatar size="200" radii="400">
                        <Icon src={Icons.Plus} size="100" />
                      </Avatar>
                      <Box as="span" grow="Yes">
                        <Text as="span" size="Inherit" truncate>
                          Create Room
                        </Text>
                      </Box>
                    </Box>
                  </NavItemContent>
                </NavButton>
              </NavItem>
              <NavItem variant="Background" radii="400">
                <NavButton onClick={() => openJoinAlias()}>
                  <NavItemContent>
                    <Box as="span" grow="Yes" alignItems="Center" gap="200">
                      <Avatar size="200" radii="400">
                        <Icon src={Icons.Link} size="100" />
                      </Avatar>
                      <Box as="span" grow="Yes">
                        <Text as="span" size="Inherit" truncate>
                          Join with Address
                        </Text>
                      </Box>
                    </Box>
                  </NavItemContent>
                </NavButton>
              </NavItem>
              <NavItem variant="Background" radii="400" aria-selected={searchSelected}>
                <NavLink to={getHomeSearchPath()}>
                  <NavItemContent>
                    <Box as="span" grow="Yes" alignItems="Center" gap="200">
                      <Avatar size="200" radii="400">
                        <Icon src={Icons.Search} size="100" filled={searchSelected} />
                      </Avatar>
                      <Box as="span" grow="Yes">
                        <Text as="span" size="Inherit" truncate>
                          Message Search
                        </Text>
                      </Box>
                    </Box>
                  </NavItemContent>
                </NavLink>
              </NavItem>
            </NavCategory> */}
            <NavCategory>
              <NavCategoryHeader>
                <RoomNavCategoryButton
                  closed={closedCategories.has(DEFAULT_CATEGORY_ID)}
                  data-category-id={DEFAULT_CATEGORY_ID}
                  onClick={handleCategoryClick}
                >
                  Rooms
                </RoomNavCategoryButton>
              </NavCategoryHeader>
              <div
                style={{
                  position: 'relative',
                  height: virtualizer.getTotalSize(),
                }}
              >
                {virtualizer.getVirtualItems().map((vItem) => {
                  const roomId = sortedRooms[vItem.index];
                  const room = mx.getRoom(roomId);
                  if (!room) return null;
                  const selected = selectedRoomId === roomId;

                  return (
                    <VirtualTile
                      virtualItem={vItem}
                      key={vItem.index}
                      ref={virtualizer.measureElement}
                    >
                      <RoomNavItem
                        room={room}
                        selected={selected}
                        linkPath={getHomeRoomPath(getCanonicalAliasOrRoomId(mx, roomId))}
                        notificationMode={getRoomNotificationMode(
                          notificationPreferences,
                          room.roomId
                        )}
                      />
                    </VirtualTile>
                  );
                })}
              </div>
            </NavCategory>
          </Box>
        </PageNavContent>
      )}
    </PageNav>
  );
}
