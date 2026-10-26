import { NextResponse } from "next/server";
import { PrivyClient } from "@privy-io/node";

let _client: PrivyClient | null = null;
function getClient() {
  if (!_client) {
    _client = new PrivyClient({
      appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
      appSecret: process.env.PRIVY_APP_SECRET!,
    });
  }
  return _client;
}

export async function POST(request: Request) {
  const client = getClient();
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Missing auth token." }, { status: 401 });
  }

  const authToken = authHeader.replace(/^Bearer /, "");
  let claims;
  try {
    claims = await client.utils().auth().verifyAccessToken(authToken);
    if (!claims || !("app_id" in claims)) {
      return NextResponse.json(
        { error: "Invalid auth token." },
        { status: 401 },
      );
    }
  } catch {
    return NextResponse.json({ error: "Invalid auth token." }, { status: 401 });
  }

  const body = await request.json();
  const { message, wallet_id } = body;

  if (!message || !wallet_id) {
    return NextResponse.json(
      { error: "Message and wallet_id are required" },
      { status: 400 },
    );
  }

  // Verify wallet ownership: ensure the wallet belongs to the authenticated user
  try {
    const privyUser = await client.users()._get(claims.user_id);
    const ownedWalletIds = (privyUser.linked_accounts ?? [])
      .filter(
        (a: any) => a.type === "wallet" && a.wallet_client_type === "privy",
      )
      .map((a: any) => a.id);
    if (!ownedWalletIds.includes(wallet_id)) {
      return NextResponse.json(
        { error: "Wallet not owned by user" },
        { status: 403 },
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Failed to verify wallet ownership" },
      { status: 500 },
    );
  }

  try {
    const { signature } = await client
      .wallets()
      .solana()
      .signMessage(wallet_id, {
        message,
        authorization_context: {
          authorization_private_keys: process.env.SESSION_SIGNER_SECRET
            ? [process.env.SESSION_SIGNER_SECRET]
            : [],
        },
      });

    return NextResponse.json({
      method: "signMessage",
      data: {
        signature,
        encoding: "base64",
      },
    });
  } catch (error) {
    console.error("Error signing Solana message:", error);
    return NextResponse.json(
      { error: "Failed to sign message" },
      { status: 500 },
    );
  }
}
