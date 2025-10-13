import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { AIAssistantProvider, useAIAssistant } from './AIAssistantContext';
import * as aiUtils from './utils/ai';
import type { GenerateResponseSSECallbacks } from './utils/ai';
import { useRoom } from '~/app/hooks/useRoom';
import { useMatrixClient } from '~/app/hooks/useMatrixClient';
import { useRoomEditor } from '~/app/features/room/RoomEditorContext';
import { useRoomMessage } from '~/app/features/room/RoomMessageContext';
import { useSetSetting } from '~/app/state/hooks/settings';
import { personas } from './utils/data';

// Mock all the hooks and utilities
vi.mock('./utils/ai');
vi.mock('~/app/hooks/useRoom');
vi.mock('~/app/hooks/useMatrixClient');
vi.mock('~/app/features/room/RoomEditorContext');
vi.mock('~/app/features/room/RoomMessageContext');
vi.mock('~/app/state/hooks/settings');

describe('AIAssistantContext - Story 1.2 Tests', () => {
  const mockRoom = {
    getLiveTimeline: vi.fn(),
  };

  const mockTimeline = {
    getEvents: vi.fn(),
  };

  const mockEvent = (sender: string, body: string, ts: number) => ({
    getSender: () => sender,
    getContent: () => ({ body }),
    getTs: () => ts,
  });

  const mockMx = {
    getUserId: () => '@testuser:matrix.org',
  };

  const mockInsertText = vi.fn();
  const mockDeleteText = vi.fn();
  const mockSetIsAiDrawer = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock implementations
    (useRoom as Mock).mockReturnValue(mockRoom);
    (useMatrixClient as Mock).mockReturnValue(mockMx);
    (useRoomEditor as Mock).mockReturnValue({
      insertText: mockInsertText,
      deleteText: mockDeleteText,
    });
    (useRoomMessage as Mock).mockReturnValue({
      selectedMessage: null,
    });
    (useSetSetting as Mock).mockReturnValue(mockSetIsAiDrawer);

    mockRoom.getLiveTimeline.mockReturnValue(mockTimeline);
    mockTimeline.getEvents.mockReturnValue([
      mockEvent('@other:matrix.org', 'Hello there', Date.now() - 2000),
      mockEvent('@testuser:matrix.org', 'Hi!', Date.now() - 1000),
    ]);
  });

  describe('regenerateResponse function', () => {
    it('should build spec object from selectedPersona and toneValues state', async () => {
      const mockAbort = vi.fn();

      (aiUtils.generateResponseFromMessageSSE as Mock).mockReturnValue(mockAbort);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AIAssistantProvider isMobile={false}>{children}</AIAssistantProvider>
      );

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      // Set persona and tone values
      act(() => {
        result.current.handlePersonaChange(personas[1]); // Select a specific persona
        result.current.handleSliderChange(75); // Set a tone value
      });

      // Call regenerateResponse
      act(() => {
        result.current.regenerateResponse();
      });

      // Verify the API was called with the correct spec
      expect(aiUtils.generateResponseFromMessageSSE).toHaveBeenCalledWith(
        expect.objectContaining({
          spec: expect.objectContaining({
            persona: personas[1],
            tone: expect.any(Object),
          }),
        })
      );
    });

    it('should call generateResponseFromMessageSSE API', async () => {
      const mockAbort = vi.fn();
      (aiUtils.generateResponseFromMessageSSE as Mock).mockReturnValue(mockAbort);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AIAssistantProvider isMobile={false}>{children}</AIAssistantProvider>
      );

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      act(() => {
        result.current.regenerateResponse();
      });

      // Verify API was called
      expect(aiUtils.generateResponseFromMessageSSE).toHaveBeenCalled();
    });

    it('should pass message, context, and spec to the API', async () => {
      const mockAbort = vi.fn();
      (aiUtils.generateResponseFromMessageSSE as Mock).mockReturnValue(mockAbort);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AIAssistantProvider isMobile={false}>{children}</AIAssistantProvider>
      );

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      act(() => {
        result.current.regenerateResponse();
      });

      expect(aiUtils.generateResponseFromMessageSSE).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Hello there', // Last non-user message
          context: expect.arrayContaining([
            expect.objectContaining({
              sender: '@other:matrix.org',
              text: 'Hello there',
              is_from_me: false,
            }),
            expect.objectContaining({
              sender: '@testuser:matrix.org',
              text: 'Hi!',
              is_from_me: true,
            }),
          ]),
          spec: expect.objectContaining({
            persona: expect.any(Object),
            tone: expect.any(Object),
          }),
          onChunk: expect.any(Function),
          onError: expect.any(Function),
          onComplete: expect.any(Function),
        })
      );
    });

    it('should stream chunks and append to generatedResponse state', async () => {
      const mockAbort = vi.fn();
      let capturedCallbacks: GenerateResponseSSECallbacks;

      (aiUtils.generateResponseFromMessageSSE as Mock).mockImplementation((params) => {
        capturedCallbacks = params;
        return mockAbort;
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AIAssistantProvider isMobile={false}>{children}</AIAssistantProvider>
      );

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      // Trigger regeneration
      act(() => {
        result.current.regenerateResponse();
      });

      // Simulate streaming chunks
      act(() => {
        capturedCallbacks.onChunk('This is ');
      });
      expect(result.current.generatedResponse).toBe('This is ');

      act(() => {
        capturedCallbacks.onChunk('the generated ');
      });
      expect(result.current.generatedResponse).toBe('This is the generated ');

      act(() => {
        capturedCallbacks.onChunk('response');
      });
      expect(result.current.generatedResponse).toBe('This is the generated response');

      act(() => {
        capturedCallbacks.onComplete();
      });
      expect(result.current.isGeneratingResponse).toBe(false);
    });

    it('should call handleUseSuggestion with the response when complete', async () => {
      const mockAbort = vi.fn();
      let capturedCallbacks: GenerateResponseSSECallbacks;

      (aiUtils.generateResponseFromMessageSSE as Mock).mockImplementation((params) => {
        capturedCallbacks = params;
        return mockAbort;
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AIAssistantProvider isMobile={false}>{children}</AIAssistantProvider>
      );

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      act(() => {
        result.current.regenerateResponse();
      });

      // Simulate streaming
      act(() => {
        capturedCallbacks.onChunk('Response to insert');
        capturedCallbacks.onComplete();
      });

      // Verify text was inserted
      await waitFor(() => {
        expect(mockInsertText).toHaveBeenCalledWith('Response to insert');
      });
    });

    it('should set isGeneratingResponse to true during streaming', async () => {
      const mockAbort = vi.fn();
      let capturedCallbacks: GenerateResponseSSECallbacks;

      (aiUtils.generateResponseFromMessageSSE as Mock).mockImplementation((params) => {
        capturedCallbacks = params;
        return mockAbort;
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AIAssistantProvider isMobile={false}>{children}</AIAssistantProvider>
      );

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      // Start generation
      act(() => {
        result.current.regenerateResponse();
      });

      // Should be loading
      expect(result.current.isGeneratingResponse).toBe(true);

      // Simulate chunk
      act(() => {
        capturedCallbacks.onChunk('Response');
      });

      // Still loading during stream
      expect(result.current.isGeneratingResponse).toBe(true);

      // Complete stream
      act(() => {
        capturedCallbacks.onComplete();
      });

      // Should be done loading
      expect(result.current.isGeneratingResponse).toBe(false);
    });

    it('should handle stream errors and display error message', async () => {
      const mockError = new Error('Stream error');
      const mockAbort = vi.fn();
      let capturedCallbacks: GenerateResponseSSECallbacks;

      (aiUtils.generateResponseFromMessageSSE as Mock).mockImplementation((params) => {
        capturedCallbacks = params;
        return mockAbort;
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        // Intentionally empty
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AIAssistantProvider isMobile={false}>{children}</AIAssistantProvider>
      );

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      act(() => {
        result.current.regenerateResponse();
      });

      // Simulate stream error
      act(() => {
        capturedCallbacks.onError(mockError);
      });

      // Should show error message
      expect(result.current.generatedResponse).toBe('Xin lỗi, đã có lỗi');

      // Should log error
      expect(consoleErrorSpy).toHaveBeenCalledWith('Stream error:', mockError);

      // Should clear loading state
      expect(result.current.isGeneratingResponse).toBe(false);

      consoleErrorSpy.mockRestore();
    });

    it('should handle initialization errors and clear loading state', async () => {
      (aiUtils.generateResponseFromMessageSSE as Mock).mockImplementation(() => {
        throw new Error('Initialization error');
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        // Intentionally empty
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AIAssistantProvider isMobile={false}>{children}</AIAssistantProvider>
      );

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      act(() => {
        result.current.regenerateResponse();
      });

      expect(result.current.isGeneratingResponse).toBe(false);
      expect(result.current.initialMessageGenerated).toBe(true);
      expect(result.current.generatedResponse).toBe('Xin lỗi, đã có lỗi');

      consoleErrorSpy.mockRestore();
    });

    it('should call deleteText before generating response', async () => {
      const mockAbort = vi.fn();
      (aiUtils.generateResponseFromMessageSSE as Mock).mockReturnValue(mockAbort);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AIAssistantProvider isMobile={false}>{children}</AIAssistantProvider>
      );

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      act(() => {
        result.current.regenerateResponse();
      });

      expect(mockDeleteText).toHaveBeenCalled();
    });

    it('should abort previous stream when starting new generation', async () => {
      const mockAbort1 = vi.fn();
      const mockAbort2 = vi.fn();

      (aiUtils.generateResponseFromMessageSSE as Mock)
        .mockReturnValueOnce(mockAbort1)
        .mockReturnValueOnce(mockAbort2);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AIAssistantProvider isMobile={false}>{children}</AIAssistantProvider>
      );

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      // First generation
      act(() => {
        result.current.regenerateResponse();
      });

      // Second generation should abort first
      act(() => {
        result.current.regenerateResponse();
      });

      expect(mockAbort1).toHaveBeenCalled();
    });

    it('should clear previous response before starting new stream', async () => {
      const mockAbort = vi.fn();
      let capturedCallbacks: GenerateResponseSSECallbacks;

      (aiUtils.generateResponseFromMessageSSE as Mock).mockImplementation((params) => {
        capturedCallbacks = params;
        return mockAbort;
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AIAssistantProvider isMobile={false}>{children}</AIAssistantProvider>
      );

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      // First generation
      act(() => {
        result.current.regenerateResponse();
      });

      act(() => {
        capturedCallbacks.onChunk('First response');
      });

      expect(result.current.generatedResponse).toBe('First response');

      // Start new generation - should clear response first
      act(() => {
        result.current.regenerateResponse();
      });

      // Response should be cleared
      expect(result.current.generatedResponse).toBe('');

      // New chunks should start fresh
      act(() => {
        capturedCallbacks.onChunk('Second response');
      });

      expect(result.current.generatedResponse).toBe('Second response');
    });
  });

  describe('Persona selector integration', () => {
    it('should update selectedPersona via handlePersonaChange', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AIAssistantProvider isMobile={false}>{children}</AIAssistantProvider>
      );

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      // Initial persona is personas[3] as per AIAssistantContext
      expect(result.current.selectedPersona).toBe(personas[3]);

      // Change persona
      act(() => {
        result.current.handlePersonaChange(personas[1]);
      });

      expect(result.current.selectedPersona).toBe(personas[1]);
    });

    it('should include selected persona in spec when generating response', async () => {
      const mockAbort = vi.fn();
      (aiUtils.generateResponseFromMessageSSE as Mock).mockReturnValue(mockAbort);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AIAssistantProvider isMobile={false}>{children}</AIAssistantProvider>
      );

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      // Select specific persona
      act(() => {
        result.current.handlePersonaChange(personas[2]);
      });

      act(() => {
        result.current.regenerateResponse();
      });

      const callArgs = (aiUtils.generateResponseFromMessageSSE as Mock).mock.calls[0];
      expect(callArgs[0].spec.persona).toBe(personas[2]);
    });
  });

  describe('Tone selector integration', () => {
    it('should update toneValues via handleSliderChange', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AIAssistantProvider isMobile={false}>{children}</AIAssistantProvider>
      );

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      const initialProperty = result.current.selectedProperty;
      const initialValue = result.current.toneValues[initialProperty.id];

      // Change slider value
      act(() => {
        result.current.handleSliderChange(80);
      });

      expect(result.current.toneValues[initialProperty.id]).toBe(80);
      expect(result.current.toneValues[initialProperty.id]).not.toBe(initialValue);
    });

    it('should include tone values in spec when generating response', async () => {
      const mockAbort = vi.fn();
      (aiUtils.generateResponseFromMessageSSE as Mock).mockReturnValue(mockAbort);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AIAssistantProvider isMobile={false}>{children}</AIAssistantProvider>
      );

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      // Set tone value
      const property = result.current.selectedProperty;
      act(() => {
        result.current.handleSliderChange(65);
      });

      act(() => {
        result.current.regenerateResponse();
      });

      const callArgs = (aiUtils.generateResponseFromMessageSSE as Mock).mock.calls[0];
      expect(callArgs[0].spec.tone[property.id]).toBe(65);
    });
  });

  describe('Generated response display', () => {
    it('should clean quotes from response before insertion', async () => {
      const mockResponse = '"Quoted response"';

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AIAssistantProvider isMobile={false}>{children}</AIAssistantProvider>
      );

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      await act(async () => {
        await result.current.handleUseSuggestion(mockResponse);
      });

      expect(mockInsertText).toHaveBeenCalledWith('Quoted response');
    });

    it('should trim whitespace from response', async () => {
      const mockResponse = '  Response with spaces  ';

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AIAssistantProvider isMobile={false}>{children}</AIAssistantProvider>
      );

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      await act(async () => {
        await result.current.handleUseSuggestion(mockResponse);
      });

      expect(mockInsertText).toHaveBeenCalledWith('Response with spaces');
    });
  });

  describe('Error State Management - Story 2.3', () => {
    it('should set errorMessage when stream error occurs', async () => {
      const mockError = new Error('Stream connection error');
      const mockAbort = vi.fn();
      let capturedCallbacks: GenerateResponseSSECallbacks;

      (aiUtils.generateResponseFromMessageSSE as Mock).mockImplementation((params) => {
        capturedCallbacks = params;
        return mockAbort;
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        // Intentionally empty
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AIAssistantProvider isMobile={false}>{children}</AIAssistantProvider>
      );

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      act(() => {
        result.current.regenerateResponse();
      });

      // Simulate stream error
      act(() => {
        capturedCallbacks.onError(mockError);
      });

      // Should set error message instead of generatedResponse
      expect(result.current.errorMessage).toBe(
        'Connection lost. Please check your network and try again.'
      );
      expect(result.current.isGeneratingResponse).toBe(false);

      consoleErrorSpy.mockRestore();
    });

    it('should clear errorMessage when regenerateResponse is called again', async () => {
      const mockError = new Error('Stream connection error');
      const mockAbort = vi.fn();
      let capturedCallbacks: GenerateResponseSSECallbacks;

      (aiUtils.generateResponseFromMessageSSE as Mock).mockImplementation((params) => {
        capturedCallbacks = params;
        return mockAbort;
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        // Intentionally empty
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AIAssistantProvider isMobile={false}>{children}</AIAssistantProvider>
      );

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      // First generation with error
      act(() => {
        result.current.regenerateResponse();
      });

      act(() => {
        capturedCallbacks.onError(mockError);
      });

      expect(result.current.errorMessage).toBeTruthy();

      // Retry generation should clear error
      act(() => {
        result.current.regenerateResponse();
      });

      expect(result.current.errorMessage).toBe(null);

      consoleErrorSpy.mockRestore();
    });

    it('should categorize network errors correctly', async () => {
      const mockError = new Error('Failed to initialize SSE connection');
      const mockAbort = vi.fn();
      let capturedCallbacks: GenerateResponseSSECallbacks;

      (aiUtils.generateResponseFromMessageSSE as Mock).mockImplementation((params) => {
        capturedCallbacks = params;
        return mockAbort;
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        // Intentionally empty
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AIAssistantProvider isMobile={false}>{children}</AIAssistantProvider>
      );

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      act(() => {
        result.current.regenerateResponse();
      });

      act(() => {
        capturedCallbacks.onError(mockError);
      });

      expect(result.current.errorMessage).toBe(
        'Failed to connect to AI service. Please try again later.'
      );

      consoleErrorSpy.mockRestore();
    });

    it('should categorize generic errors with default message', async () => {
      const mockError = new Error('Some unknown error');
      const mockAbort = vi.fn();
      let capturedCallbacks: GenerateResponseSSECallbacks;

      (aiUtils.generateResponseFromMessageSSE as Mock).mockImplementation((params) => {
        capturedCallbacks = params;
        return mockAbort;
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        // Intentionally empty
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AIAssistantProvider isMobile={false}>{children}</AIAssistantProvider>
      );

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      act(() => {
        result.current.regenerateResponse();
      });

      act(() => {
        capturedCallbacks.onError(mockError);
      });

      expect(result.current.errorMessage).toBe('Sorry, something went wrong. Please try again.');

      consoleErrorSpy.mockRestore();
    });

    it('should handle initialization errors and set errorMessage', async () => {
      (aiUtils.generateResponseFromMessageSSE as Mock).mockImplementation(() => {
        throw new Error('Initialization error');
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        // Intentionally empty
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AIAssistantProvider isMobile={false}>{children}</AIAssistantProvider>
      );

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      act(() => {
        result.current.regenerateResponse();
      });

      expect(result.current.errorMessage).toBe('Failed to start generation. Please try again.');
      expect(result.current.isGeneratingResponse).toBe(false);

      consoleErrorSpy.mockRestore();
    });

    it('should allow successful retry after error', async () => {
      const mockError = new Error('Stream connection error');
      const mockAbort = vi.fn();
      let capturedCallbacks: GenerateResponseSSECallbacks;

      (aiUtils.generateResponseFromMessageSSE as Mock).mockImplementation((params) => {
        capturedCallbacks = params;
        return mockAbort;
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        // Intentionally empty
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AIAssistantProvider isMobile={false}>{children}</AIAssistantProvider>
      );

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      // First attempt - error
      act(() => {
        result.current.regenerateResponse();
      });

      act(() => {
        capturedCallbacks.onError(mockError);
      });

      expect(result.current.errorMessage).toBeTruthy();
      expect(result.current.isGeneratingResponse).toBe(false);

      // Second attempt - success
      act(() => {
        result.current.regenerateResponse();
      });

      expect(result.current.errorMessage).toBe(null);
      expect(result.current.isGeneratingResponse).toBe(true);

      act(() => {
        capturedCallbacks.onChunk('Success response');
        capturedCallbacks.onComplete();
      });

      expect(result.current.generatedResponse).toBe('Success response');
      expect(result.current.isGeneratingResponse).toBe(false);

      consoleErrorSpy.mockRestore();
    });

    it('should expose setErrorMessage function for manual error handling', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AIAssistantProvider isMobile={false}>{children}</AIAssistantProvider>
      );

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      expect(result.current.errorMessage).toBe(null);

      act(() => {
        result.current.setErrorMessage('Manual error message');
      });

      expect(result.current.errorMessage).toBe('Manual error message');

      act(() => {
        result.current.setErrorMessage(null);
      });

      expect(result.current.errorMessage).toBe(null);
    });

    it('should maintain error message until explicitly cleared', async () => {
      const mockError = new Error('Stream connection error');
      const mockAbort = vi.fn();
      let capturedCallbacks: GenerateResponseSSECallbacks;

      (aiUtils.generateResponseFromMessageSSE as Mock).mockImplementation((params) => {
        capturedCallbacks = params;
        return mockAbort;
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        // Intentionally empty
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AIAssistantProvider isMobile={false}>{children}</AIAssistantProvider>
      );

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      act(() => {
        result.current.regenerateResponse();
      });

      act(() => {
        capturedCallbacks.onError(mockError);
      });

      const errorMsg = result.current.errorMessage;
      expect(errorMsg).toBeTruthy();

      // Error should persist across re-renders
      await waitFor(() => {
        expect(result.current.errorMessage).toBe(errorMsg);
      });

      consoleErrorSpy.mockRestore();
    });

    it('should clear loading state on all error types', async () => {
      const scenarios = [
        { error: new Error('Stream connection error'), description: 'stream error' },
        { error: new Error('Failed to initialize SSE connection'), description: 'init error' },
        { error: new Error('network failure'), description: 'network error' },
      ];

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        // Intentionally empty
      });

      for (const scenario of scenarios) {
        const mockAbort = vi.fn();
        let capturedCallbacks: GenerateResponseSSECallbacks;

        (aiUtils.generateResponseFromMessageSSE as Mock).mockImplementation((params) => {
          capturedCallbacks = params;
          return mockAbort;
        });

        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <AIAssistantProvider isMobile={false}>{children}</AIAssistantProvider>
        );

        const { result } = renderHook(() => useAIAssistant(), { wrapper });

        act(() => {
          result.current.regenerateResponse();
        });

        expect(result.current.isGeneratingResponse).toBe(true);

        act(() => {
          capturedCallbacks.onError(scenario.error);
        });

        expect(result.current.isGeneratingResponse).toBe(false);
      }

      consoleErrorSpy.mockRestore();
    });

    it('should complete full error flow: generate → error → display → retry → success', async () => {
      const mockError = new Error('Stream connection error');
      const mockAbort = vi.fn();
      let capturedCallbacks: GenerateResponseSSECallbacks;

      (aiUtils.generateResponseFromMessageSSE as Mock).mockImplementation((params) => {
        capturedCallbacks = params;
        return mockAbort;
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        // Intentionally empty
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AIAssistantProvider isMobile={false}>{children}</AIAssistantProvider>
      );

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      // Step 1: Start generation
      act(() => {
        result.current.regenerateResponse();
      });
      expect(result.current.isGeneratingResponse).toBe(true);
      expect(result.current.errorMessage).toBe(null);

      // Step 2: Error occurs
      act(() => {
        capturedCallbacks.onError(mockError);
      });
      expect(result.current.isGeneratingResponse).toBe(false);
      expect(result.current.errorMessage).toBe(
        'Connection lost. Please check your network and try again.'
      );

      // Step 3: Retry
      act(() => {
        result.current.regenerateResponse();
      });
      expect(result.current.errorMessage).toBe(null);
      expect(result.current.isGeneratingResponse).toBe(true);

      // Step 4: Success
      act(() => {
        capturedCallbacks.onChunk('Successful response');
        capturedCallbacks.onComplete();
      });
      expect(result.current.generatedResponse).toBe('Successful response');
      expect(result.current.isGeneratingResponse).toBe(false);
      expect(result.current.errorMessage).toBe(null);

      consoleErrorSpy.mockRestore();
    });
  });
});
