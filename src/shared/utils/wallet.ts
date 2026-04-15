/**
 * Shared wallet selection logic.
 *
 * Client-side: import { getPreferredEthWallet, walletLabel, WALLET_CLIENT_LABELS }
 * Server-side: import { getPreferredEthWalletFromAccounts }
 *
 * Both functions implement the same rule: prefer external wallets (MetaMask, etc.)
 * over Privy embedded wallets. Falls back to the first available wallet, or null.
 */

import type { WalletWithMetadata } from "@privy-io/react-auth";

/** Labels for wallet client types, used in WalletList and Settings. */
export const WALLET_CLIENT_LABELS: Record<string, string> = {
  privy: "Embedded",
  metamask: "MetaMask",
  coinbase_wallet: "Coinbase",
  rainbow: "Rainbow",
  phantom: "Phantom",
  wallet_connect: "WalletConnect",
  solflare: "Solflare",
};

/** Human-readable label for a wallet's client type. */
export function walletLabel(wallet: WalletWithMetadata): string {
  const clientType = wallet.walletClientType;
  if (!clientType) return "External";
  return WALLET_CLIENT_LABELS[clientType] ?? "External";
}

/**
 * Client-side: pick the preferred Ethereum wallet from a Privy user's linked accounts.
 * Prefers external wallets (MetaMask, Rainbow, etc.) over embedded Privy wallets.
 * Returns null when no Ethereum wallet is linked.
 */
export function getPreferredEthWallet(
  linkedAccounts: ReadonlyArray<{ type: string; chainType?: string; walletClientType?: string; address?: string }> | undefined | null,
): WalletWithMetadata | null {
  const ethWallets = (linkedAccounts ?? []).filter(
    (a) => a.type === "wallet" && a.chainType === "ethereum",
  ) as WalletWithMetadata[];
  return (
    ethWallets.find((w) => w.walletClientType !== "privy") ??
    ethWallets[0] ??
    null
  );
}

/**
 * Server-side: pick the preferred Ethereum wallet from Privy server SDK linked accounts.
 * Same logic as getPreferredEthWallet but accepts the server-side account shape.
 * Returns { address, walletClientType } or null.
 */
export function getPreferredEthWalletFromAccounts(
  linkedAccounts: ReadonlyArray<{ type: string; chainType?: string; walletClientType?: string; address?: string }> | undefined | null,
): { address: string; walletClientType?: string } | null {
  const ethWallets = (linkedAccounts ?? []).filter(
    (a) => a.type === "wallet" && a.chainType === "ethereum",
  ) as Array<{ address: string; walletClientType?: string; type: string; chainType: string }>;
  return (
    ethWallets.find((w) => w.walletClientType !== "privy") ??
    ethWallets[0] ??
    null
  );
}
