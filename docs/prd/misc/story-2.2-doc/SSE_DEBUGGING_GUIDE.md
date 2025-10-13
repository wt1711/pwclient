# SSE Stream Debugging Guide

## Issue: Loading Spinner Not Stopping

### Symptoms

- Connection succeeds (no timeout errors)
- Data chunks are received
- Loading spinner never stops (stream doesn't complete)

### Root Cause Analysis

The `[DONE]` signal isn't being received or processed correctly, preventing `onComplete()` from firing and `setIsGeneratingResponse(false)` from being called.

## Debug Steps

### 1. Check Console Logs

Open your browser DevTools console and look for these log messages:

```
SSE received: [chunk text]           // ✅ Shows data is flowing
SSE received: [DONE]                 // ❓ Is this appearing?
SSE: Received [DONE] signal          // ❓ Is this appearing?
Stream completed successfully        // ❓ Is this appearing?
```

### 2. Diagnose Based on Logs

#### Case A: No `[DONE]` signal received

**Logs show:**

```
SSE received: chunk 1
SSE received: chunk 2
SSE received: chunk 3
[stream just stops, no [DONE]]
```

**Problem:** Server isn't sending the completion signal.

**Fix:** Update your server to send `[DONE]`:

```javascript
// Server-side fix
res.write('data: [DONE]\n\n');
res.end();
```

#### Case B: Different completion format

**Logs show:**

```
SSE received: {"status":"complete"}
// or
SSE received: done
// or
SSE received: [COMPLETE]
```

**Problem:** Server sends completion in different format.

**Fix:** Update the check in `ai.ts`:

```typescript
if (data === '[DONE]' || data === 'done' || data.includes('"status":"complete"')) {
  // handle completion
}
```

#### Case C: Signal received but onComplete not firing

**Logs show:**

```
SSE received: [DONE]
SSE: Received [DONE] signal
[but "Stream completed successfully" doesn't appear]
```

**Problem:** `onComplete` callback is undefined or failing.

**Fix:** Check that callback is properly passed in `AIAssistantContext.tsx`.

#### Case D: Everything logs correctly but UI doesn't update

**Logs show:**

```
SSE received: [DONE]
SSE: Received [DONE] signal
Stream completed successfully
[but spinner still visible]
```

**Problem:** State update issue in React.

**Fix:** Check React DevTools to see if `isGeneratingResponse` is actually updating.

### 3. Server Response Format

Your server MUST send SSE events in this exact format:

```javascript
// Correct format
res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');
res.setHeader('Connection', 'keep-alive');

// For each chunk
res.write(`data: ${chunk}\n\n`);

// For completion (CRITICAL!)
res.write('data: [DONE]\n\n');
res.end();
```

**Common mistakes:**

```javascript
// ❌ WRONG - Missing double newline
res.write(`data: [DONE]\n`);

// ❌ WRONG - Wrong format
res.write(`[DONE]\n\n`);

// ❌ WRONG - JSON without 'data:' prefix
res.write(`{"status":"done"}\n\n`);

// ✅ CORRECT
res.write('data: [DONE]\n\n');
```

### 4. Test Server Response Manually

Use `curl` to check what your server actually sends:

```bash
curl -X POST http://localhost:3000/api/generate-response \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}' \
  -N
```

**Expected output:**

```
data: chunk 1

data: chunk 2

data: chunk 3

data: [DONE]
```

### 5. Network Tab Verification

1. Open Chrome DevTools → Network tab
2. Trigger the AI assistant
3. Find the `generate-response` request
4. Look at the **Response** tab
5. Verify you see `data: [DONE]` at the end

## Implementation Details

### Current Flow

```
1. User triggers generation
   → setIsGeneratingResponse(true) ✅

2. SSE connection opens
   → fetchEventSource starts ✅

3. Chunks arrive
   → onChunk() called ✅
   → UI updates with partial text ✅

4. [DONE] signal arrives
   → onComplete() should fire
   → setIsGeneratingResponse(false) should execute
   → Spinner should hide
```

### Code Protection Against False Errors

The implementation includes an `isDone` flag to prevent:

- Abort errors from triggering `onError` after successful completion
- Double error handling
- Error state after stream completed successfully

```typescript
let isDone = false;

if (data === '[DONE]') {
  isDone = true; // Mark as done first
  onComplete?.(); // Call completion callback
  abortController.abort(); // Then abort (may trigger onerror)
}

onerror: (error) => {
  if (isDone) {
    // Ignore errors after successful completion
    throw error;
  }
  // Handle real errors
};
```

## Quick Fixes

### If you control the server:

**Option 1: Ensure [DONE] is sent**

```javascript
res.write('data: [DONE]\n\n');
res.end();
```

**Option 2: Use a timeout fallback** (not recommended, but works)

```typescript
// In AIAssistantContext.tsx
setTimeout(() => {
  if (isGeneratingResponse) {
    console.warn('Stream timeout - forcing completion');
    setIsGeneratingResponse(false);
  }
}, 30000); // 30 seconds
```

### If server format is different:

Update the condition in `ai.ts`:

```typescript
// Support multiple completion formats
const isComplete =
  data === '[DONE]' ||
  data === 'done' ||
  data === '[END]' ||
  (data.startsWith('{') && JSON.parse(data).status === 'complete');

if (isComplete) {
  isDone = true;
  onComplete?.();
  abortController.abort();
  return;
}
```

## Remove Debug Logs

Once issue is resolved, remove console.log statements:

```typescript
// Remove these from ai.ts:
console.log('SSE received:', data);
console.log('SSE: Received [DONE] signal');
console.log('SSE: Ignoring error after successful completion');

// Remove from AIAssistantContext.tsx:
console.log('Stream completed successfully');
```

## Still Not Working?

1. **Check React DevTools** - Verify state updates
2. **Check Network latency** - Ensure chunks arrive in order
3. **Check CORS headers** - Server must allow streaming
4. **Test with simple server** - Isolate the issue
5. **Compare with working example** - Use the fetchEventSource demo

## Working Test Server Example

```javascript
import express from 'express';
const app = express();

app.post('/api/generate-response', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const chunks = ['Hello', ' ', 'World', '!'];

  chunks.forEach((chunk, i) => {
    setTimeout(() => {
      res.write(`data: ${chunk}\n\n`);

      // Send [DONE] after last chunk
      if (i === chunks.length - 1) {
        res.write('data: [DONE]\n\n');
        res.end();
      }
    }, i * 500);
  });
});

app.listen(3000);
```
