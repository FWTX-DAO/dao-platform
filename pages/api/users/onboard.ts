import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateRequest } from "@utils/api-helpers";
import { generateId } from "@utils/id-generator";
import { getOrCreateUser, updateUserProfile } from "@core/database/queries/users";
import { db, members, users } from "@core/database";
import { eq } from "drizzle-orm";
import { validateUsernameFormat } from "@utils/onboarding";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const claims = await authenticateRequest(req);
    const privyDid = claims.userId;
    const email = (claims as any).email || undefined;

    const { username, bio } = req.body;

    // Validate username format
    const validation = validateUsernameFormat(username);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const trimmedUsername = username.trim();

    // Get or create user
    const user = await getOrCreateUser(privyDid, email);

    // Check if username is already taken by another user
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.username, trimmedUsername))
      .limit(1);

    if (existingUser.length > 0 && existingUser[0].id !== user!.id) {
      return res.status(400).json({ error: "Username is already taken" });
    }

    // Update user profile
    const updatedUser = await updateUserProfile(privyDid, {
      username: trimmedUsername,
      bio: bio?.trim() || null,
    });

    // Get or create member record
    let memberRecord = await db
      .select()
      .from(members)
      .where(eq(members.userId, user!.id))
      .limit(1);

    if (memberRecord.length === 0) {
      // Create member record if doesn't exist
      await db.insert(members).values({
        id: generateId(),
        userId: user!.id,
        membershipType: "basic",
        contributionPoints: 0,
        votingPower: 1,
        status: "active",
        joinedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      memberRecord = await db
        .select()
        .from(members)
        .where(eq(members.userId, user!.id))
        .limit(1);
    }

    return res.status(200).json({
      success: true,
      user: updatedUser,
      member: memberRecord[0],
    });
  } catch (error: any) {
    console.error("Onboarding API error:", error);
    return res.status(500).json({
      error: error.message || "Internal server error"
    });
  }
}
