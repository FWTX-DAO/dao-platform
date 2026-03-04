import type { NextApiResponse } from "next";
import {
  compose,
  errorHandler,
  withAuth,
  type AuthenticatedRequest,
} from "@core/middleware";
import { ValidationError } from "@core/errors/AppError";
import { generateId } from "@utils/id-generator";
import { db, projectCollaborators, members } from "@core/database";
import { eq, and } from "drizzle-orm";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = req.user;
  const projectId = req.query.id as string;

  if (!projectId) {
    throw new ValidationError("Project ID is required");
  }

  const now = new Date();

  // Parallelize independent read queries
  const [existing, memberRecord] = await Promise.all([
    db
      .select()
      .from(projectCollaborators)
      .where(
        and(
          eq(projectCollaborators.projectId, projectId),
          eq(projectCollaborators.userId, user.id)
        )
      )
      .limit(1),
    db
      .select()
      .from(members)
      .where(eq(members.userId, user.id))
      .limit(1),
  ]);

  if (existing.length > 0) {
    throw new ValidationError("Already a collaborator");
  }

  // Parallelize write operations
  await Promise.all([
    // Add as collaborator
    db.insert(projectCollaborators).values({
      projectId,
      userId: user.id,
      role: "contributor",
      joinedAt: now,
    }),
    // Award contribution points or create member
    memberRecord.length > 0
      ? db
          .update(members)
          .set({
            contributionPoints: memberRecord[0]!.contributionPoints + 10,
            updatedAt: now,
          })
          .where(eq(members.userId, user.id))
      : db.insert(members).values({
          id: generateId(),
          userId: user.id,
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
    message: "Successfully joined project",
  });
}

export default compose(errorHandler, withAuth)(handler);
