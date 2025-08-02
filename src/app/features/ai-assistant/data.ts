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

export const getRandomElements = (arr: string[], x: number) => {
  if (x > arr.length) {
    throw new Error('x cannot be greater than the array length');
  }

  const shuffled = [...arr]; // clone the array
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // swap
  }

  return shuffled.slice(0, x);
};

export const getGirlTypes = () => {
  const randomIndex = Math.floor(Math.random() * typeTags.length);
  const isEven = randomIndex % 2 === 0;
  const allPropsToChoose = typeTags.filter((_, idx) => (isEven ? idx % 2 === 0 : idx % 2 === 1));
  const totalPropsPairs = typeTags.length / 2;
  const numOfPropsToChoose = Math.min(randomIndex % totalPropsPairs, 3);
  return getRandomElements(allPropsToChoose, numOfPropsToChoose);
};
