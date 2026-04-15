"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import { PrivyProvider, usePrivy } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { createQueryClient } from "@utils/query-client";
import { SidebarProvider } from "@shared/contexts/SidebarContext";

const solanaConnectors = toSolanaWalletConnectors({
  shouldAutoConnect: false,
});

const ReactQueryDevtools = dynamic(
  () =>
    import("@tanstack/react-query-devtools").then(
      (mod) => mod.ReactQueryDevtools,
    ),
  { ssr: false },
);

/**
 * Watches for auth state transitions from authenticated → unauthenticated.
 * When detected, clears the React Query cache and redirects to landing.
 */
function AuthCleanup() {
  const { ready, authenticated } = usePrivy();
  const queryClient = useQueryClient();
  const router = useRouter();
  const wasAuthenticated = useRef(false);

  useEffect(() => {
    if (!ready) return;

    if (authenticated) {
      wasAuthenticated.current = true;
    } else if (wasAuthenticated.current) {
      // Transitioned from authenticated → unauthenticated
      wasAuthenticated.current = false;
      queryClient.clear();
      router.replace("/");
    }
  }, [ready, authenticated, queryClient, router]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <PrivyProvider
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
        config={{
          embeddedWallets: {
            ethereum: { createOnLogin: "all-users" },
            solana: { createOnLogin: "all-users" },
          },
          appearance: {
            walletList: [
              "metamask",
              "phantom",
              "coinbase_wallet",
              "rainbow",
              "detected_ethereum_wallets",
              "detected_solana_wallets",
              "wallet_connect",
            ],
            walletChainType: "ethereum-and-solana",
          },
          externalWallets: {
            solana: { connectors: solanaConnectors },
          },
        }}
      >
        <AuthCleanup />
        <SidebarProvider>
          {children}
          {process.env.NODE_ENV === "development" && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </SidebarProvider>
      </PrivyProvider>
    </QueryClientProvider>
  );
}
