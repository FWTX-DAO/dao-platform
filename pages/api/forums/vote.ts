import type { NextApiResponse } from "next";
import {
  compose,
  errorHandler,
  withAuth,
  type AuthenticatedRequest,
} from "@core/middleware";
import { ValidationError } from "@core/errors/AppError";
import { db, forumVotes } from "@core/database";
import { eq, and, sql } from "drizzle-orm";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = req.user;
  const { postId, voteType } = req.body;

  if (!postId || voteType === undefined) {
    throw new ValidationError("Post ID and vote type are required");
  }

  // Check if user already voted
  const existingVote = await db
    .select()
    .from(forumVotes)
    .where(
      and(eq(forumVotes.postId, postId), eq(forumVotes.userId, user.id))
    )
    .limit(1);

  if (existingVote.length > 0) {
    if (voteType === 0) {
      // Remove vote
      await db
        .delete(forumVotes)
        .where(
          and(eq(forumVotes.postId, postId), eq(forumVotes.userId, user.id))
        );
    } else {
      // Update vote
      await db
        .update(forumVotes)
        .set({ voteType })
        .where(
          and(eq(forumVotes.postId, postId), eq(forumVotes.userId, user.id))
        );
    }
  } else if (voteType !== 0) {
    // Create new vote
    await db.insert(forumVotes).values({
      postId,
      userId: user.id,
      voteType,
    });
  }

  // Get updated vote count
  const voteCountResult = await db
    .select({
      upvotes: sql<number>`COALESCE(SUM(vote_type), 0)`,
    })
    .from(forumVotes)
    .where(eq(forumVotes.postId, postId));

  const upvotes = voteCountResult[0]?.upvotes || 0;

  return res.status(200).json({
    upvotes,
    hasUpvoted: voteType === 1,
  });
}

export default compose(errorHandler, withAuth)(handler);
