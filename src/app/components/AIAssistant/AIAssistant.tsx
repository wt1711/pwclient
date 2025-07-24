import React, { useState } from 'react';
import { Avatar, Box, Header, Icon, IconButton, Icons, Input, Scroll, Text, Spinner } from 'folds';
import { useSetSetting } from '../../state/hooks/settings';
import { settingsAtom } from '../../state/settings';
import * as css from './AIAssistant.css';
import { SuggestionBox } from './SuggestionBox';
import { EmptyState } from './EmptyState';
import { AIQuestionInput } from './AIQuestionInput';
import { AIAssistantChatMessage } from './AIAssistantChatMessage';

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
                <SuggestionBox content={message} />
                <Box direction="Column" gap="200">
                  {chatHistory.map((chat) => (
                    <AIAssistantChatMessage key={chat.timestamp} chat={chat} />
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
      <AIQuestionInput
        inputValue={inputValue}
        setInputValue={setInputValue}
        handleSend={handleSend}
        isLoading={isLoading}
      />
    </Box>
  );
}
