import type { NextApiResponse } from "next";
import { compose, errorHandler, withAuth, type AuthenticatedRequest } from "@core/middleware";
import { generateId } from "@utils/id-generator";
import { db, members, forumPosts, projects, meetingNotes } from "@core/database";
import { eq, sql } from "drizzle-orm";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = req.user;

  // Fetch member record and contribution stats in parallel
  const [memberRecord, stats] = await Promise.all([
    db.select().from(members).where(eq(members.userId, user.id)).limit(1),
    db
      .select({
        forumPostCount: sql<number>`
          (SELECT COUNT(*) FROM ${forumPosts} WHERE author_id = ${user.id})
        `,
        projectCount: sql<number>`
          (SELECT COUNT(*) FROM ${projects} WHERE creator_id = ${user.id})
        `,
        meetingNotesCount: sql<number>`
          (SELECT COUNT(*) FROM ${meetingNotes} WHERE author_id = ${user.id})
        `,
        totalVotesReceived: sql<number>`
          COALESCE((
            SELECT SUM(fv.vote_type)
            FROM forum_votes fv
            JOIN forum_posts fp ON fv.post_id = fp.id
            WHERE fp.author_id = ${user.id}
          ), 0)
        `,
      })
      .from(members)
      .where(eq(members.userId, user.id))
      .limit(1),
  ]);

  // Create member record if it doesn't exist
  let member = memberRecord[0];
  if (!member) {
    const now = new Date();
    const created = await db.insert(members).values({
      id: generateId(),
      userId: user.id,
      membershipType: "basic",
      contributionPoints: 0,
      votingPower: 1,
      status: "active",
      joinedAt: now,
      createdAt: now,
      updatedAt: now,
    }).returning();
    member = created[0]!;
  }

  const statData = stats[0];

  return res.status(200).json({
    membership: {
      type: member.membershipType,
      joinedAt: user.createdAt,
      contributionPoints: member.contributionPoints,
      votingPower: member.votingPower,
      badges: member.badges ?? [],
      specialRoles: member.specialRoles ?? [],
      status: member.status,
    },
    stats: {
      forumPosts: statData!.forumPostCount,
      projects: statData!.projectCount,
      meetingNotes: statData!.meetingNotesCount,
      votesReceived: statData!.totalVotesReceived,
    },
    user: {
      id: user.id,
      username: user.username,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    }
  });
}

export default compose(errorHandler, withAuth)(handler);
