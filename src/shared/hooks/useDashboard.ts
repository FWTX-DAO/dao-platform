import { useQueries } from "@tanstack/react-query";
import { getAccessToken } from "@privy-io/react-auth";

export interface DashboardStats {
  totalUsers: number;
  totalDocuments: number;
  totalProjects: number;
  activeProjects: Array<{
    id: string;
    title: string;
    status: string;
    creator_name: string | null;
    created_at: string;
    updated_at: string;
    collaborators: number;
  }>;
  userActiveProjects: Array<{
    id: string;
    title: string;
    status: string;
    creator_name: string | null;
    creator_id: string;
    created_at: string;
    updated_at: string;
    collaborators: number;
    user_role: string;
  }>;
  latestForumPosts: Array<{
    id: string;
    title: string;
    category: string | null;
    author_name: string | null;
    created_at: string;
    reply_count: number;
    upvotes: number;
  }>;
  innovationAssetsRanking: Array<{
    id: string;
    title: string;
    bountyAmount: number | null;
    status: string | null;
    proposalCount: number;
    category: string | null;
  }>;
  latestMeetingNote: {
    id: string;
    title: string;
    date: string;
    author_name: string | null;
    notes: string;
    created_at: string;
  } | null;
}

export interface MembershipData {
  membership: {
    type: string;
    joinedAt: string;
    contributionPoints: number;
    votingPower: number;
    badges: string[];
    specialRoles: string[];
    status: string;
  };
  stats: {
    forumPosts: number;
    projects: number;
    meetingNotes: number;
    votesReceived: number;
  };
  user: {
    id: string;
    username: string | null;
    bio: string | null;
    avatarUrl: string | null;
    createdAt: string;
  };
}

const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const accessToken = await getAccessToken();
  const response = await fetch("/api/dashboard/stats", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard stats");
  }

  return response.json();
};

const fetchMembershipData = async (): Promise<MembershipData> => {
  const accessToken = await getAccessToken();
  const response = await fetch("/api/members/stats", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch membership data");
  }

  return response.json();
};

/**
 * Hook to fetch dashboard data using React Query
 * Provides automatic caching, background refetching, and error handling
 */
export const useDashboardData = () => {
  const results = useQueries({
    queries: [
      {
        queryKey: ["dashboard", "stats"],
        queryFn: fetchDashboardStats,
        staleTime: 2 * 60 * 1000, // 2 minutes - moderate update frequency
        gcTime: 10 * 60 * 1000,   // Keep in cache for 10 minutes
        refetchOnWindowFocus: true, // Refresh when user returns to tab
        retry: 2,
      },
      {
        queryKey: ["dashboard", "membership"],
        queryFn: fetchMembershipData,
        staleTime: 5 * 60 * 1000, // 5 minutes - low update frequency
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false, // User stats don't change often
        retry: 2,
      },
    ],
  });

  return {
    dashboardStats: results[0].data,
    membershipData: results[1].data,
    isLoading: results.some((r) => r.isLoading),
    isError: results.some((r) => r.isError),
    error: results.find((r) => r.error)?.error,
    refetch: () => {
      results.forEach((r) => r.refetch());
    },
  };
};
