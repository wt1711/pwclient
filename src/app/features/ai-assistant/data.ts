export const typeTagObjs = {
  VI: [
    'Mạnh mẽ',
    'Nhẹ nhàng',
    'Tham vọng',
    'Khiêm nhường',
    'Nghiêm túc',
    'Hài hước',
    'Lãng mạn',
    'Thực tế',
    'Tự tin',
    'Khiêm tốn',
    'Hiện đại',
    'Truyền thống',
  ],
  EN: ['Strong', 'Gentle', 'Ambitious', 'Modest', 'Serious', 'Funny', 'Romantic', 'Realistic'],
};

const stringToHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash += str.charCodeAt(i);
  }
  return hash;
};

export const getDateTypes = (seedString: string, locale: string): string[] => {
  const typeTags = typeTagObjs[locale as keyof typeof typeTagObjs];
  const seed = stringToHash(seedString);
  const isEven = seed % 2 === 0;
  const allPropsToChoose = typeTags.filter((_, idx) => (isEven ? idx % 2 === 0 : idx % 2 === 1));
  const totalPropsPairs = typeTags.length / 2;
  const numOfPropsToChoose = Math.min((seed % totalPropsPairs) + 1, 3);
  return allPropsToChoose.slice(0, numOfPropsToChoose);
};

export const stats = {
  VI: [
    {
      label: 'Phù hợp',
      value: '95%',
      valueColor: 'var(--tc-caution-high)',
      backgroundColor: 'var(--bg-caution-active)',
    },
    {
      label: 'Sức nóng',
      value: '🌡️ 70',
      valueColor: 'var(--tc-danger-high)',
      backgroundColor: 'var(--bg-caution-active)',
    },
  ],
  EN: [
    {
      label: 'Match',
      value: '75%',
      valueColor: 'var(--tc-caution-high)',
      backgroundColor: 'var(--bg-caution-active)',
    },
    {
      label: 'Heat',
      value: '🌡️ 90',
      valueColor: 'var(--tc-danger-high)',
      backgroundColor: 'var(--bg-caution-active)',
    },
  ],
};

export const summary = {
  VI: 'Hiện tại bạn và cô ấy đang trong giai đoạn thả thính qua lại tinh nghịch, nhiều tò mò nhưng chưa ràng buộc – giống như một “trò chơi hấp dẫn” hơn là một mối quan hệ nghiêm túc.',
  EN: 'Right now, you and her are in the stage of back and forth flirting, with lots of curiosity but not yet a bond – more of an "enchanting game” than a cohesive relationship.',
};

export const topics = {
  VI: ['Chanel', 'Pickleball', 'Bodega', 'The Weeknd', 'Blackpink', 'BTS'],
  EN: ['Chanel', 'Pickleball', 'Bodega', 'The Weeknd', 'Blackpink', 'BTS'],
};

export const interactions = {
  VI: [
    { date: '2025-07-02', note: 'Đi xem concert Blackpink ở Bangkok cùng nhau' },
    {
      date: '2025-04-29',
      note: 'Tình cờ gặp nhau ở sân Pickleball. Đưa cô ấy đi ăn tối và đưa về nhà',
    },
    {
      date: '2025-02-27',
      note: 'Gặp ở Bodega với bạn bè của cô ấy. Cùng nhau nhảy một lúc',
    },
  ],
  EN: [
    { date: '2025-07-02', note: 'Went to Blackpink concert in Bangkok together' },
    {
      date: '2025-04-29',
      note: 'Bumped to each other in Playday Pickleball. Take her to dinner and bring her home',
    },
    {
      date: '2025-02-27',
      note: 'Met at Bodega with her friends. Danced together for a while',
    },
  ],
};

export const componentTexts = {
  VI: {
    summaryTab: 'Tóm tắt',
    notesTab: 'Ghi chú',
    addNotePlaceholder: 'Thêm ghi chú mới...',
    addNoteButton: 'Thêm ghi chú',
  },
  EN: {
    summaryTab: 'Summary',
    notesTab: 'Notes',
    addNotePlaceholder: 'Add a new note...',
    addNoteButton: 'Add Note',
  },
};
