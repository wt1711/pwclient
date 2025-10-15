import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { AIAssistantProvider, useAIAssistant } from './AIAssistantContext';
import type {
  StreamingServiceParams,
  StreamingServiceCallbacks,
} from './services/streaming-service';

// Mock dependencies
vi.mock('~/app/hooks/useRoom', () => ({
  useRoom: () => ({
    getLiveTimeline: () => ({
      getEvents: () => [],
    }),
  }),
}));

vi.mock('~/app/hooks/useMatrixClient', () => ({
  useMatrixClient: () => ({
    getUserId: () => '@testuser:matrix.org',
  }),
}));

const mockInsertText = vi.fn();
const mockDeleteText = vi.fn();

vi.mock('~/app/features/room/RoomEditorContext', () => ({
  useRoomEditor: () => ({
    insertText: mockInsertText,
    deleteText: mockDeleteText,
  }),
}));

vi.mock('~/app/features/room/RoomMessageContext', () => ({
  useRoomMessage: () => ({
    selectedMessage: null,
  }),
}));

vi.mock('~/app/state/hooks/settings', () => ({
  useSetSetting: () => vi.fn(),
}));

vi.mock('~/app/state/settings', () => ({
  settingsAtom: {},
}));

vi.mock('~/app/features/ai-assistant/utils/ai', () => ({
  getOpenAIConsultation: vi.fn(),
  gradeMessage: vi.fn(),
}));

// Mock streaming service
const mockStartStream = vi.fn();
vi.mock('~/app/features/ai-assistant/services/streaming-service', () => ({
  startStream: (params: StreamingServiceParams, callbacks: StreamingServiceCallbacks) =>
    mockStartStream(params, callbacks),
}));

describe('AIAssistantContext with Streaming Service', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AIAssistantProvider isMobile={false}>{children}</AIAssistantProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    mockInsertText.mockClear();
    mockDeleteText.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Service Integration', () => {
    it('should call startStream with correct endpoint', async () => {
      const mockAbort = vi.fn();
      mockStartStream.mockReturnValue(mockAbort);

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      await act(async () => {
        result.current.regenerateResponse();
      });

      expect(mockStartStream).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: 'https://pwai.vercel.app/api/generate-response',
        }),
        expect.objectContaining({
          onChunk: expect.any(Function),
          onError: expect.any(Function),
          onComplete: expect.any(Function),
        })
      );
    });

    it('should pass all parameters correctly to streaming service', async () => {
      const mockAbort = vi.fn();
      mockStartStream.mockReturnValue(mockAbort);

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      await act(async () => {
        result.current.regenerateResponse();
      });

      const [params] = mockStartStream.mock.calls[0];
      expect(params).toHaveProperty('endpoint');
      expect(params).toHaveProperty('message');
      expect(params).toHaveProperty('context');
      expect(params).toHaveProperty('spec');
    });

    it('should receive and store abort function from service', async () => {
      const mockAbort = vi.fn();
      mockStartStream.mockReturnValue(mockAbort);

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      await act(async () => {
        result.current.regenerateResponse();
      });

      expect(mockStartStream).toHaveBeenCalled();
      expect(mockAbort).not.toHaveBeenCalled();
    });
  });

  describe('Streaming State Management', () => {
    it('should accumulate chunks in generatedResponse', async () => {
      let capturedCallbacks: StreamingServiceCallbacks | null = null;
      mockStartStream.mockImplementation((params, callbacks) => {
        capturedCallbacks = callbacks;
        return vi.fn();
      });

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      await act(async () => {
        result.current.regenerateResponse();
      });

      // Simulate chunk streaming
      await act(async () => {
        capturedCallbacks?.onChunk('Hello');
      });

      await act(async () => {
        capturedCallbacks?.onChunk(' World');
      });

      expect(result.current.generatedResponse).toBe('Hello World');
    });

    it('should set isGeneratingResponse to false on completion', async () => {
      let capturedCallbacks: StreamingServiceCallbacks | null = null;
      mockStartStream.mockImplementation((params, callbacks) => {
        capturedCallbacks = callbacks;
        return vi.fn();
      });

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      await act(async () => {
        result.current.regenerateResponse();
      });

      expect(result.current.isGeneratingResponse).toBe(true);

      await act(async () => {
        capturedCallbacks?.onComplete?.();
      });

      expect(result.current.isGeneratingResponse).toBe(false);
    });

    it('should set errorMessage on stream error', async () => {
      let capturedCallbacks: StreamingServiceCallbacks | null = null;
      mockStartStream.mockImplementation((params, callbacks) => {
        capturedCallbacks = callbacks;
        return vi.fn();
      });

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      await act(async () => {
        result.current.regenerateResponse();
      });

      await act(async () => {
        capturedCallbacks?.onError?.(new Error('Stream connection error'));
      });

      expect(result.current.errorMessage).toBe(
        'Connection lost. Please check your network and try again.'
      );
      expect(result.current.isGeneratingResponse).toBe(false);
    });

    it('should reset state on new regenerateResponse call', async () => {
      let capturedCallbacks: StreamingServiceCallbacks | null = null;
      mockStartStream.mockImplementation((params, callbacks) => {
        capturedCallbacks = callbacks;
        return vi.fn();
      });

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      // First generation
      await act(async () => {
        result.current.regenerateResponse();
      });

      await act(async () => {
        capturedCallbacks?.onChunk('First response');
      });

      expect(result.current.generatedResponse).toBe('First response');

      // Second generation should reset
      await act(async () => {
        result.current.regenerateResponse();
      });

      expect(result.current.generatedResponse).toBe('');
      expect(result.current.errorMessage).toBe(null);
    });
  });

  describe('Abort and Cleanup', () => {
    it('should call abort function on unmount', async () => {
      const mockAbort = vi.fn();
      mockStartStream.mockReturnValue(mockAbort);

      const { result, unmount } = renderHook(() => useAIAssistant(), { wrapper });

      await act(async () => {
        result.current.regenerateResponse();
      });

      unmount();

      await waitFor(() => {
        expect(mockAbort).toHaveBeenCalled();
      });
    });

    it('should abort previous stream when regenerating', async () => {
      const firstAbort = vi.fn();
      const secondAbort = vi.fn();

      mockStartStream.mockReturnValueOnce(firstAbort).mockReturnValueOnce(secondAbort);

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      // First stream
      await act(async () => {
        result.current.regenerateResponse();
      });

      expect(firstAbort).not.toHaveBeenCalled();

      // Second stream should abort first
      await act(async () => {
        result.current.regenerateResponse();
      });

      expect(firstAbort).toHaveBeenCalled();
      expect(secondAbort).not.toHaveBeenCalled();
    });

    it('should provide abort function that cancels active stream', async () => {
      const mockAbort = vi.fn();
      mockStartStream.mockReturnValue(mockAbort);

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      await act(async () => {
        result.current.regenerateResponse();
      });

      // Manually trigger abort (simulating user cancellation)
      await act(async () => {
        result.current.regenerateResponse(); // This will abort the previous stream
      });

      expect(mockAbort).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should categorize network errors correctly', async () => {
      let capturedCallbacks: StreamingServiceCallbacks | null = null;
      mockStartStream.mockImplementation((params, callbacks) => {
        capturedCallbacks = callbacks;
        return vi.fn();
      });

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      await act(async () => {
        result.current.regenerateResponse();
      });

      await act(async () => {
        capturedCallbacks?.onError?.(new Error('network error occurred'));
      });

      expect(result.current.errorMessage).toBe('Network error. Please check your connection.');
    });

    it('should categorize HTTP errors correctly', async () => {
      let capturedCallbacks: StreamingServiceCallbacks | null = null;
      mockStartStream.mockImplementation((params, callbacks) => {
        capturedCallbacks = callbacks;
        return vi.fn();
      });

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      await act(async () => {
        result.current.regenerateResponse();
      });

      await act(async () => {
        capturedCallbacks?.onError?.(new Error('Failed to initialize SSE connection'));
      });

      expect(result.current.errorMessage).toBe(
        'Failed to connect to AI service. Please try again later.'
      );
    });

    it('should clear error state on new generation attempt', async () => {
      let capturedCallbacks: StreamingServiceCallbacks | null = null;
      mockStartStream.mockImplementation((params, callbacks) => {
        capturedCallbacks = callbacks;
        return vi.fn();
      });

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      // First generation with error
      await act(async () => {
        result.current.regenerateResponse();
      });

      await act(async () => {
        capturedCallbacks?.onError?.(new Error('Some error'));
      });

      expect(result.current.errorMessage).toBeTruthy();

      // Retry should clear error
      await act(async () => {
        result.current.regenerateResponse();
      });

      expect(result.current.errorMessage).toBe(null);
    });
  });

  describe('Final Text Transfer Integration', () => {
    it('should call handleUseSuggestion with final text when stream completes', async () => {
      let capturedCallbacks: StreamingServiceCallbacks | null = null;

      mockStartStream.mockImplementation((params, callbacks) => {
        capturedCallbacks = callbacks;
        return vi.fn();
      });

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      await act(async () => {
        result.current.regenerateResponse();
      });

      // Simulate streaming chunks
      await act(async () => {
        capturedCallbacks?.onChunk('Hello');
      });

      await act(async () => {
        capturedCallbacks?.onChunk(' World');
      });

      expect(result.current.generatedResponse).toBe('Hello World');

      // Simulate stream completion
      await act(async () => {
        capturedCallbacks?.onComplete?.();
      });

      // Verify handleUseSuggestion was called with the final text
      // Since handleUseSuggestion calls deleteText and insertText, we can verify those calls
      expect(mockDeleteText).toHaveBeenCalled();
      expect(mockInsertText).toHaveBeenCalledWith('Hello World');
      expect(result.current.isGeneratingResponse).toBe(false);

      // Verify "Thinking." was inserted initially, then replaced with chunks
      expect(mockInsertText).toHaveBeenCalledWith('Thinking.');
      // Note: "Hello" is not inserted separately - it's part of the final "Hello World" transfer
      expect(mockInsertText).toHaveBeenCalledWith(' World');
    });

    it('should handle complete flow: request → thinking → streaming → completion → input transfer', async () => {
      let capturedCallbacks: StreamingServiceCallbacks | null = null;

      mockStartStream.mockImplementation((params, callbacks) => {
        capturedCallbacks = callbacks;
        return vi.fn();
      });

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      // Step 1: Start generation (should show thinking state)
      await act(async () => {
        result.current.regenerateResponse();
      });

      expect(result.current.isGeneratingResponse).toBe(true);
      expect(result.current.generatedResponse).toBe('');

      // Step 2: First chunk arrives (thinking indicator should disappear, streaming starts)
      await act(async () => {
        capturedCallbacks?.onChunk('Hello');
      });

      expect(result.current.generatedResponse).toBe('Hello');
      expect(result.current.isGeneratingResponse).toBe(true);

      // Step 3: More chunks arrive (streaming continues)
      await act(async () => {
        capturedCallbacks?.onChunk(' World');
      });

      await act(async () => {
        capturedCallbacks?.onChunk('!');
      });

      expect(result.current.generatedResponse).toBe('Hello World!');
      expect(result.current.isGeneratingResponse).toBe(true);

      // Step 4: Stream completes (final text transfer)
      await act(async () => {
        capturedCallbacks?.onComplete?.();
      });

      expect(result.current.isGeneratingResponse).toBe(false);
      // Verify handleUseSuggestion was called by checking the room editor calls
      expect(mockDeleteText).toHaveBeenCalled();
      expect(mockInsertText).toHaveBeenCalledWith('Hello World!');

      // Verify "Thinking." was inserted initially, then replaced with chunks
      expect(mockInsertText).toHaveBeenCalledWith('Thinking.');
      // Note: "Hello" is not inserted separately - it's part of the final "Hello World" transfer
      expect(mockInsertText).toHaveBeenCalledWith(' World');
      expect(mockInsertText).toHaveBeenCalledWith('!');
    });

    it('should handle error during complete flow', async () => {
      let capturedCallbacks: StreamingServiceCallbacks | null = null;

      mockStartStream.mockImplementation((params, callbacks) => {
        capturedCallbacks = callbacks;
        return vi.fn();
      });

      const { result } = renderHook(() => useAIAssistant(), { wrapper });

      // Start generation
      await act(async () => {
        result.current.regenerateResponse();
      });

      // Simulate some chunks
      await act(async () => {
        capturedCallbacks?.onChunk('Hello');
      });

      // Simulate error
      await act(async () => {
        capturedCallbacks?.onError?.(new Error('Network error'));
      });

      // Verify error handling
      expect(result.current.errorMessage).toBeTruthy();
      expect(result.current.isGeneratingResponse).toBe(false);
      // deleteText is called at the start of regenerateResponse, during first chunk, during thinking animation, and on error
      expect(mockDeleteText).toHaveBeenCalledTimes(4); // Called at start, during first chunk, during thinking animation, and on error
      // insertText is called with "Thinking." initially, then during streaming (onChunk)
      expect(mockInsertText).toHaveBeenCalledWith('Thinking.'); // Initial call
      // Note: "Hello" is not inserted separately - it's part of the final "Hello World" transfer // Called during streaming
      // The key test: handleUseSuggestion should not be called on error, so we should only have the initial, animated thinking, and streaming calls
      expect(mockInsertText).toHaveBeenCalledTimes(3); // "Thinking." + animated thinking + streaming call, not the final transfer
    });
  });
});
