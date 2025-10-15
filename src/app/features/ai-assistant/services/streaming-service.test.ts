import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { FetchEventSourceInit } from '@microsoft/fetch-event-source';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { startStream } from './streaming-service';
import type { StreamingServiceParams, StreamingServiceCallbacks } from './streaming-service';

// Mock @microsoft/fetch-event-source
vi.mock('@microsoft/fetch-event-source', () => ({
  fetchEventSource: vi.fn(),
}));

describe('Streaming Service', () => {
  let mockFetchEventSource: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetchEventSource = fetchEventSource as ReturnType<typeof vi.fn>;
    mockFetchEventSource.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Happy Path Tests', () => {
    it('should successfully stream chunks and complete', async () => {
      // Arrange
      const mockChunks = ['Hello', ' ', 'World'];
      const onChunk = vi.fn();
      const onComplete = vi.fn();
      const onError = vi.fn();

      mockFetchEventSource.mockImplementation((_url: string, options: FetchEventSourceInit) => {
        // Simulate successful connection
        options.onopen?.({ ok: true, status: 200 } as Response);

        // Simulate receiving chunks
        mockChunks.forEach((chunk) => {
          options.onmessage?.({ data: chunk, id: '', event: '', retry: undefined });
        });

        // Simulate [DONE] signal
        options.onmessage?.({ data: '[DONE]', id: '', event: '', retry: undefined });

        return Promise.resolve();
      });

      const params: StreamingServiceParams = {
        endpoint: 'https://test.example.com/api/stream',
        message: 'Test message',
      };

      const callbacks: StreamingServiceCallbacks = {
        onChunk,
        onComplete,
        onError,
      };

      // Act
      const abort = startStream(params, callbacks);

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Assert
      expect(onChunk).toHaveBeenCalledTimes(3);
      expect(onChunk).toHaveBeenNthCalledWith(1, 'Hello');
      expect(onChunk).toHaveBeenNthCalledWith(2, ' ');
      expect(onChunk).toHaveBeenNthCalledWith(3, 'World');
      expect(onComplete).toHaveBeenCalledOnce();
      expect(onError).not.toHaveBeenCalled();
      expect(typeof abort).toBe('function');
    });

    it('should handle [DONE] signal and trigger onComplete', async () => {
      // Arrange
      const onChunk = vi.fn();
      const onComplete = vi.fn();

      mockFetchEventSource.mockImplementation((_url: string, options: FetchEventSourceInit) => {
        options.onopen?.({ ok: true, status: 200 } as Response);
        options.onmessage?.({ data: '[DONE]', id: '', event: '', retry: undefined });
        return Promise.resolve();
      });

      const params: StreamingServiceParams = {
        endpoint: 'https://test.example.com/api/stream',
      };

      const callbacks: StreamingServiceCallbacks = {
        onChunk,
        onComplete,
      };

      // Act
      startStream(params, callbacks);

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Assert
      expect(onChunk).not.toHaveBeenCalled();
      expect(onComplete).toHaveBeenCalledOnce();
    });

    it('should call onChunk for each text chunk received', async () => {
      // Arrange
      const chunks = ['chunk1', 'chunk2', 'chunk3', 'chunk4', 'chunk5'];
      const onChunk = vi.fn();

      mockFetchEventSource.mockImplementation((_url: string, options: FetchEventSourceInit) => {
        options.onopen?.({ ok: true, status: 200 } as Response);
        chunks.forEach((chunk) =>
          options.onmessage?.({ data: chunk, id: '', event: '', retry: undefined })
        );
        options.onmessage?.({ data: '[DONE]', id: '', event: '', retry: undefined });
        return Promise.resolve();
      });

      const params: StreamingServiceParams = {
        endpoint: 'https://test.example.com/api/stream',
        message: 'Test',
        context: [{ sender: 'user', text: 'Hi', timestamp: '123', is_from_me: true }],
        spec: { tone: 'friendly' },
      };

      const callbacks: StreamingServiceCallbacks = {
        onChunk,
      };

      // Act
      startStream(params, callbacks);

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Assert
      expect(onChunk).toHaveBeenCalledTimes(5);
      chunks.forEach((chunk, index) => {
        expect(onChunk).toHaveBeenNthCalledWith(index + 1, chunk);
      });
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle HTTP error (non-200) and trigger onError', async () => {
      // Arrange
      const onChunk = vi.fn();
      const onComplete = vi.fn();
      const onError = vi.fn();

      mockFetchEventSource.mockImplementation((_url: string, options: FetchEventSourceInit) => {
        // Simulate HTTP error
        const response = {
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: () => Promise.resolve('Server error occurred'),
        } as Response;

        // onopen should throw
        Promise.resolve().then(() => {
          options.onopen?.(response).catch(() => {
            // Error thrown from onopen
          });
        });

        return Promise.reject(new Error('Server error occurred'));
      });

      const params: StreamingServiceParams = {
        endpoint: 'https://test.example.com/api/stream',
      };

      const callbacks: StreamingServiceCallbacks = {
        onChunk,
        onComplete,
        onError,
      };

      // Act
      startStream(params, callbacks);

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Assert
      expect(onChunk).not.toHaveBeenCalled();
      expect(onComplete).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalled();
    });

    it('should handle network error and trigger onError', async () => {
      // Arrange
      const onChunk = vi.fn();
      const onComplete = vi.fn();
      const onError = vi.fn();

      mockFetchEventSource.mockImplementation((_url: string, options: FetchEventSourceInit) => {
        options.onopen?.({ ok: true, status: 200 } as Response);

        // Simulate network error
        const networkError = new Error('Network connection failed');
        options.onerror?.(networkError);

        return Promise.resolve();
      });

      const params: StreamingServiceParams = {
        endpoint: 'https://test.example.com/api/stream',
      };

      const callbacks: StreamingServiceCallbacks = {
        onChunk,
        onComplete,
        onError,
      };

      // Act
      startStream(params, callbacks);

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Assert
      expect(onChunk).not.toHaveBeenCalled();
      expect(onComplete).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      expect(onError.mock.calls[0][0].message).toBe('Network connection failed');
    });

    it('should handle stream error during transmission and trigger onError', async () => {
      // Arrange
      const onChunk = vi.fn();
      const onComplete = vi.fn();
      const onError = vi.fn();

      mockFetchEventSource.mockImplementation((_url: string, options: FetchEventSourceInit) => {
        options.onopen?.({ ok: true, status: 200 } as Response);

        // Send some chunks first
        options.onmessage?.({ data: 'chunk1', id: '', event: '', retry: undefined });
        options.onmessage?.({ data: 'chunk2', id: '', event: '', retry: undefined });

        // Then simulate error
        const streamError = new Error('Stream interrupted');
        options.onerror?.(streamError);

        return Promise.resolve();
      });

      const params: StreamingServiceParams = {
        endpoint: 'https://test.example.com/api/stream',
      };

      const callbacks: StreamingServiceCallbacks = {
        onChunk,
        onComplete,
        onError,
      };

      // Act
      startStream(params, callbacks);

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Assert
      expect(onChunk).toHaveBeenCalledTimes(2);
      expect(onComplete).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should not call onError after successful completion (isDone flag)', async () => {
      // Arrange
      const onChunk = vi.fn();
      const onComplete = vi.fn();
      const onError = vi.fn();

      mockFetchEventSource.mockImplementation((_url: string, options: FetchEventSourceInit) => {
        options.onopen?.({ ok: true, status: 200 } as Response);
        options.onmessage?.({ data: 'chunk1', id: '', event: '', retry: undefined });
        options.onmessage?.({ data: '[DONE]', id: '', event: '', retry: undefined });

        // Try to trigger error after completion
        try {
          options.onerror?.(new Error('Late error'));
        } catch (e) {
          // Expected to throw
        }

        return Promise.resolve();
      });

      const params: StreamingServiceParams = {
        endpoint: 'https://test.example.com/api/stream',
      };

      const callbacks: StreamingServiceCallbacks = {
        onChunk,
        onComplete,
        onError,
      };

      // Act
      startStream(params, callbacks);

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Assert
      expect(onChunk).toHaveBeenCalledTimes(1);
      expect(onComplete).toHaveBeenCalledOnce();
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('Abort/Cleanup Tests', () => {
    it('should close connection when abort function is called mid-stream', async () => {
      // Arrange
      const onChunk = vi.fn();
      const onComplete = vi.fn();
      const onError = vi.fn();
      let abortControllerSignal: AbortSignal | null = null;

      mockFetchEventSource.mockImplementation((_url: string, options: FetchEventSourceInit) => {
        abortControllerSignal = options.signal;
        options.onopen?.({ ok: true, status: 200 } as Response);
        options.onmessage?.({ data: 'chunk1', id: '', event: '', retry: undefined });
        // Don't send [DONE], simulate ongoing stream
        return Promise.resolve();
      });

      const params: StreamingServiceParams = {
        endpoint: 'https://test.example.com/api/stream',
      };

      const callbacks: StreamingServiceCallbacks = {
        onChunk,
        onComplete,
        onError,
      };

      // Act
      const abort = startStream(params, callbacks);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(abortControllerSignal?.aborted).toBe(false);

      abort(); // Call abort mid-stream

      // Assert
      expect(abortControllerSignal?.aborted).toBe(true);
      expect(onChunk).toHaveBeenCalledTimes(1);
      expect(onComplete).not.toHaveBeenCalled();
    });

    it('should handle multiple abort calls safely (idempotent)', async () => {
      // Arrange
      const onChunk = vi.fn();
      let abortControllerSignal: AbortSignal | null = null;

      mockFetchEventSource.mockImplementation((_url: string, options: FetchEventSourceInit) => {
        abortControllerSignal = options.signal;
        options.onopen?.({ ok: true, status: 200 } as Response);
        return Promise.resolve();
      });

      const params: StreamingServiceParams = {
        endpoint: 'https://test.example.com/api/stream',
      };

      const callbacks: StreamingServiceCallbacks = {
        onChunk,
      };

      // Act
      const abort = startStream(params, callbacks);

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Call abort multiple times
      abort();
      abort();
      abort();

      // Assert - should not throw errors
      expect(abortControllerSignal?.aborted).toBe(true);
    });

    it('should prevent further chunk callbacks after abort', async () => {
      // Arrange
      const onChunk = vi.fn();
      let abortFn: (() => void) | null = null;

      mockFetchEventSource.mockImplementation((_url: string, options: FetchEventSourceInit) => {
        options.onopen?.({ ok: true, status: 200 } as Response);
        options.onmessage?.({ data: 'chunk1', id: '', event: '', retry: undefined });

        // Simulate async chunks
        setTimeout(() => {
          if (!options.signal?.aborted) {
            options.onmessage?.({ data: 'chunk2', id: '', event: '', retry: undefined });
          }
        }, 20);

        setTimeout(() => {
          if (!options.signal?.aborted) {
            options.onmessage?.({ data: 'chunk3', id: '', event: '', retry: undefined });
          }
        }, 40);

        return Promise.resolve();
      });

      const params: StreamingServiceParams = {
        endpoint: 'https://test.example.com/api/stream',
      };

      const callbacks: StreamingServiceCallbacks = {
        onChunk,
      };

      // Act
      abortFn = startStream(params, callbacks);

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Abort after first chunk
      abortFn();

      // Wait for the attempted subsequent chunks
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert - only first chunk should have been processed
      expect(onChunk).toHaveBeenCalledTimes(1);
      expect(onChunk).toHaveBeenCalledWith('chunk1');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty stream (immediate [DONE])', async () => {
      // Arrange
      const onChunk = vi.fn();
      const onComplete = vi.fn();

      mockFetchEventSource.mockImplementation((_url: string, options: FetchEventSourceInit) => {
        options.onopen?.({ ok: true, status: 200 } as Response);
        // Immediately send [DONE] without any chunks
        options.onmessage?.({ data: '[DONE]', id: '', event: '', retry: undefined });
        return Promise.resolve();
      });

      const params: StreamingServiceParams = {
        endpoint: 'https://test.example.com/api/stream',
      };

      const callbacks: StreamingServiceCallbacks = {
        onChunk,
        onComplete,
      };

      // Act
      startStream(params, callbacks);

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Assert
      expect(onChunk).not.toHaveBeenCalled();
      expect(onComplete).toHaveBeenCalledOnce();
    });

    it('should handle stream with single chunk', async () => {
      // Arrange
      const onChunk = vi.fn();
      const onComplete = vi.fn();

      mockFetchEventSource.mockImplementation((_url: string, options: FetchEventSourceInit) => {
        options.onopen?.({ ok: true, status: 200 } as Response);
        options.onmessage?.({ data: 'single chunk', id: '', event: '', retry: undefined });
        options.onmessage?.({ data: '[DONE]', id: '', event: '', retry: undefined });
        return Promise.resolve();
      });

      const params: StreamingServiceParams = {
        endpoint: 'https://test.example.com/api/stream',
      };

      const callbacks: StreamingServiceCallbacks = {
        onChunk,
        onComplete,
      };

      // Act
      startStream(params, callbacks);

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Assert
      expect(onChunk).toHaveBeenCalledOnce();
      expect(onChunk).toHaveBeenCalledWith('single chunk');
      expect(onComplete).toHaveBeenCalledOnce();
    });

    it('should handle rapid abort before any chunks received', async () => {
      // Arrange
      const onChunk = vi.fn();
      const onComplete = vi.fn();
      const onError = vi.fn();

      mockFetchEventSource.mockImplementation((_url: string, options: FetchEventSourceInit) => {
        options.onopen?.({ ok: true, status: 200 } as Response);
        // Simulate delayed chunks
        setTimeout(() => {
          if (!options.signal?.aborted) {
            options.onmessage?.({ data: 'chunk1', id: '', event: '', retry: undefined });
          }
        }, 50);
        return Promise.resolve();
      });

      const params: StreamingServiceParams = {
        endpoint: 'https://test.example.com/api/stream',
      };

      const callbacks: StreamingServiceCallbacks = {
        onChunk,
        onComplete,
        onError,
      };

      // Act
      const abort = startStream(params, callbacks);

      // Abort immediately
      abort();

      await new Promise((resolve) => setTimeout(resolve, 60));

      // Assert
      expect(onChunk).not.toHaveBeenCalled();
      expect(onComplete).not.toHaveBeenCalled();
      // onError might or might not be called depending on timing
    });
  });

  describe('Service API', () => {
    it('should pass all parameters to the endpoint correctly', async () => {
      // Arrange
      const onChunk = vi.fn();

      mockFetchEventSource.mockImplementation((url: string, options: FetchEventSourceInit) => {
        expect(url).toBe('https://test.example.com/api/stream');
        expect(options.method).toBe('POST');
        expect(options.headers?.['Content-Type']).toBe('application/json');

        const body = JSON.parse(options.body as string);
        expect(body.message).toBe('Test message');
        expect(body.context).toEqual([
          { sender: 'user', text: 'Hello', timestamp: '123', is_from_me: true },
        ]);
        expect(body.spec).toEqual({ tone: 'friendly', persona: 'assistant' });

        options.onopen?.({ ok: true, status: 200 } as Response);
        options.onmessage?.({ data: '[DONE]', id: '', event: '', retry: undefined });
        return Promise.resolve();
      });

      const params: StreamingServiceParams = {
        endpoint: 'https://test.example.com/api/stream',
        message: 'Test message',
        context: [{ sender: 'user', text: 'Hello', timestamp: '123', is_from_me: true }],
        spec: { tone: 'friendly', persona: 'assistant' },
      };

      const callbacks: StreamingServiceCallbacks = {
        onChunk,
      };

      // Act
      startStream(params, callbacks);

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Assert
      expect(mockFetchEventSource).toHaveBeenCalledTimes(1);
    });

    it('should work with minimal parameters (only endpoint)', async () => {
      // Arrange
      const onChunk = vi.fn();

      mockFetchEventSource.mockImplementation((_url: string, options: FetchEventSourceInit) => {
        const body = JSON.parse(options.body as string);
        expect(body.message).toBeUndefined();
        expect(body.context).toBeUndefined();
        expect(body.spec).toBeUndefined();

        options.onopen?.({ ok: true, status: 200 } as Response);
        options.onmessage?.({ data: '[DONE]', id: '', event: '', retry: undefined });
        return Promise.resolve();
      });

      const params: StreamingServiceParams = {
        endpoint: 'https://test.example.com/api/stream',
      };

      const callbacks: StreamingServiceCallbacks = {
        onChunk,
      };

      // Act
      startStream(params, callbacks);

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Assert - should work without errors
      expect(mockFetchEventSource).toHaveBeenCalledTimes(1);
    });
  });
});
