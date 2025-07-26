import React, { useState } from 'react';
import { Box, Text, Spinner, Button } from 'folds';

type GeneratedResponseBoxProps = {
  onUseSuggestion: (response: string) => void;
};

export function GeneratedResponseBox({ onUseSuggestion }: GeneratedResponseBoxProps) {
  const [generatedResponse, setGeneratedResponse] = useState('');
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);

  const generateNewResponse = () => {
    setIsGeneratingResponse(true);

    // Mock response generation
    setTimeout(() => {
      const mockResponses = [
        'Dạ vâng, chị cứ đến nhé! Em rất mong được gặp chị. Đường về hơi kẹt một chút, nhưng em sẽ ở nhà chờ chị.',
        'Không có gì ạ! Em rất vui được giúp đỡ chị. Nếu chị cần gì thêm, cứ nhắn em nhé!',
        'Em nghĩ chị nên đi lúc 7 giờ tối sẽ phù hợp nhất. Lúc đó đường cũng bớt kẹt hơn.',
        'Dạ vâng, em hiểu rồi ạ. Em sẽ chuẩn bị sẵn sàng cho chị.',
        'Cảm ơn chị đã thông báo! Em sẽ đợi chị ở nhà.',
        'Chị cứ yên tâm đi, em sẽ lo mọi thứ ạ!',
      ];

      const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      setGeneratedResponse(randomResponse);
      setIsGeneratingResponse(false);
    }, 1000);
  };

  const useSuggestion = () => {
    if (generatedResponse) {
      onUseSuggestion(generatedResponse);
    }
  };

  return (
    <Box
      direction="Column"
      gap="200"
      style={{
        padding: '16px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
      }}
    >
      <Text size="L400" style={{ fontWeight: 'bold' }}>
        GỢI Ý CHO TIN NHẮN:
      </Text>
      {generatedResponse ? (
        <Box direction="Column" gap="200">
          <Text style={{ padding: '12px', backgroundColor: 'white', borderRadius: '6px' }}>
            {generatedResponse}
          </Text>
          <Box direction="Row" gap="200">
            <Button variant="Primary" onClick={useSuggestion} disabled={!generatedResponse}>
              <Text size="B400">Dùng gợi ý</Text>
            </Button>
            <Button
              variant="Secondary"
              onClick={generateNewResponse}
              disabled={isGeneratingResponse}
            >
              <Text size="B400">Tạo gợi ý mới</Text>
            </Button>
          </Box>
        </Box>
      ) : (
        <Box direction="Column" gap="200" alignItems="Center">
          <Text size="T400" style={{ color: '#666' }}>
            Chưa có gợi ý nào được tạo
          </Text>
          <Button variant="Primary" onClick={generateNewResponse} disabled={isGeneratingResponse}>
            {isGeneratingResponse ? <Spinner size="200" /> : <Text size="B400">Tạo gợi ý mới</Text>}
          </Button>
        </Box>
      )}
    </Box>
  );
}
