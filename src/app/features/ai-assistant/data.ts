export const typeTags = [
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
];

const stringToHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash += str.charCodeAt(i);
  }
  return hash;
};

export const getDateTypes = (seedString: string): string[] => {
  const seed = stringToHash(seedString);
  const isEven = seed % 2 === 0;
  const allPropsToChoose = typeTags.filter((_, idx) => (isEven ? idx % 2 === 0 : idx % 2 === 1));
  const totalPropsPairs = typeTags.length / 2;
  const numOfPropsToChoose = Math.min(seed % totalPropsPairs, 3);
  return allPropsToChoose.slice(0, numOfPropsToChoose);
};
