import { generateJWT } from '@/lib/jwt';
import MatrixClient from '../../../../lib/matrix';
import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { generateRandomString } from '@/lib/utils';
import { encryptSecret } from '@/lib/crypto';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: username, password' },
        { status: 400 }
      );
    }

    const matrixClient = new MatrixClient({});
    const loginResponse = await matrixClient.login(username, password);
    if (!loginResponse) {
      return NextResponse.json({ error: 'Login failed' }, { status: 401 });
    }
    let dbUser;
    const client = await pool.connect();
    const encryptedPassword = encryptSecret(password);
    const dbUserQuery = await client.query(
      'SELECT id FROM matrix_user WHERE matrix_user_id = $1 AND home_server = $2',
      [loginResponse.user_id, matrixClient.homeServer]
    );
    if (dbUserQuery.rows.length > 0) {
      dbUser = dbUserQuery.rows[0];
      // Update stored encrypted password on each successful login
      await client.query('UPDATE matrix_user SET encrypted_password = $1 WHERE id = $2', [
        encryptedPassword,
        dbUser.id,
      ]);
    } else {
      const insertUserQuery = await client.query(
        'INSERT INTO matrix_user (id, matrix_user_id, home_server, encrypted_password) VALUES ($1, $2, $3, $4) RETURNING id',
        [generateRandomString(), loginResponse.user_id, matrixClient.homeServer, encryptedPassword]
      );
      dbUser = insertUserQuery.rows[0];
    }
    const jwtToken = generateJWT({
      dbUserId: dbUser.id,
      userId: loginResponse.user_id,
      deviceId: loginResponse.device_id,
      accessToken: loginResponse.access_token,
    });

    const response = NextResponse.json(
      { message: 'Login successful', user: { username, accessToken: jwtToken } },
      { status: 200 }
    );

    // Allow CORS
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    client.release();
    return response;
  } catch (error) {
    console.error('Error in POST /auth/login:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.CORS_ALLOW_ORIGIN ?? 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}
