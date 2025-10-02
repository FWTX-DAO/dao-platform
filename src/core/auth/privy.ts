import { PrivyClient, type AuthTokenClaims } from '@privy-io/server-auth';
import type { NextApiRequest } from 'next';

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;

const client = new PrivyClient(PRIVY_APP_ID!, PRIVY_APP_SECRET!);

export async function verifyAuthToken(token: string): Promise<AuthTokenClaims> {
  try {
    const claims = await client.verifyAuthToken(token);
    return claims;
  } catch (error: any) {
    throw new Error(`Auth verification failed: ${error.message}`);
  }
}

export async function authenticateRequest(req: NextApiRequest): Promise<AuthTokenClaims> {
  const headerAuthToken = req.headers.authorization?.replace(/^Bearer /, '');
  const cookieAuthToken = req.cookies['privy-token'];
  
  const authToken = cookieAuthToken || headerAuthToken;
  
  if (!authToken) {
    throw new Error('Missing auth token');
  }
  
  return verifyAuthToken(authToken);
}

export { type AuthTokenClaims };
