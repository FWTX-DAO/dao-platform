"use server";

import { requireAuth } from "@/app/_lib/auth";
import { updateUserProfile } from "@core/database/queries/users";
import { revalidatePath } from "next/cache";

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
