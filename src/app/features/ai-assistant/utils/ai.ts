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
