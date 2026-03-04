import type { NextApiResponse } from "next";
import {
  compose,
  errorHandler,
  withAuth,
  type AuthenticatedRequest,
} from "@core/middleware";
import { updateUserProfile } from "@core/database/queries/users";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const user = req.user;

  if (req.method === "GET") {
    return res.status(200).json(user);
  }

  if (req.method === "PUT") {
    const { username, bio, avatar_url } = req.body;

    const updated = await updateUserProfile(user.privyDid, {
      username,
      bio,
      avatarUrl: avatar_url,
    });

    return res.status(200).json(updated);
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default compose(errorHandler, withAuth)(handler);
