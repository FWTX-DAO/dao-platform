"use server";

import { requireAuth } from "@/app/_lib/auth";
import { updateUserProfile } from "@core/database/queries/users";
import { revalidatePath } from "next/cache";
import { actionError, actionSuccess } from "@/app/_lib/action-utils";

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
  try {
    const updated = await updateUserProfile(user.privyDid, data);
    revalidatePath("/passport");
    revalidatePath("/settings");
    return actionSuccess(updated);
  } catch (error) {
    return actionError(error);
  }
}
