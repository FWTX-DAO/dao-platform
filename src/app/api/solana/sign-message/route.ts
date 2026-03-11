import { NextResponse } from 'next/server';
import { PrivyClient } from '@privy-io/server-auth';

let _client: PrivyClient | null = null;
function getClient() {
  if (!_client) {
    _client = new PrivyClient(
      process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
      process.env.PRIVY_APP_SECRET!,
      {
        walletApi: {
          authorizationPrivateKey: process.env.SESSION_SIGNER_SECRET,
        },
      }
    );
  }
  return _client;
}

export async function POST(request: Request) {
  const client = getClient();
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Missing auth token.' }, { status: 401 });
  }

  const authToken = authHeader.replace(/^Bearer /, '');
  let claims;
  try {
    claims = await client.verifyAuthToken(authToken);
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

  // Verify wallet ownership: ensure the wallet belongs to the authenticated user
  try {
    const privyUser = await client.getUser(claims.userId);
    const ownedWalletIds = (privyUser.linkedAccounts ?? [])
      .filter((a: any) => a.type === 'wallet' && a.walletClientType === 'privy')
      .map((a: any) => a.id);
    if (!ownedWalletIds.includes(wallet_id)) {
      return NextResponse.json({ error: 'Wallet not owned by user' }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: 'Failed to verify wallet ownership' }, { status: 500 });
  }

  try {
    const { signature } = await client.walletApi.solana.signMessage({
      walletId: wallet_id,
      message,
    });

    return NextResponse.json({
      method: 'signMessage',
      data: {
        signature: Buffer.from(signature).toString('base64'),
        encoding: 'base64',
      },
    });
  } catch (error) {
    console.error('Error signing Solana message:', error);
    return NextResponse.json({ error: 'Failed to sign message' }, { status: 500 });
  }
}
