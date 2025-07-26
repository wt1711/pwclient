import React from 'react';
import { Avatar, Box, Header, Icon, IconButton, Icons, Input, Scroll, Text } from 'folds';
import { useSetSetting } from '../../state/hooks/settings';
import { settingsAtom } from '../../state/settings';
import * as css from './AIAssistant.css';
import wingmanPFP from './wingman.png';
import { GeneratedResponseBox } from './GeneratedResponseBox';
import { ChatHistory } from './ChatHistory';
import { AIAssistantProvider, useAIAssistant } from './AIAssistantContext';

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
      <Avatar size="500">
        <img src={wingmanPFP} alt="Wingman" style={{ width: '100%', height: '100%' }} />
      </Avatar>
      <Text size="H4">Hỏi Wingman ngay</Text>
      <Text align="Center" style={{ maxWidth: '300px' }}>
        Nhận gợi ý hoặc phân tích về cuộc hội thoại từ Wingman
      </Text>
    </Box>
  );
}

function AIAssistantContent() {
  const { inputValue, setInputValue, handleSend, chatHistory, isLoading } = useAIAssistant();
  const setAiDrawer = useSetSetting(settingsAtom, 'isAiDrawerOpen');

  const showEmptyState = chatHistory.length === 0;

  return (
    <Box className={css.AIAssistant} shrink="No" direction="Column">
      <Header variant="Surface" size="600">
        <Box grow="Yes" alignItems="Center" gap="200">
          <Avatar size="200">
            <img
              src={wingmanPFP}
              alt="Wingman"
              style={{ width: '100%', height: '100%', marginLeft: '10px' }}
            />
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
                {/* Generated Response Box */}
                <GeneratedResponseBox />

                {/* Chat History */}
                <ChatHistory />
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

export function AIAssistant({ message }: AIAssistantProps) {
  return (
    <AIAssistantProvider message={message}>
      <AIAssistantContent />
    </AIAssistantProvider>
  );
}
