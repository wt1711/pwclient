import { fetchEventSource } from '@microsoft/fetch-event-source';

/**
 * Message type for conversation context
 */
export type Message = {
  sender: string;
  text: string;
  timestamp: string;
  is_from_me: boolean;
};

/**
 * Parameters for starting a streaming request
 */
export type StreamingServiceParams = {
  endpoint: string;
  message?: string;
  context?: Message[];
  spec?: object;
};

/**
 * Callback functions for handling stream events
 */
export type StreamingServiceCallbacks = {
  onChunk: (chunk: string) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
};

/**
 * Abort function returned by startStream to cancel the connection
 */
export type StreamAbortFunction = () => void;

/**
 * Starts a Server-Sent Events (SSE) streaming connection for real-time response generation.
 *
 * This service establishes a POST-based SSE connection to the AI backend and streams
 * text chunks in real-time via callbacks. It handles the [DONE] signal to properly
 * close the connection and provides comprehensive error handling and cleanup mechanisms.
 *
 * Uses @microsoft/fetch-event-source to support POST requests with JSON bodies,
 * overcoming the native EventSource limitation of GET-only requests. This allows
 * sending large context arrays without URL length restrictions.
 *
 * @param params - Streaming parameters including endpoint, message, context, and spec
 * @param callbacks - Event callbacks for chunks, errors, and completion
 * @returns Abort function that closes the SSE connection when called
 *
 * @example
 * ```typescript
 * const abort = startStream(
 *   {
 *     endpoint: 'https://pwai.vercel.app/api/generate-response',
 *     message: 'Hello',
 *     context: [{ sender: '@user:matrix.org', text: 'Hi', timestamp: '...', is_from_me: false }],
 *     spec: { tone: 'friendly' }
 *   },
 *   {
 *     onChunk: (chunk) => console.log('Received:', chunk),
 *     onError: (error) => console.error('Stream error:', error),
 *     onComplete: () => console.log('Stream complete')
 *   }
 * );
 *
 * // Later, to cancel the stream:
 * abort();
 * ```
 *
 * Event Flow:
 * 1. POST request initiated with JSON body containing message, context, and spec
 * 2. Server responds with SSE stream
 * 3. onmessage events trigger onChunk callback for each text chunk
 * 4. [DONE] signal triggers onComplete callback and closes connection
 * 5. Error events trigger onError callback and close connection
 * 6. Abort function can be called anytime to close connection manually
 *
 * Error Scenarios:
 * - HTTP errors (non-200 responses): Handled in onopen, triggers onError
 * - Network errors: Triggers onError with network error message
 * - Stream errors: Triggers onError during transmission
 * - No error callbacks occur after successful completion (isDone flag prevents it)
 */
export function startStream(
  params: StreamingServiceParams,
  callbacks: StreamingServiceCallbacks
): StreamAbortFunction {
  const { endpoint, message, context, spec } = params;
  const { onChunk, onError, onComplete } = callbacks;

  const abortController = new AbortController();
  let isDone = false; // Track if stream completed successfully

  // Use fetchEventSource for POST-based SSE
  fetchEventSource(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      context,
      spec,
    }),
    signal: abortController.signal,

    onopen: async (response) => {
      if (response.ok) {
        return; // Connection successful
      }

      // Handle HTTP errors
      const error = await response.text();
      throw new Error(error || `HTTP ${response.status}: ${response.statusText}`);
    },

    onmessage: (event) => {
      const { data } = event;

      if (data === '[DONE]') {
        isDone = true;
        onComplete?.();
        abortController.abort(); // Abort after calling onComplete
        return;
      }

      onChunk(data);
    },

    onerror: (error) => {
      // Don't handle error if we already completed successfully
      if (isDone) {
        throw error; // Throw to stop retrying
      }

      // Only log in development for debugging
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('SSE Error:', error);
      }
      abortController.abort();

      const errorMessage = error instanceof Error ? error.message : 'Stream connection error';
      onError?.(new Error(errorMessage));

      // Throw to stop fetchEventSource from retrying
      throw error;
    },

    // Disable automatic retries for clearer error handling
    openWhenHidden: false,
  }).catch((error) => {
    // Handle any uncaught errors from fetchEventSource
    // Ignore AbortError and errors after successful completion
    if (error.name !== 'AbortError' && !isDone) {
      // Only log in development for debugging
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('SSE Initialization Error:', error);
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to initialize SSE connection';
      onError?.(new Error(errorMessage));
    }
  });

  // Return cleanup/abort function
  return () => {
    abortController.abort();
  };
}
