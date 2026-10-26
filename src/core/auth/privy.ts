import { PrivyClient, type VerifyAccessTokenResponse } from "@privy-io/node";
import type { NextApiRequest } from "next";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;

const client = new PrivyClient({
  appId: PRIVY_APP_ID!,
  appSecret: PRIVY_APP_SECRET!,
});

export async function verifyAuthToken(
  token: string,
): Promise<VerifyAccessTokenResponse> {
  try {
    const claims = await client.utils().auth().verifyAccessToken(token);
    return claims;
  } catch (error: any) {
    throw new Error(`Auth verification failed: ${error.message}`);
  }
}

export async function authenticateRequest(
  req: NextApiRequest,
): Promise<VerifyAccessTokenResponse> {
  const headerAuthToken = req.headers.authorization?.replace(/^Bearer /, "");
  const cookieAuthToken = req.cookies["privy-token"];

  const authToken = cookieAuthToken || headerAuthToken;

  if (!authToken) {
    throw new Error("Missing auth token");
  }

  return verifyAuthToken(authToken);
}

export { type VerifyAccessTokenResponse };
