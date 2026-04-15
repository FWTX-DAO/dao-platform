"use client";

import { usePrivy } from "@privy-io/react-auth";

/**
 * Returns true when the Privy SDK has initialized and the user is authenticated.
 * Use as `enabled` guard for React Query hooks that call authenticated server actions.
 *
 * This prevents queries from firing before the auth cookie is established,
 * avoiding unnecessary redirect cycles on initial page load.
 */
export function useAuthReady(): boolean {
  const { ready, authenticated } = usePrivy();
  return ready && authenticated;
}
