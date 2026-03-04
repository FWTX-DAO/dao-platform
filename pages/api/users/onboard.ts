import type { NextApiResponse } from "next";
import {
  compose,
  errorHandler,
  withAuth,
  type AuthenticatedRequest,
} from "@core/middleware";
import { ValidationError } from "@core/errors/AppError";
import { generateId } from "@utils/id-generator";
import { updateUserProfile } from "@core/database/queries/users";
import { db, members, users } from "@core/database";
import { eq } from "drizzle-orm";
import { validateUsernameFormat } from "@utils/onboarding";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = req.user;
  const { username, bio } = req.body;

  // Validate username format
  const validation = validateUsernameFormat(username);
  if (!validation.valid) {
    throw new ValidationError(validation.error!);
  }

  const trimmedUsername = username.trim();

  // Check if username is already taken by another user
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.username, trimmedUsername))
    .limit(1);

  if (existingUser.length > 0 && existingUser[0] && existingUser[0].id !== user.id) {
    throw new ValidationError("Username is already taken");
  }

  // Update user profile
  const updatedUser = await updateUserProfile(user.privyDid, {
    username: trimmedUsername,
    bio: bio?.trim() || null,
  });

  // Get or create member record
  let memberRecord = await db
    .select()
    .from(members)
    .where(eq(members.userId, user.id))
    .limit(1);

  if (memberRecord.length === 0) {
    const now = new Date();
    // Create member record and return it in one operation
    const created = await db
      .insert(members)
      .values({
        id: generateId(),
        userId: user.id,
        membershipType: "basic",
        contributionPoints: 0,
        votingPower: 1,
        status: "active",
        joinedAt: now,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    memberRecord = created;
  }

  return res.status(200).json({
    success: true,
    user: updatedUser,
    member: memberRecord[0],
  });
}

export default compose(errorHandler, withAuth)(handler);
