import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateRequest } from "../../../lib/api-helpers";
import { getOrCreateUser } from "../../../src/db/queries/users";
import { db, forumVotes } from "../../../src/db";
import { eq, and, sql } from "drizzle-orm";

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
    const email = claims.email || undefined;

    const { postId, voteType } = req.body;

    if (!postId || voteType === undefined) {
      return res.status(400).json({ error: "Post ID and vote type are required" });
    }

    // Get or create user
    const user = await getOrCreateUser(privyDid, email);

    // Check if user already voted
    const existingVote = await db
      .select()
      .from(forumVotes)
      .where(
        and(
          eq(forumVotes.postId, postId),
          eq(forumVotes.userId, user.id)
        )
      )
      .limit(1);

    if (existingVote.length > 0) {
      if (voteType === 0) {
        // Remove vote
        await db
          .delete(forumVotes)
          .where(
            and(
              eq(forumVotes.postId, postId),
              eq(forumVotes.userId, user.id)
            )
          );
      } else {
        // Update vote
        await db
          .update(forumVotes)
          .set({ voteType })
          .where(
            and(
              eq(forumVotes.postId, postId),
              eq(forumVotes.userId, user.id)
            )
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
      hasUpvoted: voteType === 1 
    });
  } catch (error: any) {
    console.error("Forum vote API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}