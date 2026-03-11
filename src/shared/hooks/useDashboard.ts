import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "@/app/_actions/dashboard";
import { getMemberStats } from "@/app/_actions/members";
import { queryKeys } from "@shared/constants/query-keys";
import { useAuthReady } from "./useAuthReady";

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

export const useDashboardData = () => {
  const authReady = useAuthReady();

  const statsQuery = useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: () => getDashboardStats() as unknown as Promise<DashboardStats>,
    enabled: authReady,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const membershipQuery = useQuery({
    queryKey: queryKeys.dashboard.membership(),
    queryFn: () => getMemberStats() as unknown as Promise<MembershipData>,
    enabled: authReady,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    dashboardStats: statsQuery.data,
    membershipData: membershipQuery.data,
    isLoading: statsQuery.isLoading || membershipQuery.isLoading,
    isError: statsQuery.isError || membershipQuery.isError,
    error: statsQuery.error || membershipQuery.error,
    refetch: () => {
      statsQuery.refetch();
      membershipQuery.refetch();
    },
  };
};
