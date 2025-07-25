type Message = {
  sender: string;
  text: string;
  timestamp: string;
  is_from_me: boolean;
};

function formatMessagesForPrompt(messages: Message[]): string {
  return messages.map((m) => `${m.sender}: ${m.text}`).join('\n');
}

export const createComprehensivePrompt = (
  context: Message[],
  selectedMessage: Message,
  question?: string
): string => {
  const formattedContext = formatMessagesForPrompt(context);
  const formattedSelectedMessage = `${selectedMessage.sender}: "${selectedMessage.text}"`;

  let prompt = `Bạn là Wingman AI, một trợ lý hữu ích chuyên đưa ra lời khuyên hẹn hò và gợi ý câu trả lời trong các cuộc trò chuyện. Các lời khuyên của bạn cần hữu ích, tôn trọng và mang tính khích lệ. Tôi có một cuộc trò chuyện như thế này:\n\n${formattedContext}\n\nVà tôi có một câu hỏi về tin nhắn này: ${formattedSelectedMessage}.`;

  if (question) {
    prompt += `\nCâu hỏi là: "${question}"`;
  }

  return prompt;
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
