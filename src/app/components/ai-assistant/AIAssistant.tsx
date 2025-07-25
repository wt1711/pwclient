import React, { useState } from 'react';
import { Avatar, Box, Header, Icon, IconButton, Icons, Input, Scroll, Text, Spinner } from 'folds';
import { useSetSetting } from '../../state/hooks/settings';
import { settingsAtom } from '../../state/settings';
import * as css from './AIAssistant.css';
import { getOpenAISuggestion } from './ai';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { useRoom } from '../../hooks/useRoom';

// type Message = {
//   sender: string;
//   text: string;
//   timestamp: string;
//   is_from_me: boolean;
// };

type ChatMessage = {
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
};

type AIAssistantProps = {
  message: string;
};

function EmptyState() {
  return (
    <Box
      grow="Yes"
      direction="Column"
      justifyContent="Center"
      alignItems="Center"
      gap="200"
      style={{ height: '100%' }}
    >
      <Avatar size="400">
        <Icon src={Icons.User} size="400" />
      </Avatar>
      <Text size="H4">Hỏi Wingman ngay</Text>
      <Text align="Center" style={{ maxWidth: '200px' }}>
        Nhấp vào một tin nhắn để nhận gợi ý, hoặc hỏi Wingman một câu hỏi chung.
      </Text>
    </Box>
  );
}

export function AIAssistant({ message }: AIAssistantProps) {
  const [inputValue, setInputValue] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const setAiDrawer = useSetSetting(settingsAtom, 'isAiDrawerOpen');
  const mx = useMatrixClient();
  const room = useRoom();
  const timeline = room.getLiveTimeline().getEvents();

  const context = timeline
    .filter((event) => event.getSender() && event.getContent().body)
    .map((event) => ({
      sender: event.getSender() as string,
      text: event.getContent().body as string,
      timestamp: new Date(event.getTs()).toISOString(),
      is_from_me: event.getSender() === mx.getUserId(),
    }));

  const handleSend = async () => {
    if (inputValue.trim() === '') return;

    const newUserMessage: ChatMessage = {
      sender: 'user',
      text: inputValue,
      timestamp: Date.now(),
    };
    setChatHistory((prev) => [...prev, newUserMessage]);
    setInputValue('');
    setIsLoading(true);

    const aiResponseText = await getOpenAISuggestion(
      context,
      { text: message, sender: 'other', is_from_me: false, timestamp: '' }, // mock selectedMessage
      newUserMessage.text
    );

    const aiResponse: ChatMessage = {
      sender: 'ai',
      text: aiResponseText,
      timestamp: Date.now(),
    };
    setChatHistory((prev) => [...prev, aiResponse]);
    setIsLoading(false);
  };

  const showEmptyState = chatHistory.length === 0 && !message;

  return (
    <Box className={css.AIAssistant} shrink="No" direction="Column">
      <Header variant="Surface" size="600">
        <Box grow="Yes" alignItems="Center" gap="200">
          <Avatar size="200">
            <Icon src={Icons.User} />
          </Avatar>
          <Text size="T400">Wingman AI</Text>
        </Box>
        <IconButton size="300" onClick={() => setAiDrawer(false)} radii="300">
          <Icon src={Icons.Cross} />
        </IconButton>
      </Header>
      <Box grow="Yes" direction="Column" style={{ position: 'relative', overflow: 'hidden' }}>
        <Scroll variant="Background" visibility="Hover">
          <Box direction="Column" gap="400" style={{ padding: '16px', minHeight: '100%' }}>
            {showEmptyState ? (
              <EmptyState />
            ) : (
              <>
                <Box direction="Column" gap="200">
                  <Text size="L400" style={{ fontWeight: 'bold' }}>
                    Original Message:
                  </Text>
                  <Text>{message}</Text>
                </Box>
                <Box direction="Column" gap="200">
                  {chatHistory.map((chat) => (
                    <Box key={chat.timestamp} alignSelf={chat.sender === 'user' ? 'End' : 'Start'}>
                      <Box
                        style={{
                          padding: '8px 12px',
                          borderRadius: '12px',
                          color: chat.sender === 'user' ? '#000' : '#fff',
                          backgroundColor: chat.sender === 'user' ? '#e0e0e0' : '#262626',
                        }}
                      >
                        <Text>{chat.text}</Text>
                      </Box>
                    </Box>
                  ))}
                  {isLoading && (
                    <Box alignSelf="Start">
                      <Spinner size="200" />
                    </Box>
                  )}
                </Box>
              </>
            )}
          </Box>
        </Scroll>
      </Box>
      <Box style={{ padding: '16px' }} direction="Row" gap="200" alignItems="Center">
        <Input
          variant="Background"
          value={inputValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
          onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') handleSend();
          }}
          placeholder="Hỏi Wingman ở đây..."
          style={{ flexGrow: 1 }}
        />
        <IconButton
          variant="Primary"
          onClick={handleSend}
          disabled={isLoading || !inputValue.trim()}
        >
          <Icon src={Icons.Send} />
        </IconButton>
      </Box>
    </Box>
  );
}
