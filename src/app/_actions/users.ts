"use server";

import { requireAuth } from "@/app/_lib/auth";
import {
  type ActionResult,
  actionSuccess,
  actionError,
} from "@/app/_lib/action-utils";
import { updateUserProfile } from "@core/database/queries/users";
import { db, users } from "@core/database";
import { eq } from "drizzle-orm";
import { validateUsernameFormat } from "@utils/onboarding";
import { membersService } from "@services/members";
import { revalidatePath } from "next/cache";

export async function onboardUser(data: {
  username: string;
  bio: string | null;
}): Promise<ActionResult<{ user: any; memberId: string }>> {
  try {
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

    if (
      existingUser.length > 0 &&
      existingUser[0] &&
      existingUser[0].id !== user.id
    ) {
      return { success: false, error: "Username is already taken" };
    }

    // Update user profile
    const updatedUser = await updateUserProfile(user.privyDid, {
      username: trimmedUsername,
      bio: data.bio?.trim() || undefined,
    });

    // Get or create member record (single path via service)
    const member = await membersService.getOrCreateMember(user.id);

    return actionSuccess({ user: updatedUser, memberId: member!.id });
  } catch (err) {
    return actionError(err);
  }
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
  revalidatePath("/passport");
  revalidatePath("/settings");
  return updated;
}
