import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateResponseFromNewBackend } from './ai';
import type { Message } from './ai';

// Mock data for tests
const mockMessage: Message = {
  sender: '@user:matrix.org',
  text: 'Hello, how are you?',
  timestamp: '2025-01-01T00:00:00Z',
  is_from_me: false,
};

const mockContext: Message[] = [
  mockMessage,
  {
    sender: '@me:matrix.org',
    text: 'I am fine, thanks!',
    timestamp: '2025-01-01T00:01:00Z',
    is_from_me: true,
  },
];

describe('generateResponseFromNewBackend', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Setup fetch mock
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Success Cases', () => {
    it('should call the correct endpoint with full payload', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ text: 'Generated response' }),
      });

      const result = await generateResponseFromNewBackend({
        message: 'Test message',
        context: mockContext,
        spec: { tone: 'friendly' },
      });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://pwai.vercel.app/api/generate-response',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'Test message',
            context: mockContext,
            spec: { tone: 'friendly' },
          }),
        })
      );
      expect(result).toBe('Generated response');
    });

    it('should handle partial payload with only message', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ text: 'Response to message only' }),
      });

      const result = await generateResponseFromNewBackend({
        message: 'Just a message',
      });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://pwai.vercel.app/api/generate-response',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'Just a message',
            context: undefined,
            spec: undefined,
          }),
        })
      );
      expect(result).toBe('Response to message only');
    });

    it('should handle partial payload with only context', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ text: 'Response from context' }),
      });

      const result = await generateResponseFromNewBackend({
        context: mockContext,
      });

      expect(result).toBe('Response from context');
      const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(callBody.context).toEqual(mockContext);
      expect(callBody.message).toBeUndefined();
    });

    it('should handle empty payload correctly', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ text: 'Default response' }),
      });

      const result = await generateResponseFromNewBackend({});

      expect(fetchMock).toHaveBeenCalledWith(
        'https://pwai.vercel.app/api/generate-response',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: undefined,
            context: undefined,
            spec: undefined,
          }),
        })
      );
      expect(result).toBe('Default response');
    });

    it('should handle no parameters passed', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ text: 'Default response' }),
      });

      const result = await generateResponseFromNewBackend();

      expect(result).toBe('Default response');
    });

    it('should correctly parse response text field', async () => {
      const responseText = 'This is the AI generated text response';
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ text: responseText }),
      });

      const result = await generateResponseFromNewBackend({
        message: 'Test',
      });

      expect(result).toBe(responseText);
    });

    it('should handle complex spec objects', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ text: 'Response with spec' }),
      });

      const complexSpec = {
        tone: 'professional',
        persona: 'assistant',
        maxLength: 500,
        includeEmoji: false,
      };

      await generateResponseFromNewBackend({
        message: 'Test',
        spec: complexSpec,
      });

      const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(callBody.spec).toEqual(complexSpec);
    });
  });

  describe('Error Cases', () => {
    it('should handle 400 Bad Request error', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid request payload' }),
      });

      await expect(generateResponseFromNewBackend({ message: 'Test' })).rejects.toThrow(
        'Invalid request payload'
      );
    });

    it('should handle 500 Server Error', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      });

      await expect(generateResponseFromNewBackend({ message: 'Test' })).rejects.toThrow(
        'Internal server error'
      );
    });

    it('should handle error response with details', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Validation failed',
          details: 'Message format is incorrect',
        }),
      });

      await expect(generateResponseFromNewBackend({ message: 'Test' })).rejects.toThrow(
        'Validation failed'
      );
    });

    it('should handle error response without error field', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      await expect(generateResponseFromNewBackend({ message: 'Test' })).rejects.toThrow(
        'Failed to generate response from server.'
      );
    });

    it('should handle malformed error response JSON', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(generateResponseFromNewBackend({ message: 'Test' })).rejects.toThrow(
        'Unknown error'
      );
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValue(new Error('Network error'));

      await expect(generateResponseFromNewBackend({ message: 'Test' })).rejects.toThrow(
        'Network error'
      );
    });

    it('should handle fetch timeout', async () => {
      fetchMock.mockRejectedValue(new Error('Request timeout'));

      await expect(generateResponseFromNewBackend({ message: 'Test' })).rejects.toThrow(
        'Request timeout'
      );
    });

    it('should handle malformed success response', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({}), // Missing 'text' field
      });

      const result = await generateResponseFromNewBackend({
        message: 'Test',
      });

      // Should return undefined when text field is missing
      expect(result).toBeUndefined();
    });

    it('should log errors to console', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Test error');
      fetchMock.mockRejectedValue(error);

      await expect(generateResponseFromNewBackend({ message: 'Test' })).rejects.toThrow(
        'Test error'
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error generating response:', error);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Request Verification', () => {
    beforeEach(() => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ text: 'Response' }),
      });
    });

    it('should send correct Content-Type header', async () => {
      await generateResponseFromNewBackend({ message: 'Test' });

      const [, options] = fetchMock.mock.calls[0];
      expect(options.headers['Content-Type']).toBe('application/json');
    });

    it('should use POST method', async () => {
      await generateResponseFromNewBackend({ message: 'Test' });

      const [, options] = fetchMock.mock.calls[0];
      expect(options.method).toBe('POST');
    });

    it('should call correct endpoint URL', async () => {
      await generateResponseFromNewBackend({ message: 'Test' });

      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe('https://pwai.vercel.app/api/generate-response');
    });

    it('should serialize payload with JSON.stringify', async () => {
      const payload = {
        message: 'Test message',
        context: mockContext,
        spec: { tone: 'friendly' },
      };

      await generateResponseFromNewBackend(payload);

      const [, options] = fetchMock.mock.calls[0];
      expect(options.body).toBe(JSON.stringify(payload));
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ text: 'Response' }),
      });
    });

    it('should handle empty string message', async () => {
      const result = await generateResponseFromNewBackend({ message: '' });

      expect(result).toBe('Response');
      const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(callBody.message).toBe('');
    });

    it('should handle empty context array', async () => {
      const result = await generateResponseFromNewBackend({ context: [] });

      expect(result).toBe('Response');
      const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(callBody.context).toEqual([]);
    });

    it('should handle empty spec object', async () => {
      const result = await generateResponseFromNewBackend({ spec: {} });

      expect(result).toBe('Response');
      const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(callBody.spec).toEqual({});
    });

    it('should handle very long message strings', async () => {
      const longMessage = 'a'.repeat(10000);
      const result = await generateResponseFromNewBackend({ message: longMessage });

      expect(result).toBe('Response');
    });

    it('should handle large context arrays', async () => {
      const largeContext = Array.from({ length: 100 }, (_, i) => ({
        sender: `@user${i}:matrix.org`,
        text: `Message ${i}`,
        timestamp: new Date().toISOString(),
        is_from_me: i % 2 === 0,
      }));

      const result = await generateResponseFromNewBackend({ context: largeContext });

      expect(result).toBe('Response');
    });

    it('should handle null values gracefully', async () => {
      const result = await generateResponseFromNewBackend({
        message: undefined,
        context: undefined,
        spec: undefined,
      });

      expect(result).toBe('Response');
    });

    it('should handle special characters in message', async () => {
      const specialMessage = 'Test with émojis 🚀 and spëcial çhars!';
      const result = await generateResponseFromNewBackend({ message: specialMessage });

      expect(result).toBe('Response');
      const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(callBody.message).toBe(specialMessage);
    });
  });
});
