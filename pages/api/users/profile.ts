import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateRequest } from "../../../lib/api-helpers";
import { getOrCreateUser, updateUserProfile } from "../../../src/db/queries/users";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const claims = await authenticateRequest(req);
    const privyDid = claims.userId;
    const email = (claims as any).email || undefined;

    if (req.method === "GET") {
      // Get or create user profile
      const user = await getOrCreateUser(privyDid, email);
      return res.status(200).json(user);
    } 
    
    else if (req.method === "PUT") {
      // Update user profile
      const { username, bio, avatar_url } = req.body;

      // Ensure user exists first
      await getOrCreateUser(privyDid, email);

      // Update profile
      const updated = await updateUserProfile(privyDid, {
        username,
        bio,
        avatarUrl: avatar_url,
      });

      return res.status(200).json(updated);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    console.error("Profile API error:", error);
    return res.status(401).json({ error: error.message || "Authentication failed" });
  }
}