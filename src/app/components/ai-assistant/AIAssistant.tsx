import React, { useState } from 'react';
import {
  Avatar,
  Box,
  Header,
  Icon,
  IconButton,
  Icons,
  Input,
  Scroll,
  Text,
  Spinner,
  Button,
} from 'folds';
import { useSetSetting } from '../../state/hooks/settings';
import { settingsAtom } from '../../state/settings';
import * as css from './AIAssistant.css';
import wingmanPFP from './wingman.png';

type ChatWithAIAssistantMessage = {
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

export function AIAssistant({ message }: AIAssistantProps) {
  const [inputValue, setInputValue] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatWithAIAssistantMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedResponse, setGeneratedResponse] = useState('');
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const setAiDrawer = useSetSetting(settingsAtom, 'isAiDrawerOpen');

  const generateNewResponse = () => {
    setIsGeneratingResponse(true);

    // Mock response generation
    setTimeout(() => {
      const mockResponses = [
        'Dạ vâng, chị cứ đến nhé! Em rất mong được gặp chị. Đường về hơi kẹt một chút, nhưng em sẽ ở nhà chờ chị.',
        'Không có gì ạ! Em rất vui được giúp đỡ chị. Nếu chị cần gì thêm, cứ nhắn em nhé!',
        'Em nghĩ chị nên đi lúc 7 giờ tối sẽ phù hợp nhất. Lúc đó đường cũng bớt kẹt hơn.',
        'Dạ vâng, em hiểu rồi ạ. Em sẽ chuẩn bị sẵn sàng cho chị.',
        'Cảm ơn chị đã thông báo! Em sẽ đợi chị ở nhà.',
        'Chị cứ yên tâm đi, em sẽ lo mọi thứ ạ!',
      ];

      const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      setGeneratedResponse(randomResponse);
      setIsGeneratingResponse(false);
    }, 1000);
  };

  const useSuggestion = () => {
    if (generatedResponse) {
      // Mock: Insert generated response into main chat input
      console.log('Using suggestion:', generatedResponse);
      // TODO: Implement actual insertion into main chat input
    }
  };

  const handleSend = async () => {
    if (inputValue.trim() === '') return;

    const newUserMessage: ChatWithAIAssistantMessage = {
      sender: 'user',
      text: inputValue,
      timestamp: Date.now(),
    };
    setChatHistory((prev) => [...prev, newUserMessage]);
    setInputValue('');
    setIsLoading(true);

    // Mock AI response generation
    setTimeout(() => {
      let mockResponse = '';

      // Generate contextually relevant mock responses
      if (
        inputValue.toLowerCase().includes('gợi ý') ||
        inputValue.toLowerCase().includes('suggestion')
      ) {
        mockResponse =
          'Dạ vâng, chị cứ đến nhé! Em rất mong được gặp chị. Đường về hơi kẹt một chút, nhưng em sẽ ở nhà chờ chị.';
      } else if (
        inputValue.toLowerCase().includes('cảm ơn') ||
        inputValue.toLowerCase().includes('thank')
      ) {
        mockResponse =
          'Không có gì ạ! Em rất vui được giúp đỡ chị. Nếu chị cần gì thêm, cứ nhắn em nhé!';
      } else if (
        inputValue.toLowerCase().includes('thời gian') ||
        inputValue.toLowerCase().includes('time')
      ) {
        mockResponse =
          'Em nghĩ chị nên đi lúc 7 giờ tối sẽ phù hợp nhất. Lúc đó đường cũng bớt kẹt hơn.';
      } else {
        mockResponse = `Cảm ơn chị đã hỏi! Dựa trên cuộc hội thoại, em nghĩ chị có thể trả lời: "Dạ vâng, em hiểu rồi ạ. Em sẽ chuẩn bị sẵn sàng cho chị."`;
      }

      const aiResponse: ChatWithAIAssistantMessage = {
        sender: 'ai',
        text: mockResponse,
        timestamp: Date.now(),
      };
      setChatHistory((prev) => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const showEmptyState = chatHistory.length === 0 && !message && !generatedResponse;

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
                {message && (
                  <Box direction="Column" gap="200">
                    <Text size="L400" style={{ fontWeight: 'bold' }}>
                      Original Message:
                    </Text>
                    <Text>{message}</Text>
                  </Box>
                )}

                {/* Generated Response Box */}
                <Box
                  direction="Column"
                  gap="200"
                  style={{
                    padding: '16px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0',
                  }}
                >
                  <Text size="L400" style={{ fontWeight: 'bold' }}>
                    GỢI Ý CHO TIN NHẮN:
                  </Text>
                  {generatedResponse ? (
                    <Box direction="Column" gap="200">
                      <Text
                        style={{ padding: '12px', backgroundColor: 'white', borderRadius: '6px' }}
                      >
                        {generatedResponse}
                      </Text>
                      <Box direction="Row" gap="200">
                        <Button
                          variant="Primary"
                          onClick={useSuggestion}
                          disabled={!generatedResponse}
                        >
                          <Text size="B400">Dùng gợi ý</Text>
                        </Button>
                        <Button
                          variant="Secondary"
                          onClick={generateNewResponse}
                          disabled={isGeneratingResponse}
                        >
                          <Text size="B400">Tạo gợi ý mới</Text>
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Box direction="Column" gap="200" alignItems="Center">
                      <Text size="T400" style={{ color: '#666' }}>
                        Chưa có gợi ý nào được tạo
                      </Text>
                      <Button
                        variant="Primary"
                        onClick={generateNewResponse}
                        disabled={isGeneratingResponse}
                      >
                        {isGeneratingResponse ? (
                          <Spinner size="200" />
                        ) : (
                          <Text size="B400">Tạo gợi ý mới</Text>
                        )}
                      </Button>
                    </Box>
                  )}
                </Box>

                {/* Chat History */}
                {chatHistory.length > 0 && (
                  <Box direction="Column" gap="200">
                    <Text size="L400" style={{ fontWeight: 'bold' }}>
                      Lịch sử trò chuyện:
                    </Text>
                    {chatHistory.map((chat) => (
                      <Box
                        key={chat.timestamp}
                        alignSelf={chat.sender === 'user' ? 'End' : 'Start'}
                      >
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
                )}
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
