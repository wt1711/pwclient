# Data Models

## Overview

This document describes the key data structures and type definitions used in the Pocket Wingman application.

## AI Assistant Feature Models

### Message Type

Represents a chat message in conversation context.

**Location**: `src/app/features/ai-assistant/utils/ai.ts`

```typescript
export type Message = {
  sender: string; // User ID (e.g., '@user:matrix.org')
  text: string; // Message content
  timestamp: string; // ISO 8601 timestamp
  is_from_me: boolean; // Whether message is from current user
};
```

**Usage:**

```typescript
const message: Message = {
  sender: '@alice:matrix.org',
  text: 'Hello, how are you?',
  timestamp: '2025-01-15T10:30:00Z',
  is_from_me: false,
};
```

### Chat with AI Assistant Message

Internal message type for AI Assistant chat history.

**Location**: `src/app/features/ai-assistant/AIAssistantContext.tsx`

```typescript
export type ChatWithAIAssistantMessage = {
  sender: 'user' | 'ai'; // Message sender type
  text: string; // Message content
  timestamp: number; // Unix timestamp in milliseconds
};
```

### Persona

AI response persona configuration.

**Location**: `src/app/features/ai-assistant/AIAssistantContext.tsx` (inferred)

```typescript
type Persona = {
  id: string; // Unique identifier
  name: string; // Display name (e.g., "Professional")
  description?: string; // Persona description
};
```

**Example Usage:**

```typescript
const personas = [
  { id: 'professional', name: 'Professional' },
  { id: 'casual', name: 'Casual' },
  { id: 'friendly', name: 'Friendly' },
  { id: 'formal', name: 'Formal' },
];
```

### Tone Property

Tone configuration for response generation.

**Location**: `src/app/features/ai-assistant/AIAssistantContext.tsx` (inferred)

```typescript
type ToneProperty = {
  id: string; // Property identifier (e.g., 'formality')
  name: string; // Display name (e.g., 'Formality')
  description?: string; // Property description
};

type ToneValues = Record<string, number>; // Maps property ID to value (0-100)
```

**Example Usage:**

```typescript
const toneProperties = [
  { id: 'formality', name: 'Formality' },
  { id: 'enthusiasm', name: 'Enthusiasm' },
  { id: 'brevity', name: 'Brevity' },
];

const toneValues: ToneValues = {
  formality: 70,
  enthusiasm: 50,
  brevity: 30,
};
```

### Spec Object

Combined specification for AI response generation (persona + tone).

**Type**: Generic object with persona and tone properties

```typescript
type ResponseSpec = {
  persona?: Persona;
  tone?: ToneValues;
  // Additional specification fields as needed
};
```

## API Request/Response Models

### Generate Response Payload

**API Endpoint**: `POST /api/generate-response`

```typescript
type GenerateResponsePayload = {
  message?: string; // Optional: Message to respond to
  context?: Message[]; // Optional: Conversation context
  spec?: object; // Optional: Response specification (persona, tone)
};
```

**All fields are optional** - the API accepts empty payloads.

### Generate Response Result

**API Response Format:**

```typescript
type GenerateResponseResult = {
  text: string; // Generated response text
};
```

**Example Response:**

```json
{
  "text": "That's a great question! Based on the context..."
}
```

### Get Consultation Payload

**API Endpoint**: `POST /api/suggestion` (current implementation)

```typescript
type GetConsultationPayload = {
  context: Message[];
  selectedMessage: Message;
  question?: string;
};
```

### Grade Message Payload

**API Endpoint**: `POST /api/grade-response` (current implementation)

```typescript
type GradeMessagePayload = {
  response: string;
  context: Message[];
};

type GradeMessageResult = {
  grade: number; // Numeric grade (0-100)
};
```

## AI Assistant Context State

State managed by `AIAssistantContext`.

**Location**: `src/app/features/ai-assistant/AIAssistantContext.tsx`

```typescript
type AIAssistantContextValue = {
  // Input and chat state
  inputValue: string;
  setInputValue: (value: string) => void;
  chatHistory: ChatWithAIAssistantMessage[];
  setChatHistory: (history: ChatWithAIAssistantMessage[]) => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Generated response state
  generatedResponse: string;
  setGeneratedResponse: (response: string) => void;
  isGeneratingResponse: boolean;
  setIsGeneratingResponse: (generating: boolean) => void;

  // UI state
  isAIAssistantOpen: boolean;
  toggleAIAssistant: (isOpen?: boolean) => void;

  // Persona and tone state
  selectedPersona: Persona;
  setSelectedPersona: (persona: Persona) => void;
  selectedProperty: ToneProperty;
  setSelectedProperty: (property: ToneProperty) => void;
  toneValues: ToneValues;
  setToneValues: (values: ToneValues) => void;

  // Prediction state
  prediction: {
    emoji: string;
    grade: string;
    score: number;
  } | null;
  setPrediction: (prediction: any) => void;

  // Actions
  handleUseSuggestion: () => void;
  regenerateResponse: () => void;
  handlePersonaChange: (persona: Persona) => void;
  handleSend: () => Promise<void>;
};
```

## Matrix SDK Data Models

### Room

Represents a Matrix chat room.

**Source**: `matrix-js-sdk`

```typescript
// Accessed via useRoom() hook
const room: Room = useRoom();

// Common methods:
room.getLiveTimeline();
room.getMyMembership();
room.getJoinedMemberCount();
```

### MatrixClient

Main Matrix SDK client.

**Source**: `matrix-js-sdk`

```typescript
// Accessed via useMatrixClient() hook
const mx: MatrixClient = useMatrixClient();

// Common methods:
mx.getUserId();
mx.sendMessage(roomId, content);
```

### MatrixEvent

Represents a Matrix event (message, state change, etc.).

**Source**: `matrix-js-sdk`

```typescript
const event: MatrixEvent = timeline.getEvents()[0];

// Common methods:
event.getSender();
event.getContent();
event.getTs(); // Timestamp
event.getType();
```

## Form Data Models

### Settings

Application settings stored in Jotai atoms.

**Location**: `src/app/state/settings.ts` (assumed)

```typescript
type Settings = {
  theme?: 'light' | 'dark';
  isAiDrawerOpen?: boolean;
  // Other settings...
};
```

## Error Models

### API Error Response

```typescript
type APIErrorResponse = {
  error: string; // Error message
  details?: string; // Additional details
  code?: string; // Error code
};
```

## Type Exports

### Best Practices

- Export types alongside implementation when related
- Use `type` keyword for type aliases
- Use `interface` for object shapes that might be extended
- Co-locate types with the feature that uses them

### Example Export Pattern

```typescript
// src/app/features/ai-assistant/utils/ai.ts

export type Message = {
  /* ... */
};

export async function generateResponseFromMessage(params: GenerateResponseParams): Promise<string> {
  // Implementation
}
```

## Type Safety Guidelines

1. **Avoid `any`**: Use `unknown` for truly unknown types
2. **Define return types**: Explicit return types for functions
3. **Use discriminated unions**: For state that can be in different modes
   ```typescript
   type LoadingState =
     | { status: 'idle' }
     | { status: 'loading' }
     | { status: 'success'; data: string }
     | { status: 'error'; error: Error };
   ```
4. **Optional vs Required**: Be explicit about optional fields with `?`
5. **Readonly**: Use `Readonly<T>` or `readonly` for immutable data
