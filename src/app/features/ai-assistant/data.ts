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
