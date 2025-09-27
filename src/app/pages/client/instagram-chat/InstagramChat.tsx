import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWebSocket } from '../../../hooks/useWebSocket';
import {
  Avatar,
  Box,
  Button,
  Header,
  Icon,
  IconButton,
  Icons,
  Scroll,
  Spinner,
  Text,
} from 'folds';
import { createEditor } from 'slate';
import { withReact } from 'slate-react';
import { withHistory } from 'slate-history';
import { Room } from 'matrix-js-sdk';
import {
  fetchInstagramMessages,
  sendInstagramMessage,
  markInstagramContactAsRead,
  getInstagramProfile,
  InstagramMessage,
  InstagramContact,
} from '../../../services/instagramApi';
import { RoomInput } from '../../../features/room/room-input/RoomInput';
import { RoomInputProvider } from '../../../features/room/room-input/RoomInputContext';
import { BlockType } from '../../../components/editor/types';
import { PowerLevelTag, GetPowerLevelTag } from '../../../hooks/usePowerLevelTags';
import { ThemeKind } from '../../../hooks/useTheme';
import { accessibleColor } from '../../../plugins/color';
import { PowerLevelsContextProvider, IPowerLevels } from '../../../hooks/usePowerLevels';
import { AIAssistantProvider } from '../../../features/ai-assistant/AIAssistantContext';
import { RoomProvider } from '../../../hooks/useRoom';
import { RoomEditorProvider } from '../../../features/room/RoomEditorContext';
import { RoomMessageProvider } from '../../../features/room/RoomMessageContext';
import { MatrixClientProvider } from '../../../hooks/useMatrixClient';
import { MatrixClient } from 'matrix-js-sdk';
import cons from '~/client/state/cons';

interface InstagramChatProps {
  id: string;
}

// Helper functions for RoomInput dependencies
const withInline = (editor: any) => {
  const { isInline } = editor;
  editor.isInline = (element: any) =>
    [BlockType.Mention, BlockType.Emoticon, BlockType.Link, BlockType.Command].includes(
      element.type
    ) || isInline(element);
  return editor;
};

const withVoid = (editor: any) => {
  const { isVoid } = editor;
  editor.isVoid = (element: any) =>
    [BlockType.Mention, BlockType.Emoticon, BlockType.Command].includes(element.type) ||
    isVoid(element);
  return editor;
};

// Mock MatrixClient for Instagram chat
const createMockMatrixClient = (handleSendMessage: (text: string) => Promise<void>): MatrixClient => {
  const mockClient = {
    sendMessage: async (roomId: string, content: any) => {
      console.log('Mock sendMessage called:', { roomId, content });
      
      // Extract text from Matrix message content
      let messageText = '';
      if (typeof content === 'string') {
        messageText = content;
      } else if (content && typeof content === 'object') {
        messageText = content.body || content.formatted_body || '';
      }
      
      if (messageText.trim()) {
        // Call the actual Instagram message sending function
        await handleSendMessage(messageText.trim());
      }
      
      // Simulate successful message sending
      return Promise.resolve({ event_id: `$${Date.now()}:mock.matrix.org` });
    },
    getUserId: () => localStorage.getItem(cons.secretKey.USER_ID) || '@instagram_user:mock.matrix.org',
    getRoom: (roomId: string) => null,
    on: () => {},
    removeListener: () => {},
    // Add other required methods as stubs
    startClient: () => Promise.resolve(),
    stopClient: () => {},
    clearStores: () => Promise.resolve(),
  } as unknown as MatrixClient;
  return mockClient;
};

// Mock Room object for Instagram chat
const createMockRoom = (roomId: string): Room => {
  const mockRoom = {
    roomId,
    name: 'Instagram Chat',
    getMembers: () => [],
    getMember: () => null,
    getMyMembership: () => 'join',
    getJoinedMemberCount: () => 2,
    accountData: new Map(),
    currentState: {
      getStateEvents: () => null,
    },
    on: () => {},
    removeListener: () => {},
  } as unknown as Room;
  return mockRoom;
};

// Default power level tags for Instagram chat
const DEFAULT_POWER_LEVEL_TAGS = {
  0: {
    name: 'Member',
    color: '#91cfdf',
  },
};

// Mock power levels for Instagram chat
const MOCK_POWER_LEVELS: IPowerLevels = {
  users_default: 0,
  state_default: 50,
  events_default: 0,
  invite: 0,
  redact: 50,
  kick: 50,
  ban: 50,
  historical: 0,
  events: {},
  users: {},
  notifications: {
    room: 50,
  },
};

export function InstagramChat() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<InstagramMessage[]>([]);
  const [contact, setContact] = useState<InstagramContact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadInterval, setReloadInterval] = useState<number>(30); // seconds
  const [isAutoReloadEnabled, setIsAutoReloadEnabled] = useState<boolean>(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileDropContainerRef = useRef<HTMLDivElement>(null);
  const reloadIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentUserId = localStorage.getItem('instagram_user_id');

  // WebSocket connection for real-time messaging
  const {
    isConnected: wsConnected,
    isConnecting: wsConnecting,
    error: wsError,
    sendMessage: wsSendMessage,
    connect: wsConnect,
    disconnect: wsDisconnect,
  } = useWebSocket({
    url: `${import.meta.env.VITE_WS_BASE_URL}/ws`,
    maxReconnectAttempts: 3,
    reconnectInterval: 5000, // 5 seconds between reconnection attempts
    onMessage: (message: any) => {
      console.log('Received WebSocket message:', message);
      console.log('Current chat ID:', id);
      
      // Handle different message types
      if (message.type === 'new_message' && message.data) {
        const newMessage: InstagramMessage = message.data;
        console.log('New message contactId:', newMessage.contactId, 'Current ID:', id);
        
        // Only add message if it's for the current chat
        if (newMessage.contactId === id) {
          console.log('Adding message to chat:', newMessage);
          setMessages(prev => {
            // Check if message already exists to avoid duplicates
            const exists = prev.some(msg => msg.id === newMessage.id);
            if (!exists) {
              console.log('Message added successfully');
              return [...prev, newMessage];
            }
            console.log('Message already exists, skipping');
            return prev;
          });
        } else {
          console.log('Message not for current chat, ignoring');
        }
      } else {
        console.log('Message type not handled:', message.type);
      }
    },
    onConnect: () => {
      console.log('WebSocket connected for Instagram chat');
    },
    onDisconnect: () => {
      console.log('WebSocket disconnected from Instagram chat');
    },
    onError: (error: Event) => {
      console.error('WebSocket error in Instagram chat:', error);
    },
  });

  // Create Slate editor for RoomInput
  const editor = useMemo(
    () => withInline(withVoid(withReact(withHistory(createEditor())))),
    []
  );

  // Handle sending messages to Instagram API
  const handleSendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || !id || isSending) return;

    const text = messageText.trim();
    setIsSending(true);

    try {
      // Optimistically add message to UI
      const optimisticMessage: InstagramMessage = {
        id: `temp-${Date.now()}`,
        contactId: id,
        userId: currentUserId || '',
        text,
        timestamp: new Date().toISOString(),
        messageType: 'text',
        isFromMe: true,
      };
      setMessages(prev => [...prev, optimisticMessage]);

      // Send message to API
      await sendInstagramMessage(id, text);
      
      // Send message through WebSocket for real-time delivery
      if (wsConnected) {
        wsSendMessage({
          type: 'send_message',
          data: {
            contactId: id,
            text: text,
            messageType: 'text'
          }
        });
      }
      
      // Refresh messages to get the actual message from server
      const updatedData = await fetchInstagramMessages(id);
      setMessages(updatedData.messages);
    } catch (err) {
      console.error('Failed to send message:', err);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
      setError('Failed to send message');
    } finally {
      setIsSending(false);
    }
  }, [id, isSending, currentUserId, wsConnected, wsSendMessage]);

  // Create mock MatrixClient and Room objects
  const mockMatrixClient = useMemo(() => createMockMatrixClient(handleSendMessage), [handleSendMessage]);
  const room = useMemo(() => createMockRoom(id || 'instagram-chat'), [id]);

  // Create GetPowerLevelTag function
  const getPowerLevelTag: GetPowerLevelTag = useCallback(
    (powerLevel: number): PowerLevelTag => {
      return DEFAULT_POWER_LEVEL_TAGS[powerLevel as keyof typeof DEFAULT_POWER_LEVEL_TAGS] || {
        name: 'Member',
        color: '#91cfdf',
      };
    },
    []
  );

  // Create accessible tag colors
  const accessibleTagColors = useMemo(() => {
    const colors = new Map<string, string>();
    Object.values(DEFAULT_POWER_LEVEL_TAGS).forEach((tag) => {
      if (tag.color) {
        colors.set(tag.color, accessibleColor(ThemeKind.Dark, tag.color));
      }
    });
    return colors;
  }, []);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      wsDisconnect();
    };
  }, [wsDisconnect]);

  // Load messages and contact info
  useEffect(() => {
    if (!id) return;

    const loadChatData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch messages
        const fetchedData = await fetchInstagramMessages(id);
        setMessages(fetchedData.messages);
        
        // Get contact info from first message that's not from current user
        const otherUserMessage = fetchedData.messages.find(msg => msg.userId !== currentUserId);
        if (otherUserMessage) {
          const contactProfile = await getInstagramProfile();
          setContact(contactProfile);
        }
        
        // Mark contact as read
        await markInstagramContactAsRead(id);
      } catch (err) {
        console.error('Failed to load chat data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load chat');
      } finally {
        setIsLoading(false);
      }
    };

    loadChatData();
  }, [id, currentUserId]);

  // Auto-reload messages at specified interval
  useEffect(() => {
    if (!id || !isAutoReloadEnabled) return;

    const reloadMessages = async () => {
      try {
        const fetchedData = await fetchInstagramMessages(id);
        setMessages(fetchedData.messages);
      } catch (err) {
        console.error('Failed to reload messages:', err);
      }
    };

    // Set up interval for auto-reload
    reloadIntervalRef.current = setInterval(reloadMessages, reloadInterval * 1000);

    // Cleanup interval on unmount or dependency change
    return () => {
      if (reloadIntervalRef.current) {
        clearInterval(reloadIntervalRef.current);
        reloadIntervalRef.current = null;
      }
    };
  }, [id, reloadInterval, isAutoReloadEnabled]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);





  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  if (!id) {
    return (
      <Box grow="Yes" alignItems="Center" justifyContent="Center">
        <Text>Invalid contact ID</Text>
      </Box>
    );
  }

  return (
    <Box grow="Yes" direction="Column" style={{ height: '100vh' }}>
      {/* Header */}
      <Header>
        <Box alignItems="Center" gap="300" style={{ padding: '12px 16px' }}>
          <IconButton
            variant="Background"
            size="300"
            radii="300"
            onClick={() => navigate('/home')}
            aria-label="Back to home"
          >
            <Icon src={Icons.ArrowLeft} size="200" />
          </IconButton>
          
          {contact && (
            <>
              <Avatar size="300" radii="300">
                {contact.profilePicUrl ? (
                  <img 
                    src={contact.profilePicUrl} 
                    alt={contact.fullName || contact.username}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <Icon src={Icons.User} size="200" />
                )}
              </Avatar>
              <Box direction="Column" grow="Yes">
                <Text size="H4" priority="500">
                  {contact.fullName || contact.username}
                </Text>
                {contact.fullName && (
                  <Text size="T200" priority="300">
                    @{contact.username}
                  </Text>
                )}
              </Box>
            </>
          )}
          
          {/* WebSocket Status Indicator */}
          <Box alignItems="Center" gap="200">
            {wsConnecting && (
              <Box alignItems="Center" gap="100">
                <Spinner size="100" />
                <Text size="T200" priority="300">Connecting...</Text>
              </Box>
            )}
            {wsConnected && (
              <Box alignItems="Center" gap="100">
                <Box 
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#4CAF50'
                  }}
                />
                <Text size="T200" priority="300">Live</Text>
              </Box>
            )}
            {wsError && !wsConnected && !wsConnecting && (
              <Box alignItems="Center" gap="100">
                <Icon src={Icons.Warning} size="100" />
                <Text size="T200" priority="300">Offline</Text>
              </Box>
            )}
          </Box>

          {/* Auto-reload Controls - Hidden */}
          {/* <Box alignItems="Center" gap="200">
            <IconButton
              size="300"
              radii="300"
              onClick={() => setIsAutoReloadEnabled(!isAutoReloadEnabled)}
              style={{
                backgroundColor: isAutoReloadEnabled ? '#4CAF50' : 'transparent',
                color: isAutoReloadEnabled ? 'white' : 'inherit'
              }}
            >
              <Icon src={Icons.RecentClock} size="100" />
            </IconButton>
            
            {isAutoReloadEnabled && (
              <Box alignItems="Center" gap="100">
                <Text size="T200" priority="300">
                  {reloadInterval}s
                </Text>
              </Box>
            )}
          </Box> */}
        </Box>
      </Header>

      {/* Messages */}
      <Box grow="Yes" style={{ position: 'relative' }}>
        {isLoading ? (
          <Box grow="Yes" alignItems="Center" justifyContent="Center">
            <Spinner size="400" />
            <Text style={{ marginTop: '16px' }}>Loading messages...</Text>
          </Box>
        ) : error ? (
          <Box grow="Yes" alignItems="Center" justifyContent="Center">
            <Icon src={Icons.Warning} size="400" />
            <Text style={{ marginTop: '16px' }} priority="300">{error}</Text>
            <Button 
              variant="Primary" 
              size="300" 
              style={{ marginTop: '16px' }}
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </Box>
        ) : (
          <Scroll ref={scrollRef} size="0" hideTrack>
            <Box direction="Column" gap="200" style={{ padding: '16px' }}>
              {messages.length === 0 ? (
                <Box alignItems="Center" justifyContent="Center" style={{ padding: '32px' }}>
                  <Text priority="300">No messages yet. Start the conversation!</Text>
                </Box>
              ) : (
                <>
                  {messages.map((message) => {
                    const isFromMe = message.isFromMe || message.userId === currentUserId;
                    
                    return (
                      <Box 
                        key={message.id} 
                        alignSelf={isFromMe ? 'End' : 'Start'}
                        style={{ maxWidth: '70%' }}
                      >
                        <Box
                          direction="Column"
                          gap="100"
                          style={{
                            padding: '8px 12px',
                            borderRadius: '12px',
                            backgroundColor: isFromMe 
                              ? 'var(--bg-primary)' 
                              : 'var(--bg-surface-hover)',
                            color: isFromMe ? 'var(--text-on-primary)' : 'inherit',
                          }}
                        >
                          {message.text && (
                            <Text size="T400">{message.text}</Text>
                          )}
                          {message.mediaUrl && (
                            <img 
                              src={message.mediaUrl} 
                              alt="Media message"
                              style={{ 
                                maxWidth: '200px', 
                                borderRadius: '8px',
                                display: 'block'
                              }}
                            />
                          )}
                          <Text 
                            size="T200" 
                            priority="300"
                            style={{ 
                              alignSelf: 'End',
                              opacity: 0.7,
                              color: isFromMe ? 'var(--text-on-primary)' : 'inherit'
                            }}
                          >
                            {formatMessageTime(message.timestamp)}
                          </Text>
                        </Box>
                      </Box>
                    );
                  })}
                </>
              )}
            </Box>
          </Scroll>
        )}
      </Box>

      {/* Input */}
      <div ref={fileDropContainerRef}>
        <MatrixClientProvider value={mockMatrixClient}>
          <PowerLevelsContextProvider value={MOCK_POWER_LEVELS}>
            <RoomProvider value={room}>
              <RoomEditorProvider>
                <RoomMessageProvider>
                  <AIAssistantProvider isMobile={false}>
                    <RoomInputProvider
                      editor={editor}
                      fileDropContainerRef={fileDropContainerRef}
                      roomId={id || 'instagram-chat'}
                      room={room}
                      getPowerLevelTag={getPowerLevelTag}
                      accessibleTagColors={accessibleTagColors}
                    >
                      <RoomInput
                        editor={editor}
                        fileDropContainerRef={fileDropContainerRef}
                        roomId={id || 'instagram-chat'}
                        room={room}
                        getPowerLevelTag={getPowerLevelTag}
                        accessibleTagColors={accessibleTagColors}
                      />
                    </RoomInputProvider>
                  </AIAssistantProvider>
                </RoomMessageProvider>
              </RoomEditorProvider>
            </RoomProvider>
          </PowerLevelsContextProvider>
        </MatrixClientProvider>
      </div>
    </Box>
  );
}

export default InstagramChat;