import jwt from 'jsonwebtoken';

interface MatrixJWTPayload {
  dbUserId: string;
  userId: string;
  deviceId: string;
  accessToken: string;
}

export function generateJWT(payload: MatrixJWTPayload, expiresIn?: string) {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'matrix-jwt-secret-here',
    expiresIn ? { expiresIn } : {}
  );
}

export function verifyJWT(token: string) {
  try {
    return jwt.verify(
      token,
      process.env.JWT_SECRET || 'matrix-jwt-secret-here'
    ) as MatrixJWTPayload;
  } catch (error) {
    console.error('Error verifying JWT:', error);
    return null;
  }
}
