import { QueryClient } from "@tanstack/react-query";

// Query key factory for consistent key generation
export const queryKeys = {
  all: ["app"] as const,

  // Bounties
  bounties: {
    all: ["bounties"] as const,
    lists: () => [...queryKeys.bounties.all, "list"] as const,
    list: (filters?: any) => [...queryKeys.bounties.lists(), filters] as const,
    details: () => [...queryKeys.bounties.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.bounties.details(), id] as const,
    screening: () => [...queryKeys.bounties.all, "screening"] as const,
  },

  // Projects
  projects: {
    all: ["projects"] as const,
    lists: () => [...queryKeys.projects.all, "list"] as const,
    list: (filters?: any) => [...queryKeys.projects.lists(), filters] as const,
    details: () => [...queryKeys.projects.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
    updates: (id: string) =>
      [...queryKeys.projects.detail(id), "updates"] as const,
  },

  // Forums
  forums: {
    all: ["forums"] as const,
    posts: () => [...queryKeys.forums.all, "posts"] as const,
    post: (id: string) => [...queryKeys.forums.posts(), id] as const,
    replies: (id: string) => [...queryKeys.forums.post(id), "replies"] as const,
  },

  // Members
  members: {
    all: ["members"] as const,
    lists: () => [...queryKeys.members.all, "list"] as const,
    stats: () => [...queryKeys.members.all, "stats"] as const,
  },

  // Meeting Notes
  meetingNotes: {
    all: ["meetingNotes"] as const,
    lists: () => [...queryKeys.meetingNotes.all, "list"] as const,
    detail: (id: string) => [...queryKeys.meetingNotes.all, id] as const,
  },

  // Documents
  documents: {
    all: ["documents"] as const,
    lists: () => [...queryKeys.documents.all, "list"] as const,
    detail: (id: string) => [...queryKeys.documents.all, id] as const,
  },

  // User
  user: {
    all: ["user"] as const,
    profile: () => [...queryKeys.user.all, "profile"] as const,
  },
};

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

        // OPTIMIZED: Selective window focus refetch
        // Only refetch real-time data when user returns to tab
        refetchOnWindowFocus: (query) => {
          const realtimeKeys = [
            'forum-posts',
            'forum-replies',
            'bounties',
            'dashboard'
          ];

          return realtimeKeys.some(key =>
            query.queryKey.some(k =>
              typeof k === 'string' && k.includes(key)
            )
          );
        },

        // Refetch on reconnect
        refetchOnReconnect: "always",

        // OPTIMIZED: Automatic polling for real-time data
        // Poll specific queries when tab is active
        refetchInterval: (query) => {
          if (query.state.status === 'success') {
            const queryKey = query.queryKey[0];

            // Poll bounties every minute when page is active
            if (queryKey === 'bounties') {
              return 60 * 1000; // 1 minute
            }

            // Poll forum posts every 2 minutes when page is active
            if (queryKey === 'forum-posts') {
              return 2 * 60 * 1000; // 2 minutes
            }
          }

          return false; // No polling for other queries
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

// Prefetch utilities
export const prefetchUtils = {
  // Prefetch bounties list
  prefetchBounties: async (queryClient: QueryClient, filters?: any) => {
    const { getAccessToken } = await import("@privy-io/react-auth");
    const accessToken = await getAccessToken();

    return queryClient.prefetchQuery({
      queryKey: queryKeys.bounties.list(filters),
      queryFn: async () => {
        const params = new URLSearchParams();
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, value.toString());
          });
        }

        const response = await fetch(`/api/bounties?${params.toString()}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!response.ok) throw new Error("Failed to fetch bounties");
        return response.json();
      },
      staleTime: 30 * 1000,
    });
  },

  // Prefetch bounty details
  prefetchBountyDetails: async (queryClient: QueryClient, id: string) => {
    const { getAccessToken } = await import("@privy-io/react-auth");
    const accessToken = await getAccessToken();

    return queryClient.prefetchQuery({
      queryKey: queryKeys.bounties.detail(id),
      queryFn: async () => {
        const response = await fetch(`/api/bounties/${id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!response.ok) throw new Error("Failed to fetch bounty");
        return response.json();
      },
      staleTime: 30 * 1000,
    });
  },

  // Prefetch projects
  prefetchProjects: async (queryClient: QueryClient) => {
    const { getAccessToken } = await import("@privy-io/react-auth");
    const accessToken = await getAccessToken();

    return queryClient.prefetchQuery({
      queryKey: queryKeys.projects.lists(),
      queryFn: async () => {
        const response = await fetch("/api/projects", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!response.ok) throw new Error("Failed to fetch projects");
        return response.json();
      },
      staleTime: 60 * 1000,
    });
  },

  // Prefetch dashboard-related data (forums, projects, bounties)
  prefetchDashboardRelated: async (queryClient: QueryClient) => {
    const { getAccessToken } = await import("@privy-io/react-auth");
    const accessToken = await getAccessToken();

    // Run all prefetches in parallel - use allSettled to not fail if one fails
    return Promise.allSettled([
      // Prefetch recent forum posts
      queryClient.prefetchQuery({
        queryKey: queryKeys.forums.posts(),
        queryFn: async () => {
          const response = await fetch("/api/forums/posts", {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (!response.ok) throw new Error("Failed to fetch");
          return response.json();
        },
        staleTime: 30 * 1000,
      }),

      // Prefetch projects list
      queryClient.prefetchQuery({
        queryKey: queryKeys.projects.lists(),
        queryFn: async () => {
          const response = await fetch("/api/projects", {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (!response.ok) throw new Error("Failed to fetch");
          return response.json();
        },
        staleTime: 60 * 1000,
      }),

      // Prefetch bounties list
      queryClient.prefetchQuery({
        queryKey: queryKeys.bounties.lists(),
        queryFn: async () => {
          const response = await fetch("/api/bounties", {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (!response.ok) throw new Error("Failed to fetch");
          return response.json();
        },
        staleTime: 60 * 1000,
      }),
    ]);
  },
};

// Optimistic update helpers
export const optimisticHelpers = {
  // Add item to list optimistically
  addToList: <T extends { id: string }>(
    oldData: T[] | undefined,
    newItem: T,
  ): T[] => {
    return [newItem, ...(oldData || [])];
  },

  // Update item in list optimistically
  updateInList: <T extends { id: string }>(
    oldData: T[] | undefined,
    updatedItem: T,
  ): T[] => {
    if (!oldData) return [updatedItem];
    return oldData.map((item) =>
      item.id === updatedItem.id ? updatedItem : item,
    );
  },

  // Remove item from list optimistically
  removeFromList: <T extends { id: string }>(
    oldData: T[] | undefined,
    itemId: string,
  ): T[] => {
    if (!oldData) return [];
    return oldData.filter((item) => item.id !== itemId);
  },
};

// Cache invalidation patterns
export const invalidationPatterns = {
  // Invalidate all queries for a resource
  invalidateResource: (
    queryClient: QueryClient,
    resource:
      | "bounties"
      | "projects"
      | "forums"
      | "members"
      | "meetingNotes"
      | "documents"
      | "user",
  ) => {
    return queryClient.invalidateQueries({
      queryKey: queryKeys[resource].all,
    });
  },

  // Invalidate specific query
  invalidateSpecific: (
    queryClient: QueryClient,
    queryKey: readonly unknown[],
  ) => {
    return queryClient.invalidateQueries({ queryKey });
  },

  // Smart invalidation based on mutation type
  smartInvalidate: async (
    queryClient: QueryClient,
    resource:
      | "bounties"
      | "projects"
      | "forums"
      | "members"
      | "meetingNotes"
      | "documents",
    action: "create" | "update" | "delete",
    id?: string,
  ) => {
    const promises = [];
    const resourceKeys = queryKeys[resource];

    // Always invalidate lists when creating or deleting
    if (action === "create" || action === "delete") {
      if ("lists" in resourceKeys) {
        promises.push(
          queryClient.invalidateQueries({
            queryKey: resourceKeys.lists(),
          }),
        );
      }
    }

    // Invalidate specific item on update or delete
    if ((action === "update" || action === "delete") && id) {
      if ("detail" in resourceKeys) {
        promises.push(
          queryClient.invalidateQueries({
            queryKey: resourceKeys.detail(id),
          }),
        );
      }
    }

    return Promise.all(promises);
  },
};
