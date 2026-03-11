import { QueryClient, dehydrate } from "@tanstack/react-query";

export function createPrefetchClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
      },
    },
  });
}

export { dehydrate };
