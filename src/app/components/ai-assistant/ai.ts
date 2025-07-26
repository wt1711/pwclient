export type Message = {
  sender: string;
  text: string;
  timestamp: string;
  is_from_me: boolean;
};

export async function getOpenAISuggestion(
  context: Message[],
  selectedMessage: Message,
  question?: string
): Promise<string> {
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
    console.error('API error:', error);
    return 'Xin lỗi, đã có lỗi khi lấy gợi ý.';
  }
}

export async function generateResponse(message: string): Promise<string> {
  try {
    const response = await fetch('https://wmaide-server.vercel.app/api/generate-response', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate response from server.');
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('API error:', error);
    return 'Xin lỗi, đã có lỗi khi tạo phản hồi.';
  }
}
