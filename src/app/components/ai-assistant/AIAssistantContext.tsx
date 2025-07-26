import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';
import { generateResponse } from './ai';

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

export function AIAssistantProvider({ children }: AIAssistantProviderProps) {
  const [inputValue, setInputValue] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatWithAIAssistantMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedResponse, setGeneratedResponse] = useState('');
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);

  const generateNewResponse = async () => {
    setIsGeneratingResponse(true);

    try {
      // Mock message for now - will be hooked up later
      const mockMessage = 'Do you know anything about fish?';
      const response = await generateResponse(mockMessage);
      setGeneratedResponse(response);
    } catch (error) {
      console.error('Error generating response:', error);
      setGeneratedResponse('Xin lỗi, đã có lỗi khi tạo phản hồi.');
    } finally {
      setIsGeneratingResponse(false);
    }
  };

  const handleUseSuggestion = (response: string) => {
    // Mock: Insert generated response into main chat input
    console.log('Using suggestion:', response);
    // TODO: Implement actual insertion into main chat input
  };

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
    [inputValue, chatHistory, isLoading, generatedResponse, isGeneratingResponse, handleSend]
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
