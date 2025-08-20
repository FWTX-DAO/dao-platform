import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateRequest } from "../../../lib/api-helpers";
import { db, members, users } from "../../../src/db";
import { eq } from "drizzle-orm";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await authenticateRequest(req);

    const membersList = await db
      .select({
        id: members.id,
        userId: members.userId,
        username: users.username,
        membershipType: members.membershipType,
        status: members.status,
        avatarUrl: users.avatarUrl,
        joinedAt: members.joinedAt,
      })
      .from(members)
      .innerJoin(users, eq(members.userId, users.id))
      .where(eq(members.status, "active"))
      .orderBy(users.username);

    return res.status(200).json(membersList);
  } catch (error: any) {
    console.error("Members API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}