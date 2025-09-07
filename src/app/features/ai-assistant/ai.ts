export type Message = {
  sender: string;
  text: string;
  timestamp: string;
  is_from_me: boolean;
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

export async function generateResponseFromMessage({
  message,
  context,
  tone,
}: {
  message: string;
  context: Message[];
  tone: string;
}): Promise<string> {
  try {
    const response = await fetch('https://wmaide-server.vercel.app/api/generate-response', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        context,
        tone,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate response from server.');
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    return 'Xin lỗi, đã có lỗi khi tạo phản hồi.';
  }
}

export async function generateResponseFromHistory({
  context,
}: {
  context: Message[];
}): Promise<string> {
  try {
    const response = await fetch(
      'https://wmaide-server.vercel.app/api/generate-response-from-history',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate response from server.');
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.log('error response from history', error);
    return 'Xin lỗi, đã có lỗi khi tạo phản hồi.';
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
