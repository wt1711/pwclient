# POST-based SSE Implementation

## Problem Statement

The native `EventSource` API in browsers only supports GET requests, which causes issues when:

- Large conversation context needs to be sent (URL length limits ~2-8KB)
- Complex JSON payloads are required
- Custom headers or authentication is needed

Our original implementation hit URL length limits when sending large conversation histories, causing connection failures.

## Solution: @microsoft/fetch-event-source

We migrated from native `EventSource` to `@microsoft/fetch-event-source`, which provides:

### Key Benefits

1. **POST Request Support** - Send data in request body instead of URL parameters
2. **No URL Length Limits** - Can send entire conversation context without truncation
3. **Custom Headers** - Support for authentication, content-type, etc.
4. **Better Error Handling** - More granular control over error states
5. **Automatic Reconnection** - Built-in retry logic (configurable)
6. **TypeScript Support** - Full type safety

### Implementation Details

```typescript
import { fetchEventSource } from '@microsoft/fetch-event-source';

export function generateResponseFromMessageSSE({
  message,
  context,
  spec,
  onChunk,
  onError,
  onComplete,
}: GenerateResponseSSEParams & GenerateResponseSSECallbacks): SSEAbortFunction {
  const abortController = new AbortController();

  fetchEventSource('http://localhost:3000/api/generate-response', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      context, // Full context, no truncation needed
      spec,
    }),
    signal: abortController.signal,

    onopen: async (response) => {
      // Handle connection opening
    },

    onmessage: (event) => {
      // Process each chunk
    },

    onerror: (error) => {
      // Handle errors
    },
  });

  return () => abortController.abort();
}
```

## API Comparison

### Before (Native EventSource - GET only)

```typescript
// Limited to URL parameters
const url = new URL('http://localhost:3000/api/generate-response');
url.searchParams.set('message', message);
url.searchParams.set('context', JSON.stringify(context)); // ❌ URL length limit
url.searchParams.set('spec', JSON.stringify(spec));

const eventSource = new EventSource(url.toString());
```

### After (fetch-event-source - POST support)

```typescript
// Full JSON body support
fetchEventSource('http://localhost:3000/api/generate-response', {
  method: 'POST',
  body: JSON.stringify({
    message,
    context, // ✅ No size restrictions
    spec,
  }),
});
```

## Server-Side Requirements

Your SSE endpoint must:

1. **Accept POST requests** with JSON body
2. **Set proper headers** for SSE:
   ```javascript
   res.setHeader('Content-Type', 'text/event-stream');
   res.setHeader('Cache-Control', 'no-cache');
   res.setHeader('Connection', 'keep-alive');
   ```
3. **Send data in SSE format**:
   ```javascript
   res.write(`data: ${chunk}\n\n`);
   ```
4. **Send completion signal**:
   ```javascript
   res.write('data: [DONE]\n\n');
   res.end();
   ```

## Error Handling

The implementation handles:

- HTTP errors (4xx, 5xx) via `onopen` callback
- Network errors via `onerror` callback
- Abrupt disconnections via `AbortController`
- Retry logic (configurable via `openWhenHidden` option)

## Migration Impact

✅ **No breaking changes** - The function signature remains identical, making it a drop-in replacement.

The same callbacks are used:

- `onChunk(chunk: string)` - Receives each text chunk
- `onError(error: Error)` - Handles errors
- `onComplete()` - Called when stream finishes

## Testing

Existing tests in `ai.sse.test.ts` will need updates to mock `fetchEventSource` instead of `EventSource`.

## References

- [fetch-event-source GitHub](https://github.com/Azure/fetch-event-source)
- [MDN: Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [EventSource Limitations](https://developer.mozilla.org/en-US/docs/Web/API/EventSource#limitations)
