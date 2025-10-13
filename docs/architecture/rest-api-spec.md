# REST API Specifications

## Overview

This document specifies the external REST API endpoints that Pocket Wingman integrates with for AI-powered features.

## New AI Backend Service

### Base URL

```
https://pwai.vercel.app
```

### Authentication

- **No authentication required** for current endpoints
- No API keys or tokens needed

### Common Headers

```
Content-Type: application/json
```

---

## Endpoint: Generate Response

### Purpose

Generates an AI response based on a message, conversation context, and optional specifications (persona, tone).

### Request

**Method**: `POST`

**Endpoint**: `/api/generate-response`

**Content-Type**: `application/json`

**Request Body Schema**:

```typescript
{
  message?: string;        // Optional: The message to generate a response for
  context?: Array<{        // Optional: Previous conversation messages
    sender: string;        // User ID or display name
    text: string;          // Message content
    timestamp: string;     // ISO 8601 timestamp
    is_from_me: boolean;   // Whether message is from current user
  }>;
  spec?: object;           // Optional: Response specification (persona, tone, etc.)
}
```

**Important**: All fields are optional. The API accepts an empty payload `{}`.

**Example Request**:

```json
POST https://pwai.vercel.app/api/generate-response
Content-Type: application/json

{
  "message": "How are you doing today?",
  "context": [
    {
      "sender": "@alice:matrix.org",
      "text": "Hey, how's it going?",
      "timestamp": "2025-01-15T10:00:00Z",
      "is_from_me": false
    },
    {
      "sender": "@me:matrix.org",
      "text": "Pretty good, just working on some code!",
      "timestamp": "2025-01-15T10:01:00Z",
      "is_from_me": true
    }
  ],
  "spec": {
    "persona": "friendly",
    "tone": {
      "formality": 30,
      "enthusiasm": 70
    }
  }
}
```

**Example Minimal Request**:

```json
POST https://pwai.vercel.app/api/generate-response
Content-Type: application/json

{
  "message": "Hello"
}
```

**Example Empty Request**:

```json
POST https://pwai.vercel.app/api/generate-response
Content-Type: application/json

{}
```

### Response

**Success Response (200 OK)**:

```typescript
{
  text: string; // The generated response text
}
```

**Example Success Response**:

```json
{
  "text": "That's wonderful to hear! Coding is always an adventure. What are you working on specifically?"
}
```

**Error Response (400/500)**:

```typescript
{
  error: string;           // Error message
  details?: string;        // Optional additional details
}
```

**Example Error Response**:

```json
{
  "error": "Failed to generate response",
  "details": "Service temporarily unavailable"
}
```

### TypeScript Client Example

```typescript
async function generateResponseFromMessage({
  message,
  context,
  spec,
}: {
  message?: string;
  context?: Message[];
  spec?: object;
}): Promise<string> {
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
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate response from server.');
    }

    const data = await response.json();
    return data.text; // Note: Response uses 'text' field
  } catch (error) {
    console.error('Error generating response:', error);
    throw error;
  }
}
```

### Error Handling

**Possible Error Scenarios:**

1. **Network Error**: Request fails to reach server
2. **Server Error (500)**: Internal server error
3. **Bad Request (400)**: Invalid request format
4. **Timeout**: Request takes too long

**Client Error Handling Pattern**:

```typescript
try {
  const result = await generateResponseFromMessage(payload);
  // Handle success
} catch (error) {
  // Display user-friendly error message
  // Log error for debugging
  console.error('API Error:', error);
  return 'Sorry, failed to generate response.';
}
```

---

## Legacy Endpoints (Current Implementation)

### Base URL (Legacy)

```
https://wmaide-server.vercel.app
```

### Endpoint: Get Suggestion (Legacy)

**Method**: `POST`

**Endpoint**: `/api/suggestion`

**Request Body**:

```typescript
{
  context: Message[];
  selectedMessage: Message;
  question?: string;
}
```

**Response**:

```typescript
{
  suggestion: string;
}
```

**Note**: This endpoint will be **deprecated** once migration to new backend is complete.

### Endpoint: Generate Response (Legacy)

**Method**: `POST`

**Endpoint**: `/api/generate-response`

**Request Body**:

```typescript
{
  message: string;
  context: Message[];
  spec: object;
}
```

**Response**:

```typescript
{
  response: string; // Note: Different field name than new API
}
```

**Note**: Current implementation at `https://wmaide-server.vercel.app` will be replaced by new backend at `https://pwai.vercel.app`.

### Endpoint: Grade Response (Legacy)

**Method**: `POST`

**Endpoint**: `/api/grade-response`

**Request Body**:

```typescript
{
  response: string;
  context: Message[];
}
```

**Response**:

```typescript
{
  grade: number; // Numeric grade (0-100)
}
```

---

## Migration Notes

### Key Differences Between Old and New API

| Aspect          | Legacy (`wmaide-server`)   | New (`pwai`)      |
| --------------- | -------------------------- | ----------------- |
| Base URL        | `wmaide-server.vercel.app` | `pwai.vercel.app` |
| Response field  | `response`                 | `text`            |
| Required fields | All required               | All optional      |
| Empty payload   | Not supported              | Supported         |

### Migration Checklist for Story 1.1

1. ✅ Update base URL to `https://pwai.vercel.app`
2. ✅ Update response parsing to use `data.text` instead of `data.response`
3. ✅ Ensure all payload fields are optional
4. ✅ Test with empty payload `{}`
5. ✅ Update error handling
6. ✅ Update tests

---

## API Integration Best Practices

### Request Construction

1. Always include `Content-Type: application/json` header
2. Properly serialize payload with `JSON.stringify()`
3. Handle all fields as optional

### Response Handling

1. Check `response.ok` before parsing JSON
2. Parse error response body for error details
3. Provide user-friendly error messages

### Error Recovery

1. Log errors to console for debugging
2. Display fallback messages on error
3. Don't expose raw error messages to users
4. Consider retry logic for network errors (future enhancement)

### Performance Considerations

1. API calls may take 2-5 seconds
2. Show loading state during request
3. Prevent duplicate requests (debounce if needed)
4. Consider request timeout (future enhancement)

### Testing API Integration

1. Mock `fetch` in unit tests
2. Test success response handling
3. Test error response handling
4. Test network error handling
5. Test with various payload combinations (empty, partial, full)

---

## Future API Enhancements

### Streaming API (Planned)

- **Purpose**: Stream response tokens as they're generated
- **Benefit**: Lower perceived latency, better UX
- **Implementation**: Server-Sent Events or WebSocket
- **Status**: Not yet available, but architecture should support future migration

### Additional Endpoints (Potential)

- `/api/grade-response` - Grade message quality
- `/api/suggestion` - Get contextual suggestions
- `/api/personas` - Fetch available personas
- `/api/tone-presets` - Fetch tone presets
