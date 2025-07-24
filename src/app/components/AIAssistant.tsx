import React, { useState } from 'react';
import { Box, Button, Header, Icon, IconButton, Icons, Input, Text, Spinner } from 'folds';
import * as css from './AIAssistant.css';
import { useSetSetting } from '../state/hooks/settings';
import { settingsAtom } from '../state/settings';

type ChatMessage = {
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
};

type AIAssistantProps = {
  message: string;
};

export function AIAssistant({ message }: AIAssistantProps) {
  const [inputValue, setInputValue] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const setAiDrawer = useSetSetting(settingsAtom, 'isAiDrawerOpen');

  const handleSend = () => {
    if (inputValue.trim() === '') return;

    const newUserMessage: ChatMessage = {
      sender: 'user',
      text: inputValue,
      timestamp: Date.now(),
    };
    setChatHistory((prev) => [...prev, newUserMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        sender: 'ai',
        text: `This is a simulated response to: "${inputValue}" for the message: "${message}"`,
        timestamp: Date.now(),
      };
      setChatHistory((prev) => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <Box className={css.AIAssistant} shrink="No" direction="Column">
      <Header variant="Surface" size="500">
        <Box grow="Yes">
          <Text size="H4">AI Assistant</Text>
        </Box>
        <IconButton size="300" onClick={() => setAiDrawer(false)} radii="300">
          <Icon src={Icons.Cross} />
        </IconButton>
      </Header>
      <Box
        style={{ padding: '16px', maxHeight: '400px', overflowY: 'auto' }}
        direction="Column"
        gap="400"
      >
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
                  backgroundColor: chat.sender === 'user' ? '#e0e0e0' : '#f0f0f0',
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
      </Box>
      <Box style={{ padding: '16px' }} direction="Row" gap="200" alignItems="Center">
        <Input
          variant="Background"
          value={inputValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
          onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') handleSend();
          }}
          placeholder="Ask a question..."
          style={{ flexGrow: 1 }}
        />
        <Button onClick={handleSend} disabled={isLoading}>
          Send
        </Button>
      </Box>
    </Box>
  );
}
