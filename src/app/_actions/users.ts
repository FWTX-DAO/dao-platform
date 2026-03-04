'use server';

import { requireAuth } from '@/app/_lib/auth';
import { updateUserProfile } from '@core/database/queries/users';
import { db, users, members } from '@core/database';
import { eq } from 'drizzle-orm';
import { validateUsernameFormat } from '@utils/onboarding';
import { generateId } from '@utils/id-generator';
import { revalidatePath } from 'next/cache';

export async function onboardUser(data: { username: string; bio: string | null }) {
  const { user } = await requireAuth();

  const validation = validateUsernameFormat(data.username);
  if (!validation.valid) {
    return { success: false, error: validation.error! };
  }

  const trimmedUsername = data.username.trim();

  // Check if username is already taken by another user
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.username, trimmedUsername))
    .limit(1);

  if (existingUser.length > 0 && existingUser[0] && existingUser[0].id !== user.id) {
    return { success: false, error: 'Username is already taken' };
  }

  // Update user profile
  const updatedUser = await updateUserProfile(user.privyDid, {
    username: trimmedUsername,
    bio: data.bio?.trim() || undefined,
  });

  // Get or create member record
  const memberRecord = await db
    .select()
    .from(members)
    .where(eq(members.userId, user.id))
    .limit(1);

  let memberId: string;
  if (memberRecord.length === 0) {
    memberId = generateId();
    const now = new Date();
    await db.insert(members).values({
      id: memberId,
      userId: user.id,
      membershipType: 'basic',
      contributionPoints: 0,
      votingPower: 1,
      status: 'active',
      joinedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  } else {
    memberId = memberRecord[0]!.id;
  }

  revalidatePath('/dashboard');
  return { success: true, user: updatedUser, memberId };
}

export async function getUserProfile() {
  const { user } = await requireAuth();
  return user;
}

export async function updateProfile(data: {
  username?: string;
  bio?: string;
  avatarUrl?: string;
}) {
  const { user } = await requireAuth();
  const updated = await updateUserProfile(user.privyDid, {
    username: data.username,
    bio: data.bio,
    avatarUrl: data.avatarUrl,
  });
  revalidatePath('/profile');
  revalidatePath('/settings');
  return updated;
}
