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
    const now = new Date();

    // Parallelize independent read queries
    const [existing, memberRecord] = await Promise.all([
      db.select()
        .from(projectCollaborators)
        .where(and(
          eq(projectCollaborators.projectId, projectId),
          eq(projectCollaborators.userId, user!.id)
        ))
        .limit(1),
      db.select()
        .from(members)
        .where(eq(members.userId, user!.id))
        .limit(1),
    ]);

    if (existing.length > 0) {
      return res.status(400).json({ error: "Already a collaborator" });
    }

    // Parallelize write operations
    await Promise.all([
      // Add as collaborator
      db.insert(projectCollaborators).values({
        projectId,
        userId: user!.id,
        role: "contributor",
        joinedAt: now,
      }),
      // Award contribution points or create member
      memberRecord.length > 0
        ? db.update(members)
            .set({
              contributionPoints: memberRecord[0]!.contributionPoints + 10,
              updatedAt: now,
            })
            .where(eq(members.userId, user!.id))
        : db.insert(members).values({
            id: generateId(),
            userId: user!.id,
            membershipType: "basic",
            contributionPoints: 10,
            votingPower: 1,
            status: "active",
            joinedAt: now,
            createdAt: now,
            updatedAt: now,
          }),
    ]);

    return res.status(200).json({ 
      success: true,
      message: "Successfully joined project"
    });
  } catch (error: any) {
    console.error("Join project API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}