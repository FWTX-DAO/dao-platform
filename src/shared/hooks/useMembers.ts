import { useQuery } from "@tanstack/react-query";
import { listMembers } from "@/app/_actions/members";

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
  return useQuery({
    queryKey: ["members"],
    queryFn: () => listMembers() as Promise<Member[]>,
    staleTime: 1000 * 60 * 5,
  });
};
