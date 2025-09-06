import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';
import {
  generateResponseFromMessage,
  generateResponseFromHistory,
  getOpenAIConsultation,
} from './ai';
import { useRoom } from '../../hooks/useRoom';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { useRoomEditor } from '../room/RoomEditorContext';
import { useRoomMessage } from '../room/RoomMessageContext';
import { useSetSetting } from '../../state/hooks/settings';
import { settingsAtom } from '../../state/settings';
import { isFromMe } from './utils';

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
  isMobile: boolean;
  isAIAssistantOpen: boolean;
  locale: string;

  // Actions
  setInputValue: (value: string) => void;
  handleSend: () => void;
  generateNewResponseFromMessage: () => void;
  generateNewResponseFromHistory: () => void;
  handleUseSuggestion: (response: string) => void;
  clearChatHistory: () => void;
  toggleAIAssistant: (isOpen?: boolean) => void;
};

const AIAssistantContext = createContext<AIAssistantContextType | undefined>(undefined);

type AIAssistantProviderProps = {
  children: ReactNode;
  isMobile: boolean;
};

export function AIAssistantProvider({ children, isMobile }: AIAssistantProviderProps) {
  const locale = 'EN';
  const [inputValue, setInputValue] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatWithAIAssistantMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedResponse, setGeneratedResponse] = useState('');
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const room = useRoom();
  const mx = useMatrixClient();
  const { insertText, deleteText } = useRoomEditor();
  const setIsAiDrawer = useSetSetting(settingsAtom, 'isAiDrawerOpen');
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

  const handleUseSuggestion = useCallback(
    (response: string) => {
      if (response) {
        let cleanedResponse = response.trim();
        if (
          (cleanedResponse.startsWith('"') && cleanedResponse.endsWith('"')) ||
          (cleanedResponse.startsWith("'") && cleanedResponse.endsWith("'"))
        ) {
          cleanedResponse = cleanedResponse.substring(1, cleanedResponse.length - 1);
        }
        deleteText();
        insertText(cleanedResponse);
        if (isMobile) {
          setIsAiDrawer(false);
        }
      }
    },
    [insertText, deleteText, isMobile, setIsAiDrawer]
  );

  const toggleAIAssistant = useCallback((isOpen?: boolean) => {
    setIsAIAssistantOpen((prev) => {
      const newIsOpen = isOpen ?? !prev;
      if (!newIsOpen) {
        setGeneratedResponse('');
      }
      return newIsOpen;
    });
  }, []);

  const generateNewResponseFromMessage = useCallback(async () => {
    setIsGeneratingResponse(true);
    toggleAIAssistant(true);

    try {
      // Get the actual room conversation from timeline

      // Find the last message in the room conversation that is not from the current user
      const message = lastNonUserMsg ? lastNonUserMsg.text : 'Nói gì cũng được';

      const response = await generateResponseFromMessage({ message, context: roomContext });
      setGeneratedResponse(response);
    } catch (error) {
      setGeneratedResponse('Xin lỗi, đã có lỗi');
    } finally {
      setIsGeneratingResponse(false);
    }
  }, [roomContext, lastNonUserMsg, toggleAIAssistant]);

  const generateNewResponseFromHistory = useCallback(async () => {
    setIsGeneratingResponse(true);
    toggleAIAssistant(true);

    try {
      // Get the actual room conversation from timeline

      // Find the last message in the room conversation that is not from the current user

      const response = await generateResponseFromHistory({ context: roomContext });
      setGeneratedResponse(response);
    } catch (error) {
      setGeneratedResponse('Xin lỗi, đã có lỗi');
    } finally {
      setIsGeneratingResponse(false);
    }
  }, [roomContext, toggleAIAssistant]);

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
      isMobile,
      isAIAssistantOpen,
      locale,

      // Actions
      setInputValue,
      handleSend,
      generateNewResponseFromMessage,
      generateNewResponseFromHistory,
      handleUseSuggestion,
      clearChatHistory,
      toggleAIAssistant,
    }),
    [
      inputValue,
      chatHistory,
      isLoading,
      generatedResponse,
      isGeneratingResponse,
      isMobile,
      isAIAssistantOpen,
      handleSend,
      generateNewResponseFromMessage,
      generateNewResponseFromHistory,
      handleUseSuggestion,
      toggleAIAssistant,
      locale,
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
