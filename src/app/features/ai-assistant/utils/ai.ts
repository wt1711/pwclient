export type Message = {
  sender: string;
  text: string;
  timestamp: string;
  is_from_me: boolean;
};

/**
 * Request payload for the new AI backend service.
 * All fields are optional.
 */
export type GenerateResponsePayload = {
  message?: string;
  context?: Message[];
  spec?: object;
};

/**
 * Response from the new AI backend service.
 */
export type GenerateResponseResult = {
  text: string;
};

export async function getOpenAIConsultation({
  context,
  selectedMessage,
  question,
}: {
  context: Message[];
  selectedMessage: Message;
  question?: string;
}): Promise<string> {
  try {
    const response = await fetch('https://wmaide-server.vercel.app/api/suggestion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        context,
        selectedMessage,
        question,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch suggestion from server.');
    }

    const data = await response.json();
    return data.suggestion;
  } catch (error) {
    return 'Xin lỗi, đã có lỗi khi lấy mẫu.';
  }
}

export async function gradeMessage({
  message,
  context,
}: {
  message: string;
  context: Message[];
}): Promise<number> {
  try {
    const response = await fetch('https://wmaide-server.vercel.app/api/grade-response', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        response: message,
        context,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to grade response from server.');
    }

    const data = await response.json();
    return data.grade;
  } catch (error) {
    console.error('Error grading message:', error);
    return 0;
  }
}

/**
 * Generates a response using the AI backend service at pwai.vercel.app.
 *
 * This function calls the AI backend API with optional parameters for message,
 * context, and response specifications. All parameters are optional, allowing the
 * API to be called with an empty payload if needed.
 *
 * @param message - The message to generate a response for (optional)
 * @param context - Previous conversation context (optional)
 * @param spec - Response specification such as persona, tone, etc. (optional)
 * @returns The generated response text
 * @throws {Error} If the API request fails or returns an error response
 *
 * @example
 * ```typescript
 * const response = await generateResponseFromMessage({
 *   message: 'Hello',
 *   context: [{ sender: '@user:matrix.org', text: 'Hi', timestamp: '...', is_from_me: false }],
 *   spec: { tone: 'friendly' }
 * });
 * ```
 */
export async function generateResponseFromMessage({
  message,
  context,
  spec,
}: {
  message?: string;
  context?: Message[];
  spec?: object;
} = {}): Promise<string> {
  try {
    const response = await fetch('https://pwai.vercel.app/api/generate-response', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        context,
        spec,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || 'Failed to generate response from server.');
    }

    const data: GenerateResponseResult = await response.json();
    return data.text;
  } catch (error) {
    console.error('Error generating response:', error);
    throw error;
  }
}

/**
 * SSE-specific types for streaming responses
 */
export type GenerateResponseSSEParams = {
  message?: string;
  context?: Message[];
  spec?: object;
};

export type GenerateResponseSSECallbacks = {
  onChunk: (chunk: string) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
};

export type SSEAbortFunction = () => void;

/**
 * Generates a response using Server-Sent Events (SSE) for real-time streaming.
 *
 * This function establishes an EventSource connection to the AI backend service
 * and streams text chunks in real-time via callbacks. It handles the [DONE] signal
 * to properly close the connection and provides error handling and cleanup mechanisms.
 *
 * The function uses GET requests with query parameters, encoding complex objects
 * (context, spec) as JSON strings. It returns an abort function to allow manual
 * stream cancellation.
 *
 * @param message - The message to generate a response for (optional)
 * @param context - Previous conversation context (optional)
 * @param spec - Response specification such as persona, tone, etc. (optional)
 * @param onChunk - Callback invoked for each text chunk received from the stream
 * @param onError - Callback invoked when a stream error occurs (optional)
 * @param onComplete - Callback invoked when the stream completes successfully (optional)
 * @returns Abort function that closes the EventSource connection when called
 *
 * @example
 * ```typescript
 * const abort = generateResponseFromMessageSSE({
 *   message: 'Hello',
 *   context: [{ sender: '@user:matrix.org', text: 'Hi', timestamp: '...', is_from_me: false }],
 *   spec: { tone: 'friendly' },
 *   onChunk: (chunk) => console.log('Received:', chunk),
 *   onError: (error) => console.error('Stream error:', error),
 *   onComplete: () => console.log('Stream complete')
 * });
 *
 * // Later, to cancel the stream:
 * abort();
 * ```
 *
 * Event Flow:
 * 1. EventSource connects to streaming endpoint
 * 2. onmessage events trigger onChunk callback for each text chunk
 * 3. [DONE] signal triggers onComplete callback and closes connection
 * 4. onerror events trigger onError callback and close connection
 * 5. Abort function can be called anytime to close connection manually
 */
export function generateResponseFromMessageSSE({
  message,
  context,
  spec,
  onChunk,
  onError,
  onComplete,
}: GenerateResponseSSEParams & GenerateResponseSSECallbacks): SSEAbortFunction {
  try {
    // Build URL with query params
    const url = new URL('https://pwai.vercel.app/api/generate-response');
    if (message) url.searchParams.set('message', message);
    if (context) url.searchParams.set('context', JSON.stringify(context));
    if (spec) url.searchParams.set('spec', JSON.stringify(spec));

    // Create EventSource
    const eventSource = new EventSource(url.toString());

    // Handle incoming messages
    eventSource.onmessage = (event) => {
      const data = event.data;

      if (data === '[DONE]') {
        eventSource.close();
        onComplete?.();
        return;
      }

      onChunk(data);
    };

    // Handle errors
    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      eventSource.close();
      onError?.(new Error('Stream connection error'));
    };

    // Return cleanup function
    return () => {
      eventSource.close();
    };
  } catch (error) {
    // Handle URL construction or other initialization errors
    console.error('SSE Initialization Error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to initialize SSE connection';
    onError?.(new Error(errorMessage));
    // Return a no-op abort function
    return () => {};
  }
}
