import { RoomMember } from 'matrix-js-sdk';

export const demoMetaId = [
  '100008370333450',
  '100079978062886',
  '101429627928641',
  '17842384556897595',
  // [FB: Khanh ta, Fb: Wayne Tr, ig: lovefish49, ig: vedup.1711]
];

const isDemoMetaId = (userId: string) => {
  const match = userId.match(/\d+/);
  const metaDigitedId = match ? match[0] : '';
  if (demoMetaId.includes(metaDigitedId as string)) {
    return true;
  }
  return false;
};

const isUserIdMatrix = (userId: string) => !userId.includes('meta');

export const isFromMe = (sender: string, selfUserId: string) =>
  sender === selfUserId || isDemoMetaId(sender);

export const getImpersonatedUserId = (userId: string, members: RoomMember[]): string => {
  if (members && isUserIdMatrix(userId)) {
    const impersonatedUser = members.find((member) => isDemoMetaId(member.userId));
    return impersonatedUser?.userId || userId;
  }
  return userId || '';
};
