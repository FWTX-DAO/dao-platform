import { NextResponse } from 'next/server';
import { PrivyClient } from '@privy-io/server-auth';

const client = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!,
  {
    walletApi: {
      authorizationPrivateKey: process.env.SESSION_SIGNER_SECRET,
    },
  }
);

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Missing auth token.' }, { status: 401 });
  }

  const authToken = authHeader.replace(/^Bearer /, '');
  try {
    const claims = await client.verifyAuthToken(authToken);
    if (!claims || !('appId' in claims)) {
      return NextResponse.json({ error: 'Invalid auth token.' }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid auth token.' }, { status: 401 });
  }

  const body = await request.json();
  const { message, wallet_id } = body;

  if (!message || !wallet_id) {
    return NextResponse.json({ error: 'Message and wallet_id are required' }, { status: 400 });
  }

  try {
    const { signature } = await client.walletApi.ethereum.signMessage({
      walletId: wallet_id,
      message,
    });

    return NextResponse.json({
      method: 'personal_sign',
      data: { signature, encoding: 'hex' },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
