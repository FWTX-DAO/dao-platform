import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { searchMembers } from "@/app/_actions/members";
import { queryKeys } from "@shared/constants/query-keys";
import { useAuthReady } from "./useAuthReady";

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

export const useMemberDirectory = (filters: DirectoryFilters) => {
  const authReady = useAuthReady();
  return useQuery({
    queryKey: queryKeys.members.directory(filters as Record<string, unknown>),
    queryFn: () =>
      searchMembers(filters) as unknown as Promise<DirectoryMember[]>,
    enabled: authReady,
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  });
};
