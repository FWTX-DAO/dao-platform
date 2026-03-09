import { useQuery } from "@tanstack/react-query";
import { listMembers } from "@/app/_actions/members";
import { useAuthReady } from "./useAuthReady";

export interface Member {
  id: string;
  userId: string;
  username: string;
  membershipType: string;
  status: string;
  avatarUrl?: string;
  joinedAt: string;
}

export const useMembers = () => {
  const authReady = useAuthReady();
  return useQuery({
    queryKey: ["members"],
    queryFn: () => listMembers() as unknown as Promise<Member[]>,
    enabled: authReady,
    staleTime: 1000 * 60 * 5,
  });
};
