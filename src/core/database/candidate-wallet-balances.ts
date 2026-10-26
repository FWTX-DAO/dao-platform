/** Read-only, limited asset inventory for a reviewed production-preflight report. */
import { writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { parse } from "dotenv";
import { PrivyClient } from "@privy-io/node";

async function main() {
  const [reportPath, envPath = ".env.production.local"] = process.argv.slice(2);
  if (!reportPath) throw new Error("Pass a production-preflight report path");
  const source = await Bun.file(reportPath).text();
  const report = JSON.parse(source);
  const env = parse(await Bun.file(envPath).text());
  if (env.NEXT_PUBLIC_PRIVY_APP_ID !== report.privyApp.id)
    throw new Error("Privy app does not match inventory");
  const privy = new PrivyClient({
    appId: env.NEXT_PUBLIC_PRIVY_APP_ID!,
    appSecret: env.PRIVY_APP_SECRET!,
    timeout: 15_000,
    maxRetries: 0,
  });
  const wallets: Array<{ id: string; chain_type: string }> =
    report.candidates.flatMap(
      (row: {
        privy?: {
          linked_accounts: Array<{
            id: string;
            type: string;
            wallet_client_type: string;
            chain_type: string;
          }>;
        };
      }) =>
        row.privy?.linked_accounts.filter(
          (a) => a.type === "wallet" && a.wallet_client_type === "privy",
        ) ?? [],
    );
  const results: Array<{
    walletId: string;
    chain: string;
    asset: string;
    rawValue?: string;
    errorStatus?: number;
    unsupported?: boolean;
  }> = [];
  let cursor = 0;
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (cursor < wallets.length) {
        const wallet = wallets[cursor++]!;
        if (!["ethereum", "solana"].includes(wallet.chain_type)) {
          results.push({
            walletId: wallet.id,
            chain: wallet.chain_type,
            asset: "unknown",
            unsupported: true,
          });
          continue;
        }
        const chain = wallet.chain_type as "ethereum" | "solana";
        const assets =
          chain === "ethereum"
            ? (["eth", "usdc", "usdt"] as const)
            : (["sol", "usdc", "usdt"] as const);
        for (const asset of assets) {
          try {
            const response = await privy
              .wallets()
              .balance.get(wallet.id, { chain, asset });
            const balance = response.balances.find(
              (row) => row.asset === asset && row.chain === chain,
            );
            if (!balance)
              results.push({
                walletId: wallet.id,
                chain,
                asset,
                unsupported: true,
              });
            else
              results.push({
                walletId: wallet.id,
                chain,
                asset,
                rawValue: balance.raw_value,
              });
          } catch (error: unknown) {
            results.push({
              walletId: wallet.id,
              chain,
              asset,
              errorStatus: (error as { status?: number }).status ?? 0,
            });
          }
        }
      }
    }),
  );
  const nonzero = results.filter(
    (row) => row.rawValue !== undefined && BigInt(row.rawValue) !== 0n,
  );
  const errors = results.filter((row) => row.rawValue === undefined);
  const output = {
    checkedAt: new Date().toISOString(),
    sourceReport: reportPath,
    sourceSha256: createHash("sha256").update(source).digest("hex"),
    scope:
      "Ethereum mainnet ETH/USDC/USDT and Solana mainnet SOL/USDC/USDT only. Other tokens, NFTs, and other chains are NOT assessed. Zero here is not proof that a wallet has no assets.",
    wallets: wallets.length,
    queries: results.length,
    nonzero: nonzero.length,
    errors: errors.length,
    results,
  };
  const outputPath = reportPath.replace(/\.json$/, ".wallet-balances.json");
  writeFileSync(outputPath, JSON.stringify(output, null, 2) + "\n", {
    flag: "wx",
    mode: 0o600,
  });
  console.log(
    JSON.stringify({
      outputPath,
      wallets: output.wallets,
      queries: output.queries,
      nonzero: nonzero.length,
      errors: errors.length,
      scope: output.scope,
    }),
  );
}

main().catch((error: unknown) => {
  console.error(
    "Balance inventory failed:",
    (error as { code?: string; status?: number }).code ??
      (error as { status?: number }).status ??
      "configuration error",
  );
  process.exitCode = 1;
});
