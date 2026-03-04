'use server';

import { getAuthUser } from '@/app/_lib/auth';

export async function verifySession() {
  const auth = await getAuthUser();
  if (!auth) return { authenticated: false, user: null };
  return { authenticated: true, user: auth.user };
}

export async function getCurrentUser() {
  const auth = await getAuthUser();
  return auth?.user ?? null;
}
