import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateRequest } from "../../../lib/api-helpers";
import { generateId } from "../../../lib/id-generator";
import { getOrCreateUser } from "../../../src/db/queries/users";
import { db, members, forumPosts, projects, meetingNotes } from "../../../src/db";
import { eq, sql } from "drizzle-orm";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const claims = await authenticateRequest(req);
    const privyDid = claims.userId;
    const email = (claims as any).email || undefined;

    // Get or create user
    const user = await getOrCreateUser(privyDid, email);

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

    // Get contribution stats
    const stats = await db
      .select({
        forumPostCount: sql<number>`
          (SELECT COUNT(*) FROM ${forumPosts} WHERE author_id = ${user!.id})
        `,
        projectCount: sql<number>`
          (SELECT COUNT(*) FROM ${projects} WHERE creator_id = ${user!.id})
        `,
        meetingNotesCount: sql<number>`
          (SELECT COUNT(*) FROM ${meetingNotes} WHERE author_id = ${user!.id})
        `,
        totalVotesReceived: sql<number>`
          COALESCE((
            SELECT SUM(fv.vote_type) 
            FROM forum_votes fv
            JOIN forum_posts fp ON fv.post_id = fp.id
            WHERE fp.author_id = ${user!.id}
          ), 0)
        `,
      })
      .from(members)
      .where(eq(members.userId, user!.id))
      .limit(1);

    const member = memberRecord[0];
    const statData = stats[0];

    return res.status(200).json({
      membership: {
        type: member!.membershipType,
        joinedAt: member!.joinedAt,
        contributionPoints: member!.contributionPoints,
        votingPower: member!.votingPower,
        badges: member!.badges ? JSON.parse(member!.badges) : [],
        specialRoles: member!.specialRoles ? JSON.parse(member!.specialRoles) : [],
        status: member!.status,
      },
      stats: {
        forumPosts: statData!.forumPostCount,
        projects: statData!.projectCount,
        meetingNotes: statData!.meetingNotesCount,
        votesReceived: statData!.totalVotesReceived,
      },
      user: {
        id: user!.id,
        username: user!.username,
        bio: user!.bio,
        avatarUrl: user!.avatarUrl,
      }
    });
  } catch (error: any) {
    console.error("Member stats API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}