import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateRequest } from "@utils/api-helpers";
import { generateId } from "@utils/id-generator";
import { getOrCreateUser } from "@core/database/queries/users";
import { db, projectCollaborators, members } from "@core/database";
import { eq, and } from "drizzle-orm";

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
    const projectId = req.query.id as string;

    if (!projectId) {
      return res.status(400).json({ error: "Project ID is required" });
    }

    // Get or create user
    const user = await getOrCreateUser(privyDid, email);

    // Check if already a collaborator
    const existing = await db
      .select()
      .from(projectCollaborators)
      .where(
        and(
          eq(projectCollaborators.projectId, projectId),
          eq(projectCollaborators.userId, user!.id)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return res.status(400).json({ error: "Already a collaborator" });
    }

    // Add as collaborator
    await db.insert(projectCollaborators).values({
      projectId,
      userId: user!.id,
      role: "contributor",
      joinedAt: new Date().toISOString(),
    });

    // Award contribution points
    const memberRecord = await db
      .select()
      .from(members)
      .where(eq(members.userId, user!.id))
      .limit(1);

    if (memberRecord.length > 0) {
      await db
        .update(members)
        .set({
          contributionPoints: memberRecord[0]!.contributionPoints + 10,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(members.userId, user!.id));
    } else {
      // Create member record if doesn't exist
      await db.insert(members).values({
        id: generateId(),
        userId: user!.id,
        membershipType: "basic",
        contributionPoints: 10,
        votingPower: 1,
        status: "active",
        joinedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return res.status(200).json({ 
      success: true,
      message: "Successfully joined project"
    });
  } catch (error: any) {
    console.error("Join project API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}