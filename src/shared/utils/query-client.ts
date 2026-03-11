import { QueryClient } from "@tanstack/react-query";

// Create optimized query client
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data considered fresh for 30 seconds
        staleTime: 30 * 1000,
        // Keep cache for 5 minutes
        gcTime: 5 * 60 * 1000,
        // Refetch on mount if data is stale
        refetchOnMount: true,

        // Selective window focus refetch — only real-time data
        refetchOnWindowFocus: (query) => {
          const realtimeKeys = new Set(["forum", "bounties", "dashboard"]);

          for (const k of query.queryKey) {
            if (typeof k === "string" && realtimeKeys.has(k)) {
              return true;
            }
          }
          return false;
        },

        // Refetch on reconnect
        refetchOnReconnect: "always",

        // Automatic polling for real-time data
        refetchInterval: (query) => {
          if (query.state.status === "success") {
            const queryKey = query.queryKey[0];

            // Poll bounties every minute when page is active
            if (queryKey === "bounties") {
              return 60 * 1000;
            }

            // Poll forum posts every 2 minutes when page is active
            if (queryKey === "forum") {
              return 2 * 60 * 1000;
            }
          }

          return false;
        },

        // Retry configuration
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors
          if (error?.status >= 400 && error?.status < 500) {
            return false;
          }
          // Retry up to 3 times with exponential backoff
          return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        // Don't retry mutations by default
        retry: false,
        // Network mode - continue even offline and sync when back online
        networkMode: "offlineFirst",
      },
    },
  });
}
