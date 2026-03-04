import { useQuery } from '@tanstack/react-query';
import { getAccessToken } from '@privy-io/react-auth';
import { queryKeys } from '@shared/constants/query-keys';

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

const fetchMyActivities = async (filters?: ActivityFilters): Promise<Activity[]> => {
  const accessToken = await getAccessToken();
  const params = new URLSearchParams();
  if (filters?.type) params.set('type', filters.type);
  if (filters?.limit) params.set('limit', String(filters.limit));
  if (filters?.offset) params.set('offset', String(filters.offset));
  const qs = params.toString();

  const response = await fetch(`/api/activities${qs ? `?${qs}` : ''}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error(`Failed to fetch activities: ${response.statusText}`);
  const json = await response.json();
  return json.data ?? json;
};

const fetchPlatformFeed = async (limit?: number): Promise<PlatformActivity[]> => {
  const accessToken = await getAccessToken();
  const qs = limit ? `?limit=${limit}` : '';
  const response = await fetch(`/api/activities/feed${qs}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error(`Failed to fetch feed: ${response.statusText}`);
  const json = await response.json();
  return json.data ?? json;
};

const fetchMemberActivities = async (memberId: string): Promise<Activity[]> => {
  const accessToken = await getAccessToken();
  const response = await fetch(`/api/members/${memberId}/activities`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error(`Failed to fetch member activities: ${response.statusText}`);
  const json = await response.json();
  return json.data ?? json;
};

export const useMyActivities = (filters?: ActivityFilters) => {
  return useQuery({
    queryKey: [...queryKeys.activities.all(), filters] as const,
    queryFn: () => fetchMyActivities(filters),
    staleTime: 60 * 1000,
  });
};

export const usePlatformFeed = (limit?: number) => {
  return useQuery({
    queryKey: queryKeys.activities.feed(),
    queryFn: () => fetchPlatformFeed(limit),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
};

export const useMemberActivities = (memberId: string | null) => {
  return useQuery({
    queryKey: queryKeys.activities.member(memberId!),
    queryFn: () => fetchMemberActivities(memberId!),
    enabled: !!memberId,
    staleTime: 60 * 1000,
  });
};
