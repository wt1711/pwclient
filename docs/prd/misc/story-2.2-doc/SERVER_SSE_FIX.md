# Server-Side SSE Fix Required

## Current Problem

Your server at `http://localhost:3000/api/generate-response` is returning:

- Plain text/JSON response: `"Oh, are we testing..."`
- Missing SSE format with `data: ` prefix
- No streaming chunks
- No `[DONE]` signal

## Required Server Implementation

Your server **MUST** send responses in Server-Sent Events format:

### Correct Implementation

```javascript
app.post('/api/generate-response', async (req, res) => {
  const { message, context, spec } = req.body;

  // 1. Set SSE headers (REQUIRED)
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*'); // If needed for CORS

  // Prevent response buffering
  res.flushHeaders();

  try {
    // 2. Generate response (your AI logic here)
    const fullResponse = await generateAIResponse(message, context, spec);

    // 3. Stream chunks to client
    // Option A: Stream word by word
    const words = fullResponse.split(' ');
    for (let i = 0; i < words.length; i++) {
      const chunk = i === 0 ? words[i] : ' ' + words[i];

      // CRITICAL: Must include "data: " prefix and double newline
      res.write(`data: ${chunk}\n\n`);

      // Optional: Add delay for visible streaming effect
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    // Option B: Stream character by character (slower but smoother)
    // for (const char of fullResponse) {
    //   res.write(`data: ${char}\n\n`);
    //   await new Promise(resolve => setTimeout(resolve, 20));
    // }

    // 4. Send completion signal (CRITICAL!)
    res.write('data: [DONE]\n\n');

    // 5. Close connection
    res.end();
  } catch (error) {
    console.error('SSE Error:', error);
    res.write(`data: Error: ${error.message}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});
```

### SSE Format Rules

**Every message MUST follow this format:**

```
data: [your content here]\n\n
```

- `data: ` prefix (with space after colon)
- Your content
- `\n\n` (TWO newlines)

### Examples

**✅ CORRECT:**

```javascript
res.write('data: Hello\n\n');
res.write('data: World\n\n');
res.write('data: [DONE]\n\n');
```

**❌ WRONG:**

```javascript
res.write('Hello\n\n'); // Missing "data: "
res.write('data: Hello\n'); // Only one newline
res.write('data:Hello\n\n'); // Missing space after colon
res.json({ text: 'Hello' }); // Not SSE format
res.send('Hello World'); // Not SSE format
```

### Testing Your Fix

After updating your server, test with curl:

```bash
curl -X POST http://localhost:3000/api/generate-response \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}' \
  -N
```

**Expected output:**

```
data: Hello

data:

data: World

data: [DONE]
```

**Current (broken) output:**

```
"Oh, are we testing how quickly I can charm you back?"
```

### If Using AI Streaming API (OpenAI, Anthropic, etc.)

```javascript
// Example with OpenAI streaming
const stream = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: message }],
  stream: true,
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content || '';
  if (content) {
    // Convert AI stream to SSE format
    res.write(`data: ${content}\n\n`);
  }
}

res.write('data: [DONE]\n\n');
res.end();
```

### Quick Test Server (Copy-Paste Ready)

```javascript
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/generate-response', async (req, res) => {
  const { message, context, spec } = req.body;

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Simulate streaming response
  const response = 'Hello! This is a streaming response from the server.';
  const words = response.split(' ');

  for (let i = 0; i < words.length; i++) {
    const chunk = i === 0 ? words[i] : ' ' + words[i];
    res.write(`data: ${chunk}\n\n`);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  res.write('data: [DONE]\n\n');
  res.end();
});

app.listen(3000, () => {
  console.log('SSE Server running on http://localhost:3000');
});
```

## Summary

**The issue is 100% on the server side.** Your client code is correct, but the server needs to:

1. ✅ Set `Content-Type: text/event-stream` header
2. ✅ Send each chunk with `data: ` prefix
3. ✅ End each chunk with `\n\n` (double newline)
4. ✅ Send `data: [DONE]\n\n` when finished
5. ✅ Call `res.end()` to close connection

Without these, `fetchEventSource` cannot parse the response as SSE.
