import { useQuery } from "@tanstack/react-query";
import {
  getMyActivities as getMyActivitiesAction,
  getPlatformFeed as getPlatformFeedAction,
  getMemberActivities as getMemberActivitiesAction,
} from "@/app/_actions/activities";
import { queryKeys } from "@shared/constants/query-keys";
import { useAuthReady } from "./useAuthReady";

export interface Activity {
  id: string;
  memberId: string;
  activityType: string;
  resourceType: string | null;
  resourceId: string | null;
  metadata: string | null;
  pointsAwarded: number;
  createdAt: string;
}

export interface PlatformActivity {
  id: string;
  memberId: string;
  activityType: string;
  resourceType: string | null;
  resourceId: string | null;
  metadata: string | null;
  pointsAwarded: number;
  createdAt: string;
  username: string | null;
  avatarUrl: string | null;
}

export interface ActivityFilters {
  type?: string;
  limit?: number;
  offset?: number;
}

export const useMyActivities = (filters?: ActivityFilters) => {
  const authReady = useAuthReady();
  return useQuery({
    queryKey: [...queryKeys.activities.all(), filters] as const,
    queryFn: () =>
      getMyActivitiesAction(filters) as unknown as Promise<Activity[]>,
    enabled: authReady,
    staleTime: 60 * 1000,
  });
};

export const usePlatformFeed = (limit?: number) => {
  const authReady = useAuthReady();
  return useQuery({
    queryKey: queryKeys.activities.feed(),
    queryFn: () =>
      getPlatformFeedAction(limit) as unknown as Promise<PlatformActivity[]>,
    enabled: authReady,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
};

export const useMemberActivities = (memberId: string | null) => {
  const authReady = useAuthReady();
  return useQuery({
    queryKey: queryKeys.activities.member(memberId!),
    queryFn: () =>
      getMemberActivitiesAction(memberId!) as unknown as Promise<Activity[]>,
    enabled: authReady && !!memberId,
    staleTime: 60 * 1000,
  });
};
