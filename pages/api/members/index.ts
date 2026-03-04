import type { NextApiResponse } from "next";
import {
  compose,
  errorHandler,
  withAuth,
  type AuthenticatedRequest,
} from "@core/middleware";
import { db, members, users } from "@core/database";
import { eq } from "drizzle-orm";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

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
}

export default compose(errorHandler, withAuth)(handler);
