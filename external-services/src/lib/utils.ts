import crypto from 'crypto';
import { verifyJWT } from './jwt';
import pg from 'pg';
import { MATRIX_HOMESERVER } from '@/constants';

export function generateRandomString(length: number = 16): string {
  return crypto.randomBytes(length).toString('hex');
}

export async function checkAuth(
  token: string,
  client: pg.PoolClient,
  homeServer = MATRIX_HOMESERVER
) {
  try {
    const payload = verifyJWT(token);
    if (!payload) {
      return null;
    }
    const matrixDbUserQuery = await client.query(
      'SELECT * FROM matrix_user WHERE id = $1 AND home_server = $2',
      [payload.dbUserId, homeServer]
    );
    const matrixUserDb = matrixDbUserQuery.rows[0];
    if (!matrixUserDb) {
      return null;
    }
    return { ...payload, userDb: matrixUserDb, homeServer };
  } catch (err) {
    console.error('Error checking auth:', err);
    return null;
  }
}
