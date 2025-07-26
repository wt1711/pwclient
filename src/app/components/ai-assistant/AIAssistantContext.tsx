import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';
import { generateResponse } from './ai';
import { useRoom } from '../../hooks/useRoom';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { useRoomEditor } from '../../features/room/RoomEditorContext';

type ChatWithAIAssistantMessage = {
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
};

type AIAssistantContextType = {
  // State
  inputValue: string;
  chatHistory: ChatWithAIAssistantMessage[];
  isLoading: boolean;
  generatedResponse: string;
  isGeneratingResponse: boolean;

  // Actions
  setInputValue: (value: string) => void;
  handleSend: () => void;
  generateNewResponse: () => void;
  handleUseSuggestion: (response: string) => void;
  clearChatHistory: () => void;
};

const AIAssistantContext = createContext<AIAssistantContextType | undefined>(undefined);

type AIAssistantProviderProps = {
  children: ReactNode;
};

const isFromMe = (sender: string, userId: string) => {
  const userList = ['100008370333450', '100079978062886', 'u004', 'u005'];
  // [FB: Khanh ta, Fb: Wayne Tr, ig: lovefish49, ig: vedup.1711, ig: dtran1004]
  const match = sender.match(/\d+/);
  const extractedSender = match ? match[0] : '';
  if (sender === userId || userList.includes(extractedSender as string)) {
    return true;
  }
  return false;
};

export function AIAssistantProvider({ children }: AIAssistantProviderProps) {
  const [inputValue, setInputValue] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatWithAIAssistantMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedResponse, setGeneratedResponse] = useState('');
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const room = useRoom();
  const mx = useMatrixClient();
  const { insertText } = useRoomEditor();

  const generateNewResponse = useCallback(async () => {
    setIsGeneratingResponse(true);

    try {
      // Get the actual room conversation from timeline
      const timeline = room.getLiveTimeline().getEvents();
      const roomContext = timeline
        .filter((event) => event.getSender() && event.getContent().body)
        .map((event) => ({
          sender: event.getSender() as string,
          text: event.getContent().body as string,
          timestamp: new Date(event.getTs()).toISOString(),
          is_from_me: isFromMe(event.getSender() as string, mx.getUserId() as string),
        }));

      // Find the last message in the room conversation that is not from the current user
      const lastNonUserMsg = [...roomContext].reverse().find((msg) => !msg.is_from_me);
      const message = lastNonUserMsg ? lastNonUserMsg.text : 'Nói gì cũng được';

      const response = await generateResponse({ message, context: roomContext });
      setGeneratedResponse(response);
    } catch (error) {
      console.error('Error generating response:', error);
      setGeneratedResponse('Xin lỗi, đã có lỗi khi tạo phản hồi.');
    } finally {
      setIsGeneratingResponse(false);
    }
  }, [room, mx]);

  const handleUseSuggestion = useCallback(
    (response: string) => {
      if (response) {
        insertText(response);
      }
    },
    [insertText]
  );

  const handleSend = useCallback(async () => {
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
  }, [inputValue]);

  const clearChatHistory = () => {
    setChatHistory([]);
  };

  const value: AIAssistantContextType = useMemo(
    () => ({
      // State
      inputValue,
      chatHistory,
      isLoading,
      generatedResponse,
      isGeneratingResponse,

      // Actions
      setInputValue,
      handleSend,
      generateNewResponse,
      handleUseSuggestion,
      clearChatHistory,
    }),
    [
      inputValue,
      chatHistory,
      isLoading,
      generatedResponse,
      isGeneratingResponse,
      handleSend,
      generateNewResponse,
      handleUseSuggestion,
    ]
  );

  return <AIAssistantContext.Provider value={value}>{children}</AIAssistantContext.Provider>;
}

export function useAIAssistant() {
  const context = useContext(AIAssistantContext);
  if (context === undefined) {
    throw new Error('useAIAssistant must be used within an AIAssistantProvider');
  }
  return context;
}

// Export the type for use in other components
export type { ChatWithAIAssistantMessage };
