import { cookies } from 'next/headers';
import { PrivyClient } from '@privy-io/server-auth';
import { getOrCreateUser } from '@core/database/queries/users';

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
);

export async function getAuthUser() {
  const token = (await cookies()).get('privy-token')?.value;
  if (!token) return null;
  try {
    const claims = await privy.verifyAuthToken(token);
    const user = await getOrCreateUser(claims.userId, (claims as any).email);
    return { claims, user: user! };
  } catch {
    return null;
  }
}

export async function requireAuth() {
  const auth = await getAuthUser();
  if (!auth) throw new Error('Unauthorized');
  return auth;
}
