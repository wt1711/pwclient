import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import {
  generateResponseFromMessageSSE,
  getOpenAIConsultation,
  gradeMessage,
} from '~/app/features/ai-assistant/utils/ai';
import { useRoom } from '~/app/hooks/useRoom';
import { useMatrixClient } from '~/app/hooks/useMatrixClient';
import { useRoomEditor } from '~/app/features/room/RoomEditorContext';
import { useRoomMessage } from '~/app/features/room/RoomMessageContext';
import { useSetSetting } from '~/app/state/hooks/settings';
import { settingsAtom } from '~/app/state/settings';
import { isFromMe } from '~/app/features/ai-assistant/utils/utils';
import { toneProperties, personas, getReactionGrade } from '~/app/features/ai-assistant/utils/data';

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
  selectedProperty: typeof toneProperties[0];
  selectedPersona: typeof personas[0];
  toneValues: Record<string, number>;
  initialMessageGenerated: boolean;
  prediction: { emoji: string; grade: string; score: number } | null;
  errorMessage: string | null;

  // Actions
  setInputValue: (value: string) => void;
  handleSend: () => void;
  generateInitialResponse: () => void;
  regenerateResponse: () => void;
  handleUseSuggestion: (response: string) => void;
  clearChatHistory: () => void;
  toggleAIAssistant: (isOpen?: boolean) => void;
  setSelectedProperty: (property: typeof toneProperties[0]) => void;
  handleSliderChange: (value: number) => void;
  handlePersonaChange: (persona: typeof personas[0]) => void;
  gradeEditorText: (text: string) => void;
  setErrorMessage: (message: string | null) => void;
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
  const [initialMessageGenerated, setInitialMessageGenerated] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(toneProperties[0]);
  const [selectedPersona, setSelectedPersona] = useState(personas[3]);
  const [toneValues, setToneValues] = useState<Record<string, number>>(
    toneProperties.reduce((acc, prop) => ({ ...acc, [prop.id]: 50 }), {})
  );
  const [prediction, setPrediction] = useState<{
    emoji: string;
    grade: string;
    score: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const room = useRoom();
  const mx = useMatrixClient();
  const { insertText, deleteText } = useRoomEditor();
  const setIsAiDrawer = useSetSetting(settingsAtom, 'isAiDrawerOpen');
  const { selectedMessage } = useRoomMessage();

  // Ref to store SSE abort function for cleanup
  const abortStreamRef = useRef<(() => void) | null>(null);

  // Cleanup on unmount
  useEffect(
    () => () => {
      if (abortStreamRef.current) {
        abortStreamRef.current();
      }
    },
    []
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

  // Call handleUseSuggestion when response is complete
  useEffect(() => {
    if (generatedResponse && !isGeneratingResponse && initialMessageGenerated) {
      handleUseSuggestion(generatedResponse);
    }
  }, [generatedResponse, isGeneratingResponse, initialMessageGenerated, handleUseSuggestion]);

  const generateInitialResponse = useCallback(async () => {
    toggleAIAssistant(true);
  }, [toggleAIAssistant]);

  const regenerateResponse = useCallback(async () => {
    // Cancel any existing stream
    if (abortStreamRef.current) {
      abortStreamRef.current();
    }

    // Reset state and clear previous errors
    setIsGeneratingResponse(true);
    setGeneratedResponse(''); // Clear previous response
    setErrorMessage(null); // Clear previous errors
    deleteText();

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
      const lastNonUserMsg = [...roomContext].reverse().find((msg) => !msg.is_from_me);

      // Find the last message in the room conversation that is not from the current user
      const message = lastNonUserMsg ? lastNonUserMsg.text : 'Nói gì cũng được';

      // Build spec object from state
      const spec = {
        persona: selectedPersona,
        tone: toneValues,
      };

      // Call SSE API client with callbacks
      const abort = generateResponseFromMessageSSE({
        message,
        context: roomContext,
        spec,
        onChunk: (chunk: string) => {
          // Append chunk to state - functional update to avoid stale closure
          setGeneratedResponse((prev) => prev + chunk);
        },
        onError: (error: Error) => {
          // eslint-disable-next-line no-console
          console.error('Stream error:', error);

          // Categorize error and set appropriate message
          let userMessage = 'Sorry, something went wrong. Please try again.';

          if (error.message.includes('Stream connection error')) {
            userMessage = 'Connection lost. Please check your network and try again.';
          } else if (error.message.includes('Failed to initialize SSE connection')) {
            userMessage = 'Failed to connect to AI service. Please try again later.';
          } else if (error.message.includes('network') || error.message.includes('fetch')) {
            userMessage = 'Network error. Please check your connection.';
          }

          setErrorMessage(userMessage);
          setIsGeneratingResponse(false);
        },
        onComplete: () => {
          setIsGeneratingResponse(false);
          setInitialMessageGenerated(true);
        },
      });

      // Store abort function for cleanup
      abortStreamRef.current = abort;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error starting stream:', error);

      // Categorize initialization error
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      let userMessage = 'Failed to start generation. Please try again.';

      if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
        userMessage = 'Network error. Please check your connection.';
      }

      setErrorMessage(userMessage);
      setIsGeneratingResponse(false);
      setInitialMessageGenerated(true);
    }
  }, [room, mx, deleteText, selectedPersona, toneValues]);

  const handleSliderChange = useCallback(
    (value: number) => {
      const newToneValues = {
        ...toneValues,
        [selectedProperty.id]: value,
      };
      setToneValues(newToneValues);
    },
    [toneValues, selectedProperty]
  );

  const handlePersonaChange = useCallback((persona: typeof personas[0]) => {
    setSelectedPersona(persona);
  }, []);

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
      const msgToGetResponse = lastNonUserMsg || {
        sender: 'system',
        text: 'Nói gì cũng được',
        timestamp: new Date().toISOString(),
        is_from_me: false,
      };
      const msgToGetConsultation = selectedMessage || msgToGetResponse;

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
      const errorResponse: ChatWithAIAssistantMessage = {
        sender: 'ai',
        text: 'Xin lỗi, đã có lỗi khi xử lý yêu cầu của bạn.',
        timestamp: Date.now(),
      };
      setChatHistory((prev) => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, room, mx, selectedMessage]);

  const clearChatHistory = () => {
    setChatHistory([]);
  };

  const gradeEditorText = useCallback(
    async (text: string) => {
      if (text.trim().length > 0) {
        const timeline = room.getLiveTimeline().getEvents();
        const roomContext = timeline
          .filter((event) => event.getSender() && event.getContent().body)
          .map((event) => ({
            sender: event.getSender() as string,
            text: event.getContent().body as string,
            timestamp: new Date(event.getTs()).toISOString(),
            is_from_me: isFromMe(event.getSender() as string, mx.getUserId() as string),
          }));

        const score = await gradeMessage({ message: text, context: roomContext });
        const analysis = getReactionGrade(score);
        setPrediction({ ...analysis, score });
      } else {
        setPrediction(null);
      }
    },
    [room, mx]
  );

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
      selectedProperty,
      selectedPersona,
      toneValues,
      initialMessageGenerated,
      prediction,
      errorMessage,

      // Actions
      setInputValue,
      handleSend,
      generateInitialResponse,
      regenerateResponse,
      handleUseSuggestion,
      clearChatHistory,
      toggleAIAssistant,
      setSelectedProperty,
      handleSliderChange,
      handlePersonaChange,
      gradeEditorText,
      setErrorMessage,
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
      generateInitialResponse,
      regenerateResponse,
      handleUseSuggestion,
      toggleAIAssistant,
      locale,
      selectedProperty,
      selectedPersona,
      toneValues,
      initialMessageGenerated,
      handleSliderChange,
      handlePersonaChange,
      prediction,
      gradeEditorText,
      errorMessage,
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
