import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getAccessToken } from '@privy-io/react-auth';
import { queryKeys } from '@shared/constants/query-keys';

export interface DirectoryMember {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  city: string | null;
  industry: string | null;
  jobTitle: string | null;
  availability: string | null;
  contributionPoints: number;
  joinedAt: string;
  username: string | null;
  avatarUrl: string | null;
}

export interface DirectoryFilters {
  city?: string;
  industry?: string;
  availability?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

const fetchDirectory = async (filters: DirectoryFilters): Promise<DirectoryMember[]> => {
  const accessToken = await getAccessToken();
  const params = new URLSearchParams();
  if (filters.city) params.set('city', filters.city);
  if (filters.industry) params.set('industry', filters.industry);
  if (filters.availability) params.set('availability', filters.availability);
  if (filters.search) params.set('search', filters.search);
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.offset) params.set('offset', String(filters.offset));
  const qs = params.toString();

  const response = await fetch(`/api/members/search${qs ? `?${qs}` : ''}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error(`Failed to fetch directory: ${response.statusText}`);
  const json = await response.json();
  return json.data ?? json;
};

export const useMemberDirectory = (filters: DirectoryFilters) => {
  return useQuery({
    queryKey: queryKeys.members.directory(filters as Record<string, unknown>),
    queryFn: () => fetchDirectory(filters),
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  });
};
