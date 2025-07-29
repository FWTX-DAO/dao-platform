import { PrivyClient } from "@privy-io/server-auth";
import { NextApiRequest } from "next";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID!;
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET!;
const client = new PrivyClient(PRIVY_APP_ID, PRIVY_APP_SECRET);

export async function authenticateRequest(req: NextApiRequest) {
  const headerAuthToken = req.headers.authorization?.replace(/^Bearer /, "");
  const cookieAuthToken = req.cookies["privy-token"];
  
  const authToken = cookieAuthToken || headerAuthToken;
  if (!authToken) {
    throw new Error("Missing auth token");
  }

  try {
    const claims = await client.verifyAuthToken(authToken);
    return claims;
  } catch (error) {
    throw new Error("Invalid auth token");
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}