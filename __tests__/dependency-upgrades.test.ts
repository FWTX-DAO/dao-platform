import { afterAll, expect, test } from "bun:test";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import {
  getPreferredEthWallet,
  getPreferredEthWalletFromAccounts,
} from "../src/shared/utils/wallet";

const appId = "clfixture000000000000000000000";
const userId = "did:privy:fixture-user";
const originalFetch = globalThis.fetch;
const originalEnv = {
  appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID,
  secret: process.env.PRIVY_APP_SECRET,
  signer: process.env.SESSION_SIGNER_SECRET,
};
process.env.NEXT_PUBLIC_PRIVY_APP_ID = appId;
process.env.PRIVY_APP_SECRET = "fixture-secret";
delete process.env.SESSION_SIGNER_SECRET;

const keys = await crypto.subtle.generateKey(
  { name: "ECDSA", namedCurve: "P-256" },
  true,
  ["sign", "verify"],
);
const publicKey = await crypto.subtle.exportKey("jwk", keys.publicKey);
const rpcBodies: Array<{ walletId: string; body: Record<string, any> }> = [];
const linkedAccounts = [
  {
    type: "wallet",
    id: "owned-eth",
    address: "0x1111111111111111111111111111111111111111",
    chain_type: "ethereum",
    wallet_client_type: "privy",
  },
  {
    type: "wallet",
    id: "owned-sol",
    address: "11111111111111111111111111111111",
    chain_type: "solana",
    wallet_client_type: "privy",
  },
];

// Every provider call is answered locally; unexpected requests fail closed.
globalThis.fetch = (async (
  input: string | URL | Request,
  init?: RequestInit,
) => {
  const request = new Request(input, init);
  const url = new URL(request.url);
  if (url.pathname === `/v1/apps/${appId}/jwks.json`) {
    return Response.json({
      keys: [{ ...publicKey, kid: "fixture-key", alg: "ES256", use: "sig" }],
    });
  }
  if (url.pathname === `/v1/users/${userId}` && request.method === "GET") {
    return Response.json({
      id: userId,
      linked_accounts: linkedAccounts,
      created_at: 1,
      mfa_methods: [],
    });
  }
  const wallet = url.pathname.match(/^\/v1\/wallets\/([^/]+)\/rpc$/);
  if (wallet && request.method === "POST") {
    const body = (await request.json()) as Record<string, any>;
    rpcBodies.push({ walletId: wallet[1]!, body });
    return Response.json({
      method: body.method,
      data:
        body.method === "signMessage"
          ? { signature: "Zml4dHVyZS1zaWduYXR1cmU=", encoding: "base64" }
          : { signature: "0x1234", encoding: "hex" },
    });
  }
  throw new Error(
    `Unexpected fixture request: ${request.method} ${url.pathname}`,
  );
}) as typeof fetch;

afterAll(() => {
  globalThis.fetch = originalFetch;
  for (const [key, value] of [
    ["NEXT_PUBLIC_PRIVY_APP_ID", originalEnv.appId],
    ["PRIVY_APP_SECRET", originalEnv.secret],
    ["SESSION_SIGNER_SECRET", originalEnv.signer],
  ] as const) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

async function token(overrides: Record<string, unknown> = {}) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(
    JSON.stringify({ alg: "ES256", typ: "JWT", kid: "fixture-key" }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: "privy.io",
      aud: appId,
      sub: userId,
      sid: "fixture-session",
      iat: now,
      exp: now + 300,
      ...overrides,
    }),
  ).toString("base64url");
  const unsigned = `${header}.${payload}`;
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    keys.privateKey,
    new TextEncoder().encode(unsigned),
  );
  return `${unsigned}.${Buffer.from(signature).toString("base64url")}`;
}

const { verifyAuthToken } = await import("../src/core/auth/privy");
const ethereum = await import("../src/app/api/ethereum/personal-sign/route");
const solana = await import("../src/app/api/solana/sign-message/route");

test("Privy verifies real ES256 signatures and returns the new SDK claim fields", async () => {
  const claims = await verifyAuthToken(await token());
  expect(claims.user_id).toBe(userId);
  expect(claims.app_id).toBe(appId);
  expect(claims.session_id).toBe("fixture-session");
});

for (const [label, override] of [
  ["another app", { aud: "other-app" }],
  ["another issuer", { iss: "attacker.example" }],
  ["expired token", { exp: 1 }],
] as const) {
  test(`Privy rejects ${label}`, async () => {
    await expect(verifyAuthToken(await token(override))).rejects.toThrow();
  });
}

test("Privy rejects a tampered signature", async () => {
  const valid = await token();
  const parts = valid.split(".");
  const signature = Buffer.from(parts[2]!, "base64url");
  signature[0] = signature[0]! ^ 1;
  await expect(
    verifyAuthToken(
      `${parts[0]}.${parts[1]}.${signature.toString("base64url")}`,
    ),
  ).rejects.toThrow();
});

function signingRequest(
  authToken: string,
  walletId: string,
  message = "fixture",
) {
  return new Request("https://example.test/sign", {
    method: "POST",
    headers: {
      authorization: `Bearer ${authToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ wallet_id: walletId, message }),
  });
}

for (const [chain, route] of [
  ["Ethereum", ethereum],
  ["Solana", solana],
] as const) {
  test(`${chain} signing rejects missing authentication`, async () => {
    expect(
      (
        await route.POST(
          new Request("https://example.test/sign", { method: "POST" }),
        )
      ).status,
    ).toBe(401);
  });
  test(`${chain} signing rejects a foreign wallet before signing`, async () => {
    const before = rpcBodies.length;
    expect(
      (await route.POST(signingRequest(await token(), "foreign-wallet")))
        .status,
    ).toBe(403);
    expect(rpcBodies.length).toBe(before);
  });
}

test("Ethereum signing uses the new RPC API and preserves hex signatures", async () => {
  const response = await ethereum.POST(
    signingRequest(await token(), "owned-eth"),
  );
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
    method: "personal_sign",
    data: { signature: "0x1234", encoding: "hex" },
  });
  expect(rpcBodies.at(-1)?.body.params).toEqual({
    message: "fixture",
    encoding: "utf-8",
  });
});

test("Solana signing preserves the SDK's base64 signature without encoding it twice", async () => {
  const response = await solana.POST(
    signingRequest(await token(), "owned-sol", "Zml4dHVyZQ=="),
  );
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
    method: "signMessage",
    data: { signature: "Zml4dHVyZS1zaWduYXR1cmU=", encoding: "base64" },
  });
  expect(rpcBodies.at(-1)?.body.params).toEqual({
    message: "Zml4dHVyZQ==",
    encoding: "base64",
  });
});

test("wallet selection preserves external-wallet preference for both SDK formats", () => {
  const external = {
    type: "wallet",
    address: "external",
    chain_type: "ethereum",
    wallet_client_type: "metamask",
  };
  expect(
    getPreferredEthWalletFromAccounts([...linkedAccounts, external])?.address,
  ).toBe("external");
  expect(
    getPreferredEthWallet([
      {
        type: "wallet",
        address: "embedded",
        chainType: "ethereum",
        walletClientType: "privy",
      },
      {
        type: "wallet",
        address: "external",
        chainType: "ethereum",
        walletClientType: "metamask",
      },
    ])?.address,
  ).toBe("external");
});

test("patched x402 record schemas accept arbitrary metadata with Zod 4", async () => {
  const { PaymentRequirementsSchema } = await import("x402/types");
  expect(
    PaymentRequirementsSchema.shape.extra.parse({ nested: { enabled: true } }),
  ).toEqual({ nested: { enabled: true } });
  expect(
    PaymentRequirementsSchema.shape.outputSchema.parse({ result: "string" }),
  ).toEqual({ result: "string" });
});

test("patched Coinbase EIP-712 schemas preserve named type records with Zod 4", async () => {
  const require = createRequire(import.meta.url);
  const schemaPath = new URL(
    "./policies/evmSchema.js",
    pathToFileURL(require.resolve("@coinbase/cdp-sdk")),
  );
  const { SignEvmTypedDataFieldCriterionSchema } = await import(
    schemaPath.href
  );
  const types = { Mail: [{ name: "contents", type: "string" }] };
  expect(
    SignEvmTypedDataFieldCriterionSchema.shape.types.shape.types.parse(types),
  ).toEqual(types);
});

test("Zod rejects oversized constrained arrays before visiting their elements", async () => {
  const { z } = await import("zod");
  let visited = 0;
  const result = z
    .array(
      z.string().refine(() => {
        visited++;
        return true;
      }),
    )
    .max(2)
    .safeParse(["a", "b", "c"]);
  expect(result.success).toBe(false);
  expect(visited).toBe(0);
});
