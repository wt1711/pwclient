import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { AIAssistantProvider, useAIAssistant } from './AIAssistantContext';
import * as aiUtils from './utils/ai';
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
      const mockResponse = 'Generated response text';
      (aiUtils.generateResponseFromMessage as Mock).mockResolvedValue(mockResponse);

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
      await act(async () => {
        await result.current.regenerateResponse();
      });

      // Verify the API was called with the correct spec
      expect(aiUtils.generateResponseFromMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          spec: expect.objectContaining({
            persona: personas[1],
            tone: expect.any(Object),
          }),
        })
      );
    });

    it('should call generateResponseFromMessage API', async () => {
      const mockResponse = 'Generated response';
      (aiUtils.generateResponseFromMessage as Mock).mockResolvedValue(mockResponse);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AIAssistantProvider isMobile={false}>{children}</AIAssistantProvider>
      );

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      await act(async () => {
        await result.current.regenerateResponse();
      });

      // Verify API was called
      expect(aiUtils.generateResponseFromMessage).toHaveBeenCalled();
    });

    it('should pass message, context, and spec to the API', async () => {
      const mockResponse = 'API response';
      (aiUtils.generateResponseFromMessage as Mock).mockResolvedValue(mockResponse);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AIAssistantProvider isMobile={false}>{children}</AIAssistantProvider>
      );

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      await act(async () => {
        await result.current.regenerateResponse();
      });

      expect(aiUtils.generateResponseFromMessage).toHaveBeenCalledWith({
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
      });
    });

    it('should update generatedResponse state with API response', async () => {
      const mockResponse = 'This is the generated response';
      (aiUtils.generateResponseFromMessage as Mock).mockResolvedValue(mockResponse);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AIAssistantProvider isMobile={false}>{children}</AIAssistantProvider>
      );

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      await act(async () => {
        await result.current.regenerateResponse();
      });

      expect(result.current.generatedResponse).toBe(mockResponse);
    });

    it('should call handleUseSuggestion with the response', async () => {
      const mockResponse = 'Response to insert';
      (aiUtils.generateResponseFromMessage as Mock).mockResolvedValue(mockResponse);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AIAssistantProvider isMobile={false}>{children}</AIAssistantProvider>
      );

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      await act(async () => {
        await result.current.regenerateResponse();
      });

      // Verify text was inserted
      await waitFor(() => {
        expect(mockInsertText).toHaveBeenCalledWith('Response to insert');
      });
    });

    it('should set isGeneratingResponse to true during generation', async () => {
      let resolveResponse: (value: string) => void;
      const responsePromise = new Promise<string>((resolve) => {
        resolveResponse = resolve;
      });
      (aiUtils.generateResponseFromMessage as Mock).mockReturnValue(responsePromise);

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

      // Complete generation
      await act(async () => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        resolveResponse!('Response');
        await responsePromise;
      });

      // Should be done loading
      expect(result.current.isGeneratingResponse).toBe(false);
    });

    it('should handle errors and display error message', async () => {
      const mockError = new Error('API error');
      (aiUtils.generateResponseFromMessage as Mock).mockRejectedValue(mockError);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        // Intentionally empty
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AIAssistantProvider isMobile={false}>{children}</AIAssistantProvider>
      );

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      await act(async () => {
        await result.current.regenerateResponse();
      });

      // Should show error message
      expect(result.current.generatedResponse).toBe('Xin lỗi, đã có lỗi');

      // Should log error
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error generating response:', mockError);

      // Should clear loading state
      expect(result.current.isGeneratingResponse).toBe(false);

      consoleErrorSpy.mockRestore();
    });

    it('should clear loading state in finally block even on error', async () => {
      (aiUtils.generateResponseFromMessage as Mock).mockRejectedValue(new Error('Test error'));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AIAssistantProvider isMobile={false}>{children}</AIAssistantProvider>
      );

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      await act(async () => {
        await result.current.regenerateResponse();
      });

      expect(result.current.isGeneratingResponse).toBe(false);
      expect(result.current.initialMessageGenerated).toBe(true);
    });

    it('should call deleteText before generating response', async () => {
      const mockResponse = 'Response';
      (aiUtils.generateResponseFromMessage as Mock).mockResolvedValue(mockResponse);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AIAssistantProvider isMobile={false}>{children}</AIAssistantProvider>
      );

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      await act(async () => {
        await result.current.regenerateResponse();
      });

      expect(mockDeleteText).toHaveBeenCalled();
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
      const mockResponse = 'Response';
      (aiUtils.generateResponseFromMessage as Mock).mockResolvedValue(mockResponse);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AIAssistantProvider isMobile={false}>{children}</AIAssistantProvider>
      );

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      // Select specific persona
      act(() => {
        result.current.handlePersonaChange(personas[2]);
      });

      await act(async () => {
        await result.current.regenerateResponse();
      });

      const callArgs = (aiUtils.generateResponseFromMessage as Mock).mock.calls[0][0];
      expect(callArgs.spec.persona).toBe(personas[2]);
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
      const mockResponse = 'Response';
      (aiUtils.generateResponseFromMessage as Mock).mockResolvedValue(mockResponse);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AIAssistantProvider isMobile={false}>{children}</AIAssistantProvider>
      );

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      // Set tone value
      const property = result.current.selectedProperty;
      act(() => {
        result.current.handleSliderChange(65);
      });

      await act(async () => {
        await result.current.regenerateResponse();
      });

      const callArgs = (aiUtils.generateResponseFromMessage as Mock).mock.calls[0][0];
      expect(callArgs.spec.tone[property.id]).toBe(65);
    });
  });

  describe('Generated response display', () => {
    it('should clean quotes from response before insertion', async () => {
      const mockResponse = '"Quoted response"';
      (aiUtils.generateResponseFromMessage as Mock).mockResolvedValue(mockResponse);

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
      (aiUtils.generateResponseFromMessage as Mock).mockResolvedValue(mockResponse);

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
});
