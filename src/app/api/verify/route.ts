import { NextResponse } from 'next/server';
import { PrivyClient } from '@privy-io/server-auth';

const client = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
);

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cookieHeader = request.headers.get('cookie');
  const cookieToken = cookieHeader
    ?.split(';')
    .find((c) => c.trim().startsWith('privy-token='))
    ?.split('=')[1];

  const authToken = cookieToken || authHeader?.replace(/^Bearer /, '');

  if (!authToken) {
    return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });
  }

  try {
    const claims = await client.verifyAuthToken(authToken);
    return NextResponse.json({ claims });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
