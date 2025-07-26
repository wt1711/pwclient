import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo,
  useCallback,
  useEffect,
} from 'react';
import { generateResponse, getOpenAIConsultation } from './ai';
import { useRoom } from '../../hooks/useRoom';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { useRoomEditor } from '../../features/room/RoomEditorContext';
import { useRoomMessage } from '../../features/room/RoomMessageContext';

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

export const isFromMe = (sender: string, userId: string) => {
  const userList = [
    '100008370333450',
    '100079978062886',
    'lovefish49',
    '17842384556897595',
    'u005',
  ];
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
  const timeline = room.getLiveTimeline().getEvents();
  const roomContext = timeline
    .filter((event) => event.getSender() && event.getContent().body)
    .map((event) => ({
      sender: event.getSender() as string,
      text: event.getContent().body as string,
      timestamp: new Date(event.getTs()).toISOString(),
      is_from_me: isFromMe(event.getSender() as string, mx.getUserId() as string),
    }));
  const lastNonUserMsg = [...roomContext].reverse().find((msg) => !msg.is_from_me);
  const msgToGetResponse = useMemo(
    () =>
      lastNonUserMsg || {
        sender: 'system',
        text: 'Nói gì cũng được',
        timestamp: new Date().toISOString(),
        is_from_me: false,
      },
    [lastNonUserMsg]
  );
  const { selectedMessage } = useRoomMessage();
  const msgToGetConsultation = selectedMessage || msgToGetResponse;
  console.log('selectedMessage', selectedMessage);
  // const selectedMsgObject = selectedMessage?.text
  //   ? parseSelectedMessage(selectedMessage, mx.getUserId() as string)
  //   : null;

  useEffect(() => {
    if (selectedMessage?.text) {
      setInputValue(selectedMessage.text);
    }
  }, [selectedMessage]);

  const generateNewResponse = useCallback(async () => {
    setIsGeneratingResponse(true);

    try {
      // Get the actual room conversation from timeline

      // Find the last message in the room conversation that is not from the current user
      const message = lastNonUserMsg ? lastNonUserMsg.text : 'Nói gì cũng được';

      const response = await generateResponse({ message, context: roomContext });
      setGeneratedResponse(response);
    } catch (error) {
      console.error('Error generating response:', error);
      setGeneratedResponse('Xin lỗi, đã có lỗi khi tạo phản hồi.');
    } finally {
      setIsGeneratingResponse(false);
    }
  }, [roomContext, lastNonUserMsg]);

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

    try {
      // Get the actual room conversation from timeline

      // Find the last message in the room conversation that is not from the current user

      const response = await getOpenAIConsultation({
        context: roomContext,
        selectedMessage: msgToGetConsultation,
        question: inputValue,
      });

      const aiResponse: ChatWithAIAssistantMessage = {
        sender: 'ai',
        text: response,
        timestamp: Date.now(),
      };
      setChatHistory((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error getting AI consultation:', error);
      const errorResponse: ChatWithAIAssistantMessage = {
        sender: 'ai',
        text: 'Xin lỗi, đã có lỗi khi xử lý yêu cầu của bạn.',
        timestamp: Date.now(),
      };
      setChatHistory((prev) => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, roomContext, msgToGetConsultation]);

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
