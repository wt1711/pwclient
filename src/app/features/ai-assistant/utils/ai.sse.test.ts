import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateResponseFromMessageSSE } from './ai';
import type { Message } from './ai';

// Mock EventSource
class MockEventSource {
  url: string;

  onmessage: ((event: MessageEvent) => void) | null = null;

  onerror: ((event: Event) => void) | null = null;

  readyState: number = 1; // OPEN

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  close() {
    this.readyState = 2; // CLOSED
  }

  static instances: MockEventSource[] = [];

  static reset() {
    MockEventSource.instances = [];
  }
}

// Replace global EventSource with mock
(global as any).EventSource = MockEventSource;

describe('generateResponseFromMessageSSE', () => {
  beforeEach(() => {
    MockEventSource.reset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('URL Construction', () => {
    it('should create EventSource with proper URL when message provided', () => {
      const abort = generateResponseFromMessageSSE({
        message: 'Hello',
        onChunk: () => {},
      });

      expect(MockEventSource.instances).toHaveLength(1);
      expect(MockEventSource.instances[0].url).toContain('message=Hello');
      expect(MockEventSource.instances[0].url).toContain(
        'https://pwai.vercel.app/api/generate-response'
      );
      abort();
    });

    it('should exclude omitted optional parameters from URL', () => {
      const abort = generateResponseFromMessageSSE({
        message: 'Test',
        onChunk: () => {},
      });

      const eventSource = MockEventSource.instances[0];
      const url = new URL(eventSource.url);

      expect(url.searchParams.has('message')).toBe(true);
      expect(url.searchParams.has('context')).toBe(false);
      expect(url.searchParams.has('spec')).toBe(false);

      abort();
    });

    it('should properly encode context as JSON in URL', () => {
      const context: Message[] = [
        {
          sender: '@user:matrix.org',
          text: 'Hi there',
          timestamp: '2025-01-01T00:00:00Z',
          is_from_me: false,
        },
      ];

      const abort = generateResponseFromMessageSSE({
        message: 'Test',
        context,
        onChunk: () => {},
      });

      const eventSource = MockEventSource.instances[0];
      const url = new URL(eventSource.url);
      const contextParam = url.searchParams.get('context');

      expect(contextParam).toBeTruthy();
      expect(JSON.parse(contextParam!)).toEqual(context);

      abort();
    });

    it('should properly encode spec as JSON in URL', () => {
      const spec = { persona: 'friendly', tone: { formality: 50 } };

      const abort = generateResponseFromMessageSSE({
        message: 'Test',
        spec,
        onChunk: () => {},
      });

      const eventSource = MockEventSource.instances[0];
      const url = new URL(eventSource.url);
      const specParam = url.searchParams.get('spec');

      expect(specParam).toBeTruthy();
      expect(JSON.parse(specParam!)).toEqual(spec);

      abort();
    });

    it('should handle special characters in message', () => {
      const abort = generateResponseFromMessageSSE({
        message: 'Hello & welcome! How are you?',
        onChunk: () => {},
      });

      const eventSource = MockEventSource.instances[0];
      const url = new URL(eventSource.url);

      expect(url.searchParams.get('message')).toBe('Hello & welcome! How are you?');

      abort();
    });

    it('should handle empty payload with no parameters', () => {
      const abort = generateResponseFromMessageSSE({
        onChunk: () => {},
      });

      const eventSource = MockEventSource.instances[0];
      const url = new URL(eventSource.url);

      expect(url.searchParams.has('message')).toBe(false);
      expect(url.searchParams.has('context')).toBe(false);
      expect(url.searchParams.has('spec')).toBe(false);
      expect(url.toString()).toBe('https://pwai.vercel.app/api/generate-response');

      abort();
    });
  });

  describe('Streaming Flow', () => {
    it('should call onChunk for each message received', () => {
      const onChunk = vi.fn();
      const abort = generateResponseFromMessageSSE({
        message: 'Test',
        onChunk,
      });

      const eventSource = MockEventSource.instances[0];

      // Simulate receiving chunks
      eventSource.onmessage?.(new MessageEvent('message', { data: 'Hello' }));
      eventSource.onmessage?.(new MessageEvent('message', { data: ' world' }));
      eventSource.onmessage?.(new MessageEvent('message', { data: '!' }));

      expect(onChunk).toHaveBeenCalledTimes(3);
      expect(onChunk).toHaveBeenNthCalledWith(1, 'Hello');
      expect(onChunk).toHaveBeenNthCalledWith(2, ' world');
      expect(onChunk).toHaveBeenNthCalledWith(3, '!');

      abort();
    });

    it('should handle multiple chunks in sequence', () => {
      const chunks: string[] = [];
      const abort = generateResponseFromMessageSSE({
        message: 'Test',
        onChunk: (chunk) => chunks.push(chunk),
      });

      const eventSource = MockEventSource.instances[0];

      // Simulate streaming response
      eventSource.onmessage?.(new MessageEvent('message', { data: 'The' }));
      eventSource.onmessage?.(new MessageEvent('message', { data: ' quick' }));
      eventSource.onmessage?.(new MessageEvent('message', { data: ' brown' }));
      eventSource.onmessage?.(new MessageEvent('message', { data: ' fox' }));

      expect(chunks).toEqual(['The', ' quick', ' brown', ' fox']);
      expect(chunks.join('')).toBe('The quick brown fox');

      abort();
    });

    it('should close EventSource on [DONE] signal', () => {
      const onComplete = vi.fn();
      const abort = generateResponseFromMessageSSE({
        message: 'Test',
        onChunk: () => {},
        onComplete,
      });

      const eventSource = MockEventSource.instances[0];
      expect(eventSource.readyState).toBe(1); // OPEN

      eventSource.onmessage?.(new MessageEvent('message', { data: '[DONE]' }));

      expect(eventSource.readyState).toBe(2); // CLOSED
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('should call onComplete callback when [DONE] received', () => {
      const onComplete = vi.fn();
      const abort = generateResponseFromMessageSSE({
        message: 'Test',
        onChunk: () => {},
        onComplete,
      });

      const eventSource = MockEventSource.instances[0];
      eventSource.onmessage?.(new MessageEvent('message', { data: 'chunk1' }));
      eventSource.onmessage?.(new MessageEvent('message', { data: 'chunk2' }));
      eventSource.onmessage?.(new MessageEvent('message', { data: '[DONE]' }));

      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('should not call onChunk for [DONE] signal', () => {
      const onChunk = vi.fn();
      const abort = generateResponseFromMessageSSE({
        message: 'Test',
        onChunk,
      });

      const eventSource = MockEventSource.instances[0];
      eventSource.onmessage?.(new MessageEvent('message', { data: 'chunk' }));
      eventSource.onmessage?.(new MessageEvent('message', { data: '[DONE]' }));

      expect(onChunk).toHaveBeenCalledTimes(1);
      expect(onChunk).toHaveBeenCalledWith('chunk');
      expect(onChunk).not.toHaveBeenCalledWith('[DONE]');
    });
  });

  describe('Error Handling', () => {
    it('should trigger onError callback on error event', () => {
      const onError = vi.fn();
      const abort = generateResponseFromMessageSSE({
        message: 'Test',
        onChunk: () => {},
        onError,
      });

      const eventSource = MockEventSource.instances[0];
      eventSource.onerror?.(new Event('error'));

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      expect(onError.mock.calls[0][0].message).toBe('Stream connection error');
    });

    it('should close EventSource on error', () => {
      const onError = vi.fn();
      const abort = generateResponseFromMessageSSE({
        message: 'Test',
        onChunk: () => {},
        onError,
      });

      const eventSource = MockEventSource.instances[0];
      expect(eventSource.readyState).toBe(1); // OPEN

      eventSource.onerror?.(new Event('error'));

      expect(eventSource.readyState).toBe(2); // CLOSED
    });

    it('should handle error when onError callback not provided', () => {
      const abort = generateResponseFromMessageSSE({
        message: 'Test',
        onChunk: () => {},
      });

      const eventSource = MockEventSource.instances[0];

      // Should not throw error when onError is not provided
      expect(() => {
        eventSource.onerror?.(new Event('error'));
      }).not.toThrow();

      expect(eventSource.readyState).toBe(2); // CLOSED
      abort();
    });

    it('should log error to console', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const abort = generateResponseFromMessageSSE({
        message: 'Test',
        onChunk: () => {},
      });

      const eventSource = MockEventSource.instances[0];
      eventSource.onerror?.(new Event('error'));

      expect(consoleErrorSpy).toHaveBeenCalledWith('SSE Error:', expect.any(Event));

      consoleErrorSpy.mockRestore();
      abort();
    });
  });

  describe('Cleanup and Abort', () => {
    it('should return abort function that closes EventSource', () => {
      const abort = generateResponseFromMessageSSE({
        message: 'Test',
        onChunk: () => {},
      });

      const eventSource = MockEventSource.instances[0];
      expect(eventSource.readyState).toBe(1); // OPEN

      abort();

      expect(eventSource.readyState).toBe(2); // CLOSED
    });

    it('should allow abort to be called multiple times safely', () => {
      const abort = generateResponseFromMessageSSE({
        message: 'Test',
        onChunk: () => {},
      });

      const eventSource = MockEventSource.instances[0];

      abort();
      expect(eventSource.readyState).toBe(2); // CLOSED

      // Should not throw when called again
      expect(() => abort()).not.toThrow();
      expect(eventSource.readyState).toBe(2); // Still CLOSED
    });

    it('should close EventSource when [DONE] received', () => {
      const abort = generateResponseFromMessageSSE({
        message: 'Test',
        onChunk: () => {},
      });

      const eventSource = MockEventSource.instances[0];
      eventSource.onmessage?.(new MessageEvent('message', { data: '[DONE]' }));

      expect(eventSource.readyState).toBe(2); // CLOSED
    });

    it('should handle cleanup after stream completes', () => {
      const onComplete = vi.fn();
      const abort = generateResponseFromMessageSSE({
        message: 'Test',
        onChunk: () => {},
        onComplete,
      });

      const eventSource = MockEventSource.instances[0];
      eventSource.onmessage?.(new MessageEvent('message', { data: '[DONE]' }));

      expect(eventSource.readyState).toBe(2);
      expect(onComplete).toHaveBeenCalled();

      // Calling abort after completion should be safe
      expect(() => abort()).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long context array', () => {
      const context: Message[] = Array.from({ length: 100 }, (_, i) => ({
        sender: `@user${i}:matrix.org`,
        text: `This is a long message number ${i} with some content`,
        timestamp: `2025-01-01T00:00:${i.toString().padStart(2, '0')}Z`,
        is_from_me: i % 2 === 0,
      }));

      const abort = generateResponseFromMessageSSE({
        message: 'Test',
        context,
        onChunk: () => {},
      });

      const eventSource = MockEventSource.instances[0];
      const url = new URL(eventSource.url);
      const contextParam = url.searchParams.get('context');

      expect(contextParam).toBeTruthy();
      expect(JSON.parse(contextParam!)).toEqual(context);

      abort();
    });

    it('should handle partial payload with only message', () => {
      const abort = generateResponseFromMessageSSE({
        message: 'Hello',
        onChunk: () => {},
      });

      const eventSource = MockEventSource.instances[0];
      const url = new URL(eventSource.url);

      expect(url.searchParams.has('message')).toBe(true);
      expect(url.searchParams.has('context')).toBe(false);
      expect(url.searchParams.has('spec')).toBe(false);

      abort();
    });

    it('should handle partial payload with context but no message', () => {
      const context: Message[] = [
        {
          sender: '@user:matrix.org',
          text: 'Hi',
          timestamp: '2025-01-01T00:00:00Z',
          is_from_me: false,
        },
      ];

      const abort = generateResponseFromMessageSSE({
        context,
        onChunk: () => {},
      });

      const eventSource = MockEventSource.instances[0];
      const url = new URL(eventSource.url);

      expect(url.searchParams.has('message')).toBe(false);
      expect(url.searchParams.has('context')).toBe(true);
      expect(url.searchParams.has('spec')).toBe(false);

      abort();
    });

    it('should handle empty string as message', () => {
      const abort = generateResponseFromMessageSSE({
        message: '',
        onChunk: () => {},
      });

      const eventSource = MockEventSource.instances[0];
      const url = new URL(eventSource.url);

      // Empty string should not be included in query params
      expect(url.searchParams.has('message')).toBe(false);

      abort();
    });

    it('should handle complex nested spec object', () => {
      const spec = {
        persona: 'friendly',
        tone: {
          formality: 50,
          enthusiasm: 80,
          mood: {
            primary: 'happy',
            secondary: 'helpful',
          },
        },
        style: ['concise', 'clear'],
      };

      const abort = generateResponseFromMessageSSE({
        message: 'Test',
        spec,
        onChunk: () => {},
      });

      const eventSource = MockEventSource.instances[0];
      const url = new URL(eventSource.url);
      const specParam = url.searchParams.get('spec');

      expect(specParam).toBeTruthy();
      expect(JSON.parse(specParam!)).toEqual(spec);

      abort();
    });
  });

  describe('Callback Patterns', () => {
    it('should work without optional callbacks', () => {
      const onChunk = vi.fn();
      const abort = generateResponseFromMessageSSE({
        message: 'Test',
        onChunk,
      });

      const eventSource = MockEventSource.instances[0];

      expect(() => {
        eventSource.onmessage?.(new MessageEvent('message', { data: 'chunk' }));
        eventSource.onmessage?.(new MessageEvent('message', { data: '[DONE]' }));
      }).not.toThrow();

      expect(onChunk).toHaveBeenCalledWith('chunk');

      abort();
    });

    it('should handle all callbacks being provided', () => {
      const onChunk = vi.fn();
      const onError = vi.fn();
      const onComplete = vi.fn();

      const abort = generateResponseFromMessageSSE({
        message: 'Test',
        onChunk,
        onError,
        onComplete,
      });

      const eventSource = MockEventSource.instances[0];

      eventSource.onmessage?.(new MessageEvent('message', { data: 'chunk1' }));
      eventSource.onmessage?.(new MessageEvent('message', { data: 'chunk2' }));
      eventSource.onmessage?.(new MessageEvent('message', { data: '[DONE]' }));

      expect(onChunk).toHaveBeenCalledTimes(2);
      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(onError).not.toHaveBeenCalled();

      abort();
    });

    it('should call callbacks in correct sequence', () => {
      const callOrder: string[] = [];

      const abort = generateResponseFromMessageSSE({
        message: 'Test',
        onChunk: (chunk) => callOrder.push(`chunk:${chunk}`),
        onComplete: () => callOrder.push('complete'),
      });

      const eventSource = MockEventSource.instances[0];

      eventSource.onmessage?.(new MessageEvent('message', { data: 'A' }));
      eventSource.onmessage?.(new MessageEvent('message', { data: 'B' }));
      eventSource.onmessage?.(new MessageEvent('message', { data: '[DONE]' }));

      expect(callOrder).toEqual(['chunk:A', 'chunk:B', 'complete']);

      abort();
    });
  });
});
